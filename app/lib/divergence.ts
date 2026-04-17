import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface Story {
  id: string;
  title: string;
  source_name: string;
  source_type: string;
  topic: string;
  published_at: string;
  short_summary: string | null;
}

export interface StoryPair {
  storyA: Story;
  storyB: Story;
  tracker_tag: string;
}

export interface DivergenceScore {
  factual: number;
  conclusion: number;
  framing: number;
  authority: number;
  composite: number;
  source_a_claim: string;
  source_b_claim: string;
  headline: string;
  why_it_matters: string;
}

const TOPIC_TO_TRACKER: Record<string, string> = {
  governance: "bbnj",
  dsm: "isa",
  bluefinance: "blue-finance",
  climate: "climate",
  iuu: "iuu",
  mpa: "30x30",
  fisheries: "fisheries",
  shipping: "imo-shipping",
  science: "science",
};

/**
 * Find candidate story pairs that could contain a source divergence.
 * Pairs stories with the same topic, different source_name, published
 * within 72h of each other, and within the lookback window.
 */
export async function findCandidatePairs(sinceHours: number): Promise<StoryPair[]> {
  const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, source_name, source_type, topic, published_at, short_summary")
    .eq("status", "live")
    .not("short_summary", "is", null)
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(200);

  if (error || !stories || stories.length === 0) {
    console.log("[divergence] No stories found:", error?.message || "empty");
    return [];
  }

  // Group by topic
  const byTopic: Record<string, Story[]> = {};
  for (const s of stories) {
    if (!s.topic || !s.short_summary) continue;
    if (!byTopic[s.topic]) byTopic[s.topic] = [];
    byTopic[s.topic].push(s);
  }

  const pairs: StoryPair[] = [];
  const MAX_PAIRS_PER_TOPIC = 10;
  const MS_72H = 72 * 60 * 60 * 1000;
  let keywordSkips = 0;

  for (const [topic, group] of Object.entries(byTopic)) {
    if (group.length < 2) continue;
    const tracker_tag = TOPIC_TO_TRACKER[topic] || topic;
    let count = 0;

    for (let i = 0; i < group.length && count < MAX_PAIRS_PER_TOPIC; i++) {
      for (let j = i + 1; j < group.length && count < MAX_PAIRS_PER_TOPIC; j++) {
        const a = group[i];
        const b = group[j];

        // Different sources
        if (a.source_name === b.source_name) continue;

        // Within 72h of each other
        const diff = Math.abs(new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
        if (diff > MS_72H) continue;

        // Shared keyword filter: headlines must share at least one significant word
        if (!sharesKeyword(a.title, b.title)) {
          keywordSkips++;
          console.log(`[divergence:filter] SKIP - no shared keywords: ${a.title.slice(0, 60)} / ${b.title.slice(0, 60)}`);
          continue;
        }

        // Canonical ordering: a.id < b.id
        const [storyA, storyB] = a.id < b.id ? [a, b] : [b, a];
        pairs.push({ storyA, storyB, tracker_tag });
        count++;
      }
    }
  }

  console.log(`[divergence] Found ${pairs.length} candidate pairs from ${stories.length} stories (${keywordSkips} filtered by keyword check)`);
  return pairs;
}

/**
 * Score a pair of stories for divergence using Claude Haiku.
 * Returns null if composite score is below 5.0 (not worth surfacing).
 */
export async function scoreDivergence(storyA: Story, storyB: Story): Promise<DivergenceScore | null> {
  const systemPrompt = `You are a source divergence analyst for an ocean governance intelligence platform. You compare two stories about the same event and measure how much they disagree.

FIRST: Are these two stories covering the same specific event, decision, vote, announcement, or development? They must share the same named subject (same treaty, same institution, same regulatory decision, same named body of water or jurisdiction).

If they are NOT covering the same specific event, return:
{"factual": 0, "conclusion": 0, "framing": 0, "authority": 0, "composite": 0, "source_a_claim": "not applicable", "source_b_claim": "not applicable", "headline": "unrelated stories", "why_it_matters": "not applicable"}

Only proceed to score the four dimensions if they ARE covering the same specific event.

When you write the why_it_matters field, follow these rules:
- Write for an intelligent reader who is competent in their field but does not know the specific ocean governance terminology
- Avoid acronyms unless you define them in the same sentence
- Use "you" to address the reader directly
- Name the concrete professional consequence, not the abstract category
- Two to three short sentences maximum
- No em dashes

Return JSON only. No markdown. No explanation.`;

  const userContent = `Given these two stories covering the same ocean governance event:

STORY A: ${storyA.title} | Source: ${storyA.source_name} | ${storyA.short_summary}
STORY B: ${storyB.title} | Source: ${storyB.source_name} | ${storyB.short_summary}

Score their divergence on these dimensions (0-10 each):
1. Factual claim divergence (do they state different facts as true?)
2. Conclusion divergence (do they draw different implications?)
3. Framing divergence (same facts, materially different emphasis?)
4. Source authority divergence (is one a primary source and one secondary?)

Compute composite = (factual x 0.40) + (conclusion x 0.30) + (framing x 0.20) + (authority x 0.10). Round to 1 decimal place.

Return this exact JSON:
{"factual": number, "conclusion": number, "framing": number, "authority": number, "composite": number, "source_a_claim": "one sentence summary of Source A position", "source_b_claim": "one sentence summary of Source B position", "headline": "short punchy headline for the conflict max 12 words", "why_it_matters": "plain English professional consequence"}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const factual = clamp(parsed.factual);
    const conclusion = clamp(parsed.conclusion);
    const framing = clamp(parsed.framing);
    const authority = clamp(parsed.authority);
    const composite = Math.round((factual * 0.40 + conclusion * 0.30 + framing * 0.20 + authority * 0.10) * 10) / 10;

    if (composite < 5.0) return null;

    return {
      factual,
      conclusion,
      framing,
      authority,
      composite,
      source_a_claim: String(parsed.source_a_claim || "").slice(0, 500),
      source_b_claim: String(parsed.source_b_claim || "").slice(0, 500),
      headline: String(parsed.headline || "").slice(0, 200),
      why_it_matters: String(parsed.why_it_matters || "").slice(0, 1000),
    };
  } catch (err) {
    console.error("[divergence] Score error:", err);
    return null;
  }
}

/**
 * Insert a scored divergence into the divergences table.
 * Deduplicates on story_id_a + story_id_b.
 */
export async function insertDivergence(
  score: DivergenceScore,
  storyA: Story,
  storyB: Story,
  trackerTag: string
): Promise<boolean> {
  // Dedup check
  const { data: existing } = await supabase
    .from("divergences")
    .select("id")
    .eq("story_id_a", storyA.id)
    .eq("story_id_b", storyB.id)
    .is("dismissed_at", null)
    .limit(1);

  if (existing && existing.length > 0) return false;

  const { error } = await supabase.from("divergences").insert({
    story_id_a: storyA.id,
    story_id_b: storyB.id,
    tracker_tag: trackerTag,
    score: score.composite,
    source_a_name: storyA.source_name,
    source_a_type: storyA.source_type || null,
    source_a_claim: score.source_a_claim,
    source_a_date: storyA.published_at,
    source_b_name: storyB.source_name,
    source_b_type: storyB.source_type || null,
    source_b_claim: score.source_b_claim,
    source_b_date: storyB.published_at,
    headline: score.headline,
    why_it_matters: score.why_it_matters,
    is_active: true,
  });

  if (error) {
    console.error("[divergence] Insert error:", error.message);
    return false;
  }

  console.log(`[divergence] Inserted: "${score.headline}" (${score.composite})`);
  return true;
}

/**
 * Run the full divergence detection pipeline.
 * sinceHours=168 for first run (7 days), 24 for daily cron.
 */
export async function runDivergenceDetection(sinceHours = 24): Promise<{
  processed: number;
  inserted: number;
  skipped: number;
  errors: number;
}> {
  const pairs = await findCandidatePairs(sinceHours);

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const debug = process.env.DIVERGENCE_DEBUG === "true";
  const debugLog: { tracker: string; sourceA: string; sourceB: string; headlineA: string; headlineB: string; factual: number; conclusion: number; framing: number; authority: number; composite: number; passed: boolean }[] = [];

  for (const pair of pairs) {
    processed++;
    try {
      const score = await scoreDivergence(pair.storyA, pair.storyB);

      if (debug) {
        const entry = {
          tracker: pair.tracker_tag,
          sourceA: pair.storyA.source_name,
          sourceB: pair.storyB.source_name,
          headlineA: pair.storyA.title.slice(0, 60),
          headlineB: pair.storyB.title.slice(0, 60),
          factual: score?.factual ?? 0,
          conclusion: score?.conclusion ?? 0,
          framing: score?.framing ?? 0,
          authority: score?.authority ?? 0,
          composite: score?.composite ?? 0,
          passed: (score?.composite ?? 0) >= 5.0,
        };
        debugLog.push(entry);
        console.log(`[divergence:debug] ${entry.tracker} | ${entry.sourceA} vs ${entry.sourceB} | F:${entry.factual} C:${entry.conclusion} Fr:${entry.framing} A:${entry.authority} = ${entry.composite} | ${entry.passed ? "PASS" : "SKIP"}`);
      }

      if (!score) {
        skipped++;
        continue;
      }

      const ok = await insertDivergence(score, pair.storyA, pair.storyB, pair.tracker_tag);
      if (ok) inserted++;
      else skipped++;
    } catch (err) {
      errors++;
      console.error("[divergence] Pair error:", err);
    }
  }

  if (debug) {
    console.log("[divergence:debug] Full score distribution:", JSON.stringify(debugLog.map(d => ({ t: d.tracker, c: d.composite, p: d.passed }))));
  }

  console.log(`[divergence] Done. Processed: ${processed}, Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
  return { processed, inserted, skipped, errors };
}

function clamp(v: unknown): number {
  const n = typeof v === "number" ? v : 0;
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}

const STOP_WORDS = new Set([
  "about", "their", "which", "would", "could", "after", "before",
  "during", "under", "where", "there", "these", "those", "with",
  "from", "that", "this", "have", "been", "will", "more", "also",
  "than", "other", "being", "every", "first", "should", "still",
  "while", "through", "between", "against", "ocean", "marine",
  "global", "world", "report", "says", "could", "major", "according",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 5 && !STOP_WORDS.has(w))
  );
}

function sharesKeyword(titleA: string, titleB: string): boolean {
  const wordsA = significantWords(titleA);
  const wordsB = significantWords(titleB);
  for (const w of wordsA) {
    if (wordsB.has(w)) return true;
  }
  return false;
}
