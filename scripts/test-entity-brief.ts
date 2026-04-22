/**
 * Diagnostic + render script for entity-brief v6 pipeline.
 * Run: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/test-entity-brief.ts
 *
 * Outputs:
 *   1. Significance score distribution
 *   2. Test user + entity list
 *   3. Feed summary (v6 fields)
 *   4. HTML written to tmp-brief-preview.html
 *   5. Subject line (all 3 cases)
 *   6. Pulse card rotation test
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

async function findTestUser(): Promise<string | null> {
  // Prefer the known test user by email
  const { data: byEmail } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("email", "lukedmcmillan@hotmail.com")
    .maybeSingle();
  if (byEmail) {
    console.log(`  Using test user by email: ${byEmail.email} (first_name: ${byEmail.first_name ?? "null"})`);
    return byEmail.id;
  }

  // Fallback: user with most tracked entities
  const { data: ueAll } = await sb.from("user_entities").select("user_id").limit(20);
  if (!ueAll || ueAll.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const r of ueAll) counts[r.user_id] = (counts[r.user_id] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

async function main() {
  // ── 1. Significance distribution ──────────────────────────────────────────
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

  // ── 2. Find test user ──────────────────────────────────────────────────────
  console.log("\n=== Finding test user ===");
  const testUserId = await findTestUser();
  if (!testUserId) { console.log("  No user found."); return; }
  console.log(`  User ID: ${testUserId}`);

  const { data: testEntities } = await sb
    .from("user_entities")
    .select("entity_id, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", testUserId);

  console.log(`  Entities (${testEntities?.length ?? 0}):`);
  for (const ue of testEntities || []) {
    const e = ue.entities as { name: string; entity_type: string; tracker_tag: string | null } | null;
    if (e) console.log(`    [${e.entity_type}] ${e.name}${e.tracker_tag ? ` (tracker: ${e.tracker_tag})` : ""}`);
  }

  // ── 3. Run feed function ───────────────────────────────────────────────────
  console.log("\n=== getUserEntityFeed (v6) ===");
  const feed = await getUserEntityFeed(testUserId);
  const gate = qualityGate(feed);

  console.log(`  Gate           : ${gate}`);
  console.log(`  First name     : ${feed.firstName ?? "(null)"}`);
  console.log(`  Total tracked  : ${feed.totalTracked}`);
  console.log(`  Quiet count    : ${feed.quietCount}`);
  console.log(`  Material       : ${feed.material.length}`);
  console.log(`  Watch          : ${feed.watch.length}`);
  console.log(`  Top stories    : ${feed.topStories.length}`);
  console.log(`  Week ahead     : ${feed.weekAheadItems.length} items`);
  console.log(`  Editors call   : ${feed.editorsCallText ? feed.editorsCallText.slice(0, 80) + "..." : "(none)"}`);

  if (feed.allEntities.length > 0) {
    console.log("\n  All entities (YOUR N TODAY):");
    for (const e of feed.allEntities) {
      const dot = e.moved ? "[AMBER]" : "[QUIET]";
      console.log(`    ${dot} ${e.entityName}: ${e.statusSentence.slice(0, 80)}`);
    }
  }

  if (feed.selectedPulseCard) {
    const p = feed.selectedPulseCard;
    console.log("\n  Selected Pulse card:");
    console.log(`    Tracker     : ${p.displayName} (${p.trackerSlug})`);
    console.log(`    Score/Band  : ${p.score.toFixed(1)} / ${p.band}`);
    console.log(`    WoW         : ${p.weekOverWeek != null ? (p.weekOverWeek >= 0 ? "+" : "") + p.weekOverWeek.toFixed(1) : "n/a"}`);
    console.log(`    Sparkline   : [${p.sparklineValues.map(v => v.toFixed(1)).join(", ")}]`);
    console.log(`    Interp.     : ${p.interpretation.slice(0, 100)}`);
  } else {
    console.log("\n  Pulse card: (none)");
  }

  if (feed.weekAheadItems.length > 0) {
    console.log("\n  Week ahead:");
    for (const w of feed.weekAheadItems) {
      console.log(`    ${w.dayLabel}  ${w.description.slice(0, 70)}`);
    }
  }

  // ── 4. Compose HTML and write preview ──────────────────────────────────────
  console.log("\n=== Composing HTML brief (v6) ===");
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const html = composeEntityBriefHtml(feed, dateStr);
  const outPath = "C:/Users/luke.mcmillan/tideline-next/tmp-brief-preview.html";
  writeFileSync(outPath, html, "utf-8");
  console.log(`  Written to  : ${outPath}`);
  console.log(`  HTML length : ${html.length} chars`);

  // ── 5. Subject lines — all 3 cases ────────────────────────────────────────
  console.log("\n=== Subject lines (all 3 cases) ===");
  const subject = await generateEntitySubjectLine(feed);
  console.log(`  Live subject  : "${subject}"`);

  // Simulate case 2: no entities moved
  const feedCase2 = { ...feed, allEntities: feed.allEntities.map(e => ({ ...e, moved: false })) };
  const subjectCase2 = await generateEntitySubjectLine(feedCase2);
  console.log(`  Case 2 (no moves)  : "${subjectCase2}"`);

  // Simulate case 3: no entities moved, no top stories
  const feedCase3 = { ...feedCase2, topStories: [] };
  const subjectCase3 = await generateEntitySubjectLine(feedCase3);
  console.log(`  Case 3 (all quiet) : "${subjectCase3}"`);

  // ── 6. Pulse rotation test ────────────────────────────────────────────────
  console.log("\n=== Pulse card rotation test ===");
  console.log("  Inserting 'isa' into brief_pulse_history 6 days ago...");
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const { error: insertErr } = await sb.from("brief_pulse_history").insert({
    user_id: testUserId,
    tracker_slug: "isa",
    featured_at: sixDaysAgo,
  });
  if (insertErr) console.log(`  Insert error: ${insertErr.message}`);
  else console.log("  Inserted isa history row.");

  console.log("  Re-running getUserEntityFeed to check rotation...");
  const feed2 = await getUserEntityFeed(testUserId);
  const pulseSlug2 = feed2.selectedPulseCard?.trackerSlug ?? "(none)";
  const rotated = pulseSlug2 !== "isa";
  console.log(`  Pulse card this run : ${pulseSlug2}`);
  console.log(`  Rotated away from ISA? ${rotated ? "YES" : "NO (may have fewer than 2 trackers)"}`);
}

main().catch(console.error);
