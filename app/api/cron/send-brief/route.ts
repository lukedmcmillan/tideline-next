import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

async function generateSubjectLine(htmlContent: string): Promise<string | null> {
  try {
    // Extract story titles from the HTML to give Sonnet context
    const titleMatches = htmlContent.match(
      /style="font-size:15px;font-weight:600;color:#202124[^"]*"[^>]*>([^<]+)</g
    );
    const titles = titleMatches
      ? titleMatches.map((m) => m.replace(/.*>/, "")).slice(0, 5)
      : [];

    if (titles.length === 0) return null;

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 60,
      system: "You write email subject lines for a professional ocean intelligence brief. Write a subject line under 9 words. State the single most consequential development. No 'Tideline ·' prefix. No quotes. Just the subject line.",
      messages: [{
        role: "user",
        content: `Today's top stories:\n${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nWrite the subject line.`,
      }],
    });

    const text = res.content[0];
    if (text.type === "text") {
      return text.text.trim().replace(/^["']|["']$/g, "");
    }
    return null;
  } catch (err) {
    console.error("[send-brief] Subject line generation failed:", err);
    return null;
  }
}

function injectPreheader(html: string, preheader: string): string {
  // Insert preheader as hidden span right after <body>
  const preheaderHtml = `<span style="display:none;font-size:1px;color:#f8f9fa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`;
  return html.replace(
    /<body([^>]*)>/,
    `<body$1>${preheaderHtml}`
  );
}

function injectUnsubscribeLink(html: string, token: string): string {
  // Replace the footer section — find the closing </table> before the outer wrapper closes
  // and inject the unsubscribe link before it
  const unsubBlock = `
        <tr>
          <td style="padding:0 32px 20px;background:#f8f9fa;">
            <p style="font-size:10px;color:#bdc1c6;margin:0;line-height:1.5;text-align:center;">
              <a href="https://www.thetideline.co/unsubscribe?token=${token}" style="color:#bdc1c6;text-decoration:underline;">Unsubscribe</a>
              &nbsp;\u00B7&nbsp;
              <a href="https://www.thetideline.co" style="color:#bdc1c6;text-decoration:none;">thetideline.co</a>
            </p>
          </td>
        </tr>`;

  // Insert before the closing inner table
  const lastTableClose = html.lastIndexOf("</table>");
  const secondLastTableClose = html.lastIndexOf("</table>", lastTableClose - 1);
  if (secondLastTableClose === -1) return html;

  return (
    html.slice(0, secondLastTableClose) +
    unsubBlock +
    html.slice(secondLastTableClose)
  );
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
        from: "Tideline <luke@thetideline.co>",
        reply_to: "luke@thetideline.co",
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

    // ── 1. Load brief from buffer ──
    let source: "today" | "yesterday" | "fallback" = "fallback";
    let baseSubject = `Tideline \u00B7 ${dateStr}`;
    let html = fallbackHtml(dateStr);
    let storyCount = 0;
    let trackerSlug: string | null = null;

    const { data: todayBrief } = await supabase
      .from("brief_buffer")
      .select("subject_line, html_content, story_count, tracker_data")
      .eq("date", todayDate)
      .single();

    if (todayBrief) {
      source = "today";
      baseSubject = todayBrief.subject_line;
      html = todayBrief.html_content;
      storyCount = todayBrief.story_count || 0;
      trackerSlug = todayBrief.tracker_data?.tracker_slug || null;
    } else {
      const { data: yesterdayBrief } = await supabase
        .from("brief_buffer")
        .select("subject_line, html_content, story_count, tracker_data")
        .eq("date", yesterdayDate)
        .single();

      if (yesterdayBrief) {
        source = "yesterday";
        baseSubject = `Tideline \u00B7 ${dateStr} \u00B7 yesterday's brief`;
        html = yesterdayBrief.html_content;
        storyCount = yesterdayBrief.story_count || 0;
        trackerSlug = yesterdayBrief.tracker_data?.tracker_slug || null;
      }
    }

    // ── 2. Generate AI subject line via Sonnet (only for today's brief) ──
    let subject = baseSubject;
    if (source === "today") {
      const aiSubject = await generateSubjectLine(html);
      if (aiSubject) {
        subject = aiSubject;
      }
    }

    // ── 3. Inject preheader ──
    const preheader = `Tideline \u00B7 ${dateStr} \u00B7 ${storyCount} developments`;
    html = injectPreheader(html, preheader);

    // ── 4. Determine recipients ──
    const testEmail = process.env.TEST_EMAIL;
    const isTestMode = !!testEmail;

    let subscribers: { id: string; email: string; unsubscribe_token: string | null }[];

    if (isTestMode) {
      subscribers = [{ id: "test", email: testEmail!, unsubscribe_token: null }];
    } else {
      const { data: users, error: subError } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token")
        .in("status", ["active", "trialing"]);

      if (subError || !users || users.length === 0) {
        return NextResponse.json({
          sent: 0,
          source,
          error: subError?.message || "No subscribers found",
        });
      }
      subscribers = users;
    }

    // ── 5. Send to each subscriber ──
    let sent = 0;
    const errors: string[] = [];
    const nowIso = now.toISOString();
    const sendType = isTestMode ? "test_send" : "production";

    for (const sub of subscribers) {
      if (!sub.email) continue;

      // Inject per-user unsubscribe link
      const userHtml = sub.unsubscribe_token
        ? injectUnsubscribeLink(html, sub.unsubscribe_token)
        : html;

      const ok = await sendEmail(sub.email, subject, userHtml);
      if (ok) {
        sent++;
        // Update last_brief_sent
        if (!isTestMode) {
          supabase
            .from("users")
            .update({ last_brief_sent: nowIso })
            .eq("id", sub.id)
            .then(() => {});
        }
        // Log to brief_sends
        supabase
          .from("brief_sends")
          .insert({
            user_id: sub.id === "test" ? null : sub.id,
            email: sub.email,
            story_count: storyCount,
            tracker_slug: trackerSlug,
            send_type: sendType,
            brief_date: todayDate,
          })
          .then(() => {});
      } else {
        errors.push(sub.email);
      }
    }

    return NextResponse.json({
      sent,
      total: subscribers.length,
      source,
      subject,
      test_mode: isTestMode,
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
