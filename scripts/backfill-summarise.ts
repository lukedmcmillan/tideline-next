/**
 * scripts/backfill-summarise.ts
 *
 * Clears the summarise-pending backlog locally (no Vercel 60s limit).
 * Identical output shape to the cron: short_summary, full_summary,
 * confidence_score, confidence_flags, controversy_score/label/reason,
 * entity matching, summarise_status, failure tracking.
 *
 * Point-in-time rule: processed_at stamped NOW so downstream consumers
 * know this was a backfill, not real-time processing.
 *
 * Usage (Node 24+ --env-file loads vars before module init):
 *   node --env-file=.env.local --import tsx scripts/backfill-summarise.ts
 *   node --env-file=.env.local --import tsx scripts/backfill-summarise.ts --limit=100
 *   node --env-file=.env.local --import tsx scripts/backfill-summarise.ts --dry-run
 *
 * Rate: ~2 stories/min. Full 2,800 backlog takes ~24h.
 * Idempotent: safe to restart. Failed stories get failure_count++.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { scoreConfidence } from "../app/lib/confidence";
import { matchEntitiesToStory } from "../lib/entity-matching";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find(a => a.startsWith("--limit="))?.split("=")[1] || "0") || Infinity;
const DRY_RUN = args.includes("--dry-run");
const BATCH_SIZE = 50;
const DELAY_MS = 1000; // 1s between stories to be gentle on Jina/Haiku

// ─── Helpers (mirrored from summarise-pending cron) ──────────────────────────

const ACADEMIC_DOMAINS = [
  "nature.com", "science.org", "journals.plos.org",
  "onlinelibrary.wiley.com", "springer.com", "tandfonline.com", "jstor.org",
  "frontiersin.org", "mdpi.com", "academic.oup.com", "cell.com", "pnas.org", "ices.dk",
];

const PAYWALLED_DOMAINS = [
  "bloomberg.com", "ft.com", "wsj.com", "economist.com",
  "thetimes.co.uk", "telegraph.co.uk", "intrafish.com",
  "undercurrentnews.com", "seafoodsource.com", "sciencedirect.com",
  "lloydslist.com", "tradewindsnews.com",
];

function isAcademicPaper(url: string): boolean {
  return ACADEMIC_DOMAINS.some(d => url.includes(d));
}

function isPaywalled(url: string): boolean {
  return PAYWALLED_DOMAINS.some(d => url.includes(d));
}

function extractAbstract(html: string): string | null {
  const patterns = [
    /<div[^>]*class="[^"]*abstract[^"]*"[^>]*>\s*<h2[^>]*>Abstract<\/h2>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 100) return text;
    }
  }
  return null;
}

async function scrapeMetaDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Tideline/1.0 (+https://thetideline.co)", "Range": "bytes=0-10240" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok && res.status !== 206) return "";
    const html = await res.text();
    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+property=["']og:description["']/i)?.[1];
    if (ogDesc) return ogDesc.trim();
    const metaDesc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+name=["']description["']/i)?.[1];
    return metaDesc?.trim() ?? "";
  } catch { return ""; }
}

async function fetchArticleText(url: string): Promise<string | null> {
  if (process.env.JINA_API_KEY) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          "Authorization": `Bearer ${process.env.JINA_API_KEY}`,
          "Accept": "text/plain",
          "X-Return-Format": "markdown",
          "X-Timeout": "8",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const text = await res.text();
        const cleaned = text.replace(/^Title:.*\n/m, "").replace(/^URL Source:.*\n/m, "").replace(/^Markdown Content:\n/m, "").trim();
        if (cleaned.length > 200) return cleaned.slice(0, 8000);
      }
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Tideline/1.0; +https://thetideline.co)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ").trim();
    return text.length > 100 ? text.slice(0, 20000) : null;
  } catch { return null; }
}

async function summariseStory(story: { title: string; link: string; source_name: string; description: string | null }): Promise<{ short_summary: string; full_summary: string }> {
  if (isAcademicPaper(story.link)) {
    try {
      const res = await fetch(story.link, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Tideline/1.0)" }, signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const abstract = extractAbstract(await res.text());
        if (abstract) {
          const short_summary = abstract.slice(0, 300).trim() + (abstract.length > 300 ? "..." : "");
          return { short_summary, full_summary: abstract };
        }
      }
    } catch { /* fall through */ }
  }

  let articleText: string | null = null;
  if (isPaywalled(story.link)) {
    articleText = await scrapeMetaDescription(story.link);
  } else {
    articleText = await fetchArticleText(story.link);
    if (!articleText || articleText.length < 200) {
      const meta = await scrapeMetaDescription(story.link);
      if (meta) articleText = meta;
    }
  }
  if ((!articleText || articleText.length < 80) && story.description) {
    articleText = story.description;
  }
  if (!articleText || articleText.length < 80) {
    return {
      short_summary: "Summary unavailable. Full article text could not be retrieved. Visit the original source directly.",
      full_summary: "Summary unavailable. Full article text could not be retrieved. Visit the original source directly.",
    };
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content: [
      { type: "text", text: `You are a factual intelligence editor at Tideline, an ocean and marine policy briefing platform. Readers are sector experts: NGO policy teams, corporate ESG leads, shipping compliance officers, blue finance investors, and ocean researchers.

STRICT ACCURACY RULES:
- Base every factual claim solely on the article content above. Nothing else.
- Do not add locations, funding totals, customer sectors, or specs unless explicitly stated.
- Preserve exact technical terminology. Do not generalise specialist terms.
- Do not use background knowledge. If it is not in the article, it does not exist for this brief.
- No hedging: "it appears", "it seems"
- No filler: state significance directly
- No em dashes
- Declarative sentences only

SHORT SUMMARY (2 sentences max):
Sentence 1: what happened, grounded in the article.
Sentence 2: the single most professionally significant detail from the article body.

FULL SUMMARY (max 150 words, plain text, no bullet points):
Do NOT begin with the same sentence as the short summary. Cover three things in order:
1. What caused this development, based only on information in the article.
2. What it means for the relevant industry or policy area.
3. One specific thing a professional should watch next, only if the article explicitly mentions it.

Respond in this exact JSON format with no markdown:
{"short_summary":"...","full_summary":"..."}`, cache_control: { type: "ephemeral" } },
      { type: "text", text: `Article title: "${story.title}"\nSource: ${story.source_name}\nURL: ${story.link}\n\nARTICLE CONTENT:\n${articleText}` },
    ] }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  return { short_summary: parsed.short_summary, full_summary: parsed.full_summary };
}

async function scoreControversy(story: { id: string; title: string; source_name: string; short_summary: string }): Promise<{ score: number; label: string; reason: string }> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: [{ type: "text", text: `You score the controversy level of ocean governance stories. Return JSON only. No markdown.

controversy_domain_score: 0-10. Is the underlying governance topic actively disputed among authoritative actors?
controversy_framing_score: 0-10. Does this specific story present competing positions or signal active dispute?
controversy_reason: one sentence explaining the score.

Return: {"controversy_domain_score": number, "controversy_framing_score": number, "controversy_reason": "string"}`, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Title: "${story.title}"\nSource: ${story.source_name}\n\nSummary: ${story.short_summary}` }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const domain = Math.max(0, Math.min(10, Math.round((parsed.controversy_domain_score || 0) * 10) / 10));
    const framing = Math.max(0, Math.min(10, Math.round((parsed.controversy_framing_score || 0) * 10) / 10));
    const composite = Math.round((domain * 0.60 + framing * 0.40) * 10) / 10;
    let label = "SETTLED";
    if (composite >= 8.0) label = "DISPUTED";
    else if (composite >= 6.0) label = "CONTESTED";
    else if (composite >= 3.0) label = "DEVELOPING";
    return { score: composite, label, reason: String(parsed.controversy_reason || "").slice(0, 500) };
  } catch {
    return { score: 0, label: "SETTLED", reason: "" };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Backfill summarise-pending ===`);
  console.log(`Limit: ${LIMIT === Infinity ? "ALL" : LIMIT}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  let totalProcessed = 0;
  let totalFailed = 0;
  let totalEntities = 0;
  const startTime = Date.now();

  while (totalProcessed + totalFailed < LIMIT) {
    const batchLimit = Math.min(BATCH_SIZE, LIMIT - totalProcessed - totalFailed);

    const { data: pending, error } = await supabase
      .from("stories")
      .select("id, title, link, source_name, description")
      .is("short_summary", null)
      .is("quarantined_at", null)
      .neq("summarise_status", "failed")
      .order("published_at", { ascending: false })
      .limit(batchLimit);

    if (error) { console.error("Query error:", error.message); break; }
    if (!pending || pending.length === 0) { console.log("No more pending stories."); break; }

    console.log(`\nBatch: ${pending.length} stories`);

    for (const story of pending) {
      const storyStart = Date.now();
      try {
        if (!story.link) {
          if (!DRY_RUN) {
            await supabase.from("stories").update({
              summarise_status: "failed",
              failure_count: 1,
              last_failure_reason: "missing_link",
            }).eq("id", story.id);
          }
          totalFailed++;
          console.log(`  SKIP (no link): ${story.title?.slice(0, 60)}`);
          continue;
        }

        if (DRY_RUN) {
          console.log(`  DRY: ${story.title?.slice(0, 60)}`);
          totalProcessed++;
          continue;
        }

        // Summarise
        const { short_summary, full_summary } = await summariseStory(story);

        // Confidence
        const { score, flags } = await scoreConfidence({ short_summary, full_summary, title: story.title, source_name: story.source_name });
        const status = score >= 7 ? "live" : "pending_review";

        // Controversy
        const controversy = await scoreControversy({ id: story.id, title: story.title, source_name: story.source_name, short_summary });

        // Write — identical columns to cron, plus backfill metadata
        await supabase.from("stories").update({
          short_summary,
          full_summary,
          confidence_score: score,
          confidence_flags: flags,
          status,
          controversy_score: controversy.score,
          controversy_label: controversy.label,
          controversy_reason: controversy.reason,
          summarise_status: "done",
          failure_count: 0,
          last_failure_reason: null,
        }).eq("id", story.id);

        // Entity matching
        try {
          const matchResult = await matchEntitiesToStory(story.id);
          if (matchResult.matched > 0) totalEntities += matchResult.matched;
        } catch (e) {
          console.error(`  Entity match error for ${story.id}:`, e instanceof Error ? e.message : e);
        }
        await supabase.from("stories").update({ entities_extracted: true }).eq("id", story.id);

        totalProcessed++;
        const elapsed = Date.now() - storyStart;
        console.log(`  OK (${elapsed}ms): ${story.title?.slice(0, 60)}`);

      } catch (err) {
        totalFailed++;
        const reason = err instanceof Error ? err.message : String(err);
        console.error(`  FAIL: ${story.title?.slice(0, 50)} — ${reason.slice(0, 100)}`);

        // Increment failure_count so it drops out after 3 failures
        const { data: current } = await supabase
          .from("stories")
          .select("failure_count")
          .eq("id", story.id)
          .single();
        const newCount = (current?.failure_count || 0) + 1;
        await supabase.from("stories").update({
          failure_count: newCount,
          last_failure_reason: reason.slice(0, 500),
          summarise_status: newCount >= 3 ? "failed" : "pending",
        }).eq("id", story.id);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== Complete ===`);
  console.log(`Processed: ${totalProcessed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Entities matched: ${totalEntities}`);
  console.log(`Time: ${totalTime}s`);
  console.log(`Rate: ${(totalProcessed / (parseInt(totalTime) || 1) * 60).toFixed(0)} stories/min`);
}

main().catch(console.error);
