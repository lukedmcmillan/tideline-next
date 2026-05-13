import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Confirm count before applying
  const { data: preview, error: previewErr } = await (sb as any)
    .from("document_queue")
    .select("id, file_url, error_message")
    .eq("status", "failed")
    .eq("source_domain", "awionline.org")
    .ilike("error_message", "%Download HTTP 403%");

  if (previewErr) { console.error("Preview error:", previewErr.message); process.exit(1); }
  const rows = (preview || []) as Array<{ id: string; file_url: string; error_message: string }>;
  console.log(`\nAWI records matching reset filter: ${rows.length}`);
  rows.forEach(r => console.log(`  ${r.id.slice(0,8)}... ${r.file_url.slice(0,80)}`));

  if (rows.length === 0) { console.log("Nothing to reset."); return; }

  // Apply reset
  const ids = rows.map(r => r.id);
  const { error: updateErr } = await (sb as any)
    .from("document_queue")
    .update({ status: "pending", error_message: null, processed_at: null })
    .in("id", ids);

  if (updateErr) { console.error("Update error:", updateErr.message); process.exit(1); }
  console.log(`\nReset ${rows.length} AWI records → pending`);

  // Also count total pending queue depth so we know what the processor will face
  const { count: totalPending } = await (sb as any)
    .from("document_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  console.log(`\nTotal pending in document_queue (all domains): ${totalPending}`);

  // Count AWI and WDC specifically
  const { count: awiPending } = await (sb as any)
    .from("document_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("source_domain", "awionline.org");

  const { count: wdcPending } = await (sb as any)
    .from("document_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("source_domain", "uk.whales.org");

  console.log(`  AWI pending:  ${awiPending}`);
  console.log(`  WDC pending:  ${wdcPending}`);
  console.log(`  Other:        ${(totalPending || 0) - (awiPending || 0) - (wdcPending || 0)}`);
}

main().catch(console.error);
