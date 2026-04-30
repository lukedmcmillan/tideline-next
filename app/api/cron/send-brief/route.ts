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
  const F = "'DM Sans',Arial,sans-serif";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${F};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #EAECEF;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-family:${F};font-size:18px;font-weight:700;color:#0B1628;letter-spacing:-0.02em;">Tideline</div>
                <div style="font-family:${F};font-size:10px;font-weight:500;color:#1D9E75;letter-spacing:0.18em;text-transform:uppercase;margin-top:3px;">OCEAN INTELLIGENCE</div>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <span style="font-family:${F};font-size:12px;color:#8BA0BC;">${dateStr}</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:40px 28px;">
          <p style="font-family:${F};font-size:15px;color:#0B1628;line-height:1.7;margin:0 0 16px;">The Tideline brief will arrive shortly. A technical issue delayed today's delivery.</p>
          <p style="font-family:${F};font-size:13px;color:#5A7290;line-height:1.6;margin:0 0 24px;">Your feed is still live and updated. Open Tideline to see the latest stories.</p>
          <a href="https://www.thetideline.co/platform/feed" style="display:inline-block;padding:10px 22px;background:#0B1628;color:#ffffff;font-family:${F};font-size:13px;font-weight:600;text-decoration:none;border-radius:4px;">Open your feed</a>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #EAECEF;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:${F};font-size:13px;color:#3D4F63;">Reply to ask a question about today's brief.</td>
            </tr>
            <tr>
              <td style="padding-top:8px;">
                <a href="https://www.thetideline.co/platform/feed" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;margin-right:14px;">Open feed</a>
                <a href="https://www.thetideline.co/unsubscribe" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function generateSubjectLine(htmlContent: string): Promise<string | null> {
  try {
    // Extract story titles from the HTML to give Haiku context
    const titleMatches = htmlContent.match(
      /style="font-[^"]*font-size:15px;font-weight:600;color:#0B1628[^"]*"[^>]*>([^<]+)/g
    );
    const titles = titleMatches
      ? titleMatches.map((m) => m.replace(/.*>/, "")).slice(0, 5)
      : [];

    if (titles.length === 0) return null;

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: "Write a subject line under 8 words using the single most newsworthy headline from today's stories. State the news. No Tideline prefix. No date. Just the news.",
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

// Maps tracker slugs (user.topics) → story content topic categories
const TRACKER_TO_TOPICS: Record<string, string[]> = {
  "bbnj": ["governance"],
  "isa": ["dsm"],
  "imo-shipping": ["shipping"],
  "30x30": ["conservation"],
  "mpa": ["conservation"],
  "iuu": ["fisheries"],
  "wto-fisheries": ["fisheries"],
  "cites-marine": ["conservation", "science"],
  "blue-finance": ["bluefinance"],
  "bluefinance": ["bluefinance"],
  "plastics": ["governance"],
  "offshore-wind": ["climate"],
  // identity mappings for users who onboarded with content topic names
  "governance": ["governance"],
  "fisheries": ["fisheries"],
  "shipping": ["shipping"],
  "dsm": ["dsm"],
  "climate": ["climate"],
  "science": ["science"],
};

// Display labels keyed by tracker slug or content topic
const TOPIC_LABELS: Record<string, string> = {
  "bbnj": "BBNJ",
  "isa": "Deep-Sea Mining",
  "imo-shipping": "Shipping",
  "30x30": "30x30",
  "mpa": "30x30",
  "iuu": "IUU",
  "wto-fisheries": "Fisheries",
  "cites-marine": "Marine Species",
  "blue-finance": "Blue Finance",
  "plastics": "Plastics Treaty",
  "offshore-wind": "Offshore Wind",
  "governance": "Governance",
  "fisheries": "Fisheries",
  "dsm": "Deep-Sea Mining",
  "bluefinance": "Blue Finance",
  "climate": "Climate",
  "science": "Science",
  "shipping": "Shipping",
  "conservation": "30x30",
};

function cleanTitle(raw: string): string {
  const decoded = raw
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  // Strip leading category prefixes when 2+ colons present
  const parts = decoded.split(":");
  const text = parts.length >= 3 ? parts[parts.length - 1].trim() : decoded.trim();
  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function subjectFromStories(
  stories: { title: string; topic: string }[],
  userTopics: string[] | null
): string | null {
  if (stories.length === 0) return null;
  const top = stories[0];

  // Derive label: prefer the matching tracker slug label, fall back to content topic
  let label = TOPIC_LABELS[top.topic] || top.topic;
  if (userTopics && userTopics.length > 0) {
    const matchingTracker = userTopics.find(t =>
      (TRACKER_TO_TOPICS[t] || [t]).includes(top.topic)
    );
    if (matchingTracker) label = TOPIC_LABELS[matchingTracker] || matchingTracker;
  }

  const headline = cleanTitle(top.title);
  return `${label}: ${headline}`;
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

    let briefStories: { title: string; topic: string }[] = [];

    const { data: todayBrief } = await supabase
      .from("brief_buffer")
      .select("subject_line, html_content, story_count, tracker_data, stories")
      .eq("date", todayDate)
      .single();

    if (todayBrief) {
      source = "today";
      baseSubject = todayBrief.subject_line;
      html = todayBrief.html_content;
      storyCount = todayBrief.story_count || 0;
      trackerSlug = todayBrief.tracker_data?.tracker_slug || null;
      briefStories = (todayBrief.stories as { title: string; topic: string }[]) || [];
    } else {
      const { data: yesterdayBrief } = await supabase
        .from("brief_buffer")
        .select("subject_line, html_content, story_count, tracker_data, stories")
        .eq("date", yesterdayDate)
        .single();

      if (yesterdayBrief) {
        source = "yesterday";
        baseSubject = `Tideline \u00B7 ${dateStr} \u00B7 yesterday's brief`;
        html = yesterdayBrief.html_content;
        storyCount = yesterdayBrief.story_count || 0;
        trackerSlug = yesterdayBrief.tracker_data?.tracker_slug || null;
        briefStories = (yesterdayBrief.stories as { title: string; topic: string }[]) || [];
      }
    }

    // ── 1b. Tracker rotation by day of week ──
    const TRACKER_ROTATION: Record<number, string> = {
      0: "isa",           // Sunday
      1: "bbnj",          // Monday
      2: "imo-shipping",  // Tuesday
      3: "30x30",         // Wednesday
      4: "blue-finance",  // Thursday
      5: "iuu",           // Friday
      6: "wto-fisheries", // Saturday
    };

    const dayOfWeek = new Date().getDay();
    const todayTracker = TRACKER_ROTATION[dayOfWeek];

    const { data: pulseData } = await supabase
      .from("velocity_scores")
      .select("tracker_slug, score, momentum_direction, interpretation")
      .eq("tracker_slug", todayTracker)
      .order("calculated_at", { ascending: false })
      .limit(1);

    if (pulseData && pulseData[0]) {
      trackerSlug = pulseData[0].tracker_slug;
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

    let subscribers: { id: string; email: string; unsubscribe_token: string | null; topics: string[] | null }[];

    if (isTestMode) {
      subscribers = [{ id: "test", email: testEmail!, unsubscribe_token: null, topics: null }];
    } else {
      const { data: users, error: subError } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token, topics")
        .in("subscription_status", ["active", "trialing"])
        .not("onboarded_at", "is", null);

      if (subError || !users || users.length === 0) {
        return NextResponse.json({
          sent: 0,
          source,
          error: subError?.message || "No subscribers found",
        });
      }
      subscribers = users.map(u => ({
        ...u,
        topics: Array.isArray(u.topics) ? u.topics as string[] : null,
      }));
    }

    // ── 5. Send to each subscriber ──
    let sent = 0;
    const errors: string[] = [];
    const nowIso = now.toISOString();
    const sendType = isTestMode ? "test_send" : "production";

    for (const sub of subscribers) {
      if (!sub.email) continue;

      // ── Per-user topic filtering ──
      const userTopics = sub.topics;
      let filteredStories = briefStories;
      if (userTopics && userTopics.length > 0 && briefStories.length > 0) {
        filteredStories = briefStories.filter(s =>
          userTopics.some(t => (TRACKER_TO_TOPICS[t] || [t]).includes(s.topic))
        );
      }

      // Skip send if user has explicit topics but none match today's brief
      if (!isTestMode && userTopics && userTopics.length > 0 && filteredStories.length === 0) {
        supabase.from("brief_sends").insert({
          user_id: sub.id,
          email: sub.email,
          story_count: 0,
          tracker_slug: trackerSlug,
          send_type: "skip_no_topics",
          brief_date: todayDate,
        }).then(() => {});
        continue;
      }

      // Personalised subject line from matched stories (falls back to AI-generated or base subject)
      const userSubject = subjectFromStories(filteredStories, userTopics) || subject;

      // Inject per-user unsubscribe link
      const userHtml = sub.unsubscribe_token
        ? injectUnsubscribeLink(html, sub.unsubscribe_token)
        : html;

      const ok = await sendEmail(sub.email, userSubject, userHtml);
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
