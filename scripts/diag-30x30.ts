/**
 * Spot-check the 30x30 stories driving the 7.4 Pulse Score.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-30x30.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('stories')
    .select('title, published_at, source_name, short_summary')
    .contains('cross_tracker_flags', ['30x30'])
    .gte('published_at', d30)
    .order('published_at', { ascending: false })
    .limit(15);

  if (error) { console.error(error); process.exit(1); }

  console.log(`\n=== 30x30 SPOT-CHECK — last 30 days (${data?.length ?? 0} stories) ===\n`);
  (data || []).forEach((s, i) => {
    console.log(`[${i + 1}] ${s.published_at.slice(0, 10)} | ${s.source_name}`);
    console.log(`    TITLE: ${s.title}`);
    console.log(`    SUMMARY: ${(s.short_summary || '(none)').slice(0, 200)}`);
    console.log();
  });
}

main().catch(console.error);
