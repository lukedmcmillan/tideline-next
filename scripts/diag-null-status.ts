import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data } = await sb.from("document_queue")
    .select("file_url, source_domain, file_name, status")
    .is("source_format", null).limit(5);
  console.log("Sample null rows:");
  (data||[]).forEach(r => console.log(" ", r.status, "|", r.source_domain, "|", r.file_url?.slice(0,70)));

  for (const s of ["pending","completed","failed","processing"]) {
    const { count } = await sb.from("document_queue")
      .select("*", { count: "exact", head: true })
      .is("source_format", null).eq("status", s);
    if (count) console.log(s + ":", count);
  }
}
main().catch(console.error);
