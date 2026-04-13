import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { resolve } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CSV_PATH = resolve(__dirname, "FAOLEX_Fisheries.csv");

async function isAlreadyQueued(fileUrl: string): Promise<boolean> {
  const { data: q } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  if (q && q.length > 0) return true;

  const { data: d } = await supabase
    .from("documents")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  return !!(d && d.length > 0);
}

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "unknown.pdf");
  } catch {
    return "unknown.pdf";
  }
}

interface FaolexRow {
  "Record Id": string;
  "Record URL": string;
  "Document URL": string;
  Title: string;
  "Language of document": string;
  Repealed: string;
}

async function main() {
  console.log("=== Tideline FAOLEX CSV Importer ===\n");

  const rows: FaolexRow[] = await new Promise((resolve, reject) => {
    const results: FaolexRow[] = [];
    createReadStream(CSV_PATH, { encoding: "utf-8" })
      .pipe(parse({ columns: true, bom: true, skip_empty_lines: true }))
      .on("data", (row: FaolexRow) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });

  console.log(`Total rows: ${rows.length}`);

  let queued = 0;
  let skippedLang = 0;
  let skippedNoUrl = 0;
  let skippedRepealed = 0;
  let skippedDup = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Filter: English only
    const lang = (row["Language of document"] || "").trim();
    if (lang !== "English") {
      skippedLang++;
      continue;
    }

    // Filter: must have Document URL
    const docUrl = (row["Document URL"] || "").trim();
    if (!docUrl) {
      skippedNoUrl++;
      continue;
    }

    // Filter: not repealed
    if ((row["Repealed"] || "").trim() === "Y") {
      skippedRepealed++;
      continue;
    }

    // Dedup check
    const exists = await isAlreadyQueued(docUrl);
    if (exists) {
      skippedDup++;
      continue;
    }

    // Queue
    const { error } = await supabase.from("document_queue").insert({
      source_url: (row["Record URL"] || "").trim(),
      file_url: docUrl,
      file_name: fileNameFromUrl(docUrl),
      source_domain: "faolex.fao.org",
      is_primary_source: true,
      status: "pending",
    });

    if (!error) {
      queued++;
    } else if (!error.message.includes("duplicate")) {
      errors++;
      if (errors <= 5) console.log(`  Insert error: ${error.message}`);
    }

    // Progress log
    if ((i + 1) % 500 === 0) {
      console.log(
        `  Progress: ${i + 1}/${rows.length} processed — ${queued} queued, ${skippedDup} dupes, ${skippedLang} non-English`
      );
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Queued:          ${queued}`);
  console.log(`  Skipped (lang):  ${skippedLang}`);
  console.log(`  Skipped (no URL):${skippedNoUrl}`);
  console.log(`  Skipped (repeal):${skippedRepealed}`);
  console.log(`  Skipped (dupe):  ${skippedDup}`);
  console.log(`  Errors:          ${errors}`);
}

main().catch(console.error);
