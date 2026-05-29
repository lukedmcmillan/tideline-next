/**
 * Coverage diagnostic for thin-coverage trackers: wto-fisheries, cites-marine, plastics
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-thin-trackers.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const THIN_TRACKERS = [
  { slug: 'wto-fisheries', flag: 'wto_fisheries' },
  { slug: 'cites-marine',  flag: 'cites_marine'  },
  { slug: 'plastics',      flag: 'plastics'       },
];

async function main() {
  const now = new Date();
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Current velocity_scores for all 10 trackers
  const { data: latestScores } = await supabase
    .from('velocity_scores')
    .select('tracker_slug, score, story_count_30d, momentum_direction, calculated_at')
    .order('calculated_at', { ascending: false })
    .limit(20);

  console.log('\n=== CURRENT VELOCITY SCORES (latest per tracker) ===\n');
  const seenSlugs = new Set<string>();
  for (const row of latestScores || []) {
    if (!seenSlugs.has(row.tracker_slug)) {
      seenSlugs.add(row.tracker_slug);
      const calcAge = Math.round((now.getTime() - new Date(row.calculated_at).getTime()) / (3600 * 1000));
      console.log(`  ${row.tracker_slug.padEnd(16)} score=${row.score}  stories=${row.story_count_30d}  momentum=${row.momentum_direction}  (${calcAge}h ago)`);
    }
  }

  console.log('\n=== THIN-TRACKER FEED COVERAGE (last 90 days) ===\n');

  for (const { slug, flag } of THIN_TRACKERS) {
    const { data: stories } = await supabase
      .from('stories')
      .select('source_name, published_at, title, topic')
      .contains('cross_tracker_flags', [flag])
      .gte('published_at', d90)
      .order('published_at', { ascending: false });

    const all = stories || [];
    const sources = new Map<string, number>();
    for (const s of all) {
      sources.set(s.source_name, (sources.get(s.source_name) || 0) + 1);
    }
    const sortedSources = [...sources.entries()].sort((a, b) => b[1] - a[1]);

    console.log(`--- ${slug} (flag: ${flag}) ---`);
    console.log(`  Total stories last 90d: ${all.length}`);
    console.log(`  Distinct sources:       ${sources.size}`);
    if (sources.size < 2) {
      console.log(`  *** BLIND SPOT: fewer than 2 distinct sources ***`);
    }
    if (sortedSources.length > 0) {
      console.log(`  Sources:`);
      for (const [name, count] of sortedSources) {
        console.log(`    ${String(count).padStart(3)}x  ${name}`);
      }
    }
    if (all.length > 0) {
      console.log(`  Most recent: [${all[0].published_at.slice(0, 10)}] ${all[0].title.slice(0, 70)}`);
    }
    console.log();
  }
}

main().catch(console.error);
