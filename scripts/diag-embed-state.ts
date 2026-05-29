import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // embedded_at coverage
  const { count: total } = await sb.from("documents").select("id", { count: "exact", head: true }).eq("status", "approved");
  const { count: embedded } = await sb.from("documents").select("id", { count: "exact", head: true }).eq("status", "approved").not("embedded_at", "is", null);
  const { count: unembedded } = await sb.from("documents").select("id", { count: "exact", head: true }).eq("status", "approved").is("embedded_at", null);
  console.log(`=== Document embedding coverage ===`);
  console.log(`  Total approved docs : ${total}`);
  console.log(`  embedded_at IS NOT NULL : ${embedded}`);
  console.log(`  embedded_at IS NULL     : ${unembedded}`);

  // document_chunks count
  const { count: chunks } = await sb.from("document_chunks").select("id", { count: "exact", head: true });
  console.log(`\n=== document_chunks ===`);
  console.log(`  Total chunks in table: ${chunks}`);

  // distinct documents in chunks
  const { data: distData } = await sb.rpc("count_distinct_chunk_docs" as never).maybeSingle();
  // fallback: just check embedding_errors
  const { count: errCount } = await sb.from("embedding_errors").select("id", { count: "exact", head: true });
  console.log(`\n=== embedding_errors ===`);
  console.log(`  Total error rows: ${errCount}`);

  // top error types
  const { data: errTypes } = await sb.from("embedding_errors").select("error_type").limit(10000);
  const t: Record<string, number> = {};
  for (const r of errTypes || []) { t[r.error_type] = (t[r.error_type] || 0) + 1; }
  console.log(`  By error_type:`);
  for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(5)}  ${k}`);

  // sample of unembedded docs — what are they?
  const { data: unemb } = await sb.from("documents")
    .select("title, source_organisation, document_type, file_url")
    .eq("status", "approved")
    .is("embedded_at", null)
    .limit(20);
  console.log(`\n=== Sample unembedded docs (first 20) ===`);
  for (const d of unemb || []) console.log(`  [${d.document_type}] ${d.title} | file_url: ${d.file_url?.slice(0, 60)}`);
}
main().catch(console.error);
