import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Recent entity mentions
  const { data } = await sb
    .from("entity_mentions")
    .select("entity_id, match_score, match_method, confidence, entities(name, entity_type)")
    .order("mentioned_at", { ascending: false })
    .limit(20);

  console.log("=== Recent entity_mentions (top 20) ===\n");
  console.log("Entity | Type | Score | Method | Confidence");
  console.log("-------|------|-------|--------|----------");
  for (const m of data || []) {
    const e = (m as any).entities;
    console.log(`${e?.name?.slice(0, 30)} | ${e?.entity_type} | ${m.match_score} | ${m.match_method} | ${m.confidence}`);
  }

  // Aggregate
  const { data: agg } = await sb.rpc("", undefined); // Can't run raw SQL via client
  // Instead just count
  const { count } = await sb
    .from("entity_mentions")
    .select("id", { count: "exact", head: true })
    .not("match_method", "is", null);

  console.log(`\nTotal entity_mentions with match_method: ${count}`);
}

main().catch(console.error);
