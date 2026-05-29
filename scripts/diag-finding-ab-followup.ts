/**
 * Finding A+B follow-up — fixes two gaps in diag-finding-ab.ts:
 *  1. B3 re-run: brief_buffer query without generated_at (non-existent column was causing silent null return)
 *  2. B2 re-run: total story count since May 22 including those WITHOUT short_summary
 *  3. summarise-pending: check last-written short_summaries to determine if cron is stalled
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROMPT_VERSION = "f6491a2171c78bdf";

async function main() {
  // ── B2 revisited: all live stories since May 22, with and without short_summary ──
  console.log("=".repeat(80));
  console.log("B2 REVISITED — total story ingestion since May 22");
  console.log("=".repeat(80));

  const { data: allSince, error: e1 } = await s
    .from("stories")
    .select("id, title, topic, significance_score, published_at, short_summary, status")
    .gte("published_at", "2026-05-22T00:00:00Z")
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(300);

  if (e1) { console.error("Error:", e1.message); }
  else {
    const withSummary    = (allSince ?? []).filter(s => s.short_summary);
    const withoutSummary = (allSince ?? []).filter(s => !s.short_summary);
    console.log(`Total live stories published since May 22:  ${allSince?.length ?? 0}`);
    console.log(`  With short_summary:    ${withSummary.length}`);
    console.log(`  Without short_summary: ${withoutSummary.length}`);

    // Day-by-day breakdown
    const byDay: Record<string, { total: number; withSummary: number }> = {};
    for (const story of allSince ?? []) {
      const day = story.published_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { total: 0, withSummary: 0 };
      byDay[day].total++;
      if (story.short_summary) byDay[day].withSummary++;
    }
    console.log("\n  Per-day breakdown (total | with_summary):");
    for (const [day, counts] of Object.entries(byDay).sort()) {
      console.log(`    ${day}: ${counts.total.toString().padStart(3)} total, ${counts.withSummary.toString().padStart(3)} with summary`);
    }

    // How many of the since-May-22 stories are classified?
    const ids = (allSince ?? []).map(s => s.id);
    if (ids.length > 0) {
      const { data: classified } = await s
        .from("delta_classifications")
        .select("story_id")
        .in("story_id", ids)
        .eq("prompt_version", PROMPT_VERSION);
      const clsSet = new Set((classified ?? []).map(r => r.story_id));
      console.log(`\n  Classified under v:${PROMPT_VERSION}: ${clsSet.size} / ${ids.length}`);
    }
  }

  // ── B3 revisited: brief_buffer without generated_at ─────────────────────────
  console.log("\n" + "=".repeat(80));
  console.log("B3 REVISITED — brief_buffer rows (without generated_at select)");
  console.log("=".repeat(80));

  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const d2ago     = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
  const d3ago     = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
  const d4ago     = new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0];

  for (const dateStr of [today, yesterday, d2ago, d3ago, d4ago]) {
    const { data: buf, error: be } = await s
      .from("brief_buffer")
      .select("date, story_count, stories")
      .eq("date", dateStr)
      .maybeSingle();

    if (be) {
      console.log(`  ${dateStr}: query error — ${be.message}`);
      continue;
    }
    if (!buf) {
      console.log(`  ${dateStr}: no brief_buffer row`);
      continue;
    }

    const pool = buf.stories as {
      candidate_stories?: { id: string; published_at: string; topic: string; significance_score: number }[];
      work_revealed_count?: { candidate_count: number; filtered_count: number };
      generated_at?: string;
    };
    const candidates = pool?.candidate_stories ?? [];
    const workReveal  = pool?.work_revealed_count;
    const genAt       = pool?.generated_at ?? "unknown (not in JSONB)";

    console.log(`  ${dateStr}: ${candidates.length} candidates | story_count=${buf.story_count} | generated_at=${genAt}`);
    if (workReveal) {
      console.log(`    work_revealed: candidate_count=${workReveal.candidate_count}, filtered_count=${workReveal.filtered_count}`);
    }

    if (candidates.length > 0) {
      // Classification coverage of this pool
      const poolIds = candidates.map(c => c.id);
      const { data: poolCls } = await s
        .from("delta_classifications")
        .select("story_id, category")
        .in("story_id", poolIds)
        .eq("prompt_version", PROMPT_VERSION);

      const clsMap = new Map((poolCls ?? []).map(r => [r.story_id, r.category as string]));
      const gcCount         = [...clsMap.values()].filter(c => c === "GOVERNANCE_CHANGE").length;
      const unclassifiedCount = candidates.filter(c => !clsMap.has(c.id)).length;

      const catDist: Record<string, number> = {};
      for (const cat of clsMap.values()) {
        catDist[cat] = (catDist[cat] ?? 0) + 1;
      }

      console.log(`    Pool classification: ${clsMap.size} classified, ${unclassifiedCount} unclassified, ${gcCount} GOVERNANCE_CHANGE`);
      for (const [cat, n] of Object.entries(catDist).sort((a, b) => b[1] - a[1])) {
        console.log(`      ${cat}: ${n}`);
      }

      // Date range of stories in pool
      const dates = candidates.map(c => c.published_at).sort();
      console.log(`    Story date range in pool: ${dates[0]?.slice(0, 10)} → ${dates[dates.length - 1]?.slice(0, 10)}`);
    }
  }

  // ── summarise-pending health: when was the last short_summary written? ───────
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARISE-PENDING HEALTH — last short_summary writes");
  console.log("=".repeat(80));

  // Proxy: find stories with short_summary, ordered by published_at desc, to see
  // if summarisation stopped at a particular date
  const { data: latestSummarised } = await s
    .from("stories")
    .select("id, title, topic, published_at, short_summary")
    .eq("status", "live")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(10);

  console.log("\n  10 most recently published stories that have a short_summary:");
  for (const st of latestSummarised ?? []) {
    console.log(`    ${st.published_at.slice(0, 16)} [${st.topic}] ${st.title.slice(0, 80)}`);
  }

  // What are the most recently PUBLISHED stories (regardless of summary)?
  const { data: latestStories } = await s
    .from("stories")
    .select("id, title, topic, published_at, short_summary, status")
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(10);

  console.log("\n  10 most recently published live stories (any summary status):");
  for (const st of latestStories ?? []) {
    const hasSummary = st.short_summary ? "has_summary" : "NO_SUMMARY";
    console.log(`    ${st.published_at.slice(0, 16)} [${st.topic}] ${hasSummary}  ${st.title.slice(0, 80)}`);
  }
}

main().catch(console.error);
