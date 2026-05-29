// Resets the 19 IWC items that failed with "Validation failed: bad title" back to pending
// so processor-agent.ts can re-process them with the fixed validator.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Find IWC title-validation failures
  const { data: rows } = await s
    .from("document_queue")
    .select("id, file_name, error_message, status")
    .ilike("file_name", "IWC_DEC_%")
    .like("error_message", "Validation failed: bad title%");

  console.log(`Found ${rows?.length ?? 0} IWC title-validation failures:`);
  for (const r of rows ?? []) console.log(`  ${r.file_name} | ${r.error_message}`);

  if (!rows || rows.length === 0) { console.log("Nothing to reset."); return; }

  const ids = rows.map(r => r.id);
  const { error } = await s
    .from("document_queue")
    .update({ status: "pending", error_message: null, attempts: 0 })
    .in("id", ids);

  if (error) console.log("Reset error:", error.message);
  else console.log(`\n✓ Reset ${ids.length} items to pending`);
}
main().catch(console.error);
