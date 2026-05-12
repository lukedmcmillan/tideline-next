import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { decodeHtml } from "@/app/lib/html";
import { fmtDate } from "@/app/lib/brief/utils";
import {
  fetchCandidateStories,
  fetchTrackerScores,
  fetchUpcomingEvents,
  type StoryRow,
} from "@/app/lib/brief/select";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// All topic values present in the stories table + 'conservation' for TRACKER_TO_TOPICS compat
const OCEAN_TOPICS = [
  "governance", "fisheries", "dsm", "shipping", "bluefinance", "conservation",
  "science", "iuu", "mpa", "climate", "all", "whales", "coral", "pollution",
  "acidification", "technology",
];

// All tracker slugs — hardcoded, tracker set is stable
const ALL_TRACKER_SLUGS = [
  "bbnj", "isa", "imo-shipping", "30x30", "iuu", "wto-fisheries",
  "cites-marine", "blue-finance", "plastics", "offshore-wind", "governance",
];

// ── Haiku summarisation prompt ────────────────────────────────────────────────
// Voice: operator register, brevity as epistemic restraint, no hedge narration.
const SUMMARY_SYSTEM_PROMPT =
  'You are summarising an ocean governance story for a daily intelligence brief read on mobile by professionals (compliance leads, marine lawyers, ESG analysts, fund managers).\n\nOutput exactly two sentences:\n- Sentence 1: what the source says happened, named entities and dates preserved. Use the source\'s own language for what kind of action it is (guidance, ruling, ratification, decision, consultation, paper, etc.). Never escalate: if the source says guidance, write guidance.\n- Sentence 2: pick ONE in priority order — (a) the specific concrete change described (named dates, named obligations, named numbers); (b) the named next event or decision point (next committee session, next vote, next ratification deadline); (c) the named entity or jurisdiction primarily affected, stated factually; (d) if none apply, one additional named fact from the source (who issued it, where, when) in under 15 words. STOP after writing it. Do NOT write that specifics are unclear, that details are unavailable, or that the source does not say more. Brevity is restraint. Never narrate what the source omits.\n\nBanned phrases (never use under any circumstances): \'face expanded requirements\', \'face revised enforcement protocols\', \'requires repricing of assets\', \'operational calendar they must supervise\', \'face uncertainty over\', \'bifurcating compliance requirements\', \'now face\', \'remain unclear from the source\', \'are not detailed in the available text\', \'the source does not specify\', \'further specifics are not available\', any clause containing unclear/unavailable/not detailed/not specified as a hedge. No em dashes.\n\nUse named entities. Each sentence under 30 words. No preamble.\n\nReturn JSON only: {"sentence1": "...", "sentence2": "..."}';

// ── Quality gate prompt (preserved exactly, regulatory carve-out intact) ──────
const QUALITY_GATE_SYSTEM =
  "You are a hostile sub-editor at a financial intelligence terminal. Your only job is to catch prescriptive language and unsupported predictions. You are not a philosophy professor — if a summary states facts and consequences without prescribing action, it passes. Return JSON only. No markdown.";

const QUALITY_GATE_USER_PREFIX =
  `Review these summaries. For each, mark pass or fail.\n\nREJECT only if:\n- Uses prescriptive language DIRECTED AT THE READER or unnamed companies: must, should, need to, urge, call on, demand\n- Makes predictions presented as fact: "will cause", "will result in"\n- Uses pure superlatives: landmark, historic, unprecedented, crucial, vital\n\nIMPORTANT — do NOT reject for regulatory descriptions. Words like "requires", "mandates", "obliges", "calls for" used to describe what a regulation, treaty, or agreement does TO third parties (signatories, flag states, operators) are factual reporting, not prescriptive language. Example: "The regulation requires flag states to submit reports" is a FACT about the regulation — PASS. Only reject if the summary is telling the reader or unnamed actors what they personally must do.\n\nPASS if:\n- Sentence 1 states a documented fact (institution, decision, number, date)\n- Sentence 2 states a professional consequence for a named group, even if that consequence involves market or regulatory impact\n- Phrases like "face revised valuation models" or "extends price volatility" are analytical consequence statements — these PASS\n- Specific numbers, dates, institutions = good signal\n- Regulatory language describing what a law/treaty does = factual = PASS\n\nReturn this exact JSON: { "passed": boolean, "failed_items": [{ "index": number, "reason": "string" }], "overall_quality": "publish"|"review"|"reject" }\n\n`;

async function generateSummary(
  title: string,
  description: string | null
): Promise<string | null> {
  if (!description || description.trim().length === 0) {
    console.log(`[generate-brief] Skipping "${title.slice(0, 60)}" — no description to summarise`);
    return null;
  }

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: [{ type: "text", text: SUMMARY_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Respond with JSON only. Story: Title: ${title}\n\nDescription: ${description}` }],
    });
    const rawText = res.content[0].type === "text" ? res.content[0].text.trim() : "";

    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in summary response");
      const parsed = JSON.parse(jsonMatch[0]);
      return `${parsed.sentence1} ${parsed.sentence2}`;
    } catch {
      if (rawText.length > 20 && rawText.includes(".")) {
        return rawText;
      }
      return null;
    }
  } catch (err) {
    console.error(`[generate-brief] Summary failed for "${title.slice(0, 60)}":`, err);
    return null;
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
    const dateStr = fmtDate(now);

    // ── 1. Fetch candidate pool (parallel) ───────────────────────────────────
    const [candidatePool, allTrackerScores, allEvents] = await Promise.all([
      fetchCandidateStories(supabase, OCEAN_TOPICS, 168), // 7-day window
      fetchTrackerScores(supabase, ALL_TRACKER_SLUGS),
      fetchUpcomingEvents(supabase, 14),
    ]);
    console.log(
      `[generate-brief] Pool: ${candidatePool.length} stories, ` +
      `${allTrackerScores.length} trackers, ${allEvents.length} events`
    );

    // ── 2. Pre-summarise with Haiku (up to 60 stories, parallel) ─────────────
    const allResults = await Promise.all(
      candidatePool.map(async (s) => {
        const summary = await generateSummary(
          decodeHtml(s.title),
          s.description || s.short_summary || null
        );
        // Fall back to existing DB summary if Haiku fails (API outage / credit error)
        const finalSummary = summary || s.short_summary || null;
        if (!finalSummary) return null;
        return { ...s, short_summary: finalSummary } as StoryRow;
      })
    );
    const summarisedStories = allResults.filter((s): s is StoryRow => s !== null);
    console.log(`[generate-brief] Summarised: ${summarisedStories.length}/${candidatePool.length} stories`);

    // ── 3. Quality gate (preserved exactly, max_tokens raised to 1500) ────────
    let qualityResult: {
      passed: boolean;
      failed_items: { index: number; reason: string }[];
      overall_quality: string;
    } | null = null;

    try {
      const summaryList = summarisedStories
        .map((s, i) => `${i + 1}. "${decodeHtml(s.title)}" — ${s.short_summary || "(no summary)"}`)
        .join("\n");

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500, // raised from 800 to handle up to 60 stories
        system: [{ type: "text", text: QUALITY_GATE_SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: QUALITY_GATE_USER_PREFIX + summaryList }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const cleanedGate = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
      const gateMatch = cleanedGate.match(/\{[\s\S]*\}/);
      if (!gateMatch) throw new Error("No JSON found in quality gate response");
      qualityResult = JSON.parse(gateMatch[0]);
      console.log(
        `[Quality Gate] Result: ${qualityResult!.overall_quality}, ` +
        `failed: ${qualityResult!.failed_items?.length || 0}/${summarisedStories.length}`
      );
    } catch (err) {
      console.error("[Quality Gate] Failed, proceeding with all stories:", err);
    }

    const failedIndices = new Set((qualityResult?.failed_items || []).map(f => f.index));
    const passingStories = summarisedStories.filter((_, i) => !failedIndices.has(i + 1));
    const droppedStories = summarisedStories.filter((_, i) => failedIndices.has(i + 1));
    const filteredCount = droppedStories.length;

    if (droppedStories.length > 0) {
      console.log("[Quality Gate] Dropped:", droppedStories.map(s => s.title.slice(0, 50)));
    }
    console.log(`[Quality Gate] ${passingStories.length} passing, ${filteredCount} dropped`);

    const overallQuality = passingStories.length > 0 ? "publish" : "reject";

    // Log quality result
    await supabase.from("brief_quality_log").insert({
      date: todayDate,
      overall_quality: overallQuality,
      failed_count: filteredCount,
      raw_feedback: qualityResult ? JSON.stringify(qualityResult) : null,
    });

    // Reject path: zero passing stories — preserved exactly
    if (overallQuality === "reject") {
      console.log("[Quality Gate] Brief REJECTED — zero passing stories. Sending alert.");
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
              <p style="color:#3C4043;font-size:14px;line-height:1.6;">${filteredCount} of ${summarisedStories.length} summaries failed. Zero passing stories.</p>
              <h3 style="color:#202124;font-size:14px;margin:20px 0 8px;">Failed items:</h3>
              <ul style="font-size:13px;color:#5F6368;line-height:1.7;">
                ${(qualityResult?.failed_items || []).map(f => `<li><strong>#${f.index}:</strong> ${f.reason}</li>`).join("")}
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
        failed_count: filteredCount,
        passing_count: 0,
        story_count: summarisedStories.length,
        date: todayDate,
      });
    }

    // ── 4. Build JSONB payload ────────────────────────────────────────────────
    const storiesPayload = {
      candidate_stories:   passingStories,
      all_tracker_scores:  allTrackerScores,
      all_events:          allEvents,
      work_revealed_count: {
        sources:         89,
        candidate_count: candidatePool.length,
        filtered_count:  filteredCount,
      },
      generated_at: now.toISOString(),
    };

    // ── 5. Upsert brief_buffer ────────────────────────────────────────────────
    const { error: upsertError } = await supabase
      .from("brief_buffer")
      .upsert(
        {
          date:          todayDate,
          subject_line:  `Tideline \u00B7 ${dateStr}`,  // placeholder; send-brief generates per-user subject
          html_content:  null,                           // pre-rendered blob is dead
          story_count:   passingStories.length,
          needs_review:  false,
          stories:       storiesPayload,
        },
        { onConflict: "date" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      status:        "buffered",
      overall_quality: overallQuality,
      story_count:   passingStories.length,
      tracker_count: allTrackerScores.length,
      event_count:   allEvents.length,
      failed_count:  filteredCount,
      date:          todayDate,
    });
  } catch (err) {
    console.error("FATAL:", err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : "");
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
