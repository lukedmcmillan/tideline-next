import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  compileBriefHtml,
  type BriefData,
  type BriefUser,
  type LeadItem,
  type ConditionRow,
  type WatchEvent,
} from "@/app/lib/brief/template";
import {
  selectLead,
  selectConditions,
  selectEvidence,
  selectWhatToWatch,
  selectAcrossSector,
  type StoryRow,
  type TrackerScoreRow,
  type GovernanceEventRow,
} from "@/app/lib/brief/select";
import { selectQuickAsk, type QuickAskContext } from "@/app/lib/brief/quick-asks";
import {
  generateSignOff,
  currentWeekday,
  fmtDate,
  isoWeekNumber,
  TRACKER_TO_TOPICS,
  STATIC_WORK_REVEALED,
  type Weekday,
} from "@/app/lib/brief/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Pool shape from brief_buffer.stories JSONB (Phase 4a format) ───────────────
interface BriefPool {
  candidate_stories:   StoryRow[];
  all_tracker_scores:  TrackerScoreRow[];
  all_events:          GovernanceEventRow[];
  work_revealed_count: { sources: number; candidate_count: number; filtered_count: number };
  generated_at:        string;
}

// ── Subject-line generation ────────────────────────────────────────────────────
// Format: [headline] · [data point]
// Data point priority: ELEVATED pulse score > nearest event > nothing
// Double-Pulse guard: if headline already contains "Pulse X.X" (hybrid mode),
// append event day label instead to avoid "Pulse 5.9. ... · Pulse 5.6" repeats.
function buildSubject(
  lead: LeadItem,
  conditions: ConditionRow[],
  events: WatchEvent[],
): string {
  // In Mode b (state type with hybrid framing), headline is a long compound sentence.
  // Use subjectHeadline (the bare story title) instead for the email subject.
  const headline = (lead.type === 'state' && lead.subjectHeadline
    ? lead.subjectHeadline
    : lead.headline
  ).replace(/\.$/, "").trim();
  const headlineHasPulse = /Pulse \d+\.?\d*/i.test(headline);

  if (headlineHasPulse) {
    // Headline already states a pulse score — prefer event label over repeating
    if (events.length > 0) return `${headline} · ${events[0].dayLabel}`;
    return headline;
  }

  const elevated = conditions.find(c => c.band === "ELEVATED");
  if (elevated) return `${headline} · Pulse ${elevated.score.toFixed(1)}`;
  if (events.length > 0) return `${headline} · ${events[0].dayLabel}`;
  return headline;
}

// ── Resend send ───────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <luke@thetideline.co>",
        reply_to: "brief-replies@thetideline.co",
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now       = new Date();
    const todayDate = now.toISOString().split("T")[0];
    const weekday   = currentWeekday(); // null if weekend

    // ── Weekend skip (belt-and-braces — vercel.json already uses 1-5 schedule) ──
    if (!weekday) {
      return NextResponse.json({ skipped: true, reason: "weekend", count: 0 });
    }

    const dateStr   = fmtDate(now);
    const weekNum   = isoWeekNumber(now);
    const nowIso    = now.toISOString();

    // ── 1. Load today's brief pool ────────────────────────────────────────────
    const { data: briefBuffer } = await supabase
      .from("brief_buffer")
      .select("stories, story_count")
      .eq("date", todayDate)
      .single();

    if (!briefBuffer) {
      console.log("[send-brief] No brief_buffer row for today — generate-brief may not have run.");
      return NextResponse.json({ skipped: true, reason: "no_brief_today", count: 0 });
    }

    const rawPool = briefBuffer.stories;

    // Legacy format check: old rows stored an array of story objects
    if (Array.isArray(rawPool) || !rawPool?.candidate_stories) {
      console.log("[send-brief] brief_buffer row is in legacy format, skipping. Today's generate-brief may not have run yet.");
      return NextResponse.json({ skipped: true, reason: "legacy_format", count: 0 });
    }

    const pool = rawPool as BriefPool;
    console.log(
      `[send-brief] Pool loaded: ${pool.candidate_stories.length} stories, ` +
      `${pool.all_tracker_scores.length} trackers, ${pool.all_events.length} events`
    );

    // ── 2. Determine recipients ───────────────────────────────────────────────
    const testEmail = process.env.TEST_EMAIL;
    const isTestMode = !!testEmail;

    type Subscriber = {
      id: string;
      email: string;
      unsubscribe_token: string | null;
      topics: string[];
      created_at: string | null;
    };

    let subscribers: Subscriber[];

    if (isTestMode) {
      // In test mode, look up the actual user by email so topics/token are real
      const { data: testUser } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token, topics, created_at")
        .eq("email", testEmail)
        .single();

      subscribers = [{
        id:                testUser?.id ?? "test",
        email:             testEmail,
        unsubscribe_token: testUser?.unsubscribe_token ?? null,
        topics:            Array.isArray(testUser?.topics) ? testUser.topics : [],
        created_at:        testUser?.created_at ?? null,
      }];
      console.log(`[send-brief] TEST MODE → ${testEmail}, topics: ${subscribers[0].topics.join(",")}`);
    } else {
      const { data: users, error: subError } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token, topics, created_at")
        .in("subscription_status", ["active", "trial", "trialing"])
        .not("onboarded_at", "is", null);

      if (subError || !users || users.length === 0) {
        return NextResponse.json({
          sent: 0,
          source: "today",
          error: subError?.message || "No subscribers found",
        });
      }
      subscribers = users.map(u => ({
        ...u,
        topics: Array.isArray(u.topics) ? u.topics : [],
      }));
    }

    // ── 3. Per-subscriber loop ────────────────────────────────────────────────
    let sent    = 0;
    const errors: string[] = [];
    const sendType = isTestMode ? "test_send" : "production";

    for (const sub of subscribers) {
      if (!sub.email) continue;
      const userTopics: string[] = sub.topics;

      // ── 3a. Async context (1 DB call + 2 in-memory) ──
      // isFirstBrief: any prior production OR test_send means the user has seen a brief.
      // Exclude 'skip_no_topics' rows only — those are not real sends.
      const { data: prevSends } = await supabase
        .from("brief_sends")
        .select("id")
        .eq("user_id", sub.id)
        .neq("send_type", "skip_no_topics")
        .limit(1);
      const isFirstBrief = !prevSends || prevSends.length === 0;

      // Context signals derived from candidate pool (no extra DB call)
      const userStories = pool.candidate_stories.filter(s =>
        userTopics.length === 0 ||
        userTopics.some(t => (TRACKER_TO_TOPICS[t] || [t]).includes(s.topic))
      );
      const recentHighSigCount    = userStories.filter(s => (s.significance_score ?? 0) >= 7).length;
      const recentLowActivityWeek = userStories.length <= 3;

      const quickAskCtx: QuickAskContext = { isFirstBrief, recentHighSigCount, recentLowActivityWeek };

      // ── 3b. Sync selectors ──
      const lead         = selectLead(pool.candidate_stories, pool.all_tracker_scores, userTopics);
      const conditions   = selectConditions(pool.all_tracker_scores, userTopics);
      const evidence     = selectEvidence(pool.candidate_stories, lead, userTopics);
      const whatToWatch  = selectWhatToWatch(pool.all_events, userTopics, 14);
      const acrossSector = selectAcrossSector(pool.candidate_stories, userTopics);
      const quickAsk     = selectQuickAsk(weekday, weekNum, quickAskCtx);
      const signOff      = generateSignOff(weekday);

      // ── 3c. Build BriefData ──
      const preheader = lead.interpretation.slice(0, 90).replace(/\n/g, " ").trim();

      const briefData: BriefData = {
        dateStr,
        preheader,
        lead,
        conditions,
        evidence,
        whatToWatch,
        acrossSector,
        quickAsk,
        workRevealedLine: STATIC_WORK_REVEALED,
        signOff,
      };

      const briefUser: BriefUser = {
        email:            sub.email,
        unsubscribeToken: sub.unsubscribe_token,
      };

      // ── 3d. Render HTML ──
      const html = compileBriefHtml(briefData, briefUser);

      // ── 3e. Generate subject ──
      const subject = buildSubject(lead, conditions, whatToWatch);

      // ── 3f. Log selection context ──
      console.log(
        `[send-brief] ${sub.email} → lead: [${lead.type}] "${lead.headline.slice(0, 60)}" | ` +
        `conditions: ${conditions.length} | evidence: ${evidence.length} | ` +
        `subject: "${subject.slice(0, 70)}"`
      );

      // ── 3g. Send ──
      const ok = await sendEmail(sub.email, subject, html);

      if (ok) {
        sent++;

        // Update last_brief_sent (production only)
        if (!isTestMode) {
          supabase
            .from("users")
            .update({ last_brief_sent: nowIso })
            .eq("id", sub.id)
            .then(() => {});
        }

        // Top tracker slug for brief_sends (highest-score tracker in user's topics)
        const topTrackerSlug = pool.all_tracker_scores
          .filter(t => userTopics.length === 0 || userTopics.includes(t.tracker_slug))
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.tracker_slug ?? null;

        supabase
          .from("brief_sends")
          .insert({
            user_id:      sub.id === "test" ? null : sub.id,
            email:        sub.email,
            story_count:  evidence.length,   // items user actually saw in Evidence section
            tracker_slug: topTrackerSlug,    // top tracker for this user (was daily rotation)
            send_type:    sendType,
            brief_date:   todayDate,
          })
          .then(() => {});
      } else {
        errors.push(sub.email);
        console.error(`[send-brief] Send failed for ${sub.email}`);
      }
    }

    return NextResponse.json({
      sent,
      total:     subscribers.length,
      source:    "today",
      test_mode: isTestMode,
      errors:    errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("send-brief error:", err);
    return NextResponse.json(
      { error: "Failed to send brief", details: String(err) },
      { status: 500 }
    );
  }
}
