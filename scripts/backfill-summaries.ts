/**
 * Backfill summaries for legacy live stories that predate the summarise-pending cron.
 * Targets: status = 'live' AND short_summary IS NULL AND published_at < '2026-01-01'
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-summaries.ts --dry-run
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-summaries.ts --batch-size 30
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const batchArg = args.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split('=')[1]) : 30;
const CUTOFF = '2026-01-01';

// Haiku only — bulk processing per CLAUDE-RULES
const MODEL = 'claude-haiku-4-5-20251001';

// ~$0.25/M input, ~$1.25/M output. Per story: ~500 input + ~150 output tokens.
const COST_PER_STORY_USD = (500 * 0.00000025) + (150 * 0.00000125);

async function summarise(story: { id: string; title: string; link: string; source_name: string; description: string | null }): Promise<{ short_summary: string; full_summary: string } | null> {
  const content = story.description || '';
  if (content.length < 50 && !story.link) return null;

  const inputText = content.length >= 50
    ? content
    : `Title: ${story.title}\nSource: ${story.source_name}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a factual intelligence editor at Tideline, an ocean and marine policy platform.

Summarise this story in two parts. Return JSON only, no markdown.

SHORT SUMMARY (2 sentences): What happened, and the single most significant professional detail.
FULL SUMMARY (max 100 words, plain text): Cause, significance, and one thing to watch. Base all claims solely on the provided text.

No hedging, no em dashes, declarative sentences only.

{"short_summary":"...","full_summary":"..."}

Title: "${story.title}"
Source: ${story.source_name}

CONTENT:
${inputText.slice(0, 4000)}`,
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { short_summary: parsed.short_summary, full_summary: parsed.full_summary };
  } catch (err) {
    console.error(`  Error summarising ${story.id}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function run() {
  console.log(`=== BACKFILL SUMMARIES${DRY_RUN ? ' (DRY RUN)' : ''} ===`);
  console.log(`Target: live stories with null short_summary published before ${CUTOFF}`);
  console.log(`Batch size: ${BATCH_SIZE}, Model: ${MODEL}\n`);

  // Count total
  const { count: total } = await sb
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'live')
    .is('short_summary', null)
    .lt('published_at', CUTOFF);

  console.log(`Total matching stories: ${total}`);
  console.log(`Estimated cost: $${((total || 0) * COST_PER_STORY_USD).toFixed(4)}`);

  // Sample 5 oldest
  const { data: sample } = await sb
    .from('stories')
    .select('id, title, published_at')
    .eq('status', 'live')
    .is('short_summary', null)
    .lt('published_at', CUTOFF)
    .order('published_at', { ascending: true })
    .limit(5);

  console.log('\nOldest 5 stories in cohort:');
  for (const s of sample || []) {
    console.log(`  ${s.published_at?.slice(0, 10)}: ${s.title?.slice(0, 70)}`);
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run without --dry-run to process.');
    return;
  }

  // Process in batches
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    const { data: batch, error } = await sb
      .from('stories')
      .select('id, title, link, source_name, description')
      .eq('status', 'live')
      .is('short_summary', null)
      .lt('published_at', CUTOFF)
      .order('published_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) { console.error('Fetch error:', error.message); break; }
    if (!batch || batch.length === 0) break;

    console.log(`\nBatch ${Math.floor(offset / BATCH_SIZE) + 1}: processing ${batch.length} stories (offset ${offset})`);

    for (const story of batch) {
      processed++;
      const result = await summarise(story);
      if (!result) {
        console.log(`  [SKIP] ${story.id}: ${story.title?.slice(0, 50)}`);
        failed++;
        continue;
      }

      const { error: updateErr } = await sb
        .from('stories')
        .update({ short_summary: result.short_summary, full_summary: result.full_summary })
        .eq('id', story.id);

      if (updateErr) {
        console.error(`  [ERR] ${story.id}: ${updateErr.message}`);
        failed++;
      } else {
        console.log(`  [OK] ${story.id}: ${story.title?.slice(0, 50)}`);
        succeeded++;
      }

      // Brief pause to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    offset += BATCH_SIZE;
    if (batch.length < BATCH_SIZE) break;
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Processed: ${processed}, Succeeded: ${succeeded}, Failed: ${failed}`);

  // Post-run verification
  const { count: remaining } = await sb
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'live')
    .is('short_summary', null)
    .lt('published_at', CUTOFF);

  console.log(`Remaining live stories without summary (pre-${CUTOFF}): ${remaining}`);
}

run().catch(console.error);
