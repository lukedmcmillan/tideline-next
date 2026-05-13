import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Oldest 10 pending records — what the processor will pick up first
  const { data: oldest } = await (sb as any)
    .from("document_queue")
    .select("id, source_domain, file_url, created_at, source_format")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);

  console.log("Oldest 10 pending records (processor picks these up first):");
  for (const r of (oldest || []) as any[]) {
    console.log(`  ${r.created_at?.slice(0,10)} [${r.source_domain}] ${(r.file_url || "").slice(0,70)}`);
  }

  // Find position of first AWI record in the pending queue
  const { data: awiOldest } = await (sb as any)
    .from("document_queue")
    .select("id, created_at, file_url")
    .eq("status", "pending")
    .eq("source_domain", "awionline.org")
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: wdcOldest } = await (sb as any)
    .from("document_queue")
    .select("id, created_at, file_url")
    .eq("status", "pending")
    .eq("source_domain", "uk.whales.org")
    .order("created_at", { ascending: true })
    .limit(1);

  if (awiOldest?.[0]) {
    const awiDate = awiOldest[0].created_at;
    // How many pending records are older than this AWI record?
    const { count: olderThanAwi } = await (sb as any)
      .from("document_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", awiDate);
    console.log(`\nFirst AWI record created: ${awiDate?.slice(0,16)}`);
    console.log(`Records ahead of AWI in queue: ${olderThanAwi}`);
  }

  if (wdcOldest?.[0]) {
    const wdcDate = wdcOldest[0].created_at;
    const { count: olderThanWdc } = await (sb as any)
      .from("document_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", wdcDate);
    console.log(`\nFirst WDC record created: ${wdcDate?.slice(0,16)}`);
    console.log(`Records ahead of WDC in queue: ${olderThanWdc}`);
  }

  // Source domain distribution of pending records
  const { data: allPending } = await (sb as any)
    .from("document_queue")
    .select("source_domain")
    .eq("status", "pending");

  const domainCount: Record<string, number> = {};
  for (const r of (allPending || []) as any[]) {
    const d = r.source_domain || "unknown";
    domainCount[d] = (domainCount[d] || 0) + 1;
  }
  const top = Object.entries(domainCount).sort((a,b) => b[1]-a[1]).slice(0, 12);
  console.log("\nTop 12 domains by pending count:");
  for (const [d, n] of top) console.log(`  ${n.toString().padStart(5)}  ${d}`);
}

main().catch(console.error);
