import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { DOMAIN_NAMES, alertBand } from "@/app/lib/tracker-metadata";
import type { RevealData } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SLUGS = Object.keys(DOMAIN_NAMES);

function buildHeader(since: Date, now: Date): string {
  const hoursSince = (now.getTime() - since.getTime()) / 3_600_000;
  const hour = now.getHours();

  if (hoursSince > 8) {
    return `While you were away · ${Math.round(hoursSince)}h`;
  }

  const sameDay = since.toDateString() === now.toDateString();
  if (sameDay) {
    const sinceFormatted = since
      .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
      .toLowerCase();
    if (hour < 11) return `This morning · since ${sinceFormatted}`;
    if (hour < 14) return "Midday pulse";
    if (hour < 17) return "This afternoon";
    if (hour < 21) return "Today so far";
    return "Quiet night · monitoring continues";
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (since.toDateString() === yesterday.toDateString()) {
    return `Since yesterday · ${Math.round(hoursSince)}h`;
  }

  return `While you were away · ${Math.round(hoursSince)}h`;
}

function buildSummary(
  activity: RevealData["activity"],
  isQuiet: boolean,
  hour: number,
  sinceFormatted: string,
): string {
  if (isQuiet) {
    if (hour >= 21 || hour < 6) {
      return `No new activity in your tracked domains since ${sinceFormatted}. Overnight scrapers running — next summary at 7am.`;
    }
    return `No new activity in your tracked domains since ${sinceFormatted}. Monitoring continues.`;
  }

  const parts: string[] = [];

  // Priority 1: Band crossing — rare, consequential, lead with it
  if (activity.band_crossings.length > 0) {
    const bc = activity.band_crossings[0];
    parts.push(`${bc.tracker} crossed from ${bc.from_band} to ${bc.to_band}.`);
  } else if (activity.score_moves.length > 0) {
    // Priority 2: Score move — lead if no band crossing
    const sm = activity.score_moves[0];
    const dir =
      sm.direction === "accelerating" ? "accelerating"
      : sm.direction === "decelerating" ? "decelerating"
      : "stable";
    parts.push(`${sm.tracker} shifted ${sm.from.toFixed(1)} → ${sm.to.toFixed(1)} (${dir}).`);
  }

  // Priority 3: Countdown — backbone, always include nearest event
  if (activity.countdown_deltas.length > 0) {
    const cd = activity.countdown_deltas[0];
    parts.push(`${cd.event} is ${cd.days_until} days away.`);
  }

  // Priority 4: New stories in tracked domains — intra-day flavour
  if (activity.new_stories_in_tracked_domains > 0 && parts.length < 3) {
    const n = activity.new_stories_in_tracked_domains;
    parts.push(`${n} new ${n === 1 ? "story" : "stories"} published in your tracked domains.`);
  }

  // Priority 5: Document count — supporting metric only
  if (parts.length < 3 && activity.documents_processed > 0) {
    parts.push(`Tideline processed ${activity.documents_processed} documents in this window.`);
  }

  return parts.join(" ") || "Monitoring active across all 10 tracked domains.";
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Read last_dashboard_view
  const { data: user } = await supabase
    .from("users")
    .select("last_dashboard_view")
    .eq("email", email)
    .maybeSingle();

  const rawSince = user?.last_dashboard_view ? new Date(user.last_dashboard_view) : null;
  const maxWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since =
    !rawSince || rawSince < maxWindow
      ? new Date(now.getTime() - 15 * 60 * 60 * 1000)
      : rawSince;

  const sinceISO = since.toISOString();
  const hoursSince = (now.getTime() - since.getTime()) / 3_600_000;

  // All stories published in the window
  const { data: windowStories } = await supabase
    .from("stories")
    .select("topic")
    .gte("published_at", sinceISO);

  const docCount = windowStories?.length ?? 0;
  const newStoriesInDomains = (windowStories ?? []).filter(s =>
    SLUGS.includes(s.topic)
  ).length;

  // Score moves + band crossings (Pulse Scores update weekly — will be empty for intra-day)
  const scoreMoves: RevealData["activity"]["score_moves"] = [];
  const bandCrossings: RevealData["activity"]["band_crossings"] = [];

  for (const slug of SLUGS) {
    const { data: latest } = await supabase
      .from("velocity_scores")
      .select("score, momentum_direction")
      .eq("tracker_slug", slug)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: prior } = await supabase
      .from("velocity_scores")
      .select("score")
      .eq("tracker_slug", slug)
      .lte("calculated_at", sinceISO)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest || !prior) continue;

    const delta = latest.score - prior.score;
    if (Math.abs(delta) >= 0.5) {
      scoreMoves.push({
        tracker: DOMAIN_NAMES[slug] ?? slug,
        from: Math.round(prior.score * 10) / 10,
        to: Math.round(latest.score * 10) / 10,
        direction: latest.momentum_direction ?? "stable",
      });

      const fromBand = alertBand(prior.score, slug);
      const toBand = alertBand(latest.score, slug);
      if (fromBand !== toBand) {
        bandCrossings.push({
          tracker: DOMAIN_NAMES[slug] ?? slug,
          from_band: fromBand,
          to_band: toBand,
        });
      }
    }
  }

  // Sort score moves by magnitude (largest first)
  scoreMoves.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));

  // Upcoming governance events — countdown spine
  const { data: upcomingEvents } = await supabase
    .from("governance_events")
    .select("title, starts_at")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  const countdownDeltas: RevealData["activity"]["countdown_deltas"] = (upcomingEvents ?? [])
    .map(e => {
      const daysUntil = Math.ceil(
        (new Date(e.starts_at).getTime() - now.getTime()) / 86_400_000,
      );
      const daysUntilAtSince = Math.ceil(
        (new Date(e.starts_at).getTime() - since.getTime()) / 86_400_000,
      );
      return {
        event: e.title,
        days_until: daysUntil,
        days_closer: daysUntilAtSince - daysUntil,
      };
    })
    .filter(e => e.days_until > 0);

  const activity: RevealData["activity"] = {
    documents_processed: docCount,
    new_stories_in_tracked_domains: newStoriesInDomains,
    score_moves: scoreMoves,
    band_crossings: bandCrossings,
    countdown_deltas: countdownDeltas,
  };

  const isQuiet =
    activity.documents_processed < 5 &&
    activity.new_stories_in_tracked_domains < 2 &&
    activity.score_moves.length === 0 &&
    activity.band_crossings.length === 0 &&
    activity.countdown_deltas.length === 0;

  const hour = now.getHours();
  const sinceFormatted = since
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();

  const header = buildHeader(since, now);
  const summary = buildSummary(activity, isQuiet, hour, sinceFormatted);

  // Update last_dashboard_view — fire and forget, does not block response
  void supabase
    .from("users")
    .update({ last_dashboard_view: now.toISOString() })
    .eq("email", email);

  return NextResponse.json({
    header,
    summary,
    window: {
      since: sinceISO,
      until: now.toISOString(),
      hours: Math.round(hoursSince * 10) / 10,
    },
    activity,
    is_quiet: isQuiet,
  } satisfies RevealData);
}
