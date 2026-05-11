/**
 * Out-of-cycle velocity recalculation for all 10 trackers.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/recalc-velocity.ts
 */
import { calculateVelocityScore } from '@/app/lib/velocity';

const SLUGS = ['isa','bbnj','iuu','30x30','blue-finance','plastics','imo-shipping','offshore-wind','cites-marine','wto-fisheries'];

async function main() {
  console.log('Running out-of-cycle velocity recalculation for all 10 trackers...\n');
  const results = [];
  for (const slug of SLUGS) {
    try {
      console.log(`  Calculating ${slug}...`);
      const r = await calculateVelocityScore(slug);
      results.push(r);
      console.log(`  ${slug.padEnd(16)} score=${r.score}  stories=${r.currentCount}  momentum=${r.momentumDirection}`);
    } catch (e) {
      console.error(`  ${slug} FAILED:`, (e as Error).message);
    }
  }
  console.log('\n=== FINAL SCORES ===');
  for (const r of results) {
    console.log(`${r.trackerSlug.padEnd(16)} ${r.score}`);
  }
  console.log('\nDone.');
}

main().catch(console.error);
