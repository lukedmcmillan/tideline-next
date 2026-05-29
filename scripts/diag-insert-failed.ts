/**
 * Diagnose 57 insert_failed documents.
 * Read-only. No writes.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Fetch all insert_failed error records
  const { data: errors } = await sb
    .from("embedding_errors")
    .select("document_id, error_message")
    .eq("error_type", "insert_failed")
    .limit(1000);

  if (!errors || errors.length === 0) { console.log("No insert_failed errors found."); return; }

  // Unique document IDs with insert_failed
  const docIds = [...new Set(errors.map((e) => e.document_id))];
  console.log(`insert_failed unique document IDs: ${docIds.length}`);

  // Fetch titles for these docs
  const { data: docs } = await sb
    .from("documents")
    .select("id, title, document_type, source_organisation, embedded_at")
    .in("id", docIds);
  const docMap = new Map((docs || []).map((d) => [d.id, d]));

  // Count chunks per document
  const chunkCounts = new Map<string, number>();
  for (const id of docIds) {
    const { count } = await sb
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", id);
    chunkCounts.set(id, count ?? 0);
  }

  const withChunks = docIds.filter((id) => (chunkCounts.get(id) ?? 0) > 0);
  const zeroChunks = docIds.filter((id) => (chunkCounts.get(id) ?? 0) === 0);

  console.log(`\n=== (a) Chunk coverage ===`);
  console.log(`  Zero chunks (complete failure): ${zeroChunks.length}`);
  console.log(`  Has some chunks (partial):      ${withChunks.length}`);

  // (b) For partial docs: extract attempted count from error_message
  // Error messages look like "partial: N of M chunks inserted"
  const partialRatios: number[] = [];
  for (const id of withChunks) {
    const errs = errors.filter((e) => e.document_id === id);
    for (const e of errs) {
      const m = e.error_message?.match(/partial:\s*(\d+)\s*of\s*(\d+)/);
      if (m) {
        const inserted = parseInt(m[1]);
        const attempted = parseInt(m[2]);
        if (attempted > 0) partialRatios.push(inserted / attempted);
      }
    }
  }

  const medianRatio = partialRatios.length > 0
    ? [...partialRatios].sort((a, b) => a - b)[Math.floor(partialRatios.length / 2)]
    : null;

  console.log(`\n=== (b) Partial doc ratios ===`);
  if (medianRatio !== null) {
    console.log(`  Ratios found: ${partialRatios.length}`);
    console.log(`  Median inserted/attempted: ${(medianRatio * 100).toFixed(0)}%`);
    console.log(`  Min: ${(Math.min(...partialRatios) * 100).toFixed(0)}%`);
    console.log(`  Max: ${(Math.max(...partialRatios) * 100).toFixed(0)}%`);
  } else {
    // Error messages may not follow the "partial:" format — show raw samples
    console.log(`  No 'partial: N of M' format found. Sample error messages:`);
    for (const e of errors.slice(0, 5)) console.log(`    "${e.error_message}"`);
  }

  // (c) Sample 5 titles per category
  function sampleTitles(ids: string[], n = 5) {
    const shuffled = [...ids].sort(() => Math.random() - 0.5).slice(0, n);
    return shuffled.map((id) => {
      const d = docMap.get(id);
      const chunks = chunkCounts.get(id) ?? 0;
      return `  - [${chunks} chunks] ${d?.title ?? id} (${d?.document_type ?? "?"})`;
    });
  }

  console.log(`\n=== (c) Sample titles ===`);
  console.log(`\n  [ZERO-CHUNK docs — ${zeroChunks.length} total]`);
  for (const t of sampleTitles(zeroChunks)) console.log(t);

  if (withChunks.length > 0) {
    // Split partial into low (<50%) and high (>=50%) by chunk count proxy
    const sorted = withChunks.sort((a, b) => (chunkCounts.get(a) ?? 0) - (chunkCounts.get(b) ?? 0));
    const mid = Math.floor(sorted.length / 2);
    const lowRatio = sorted.slice(0, mid);
    const highRatio = sorted.slice(mid);

    console.log(`\n  [LOW-CHUNK partial docs — ${lowRatio.length} total]`);
    for (const t of sampleTitles(lowRatio)) console.log(t);
    console.log(`\n  [HIGH-CHUNK partial docs — ${highRatio.length} total]`);
    for (const t of sampleTitles(highRatio)) console.log(t);
  }

  // Show embedded_at status for all insert_failed docs
  const alsoEmbedded = docIds.filter((id) => docMap.get(id)?.embedded_at);
  const notEmbedded = docIds.filter((id) => !docMap.get(id)?.embedded_at);
  console.log(`\n=== embedded_at status for insert_failed docs ===`);
  console.log(`  embedded_at IS NOT NULL: ${alsoEmbedded.length}`);
  console.log(`  embedded_at IS NULL    : ${notEmbedded.length}`);
}

main().catch(console.error);
