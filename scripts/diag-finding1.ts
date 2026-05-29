import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. Last 5 brief_sends for lukedmcmillan@gmail.com
  const { data: sends } = await s
    .from("brief_sends")
    .select("id, sent_at, lead_story_id, delta_fallback, send_type, brief_date")
    .eq("email", "lukedmcmillan@gmail.com")
    .order("sent_at", { ascending: false })
    .limit(5);

  console.log("=== Last 5 brief_sends ===");
  for (const r of sends ?? []) {
    console.log(`  ${r.sent_at} | type=${r.send_type} | date=${r.brief_date} | delta_fallback=${r.delta_fallback} | lead_story_id=${r.lead_story_id}`);
  }

  // 2. Look up the story titles for those lead_story_ids
  const ids = [...new Set((sends ?? []).map(r => r.lead_story_id).filter(Boolean))];
  if (ids.length > 0) {
    const { data: stories } = await s
      .from("stories")
      .select("id, title, significance_score, topic")
      .in("id", ids);

    console.log("\n=== Story titles for lead_story_ids ===");
    for (const st of stories ?? []) {
      console.log(`  ${st.id} | sig=${st.significance_score} | topic=${st.topic} | "${st.title.slice(0, 100)}"`);
    }
  }

  // 3. What was in recentlyLedIds at the time of each run?
  // Show cumulative: after run N, what IDs would be in the 7-day window for run N+1?
  console.log("\n=== recentlyLedIds accumulation per run ===");
  const orderedSends = [...(sends ?? [])].reverse(); // oldest first
  const seenIds = new Set<string>();
  for (const r of orderedSends) {
    console.log(`  Run (${r.sent_at}): recentlyLedIds at this point = [${[...seenIds].join(", ") || "empty"}]`);
    if (r.lead_story_id) seenIds.add(r.lead_story_id);
  }

  // 4. Check classifications for the story that led each run
  if (ids.length > 0) {
    const { data: cls } = await s
      .from("delta_classifications")
      .select("story_id, category, governance_significance, classified_at")
      .in("story_id", ids)
      .eq("prompt_version", "f6491a2171c78bdf");

    console.log("\n=== Classifications for led stories (prompt_version=f6491a2171c78bdf) ===");
    for (const c of cls ?? []) {
      console.log(`  ${c.story_id} | category=${c.category} | gov_sig=${c.governance_significance}`);
    }
  }
}
main().catch(console.error);
