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

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  gov: { bg: "#dbeafe", color: "#1e40af" },
  reg: { bg: "#fee2e2", color: "#991b1b" },
  ngo: { bg: "#dcfce7", color: "#166534" },
  res: { bg: "#f3e8ff", color: "#6b21a8" },
  media: { bg: "#fef3c7", color: "#78350f" },
  esg: { bg: "#ccfbf1", color: "#134e4a" },
};

const TOPIC_LABELS: Record<string, string> = {
  governance: "Governance",
  dsm: "Deep-Sea Mining",
  bluefinance: "Blue Finance",
  climate: "Climate",
  iuu: "IUU Fishing",
  mpa: "30x30",
  fisheries: "Fisheries",
  science: "Science",
  acidification: "Climate",
  technology: "Technology",
  shipping: "Shipping",
  all: "Ocean",
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function compileHtml(
  stories: any[],
  dateStr: string
): string {
  const storyRows = stories
    .map((s) => {
      const sc = SOURCE_COLORS[s.source_type] || SOURCE_COLORS.media;
      const topic = TOPIC_LABELS[s.topic] || s.topic;
      const title = decodeHtml(s.title);
      return `
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #e8eaed;">
            <div style="margin-bottom:6px;">
              <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${sc.color};background:${sc.bg};padding:2px 7px;border-radius:3px;">${s.source_name}</span>
              <span style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#9aa0a6;margin-left:8px;">${topic}</span>
            </div>
            <a href="https://www.thetideline.co/platform/story/${s.id}" style="font-size:15px;font-weight:600;color:#202124;text-decoration:none;line-height:1.4;display:block;margin-bottom:8px;">${title}</a>
            ${s.short_summary ? `<p style="font-size:13px;color:#5f6368;line-height:1.65;margin:0;">${s.short_summary}</p>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #dadce0;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#0a1628;padding:20px 32px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Tideline</span>
            <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,0.5);letter-spacing:0.04em;text-transform:uppercase;margin-left:10px;">Ocean Intelligence</span>
          </td>
        </tr>
        <!-- Date bar -->
        <tr>
          <td style="padding:16px 32px;border-bottom:1px solid #e8eaed;">
            <span style="font-size:13px;color:#9aa0a6;">${dateStr}</span>
            <span style="font-size:13px;color:#9aa0a6;float:right;">${stories.length} stories</span>
          </td>
        </tr>
        <!-- Stories -->
        ${storyRows}
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#f8f9fa;border-top:1px solid #e8eaed;">
            <a href="https://www.thetideline.co/platform/feed" style="display:inline-block;padding:10px 22px;background:#0a1628;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Open your feed</a>
            <p style="font-size:11px;color:#9aa0a6;margin:16px 0 0;line-height:1.5;">Tideline. Ocean intelligence for professionals.<br/>
            <a href="https://www.thetideline.co" style="color:#9aa0a6;">thetideline.co</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const todayDate = now.toISOString().split("T")[0];

    // Fetch summarised stories from last 24h, ranked by significance then recency
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        "id, title, link, source_name, topic, source_type, published_at, short_summary, significance_score"
      )
      .not("short_summary", "is", null)
      .gte("published_at", h24)
      .order("significance_score", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(15);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const storyList = stories || [];
    const dateStr = fmtDate(now);
    const subjectLine = `Tideline \u00B7 ${dateStr} \u00B7 ${storyList.length} stories`;
    const htmlContent = compileHtml(storyList, dateStr);

    // ── Quality gate ──────────────────────────────────────────────────
    let qualityResult: { passed: boolean; failed_items: { index: number; reason: string }[]; overall_quality: string } | null = null;

    try {
      const summaryList = storyList
        .map((s, i) => `${i + 1}. "${decodeHtml(s.title)}" — ${s.short_summary || "(no summary)"}`)
        .join("\n");

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: "You are a hostile senior editor at a B2B intelligence publication. Your job is to reject briefs that contain vague summaries, AI-sounding language, cause advocacy, or anything below the standard of a professional policy intelligence product. Return JSON only. No markdown.",
        messages: [{
          role: "user",
          content: `Review these summaries. For each, mark pass or fail. Fail if: uses phrases like "significant implications", "key stakeholders", "it is crucial", "in conclusion", or similar filler. Fail if the first sentence does not state a concrete fact. Fail if the tone is advocacy rather than intelligence. Return this exact JSON: { "passed": boolean, "failed_items": [{ "index": number, "reason": "string" }], "overall_quality": "publish"|"review"|"reject" }\n\n${summaryList}`,
        }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      qualityResult = JSON.parse(text.replace(/```json|```/g, "").trim());
      console.log(`[Quality Gate] Result: ${qualityResult!.overall_quality}, failed: ${qualityResult!.failed_items?.length || 0}/${storyList.length}`);
    } catch (err) {
      console.error("[Quality Gate] Failed, proceeding with upsert:", err);
    }

    const overallQuality = qualityResult?.overall_quality || "publish";
    const failedCount = qualityResult?.failed_items?.length || 0;

    // Log quality result
    await supabase.from("brief_quality_log").insert({
      date: todayDate,
      overall_quality: overallQuality,
      failed_count: failedCount,
      raw_feedback: qualityResult ? JSON.stringify(qualityResult) : null,
    });

    // If rejected: do not upsert, send alert email, return
    if (overallQuality === "reject") {
      console.log("[Quality Gate] Brief REJECTED. Sending alert.");
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Tideline <brief@thetideline.co>",
            to: "lukedmcmillan@hotmail.com",
            subject: `Brief REJECTED — ${dateStr}`,
            html: `<div style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;">
              <h2 style="color:#D93025;margin:0 0 12px;">Brief rejected by quality gate</h2>
              <p style="color:#3C4043;font-size:14px;line-height:1.6;">${failedCount} of ${storyList.length} summaries failed editorial review.</p>
              <h3 style="color:#202124;font-size:14px;margin:20px 0 8px;">Failed items:</h3>
              <ul style="font-size:13px;color:#5F6368;line-height:1.7;">
                ${(qualityResult?.failed_items || []).map((f) => `<li><strong>#${f.index}:</strong> ${f.reason}</li>`).join("")}
              </ul>
              <p style="font-size:12px;color:#9AA0A6;margin-top:24px;">This brief was not sent to subscribers. Review and regenerate manually.</p>
            </div>`,
          }),
        });
      } catch (emailErr) {
        console.error("[Quality Gate] Alert email failed:", emailErr);
      }

      return NextResponse.json({
        status: "rejected",
        overall_quality: "reject",
        failed_count: failedCount,
        story_count: storyList.length,
        date: todayDate,
      });
    }

    // Upsert into brief_buffer (with needs_review flag if quality is "review")
    const { error: upsertError } = await supabase
      .from("brief_buffer")
      .upsert(
        {
          date: todayDate,
          subject_line: subjectLine,
          html_content: htmlContent,
          story_count: storyList.length,
          needs_review: overallQuality === "review",
        },
        { onConflict: "date" }
      );

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "buffered",
      overall_quality: overallQuality,
      failed_count: failedCount,
      story_count: storyList.length,
      date: todayDate,
    });
  } catch (err) {
    console.error("generate-brief error:", err);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
