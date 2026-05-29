/**
 * Diagnostic: check blue_carbon_credits tag state + new source landing.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-bcc-sources.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NEW_SOURCES = [
  "Verra", "ICVCM", "VCMI",
  "Carbon Pulse", "Ecosystem Marketplace", "Climate Home News",
  "The Ocean Foundation",
];

async function main() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // ── 1. blue_carbon_credits tagged stories ─────────────────────────────────
  const { data: tagged } = await supabase
    .from("stories")
    .select("id, title, source_name, published_at, cross_tracker_flags")
    .contains("cross_tracker_flags", ["blue_carbon_credits"])
    .order("published_at", { ascending: false })
    .limit(10);

  console.log(`\n── (1) blue_carbon_credits tags ──────────────────────────────────`);
  if (!tagged || tagged.length === 0) {
    console.log("  No stories tagged blue_carbon_credits.");
  } else {
    console.log(`  Total tagged: ${tagged.length}`);
    for (const s of tagged) {
      const flags = (s.cross_tracker_flags as string[]) || [];
      console.log(`  [${s.published_at?.slice(0,10)}] ${s.title.slice(0,80)}`);
      console.log(`    source: ${s.source_name}  flags: [${flags.join(", ")}]`);
    }
  }

  // ── 2. New sources: stories landed in last 7 days ─────────────────────────
  console.log(`\n── (2) New sources — stories landed (last 7 days) ───────────────`);
  for (const src of NEW_SOURCES) {
    const { data: rows, count } = await supabase
      .from("stories")
      .select("id, title, published_at, cross_tracker_flags", { count: "exact" })
      .eq("source_name", src)
      .gte("fetched_at", since7d)
      .order("published_at", { ascending: false })
      .limit(3);

    const n = count ?? 0;
    if (n === 0) {
      console.log(`  ${src.padEnd(25)} 0 stories — NOT LANDING`);
    } else {
      console.log(`  ${src.padEnd(25)} ${n} stories in 7d`);
      for (const r of rows || []) {
        const flags = (r.cross_tracker_flags as string[]) || [];
        const bcc = flags.includes("blue_carbon_credits") ? " ← BCC" : "";
        console.log(`    [${r.published_at?.slice(0,10)}] ${r.title.slice(0,70)}${bcc}`);
      }
    }
  }

  // ── 3. New sources: last 24h specifically ─────────────────────────────────
  console.log(`\n── (3) New sources — stories in last 24h ────────────────────────`);
  const { data: recent } = await supabase
    .from("stories")
    .select("id, title, source_name, fetched_at, significance_score, cross_tracker_flags")
    .in("source_name", NEW_SOURCES)
    .gte("fetched_at", since24h)
    .order("fetched_at", { ascending: false })
    .limit(20);

  if (!recent || recent.length === 0) {
    console.log("  No stories from new sources in last 24h.");
    console.log("  → Cron may not have run since sources were added, OR sources are returning 0 items.");
  } else {
    console.log(`  ${recent.length} stories from new sources in 24h:`);
    for (const r of recent) {
      const flags = (r.cross_tracker_flags as string[]) || [];
      const bcc = flags.includes("blue_carbon_credits") ? " ← BCC" : "";
      const sig = r.significance_score ?? "unscored";
      console.log(`  [${r.fetched_at?.slice(0,16)}] ${r.source_name}: ${r.title.slice(0,65)} (sig=${sig})${bcc}`);
    }
  }

  console.log("");
}

main().catch(console.error);
