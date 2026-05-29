import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Oldest 5 null cites.org rows
  const { data: nullRows } = await sb.from("document_queue")
    .select("file_name, file_url, source_domain, source_format, status, created_at")
    .eq("source_domain", "cites.org").is("source_format", null).eq("status", "pending")
    .order("created_at", { ascending: true }).limit(5);
  console.log("=== Oldest 5 null cites.org rows ===");
  (nullRows||[]).forEach(r => console.log(r.created_at?.slice(0,19), "|", r.file_name, "|", r.file_url?.slice(0,60)));

  // Do null rows have the CITES_DEC_ slug pattern?
  const { count: slugCount } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .eq("source_domain", "cites.org").is("source_format", null).eq("status", "pending")
    .ilike("file_name", "CITES_DEC_%");
  console.log("\nNull rows with CITES_DEC_ slug:", slugCount, "(today's run = inserted before column existed?)");

  // Count by insert date
  const { count: todayCount } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .eq("source_domain", "cites.org").is("source_format", null).eq("status", "pending")
    .gte("created_at", "2026-05-11T00:00:00Z");
  const { count: olderCount } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .eq("source_domain", "cites.org").is("source_format", null).eq("status", "pending")
    .lt("created_at", "2026-05-11T00:00:00Z");
  console.log("\nInserted today:", todayCount, "| Inserted before today:", olderCount);

  // IWC null check
  const { count: iwcNull } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .eq("source_domain", "crm.iwc.int").is("source_format", null).eq("status", "pending");
  console.log("IWC (crm.iwc.int) null source_format:", iwcNull);
}
main().catch(console.error);
