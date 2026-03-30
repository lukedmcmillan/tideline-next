import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fallbackHtml(dateStr: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #dadce0;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0a1628;padding:20px 32px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Tideline</span>
            <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,0.5);letter-spacing:0.04em;text-transform:uppercase;margin-left:10px;">Ocean Intelligence</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="font-size:15px;color:#202124;line-height:1.7;margin:0 0 16px;">The Tideline brief will arrive shortly. A technical issue delayed today's delivery.</p>
            <p style="font-size:13px;color:#5f6368;line-height:1.6;margin:0 0 24px;">Your feed is still live and updated. Open Tideline to see the latest stories.</p>
            <a href="https://www.thetideline.co/platform/feed" style="display:inline-block;padding:10px 22px;background:#0a1628;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Open your feed</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f8f9fa;border-top:1px solid #e8eaed;">
            <p style="font-size:11px;color:#9aa0a6;margin:0;line-height:1.5;">Tideline. Ocean intelligence for professionals.<br/>
            <a href="https://www.thetideline.co" style="color:#9aa0a6;">thetideline.co</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
        from: "Tideline <brief@thetideline.co>",
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
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayDate = yesterday.toISOString().split("T")[0];
    const dateStr = fmtDate(now);

    // Stage 1: Try today's buffer
    let source: "today" | "yesterday" | "fallback" = "fallback";
    let subject = `Tideline \u00B7 ${dateStr}`;
    let html = fallbackHtml(dateStr);

    const { data: todayBrief } = await supabase
      .from("brief_buffer")
      .select("subject_line, html_content")
      .eq("date", todayDate)
      .single();

    if (todayBrief) {
      source = "today";
      subject = todayBrief.subject_line;
      html = todayBrief.html_content;
    } else {
      // Stage 2: Try yesterday's buffer
      const { data: yesterdayBrief } = await supabase
        .from("brief_buffer")
        .select("subject_line, html_content")
        .eq("date", yesterdayDate)
        .single();

      if (yesterdayBrief) {
        source = "yesterday";
        subject = `Tideline \u00B7 ${dateStr} \u00B7 yesterday's brief`;
        html = yesterdayBrief.html_content;
      }
      // Stage 3: fallback already set as default
    }

    // Fetch active and trialing subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("users")
      .select("id, email")
      .in("status", ["active", "trialing"]);

    if (subError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({
        sent: 0,
        source,
        error: subError?.message || "No subscribers found",
      });
    }

    // Send to each subscriber
    let sent = 0;
    const errors: string[] = [];
    const nowIso = now.toISOString();

    for (const sub of subscribers) {
      if (!sub.email) continue;
      const ok = await sendEmail(sub.email, subject, html);
      if (ok) {
        sent++;
        // Update last_brief_sent (fire and forget per user)
        supabase
          .from("users")
          .update({ last_brief_sent: nowIso })
          .eq("id", sub.id)
          .then(() => {});
      } else {
        errors.push(sub.email);
      }
    }

    return NextResponse.json({
      sent,
      total: subscribers.length,
      source,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("send-brief error:", err);
    return NextResponse.json(
      { error: "Failed to send brief" },
      { status: 500 }
    );
  }
}
