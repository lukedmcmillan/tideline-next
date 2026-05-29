import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { resolve } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CSV_PATH = resolve(__dirname, "FAOLEX_Fisheries.csv");

// Ocean-relevant keywords — matched against Keywords column (comma-separated terms)
const OCEAN_INCLUDE_KEYWORDS = [
  "marine fisheries", "marine aquaculture", "coastal", "port state",
  "iuu", "illegal fishing", "high seas", "exclusive economic zone", "eez",
  "seabed", "deep sea", "deep-sea", "flag state", "vessel monitoring",
  "fishing vessel", "fishing fleet", "tuna", "shark", "coral",
  "bycatch", "discard", "rfmo", "regional fisheries",
  "sea", "ocean", "maritime", "offshore", "territorial waters",
  "continental shelf", "straits", "archipelagic",
  "pelagic", "demersal", "benthic", "aquaculture (marine)",
];

// Freshwater/terrestrial exclusion — exclude if these appear and NO ocean term is present
const FRESHWATER_ONLY_KEYWORDS = [
  "inland fisheries", "inland waters", "freshwater", "river fisheries",
  "lake fisheries", "pond aquaculture", "freshwater aquaculture",
];

function isOceanRelevant(keywords: string): boolean {
  const lower = keywords.toLowerCase();

  // Include if any ocean keyword present
  if (OCEAN_INCLUDE_KEYWORDS.some(k => lower.includes(k))) return true;

  // Exclude if only freshwater/inland terms present
  if (FRESHWATER_ONLY_KEYWORDS.some(k => lower.includes(k))) {
    // Check if ANY ocean term also present before excluding
    const hasOceanTerm = ["marine", "ocean", "coastal", "sea", "maritime",
      "offshore", "vessel", "fishing vessel", "tuna", "shark"].some(k => lower.includes(k));
    if (!hasOceanTerm) return false;
  }

  // Default: include (FAOLEX is already fisheries/aquaculture domain)
  return true;
}

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
  "Text URL": string;
  Title: string;
  "Original title": string;
  "Date of text": string;
  "Last amended date": string;
  "Language of document": string;
  Country: string;
  "Regional organizations": string;
  "Type of text": string;
  Repealed: string;
  Abstract: string;
  "Primary subjects": string;
  Domain: string;
  Keywords: string;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`=== Tideline FAOLEX CSV Importer${dryRun ? " (DRY RUN)" : ""} ===\n`);

  const rows: FaolexRow[] = await new Promise((res, rej) => {
    const results: FaolexRow[] = [];
    createReadStream(CSV_PATH, { encoding: "utf-8" })
      .pipe(parse({ columns: true, bom: true, skip_empty_lines: true }))
      .on("data", (row: FaolexRow) => results.push(row))
      .on("end", () => res(results))
      .on("error", rej);
  });

  console.log(`Total rows in CSV: ${rows.length}`);

  let queued = 0;
  let skippedLang = 0;
  let skippedNoUrl = 0;
  let skippedRepealed = 0;
  let skippedOcean = 0;
  let skippedDup = 0;
  let errors = 0;
  let oceanRelevantCount = 0;

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

    // Filter: ocean relevance
    const keywords = (row["Keywords"] || "") + " " + (row["Primary subjects"] || "");
    if (!isOceanRelevant(keywords)) {
      skippedOcean++;
      continue;
    }
    oceanRelevantCount++;

    // Progress every 50 ocean-relevant records
    if (oceanRelevantCount % 50 === 0) {
      console.log(
        `  Progress: ${i + 1}/${rows.length} rows scanned — ` +
        `${oceanRelevantCount} ocean-relevant, ${queued} queued, ` +
        `${skippedDup} dups, ${skippedOcean} not ocean`
      );
    }

    if (dryRun) {
      if (oceanRelevantCount <= 10) {
        console.log(`  [DRY RUN] Would queue: ${(row["Title"] || "").slice(0, 80)}`);
        console.log(`    Keywords: ${keywords.slice(0, 100)}`);
      }
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
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`  Total CSV rows:          ${rows.length}`);
  console.log(`  Ocean-relevant:          ${oceanRelevantCount}`);
  console.log(`  Queued:                  ${queued}`);
  console.log(`  Skipped (language):      ${skippedLang}`);
  console.log(`  Skipped (no URL):        ${skippedNoUrl}`);
  console.log(`  Skipped (repealed):      ${skippedRepealed}`);
  console.log(`  Skipped (not ocean):     ${skippedOcean}`);
  console.log(`  Skipped (duplicate):     ${skippedDup}`);
  console.log(`  Errors:                  ${errors}`);

  const dupRate = oceanRelevantCount > 0 ? (skippedDup / oceanRelevantCount * 100).toFixed(1) : "0";
  console.log(`\n  Dedup rate: ${dupRate}% of ocean-relevant rows were already in DB`);
  if (parseFloat(dupRate) > 20) {
    console.warn(`  ⚠ WARNING: dedup rate >20% — check for schema mismatch or prior import`);
  }
}

main().catch(console.error);
