/**
 * Check and optionally delete Ecosystem Marketplace stories from stories table.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-em-cleanup.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, published_at, fetched_at")
    .eq("source_name", "Ecosystem Marketplace")
    .order("published_at", { ascending: false });

  if (error) { console.error("Fetch error:", error.message); process.exit(1); }

  if (!stories || stories.length === 0) {
    console.log("No Ecosystem Marketplace stories in stories table. Nothing to clean up.");
    return;
  }

  console.log(`\nFound ${stories.length} Ecosystem Marketplace stories:\n`);
  for (const s of stories) {
    console.log(`  [${s.published_at?.slice(0, 10)}] (fetched: ${s.fetched_at?.slice(0, 10)}) ${s.title}`);
  }

  const ids = stories.map(s => s.id);
  const { error: delErr } = await supabase
    .from("stories")
    .delete()
    .in("id", ids);

  if (delErr) {
    console.error("\nDelete error:", delErr.message);
    process.exit(1);
  }

  console.log(`\nDeleted ${ids.length} stale Ecosystem Marketplace stories.`);
}

main().catch(console.error);
