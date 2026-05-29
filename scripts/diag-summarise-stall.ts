/**
 * Diagnoses the summarise-pending cron stall.
 * Checks cron_log for recent runs, inspects what happens to unsummarised stories,
 * and tests whether the route's story query is returning the backlog correctly.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // ── 1. cron_log — recent summarise-pending runs ──────────────────────────
  console.log("=".repeat(80));
  console.log("1. CRON_LOG — summarise-pending recent runs");
  console.log("=".repeat(80));

  const { data: cronRows, error: cronErr } = await s
    .from("cron_log")
    .select("id, created_at, agent_name, stories_processed, events_created, errors")
    .eq("agent_name", "summarise-pending")
    .order("created_at", { ascending: false })
    .limit(15);

  if (cronErr) {
    console.log(`  cron_log query error: ${cronErr.message}`);
  } else if (!cronRows || cronRows.length === 0) {
    console.log("  No cron_log rows found for summarise-pending.");
  } else {
    console.log(`  Last ${cronRows.length} runs:`);
    for (const r of cronRows) {
      const errPreview = r.errors ? String(r.errors).slice(0, 120) : null;
      console.log(`  ${r.created_at?.slice(0, 19)} | processed=${r.stories_processed} | summarised=${r.events_created} | errors=${errPreview ?? "none"}`);
    }
  }

  // ── 2. Exact query the cron uses — what would it pick up right now? ──────
  console.log("\n" + "=".repeat(80));
  console.log("2. SIMULATED CRON QUERY — what summarise-pending would fetch now");
  console.log("=".repeat(80));

  const { data: pending, error: pendingErr } = await s
    .from("stories")
    .select("id, title, link, source_name, description, status, published_at")
    .is("short_summary", null)
    .order("published_at", { ascending: false })
    .limit(50);

  if (pendingErr) {
    console.log(`  Query error: ${pendingErr.message}`);
  } else {
    console.log(`  Stories with null short_summary (limit 50): ${pending?.length ?? 0}`);
    const byStatus: Record<string, number> = {};
    for (const st of pending ?? []) {
      const status = st.status ?? "null";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    console.log("  Status breakdown:");
    for (const [status, count] of Object.entries(byStatus)) {
      console.log(`    ${status}: ${count}`);
    }
    const hasLink = (pending ?? []).filter(s => s.link).length;
    const noLink  = (pending ?? []).filter(s => !s.link).length;
    console.log(`  Has link: ${hasLink} | No link: ${noLink}`);

    const hasDesc = (pending ?? []).filter(s => s.description && s.description.length > 80).length;
    console.log(`  Has usable description (>80 chars): ${hasDesc}`);

    // Show top 5 by published_at
    console.log("  Top 5 pending by published_at (most recent):");
    for (const st of (pending ?? []).slice(0, 5)) {
      console.log(`    ${st.published_at?.slice(0, 16)} [${st.status}] ${st.title?.slice(0, 80)}`);
      if (st.description) {
        console.log(`      description: ${st.description.slice(0, 100)}`);
      }
    }
  }

  // ── 3. Total backlog of null short_summary stories ───────────────────────
  console.log("\n" + "=".repeat(80));
  console.log("3. TOTAL BACKLOG — all null short_summary stories");
  console.log("=".repeat(80));

  const { data: total, error: totalErr } = await s
    .from("stories")
    .select("id, status, published_at")
    .is("short_summary", null)
    .order("published_at", { ascending: false })
    .limit(500);

  if (totalErr) {
    console.log(`  Query error: ${totalErr.message}`);
  } else {
    const byDay: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const st of total ?? []) {
      const day = st.published_at?.slice(0, 10) ?? "unknown";
      byDay[day] = (byDay[day] ?? 0) + 1;
      const status = st.status ?? "null";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    console.log(`  Total stories with null short_summary: ${total?.length ?? 0}`);
    console.log("  By status:");
    for (const [status, count] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${status}: ${count}`);
    }
    console.log("  Per day (most recent 10 days):");
    for (const [day, count] of Object.entries(byDay).sort().reverse().slice(0, 10)) {
      console.log(`    ${day}: ${count}`);
    }
  }

  // ── 4. Stories that got 'Summary unavailable' as short_summary ──────────
  console.log("\n" + "=".repeat(80));
  console.log("4. 'SUMMARY UNAVAILABLE' count — proxy for fetch failures");
  console.log("=".repeat(80));

  const { data: unavail, error: unavailErr } = await s
    .from("stories")
    .select("id, published_at, source_name, status")
    .like("short_summary", "Summary unavailable%")
    .order("published_at", { ascending: false })
    .limit(20);

  if (unavailErr) {
    console.log(`  Query error: ${unavailErr.message}`);
  } else {
    console.log(`  Stories with 'Summary unavailable' summary: ${unavail?.length ?? 0}`);
    if (unavail && unavail.length > 0) {
      const byDay: Record<string, number> = {};
      for (const st of unavail) {
        const day = st.published_at?.slice(0, 10) ?? "unknown";
        byDay[day] = (byDay[day] ?? 0) + 1;
      }
      for (const [day, count] of Object.entries(byDay).sort().reverse().slice(0, 7)) {
        console.log(`    ${day}: ${count}`);
      }
    }
  }

  // ── 5. Confidence score distribution — are stories getting low scores? ───
  console.log("\n" + "=".repeat(80));
  console.log("5. STATUS BREAKDOWN — all stories published since May 22");
  console.log("=".repeat(80));

  const { data: recent, error: recentErr } = await s
    .from("stories")
    .select("id, status, confidence_score, published_at, short_summary")
    .gte("published_at", "2026-05-22T00:00:00Z")
    .order("published_at", { ascending: false })
    .limit(300);

  if (recentErr) {
    console.log(`  Query error: ${recentErr.message}`);
  } else {
    const byStatus: Record<string, number> = {};
    for (const st of recent ?? []) {
      const status = st.status ?? "null";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    console.log(`  Total stories since May 22: ${recent?.length ?? 0}`);
    for (const [status, count] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
      const hasSummary = (recent ?? []).filter(s => s.status === status && s.short_summary).length;
      console.log(`    ${status}: ${count} (${hasSummary} with summary)`);
    }
  }
}

main().catch(console.error);
