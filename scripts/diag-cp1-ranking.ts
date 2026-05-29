/**
 * scripts/diag-cp1-ranking.ts
 *
 * Checkpoint 1 diagnostic: two-part verification
 *
 * Part A — Topic filter audit
 *   Shows TEST_EMAIL, raw user.topics, expanded contentTopics,
 *   the stories that passed the topic filter today, and a sample
 *   of stories that were filtered out.
 *
 * Part B — Contested-day ranking
 *   Finds the day in the last 14 days with the most candidate
 *   stories for the test user's topics, runs Haiku delta
 *   classification on that pool, then exercises Gate 2 edge
 *   ranking across multiple eligible candidates.
 *
 * Run: npx tsx scripts/diag-cp1-ranking.ts
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";

// ── Env ───────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const TEST_EMAIL    = process.env.TEST_EMAIL ?? "(not set)";

if (!SUPABASE_URL || !SERVICE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing env vars. Run via: npx tsx scripts/diag-cp1-ranking.ts");
  process.exit(1);
}

const supabase  = createClient(SUPABASE_URL, SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── TRACKER_TO_TOPICS (canonical copy from app/lib/brief/utils.ts) ───────────

const TRACKER_TO_TOPICS: Record<string, string[]> = {
  "bbnj":          ["governance"],
  "isa":           ["dsm"],
  "imo-shipping":  ["shipping"],
  "30x30":         ["conservation", "mpa"],
  "iuu":           ["fisheries", "iuu"],
  "wto-fisheries": ["fisheries"],
  "cites-marine":  ["conservation", "science"],
  "blue-finance":  ["bluefinance"],
  "plastics":      ["governance"],
  "offshore-wind": ["climate"],
  "governance":    ["governance"],
  "fisheries":     ["fisheries"],
  "shipping":      ["shipping"],
  "dsm":           ["dsm"],
  "climate":       ["climate"],
  "science":       ["science"],
  "conservation":  ["conservation"],
  "mpa":           ["mpa"],
  "bluefinance":   ["bluefinance"],
};

// ── DELTA_VERB_ALLOWLIST (canonical copy from app/lib/brief/select.ts) ────────

const DELTA_VERB_ALLOWLIST = new Set([
  "adopts","rejects","proposes","enters","crosses","shifts","opens",
  "closes","suspends","ratifies","triggers","escalates","stalls",
  "advances","withdraws","mandates","files","imposes","lifts",
]);

const DELTA_SYSTEM =
  "You classify ocean governance news stories to determine if they represent genuine change.\n\n" +
  "A story passes if its core can be stated as [named actor] [delta verb] [object].\n\n" +
  "Allowed delta verbs (exact lowercase): adopts, rejects, proposes, enters, crosses, shifts, opens, closes, suspends, ratifies, triggers, escalates, stalls, advances, withdraws, mandates, files, imposes, lifts.\n\n" +
  "Rules:\n" +
  "- is_delta=true ONLY if: (1) a specific institution, country, or named person is the actor, " +
  "(2) the story reports that action happening — not analysis or background, " +
  "(3) exactly one allowed delta verb fits.\n" +
  "- Presence of a delta verb keyword is NOT sufficient.\n" +
  "- 'Researchers', 'experts', 'scientists', 'the sector' are not valid actors.\n" +
  "- If is_delta=false, set actor/delta_verb/object to null.\n" +
  "- PRIMARY ANGLE: The story must report the delta as its own primary news event. If the story's " +
  "main subject is a conference, expert discussion, research finding, or explainer about what a " +
  "past event might lead to, it FAILS — even if a completed past change is stated as background " +
  "context. The change must be what the story is about, not context for another story.\n" +
  "- HEADLINE TEST: If the headline uses aspirational or tentative phrasing ('seeks to', 'aims to', " +
  "'looks to', 'could', 'may help') and the delta triple must be extracted from a background clause " +
  "rather than the headline's main claim, it FAILS.\n\n" +
  "Return JSON only: {\"is_delta\": boolean, \"actor\": string|null, \"delta_verb\": string|null, \"object\": string|null}";

// Identical formula to production send-brief: first 16 hex chars of SHA-256(prompt).
// Changing the prompt above auto-invalidates any cached rows from previous prompt versions.
const DELTA_PROMPT_VERSION = createHash("sha256")
  .update(DELTA_SYSTEM)
  .digest("hex")
  .slice(0, 16);

interface DeltaResult {
  is_delta: boolean;
  actor: string | null;
  delta_verb: string | null;
  object: string | null;
}

interface Story {
  id: string;
  title: string;
  source_name: string;
  topic: string;
  significance_score: number;
  short_summary: string | null;
  description: string | null;
  published_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function expandTopics(userTopics: string[]): Set<string> {
  return new Set(userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t]));
}

const STOPWORDS = new Set([
  "a","an","the","of","in","on","to","and","or","for",
  "is","are","was","were","with","at","by","from","as",
  "its","it","this","that","be","into","over","after","new",
]);

function headlineWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

function sourceUbiquity(story: Story, pool: Story[]): number {
  const sources = new Set([story.source_name]);
  const words   = headlineWords(story.title);
  for (const other of pool) {
    if (other.id === story.id || other.topic !== story.topic) continue;
    const diffDays =
      Math.abs(new Date(story.published_at).getTime() - new Date(other.published_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (diffDays > 7) continue;
    const ow = headlineWords(other.title);
    let shared = 0;
    for (const w of words) if (ow.has(w)) shared++;
    if (shared >= 3) sources.add(other.source_name);
  }
  return sources.size;
}

// Cache-aware batch classifier — mirrors production classifyDeltaCandidates() exactly.
// Returns { resultMap, modelCallsMade, cacheHits, cacheMisses }
async function classifyCandidates(candidates: Story[]): Promise<{
  resultMap: Map<string, DeltaResult>;
  modelCallsMade: number;
  cacheHits: number;
  cacheMisses: number;
}> {
  const resultMap = new Map<string, DeltaResult>();
  if (candidates.length === 0) {
    return { resultMap, modelCallsMade: 0, cacheHits: 0, cacheMisses: 0 };
  }

  const ids = candidates.map(s => s.id);

  // 1. Batch-lookup permanent cache
  const { data: cached, error: cacheErr } = await supabase
    .from("delta_classifications")
    .select("story_id, is_delta, actor, delta_verb, object")
    .in("story_id", ids)
    .eq("prompt_version", DELTA_PROMPT_VERSION);

  if (cacheErr) {
    console.warn("  [cache] Lookup error:", cacheErr.message);
  }

  const cachedIds = new Set<string>();
  for (const row of cached ?? []) {
    resultMap.set(row.story_id, {
      is_delta: row.is_delta,
      actor: row.actor,
      delta_verb: row.delta_verb,
      object: row.object,
    });
    cachedIds.add(row.story_id);
  }

  const cacheHits = cachedIds.size;
  const uncached  = candidates.filter(s => !cachedIds.has(s.id));
  const cacheMisses = uncached.length;

  console.log(`  [cache] prompt_version=${DELTA_PROMPT_VERSION}`);
  console.log(`  [cache] ${cacheHits} hits, ${cacheMisses} misses of ${candidates.length} stories`);

  if (uncached.length === 0) {
    return { resultMap, modelCallsMade: 0, cacheHits, cacheMisses };
  }

  // 2. Classify uncached with temperature: 0 (same as production)
  const newResults: Array<[string, DeltaResult]> = await Promise.all(
    uncached.map(async (s): Promise<[string, DeltaResult]> => {
      try {
        const res = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 80,
          temperature: 0,  // gate calls must be deterministic
          system: [{ type: "text", text: DELTA_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: `Title: ${s.title}\nSummary: ${s.short_summary ?? s.description ?? ""}` }],
        });
        const raw     = res.content[0].type === "text" ? res.content[0].text.trim() : "";
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const match   = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return [s.id, { is_delta: false, actor: null, delta_verb: null, object: null }];
        const parsed = JSON.parse(match[0]) as DeltaResult;
        if (parsed.delta_verb && !DELTA_VERB_ALLOWLIST.has(parsed.delta_verb.toLowerCase())) {
          return [s.id, { is_delta: false, actor: null, delta_verb: null, object: null }];
        }
        return [s.id, { ...parsed, delta_verb: parsed.delta_verb?.toLowerCase() ?? null }];
      } catch {
        return [s.id, { is_delta: false, actor: null, delta_verb: null, object: null }];
      }
    })
  );

  // 3. Persist new results to delta_classifications (same as production)
  const toInsert = newResults.map(([story_id, cls]) => ({
    story_id,
    prompt_version: DELTA_PROMPT_VERSION,
    is_delta: cls.is_delta,
    actor: cls.actor,
    delta_verb: cls.delta_verb,
    object: cls.object,
  }));

  const { error: upsertErr } = await supabase
    .from("delta_classifications")
    .upsert(toInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: true });

  if (upsertErr) {
    console.warn("  [cache] Upsert error:", upsertErr.message);
  } else {
    console.log(`  [cache] ${newResults.length} new rows written to delta_classifications`);
  }

  for (const [id, cls] of newResults) resultMap.set(id, cls);

  return { resultMap, modelCallsMade: uncached.length, cacheHits, cacheMisses };
}

function hr(char = "─", n = 60) { return char.repeat(n); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ═══════════════════════════════════════════════════════════════
  // PART A — Topic filter audit
  // ═══════════════════════════════════════════════════════════════

  console.log("\n" + hr("═") + "\nPART A — TOPIC FILTER AUDIT\n" + hr("═"));
  console.log(`TEST_EMAIL (from env): ${TEST_EMAIL}`);

  // Fetch user from DB
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("email, topics, subscription_status")
    .eq("email", TEST_EMAIL)
    .single();

  if (userErr || !user) {
    console.error("User not found in DB:", userErr?.message ?? "no row");
    console.error("Check TEST_EMAIL is set correctly in .env.local");
    process.exit(1);
  }

  console.log(`DB row found:          ${user.email} (status: ${user.subscription_status})`);
  const userTopics: string[] = Array.isArray(user.topics) ? user.topics : [];
  console.log(`raw user.topics:       ${JSON.stringify(userTopics)}`);

  const contentTopics = expandTopics(userTopics);
  console.log(`contentTopics (expanded): ${[...contentTopics].sort().join(", ") || "(empty)"}`);

  if (contentTopics.size === 0) {
    console.warn("\nWARNING: contentTopics is empty — no stories will ever match this user's filter.");
    console.warn("This is the hotmail-class bug: user has no onboarded topics in the DB.");
  }

  // Load today's pool from brief_buffer
  const todayDate = new Date().toISOString().split("T")[0];
  const { data: buffer } = await supabase
    .from("brief_buffer")
    .select("stories")
    .eq("date", todayDate)
    .single();

  let fullPool: Story[] = [];
  if (buffer?.stories?.candidate_stories) {
    fullPool = buffer.stories.candidate_stories as Story[];
  } else {
    // Fallback: query directly
    const since = new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("stories")
      .select("id, title, source_name, topic, significance_score, short_summary, description, published_at")
      .eq("status", "live")
      .gte("published_at", since)
      .order("significance_score", { ascending: false })
      .limit(60);
    fullPool = (data ?? []) as Story[];
  }

  console.log(`\nFull pool: ${fullPool.length} stories`);

  const inTopics   = fullPool.filter(s => contentTopics.has(s.topic));
  const allTagged  = fullPool.filter(s => s.topic === "all");
  const outTopics  = fullPool.filter(s => !contentTopics.has(s.topic) && s.topic !== "all");
  const totalPass  = inTopics.length + allTagged.length;

  console.log(`\nStories PASSING topic filter (${totalPass} total):`);
  console.log(`  — matched user topics: ${inTopics.length}`);
  console.log(`  — topic=all (universal): ${allTagged.length}`);
  [...inTopics, ...allTagged].forEach(s =>
    console.log(`  [topic:${s.topic.padEnd(12)} sig:${String(s.significance_score).padStart(3)}] "${s.title.slice(0, 80)}"`)
  );

  console.log(`\nStories FILTERED OUT — sample of 10 (${outTopics.length} total):`);
  outTopics.slice(0, 10).forEach(s =>
    console.log(`  [topic:${s.topic.padEnd(12)} sig:${String(s.significance_score).padStart(3)}] "${s.title.slice(0, 80)}"`)
  );

  // Topic distribution of filtered-out stories
  const topicDist: Record<string, number> = {};
  for (const s of outTopics) topicDist[s.topic] = (topicDist[s.topic] ?? 0) + 1;
  console.log(`\nFiltered-out story topics: ${JSON.stringify(topicDist)}`);

  // ═══════════════════════════════════════════════════════════════
  // PART B — Contested-day ranking
  // ═══════════════════════════════════════════════════════════════

  console.log("\n" + hr("═") + "\nPART B — CONTESTED-DAY RANKING TEST\n" + hr("═"));

  if (contentTopics.size === 0) {
    console.error("Cannot run Part B: user has no topics. Fix topic mapping first.");
    process.exit(1);
  }

  // Find the day in last 14 days with the most candidate stories in user's topics
  const d14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: historical } = await supabase
    .from("stories")
    .select("id, title, source_name, topic, significance_score, short_summary, description, published_at")
    .eq("status", "live")
    .in("topic", [...contentTopics, "all"])
    .gte("published_at", d14)
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(300);

  const byDay: Record<string, Story[]> = {};
  for (const s of (historical ?? [])) {
    const day = s.published_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(s as Story);
  }

  // Pick the day with the most stories (skip today — already tested)
  const bestDay = Object.entries(byDay)
    .filter(([day]) => day !== todayDate)
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (!bestDay) {
    console.log("No historical stories found in last 14 days for user's topics.");
    process.exit(0);
  }

  const [contestedDate, contestedPool] = bestDay;
  console.log(`Contested day selected: ${contestedDate} (${contestedPool.length} stories in user topics)`);
  console.log(`DELTA_PROMPT_VERSION: ${DELTA_PROMPT_VERSION}`);

  // Pre-run: confirm cache state for these story IDs
  const { data: preCacheRows } = await supabase
    .from("delta_classifications")
    .select("story_id")
    .in("story_id", contestedPool.map(s => s.id))
    .eq("prompt_version", DELTA_PROMPT_VERSION);
  const preCacheCount = preCacheRows?.length ?? 0;
  console.log(`Pre-run cache state: ${preCacheCount} of ${contestedPool.length} stories already cached`);
  if (preCacheCount === 0) {
    console.log("  → COLD CACHE: all classifications will invoke the model");
  } else if (preCacheCount === contestedPool.length) {
    console.log("  → WARM CACHE: all classifications will be served from cache (ZERO model calls expected)");
  } else {
    console.log(`  → PARTIAL CACHE: ${preCacheCount} hits, ${contestedPool.length - preCacheCount} misses`);
  }
  console.log("");

  console.log("Running delta classification (cache-first, same path as production send-brief)...\n");

  const { resultMap, modelCallsMade, cacheHits, cacheMisses } = await classifyCandidates(contestedPool);

  // KEY ASSERTION for determinism proof
  if (preCacheCount === contestedPool.length && modelCallsMade > 0) {
    console.error(`\n!!! DETERMINISM FAILURE: warm cache run made ${modelCallsMade} model calls — cache is not being used correctly !!!\n`);
  } else if (preCacheCount === contestedPool.length && modelCallsMade === 0) {
    console.log("\n✓ DETERMINISM PROOF PASSED: warm cache, ZERO model calls — results served entirely from cache\n");
  }

  console.log(`\nClassification summary: ${modelCallsMade} model calls made, ${cacheHits} cache hits, ${cacheMisses} cache misses`);

  const classifications = contestedPool.map(s => ({ story: s, cls: resultMap.get(s.id) ?? { is_delta: false, actor: null, delta_verb: null, object: null } }));
  const deltaEligible = classifications.filter(c => c.cls.is_delta);
  const rejected      = classifications.filter(c => !c.cls.is_delta);

  console.log(`Delta-eligible: ${deltaEligible.length}/${contestedPool.length}`);

  // OLD logic: highest significance_score >= 35
  const oldTop = contestedPool
    .filter(s => (s.significance_score ?? 0) >= 35)
    .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0] ?? null;

  // Compute ubiquity for each eligible candidate
  const ranked = deltaEligible
    .map(c => ({
      story:    c.story,
      cls:      c.cls,
      ubiquity: sourceUbiquity(c.story, contestedPool),
    }))
    .sort((a, b) =>
      a.ubiquity !== b.ubiquity
        ? a.ubiquity - b.ubiquity
        : (b.story.significance_score ?? 0) - (a.story.significance_score ?? 0)
    );

  console.log("\nDelta-eligible candidates ranked (Gate 2 edge order):");
  console.log(hr());
  ranked.forEach((r, i) => {
    const marker = i === 0 ? ">>> SELECTED" : `    #${i + 1}      `;
    console.log(`${marker}  ubiquity:${r.ubiquity}  sig:${r.story.significance_score}`);
    console.log(`            topic:${r.story.topic}`);
    console.log(`            "${r.story.title.slice(0, 90)}"`);
    console.log(`            actor:[${r.cls.actor}] verb:[${r.cls.delta_verb}] obj:[${r.cls.object}]`);
    if (i < ranked.length - 1) console.log("");
  });

  if (ranked.length === 0) {
    console.log("  (no delta-eligible candidates on this day)");
  }

  // Post-run: dump delta_classifications rows for top-5 (proves cache persistence)
  const top5Ids = ranked.slice(0, 5).map(r => r.story.id);
  if (top5Ids.length > 0) {
    console.log("\n" + hr());
    console.log("delta_classifications table — top-5 rows (proves cache persistence):");
    const { data: cacheRows, error: cacheSelectErr } = await supabase
      .from("delta_classifications")
      .select("story_id, is_delta, actor, delta_verb, object, prompt_version, classified_at")
      .in("story_id", top5Ids)
      .eq("prompt_version", DELTA_PROMPT_VERSION)
      .order("classified_at", { ascending: true });

    if (cacheSelectErr) {
      console.error("  Error fetching cache rows:", cacheSelectErr.message);
    } else if (!cacheRows || cacheRows.length === 0) {
      console.error("  !!! NO ROWS FOUND — cache persistence is broken !!!");
    } else {
      console.log(`  (${cacheRows.length} rows found, prompt_version=${DELTA_PROMPT_VERSION})`);
      for (const row of cacheRows) {
        console.log(`  story_id:${row.story_id}`);
        console.log(`    is_delta:${row.is_delta}  actor:[${row.actor}]  verb:[${row.delta_verb}]  obj:[${row.object}]`);
        console.log(`    classified_at:${row.classified_at}`);
      }
    }
  }

  console.log("\n" + hr());
  console.log("\nRejected candidates (failed delta test):");
  rejected.slice(0, 8).forEach(r =>
    console.log(`  [sig:${r.story.significance_score}] topic:${r.story.topic} "${r.story.title.slice(0, 80)}"`)
  );

  console.log("\n" + hr("─"));
  console.log("OLD vs NEW comparison:");
  if (oldTop) {
    const oldCls = classifications.find(c => c.story.id === oldTop.id)?.cls;
    console.log(`  OLD would have led: [sig:${oldTop.significance_score}] "${oldTop.title.slice(0, 80)}"`);
    console.log(`  OLD delta-eligible: ${oldCls?.is_delta ?? false}`);
  } else {
    console.log("  OLD: no story >= sig 35 (would have used tracker/state lead)");
  }

  if (ranked.length > 0) {
    const winner = ranked[0];
    const sameAsOld = oldTop?.id === winner.story.id;
    console.log(`  NEW lead:           [sig:${winner.story.significance_score} ubiquity:${winner.ubiquity}] "${winner.story.title.slice(0, 80)}"`);
    if (sameAsOld) {
      console.log("  OLD vs NEW:         SAME story");
    } else if (oldTop) {
      const oldEligible = classifications.find(c => c.story.id === oldTop.id)?.cls.is_delta;
      const reason = oldEligible === false
        ? "OLD failed delta test — new logic correctly deprioritised it"
        : `OLD lost on edge ranking (ubiquity or sig tiebreak)`;
      console.log(`  OLD vs NEW:         DIVERGED — ${reason}`);
    } else {
      console.log("  OLD vs NEW:         Old had no sig>=35 story; new found delta-eligible candidate");
    }
  } else {
    console.log("  NEW: no delta-eligible candidates — would fall back to old logic");
  }

  console.log("\n" + hr("═") + "\n");
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
