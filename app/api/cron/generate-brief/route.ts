import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { decodeHtml } from "@/app/lib/html";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SUMMARY_SYSTEM_PROMPT =
  'You are a senior analyst at a financial intelligence terminal. Write exactly two sentences as JSON.\n\nRules:\n- Sentence 1: Name the institution. State the specific decision, document, or finding. Include numbers, dates, or references where available.\n- Sentence 2: State the consequence for the most relevant professional group given this specific story. Choose the single most affected group from: maritime lawyers, ESG analysts, shipping compliance teams, ocean investors, NGO policy directors, fisheries regulators. Pick the ONE group most affected by this specific story. Do not default to ocean investors for every story. Name the group. State what specifically changes for them.\n- Never use: must, should, need to, crucial, important, landmark, historic, significant\n- Never prescribe action. Analyse consequence.\n- Only use numbers, statistics, and specific references that appear explicitly in the story title or description provided. If the source contains no specific figures, do not invent them. Write sentence 1 based only on what is stated in the input.\n- Model tone: FT Alphaville data note.\n\nReturn JSON only: {"sentence1": "...", "sentence2": "..."} Sentence 1 must not repeat or paraphrase the headline. The headline states what happened. Sentence 1 must add new information: a specific number, date, named institution, or direct quote. If the headline already states the fact, sentence 1 must state the context or background instead.';

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
      system: [{ type: "text", text: SUMMARY_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
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

function stripDashes(s: string): string {
  return s.replace(/\u2014/g, ".").replace(/\u2013/g, ".").replace(/ - /g, ". ");
}

function condColor(score: number): { name: string; text: string } {
  if (score > 7) return { name: "#1D9E75", text: "#6BBFA0" };
  if (score >= 4) return { name: "#EF9F27", text: "#C4924A" };
  return { name: "#E24B4A", text: "#C06060" };
}

function bandLabel(score: number): string {
  if (score > 7) return "ACTIVE";
  if (score >= 4) return "WATCH";
  return "SLOW";
}

function pulseBand(score: number): { bg: string; color: string; label: string } {
  if (score >= 7) return { bg: "#E8F7F2", color: "#1D9E75", label: "ELEVATED" };
  if (score >= 4) return { bg: "#FEF3E2", color: "#EF9F27", label: "WATCH" };
  return { bg: "#FDEAEA", color: "#E24B4A", label: "LOW" };
}

function compileHtml(
  stories: { id: string; title: string; source_name: string; source_type: string; topic: string; brief_summary: string }[],
  dateStr: string,
  trackerData: { tracker_slug: string; score: number; momentum_direction: string; interpretation: string } | null,
  archiveStory: { id: string; title: string; source_name: string; source_type: string; brief_summary: string } | null,
  conditions: { tracker_slug: string; score: number; interpretation: string }[]
): string {
  const F = "'DM Sans',Arial,sans-serif";

  /* ── CONDITIONS BAR ── */
  const conditionsRows = conditions.slice(0, 3).map(c => {
    const col = condColor(c.score);
    const slug = c.tracker_slug.replace(/-/g, " ").replace(/_/g, " ").toUpperCase();
    return `<tr>
      <td style="font-family:${F};font-size:11px;font-weight:700;color:${col.name};letter-spacing:0.1em;text-transform:uppercase;padding:0 12px 4px 0;white-space:nowrap;vertical-align:top;">${slug}</td>
      <td style="font-family:${F};font-size:13px;color:#3D4F63;padding:0 0 4px 0;line-height:1.5;">${stripDashes(c.interpretation || "")}</td>
    </tr>`;
  }).join("");

  const conditionsBar = conditions.length > 0
    ? `<tr><td style="padding:14px 28px;border-bottom:1px solid #EAECEF;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.15em;text-transform:uppercase;padding-bottom:8px;">CONDITIONS THIS MORNING</td></tr>
          <tr><td>
            <table cellpadding="0" cellspacing="0">${conditionsRows}</table>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  /* ── STORY CARDS ── */
  const storyCards = stories.map((s, i) => {
    const title = decodeHtml(s.title);
    const summary = stripDashes(s.brief_summary || "");
    const isLast = i === stories.length - 1;
    const borderBottom = isLast ? "" : "border-bottom:1px solid #F0F3F7;";
    return `<tr>
      <td style="padding:16px 28px;${borderBottom}">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="3" style="background:#1D9E75;vertical-align:top;"></td>
            <td style="padding-left:14px;">
              <a href="https://www.thetideline.co/platform/story/${s.id}" style="font-family:${F};font-size:15px;font-weight:600;color:#0B1628;text-decoration:none;line-height:1.4;display:block;margin-bottom:5px;">${title}</a>
              <div style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">${s.source_name}</div>
              ${summary ? `<p style="font-family:${F};font-size:13px;color:#5A7290;line-height:1.7;margin:0;">${summary}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");

  /* ── PULSE ── */
  let pulseSection = "";
  if (trackerData) {
    const slugLabel = trackerData.tracker_slug.replace(/-/g, " ").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const band = pulseBand(trackerData.score);
    pulseSection = `<tr><td style="background:#F8F9FA;padding:16px 28px;border-top:1px solid #EAECEF;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.15em;text-transform:uppercase;padding-bottom:10px;">PULSE</td></tr>
        <tr><td>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:${F};font-size:13px;font-weight:500;color:#3D4F63;padding-right:10px;vertical-align:middle;">${slugLabel}</td>
              <td style="font-family:${F};font-size:22px;font-weight:700;color:#1D9E75;padding-right:10px;vertical-align:middle;">${trackerData.score}</td>
              <td style="vertical-align:middle;"><span style="font-family:${F};font-size:10px;font-weight:600;color:${band.color};text-transform:uppercase;letter-spacing:0.14em;background:${band.bg};padding:2px 8px;border-radius:2px;">${band.label}</span></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="font-family:${F};font-size:13px;color:#8BA0BC;line-height:1.5;padding-top:5px;">${stripDashes(trackerData.interpretation || "")}</td></tr>
      </table>
    </td></tr>`;
  }

  /* ── ARCHIVE ── */
  let archiveSection = "";
  if (archiveStory) {
    archiveSection = `<tr><td style="background:#F8F9FA;padding:16px 28px;border-top:1px solid #EAECEF;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.15em;text-transform:uppercase;padding-bottom:8px;">FROM THE TIDELINE LIBRARY</td></tr>
        <tr><td>
          <a href="https://www.thetideline.co/platform/story/${archiveStory.id}" style="font-family:${F};font-size:14px;font-weight:600;color:#0B1628;text-decoration:none;line-height:1.4;display:block;margin-bottom:5px;">${decodeHtml(archiveStory.title)}</a>
          <div style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:5px;">${archiveStory.source_name}</div>
          ${archiveStory.brief_summary ? `<p style="font-family:${F};font-size:13px;color:#5A7290;line-height:1.6;margin:0;">${stripDashes(archiveStory.brief_summary)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${F};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <!-- HEADER -->
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
        ${conditionsBar}
        <!-- STORIES -->
        ${storyCards}
        ${pulseSection}
        ${archiveSection}
        <!-- FOOTER -->
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

export async function GET(request: Request) {
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
    const NON_EN_PATTERN = /\b(les|des|une|dans|pour|sur|aux|est|sont|avec|qui|que|cette|tout|leurs|d'|l'|du|au|en\s+vue|selon|relatif|portant|arr[eê]t[eé]|d[eé]cret|r[eè]glement|loi\s+n)/i;
    try {
      const { data: archiveRows } = await supabase
        .from("stories")
        .select("id, title, source_name, source_type, description, short_summary")
        .eq("status", "live")
        .in("source_type", ["gov", "reg"])
        .lt("published_at", h24)
        .order("significance_score", { ascending: false })
        .limit(5);

      // Find the first English-titled archive story
      const archiveCandidates = (archiveRows || []).filter(r => !NON_EN_PATTERN.test(r.title));
      const a = archiveCandidates[0];
      if (a) {
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

    // ── 4. Fetch velocity scores (top 3 for conditions bar, top 1 accelerating for pulse) ──
    let trackerData: { tracker_slug: string; score: number; momentum_direction: string; interpretation: string } | null = null;
    let conditions: { tracker_slug: string; score: number; interpretation: string }[] = [];
    try {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Top 3 by score for conditions bar (most recent per tracker, then sorted by score)
      const { data: condRows } = await supabase
        .from("velocity_scores")
        .select("tracker_slug, score, interpretation, calculated_at")
        .gte("calculated_at", d7)
        .order("calculated_at", { ascending: false })
        .limit(30);
      // Deduplicate: keep only the most recent row per tracker_slug
      const seenSlugs = new Set<string>();
      const dedupedConds = (condRows || []).filter(r => {
        if (seenSlugs.has(r.tracker_slug)) return false;
        seenSlugs.add(r.tracker_slug);
        return true;
      });
      // Sort by score desc, take top 3
      conditions = dedupedConds
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);

      // Top 1 accelerating for pulse
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

    const overallQuality = passingStories.length > 0 ? "publish" : archiveStory ? "publish" : "reject";

    // Log quality result
    await supabase.from("brief_quality_log").insert({
      date: todayDate,
      overall_quality: overallQuality,
      failed_count: failedCount,
      raw_feedback: qualityResult ? JSON.stringify(qualityResult) : null,
    });

    // If zero passing stories AND no archive story: reject
    if (overallQuality === "reject") {
      console.log("[Quality Gate] Brief REJECTED — zero passing stories and no archive. Sending alert.");
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
    const htmlContent = compileHtml(passingStories, dateStr, trackerData, archiveStory, conditions);

    // ── 7. Upsert into brief_buffer ──
    const { error: upsertError } = await supabase
      .from("brief_buffer")
      .upsert(
        {
          date: todayDate,
          subject_line: `Tideline \u00B7 ${dateStr} \u00B7 ${passingStories.length} stories`,
          html_content: htmlContent,
          story_count: passingStories.length,
          needs_review: false,
          tracker_data: trackerData,
          archive_story: archiveStory,
          conditions,
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
