import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { getUserTrackedDomains, userIdFromEmail } from "@/app/lib/user-preferences";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_WINDOW_HOURS = 24;
const PRE_FILTER_LIMIT = 100;
const RETURN_LIMIT = 20;

const DECAY_HOURS: Record<string, number> = {
  band_crossing: 48,
  countdown_threshold: 12,
  convergence_spike: 6,
  high_sig_story: 12,
};

function nextEvenHourUTC(now: Date): Date {
  const h = now.getUTCHours();
  const nextHour = h % 2 === 0 ? h + 2 : h + 1;
  const result = new Date(now);
  result.setUTCHours(nextHour, 0, 0, 0);
  // Handle midnight rollover
  if (nextHour >= 24) {
    result.setUTCDate(result.getUTCDate() + 1);
    result.setUTCHours(nextHour - 24, 0, 0, 0);
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
   const email = await getEmailFromSession(req);
   if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const maxWindowStart = new Date(now.getTime() - MAX_WINDOW_HOURS * 3600 * 1000);

    // Resolve user id + last_dashboard_view in one query
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id, last_dashboard_view")
      .eq("email", email)
      .maybeSingle();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userId: string = userRow.id;

    // Determine window start
    let since: Date;
    const sinceParam = req.nextUrl.searchParams.get("since");

    if (sinceParam) {
      const parsed = new Date(sinceParam);
      since = isNaN(parsed.getTime()) ? maxWindowStart : parsed;
    } else if (userRow.last_dashboard_view) {
      const lastView = new Date(userRow.last_dashboard_view);
      since = lastView < maxWindowStart ? maxWindowStart : lastView;
    } else {
      since = maxWindowStart;
    }

    // Get tracked domains (defaults to all 10 if none set)
    const trackedSlugs = await getUserTrackedDomains(userId);

    // Fetch signal_events
    const { data: rows, error: sigErr } = await supabase
      .from("signal_events")
      .select("id, signal_type, tracker_slug, headline, body, importance, action_label, action_url, created_at, metadata, expires_at")
      .gt("created_at", since.toISOString())
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .in("tracker_slug", trackedSlugs)
      .order("created_at", { ascending: false })
      .limit(PRE_FILTER_LIMIT);

    if (sigErr) return NextResponse.json({ error: sigErr.message }, { status: 500 });

    const signals = rows ?? [];
    const totalAvailable = signals.length;

    // Compute display_score with exponential decay
    const scored = signals.map((s) => {
      const ageMs = now.getTime() - new Date(s.created_at).getTime();
      const ageSeconds = ageMs / 1000;
      const ageHours = ageSeconds / 3600;
      const decay = DECAY_HOURS[s.signal_type] ?? 12;
      const displayScore = (s.importance ?? 0) * Math.exp(-ageHours / decay);

      return {
        id: s.id,
        signal_type: s.signal_type,
        tracker_slug: s.tracker_slug,
        headline: s.headline,
        body: s.body,
        importance: s.importance,
        age_seconds: Math.round(ageSeconds),
        age_hours: Math.round(ageHours * 10) / 10,
        display_score: Math.round(displayScore * 1000) / 1000,
        action_label: s.action_label,
        action_url: s.action_url,
        created_at: s.created_at,
        metadata: s.metadata,
      };
    });

    // Sort by display_score DESC, slice to 20
    scored.sort((a, b) => b.display_score - a.display_score);
    const top = scored.slice(0, RETURN_LIMIT);

    const isQuiet = scored.filter((s) => s.age_hours < 2).length === 0;

    const windowHours = Math.round(((now.getTime() - since.getTime()) / 3600000) * 10) / 10;

    // Fire-and-forget: update last_dashboard_view
    supabase
      .from("users")
      .update({ last_dashboard_view: now.toISOString() })
      .eq("id", userId)
      .then(() => {/* intentionally fire-and-forget */});

    return NextResponse.json({
      signals: top,
      window: {
        since: since.toISOString(),
        until: now.toISOString(),
        hours: windowHours,
      },
      counts: {
        returned: top.length,
        total_available: totalAvailable,
      },
      is_quiet: isQuiet,
      next_scrape: nextEvenHourUTC(now).toISOString(),
    });
  } catch (err) {
    console.error("[signals] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
