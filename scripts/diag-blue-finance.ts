/**
 * Component breakdown diagnostic for blue-finance velocity score.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-blue-finance.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCLUDED_TOPICS = ['science', 'health', 'technology', 'sports', 'entertainment'];
const DECISION_PATTERN =
  /ratif|adopt|enforc|sanction|decision|resolution|agreement|signed|implement|deadline|entry into force|enters into force|in force|final text|mandate|conclude|binding|approved|adopted|enacted|compliance|effective/i;

function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max); }

function deduplicateByTitle<T extends { title: string }>(stories: T[]): T[] {
  const seen = new Set<string>();
  return stories.filter(s => {
    const key = s.title?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Topic-based query (current path in velocity.ts)
  const { data: topicCurrent } = await supabase
    .from('stories')
    .select('id, title, published_at, short_summary, topic')
    .in('topic', ['bluefinance'])
    .gte('published_at', d30)
    .order('published_at', { ascending: false });

  const { data: topicPrev } = await supabase
    .from('stories')
    .select('id, title, topic')
    .in('topic', ['bluefinance'])
    .gte('published_at', d60)
    .lt('published_at', d30);

  // cross_tracker_flags-based query (proposed architectural fix)
  const { data: ctfCurrent } = await supabase
    .from('stories')
    .select('id, title, published_at, short_summary, topic')
    .contains('cross_tracker_flags', ['blue_finance'])
    .gte('published_at', d30)
    .order('published_at', { ascending: false });

  const { data: ctfPrev } = await supabase
    .from('stories')
    .select('id, title, topic')
    .contains('cross_tracker_flags', ['blue_finance'])
    .gte('published_at', d60)
    .lt('published_at', d30);

  console.log('\n=== BLUE-FINANCE COMPONENT BREAKDOWN ===\n');
  console.log('--- Current query path (stories.topic = bluefinance) ---');
  await breakdown('topic-path', topicCurrent || [], topicPrev || [], now, 0.80);

  console.log('\n--- Proposed path (cross_tracker_flags @> blue_finance) ---');
  await breakdown('ctf-path', ctfCurrent || [], ctfPrev || [], now, 0.80);
}

async function breakdown(
  label: string,
  currentRaw: { id: string; title: string; published_at: string; short_summary: string | null; topic: string }[],
  prevRaw: { id: string; title: string; topic?: string }[],
  now: Date,
  multiplier: number
) {
  const currentStories = deduplicateByTitle(currentRaw);
  const prevAll = deduplicateByTitle(prevRaw);

  const storyCount = currentStories.length;
  const prevCount = prevAll.length;
  const growthRate = (storyCount - prevCount) / Math.max(prevCount, 1);
  const scoreA = clamp(5 + growthRate * 5, 0, 10);

  let scoreB = 2;
  let daysSinceLatest = Infinity;
  if (currentStories.length > 0) {
    const latest = new Date(currentStories[0].published_at);
    daysSinceLatest = (now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000);
    scoreB = Math.max(2, parseFloat((10 * Math.exp(-0.05 * daysSinceLatest)).toFixed(1)));
  }

  const matchedDecisions = currentStories.filter(
    s => DECISION_PATTERN.test(s.title) || DECISION_PATTERN.test(s.short_summary || '')
  );
  const scoreC = clamp(matchedDecisions.length * 2, 0, 10); // simplified: no Haiku classification

  const rawComposite = scoreA * 0.4 + scoreB * 0.35 + scoreC * 0.25;
  const baseScore = Math.round(rawComposite * 10) / 10;
  const finalScore = Math.round(baseScore * multiplier * 10) / 10;

  console.log(`[${label}]`);
  console.log(`  storyCount (current 30d, deduped) : ${storyCount}`);
  console.log(`  prevCount  (prev 30d, deduped)    : ${prevCount}`);
  console.log(`  growthRate                         : ${(growthRate * 100).toFixed(1)}%`);
  console.log(`  scoreA (volume, 40%)               : ${scoreA.toFixed(2)}`);
  console.log(`  daysSinceLatest                    : ${daysSinceLatest === Infinity ? 'N/A' : daysSinceLatest.toFixed(1)}`);
  console.log(`  scoreB (recency, 35%)              : ${scoreB.toFixed(2)}`);
  console.log(`  decisionKeywordMatches             : ${matchedDecisions.length}`);
  console.log(`  scoreC (signals, 25%, no Haiku)    : ${scoreC.toFixed(2)}`);
  console.log(`  institutionalMultiplier            : ${multiplier}`);
  console.log(`  rawComposite (before multiplier)   : ${rawComposite.toFixed(3)}`);
  console.log(`  baseScore (rounded)                : ${baseScore}`);
  console.log(`  finalScore                         : ${finalScore}`);

  if (storyCount > 0) {
    console.log(`\n  Sample stories (first 5):`);
    currentStories.slice(0, 5).forEach(s => {
      console.log(`    [${s.published_at.slice(0, 10)}] ${s.title.slice(0, 80)}`);
    });
  }
  if (matchedDecisions.length > 0) {
    console.log(`\n  Decision matches (first 5):`);
    matchedDecisions.slice(0, 5).forEach(s => {
      console.log(`    ${s.title.slice(0, 80)}`);
    });
  }
}

main().catch(console.error);
