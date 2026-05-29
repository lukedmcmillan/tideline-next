// Step F verification queries
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Query 1: rows by prompt_version (category IS NOT NULL)
  console.log("=== (1) COUNT by prompt_version (category IS NOT NULL) ===");
  const { data: q1 } = await s.from("delta_classifications")
    .select("prompt_version, story_id")
    .not("category", "is", null);
  const byVersion = new Map<string, number>();
  for (const r of q1 ?? []) byVersion.set(r.prompt_version, (byVersion.get(r.prompt_version) ?? 0) + 1);
  for (const [v, count] of [...byVersion.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  prompt_version=${v}: ${count} rows`);
  if (byVersion.size === 0) console.log("  NONE — Step F GATE FAIL");

  // Query 2: category distribution under f6491a2171c78bdf
  console.log("\n=== (2) Category distribution (prompt_version=f6491a2171c78bdf) ===");
  const { data: q2 } = await s.from("delta_classifications")
    .select("category, story_id")
    .eq("prompt_version", "f6491a2171c78bdf")
    .not("category", "is", null);
  const byCat = new Map<string, number>();
  for (const r of q2 ?? []) byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1);
  for (const [cat, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${cat}: ${count}`);
  if (byCat.size === 0) console.log("  NONE under this version");

  // Query 3: all distinct prompt_versions
  console.log("\n=== (3) All distinct prompt_versions in table ===");
  const { data: q3 } = await s.from("delta_classifications").select("prompt_version");
  const allVersions = new Set((q3 ?? []).map(r => r.prompt_version));
  for (const v of [...allVersions].sort()) console.log(`  ${v}`);
  if (allVersions.size === 0) console.log("  Table is empty");
}

main().catch(console.error);
