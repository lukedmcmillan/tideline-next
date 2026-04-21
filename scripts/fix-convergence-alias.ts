import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Delete the bare "Convergence" alias — too ambiguous (common English word)
  const { error } = await sb
    .from("entity_aliases")
    .delete()
    .eq("entity_id", "b5a34aa8-d0cf-4611-a08d-e61db76756e3")
    .eq("alias_text", "Convergence");
  console.log("Delete 'Convergence' alias:", error?.message || "done");

  // Verify remaining aliases
  const { data } = await sb
    .from("entity_aliases")
    .select("alias_text")
    .eq("entity_id", "b5a34aa8-d0cf-4611-a08d-e61db76756e3");
  console.log("Remaining aliases:", data?.map(a => a.alias_text));
}

main().catch(console.error);
