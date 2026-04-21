import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get the China tuna story
  const { data: story } = await sb
    .from("stories")
    .select("id, title, short_summary")
    .eq("id", "8d873d0a-f090-4f2f-bac2-bb5f41471307")
    .single();

  console.log("Title:", story?.title);
  console.log("Summary:", story?.short_summary?.slice(0, 300));

  // Check what the RPC returns for this story
  const { data: matches } = await sb.rpc("match_entities_in_text", {
    story_title: story?.title || "",
    story_summary: story?.short_summary || "",
  });
  console.log("\nRPC matches:");
  for (const m of matches || []) {
    console.log(`  ${m.entity_name} (${m.entity_type}) via "${m.matched_on}"`);
  }

  // Check entity aliases for Convergence Finance
  const { data: aliases } = await sb
    .from("entity_aliases")
    .select("alias_text")
    .eq("entity_id", "b5a34aa8-d0cf-4611-a08d-e61db76756e3");
  console.log("\nConvergence Finance aliases:", aliases?.map(a => a.alias_text));
}

main().catch(console.error);
