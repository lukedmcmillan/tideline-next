/**
 * Seed loader for entities, aliases, and starter sets.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/seed-loader.ts
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/seed-loader.ts --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import path from "path";
import { STARTER_SETS, type JobType } from "../app/lib/onboarding/starter-sets";

// ── Config ──────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const CSV_PATH = path.resolve(__dirname, "seed-entities.csv");
const PROGRESS_INTERVAL = 50;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Types ───────────────────────────────────────────────────
interface CsvRow {
  name: string;
  entity_type: string;
  subtype: string;
  description: string;
  tracker_tag: string;
  parent_entity_id_name: string;
  aliases: string;
  alias_types: string;
  starter_sets: string;
}

interface Stats {
  inserted: number;
  updated: number;
  skipped: number;
  aliasesInserted: number;
  starterSetRows: number;
  validationFailures: number;
  parentResolved: number;
}

const stats: Stats = {
  inserted: 0,
  updated: 0,
  skipped: 0,
  aliasesInserted: 0,
  starterSetRows: 0,
  validationFailures: 0,
  parentResolved: 0,
};

// ── Phase 1: Read CSV ───────────────────────────────────────
function readCsv(): CsvRow[] {
  const raw = readFileSync(CSV_PATH, "utf-8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
}

// ── Phase 2: Validate ───────────────────────────────────────
async function validate(rows: CsvRow[]): Promise<{
  valid: CsvRow[];
  rejected: CsvRow[];
}> {
  console.log("\n── Phase 2: Validation ──\n");

  // 2a. Fetch valid tracker slugs from velocity_scores
  const { data: slugRows, error: slugErr } = await supabase
    .from("velocity_scores")
    .select("tracker_slug")
    .limit(1000);

  if (slugErr) {
    console.error("  ✗ Failed to fetch velocity_scores:", slugErr.message);
    console.log("  → Falling back to hardcoded tracker slugs");
  }

  const validSlugs = new Set(
    slugRows
      ? [...new Set(slugRows.map((r: { tracker_slug: string }) => r.tracker_slug))]
      : [
          "imo-shipping", "iuu", "30x30", "blue-finance", "isa",
          "bbnj", "offshore-wind", "wto-fisheries", "plastics", "cites-marine",
        ],
  );
  console.log(`  Valid tracker slugs (${validSlugs.size}): ${[...validSlugs].join(", ")}`);

  const valid: CsvRow[] = [];
  const rejected: CsvRow[] = [];
  const slugFailures: string[] = [];

  for (const row of rows) {
    if (row.tracker_tag && !validSlugs.has(row.tracker_tag)) {
      rejected.push(row);
      slugFailures.push(`  ✗ Invalid tracker_tag "${row.tracker_tag}" on: ${row.name}`);
      continue;
    }
    valid.push(row);
  }

  if (slugFailures.length > 0) {
    console.log(`\n  Tracker tag validation failures (${slugFailures.length}):`);
    slugFailures.forEach((f) => console.log(f));
  } else {
    console.log("  ✓ All tracker_tag values valid");
  }

  // 2b. Check for duplicate name + entity_type
  const seen = new Map<string, number>();
  const dupes: string[] = [];

  for (const row of valid) {
    const key = `${row.name.toLowerCase()}::${row.entity_type}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) {
      dupes.push(`  ✗ Duplicate: "${row.name}" (${row.entity_type})`);
    }
  }

  if (dupes.length > 0) {
    console.log(`\n  Duplicate name+entity_type (${dupes.length}):`);
    dupes.forEach((d) => console.log(d));
  } else {
    console.log("  ✓ No duplicate name+entity_type combinations");
  }

  stats.validationFailures = rejected.length + dupes.length;

  // 2c. Summary
  console.log(`\n  Validation summary:`);
  console.log(`    Total rows:       ${rows.length}`);
  console.log(`    Valid:            ${valid.length}`);
  console.log(`    Rejected (slug):  ${rejected.length}`);
  console.log(`    Duplicates:       ${dupes.length}`);
  console.log(`    Mode:             ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  return { valid, rejected };
}

// ── Phase 3: Upsert entities ────────────────────────────────
async function upsertEntities(rows: CsvRow[]): Promise<Map<string, string>> {
  console.log("\n── Phase 3: Upsert entities ──\n");

  // Map of lowercase name → entity id (for alias and parent resolution)
  const nameToId = new Map<string, string>();

  // Pass 1: Insert/update all entities (skip parent_entity_id for now)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if ((i + 1) % PROGRESS_INTERVAL === 0) {
      console.log(`  Processing row ${i + 1}/${rows.length}...`);
    }

    // Build metadata object
    const metadata: Record<string, unknown> = {};
    if (row.subtype) metadata.subtype = row.subtype;

    if (DRY_RUN) {
      // Check if entity exists (case-insensitive)
      const { data: existing } = await supabase
        .from("entities")
        .select("id, name")
        .ilike("name", row.name)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  [DRY] Would UPDATE: ${row.name} (${row.entity_type})`);
        nameToId.set(row.name.toLowerCase(), existing[0].id);
        stats.updated++;
      } else {
        console.log(`  [DRY] Would INSERT: ${row.name} (${row.entity_type})`);
        nameToId.set(row.name.toLowerCase(), `dry-run-${i}`);
        stats.inserted++;
      }
      continue;
    }

    // Live: try case-insensitive match first
    const { data: existing } = await supabase
      .from("entities")
      .select("id, name, entity_type, description, tracker_tag, metadata")
      .ilike("name", row.name)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing entity
      const entity = existing[0];
      const updates: Record<string, unknown> = {};
      if (entity.entity_type !== row.entity_type) updates.entity_type = row.entity_type;
      if (entity.description !== row.description) updates.description = row.description;
      if (entity.tracker_tag !== (row.tracker_tag || null)) updates.tracker_tag = row.tracker_tag || null;

      const existingMeta = (entity.metadata as Record<string, unknown>) ?? {};
      if (row.subtype && existingMeta.subtype !== row.subtype) {
        updates.metadata = { ...existingMeta, subtype: row.subtype };
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("entities")
          .update(updates)
          .eq("id", entity.id);

        if (error) {
          console.error(`  ✗ Update failed for "${row.name}": ${error.message}`);
          stats.skipped++;
        } else {
          stats.updated++;
        }
      } else {
        stats.skipped++; // no changes needed
      }
      nameToId.set(row.name.toLowerCase(), entity.id);
    } else {
      // Insert new entity
      const { data: inserted, error } = await supabase
        .from("entities")
        .insert({
          name: row.name,
          entity_type: row.entity_type,
          description: row.description || null,
          tracker_tag: row.tracker_tag || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : {},
          mention_count: 0,
        })
        .select("id")
        .single();

      if (error) {
        // Might be a unique constraint conflict with different casing
        console.error(`  ✗ Insert failed for "${row.name}": ${error.message}`);
        stats.skipped++;
      } else {
        nameToId.set(row.name.toLowerCase(), inserted.id);
        stats.inserted++;
      }
    }
  }

  console.log(`\n  Pass 1 complete: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped`);

  // Pass 2: Resolve parent_entity_id references
  console.log("\n  Resolving parent references...");
  const parentRows = rows.filter((r) => r.parent_entity_id_name);

  for (const row of parentRows) {
    const entityId = nameToId.get(row.name.toLowerCase());
    const parentId = nameToId.get(row.parent_entity_id_name.toLowerCase());

    if (!entityId || !parentId) {
      if (!parentId) {
        console.log(`  ✗ Parent not found: "${row.parent_entity_id_name}" (for ${row.name})`);
      }
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Would set parent of "${row.name}" → "${row.parent_entity_id_name}"`);
      stats.parentResolved++;
      continue;
    }

    const { error } = await supabase
      .from("entities")
      .update({ parent_entity_id: parentId })
      .eq("id", entityId);

    if (error) {
      console.error(`  ✗ Parent update failed for "${row.name}": ${error.message}`);
    } else {
      stats.parentResolved++;
    }
  }

  console.log(`  Parent references resolved: ${stats.parentResolved}/${parentRows.length}`);

  return nameToId;
}

// ── Phase 4: Upsert aliases ─────────────────────────────────
async function upsertAliases(rows: CsvRow[], nameToId: Map<string, string>) {
  console.log("\n── Phase 4: Upsert aliases ──\n");

  for (const row of rows) {
    if (!row.aliases) continue;

    const entityId = nameToId.get(row.name.toLowerCase());
    if (!entityId || entityId.startsWith("dry-run-")) {
      if (DRY_RUN && row.aliases) {
        const aliases = row.aliases.split("|").slice(0, 5);
        console.log(`  [DRY] Would insert ${aliases.length} aliases for "${row.name}"`);
        stats.aliasesInserted += aliases.length;
      }
      continue;
    }

    const aliases = row.aliases.split("|").slice(0, 5);
    const aliasTypes = row.alias_types ? row.alias_types.split("|") : [];

    for (let i = 0; i < aliases.length; i++) {
      const aliasText = aliases[i].trim();
      if (!aliasText) continue;

      const aliasType = (aliasTypes[i]?.trim() || "common") as string;
      // Validate alias_type against constraint
      const validAliasType = ["common", "legal", "abbreviation"].includes(aliasType)
        ? aliasType
        : "common";

      if (DRY_RUN) {
        stats.aliasesInserted++;
        continue;
      }

      const { error } = await supabase.from("entity_aliases").upsert(
        {
          entity_id: entityId,
          alias_text: aliasText,
          alias_type: validAliasType,
        },
        { onConflict: "entity_id,alias_text", ignoreDuplicates: true },
      );

      if (error) {
        console.error(`  ✗ Alias insert failed for "${row.name}" → "${aliasText}": ${error.message}`);
      } else {
        stats.aliasesInserted++;
      }
    }
  }

  console.log(`  Aliases inserted/confirmed: ${stats.aliasesInserted}`);
}

// ── Phase 5: Populate starter sets ──────────────────────────
async function populateStarterSets(nameToId: Map<string, string>) {
  console.log("\n── Phase 5: Populate starter sets ──\n");

  const gaps: string[] = [];

  for (const [jobType, entities] of Object.entries(STARTER_SETS)) {
    for (let i = 0; i < entities.length; i++) {
      const entry = entities[i];

      // Try direct match first
      let entityId = nameToId.get(entry.name.toLowerCase());

      // If not found by name, try matching against known aliases
      if (!entityId) {
        // Search entities table by name (case-insensitive)
        if (!DRY_RUN) {
          const { data } = await supabase
            .from("entities")
            .select("id")
            .ilike("name", entry.name)
            .limit(1);

          if (data && data.length > 0) {
            entityId = data[0].id;
          } else {
            // Try alias table
            const { data: aliasMatch } = await supabase
              .from("entity_aliases")
              .select("entity_id")
              .ilike("alias_text", entry.name)
              .limit(1);

            if (aliasMatch && aliasMatch.length > 0) {
              entityId = aliasMatch[0].entity_id;
            }
          }
        }
      }

      if (!entityId) {
        gaps.push(`  ✗ ${jobType}: "${entry.name}" not found in entities table`);
        continue;
      }

      if (DRY_RUN) {
        stats.starterSetRows++;
        continue;
      }

      const { error } = await supabase.from("entity_starter_sets").upsert(
        {
          job_type: jobType,
          entity_id: entityId,
          display_order: i,
        },
        { onConflict: "job_type,entity_id", ignoreDuplicates: true },
      );

      if (error) {
        console.error(
          `  ✗ Starter set insert failed for ${jobType} → "${entry.name}": ${error.message}`,
        );
      } else {
        stats.starterSetRows++;
      }
    }
  }

  console.log(`  Starter set rows inserted: ${stats.starterSetRows}`);

  if (gaps.length > 0) {
    console.log(`\n  ⚠ Starter set gaps (${gaps.length} entities not found):`);
    gaps.forEach((g) => console.log(g));
    console.log("\n  These names in starter-sets.ts have no match in the entities table.");
    console.log("  Fix these before onboarding v2 deploys.");
  } else {
    console.log("  ✓ All starter set entities resolved");
  }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log(`║  Tideline Entity Seed Loader ${DRY_RUN ? "(DRY RUN)" : "(LIVE)   "}  ║`);
  console.log("╚════════════════════════════════════════╝");

  // Phase 1
  console.log("\n── Phase 1: Read CSV ──\n");
  const rows = readCsv();
  console.log(`  Read ${rows.length} rows from ${CSV_PATH}`);

  // Phase 2
  const { valid, rejected } = await validate(rows);

  if (rejected.length > 0 && !DRY_RUN) {
    console.log("\n  ⚠ Validation failures detected. Proceeding with valid rows only.");
  }

  if (valid.length === 0) {
    console.error("\n  ✗ No valid rows to process. Exiting.");
    process.exit(1);
  }

  // Phase 3
  const nameToId = await upsertEntities(valid);

  // Phase 4
  await upsertAliases(valid, nameToId);

  // Phase 5
  await populateStarterSets(nameToId);

  // Summary
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║            Final Summary               ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Entities inserted:     ${String(stats.inserted).padStart(5)}          ║`);
  console.log(`║  Entities updated:      ${String(stats.updated).padStart(5)}          ║`);
  console.log(`║  Entities skipped:      ${String(stats.skipped).padStart(5)}          ║`);
  console.log(`║  Parents resolved:      ${String(stats.parentResolved).padStart(5)}          ║`);
  console.log(`║  Aliases inserted:      ${String(stats.aliasesInserted).padStart(5)}          ║`);
  console.log(`║  Starter set rows:      ${String(stats.starterSetRows).padStart(5)}          ║`);
  console.log(`║  Validation failures:   ${String(stats.validationFailures).padStart(5)}          ║`);
  console.log("╚════════════════════════════════════════╝");

  if (DRY_RUN) {
    console.log("\n  This was a DRY RUN. No database changes were made.\n");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
