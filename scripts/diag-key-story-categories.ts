import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: stories } = await s
    .from("stories")
    .select("id, title, significance_score")
    .or("title.ilike.%Papua New Guinea%MPA%,title.ilike.%crack-down%China%shark%,title.ilike.%Vaquita%,title.ilike.%Seabed life triples%Scotland%,title.ilike.%China%shark%conservation%");

  if (!stories || stories.length === 0) { console.log("No matching stories found"); return; }

  const ids = stories.map(s => s.id);
  const { data: cls } = await s
    .from("delta_classifications")
    .select("story_id, category, governance_significance, classified_at")
    .in("story_id", ids)
    .eq("prompt_version", "f6491a2171c78bdf");

  const clsMap = new Map((cls ?? []).map(r => [r.story_id, r]));

  console.log("=== KEY STORY CLASSIFICATIONS (prompt_version=f6491a2171c78bdf) ===");
  for (const t of stories.sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))) {
    const c = clsMap.get(t.id);
    const cat = c?.category ?? "UNCLASSIFIED";
    const govSig = c?.governance_significance ?? "n/a";
    console.log(`  sig=${t.significance_score} | ${cat} | gov_sig=${govSig} | "${t.title.slice(0, 90)}"`);
  }
}
main().catch(console.error);
