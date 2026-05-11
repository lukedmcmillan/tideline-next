/**
 * Verify that migration 20260511_informea_html_support.sql has been applied.
 * Checks for all 4 new columns:
 *   documents.canonical_url, documents.subtitle, documents.source_format
 *   document_queue.source_format
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/verify-migration.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumn(table: string, column: string): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(0);
  // PostgREST returns error code 42703 / message includes column name when column is missing
  if (error && (error.message.includes(column) || error.code === "42703")) {
    return false;
  }
  return true;
}

async function main() {
  const checks = [
    { table: "documents",       column: "canonical_url"  },
    { table: "documents",       column: "subtitle"       },
    { table: "documents",       column: "source_format"  },
    { table: "document_queue",  column: "source_format"  },
  ];

  let allPresent = true;
  console.log("\n=== Migration 20260511_informea_html_support status ===\n");

  for (const { table, column } of checks) {
    const exists = await checkColumn(table, column);
    const mark = exists ? "OK " : "MISSING";
    console.log(`  ${mark}  ${table}.${column}`);
    if (!exists) allPresent = false;
  }

  if (allPresent) {
    console.log("\n  All columns present — migration is applied.\n");
    process.exit(0);
  } else {
    console.log("\n  Migration NOT yet applied. Run the following SQL in Supabase Studio:");
    console.log(`
  ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS canonical_url  text,
    ADD COLUMN IF NOT EXISTS subtitle       text,
    ADD COLUMN IF NOT EXISTS source_format  text
      CHECK (source_format IN ('pdf', 'html', 'mixed'));

  ALTER TABLE public.document_queue
    ADD COLUMN IF NOT EXISTS source_format  text
      CHECK (source_format IN ('pdf', 'html', 'mixed'));
`);
    process.exit(1);
  }
}

main().catch(console.error);
