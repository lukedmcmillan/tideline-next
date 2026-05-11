/**
 * Backfill source_format on existing document_queue rows that pre-date the
 * 20260511_informea_html_support migration (column was null before that date).
 *
 * Rules:
 *   file_url ends in .pdf   -> source_format = 'pdf'
 *   file_url is an HTML page -> source_format = 'html'  (must be run with --html flag)
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-source-format.ts
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-source-format.ts --html
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const htmlMode = process.argv.includes("--html");

async function main() {
  if (htmlMode) {
    // Set html on null rows that are NOT pdfs (HTML pages without extension)
    const { error, count } = await sb.from("document_queue")
      .update({ source_format: "html" }, { count: "exact" })
      .is("source_format", null)
      .not("file_url", "ilike", "%.pdf%");
    if (error) { console.error("HTML backfill error:", error.message); return; }
    console.log("Backfilled source_format=html on", count, "rows");
  } else {
    // Default: set pdf on null rows with .pdf file_url
    const { error, count } = await sb.from("document_queue")
      .update({ source_format: "pdf" }, { count: "exact" })
      .is("source_format", null)
      .ilike("file_url", "%.pdf%");
    if (error) { console.error("PDF backfill error:", error.message); return; }
    console.log("Backfilled source_format=pdf on", count, "rows");
  }

  // Verify remaining nulls
  const { count: remaining } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .is("source_format", null);
  console.log("Remaining null source_format rows:", remaining);
}

main().catch(console.error);
