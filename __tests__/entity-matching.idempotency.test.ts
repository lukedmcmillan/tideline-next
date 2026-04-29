/**
 * Idempotency test for matchEntitiesToStory.
 *
 * Verifies that calling matchEntitiesToStory twice with the same story
 * increments mention_count exactly once (not twice).
 *
 * This test MUST FAIL on code with Bug 2 (ignoreDuplicates: false + unconditional
 * increment_entity_count) and PASS after the fix.
 *
 * Run after installing vitest:
 *   npm install -D vitest
 *   npx @dotenvx/dotenvx run -f .env.local -- npx vitest run __tests__/entity-matching.idempotency.test.ts
 */

import { describe, it, expect, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { matchEntitiesToStory } from "@/lib/entity-matching";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test fixtures — cleaned up in afterEach
const TEST_STORY_ID = "00000000-test-0000-0000-entity-idem";
const TEST_ENTITY_ID = "00000000-test-0000-0000-entity-test";
const TEST_ENTITY_NAME = "__test_idem_entity__";

async function seedFixtures() {
  // Insert a deterministic test entity with a unique name
  await supabase.from("entities").upsert({
    id: TEST_ENTITY_ID,
    name: TEST_ENTITY_NAME,
    entity_type: "organisation",
    mention_count: 0,
  });

  // Insert a test story whose title contains the entity name (triggers exact match)
  await supabase.from("stories").upsert({
    id: TEST_STORY_ID,
    title: `Report on ${TEST_ENTITY_NAME} activities`,
    short_summary: `Summary mentioning ${TEST_ENTITY_NAME} in context.`,
    link: "https://example.com/test-idem",
    source_name: "test",
    topic: "governance",
    fetched_at: new Date().toISOString(),
  });
}

async function getEntityMentionCount(): Promise<number> {
  const { data } = await supabase
    .from("entities")
    .select("mention_count")
    .eq("id", TEST_ENTITY_ID)
    .single();
  return data?.mention_count ?? 0;
}

async function cleanupFixtures() {
  await supabase.from("entity_mentions").delete().eq("story_id", TEST_STORY_ID);
  await supabase.from("stories").delete().eq("id", TEST_STORY_ID);
  await supabase.from("entities").delete().eq("id", TEST_ENTITY_ID);
}

describe("matchEntitiesToStory — idempotency", () => {
  afterEach(cleanupFixtures);

  it("increments mention_count exactly once when called twice with same story", async () => {
    await seedFixtures();

    // First call — should match and increment
    const result1 = await matchEntitiesToStory(TEST_STORY_ID);
    expect(result1.entityIds).toContain(TEST_ENTITY_ID);

    const countAfterFirst = await getEntityMentionCount();
    expect(countAfterFirst).toBe(1);

    // Second call — same story, same entity — should NOT increment again
    const result2 = await matchEntitiesToStory(TEST_STORY_ID);
    expect(result2.entityIds).toContain(TEST_ENTITY_ID);

    const countAfterSecond = await getEntityMentionCount();
    expect(countAfterSecond).toBe(1); // Must still be 1, not 2
  }, 30000);
});
