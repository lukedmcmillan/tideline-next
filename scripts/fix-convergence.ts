import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Rename entity
  const { error: e1 } = await sb
    .from("entities")
    .update({ name: "Convergence Finance" })
    .eq("name", "Convergence Blended Finance");
  console.log("Rename:", e1?.message || "done");

  // Get the entity id
  const { data: entity } = await sb
    .from("entities")
    .select("id")
    .eq("name", "Convergence Finance")
    .single();

  if (!entity) {
    console.log("Entity not found after rename");
    return;
  }

  // Add alias for the full original name
  const { error: e2 } = await sb
    .from("entity_aliases")
    .upsert(
      { entity_id: entity.id, alias_text: "Convergence Blended Finance", alias_type: "common" },
      { onConflict: "entity_id,alias_text" }
    );
  console.log("Alias:", e2?.message || "done");

  // Verify
  const { data: check } = await sb
    .from("entities")
    .select("id, name")
    .eq("id", entity.id)
    .single();
  console.log("Verified:", JSON.stringify(check));
}

main().catch(console.error);
