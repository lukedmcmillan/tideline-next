/**
 * Fetch the live DB Mongabay BBNJ story to compare summaries.
 * Run: npx tsx --env-file=.env.local scripts/fetch-mongabay-live.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await sb
    .from("stories")
    .select("id, title, short_summary, description, published_at, source_name, topic, significance_score")
    .ilike("title", "%sharks and rays%")
    .order("published_at", { ascending: false })
    .limit(5);

  if (error) { console.error(error); process.exit(1); }

  for (const s of data ?? []) {
    console.log("═".repeat(80));
    console.log("ID:         ", s.id);
    console.log("Published:  ", s.published_at);
    console.log("Title:      ", s.title);
    console.log("Source:     ", s.source_name, "| topic:", s.topic, "| sig:", s.significance_score);
    console.log("─ short_summary ─");
    console.log(s.short_summary ?? "(null)");
    console.log("─ description ─");
    console.log(s.description ?? "(null)");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
