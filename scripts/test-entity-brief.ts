/**
 * Diagnostic + render script for entity-brief pipeline.
 * Run: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/test-entity-brief.ts
 *
 * Outputs:
 *   1. significance_score distribution
 *   2. Test user + entity list
 *   3. Fixed feed query results (foreignTable order)
 *   4. HTML written to /tmp/entity-brief-preview.html
 *   5. Subject line
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import {
  getUserEntityFeed,
  qualityGate,
  composeEntityBriefHtml,
  generateEntitySubjectLine,
} from "../app/lib/entity-brief";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // ── 1. Significance distribution ─────────────────────────────────────────────
  console.log("\n=== significance_score distribution (live stories) ===");

  const { data: distRows } = await sb
    .from("stories")
    .select("significance_score")
    .eq("status", "live")
    .not("significance_score", "is", null);

  if (distRows && distRows.length > 0) {
    const scores = distRows.map(r => r.significance_score as number);
    const sorted = [...scores].sort((a, b) => a - b);
    const p = (n: number) => sorted[Math.floor(sorted.length * n)];
    console.log(`  Total    : ${scores.length}`);
    console.log(`  Min/Max  : ${Math.min(...scores)} / ${Math.max(...scores)}`);
    console.log(`  Mean     : ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}`);
    console.log(`  P50/P75/P90/P95: ${p(0.5)} / ${p(0.75)} / ${p(0.9)} / ${p(0.95)}`);
    for (const t of [50, 40, 30, 25]) {
      const n = scores.filter(s => s >= t).length;
      console.log(`  >= ${t}: ${n} (${((n / scores.length) * 100).toFixed(1)}%)`);
    }
  }

  // ── 2. Find test user ─────────────────────────────────────────────────────────
  console.log("\n=== Finding test user ===");

  const { data: ueAll } = await sb
    .from("user_entities")
    .select("user_id")
    .limit(20);

  if (!ueAll || ueAll.length === 0) {
    console.log("  No user_entities found.");
    return;
  }

  const counts: Record<string, number> = {};
  for (const r of ueAll) counts[r.user_id] = (counts[r.user_id] || 0) + 1;
  const testUserId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  const { data: testEntities } = await sb
    .from("user_entities")
    .select("entity_id, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", testUserId);

  console.log(`  User: ${testUserId}`);
  console.log(`  Entities (${testEntities?.length ?? 0}):`);
  for (const ue of testEntities || []) {
    const e = ue.entities as { name: string; entity_type: string; tracker_tag: string | null } | null;
    if (e) console.log(`    [${e.entity_type}] ${e.name}${e.tracker_tag ? ` (tracker: ${e.tracker_tag})` : ""}`);
  }

  // ── 3. Run real feed function ─────────────────────────────────────────────────
  console.log("\n=== getUserEntityFeed (24h, fixed query) ===");

  const feed = await getUserEntityFeed(testUserId);
  const gate = qualityGate(feed);

  console.log(`  Gate         : ${gate}`);
  console.log(`  Material     : ${feed.material.length}`);
  console.log(`  Watch        : ${feed.watch.length}`);
  console.log(`  Quiet count  : ${feed.quietCount}`);
  console.log(`  Total tracked: ${feed.totalTracked}`);
  console.log(`  Pulse scores : ${feed.pulseScores.length}`);

  if (feed.material.length > 0) {
    console.log("\n  Material items:");
    for (const item of feed.material) {
      console.log(`    [${item.significanceScore}] ${item.entityName}: ${item.title.slice(0, 70)}`);
    }
  }
  if (feed.watch.length > 0) {
    console.log("\n  Watch items:");
    for (const item of feed.watch) {
      console.log(`    [${item.significanceScore}] ${item.entityName}: ${item.title.slice(0, 70)}`);
    }
  }
  if (feed.pulseScores.length > 0) {
    console.log("\n  Pulse:");
    for (const p of feed.pulseScores) {
      console.log(`    ${p.trackerSlug}: ${p.score.toFixed(1)} (${p.band}) ${p.direction}`);
      if (p.interpretation) console.log(`      ${p.interpretation.slice(0, 100)}`);
    }
  }

  // ── 4. Compose HTML and write preview ─────────────────────────────────────────
  console.log("\n=== Composing HTML brief ===");

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const html = composeEntityBriefHtml(feed, dateStr, gate);
  const outPath = "C:/Users/luke.mcmillan/tideline-next/tmp-brief-preview.html";
  writeFileSync(outPath, html, "utf-8");
  console.log(`  HTML written to: ${outPath}`);
  console.log(`  HTML length    : ${html.length} chars`);
  console.log("\n  --- HTML SNIPPET (first 3000 chars) ---");
  console.log(html.slice(0, 3000));
  console.log("  --- END SNIPPET ---");

  // ── 5. Subject line ───────────────────────────────────────────────────────────
  console.log("\n=== Subject line ===");
  const subject = await generateEntitySubjectLine(feed, gate);
  console.log(`  Subject: "${subject}"`);
}

main().catch(console.error);
