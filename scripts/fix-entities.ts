import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Check Convergence entity
  const r1 = await sb.from("entities").select("id, name, entity_type, description").ilike("name", "%convergence%");
  console.log("=== Convergence entities ===");
  console.log(JSON.stringify(r1.data, null, 2));

  // 2. Delete Norwegian demonym
  const { data: norw } = await sb
    .from("entities")
    .select("id")
    .eq("name", "Norwegian")
    .eq("entity_type", "organisation");

  if (norw && norw.length > 0) {
    const nid = norw[0].id;
    await sb.from("entity_mentions").delete().eq("entity_id", nid);
    await sb.from("entity_aliases").delete().eq("entity_id", nid);
    await sb.from("entities").delete().eq("id", nid);
    console.log("=== Norwegian deleted ===");
  } else {
    console.log("=== Norwegian: not found (already deleted) ===");
  }

  // 3. Also check if DEME Group still exists (4 chars, should be caught by tier 2)
  const r3 = await sb.from("entities").select("id, name, entity_type").ilike("name", "%DEME%");
  console.log("=== DEME entities ===");
  console.log(JSON.stringify(r3.data, null, 2));
}

main().catch(console.error);
