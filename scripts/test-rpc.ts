import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const r = await sb.rpc("match_entities_in_text", {
    story_title: "Mowi takes €10m hit on Q1 south Norway algal bloom",
    story_summary: "",
  });
  console.log("RPC result:", JSON.stringify(r.data, null, 2));
  if (r.error) console.log("RPC error:", r.error.message);
}

main().catch(console.error);
