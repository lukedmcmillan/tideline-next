/**
 * Fetches the live DB summaries for all stories used in the primary-angle proof,
 * so the re-proof can use exact production text.
 * Run: npx tsx --env-file=.env.local scripts/fetch-proof-stories-live.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Row = { id: string; title: string; short_summary: string | null; published_at: string; source_name: string; topic: string; significance_score: number };

async function fetch(label: string, ilike: string, minSig = 0): Promise<void> {
  const { data } = await sb
    .from("stories")
    .select("id, title, short_summary, published_at, source_name, topic, significance_score")
    .ilike("title", ilike)
    .gte("significance_score", minSig)
    .order("published_at", { ascending: false })
    .limit(3);

  console.log("\n" + "═".repeat(80));
  console.log(`PROOF STORY: ${label}`);
  console.log("═".repeat(80));
  for (const s of (data ?? []) as Row[]) {
    console.log(`  ID: ${s.id}`);
    console.log(`  Published: ${s.published_at.slice(0, 10)} | sig: ${s.significance_score} | topic: ${s.topic}`);
    console.log(`  Title: "${s.title}"`);
    console.log(`  short_summary: ${s.short_summary ?? "(null)"}`);
  }
  if (!data || data.length === 0) console.log("  (no match found)");
}

async function main() {
  await fetch("Mongabay BBNJ — live target", "%sharks and rays%do not know%");
  await fetch("PNG MPA — control (must stay GOVERNANCE_CHANGE)", "%Papua New Guinea%MPA%");
  await fetch("Damen Flex Tugs — control (must stay COMMERCIAL)", "%Damen%Fuel Flexible%");
  await fetch("Seapeak LNG — control (must stay COMMERCIAL)", "%Seapeak%Samsung%");
  await fetch("Scotland trawling study — control (must stay ANALYSIS)", "%Scotland%trawling%");
}

main().catch(e => { console.error(e); process.exit(1); });
