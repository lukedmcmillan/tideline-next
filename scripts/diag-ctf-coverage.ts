/**
 * Feed coverage diagnostic: which sources have produced stories for thin-coverage trackers
 * in the last 90 days, using cross_tracker_flags as the truth source.
 *
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-ctf-coverage.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const THIN_TRACKERS = [
  { slug: 'wto_fisheries', label: 'WTO Fisheries' },
  { slug: 'cites_marine',  label: 'CITES Marine' },
  { slug: 'plastics',      label: 'Plastics Treaty' },
];

// Also show all 10 for comparison
const ALL_TRACKERS = [
  'bbnj', 'isa', 'iuu', '30x30', 'blue_finance',
  'imo_shipping', 'wto_fisheries', 'cites_marine', 'plastics', 'offshore_wind',
];

async function main() {
  const d90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log('\n=== FEED COVERAGE DIAGNOSTIC (cross_tracker_flags, last 90d) ===\n');

  // All 10 trackers — 30d count
  console.log('--- 30-day story counts (cross_tracker_flags source) ---');
  for (const tracker of ALL_TRACKERS) {
    const { count } = await supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .contains('cross_tracker_flags', [tracker])
      .gte('published_at', d30);
    console.log(`  ${tracker.padEnd(16)} ${count ?? 0} stories`);
  }

  console.log('\n--- Thin tracker source breakdown (last 90d) ---');
  for (const { slug, label } of THIN_TRACKERS) {
    const { data } = await supabase
      .from('stories')
      .select('source_name, published_at, title')
      .contains('cross_tracker_flags', [slug])
      .gte('published_at', d90)
      .order('published_at', { ascending: false });

    const stories = data || [];
    const bySource: Record<string, number> = {};
    for (const s of stories) {
      bySource[s.source_name] = (bySource[s.source_name] || 0) + 1;
    }
    const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);

    console.log(`\n  ${label} (${slug}) — ${stories.length} stories, ${sources.length} distinct sources:`);
    if (sources.length === 0) {
      console.log('    ⚠ NO STORIES — blind spot, not an honest signal');
    } else {
      sources.forEach(([src, n]) => console.log(`    ${String(n).padStart(3)}  ${src}`));
      if (sources.length < 2) {
        console.log(`    ⚠ SINGLE SOURCE — structurally thin`);
      }
    }
    if (stories.length > 0) {
      console.log(`  Sample headlines:`);
      stories.slice(0, 3).forEach(s =>
        console.log(`    [${s.published_at.slice(0, 10)}] ${s.title.slice(0, 80)}`)
      );
    }
  }

  console.log('\n--- Note ---');
  console.log('  InforMEA OData and FAOLEX are not yet ingested.');
  console.log('  InforMEA: plastics treaty decisions, environmental agreements');
  console.log('  FAOLEX:   fisheries legislation + CITES implementing measures');
  console.log('  Both would directly fill wto_fisheries, cites_marine, plastics blind spots.');
  console.log('  See scripts/scraper-informea.ts and scripts/import-faolex.ts for status.\n');
}

main().catch(console.error);
