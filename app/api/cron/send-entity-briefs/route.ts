import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
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
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[send-entity-briefs] Resend error ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[send-entity-briefs] sendEmail threw:", err);
    return false;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    // 1. Fetch pending briefs that are due (scheduled_for <= now)
    const { data: pending, error: fetchErr } = await supabase
      .from("morning_brief_queue")
      .select(`
        id, user_id, html_content, subject_line, story_count, brief_type,
        users!inner(email, unsubscribe_token)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    if (fetchErr) {
      console.error("[send-entity-briefs] Fetch error:", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;

    for (const brief of pending || []) {
      const user = brief.users as unknown as { email: string; unsubscribe_token: string | null } | null;

      if (!user?.email || !brief.html_content || !brief.subject_line) {
        console.error(`[send-entity-briefs] Skipping queue entry ${brief.id} — missing email or content`);
        await supabase
          .from("morning_brief_queue")
          .update({ status: "failed" })
          .eq("id", brief.id);
        failed++;
        continue;
      }

      const ok = await sendEmail(user.email, brief.subject_line, brief.html_content);

      if (ok) {
        // Mark sent
        await supabase
          .from("morning_brief_queue")
          .update({ status: "sent", sent_at: now.toISOString() })
          .eq("id", brief.id);

        // Log to brief_sends (fire-and-forget)
        supabase
          .from("brief_sends")
          .insert({
            user_id: brief.user_id,
            email: user.email,
            story_count: brief.story_count ?? 0,
            tracker_slug: null,
            send_type: "entity",
            brief_date: todayDate,
          })
          .then(() => {});

        // Update last_brief_sent (fire-and-forget)
        supabase
          .from("users")
          .update({ last_brief_sent: now.toISOString() })
          .eq("id", brief.user_id)
          .then(() => {});

        console.log(`[send-entity-briefs] Sent to ${user.email}: "${brief.subject_line}"`);
        sent++;
      } else {
        await supabase
          .from("morning_brief_queue")
          .update({ status: "failed" })
          .eq("id", brief.id);
        console.error(`[send-entity-briefs] Failed for ${user.email}`);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("[send-entity-briefs] Fatal:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
