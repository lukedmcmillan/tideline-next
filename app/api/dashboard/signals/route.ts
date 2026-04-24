import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { getUserTrackedDomains, userIdFromEmail } from "@/app/lib/user-preferences";
import { weeklyDedupe } from "@/app/lib/velocity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
   // TEMP DIAGNOSTIC — remove after auth is confirmed working
   console.log("[signals] cookies:", req.cookies.getAll().map(c => c.name));
   const { getToken: _gt } = await import("next-auth/jwt");
   const rawToken = await _gt({ req, secret: process.env.NEXTAUTH_SECRET });
   console.log("[signals] getToken result:", rawToken ? { email: rawToken.email, sub: rawToken.sub } : null);
   console.log("[signals] NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "set" : "MISSING");
   // END TEMP DIAGNOSTIC

   const email = await getEmailFromSession(req);
   if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();

    // Resolve user id + last_dashboard_view in one query
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id, last_dashboard_view")
      .eq("email", email)
      .maybeSingle();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userId: string = userRow.id;

    // Sliding minimum window: always show at least the last 6 hours,
    // even if the user refreshes frequently. Falls back to 24h on first visit.
    // last_dashboard_view is NOT updated here — only on explicit acknowledgment.
    const lastDashboardView = userRow.last_dashboard_view
      ? new Date(userRow.last_dashboard_view)
      : null;
    const sinceCandidate = lastDashboardView ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const since = sinceCandidate < sixHoursAgo ? sinceCandidate : sixHoursAgo;

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

    // Attach velocity history (8 weekly scores, oldest-first) to band_crossing signals
    const bcSlugs = [...new Set(top.filter(s => s.signal_type === "band_crossing").map(s => s.tracker_slug))];
    const historyMap: Record<string, number[]> = {};

    await Promise.all(bcSlugs.map(async (slug) => {
      const { data: vRows } = await supabase
        .from("velocity_scores")
        .select("score, calculated_at")
        .eq("tracker_slug", slug)
        .order("calculated_at", { ascending: false })
        .limit(50);

      if (!vRows || vRows.length === 0) return;
      const weekly = weeklyDedupe(vRows, 8);
      // Reverse to oldest-first for chart rendering
      historyMap[slug] = weekly.reverse().map(r => r.score);
    }));

    // Merge history into band_crossing signals
    const topWithHistory = top.map(s => {
      if (s.signal_type !== "band_crossing") return s;
      const history = historyMap[s.tracker_slug];
      return history && history.length > 0 ? { ...s, history } : s;
    });

    const isQuiet = scored.filter((s) => s.age_hours < 2).length === 0;

    const windowHours = Math.round(((now.getTime() - since.getTime()) / 3600000) * 10) / 10;

    // last_dashboard_view intentionally NOT updated here.
    // See: sliding minimum window comment above.

    return NextResponse.json({
      signals: topWithHistory,
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
