/**
 * scripts/merge-entity-duplicates.ts
 *
 * Executes 7 confirmed entity merges. Transfers entity_mentions, user_entities,
 * and entity_aliases from remove_id to keep_id, then deletes the duplicate row.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/merge-entity-duplicates.ts --dry-run
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/merge-entity-duplicates.ts
 *
 * Logs written to logs/merge-entity-duplicates-<timestamp>.json
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");

interface Merge {
  keepId: string;
  keepName: string;
  removeIds: string[];
  aliases: string[];
  setType?: string; // override entity_type on keepId inside merge
}

const MERGES: Merge[] = [
  {
    keepId: "a0e62d32-730d-459f-808f-366067536f26",
    keepName: "United States",
    removeIds: [
      "03bf3fba-e62c-44a1-a779-b35d07188f59", // U.S.
      "5530fac0-90e3-4c2f-a6bc-0e0a7ebc1caf", // US
    ],
    aliases: ["U.S.", "US", "USA", "U.S.A."],
  },
  {
    keepId: "f7d84bee-ac7b-4504-bfdb-3a5e11b44883",
    keepName: "United Nations",
    removeIds: ["472f85d1-8c3c-4ad3-aa20-14117844ba60"], // UN
    aliases: ["UN", "U.N."],
  },
  {
    keepId: "bf370a39-bc2f-4831-8a42-8b57e7fa1d8f",
    keepName: "Trump",
    removeIds: ["d01b5df0-00ab-4bc3-a183-d597d1cb7ee7"], // Trump individual
    aliases: [],
  },
  {
    keepId: "d5a11e50-f67f-4de7-90eb-d53ea7c67a9f",
    keepName: "PLOS ONE",
    removeIds: ["5f5be252-725c-4575-baf2-efa56efb3f4a"], // PLOS One
    aliases: ["PLOS One", "Plos One"],
  },
  {
    keepId: "cefe0575-1a59-4090-9e19-46230b01eac2",
    keepName: "Endangered Species Act",
    removeIds: ["c552ca2d-e7b1-4e0b-b860-3445b92772cb"], // organisation duplicate
    aliases: [],
  },
  {
    keepId: "885d88ab-da92-4b8a-a29b-37d2e43dc130",
    keepName: "Drones",
    removeIds: ["cbd567f7-d9c4-41e7-a9e1-7ccdcfc2b092"], // drones (lowercase)
    aliases: [],
  },
  {
    keepId: "96a3fb5e-edd3-4d9f-ba26-1fa539db87a9",
    keepName: "Oceana",
    removeIds: ["0c278c98-575a-48e4-adac-d737ac917b19"], // Oceana ngo duplicate
    aliases: [],
    setType: "ngo",
  },
];

interface MergeLog {
  keepId: string;
  keepName: string;
  removeId: string;
  mentionsMoved: number;
  userEntitiesMoved: number;
  aliasesInserted: number;
  aliasesMoved: number;
  mentionCountAfter: number;
  errors: string[];
}

async function runMerge(merge: Merge): Promise<MergeLog[]> {
  const logs: MergeLog[] = [];

  for (const removeId of merge.removeIds) {
    const log: MergeLog = {
      keepId: merge.keepId,
      keepName: merge.keepName,
      removeId,
      mentionsMoved: 0,
      userEntitiesMoved: 0,
      aliasesInserted: 0,
      aliasesMoved: 0,
      mentionCountAfter: 0,
      errors: [],
    };

    console.log(`\n  merging ${removeId} → ${merge.keepId} (${merge.keepName})`);

    // 1. Fetch the removed entity's name (for alias creation)
    const { data: removeEntity } = await supabase
      .from("entities")
      .select("id, name, entity_type")
      .eq("id", removeId)
      .single();

    if (!removeEntity) {
      const msg = `  WARN: removeId ${removeId} not found — already merged?`;
      console.log(msg);
      log.errors.push(msg);
      logs.push(log);
      continue;
    }

    console.log(`    remove entity: "${removeEntity.name}" (${removeEntity.entity_type})`);

    if (DRY_RUN) {
      // Count what would be moved
      const { data: removeMentions } = await supabase
        .from("entity_mentions")
        .select("story_id")
        .eq("entity_id", removeId);

      const { data: keepMentionsDry } = await supabase
        .from("entity_mentions")
        .select("story_id")
        .eq("entity_id", merge.keepId);

      const keepStoriesDry = new Set((keepMentionsDry || []).map(m => m.story_id));
      const conflictCount = (removeMentions || []).filter(m => keepStoriesDry.has(m.story_id)).length;
      const mentionCount = (removeMentions || []).length;
      const safeToMove = mentionCount - conflictCount;

      const { count: ueCount } = await supabase
        .from("user_entities")
        .select("*", { count: "exact", head: true })
        .eq("entity_id", removeId);

      const { count: aliasCount } = await supabase
        .from("entity_aliases")
        .select("*", { count: "exact", head: true })
        .eq("entity_id", removeId);

      console.log(`    [dry-run] mentions: ${mentionCount} total, ${conflictCount} conflicts (will delete), ${safeToMove} will move`);
      console.log(`    [dry-run] user_entities: ${ueCount ?? 0}, aliases: ${aliasCount ?? 0}`);
      console.log(`    [dry-run] would insert alias "${removeEntity.name}" into entity_aliases for keep`);

      if (merge.setType) {
        console.log(`    [dry-run] would set entity_type = '${merge.setType}' on keep ${merge.keepId}`);
      }

      log.mentionsMoved = safeToMove;
      log.userEntitiesMoved = ueCount ?? 0;
      log.aliasesMoved = aliasCount ?? 0;
      logs.push(log);
      continue;
    }

    // LIVE OPERATIONS — ordered to be recoverable if interrupted

    // Step 1: Set entity_type on keep (only for Oceana merge)
    if (merge.setType) {
      const { error } = await supabase
        .from("entities")
        .update({ entity_type: merge.setType })
        .eq("id", merge.keepId);
      if (error) log.errors.push(`setType: ${error.message}`);
      else console.log(`    set entity_type = '${merge.setType}' on keep`);
    }

    // Step 2: Move user_entities (skip if user already follows keep)
    const { data: ueToMove } = await supabase
      .from("user_entities")
      .select("user_id, entity_id")
      .eq("entity_id", removeId);

    if (ueToMove && ueToMove.length > 0) {
      for (const ue of ueToMove) {
        // Check if user already follows keep
        const { data: existing } = await supabase
          .from("user_entities")
          .select("user_id")
          .eq("user_id", ue.user_id)
          .eq("entity_id", merge.keepId)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from("user_entities")
            .update({ entity_id: merge.keepId })
            .eq("user_id", ue.user_id)
            .eq("entity_id", removeId);
          if (!error) log.userEntitiesMoved++;
          else log.errors.push(`user_entities update: ${error.message}`);
        }
        // If existing, the delete below handles the orphan
      }
    }

    // Step 3: Delete any remaining user_entities for remove_id
    await supabase.from("user_entities").delete().eq("entity_id", removeId);

    // Step 4a: Delete conflicting entity_mentions (story already covered by keep)
    const { data: keepMentions } = await supabase
      .from("entity_mentions")
      .select("story_id")
      .eq("entity_id", merge.keepId);

    const keepStoryIds = (keepMentions || []).map(m => m.story_id);

    if (keepStoryIds.length > 0) {
      const { error: conflictErr } = await supabase
        .from("entity_mentions")
        .delete()
        .eq("entity_id", removeId)
        .in("story_id", keepStoryIds);
      if (conflictErr) log.errors.push(`conflict delete: ${conflictErr.message}`);
      else console.log(`    deleted ${keepStoryIds.length > 0 ? "up to" : 0} conflicting mentions`);
    }

    // Step 4b: Move remaining entity_mentions (no more unique-constraint conflicts)
    const { data: movedMentions, error: mentionErr } = await supabase
      .from("entity_mentions")
      .update({ entity_id: merge.keepId })
      .eq("entity_id", removeId)
      .select();

    if (mentionErr) {
      log.errors.push(`entity_mentions update: ${mentionErr.message}`);
    } else {
      log.mentionsMoved = movedMentions?.length ?? 0;
      console.log(`    moved ${log.mentionsMoved} entity_mentions`);
    }

    // Step 5: Insert alias for the removed entity's name
    const { error: aliasInsertErr } = await supabase
      .from("entity_aliases")
      .upsert(
        { entity_id: merge.keepId, alias_text: removeEntity.name },
        { onConflict: "entity_id,alias_text", ignoreDuplicates: true }
      );
    if (!aliasInsertErr) {
      log.aliasesInserted++;
      console.log(`    inserted alias "${removeEntity.name}"`);
    } else {
      log.errors.push(`alias insert: ${aliasInsertErr.message}`);
    }

    // Step 6: Move existing aliases from remove to keep
    const { data: movedAliases, error: aliasMoveErr } = await supabase
      .from("entity_aliases")
      .update({ entity_id: merge.keepId })
      .eq("entity_id", removeId)
      .select();

    if (aliasMoveErr) {
      log.errors.push(`entity_aliases move: ${aliasMoveErr.message}`);
    } else {
      log.aliasesMoved = movedAliases?.length ?? 0;
      console.log(`    moved ${log.aliasesMoved} existing aliases`);
    }

    // Step 7: Delete the removed entity row
    const { error: deleteErr } = await supabase
      .from("entities")
      .delete()
      .eq("id", removeId);

    if (deleteErr) {
      log.errors.push(`delete entity: ${deleteErr.message}`);
    } else {
      console.log(`    deleted entity ${removeId}`);
    }

    // Step 8: Recalculate mention_count for keep
    const { count: newCount } = await supabase
      .from("entity_mentions")
      .select("*", { count: "exact", head: true })
      .eq("entity_id", merge.keepId);

    log.mentionCountAfter = newCount ?? 0;

    const { error: recalcErr } = await supabase
      .from("entities")
      .update({ mention_count: log.mentionCountAfter })
      .eq("id", merge.keepId);

    if (recalcErr) {
      log.errors.push(`recalc mention_count: ${recalcErr.message}`);
    } else {
      console.log(`    mention_count recalculated → ${log.mentionCountAfter}`);
    }

    logs.push(log);
  }

  // Step 9: Backfill explicit aliases (e.g. USA, U.S.A.) for the keep entity
  if (!DRY_RUN && merge.aliases.length > 0) {
    for (const alias of merge.aliases) {
      await supabase
        .from("entity_aliases")
        .upsert(
          { entity_id: merge.keepId, alias_text: alias },
          { onConflict: "entity_id,alias_text", ignoreDuplicates: true }
        );
    }
    console.log(`    backfilled ${merge.aliases.length} explicit aliases: ${merge.aliases.join(", ")}`);
  }

  return logs;
}

async function verify() {
  console.log("\n--- VERIFICATION ---");

  const checkIds = [
    { id: "a0e62d32-730d-459f-808f-366067536f26", expectedName: "United States", expectedType: "organisation" },
    { id: "f7d84bee-ac7b-4504-bfdb-3a5e11b44883", expectedName: "United Nations", expectedType: "organisation" },
    { id: "bf370a39-bc2f-4831-8a42-8b57e7fa1d8f", expectedName: "Trump", expectedType: "person" },
    { id: "d5a11e50-f67f-4de7-90eb-d53ea7c67a9f", expectedName: "PLOS ONE", expectedType: "organisation" },
    { id: "cefe0575-1a59-4090-9e19-46230b01eac2", expectedName: "Endangered Species Act", expectedType: "instrument" },
    { id: "885d88ab-da92-4b8a-a29b-37d2e43dc130", expectedName: "Drones", expectedType: "instrument" },
    { id: "96a3fb5e-edd3-4d9f-ba26-1fa539db87a9", expectedName: "Oceana", expectedType: "ngo" },
  ];

  for (const check of checkIds) {
    const { data } = await supabase
      .from("entities")
      .select("id, name, entity_type, mention_count")
      .eq("id", check.id)
      .single();

    if (!data) {
      console.log(`  ✗ ${check.expectedName} (${check.id}): NOT FOUND`);
    } else {
      const typeOk = data.entity_type === check.expectedType ? "✓" : `✗ (got ${data.entity_type})`;
      console.log(`  ${typeOk} ${data.name} — type=${data.entity_type}, mention_count=${data.mention_count}`);
    }
  }

  // Check no 'individual' type remains
  const { count: individualCount } = await supabase
    .from("entities")
    .select("*", { count: "exact", head: true })
    .eq("entity_type", "individual");

  // Note: 'individual' rows may still exist if Step E hasn't run yet
  console.log(`  entity_type='individual' remaining: ${individualCount ?? 0} (will be 0 after Step E)`);

  // Sum check
  const { data: allEntities } = await supabase
    .from("entities")
    .select("mention_count");

  const { count: mentionTotal } = await supabase
    .from("entity_mentions")
    .select("*", { count: "exact", head: true });

  const sumCount = (allEntities ?? []).reduce((acc, e) => acc + (e.mention_count ?? 0), 0);

  if (sumCount === mentionTotal) {
    console.log(`  ✓ SUM(mention_count) (${sumCount}) = COUNT(entity_mentions) (${mentionTotal})`);
  } else {
    console.log(`  ✗ SUM/COUNT MISMATCH: sum=${sumCount} vs mentions=${mentionTotal}`);
  }
}

async function main() {
  console.log(`\n[merge] mode=${DRY_RUN ? "DRY-RUN" : "LIVE"}`);
  console.log(`[merge] ${MERGES.length} merges, ${MERGES.reduce((acc, m) => acc + m.removeIds.length, 0)} remove entities\n`);

  const allLogs: MergeLog[] = [];

  for (const merge of MERGES) {
    console.log(`\n[merge] === ${merge.keepName} (keep: ${merge.keepId}) ===`);
    const logs = await runMerge(merge);
    allLogs.push(...logs);
  }

  await verify();

  // Write logs
  if (!DRY_RUN) {
    const logsDir = join(process.cwd(), "logs");
    mkdirSync(logsDir, { recursive: true });
    const filename = join(logsDir, `merge-entity-duplicates-${Date.now()}.json`);
    writeFileSync(filename, JSON.stringify(allLogs, null, 2));
    console.log(`\n[merge] log written to ${filename}`);
  }

  const errors = allLogs.flatMap((l) => l.errors);
  if (errors.length > 0) {
    console.error(`\n[merge] ERRORS (${errors.length}):`);
    errors.forEach((e) => console.error("  ", e));
    process.exit(1);
  }

  console.log("\n[merge] done.\n");
}

main().catch((err) => {
  console.error("[merge] unexpected error:", err);
  process.exit(1);
});
