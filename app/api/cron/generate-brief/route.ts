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

const SUMMARY_SYSTEM_PROMPT =
  'You are a senior analyst at a financial intelligence terminal. Write exactly two sentences as JSON.\n\nRules:\n- Sentence 1: Name the institution. State the specific decision, document, or finding. Include numbers, dates, or references where available.\n- Sentence 2: State the consequence for the most relevant professional group given this specific story. Choose the single most affected group from: maritime lawyers, ESG analysts, shipping compliance teams, ocean investors, NGO policy directors, fisheries regulators. Pick the ONE group most affected by this specific story. Do not default to ocean investors for every story. Name the group. State what specifically changes for them.\n- Never use: must, should, need to, crucial, important, landmark, historic, significant\n- Never prescribe action. Analyse consequence.\n- Only use numbers, statistics, and specific references that appear explicitly in the story title or description provided. If the source contains no specific figures, do not invent them. Write sentence 1 based only on what is stated in the input.\n- Model tone: FT Alphaville data note.\n\nReturn JSON only: {"sentence1": "...", "sentence2": "..."}';

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

async function generateSummary(
  title: string,
  description: string | null
): Promise<string | null> {
  // Skip if no content to summarise
  if (!description || description.trim().length === 0) {
    console.log(`[generate-brief] Skipping "${title}" — no description to summarise`);
    return null;
  }

  try {
    console.log("Story content being summarised:", {
      title,
      description: description?.slice(0, 200),
    });

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Respond with JSON only. Story: Title: ${title}\n\nDescription: ${description}` }],
    });
    const rawText = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    console.log("Raw Haiku response:", rawText);

    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in summary response");
      const parsed = JSON.parse(jsonMatch[0]);
      return `${parsed.sentence1} ${parsed.sentence2}`;
    } catch {
      console.log("Raw Haiku response:", rawText);
      // Fall back to using the raw text if it looks like two sentences
      if (rawText.length > 20 && rawText.includes(".")) {
        return rawText;
      }
      return null;
    }
  } catch (err) {
    console.error(`[generate-brief] Summary failed for "${title}":`, err);
    return null;
  }
}

function compileHtml(
  stories: { id: string; title: string; source_name: string; source_type: string; topic: string; brief_summary: string }[],
  dateStr: string,
  trackerData: { tracker_slug: string; score: number; momentum_direction: string; interpretation: string } | null,
  archiveStory: { id: string; title: string; source_name: string; source_type: string; brief_summary: string } | null
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
            ${s.brief_summary ? `<p style="font-size:13px;color:#5f6368;line-height:1.65;margin:0;">${s.brief_summary}</p>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  // Tracker Pulse section
  let trackerSection = "";
  if (trackerData) {
    const slugLabel = trackerData.tracker_slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    trackerSection = `
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #e8eaed;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1d6fa4;margin-bottom:12px;">Tracker Pulse</div>
            <div style="font-size:15px;font-weight:600;color:#202124;margin-bottom:6px;">${slugLabel}: ${trackerData.score}/10 — ${trackerData.momentum_direction}</div>
            <p style="font-size:13px;color:#5f6368;line-height:1.65;margin:0;">${trackerData.interpretation}</p>
          </td>
        </tr>`;
  }

  // From the Archive section
  let archiveSection = "";
  if (archiveStory) {
    const asc = SOURCE_COLORS[archiveStory.source_type] || SOURCE_COLORS.gov;
    archiveSection = `
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #e8eaed;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1d6fa4;margin-bottom:12px;">From the Archive</div>
            <div style="margin-bottom:6px;">
              <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${asc.color};background:${asc.bg};padding:2px 7px;border-radius:3px;">${archiveStory.source_name}</span>
              <span style="font-size:10px;font-weight:500;color:#9aa0a6;margin-left:8px;">Tideline Library</span>
            </div>
            <a href="https://www.thetideline.co/platform/story/${archiveStory.id}" style="font-size:15px;font-weight:600;color:#202124;text-decoration:none;line-height:1.4;display:block;margin-bottom:8px;">${decodeHtml(archiveStory.title)}</a>
            ${archiveStory.brief_summary ? `<p style="font-size:13px;color:#5f6368;line-height:1.65;margin:0;">${archiveStory.brief_summary}</p>` : ""}
          </td>
        </tr>`;
  }

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
        <!-- Tracker Pulse -->
        ${trackerSection}
        <!-- From the Archive -->
        ${archiveSection}
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#f8f9fa;border-top:1px solid #e8eaed;">
            <p style="font-size:13px;color:#5f6368;line-height:1.6;margin:0 0 16px;">Reply to ask a question about today's brief.</p>
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
  console.log("CRON_SECRET env:", process.env.CRON_SECRET ?
    "SET — " + process.env.CRON_SECRET.slice(0, 4) + "..." : "NOT SET");
  console.log("Auth header received:", request.headers.get("authorization"));

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const todayDate = now.toISOString().split("T")[0];
    const dateStr = fmtDate(now);

    const OCEAN_TOPICS = ["governance", "fisheries", "dsm", "shipping", "bluefinance", "conservation", "science"];
    const SOURCE_PRIORITY: Record<string, number> = { gov: 0, reg: 1, ngo: 2, esg: 3, media: 4, science: 5 };

    // ── 1. Fetch top 20 stories, prioritise by source type then significance ──
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        "id, title, link, source_name, topic, source_type, published_at, short_summary, description, significance_score"
      )
      .eq("status", "live")
      .not("short_summary", "is", null)
      .gte("published_at", h48)
      .in("topic", OCEAN_TOPICS)
      .order("significance_score", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const storyList = (stories || [])
      .filter((s) => {
        if (/air pollution/i.test(s.title)) return false;
        if (s.link && /gov\.uk\/guidance/i.test(s.link)) return false;
        return true;
      })
      .sort((a, b) => {
        const pa = SOURCE_PRIORITY[a.source_type] ?? 9;
        const pb = SOURCE_PRIORITY[b.source_type] ?? 9;
        if (pa !== pb) return pa - pb;
        return (b.significance_score || 0) - (a.significance_score || 0);
      })
      .slice(0, 5);
    console.log("Stories selected:", storyList.length, storyList.map(s => ({ title: s.title.slice(0, 50), topic: s.topic, source_type: s.source_type, published_at: s.published_at })));

    // ── 2. Generate fresh 2-sentence summaries via Haiku ──
    const allResults = await Promise.all(
      storyList.map(async (s) => {
        const briefSummary = await generateSummary(
          decodeHtml(s.title),
          s.description || s.short_summary
        );
        if (!briefSummary) return null;
        return {
          id: s.id,
          title: s.title,
          source_name: s.source_name,
          source_type: s.source_type,
          topic: s.topic,
          brief_summary: briefSummary,
        };
      })
    );
    const briefStories = allResults.filter((s): s is NonNullable<typeof s> => s !== null);

    // ── 3. Fetch archive story (gov/reg, older than 24h, high significance) ──
    let archiveStory: { id: string; title: string; source_name: string; source_type: string; brief_summary: string } | null = null;
    try {
      const { data: archiveRows } = await supabase
        .from("stories")
        .select("id, title, source_name, source_type, description, short_summary")
        .eq("status", "live")
        .in("source_type", ["gov", "reg"])
        .lt("published_at", h24)
        .order("significance_score", { ascending: false })
        .limit(1);

      if (archiveRows && archiveRows[0]) {
        const a = archiveRows[0];
        const archiveSummary = await generateSummary(
          decodeHtml(a.title),
          a.description || a.short_summary
        );
        if (archiveSummary) {
          archiveStory = {
            id: a.id,
            title: a.title,
            source_name: a.source_name,
            source_type: a.source_type,
            brief_summary: archiveSummary,
          };
        }
      }
    } catch (err) {
      console.error("[generate-brief] Archive story fetch failed:", err);
    }

    // ── 4. Fetch top accelerating velocity score (last 7 days) ──
    let trackerData: { tracker_slug: string; score: number; momentum_direction: string; interpretation: string } | null = null;
    try {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: velocityRows } = await supabase
        .from("velocity_scores")
        .select("tracker_slug, score, momentum_direction, interpretation")
        .eq("momentum_direction", "accelerating")
        .gte("calculated_at", d7)
        .order("score", { ascending: false })
        .limit(1);

      if (velocityRows && velocityRows[0]) {
        trackerData = velocityRows[0];
      }
    } catch (err) {
      console.error("[generate-brief] Velocity score fetch failed:", err);
    }

    // ── 5. Quality gate ──
    let qualityResult: { passed: boolean; failed_items: { index: number; reason: string }[]; overall_quality: string } | null = null;

    try {
      const summaryList = briefStories
        .map((s, i) => `${i + 1}. "${decodeHtml(s.title)}" — ${s.brief_summary || "(no summary)"}`)
        .join("\n");

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: [{ type: "text", text: "You are a hostile sub-editor at a financial intelligence terminal. Your only job is to catch prescriptive language and unsupported predictions. You are not a philosophy professor — if a summary states facts and consequences without prescribing action, it passes. Return JSON only. No markdown.", cache_control: { type: "ephemeral" } }],
        messages: [{
          role: "user",
          content: `Review these summaries. For each, mark pass or fail.\n\nREJECT only if:\n- Uses prescriptive language: must, should, need to, urge, call on, demand\n- Makes predictions presented as fact: "will cause", "will result in"\n- Uses pure superlatives: landmark, historic, unprecedented, crucial, vital\n\nPASS if:\n- Sentence 1 states a documented fact (institution, decision, number, date)\n- Sentence 2 states a professional consequence for a named group, even if that consequence involves market or regulatory impact\n- Phrases like "face revised valuation models" or "extends price volatility" are analytical consequence statements — these PASS\n- Specific numbers, dates, institutions = good signal\n\nReturn this exact JSON: { "passed": boolean, "failed_items": [{ "index": number, "reason": "string" }], "overall_quality": "publish"|"review"|"reject" }\n\n${summaryList}`,
        }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const cleanedGate = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
      const gateMatch = cleanedGate.match(/\{[\s\S]*\}/);
      if (!gateMatch) throw new Error("No JSON found in quality gate response");
      qualityResult = JSON.parse(gateMatch[0]);
      console.log(`[Quality Gate] Result: ${qualityResult!.overall_quality}, failed: ${qualityResult!.failed_items?.length || 0}/${briefStories.length}`);
    } catch (err) {
      console.error("[Quality Gate] Failed, proceeding with all stories:", err);
    }

    // Filter: keep only passing stories, brief passes if 3+ survive
    const failedIndices = new Set((qualityResult?.failed_items || []).map(f => f.index));
    const passingStories = briefStories.filter((_, i) => !failedIndices.has(i + 1));
    const droppedStories = briefStories.filter((_, i) => failedIndices.has(i + 1));
    const failedCount = droppedStories.length;

    if (droppedStories.length > 0) {
      console.log("[Quality Gate] Dropped stories:", droppedStories.map(s => s.title.slice(0, 50)));
    }
    console.log(`[Quality Gate] ${passingStories.length} passing, ${droppedStories.length} dropped`);

    const overallQuality = passingStories.length >= 3 ? "publish" : passingStories.length > 0 ? "review" : "reject";

    // Log quality result
    await supabase.from("brief_quality_log").insert({
      date: todayDate,
      overall_quality: overallQuality,
      failed_count: failedCount,
      raw_feedback: qualityResult ? JSON.stringify(qualityResult) : null,
    });

    // If fewer than 3 passing stories: reject, send alert, return
    if (overallQuality === "reject") {
      console.log("[Quality Gate] Brief REJECTED — fewer than 3 passing stories. Sending alert.");
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Tideline <luke@thetideline.co>",
            to: "lukedmcmillan@hotmail.com",
            subject: `Brief REJECTED \u2014 ${dateStr}`,
            html: `<div style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;">
              <h2 style="color:#D93025;margin:0 0 12px;">Brief rejected by quality gate</h2>
              <p style="color:#3C4043;font-size:14px;line-height:1.6;">${failedCount} of ${briefStories.length} summaries failed. Only ${passingStories.length} passed (minimum 3 required).</p>
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
        passing_count: passingStories.length,
        story_count: briefStories.length,
        date: todayDate,
      });
    }

    // ── 6. Compile HTML with passing stories only ──
    const htmlContent = compileHtml(passingStories, dateStr, trackerData, archiveStory);

    // ── 7. Upsert into brief_buffer ──
    const { error: upsertError } = await supabase
      .from("brief_buffer")
      .upsert(
        {
          date: todayDate,
          subject_line: `Tideline \u00B7 ${dateStr} \u00B7 ${passingStories.length} stories`,
          html_content: htmlContent,
          story_count: passingStories.length,
          needs_review: overallQuality === "review",
          tracker_data: trackerData,
          archive_story: archiveStory,
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
      passing_count: passingStories.length,
      story_count: briefStories.length,
      has_tracker: !!trackerData,
      has_archive: !!archiveStory,
      date: todayDate,
    });
  } catch (err) {
    console.error("FATAL:", err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : "");
    console.error("generate-brief fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
