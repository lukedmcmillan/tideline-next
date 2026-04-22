import { createClient } from "@supabase/supabase-js";
import { alertBand, DOMAIN_NAMES } from "@/app/lib/tracker-metadata";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TRACKER_SLUGS = Object.keys(DOMAIN_NAMES);

// governance_bodies.abbreviation → tracker slug
const BODY_TO_SLUG: Record<string, string> = {
  IMO: "imo-shipping",
  ISA: "isa",
  IWC: "iuu",
  CBD: "30x30",
  OSPAR: "30x30",
  CCAMLR: "iuu",
  ICCAT: "iuu",
  CITES: "cites-marine",
  UNOC: "bbnj",
  "WTO-Fish": "wto-fisheries",
};

// stories.topic → tracker slug (best-effort; unmatched topics are skipped)
const TOPIC_TO_SLUG: Record<string, string> = {
  "deep-sea-mining": "isa",
  isa: "isa",
  bbnj: "bbnj",
  "high-seas": "bbnj",
  "ocean-governance": "bbnj",
  iuu: "iuu",
  "illegal-fishing": "iuu",
  fisheries: "iuu",
  plastics: "plastics",
  "plastic-pollution": "plastics",
  "30x30": "30x30",
  "marine-protected-areas": "30x30",
  mpas: "30x30",
  "imo-shipping": "imo-shipping",
  shipping: "imo-shipping",
  maritime: "imo-shipping",
  "offshore-wind": "offshore-wind",
  "renewable-energy": "offshore-wind",
  "cites-marine": "cites-marine",
  cites: "cites-marine",
  "blue-finance": "blue-finance",
  "ocean-finance": "blue-finance",
  "wto-fisheries": "wto-fisheries",
  "fisheries-subsidies": "wto-fisheries",
};

const COUNTDOWN_IMPORTANCE: Record<number, number> = {
  3: 9.5,
  7: 9.0,
  14: 8.0,
  30: 7.0,
};

// ─── 1. Band Crossing Signals ─────────────────────────────────────────────────
// Queries the last two velocity scores per tracker; emits a signal when the
// band changes. Deduped: one signal per tracker per 48-hour window.

export async function generateBandCrossingSignals(): Promise<number> {
  let inserted = 0;

  for (const slug of TRACKER_SLUGS) {
    try {
      const { data: rows } = await supabase
        .from("velocity_scores")
        .select("score, momentum_direction, calculated_at")
        .eq("tracker_slug", slug)
        .order("calculated_at", { ascending: false })
        .limit(2);

      // Need at least two data points to detect a crossing
      if (!rows || rows.length < 2) continue;

      const current = rows[0];
      const previous = rows[1];
      const currentBand = alertBand(current.score, slug);
      const previousBand = alertBand(previous.score, slug);

      if (currentBand === previousBand) continue;

      // Dedup: no band_crossing for this slug in last 48h
      const { data: existing } = await supabase
        .from("signal_events")
        .select("id")
        .eq("signal_type", "band_crossing")
        .eq("tracker_slug", slug)
        .gte("created_at", new Date(Date.now() - 48 * 3600 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      const trackerName = DOMAIN_NAMES[slug] ?? slug;
      const toScore = Math.round(current.score * 10) / 10;
      const fromScore = Math.round(previous.score * 10) / 10;
      const direction = current.momentum_direction ?? "stable";

      await supabase.from("signal_events").insert({
        signal_type: "band_crossing",
        tracker_slug: slug,
        headline: `${trackerName} → ${currentBand}`,
        body: `${toScore} (was ${fromScore}) · ${direction}`,
        importance: 9.0,
        action_label: "View tracker",
        action_url: `/platform/tracker/${slug}`,
        metadata: {
          from_score: fromScore,
          to_score: toScore,
          from_band: previousBand,
          to_band: currentBand,
          momentum: direction,
        },
        expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      });
      inserted++;
    } catch (err) {
      console.error(`[signal-gen] band_crossing failed for ${slug}:`, err);
    }
  }

  return inserted;
}

// ─── 2. Countdown Threshold Signals ──────────────────────────────────────────
// Queries governance_events in the next 90 days. For each event, finds the
// most precise threshold that applies (3/7/14/30 days). Deduped by
// source_event_id + threshold. Capped to one signal per tracker per run
// (most imminent qualifying event wins) to prevent procedural-heavy bodies
// like CBD from dominating the feed.

const COUNTDOWN_HEADLINE: Record<number, string> = {
  3: "Event imminent",
  7: "Event approaching",
  14: "Upcoming",
  30: "On calendar",
};

export async function generateCountdownSignals(): Promise<number> {
  let inserted = 0;

  const now = new Date();
  const ninetyDaysOut = new Date(Date.now() + 90 * 24 * 3600 * 1000);

  const { data: events } = await supabase
    .from("governance_events")
    .select("id, title, starts_at, location, governance_bodies(abbreviation)")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", ninetyDaysOut.toISOString())
    .order("starts_at", { ascending: true });

  if (!events || events.length === 0) return 0;

  // Phase 1: collect all candidates that pass threshold + dedup checks
  interface Candidate {
    event: (typeof events)[0];
    threshold: number;
    daysUntil: number;
    trackerSlug: string;
  }
  const candidates: Candidate[] = [];

  for (const event of events) {
    try {
      const startsAt = new Date(event.starts_at);
      const daysUntil = Math.floor(
        (startsAt.getTime() - now.getTime()) / (24 * 3600 * 1000)
      );

      // Find the single most precise applicable threshold
      let threshold: number | null = null;
      if (daysUntil <= 3) threshold = 3;
      else if (daysUntil <= 7) threshold = 7;
      else if (daysUntil <= 14) threshold = 14;
      else if (daysUntil <= 30) threshold = 30;

      if (threshold === null) continue;

      // Dedup: already emitted for this event at this exact threshold
      const { data: existing } = await supabase
        .from("signal_events")
        .select("id")
        .eq("signal_type", "countdown_threshold")
        .eq("source_event_id", event.id)
        .contains("metadata", { threshold })
        .limit(1);

      if (existing && existing.length > 0) continue;

      const bodyAbbr =
        (event.governance_bodies as { abbreviation?: string } | null)
          ?.abbreviation ?? "";
      const trackerSlug = BODY_TO_SLUG[bodyAbbr] ?? "bbnj";

      candidates.push({ event, threshold, daysUntil, trackerSlug });
    } catch (err) {
      console.error(
        `[signal-gen] countdown candidate check failed for event ${event.id}:`,
        err
      );
    }
  }

  // Phase 2: keep only the most imminent candidate per tracker
  const bestPerTracker = new Map<string, Candidate>();
  for (const c of candidates) {
    const existing = bestPerTracker.get(c.trackerSlug);
    if (!existing || c.daysUntil < existing.daysUntil) {
      bestPerTracker.set(c.trackerSlug, c);
    }
  }

  // Phase 3: insert one signal per tracker
  for (const { event, threshold, daysUntil, trackerSlug } of bestPerTracker.values()) {
    try {
      const startsAt = new Date(event.starts_at);
      const dateStr = startsAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const location = event.location ? ` · ${event.location}` : "";
      const trackerName = DOMAIN_NAMES[trackerSlug] ?? trackerSlug;
      // 4h expiry for 3-day threshold, 12h for all others
      const expiryHours = threshold <= 3 ? 4 : 12;

      await supabase.from("signal_events").insert({
        signal_type: "countdown_threshold",
        tracker_slug: trackerSlug,
        headline: `${COUNTDOWN_HEADLINE[threshold]} · ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        body: `${event.title} · ${trackerName} · ${dateStr}${location}`,
        importance: COUNTDOWN_IMPORTANCE[threshold],
        action_label: "View event",
        action_url: `/platform/tracker/${trackerSlug}`,
        source_event_id: event.id,
        metadata: {
          threshold,
          days_until: daysUntil,
          event_name: event.title,
        },
        expires_at: new Date(Date.now() + expiryHours * 3600 * 1000).toISOString(),
      });
      inserted++;
    } catch (err) {
      console.error(
        `[signal-gen] countdown_threshold insert failed for event ${event.id}:`,
        err
      );
    }
  }

  return inserted;
}

// ─── 3. Convergence Spike Signals ────────────────────────────────────────────
// Compares source count per topic in the current 6h window vs the prior 6h
// window. Emits when a topic gains ≥2 new outlets and has ≥3 total.
// Deduped: one signal per tracker per 6-hour window.

export async function generateConvergenceSignals(): Promise<number> {
  let inserted = 0;

  const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const twelveHoursAgo = new Date(Date.now() - 12 * 3600 * 1000).toISOString();

  const [{ data: currentStories }, { data: previousStories }] =
    await Promise.all([
      supabase
        .from("stories")
        .select("topic, source_name")
        .gte("created_at", sixHoursAgo),
      supabase
        .from("stories")
        .select("topic, source_name")
        .gte("created_at", twelveHoursAgo)
        .lt("created_at", sixHoursAgo),
    ]);

  if (!currentStories || currentStories.length === 0) return 0;

  // Group by topic → set of distinct source names
  function countSources(
    rows: { topic: string | null; source_name: string }[]
  ): Record<string, number> {
    const map: Record<string, Set<string>> = {};
    for (const r of rows) {
      if (!r.topic) continue;
      if (!map[r.topic]) map[r.topic] = new Set();
      map[r.topic].add(r.source_name);
    }
    return Object.fromEntries(
      Object.entries(map).map(([t, s]) => [t, s.size])
    );
  }

  const current = countSources(currentStories);
  const previous = countSources(previousStories ?? []);

  for (const [topic, currentCount] of Object.entries(current)) {
    const prevCount = previous[topic] ?? 0;
    const delta = currentCount - prevCount;

    if (currentCount < 3 || delta < 2) continue;

    const trackerSlug = TOPIC_TO_SLUG[topic] ?? null;
    if (!trackerSlug) continue;

    // Dedup: no convergence_spike for this tracker in the current 6h window
    const { data: existing } = await supabase
      .from("signal_events")
      .select("id")
      .eq("signal_type", "convergence_spike")
      .eq("tracker_slug", trackerSlug)
      .gte("created_at", sixHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const trackerName = DOMAIN_NAMES[trackerSlug] ?? topic;
    // Importance scales with outlet count: 6.5 at 3 outlets → 8.0 at ~10+
    const importance = Math.min(8.0, Math.round((6.5 + delta * 0.2) * 10) / 10);

    try {
      await supabase.from("signal_events").insert({
        signal_type: "convergence_spike",
        tracker_slug: trackerSlug,
        headline: `${currentCount} outlets covering ${trackerName}`,
        body: `Tideline sees this: ${currentCount} sources in last 6 hours${prevCount > 0 ? ` (up from ${prevCount})` : ""}.`,
        importance,
        action_label: "Read stories",
        action_url: "/platform/feed",
        metadata: {
          topic,
          outlet_count: currentCount,
          previous_count: prevCount,
          delta,
          window_hours: 6,
        },
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      });
      inserted++;
    } catch (err) {
      console.error(
        `[signal-gen] convergence_spike failed for topic ${topic}:`,
        err
      );
    }
  }

  return inserted;
}

// ─── 4. High-Significance Story Signals ──────────────────────────────────────
// Picks up stories with significance_score ≥ 8 ingested in the last 3 hours.
// Deduped by source_story_id so each story generates at most one signal.

export async function generateHighSigStorySignals(): Promise<number> {
  let inserted = 0;

  const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, title, topic, source_name, link, short_summary, description, significance_score"
    )
    .gte("significance_score", 8)
    .gte("created_at", threeHoursAgo)
    .order("significance_score", { ascending: false })
    .limit(20);

  if (!stories || stories.length === 0) return 0;

  for (const story of stories) {
    const trackerSlug = story.topic ? TOPIC_TO_SLUG[story.topic] ?? null : null;
    if (!trackerSlug) continue;

    // Dedup: one signal per story
    const { data: existing } = await supabase
      .from("signal_events")
      .select("id")
      .eq("signal_type", "high_sig_story")
      .eq("source_story_id", story.id)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const headline =
      story.title.length > 80 ? story.title.slice(0, 79) + "…" : story.title;

    const bodyText = story.short_summary
      ? story.short_summary.slice(0, 200)
      : (story.description ?? "").slice(0, 140);

    // Skip stories with no usable body text
    if (!bodyText) continue;

    try {
      await supabase.from("signal_events").insert({
        signal_type: "high_sig_story",
        tracker_slug: trackerSlug,
        headline,
        body: bodyText,
        importance: Math.min(10, story.significance_score ?? 8),
        action_label: "Read story",
        action_url: story.link,
        source_story_id: story.id,
        metadata: {
          significance_score: story.significance_score,
          source: story.source_name,
        },
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });
      inserted++;
    } catch (err) {
      console.error(
        `[signal-gen] high_sig_story failed for story ${story.id}:`,
        err
      );
    }
  }

  return inserted;
}

// ─── Master function ──────────────────────────────────────────────────────────
// Called at the end of each scraper run. Each generator is independently
// try/caught — one failing does not block the others.

export async function runSignalGeneration(): Promise<{
  bandCrossings: number;
  countdowns: number;
  convergence: number;
  stories: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let bandCrossings = 0;
  let countdowns = 0;
  let convergence = 0;
  let stories = 0;

  try {
    bandCrossings = await generateBandCrossingSignals();
  } catch (err) {
    errors.push(`band_crossing: ${String(err)}`);
  }

  try {
    countdowns = await generateCountdownSignals();
  } catch (err) {
    errors.push(`countdown: ${String(err)}`);
  }

  try {
    convergence = await generateConvergenceSignals();
  } catch (err) {
    errors.push(`convergence: ${String(err)}`);
  }

  try {
    stories = await generateHighSigStorySignals();
  } catch (err) {
    errors.push(`high_sig_story: ${String(err)}`);
  }

  const result = { bandCrossings, countdowns, convergence, stories, errors };
  console.log("[signal-gen]", JSON.stringify(result));
  return result;
}
