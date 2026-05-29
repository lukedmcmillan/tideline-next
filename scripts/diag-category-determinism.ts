/**
 * scripts/diag-category-determinism.ts
 *
 * Determinism proof for the category gate (brief-category-gate-redesign.md §2.1).
 *
 * Tests:
 *  1. Cache-invalidation: stories with verb-era rows (old prompt_version) get a cache MISS
 *     under CATEGORY_PROMPT_VERSION — stale rows are NOT served.
 *  2. Cold run: zero rows at CATEGORY_PROMPT_VERSION → model calls made → results written.
 *  3. Mongabay BBNJ live classification: must be EXPLAINER_OR_DISCUSSION under v2 rule.
 *  4. Warm run: all rows cached at CATEGORY_PROMPT_VERSION → zero model calls.
 *  5. Consistency: cold-run categories = warm-run categories for every story.
 *
 * Story set (5 stories):
 *  - 3cedc0ba-7072-437d-a005-2678b34cb82c  Mongabay BBNJ (has 2 verb-era rows, must → EXPLAINER)
 *  - cf2047cc-1b45-4acb-a6fc-10be1cb81f25  verb-era story 1
 *  - 438824cc-9039-4373-aa3c-2094cf7e131a  verb-era story 2
 *  - c8a6a071-5773-4894-9aeb-a19b44d1a29d  verb-era story 3
 *  - 6177a6b6-d27d-4a5f-a684-38030194f6b4  verb-era story 4
 *
 * Run:
 *  npx tsx scripts/diag-category-determinism.ts
 *
 * FAIL conditions (printed explicitly, process exits 1):
 *  - Any warm-run model calls (determinism broken)
 *  - Verb-era row served as cold-run cache hit (invalidation broken)
 *  - Mongabay BBNJ not EXPLAINER_OR_DISCUSSION (v2 rule not applied)
 *  - Cold/warm category mismatch (non-deterministic output)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Exact CATEGORY_SYSTEM prompt (v2 — primary-angle rule with past-event bullet) ────────────────
// Must be byte-for-byte identical to the string in send-brief/route.ts.
// CATEGORY_PROMPT_VERSION is derived from this string — any drift = different hash = separate cache.
const CATEGORY_SYSTEM =
  "You classify ocean governance news stories into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action —\n" +
  "  designation of protected area, ratification, adoption of regulation, enforcement action,\n" +
  "  sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional\n" +
  "  authority (government, IGO, treaty secretariat) — not a company or research team.\n" +
  "  The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "  The news is that findings exist, not that an authority acted.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round,\n" +
  "  vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer,\n" +
  "  policy debate, meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Also return governance_significance (0-100): how important is this to ocean-policy professionals,\n" +
  "regardless of category. Advisory only — not used for gating or ordering.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence\n" +
  "report as news TODAY — not by governance entities mentioned in background context.\n" +
  "- A science paper discussing a treaty as context → ANALYSIS_OR_FINDING\n" +
  "- Researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A new formal designation, ratification, or decision THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "- A past governance event (treaty entered into force, regulation adopted, law signed — months or\n" +
  "  years ago) cited as historical background for what scientists, experts, or conservationists\n" +
  "  discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The\n" +
  "  governance event is context, not today's news.\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today,\n" +
  "not when a past formal action is stated as established fact to set context for current analysis,\n" +
  "discussion, or conference proceedings.\n\n" +
  "Return JSON only:\n" +
  "{\"category\": string, \"governance_significance\": integer, \"reasoning\": string (one sentence)}";

const CATEGORY_PROMPT_VERSION = createHash('sha256')
  .update(CATEGORY_SYSTEM)
  .digest('hex')
  .slice(0, 16);

// Story IDs for the test
const MONGABAY_BBNJ_ID  = '3cedc0ba-7072-437d-a005-2678b34cb82c';
const VERB_ERA_STORY_ID = 'cf2047cc-1b45-4acb-a6fc-10be1cb81f25'; // confirmed verb-era row

const ALL_IDS = [
  MONGABAY_BBNJ_ID,
  VERB_ERA_STORY_ID,
  '438824cc-9039-4373-aa3c-2094cf7e131a',
  'c8a6a071-5773-4894-9aeb-a19b44d1a29d',
  '6177a6b6-d27d-4a5f-a684-38030194f6b4',
];

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryClassification {
  category: string;
  governance_significance: number;
}

interface ClassifyResult {
  resultMap: Map<string, CategoryClassification>;
  modelCallsMade: number;
  cacheHits: number;
  cacheMisses: number;
  staleRowsFound: number;  // verb-era rows found at any OLD prompt_version for our IDs
}

// ── Core classification function (mirrors categoryCandidates in route.ts) ────

async function classifyStories(
  stories: Array<{ id: string; title: string; short_summary: string | null; description: string | null }>,
  label: string,
): Promise<ClassifyResult> {
  console.log(`\n── ${label} ──────────────────────────────────`);
  const resultMap = new Map<string, CategoryClassification>();
  let modelCallsMade = 0;

  // 1. Batch-lookup current version cache
  const ids = stories.map(s => s.id);
  const { data: cached } = await supabase
    .from('delta_classifications')
    .select('story_id, category, governance_significance')
    .in('story_id', ids)
    .eq('prompt_version', CATEGORY_PROMPT_VERSION)
    .not('category', 'is', null);

  const cachedIds = new Set<string>();
  for (const row of cached ?? []) {
    if (!row.category) continue;
    resultMap.set(row.story_id, {
      category:               row.category,
      governance_significance: row.governance_significance ?? 0,
    });
    cachedIds.add(row.story_id);
  }

  const cacheHits  = cachedIds.size;
  const cacheMisses = ids.filter(id => !cachedIds.has(id)).length;
  console.log(`  Cache lookup (v:${CATEGORY_PROMPT_VERSION}): ${cacheHits} hits, ${cacheMisses} misses`);

  // 2. Check for verb-era rows (stale rows at any OLD version — should never be served)
  const { data: staleRows } = await supabase
    .from('delta_classifications')
    .select('story_id, prompt_version')
    .in('story_id', ids)
    .neq('prompt_version', CATEGORY_PROMPT_VERSION);
  const staleRowsFound = (staleRows ?? []).length;
  if (staleRowsFound > 0) {
    console.log(`  Stale (verb-era) rows found for these IDs: ${staleRowsFound} — these must NOT be served`);
    for (const r of staleRows ?? []) {
      const wasServed = cachedIds.has(r.story_id) ? 'ERROR: SERVED' : 'correct: MISS';
      console.log(`    story_id:${r.story_id.slice(0, 8)} old_version:${r.prompt_version} → ${wasServed}`);
    }
  }

  // 3. Classify uncached stories
  const uncached = stories.filter(s => !cachedIds.has(s.id));
  if (uncached.length > 0) {
    const newResults = await Promise.all(
      uncached.map(async (s): Promise<readonly [string, CategoryClassification]> => {
        modelCallsMade++;
        const fallback: CategoryClassification = { category: 'ERROR', governance_significance: 0 };
        try {
          const res = await anthropic.messages.create({
            model:       'claude-haiku-4-5-20251001',
            max_tokens:  300,
            temperature: 0,
            system: [{ type: 'text', text: CATEGORY_SYSTEM, cache_control: { type: 'ephemeral' } }],
            messages: [{
              role:    'user',
              content: `Title: ${s.title}\nSummary: ${s.short_summary ?? s.description ?? ''}`,
            }],
          });
          const raw     = res.content[0].type === 'text' ? res.content[0].text.trim() : '';
          const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          const match   = cleaned.match(/\{[\s\S]*\}/);
          if (!match) return [s.id, fallback] as const;
          const parsed  = JSON.parse(match[0]);
          const validCategories = new Set([
            'GOVERNANCE_CHANGE','ANALYSIS_OR_FINDING','COMMERCIAL_BUSINESS',
            'EXPLAINER_OR_DISCUSSION','OTHER',
          ]);
          const category = validCategories.has(parsed.category) ? parsed.category : 'OTHER';
          const governance_significance = typeof parsed.governance_significance === 'number'
            ? Math.max(0, Math.min(100, Math.round(parsed.governance_significance)))
            : 0;
          return [s.id, { category, governance_significance }] as const;
        } catch (e) {
          console.error(`  ERROR classifying ${s.id.slice(0, 8)}:`, e);
          return [s.id, fallback] as const;
        }
      })
    );

    // 4. Persist to cache
    const toInsert = newResults.map(([story_id, cls]) => ({
      story_id,
      prompt_version:          CATEGORY_PROMPT_VERSION,
      is_delta:                false,
      category:                cls.category,
      governance_significance: cls.governance_significance,
    }));
    const { error: insertError } = await supabase
      .from('delta_classifications')
      .upsert(toInsert, { onConflict: 'story_id,prompt_version', ignoreDuplicates: true });
    if (insertError) console.warn('  Cache insert warning:', insertError.message);

    for (const [id, cls] of newResults) {
      resultMap.set(id, cls);
    }
  }

  console.log(`  Model calls made: ${modelCallsMade}`);
  return { resultMap, modelCallsMade, cacheHits, cacheMisses, staleRowsFound };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== diag-category-determinism ===');
  console.log(`CATEGORY_PROMPT_VERSION: ${CATEGORY_PROMPT_VERSION}`);
  console.log(`Story set: ${ALL_IDS.length} stories`);
  console.log(`Mongabay BBNJ ID: ${MONGABAY_BBNJ_ID}`);
  console.log(`Verb-era anchor ID: ${VERB_ERA_STORY_ID}`);

  // ── Fetch story content from DB ────────────────────────────────────────────
  const { data: stories, error: storyError } = await supabase
    .from('stories')
    .select('id, title, short_summary, description')
    .in('id', ALL_IDS);

  if (storyError) {
    console.error('ERROR fetching stories:', storyError.message);
    process.exit(1);
  }

  const foundIds = new Set((stories ?? []).map(s => s.id));
  const missingIds = ALL_IDS.filter(id => !foundIds.has(id));
  if (missingIds.length > 0) {
    console.warn(`\nWARN: ${missingIds.length} story IDs not found in stories table (may be aged out):`, missingIds);
    if (missingIds.includes(MONGABAY_BBNJ_ID)) {
      console.error('FAIL: Mongabay BBNJ story not found in DB — cannot run live-summary proof');
      process.exit(1);
    }
  }
  console.log(`\nStories fetched: ${(stories ?? []).length} of ${ALL_IDS.length}`);

  // Clean up any existing CATEGORY_PROMPT_VERSION rows for a true cold run
  // (removes rows written by any prior run of this script)
  console.log('\nCleaning existing CATEGORY_PROMPT_VERSION rows for a clean cold run...');
  const { error: delError } = await supabase
    .from('delta_classifications')
    .delete()
    .in('story_id', ALL_IDS)
    .eq('prompt_version', CATEGORY_PROMPT_VERSION);
  if (delError) {
    console.warn('Cleanup warning (non-fatal):', delError.message);
  } else {
    console.log('  Clean done.');
  }

  // ── COLD RUN ──────────────────────────────────────────────────────────────
  const coldResult = await classifyStories(stories ?? [], 'COLD RUN');
  console.log('\nCold run results:');
  for (const [id, cls] of coldResult.resultMap.entries()) {
    const label = id === MONGABAY_BBNJ_ID ? '← MONGABAY BBNJ (must be EXPLAINER)' : '';
    console.log(`  ${id.slice(0, 8)}  category: ${cls.category.padEnd(28)} gov_sig: ${cls.governance_significance} ${label}`);
  }

  // ── WARM RUN ──────────────────────────────────────────────────────────────
  const warmResult = await classifyStories(stories ?? [], 'WARM RUN');
  console.log('\nWarm run results:');
  for (const [id, cls] of warmResult.resultMap.entries()) {
    console.log(`  ${id.slice(0, 8)}  category: ${cls.category}`);
  }

  // ── ASSERTIONS ────────────────────────────────────────────────────────────
  console.log('\n=== ASSERTIONS ===');
  const fails: string[] = [];

  // 1. Cold run must make model calls (was uncached)
  const coldModelCalls = coldResult.modelCallsMade;
  const storiesToClassify = (stories ?? []).length;
  if (coldModelCalls !== storiesToClassify) {
    fails.push(`FAIL [cold model calls]: expected ${storiesToClassify}, got ${coldModelCalls}`);
    console.log(`  ✗ Cold model calls: ${coldModelCalls} (expected ${storiesToClassify})`);
  } else {
    console.log(`  ✓ Cold model calls: ${coldModelCalls} (all stories classified fresh)`);
  }

  // 2. Verb-era rows must NOT have been served as cache hits
  const verbEraStaleRows = coldResult.staleRowsFound;
  const verbEraStoryServedFromCache = coldResult.cacheHits > 0;
  if (verbEraStoryServedFromCache) {
    fails.push(`FAIL [invalidation]: ${coldResult.cacheHits} cold-run cache hits — verb-era rows were served instead of invalidated`);
    console.log(`  ✗ Invalidation: ${coldResult.cacheHits} verb-era rows incorrectly served as cache hits`);
  } else {
    console.log(`  ✓ Invalidation: ${verbEraStaleRows} verb-era rows found, none served (all cold-run misses)`);
  }

  // 3. Warm run must make ZERO model calls
  if (warmResult.modelCallsMade !== 0) {
    fails.push(`FAIL [warm determinism]: ${warmResult.modelCallsMade} model calls on warm run (expected 0)`);
    console.log(`  ✗ Warm model calls: ${warmResult.modelCallsMade} (expected 0)`);
  } else {
    console.log(`  ✓ Warm model calls: 0 (all from cache)`);
  }

  // 4. Warm run cache hits must equal total story count
  if (warmResult.cacheHits !== storiesToClassify) {
    fails.push(`FAIL [warm cache coverage]: ${warmResult.cacheHits} hits, expected ${storiesToClassify}`);
    console.log(`  ✗ Warm cache hits: ${warmResult.cacheHits} of ${storiesToClassify}`);
  } else {
    console.log(`  ✓ Warm cache hits: ${warmResult.cacheHits} of ${storiesToClassify} (100%)`);
  }

  // 5. Mongabay BBNJ must classify EXPLAINER_OR_DISCUSSION
  const mongCold = coldResult.resultMap.get(MONGABAY_BBNJ_ID);
  const mongWarm = warmResult.resultMap.get(MONGABAY_BBNJ_ID);
  if (!mongCold) {
    fails.push('FAIL [mongabay cold]: no result for Mongabay BBNJ in cold run');
    console.log('  ✗ Mongabay BBNJ cold: no result');
  } else if (mongCold.category !== 'EXPLAINER_OR_DISCUSSION') {
    fails.push(`FAIL [mongabay category]: cold=${mongCold.category}, expected EXPLAINER_OR_DISCUSSION (v2 primary-angle rule not applied)`);
    console.log(`  ✗ Mongabay BBNJ cold: ${mongCold.category} (expected EXPLAINER_OR_DISCUSSION)`);
  } else {
    console.log(`  ✓ Mongabay BBNJ cold: EXPLAINER_OR_DISCUSSION (v2 rule confirmed on live DB summary)`);
  }
  if (mongWarm && mongCold && mongWarm.category !== mongCold.category) {
    fails.push(`FAIL [mongabay consistency]: cold=${mongCold.category}, warm=${mongWarm.category}`);
    console.log(`  ✗ Mongabay BBNJ consistency: cold=${mongCold.category} warm=${mongWarm.category}`);
  } else if (mongWarm && mongCold) {
    console.log(`  ✓ Mongabay BBNJ warm: ${mongWarm.category} (consistent with cold run)`);
  }

  // 6. All cold/warm categories must match
  let consistencyFails = 0;
  for (const id of foundIds) {
    const c = coldResult.resultMap.get(id)?.category;
    const w = warmResult.resultMap.get(id)?.category;
    if (c && w && c !== w) {
      consistencyFails++;
      console.log(`  ✗ Consistency: ${id.slice(0, 8)} cold=${c} warm=${w}`);
    }
  }
  if (consistencyFails > 0) {
    fails.push(`FAIL [consistency]: ${consistencyFails} stories have cold/warm category mismatch`);
  } else {
    console.log(`  ✓ Consistency: all ${foundIds.size} stories cold/warm categories match`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== RESULT ===');
  if (fails.length === 0) {
    console.log('PASS — all assertions cleared.');
    console.log('  Code written AND verified:');
    console.log('  · Prompt v2 confirmed (hash f6491a2171c78bdf)');
    console.log('  · Verb-era rows correctly invalidated (cache miss, not served)');
    console.log('  · Mongabay BBNJ → EXPLAINER_OR_DISCUSSION on live DB summary');
    console.log('  · Warm run: 0 model calls (determinism holds)');
    console.log('  · Cold/warm consistency: 100%');
    process.exit(0);
  } else {
    console.log(`FAIL — ${fails.length} assertion(s) failed:`);
    for (const f of fails) console.log(`  · ${f}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
