import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Count stories with summaries but not yet entity-matched
  const { count } = await sb
    .from("stories")
    .select("id", { count: "exact", head: true })
    .not("short_summary", "is", null)
    .or("entities_extracted.is.null,entities_extracted.eq.false");

  console.log(`Stories with summary but no entity matching: ${count}`);

  // Show a few
  const { data } = await sb
    .from("stories")
    .select("id, title, short_summary, entities_extracted")
    .not("short_summary", "is", null)
    .or("entities_extracted.is.null,entities_extracted.eq.false")
    .order("published_at", { ascending: false })
    .limit(5);

  for (const s of data || []) {
    console.log(`  ${s.title?.slice(0, 60)} [extracted=${s.entities_extracted}]`);
  }
}

main().catch(console.error);
