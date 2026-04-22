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

// Per-tracker topic arrays — mirrors TRACKER_TOPICS in app/lib/velocity.ts.
// Used both for activity spike counting and high-sig story routing.
const TRACKER_TOPICS: Record<string, string[]> = {
  isa: ["dsm"],
  bbnj: ["bbnj", "high-seas"],
  iuu: ["iuu"],
  "30x30": ["mpa", "30x30"],
  "blue-finance": ["blue-finance", "esg"],
  plastics: ["plastics", "pollution"],
  "imo-shipping": ["shipping"],
  "offshore-wind": ["offshore-wind"],
  "cites-marine": ["cites", "sharks", "shark", "rays", "guitarfish"],
  "wto-fisheries": ["wto-fisheries", "fisheries-subsidies", "subsidies"],
};

// Reverse map: topic → tracker slug (for high-sig story routing)
const TOPIC_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(TRACKER_TOPICS).flatMap(([slug, topics]) =>
    topics.map((t) => [t, slug])
  )
);

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
// Procedural events blocklist — these don't warrant subscriber signals
const PROCEDURAL_KEYWORDS = [
  "workshop",
  "informal",
  "ad-hoc",
  "ad hoc",
  "expert group",
  "technical meeting",
  "advisory group",
  "working group",
  "spanish-speaking",
  "french-speaking",
  "arabic-speaking",
  "capacity-building",
  "capacity building",
  "side event",
  "informal consultation",
  "subsidiary body",
];

const isProcedural = (eventName: string): boolean => {
  const lower = eventName.toLowerCase();
  return PROCEDURAL_KEYWORDS.some((kw) => lower.includes(kw));
};
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

      // Filter procedural events that don't warrant subscriber signals
      if (isProcedural(event.title)) continue;

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

// ─── 3. Activity Spike Signals ───────────────────────────────────────────────
// Per-tracker story volume spike: compares ingestion count in the current 6h
// window vs the previous 6h window. Emits when volume doubles AND count >= 3.
// Uses the same topic-to-tracker mapping as the velocity score calculator.
// Stored as signal_type='convergence_spike' (no schema change needed).
// Deduped: one signal per tracker per 3-hour window.

export async function generateConvergenceSignals(): Promise<number> {
  let inserted = 0;

  const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const twelveHoursAgo = new Date(Date.now() - 12 * 3600 * 1000).toISOString();

  for (const [slug, topics] of Object.entries(TRACKER_TOPICS)) {
    try {
      // Count stories ingested per tracker in current and previous 6h windows
      const [{ count: currentCount }, { count: prevCount }] = await Promise.all([
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .in("topic", topics)
          .gte("fetched_at", sixHoursAgo),
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .in("topic", topics)
          .gte("fetched_at", twelveHoursAgo)
          .lt("fetched_at", sixHoursAgo),
      ]);

      const current = currentCount ?? 0;
      const previous = prevCount ?? 0;

      // Spike condition: volume doubled AND at least 3 stories in current window
      if (current < 3 || current < previous * 2) continue;

      // Dedup: no activity spike for this tracker in the last 3h
      const { data: existing } = await supabase
        .from("signal_events")
        .select("id")
        .eq("signal_type", "convergence_spike")
        .eq("tracker_slug", slug)
        .gte("created_at", threeHoursAgo)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const trackerName = DOMAIN_NAMES[slug] ?? slug;
      const ratio = previous > 0 ? current / previous : current;
      const importance = Math.min(
        8.0,
        Math.round((6.5 + (ratio - 1) * 0.5) * 10) / 10
      );

      await supabase.from("signal_events").insert({
        signal_type: "convergence_spike",
        tracker_slug: slug,
        headline: `${trackerName} coverage accelerating`,
        body: `${current} stories in last 6 hours (up from ${previous} in the prior 6 hours).`,
        importance,
        action_label: "View tracker",
        action_url: `/platform/tracker/${slug}`,
        metadata: {
          outlet_count: current,
          previous_count: previous,
          ratio: Math.round(ratio * 10) / 10,
          window_hours: 6,
        },
        expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      });
      inserted++;
    } catch (err) {
      console.error(
        `[signal-gen] convergence_spike (activity spike) failed for ${slug}:`,
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
    .gte("fetched_at", threeHoursAgo)
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
