/**
 * scripts/diag-sig-floor-backtest.ts — EXPANDED v2 (2026-05-19)
 *
 * Five-question significance-floor and delta-gate backtest.
 *
 * Q1 (original): 30-day fallback frequency at floor 35, and 10-day day-by-day
 *    OLD vs NO-FLOOR vs FLOOR-35/40/50 lead comparison.
 *
 * Q2: For each of 10 days, does any floor-passing delta-eligible lead appear
 *    to be a commercial/business-dev story? Lists every day where a floor-passing
 *    delta-eligible lead is commercial-non-governance.
 *
 * Q3: PNG MPA story investigation. Find "Papua New Guinea announces largest MPA"
 *    in today's data, show its cached delta verdict, and run a targeted diagnostic
 *    Haiku call that returns the raw verb BEFORE allowlist filtering — to confirm
 *    whether "announces" is the rejection reason.
 *
 * Q4: Headline-body coherence bug diagnosis. For today's data, show which tracker
 *    the fallback headline would name (topTracker = highest-score tracker in user
 *    topics) vs which story would be in the body (topStory = highest-sig candidate),
 *    and confirm they share no topic alignment. No fixes — diagnosis only.
 *
 * Q5: Governance-verb exclusion across 10 days. For each day, scan REJECTED stories
 *    for titles containing governance-adjacent verbs NOT in DELTA_VERB_ALLOWLIST
 *    (announces, designates, declares, establishes, etc.). Counts and lists every
 *    case where a genuine-looking governance event was excluded purely on verb grounds.
 *
 * ── Cache structure ──────────────────────────────────────────────────────────
 * Phase 1: warmCache() — classify uncached stories, write to delta_classifications.
 *          Returns model call count only. Does NOT build the resultMap.
 * Phase 2: readCacheOnly() — fresh DB SELECT. Hard assertion: 100% coverage.
 *          ALL comparisons use this resultMap. Zero in-memory fresh rolls.
 *
 * NOTE ON PROMPT VERSION: This script's DELTA_PROMPT_VERSION is derived from
 * DELTA_SYSTEM below. If DELTA_SYSTEM differs from the prompt in send-brief/route.ts
 * (even by one character), the hashes differ → separate cache partitions → separate
 * classification history. The script logs DELTA_PROMPT_VERSION at startup so you can
 * verify whether it matches production.
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-sig-floor-backtest.ts
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
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase  = createClient(SUPABASE_URL, SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── TRACKER_TO_TOPICS (canonical) ─────────────────────────────────────────────

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

const TRACKER_LABELS: Record<string, string> = {
  "bbnj":          "BBNJ Treaty",
  "isa":           "Deep-Sea Mining",
  "imo-shipping":  "IMO Shipping",
  "30x30":         "30x30",
  "iuu":           "IUU Fishing",
  "wto-fisheries": "WTO Fisheries",
  "cites-marine":  "CITES Marine",
  "blue-finance":  "Blue Finance",
  "plastics":      "Ocean Plastics",
  "offshore-wind": "Offshore Wind",
};

// ── Delta gate (identical to production) ──────────────────────────────────────

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

const DELTA_PROMPT_VERSION = createHash("sha256")
  .update(DELTA_SYSTEM)
  .digest("hex")
  .slice(0, 16);

// ── Governance-adjacent verbs NOT in allowlist ─────────────────────────────────
// These represent genuine governance actions that the current allowlist excludes.

const GOVERNANCE_ADJACENT_VERBS = [
  "announces", "announced", "announce",
  "designates", "designated", "designate",
  "declares", "declared", "declare",
  "establishes", "established", "establish",
  "creates", "created", "create",
  "bans", "banned", "ban",
  "commits", "committed", "commit",
  "pledges", "pledged", "pledge",
  "signs", "signed",
  "launches", "launched", "launch",
  "confirms", "confirmed", "confirm",
  "grants", "granted", "grant",
  "approves", "approved", "approve",
  "authorises", "authorises", "authorizes", "authorized",
  "designation", "designation",
];

// ── Commercial story detection ─────────────────────────────────────────────────

function isCommercialStory(s: Story): { commercial: boolean; reason: string } {
  const lowerTitle  = s.title.toLowerCase();
  const lowerSource = s.source_name.toLowerCase();
  const srcType     = (s.source_type ?? "").toLowerCase();

  // ESG source type is commercial-adjacent in this feed (includes shipping vendors, finance)
  if (srcType === "esg") return { commercial: true, reason: `source_type=esg` };

  // Media source type can be commercial (press releases, vendor announcements)
  // Only flag media if the title also has commercial patterns
  const commercialVendorPatterns = [
    "damen", "cma cgm", "maersk", "wartsila", "rolls-royce", "man energy",
    "wärtsilä", "caterpillar", "hyundai heavy", "samsung heavy", "daewoo",
    "lng bunker", "methanol bunker", "ammonia ship", "fuel flexible",
    "product guidance", "product launch", "vessel order", "fleet delivery",
    "contract award", "newbuild", "shipowner", "charterer", "shipyard",
    "tug", "tugs", "offshore support vessel", "osv", "platform supply",
    "bunker fuel", "marine fuel", "maritime fuel", "shipping company",
    "logistics company", "freight", "container line",
  ];

  for (const v of commercialVendorPatterns) {
    if (lowerTitle.includes(v)) return { commercial: true, reason: `title pattern: "${v}"` };
    if (lowerSource.includes(v)) return { commercial: true, reason: `source pattern: "${v}"` };
  }

  return { commercial: false, reason: "" };
}

// ── Governance-adjacent verb scanner ──────────────────────────────────────────

function governanceAdjacentVerbs(title: string): string[] {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const v of GOVERNANCE_ADJACENT_VERBS) {
    // Word-boundary match (avoid "signing" matching "sign")
    const re = new RegExp(`\\b${v}\\b`, "i");
    if (re.test(lower)) found.add(v.replace(/s$/, "").replace(/ed$/, "").replace(/ed$/, "")); // normalise
  }
  return [...found];
}

// ── Types ──────────────────────────────────────────────────────────────────────

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
  source_type: string | null;
  topic: string;
  significance_score: number;
  short_summary: string | null;
  description: string | null;
  published_at: string;
}

// ── Phase 1: Cache warming pass ───────────────────────────────────────────────

async function warmCache(candidates: Story[]): Promise<{ modelCallsMade: number; cacheHits: number }> {
  if (candidates.length === 0) return { modelCallsMade: 0, cacheHits: 0 };

  const ids = candidates.map(s => s.id);

  const { data: cached } = await supabase
    .from("delta_classifications")
    .select("story_id")
    .in("story_id", ids)
    .eq("prompt_version", DELTA_PROMPT_VERSION);

  const cachedIds = new Set((cached ?? []).map(r => r.story_id));
  const uncached  = candidates.filter(s => !cachedIds.has(s.id));

  if (uncached.length === 0) {
    return { modelCallsMade: 0, cacheHits: cachedIds.size };
  }

  const newResults: Array<[string, DeltaResult]> = await Promise.all(
    uncached.map(async (s): Promise<[string, DeltaResult]> => {
      try {
        const res = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 80,
          temperature: 0,
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

  const toInsert = newResults.map(([story_id, cls]) => ({
    story_id, prompt_version: DELTA_PROMPT_VERSION,
    is_delta: cls.is_delta, actor: cls.actor, delta_verb: cls.delta_verb, object: cls.object,
  }));
  const { error: upsertErr } = await supabase
    .from("delta_classifications")
    .upsert(toInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: true });

  if (upsertErr) {
    console.error("  [warm] Upsert error:", upsertErr.message);
    process.exit(1);
  }

  return { modelCallsMade: uncached.length, cacheHits: cachedIds.size };
}

// ── Phase 2: Read verdicts exclusively from DB ────────────────────────────────

async function readCacheOnly(storyIds: string[]): Promise<Map<string, DeltaResult>> {
  if (storyIds.length === 0) return new Map();

  const resultMap = new Map<string, DeltaResult>();
  const PAGE = 900;
  for (let offset = 0; offset < storyIds.length; offset += PAGE) {
    const batch = storyIds.slice(offset, offset + PAGE);
    const { data, error } = await supabase
      .from("delta_classifications")
      .select("story_id, is_delta, actor, delta_verb, object")
      .in("story_id", batch)
      .eq("prompt_version", DELTA_PROMPT_VERSION);
    if (error) {
      console.error("  [read] DB error:", error.message);
      process.exit(1);
    }
    for (const row of data ?? []) {
      resultMap.set(row.story_id, {
        is_delta: row.is_delta,
        actor: row.actor,
        delta_verb: row.delta_verb,
        object: row.object,
      });
    }
  }

  const missing = storyIds.filter(id => !resultMap.has(id));
  if (missing.length > 0) {
    console.error(`\n!!! CACHE COVERAGE FAILURE: ${missing.length} stories missing from delta_classifications after warming pass.`);
    console.error("Comparison cannot proceed — backtest would be invalid.");
    console.error("Missing IDs:", missing.slice(0, 5).join(", "), missing.length > 5 ? `... (+${missing.length - 5} more)` : "");
    process.exit(1);
  }

  return resultMap;
}

// ── Gate 2 edge ranking helpers ───────────────────────────────────────────────

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

function gate2Pick(eligible: Story[], pool: Story[]): Story | null {
  if (eligible.length === 0) return null;
  return eligible
    .map(s => ({ story: s, ubiquity: sourceUbiquity(s, pool) }))
    .sort((a, b) =>
      a.ubiquity !== b.ubiquity
        ? a.ubiquity - b.ubiquity
        : (b.story.significance_score ?? 0) - (a.story.significance_score ?? 0)
    )[0].story;
}

function label(s: Story | null, cls?: DeltaResult): string {
  if (!s) return "(fallback fires — no eligible candidate)";
  const triple = cls?.is_delta
    ? ` [${cls.actor} | ${cls.delta_verb} | ${cls.object}]`
    : "";
  const comm = isCommercialStory(s);
  const commFlag = comm.commercial ? ` *** COMMERCIAL(${comm.reason}) ***` : "";
  const src = `${s.source_name}[${s.source_type ?? "?"}]`;
  return `sig:${String(s.significance_score).padStart(3)} topic:${s.topic.padEnd(12)} ${src.padEnd(30)} "${s.title.slice(0, 60)}"${triple}${commFlag}`;
}

function hr(char = "─", n = 80) { return char.repeat(n); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch user topics
  const { data: user } = await supabase
    .from("users")
    .select("email, topics")
    .eq("email", TEST_EMAIL)
    .single();

  if (!user) {
    console.error(`User not found for TEST_EMAIL=${TEST_EMAIL}`);
    process.exit(1);
  }

  const userTopics: string[] = Array.isArray(user.topics) ? user.topics : [];
  const contentTopics = new Set(userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t]));
  console.log(`User: ${user.email}`);
  console.log(`User tracker topics: ${userTopics.sort().join(", ")}`);
  console.log(`Expanded content topics: ${[...contentTopics].sort().join(", ")}`);
  console.log(`DELTA_PROMPT_VERSION (this script): ${DELTA_PROMPT_VERSION}`);
  console.log(`  NOTE: If this differs from send-brief/route.ts hash, they use separate cache partitions.`);
  console.log(`  To verify production hash, check [send-brief] logs for "Delta cache (v:XXXXXXXXXXXXXXXX)"\n`);

  // ── Fetch 30 days of stories ───────────────────────────────────────────────
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: all30 } = await supabase
    .from("stories")
    .select("id, title, source_name, source_type, topic, significance_score, short_summary, description, published_at")
    .eq("status", "live")
    .in("topic", [...contentTopics, "all"])
    .gte("published_at", d30)
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(1000);

  const pool30 = (all30 ?? []) as Story[];
  console.log(`Loaded ${pool30.length} stories from last 30 days with short_summary\n`);

  // ── PHASE 1: Cache warming ────────────────────────────────────────────────
  console.log("PHASE 1: Cache warming pass (classify uncached, write to delta_classifications)...");
  const { modelCallsMade, cacheHits } = await warmCache(pool30);
  console.log(`  Warming complete: ${modelCallsMade} model calls made, ${cacheHits} stories already cached`);
  if (modelCallsMade > 0) {
    console.log(`  (${modelCallsMade} new verdicts written to delta_classifications at prompt_version=${DELTA_PROMPT_VERSION})`);
  } else {
    console.log(`  ZERO model calls — all stories served from persistent cache. Determinism confirmed.`);
  }

  // ── PHASE 2: Read verdicts exclusively from DB ────────────────────────────
  console.log("\nPHASE 2: Reading all verdicts from delta_classifications (DB only, no inline rolls)...");
  const allIds    = pool30.map(s => s.id);
  const resultMap = await readCacheOnly(allIds);
  console.log(`  ${resultMap.size}/${pool30.length} stories confirmed in cache — comparison is valid\n`);

  // Group by calendar day
  const byDay: Record<string, Story[]> = {};
  for (const s of pool30) {
    const day = s.published_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(s);
  }

  const sortedDays = Object.keys(byDay).sort().reverse(); // most recent first

  // ════════════════════════════════════════════════════════════════════════════
  // Q1 + Q2 INLINE: 10-day lead comparison with commercial detection
  // ════════════════════════════════════════════════════════════════════════════

  console.log(hr("═"));
  console.log("Q1 + Q2: 10-DAY BACKTEST — lead selection + commercial detection");
  console.log(hr("═"));
  console.log("OLD = sig>=35 no delta | NO-FLOOR = delta+edge | FLOOR-35/40/50 = delta+sig floor+edge");
  console.log("*** COMMERCIAL *** flag appears when story is commercial/business-dev (Q2)");
  console.log("");

  const floors = [35, 40, 50] as const;
  let fallbackDays35 = 0;

  // Q2 tracking: days where any floor-passing lead is commercial
  const q2CommercialDays: Array<{
    day: string;
    floor: number | "NO-FLOOR";
    story: Story;
    reason: string;
  }> = [];

  for (const day of sortedDays) {
    const dayPool = byDay[day];
    const deltaStories = dayPool.filter(s => resultMap.get(s.id)?.is_delta === true);
    const allBelow35   = deltaStories.length > 0 && deltaStories.every(s => (s.significance_score ?? 0) < 35);
    if (allBelow35) fallbackDays35++;
  }

  const backtest10 = sortedDays.slice(0, 10);

  for (const day of backtest10) {
    const dayPool      = byDay[day];
    const deltaStories = dayPool.filter(s => resultMap.get(s.id)?.is_delta === true);

    const oldWinner = dayPool
      .filter(s => (s.significance_score ?? 0) >= 35)
      .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0] ?? null;

    const noFloorWinner = gate2Pick(deltaStories, dayPool);
    const noFloorCls    = noFloorWinner ? resultMap.get(noFloorWinner.id) : undefined;

    // Q2: check NO-FLOOR winner
    if (noFloorWinner) {
      const c = isCommercialStory(noFloorWinner);
      if (c.commercial) {
        q2CommercialDays.push({ day, floor: "NO-FLOOR", story: noFloorWinner, reason: c.reason });
      }
    }

    const floorWinners = floors.map(floor => {
      const eligible = deltaStories.filter(s => (s.significance_score ?? 0) >= floor);
      const winner   = gate2Pick(eligible, dayPool);
      const cls      = winner ? resultMap.get(winner.id) : undefined;
      // Q2: check floor winner
      if (winner) {
        const c = isCommercialStory(winner);
        if (c.commercial) {
          q2CommercialDays.push({ day, floor, story: winner, reason: c.reason });
        }
      }
      return { floor, winner, cls };
    });

    const topNonDelta = dayPool
      .filter(s => resultMap.get(s.id)?.is_delta !== true)
      .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0] ?? null;

    console.log(hr("─"));
    console.log(`DATE: ${day}  (${dayPool.length} stories in pool, ${deltaStories.length} delta-eligible)`);
    console.log(`  OLD      : ${label(oldWinner)}`);
    console.log(`  NO-FLOOR : ${label(noFloorWinner, noFloorCls)}`);
    for (const { floor, winner, cls } of floorWinners) {
      const fires = winner ? "" : "  << FALLBACK FIRES >>";
      console.log(`  FLOOR-${floor}: ${label(winner, cls)}${fires}`);
    }
    console.log(`  [top non-delta for ref]: ${label(topNonDelta)}`);
    console.log("");
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Q1: 30-DAY FALLBACK FREQUENCY
  // ════════════════════════════════════════════════════════════════════════════

  console.log(hr("═"));
  console.log("Q1: 30-DAY FALLBACK FREQUENCY (Option 1 viability at floor=35)");
  console.log(hr("═"));
  console.log(`Total days with stories in last 30d: ${sortedDays.length}`);
  console.log(`Days where ALL delta-eligible stories < sig 35: ${fallbackDays35} / ${sortedDays.length}`);
  const pct = sortedDays.length > 0 ? Math.round((fallbackDays35 / sortedDays.length) * 100) : 0;
  console.log(`Fallback rate at floor=35: ${pct}%`);
  if (pct <= 15) {
    console.log("Assessment: fallback rare (<=15%) — floor=35 alone is likely sufficient.");
  } else if (pct <= 35) {
    console.log("Assessment: fallback fires frequently (15-35%) — floor=35 needs Option 2 alongside.");
  } else {
    console.log("Assessment: fallback fires on majority of days (>35%) — Delta Test too narrow. Option 2 required.");
  }

  // Delta distribution
  console.log("\n" + hr("─"));
  console.log("Delta-eligible significance distribution (last 30d):");
  const allDelta30 = pool30.filter(s => resultMap.get(s.id)?.is_delta === true);
  const bands = [
    { label: "sig >= 70", count: allDelta30.filter(s => s.significance_score >= 70).length },
    { label: "sig 50-69", count: allDelta30.filter(s => s.significance_score >= 50 && s.significance_score < 70).length },
    { label: "sig 40-49", count: allDelta30.filter(s => s.significance_score >= 40 && s.significance_score < 50).length },
    { label: "sig 35-39", count: allDelta30.filter(s => s.significance_score >= 35 && s.significance_score < 40).length },
    { label: "sig 20-34", count: allDelta30.filter(s => s.significance_score >= 20 && s.significance_score < 35).length },
    { label: "sig  0-19", count: allDelta30.filter(s => s.significance_score < 20).length },
  ];
  for (const b of bands) console.log(`  ${b.label}: ${b.count} stories`);
  console.log(`  TOTAL delta-eligible: ${allDelta30.length} of ${pool30.length} (${Math.round(allDelta30.length / pool30.length * 100)}%)`);

  // ════════════════════════════════════════════════════════════════════════════
  // Q2: COMMERCIAL STORY SUMMARY
  // ════════════════════════════════════════════════════════════════════════════

  console.log("\n" + hr("═"));
  console.log("Q2: COMMERCIAL STORY SUMMARY — floor-passing delta-eligible leads across 10 days");
  console.log(hr("═"));
  if (q2CommercialDays.length === 0) {
    console.log("RESULT: Zero commercial stories found as floor-passing delta-eligible leads across 10 days.");
    console.log("This means a significance floor ALONE may be sufficient — commercial stories don't appear");
    console.log("to be passing the Delta Test. Today's Damen brief likely came via the FALLBACK path.");
  } else {
    console.log(`RESULT: ${q2CommercialDays.length} commercial story/day combinations found:\n`);
    for (const { day, floor, story, reason } of q2CommercialDays) {
      const cls = resultMap.get(story.id);
      console.log(`  Day: ${day}  Floor: ${floor}`);
      console.log(`  Story: sig:${story.significance_score} topic:${story.topic} source:${story.source_name}[${story.source_type ?? "?"}]`);
      console.log(`  Title: "${story.title}"`);
      console.log(`  Commercial reason: ${reason}`);
      console.log(`  Delta triple: [${cls?.actor} | ${cls?.delta_verb} | ${cls?.object}]`);
      console.log("");
    }
    console.log("CONCLUSION: A significance floor ALONE does NOT fix the commercial-admission problem.");
    console.log("These stories pass the Delta Test AND clear the floor. Verb scope is insufficient.");
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Q3: PNG MPA STORY INVESTIGATION
  // ════════════════════════════════════════════════════════════════════════════

  console.log("\n" + hr("═"));
  console.log("Q3: PNG MPA STORY — delta classification verdict and reasoning");
  console.log(hr("═"));

  // Search pool30 first
  const pngCandidates = pool30.filter(s =>
    s.title.toLowerCase().includes("papua new guinea") ||
    (s.title.toLowerCase().includes("png") && s.title.toLowerCase().includes("mpa")) ||
    (s.title.toLowerCase().includes("papua") && (
      s.title.toLowerCase().includes("mpa") ||
      s.title.toLowerCase().includes("marine protected") ||
      s.title.toLowerCase().includes("conservation")
    ))
  );

  // Also search fresh in DB (broader, includes stories not in pool30 due to topic filter)
  const today = new Date().toISOString().split("T")[0];
  const d7    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pngFresh } = await supabase
    .from("stories")
    .select("id, title, source_name, source_type, topic, significance_score, short_summary, description, published_at")
    .ilike("title", "%Papua New Guinea%")
    .gte("published_at", d7)
    .order("published_at", { ascending: false })
    .limit(10);

  const pngFreshStories = (pngFresh ?? []) as Story[];
  // Also search by MPA content
  const { data: mpaFresh } = await supabase
    .from("stories")
    .select("id, title, source_name, source_type, topic, significance_score, short_summary, description, published_at")
    .ilike("title", "%largest MPA%")
    .gte("published_at", d7)
    .limit(5);
  const mpaFreshStories = (mpaFresh ?? []) as Story[];

  const allPngMatches = [
    ...pngCandidates,
    ...pngFreshStories,
    ...mpaFreshStories,
  ].reduce((acc, s) => {
    if (!acc.some(x => x.id === s.id)) acc.push(s);
    return acc;
  }, [] as Story[]);

  console.log(`PNG/MPA story search results (last 7 days, all topics):`);

  if (allPngMatches.length === 0) {
    console.log("  *** NO PNG MPA STORY FOUND in last 7 days across all topics ***");
    console.log("  This could mean:");
    console.log("  (a) The story has topic outside the user's content topics (hence Across the Sector placement)");
    console.log("  (b) The story was published before the 7-day window");
    console.log("  (c) The story title doesn't match the search pattern");
    console.log("  Broadening search to last 30 days...");

    const { data: pngWide } = await supabase
      .from("stories")
      .select("id, title, source_name, source_type, topic, significance_score, short_summary, description, published_at")
      .ilike("title", "%Papua New Guinea%")
      .gte("published_at", d30)
      .order("published_at", { ascending: false })
      .limit(10);

    const pngWideStories = (pngWide ?? []) as Story[];
    if (pngWideStories.length === 0) {
      console.log("  *** NO Papua New Guinea story found in last 30 days ***");
    } else {
      console.log(`  Found ${pngWideStories.length} PNG story/stories in last 30 days:`);
      for (const s of pngWideStories) {
        const inPool = pool30.some(p => p.id === s.id);
        console.log(`    - sig:${s.significance_score} topic:${s.topic} published:${s.published_at.slice(0,10)} [in_user_pool:${inPool}]`);
        console.log(`      "${s.title}"`);
        console.log(`      source: ${s.source_name}[${s.source_type ?? "?"}]`);
      }
    }
  } else {
    console.log(`  Found ${allPngMatches.length} match(es):\n`);
    for (const s of allPngMatches) {
      const inPool       = pool30.some(p => p.id === s.id);
      const inUserTopics = contentTopics.has(s.topic) || s.topic === "all";
      const cachedCls    = resultMap.get(s.id);
      console.log(`  STORY: "${s.title}"`);
      console.log(`    sig:${s.significance_score} topic:${s.topic} source:${s.source_name}[${s.source_type ?? "?"}]`);
      console.log(`    published: ${s.published_at.slice(0,16)}`);
      console.log(`    in user content pool: ${inPool} | topic in user's expanded topics: ${inUserTopics}`);
      if (!inUserTopics) {
        const nonUserTopics = [...contentTopics].join(", ");
        console.log(`    *** THIS EXPLAINS 'Across the Sector' placement ***`);
        console.log(`    User's expanded content topics: ${nonUserTopics}`);
        console.log(`    Story topic "${s.topic}" is NOT in that set → eligible for selectAcrossSector only`);
      }
      if (cachedCls !== undefined) {
        console.log(`    Cached delta verdict (prompt_version=${DELTA_PROMPT_VERSION}):`);
        console.log(`      is_delta: ${cachedCls.is_delta}`);
        console.log(`      actor: ${cachedCls.actor ?? "null"}`);
        console.log(`      delta_verb: ${cachedCls.delta_verb ?? "null"}`);
        console.log(`      object: ${cachedCls.object ?? "null"}`);
        if (!cachedCls.is_delta) {
          // Check if allowlist is the reason by scanning the title
          const govVerbs = governanceAdjacentVerbs(s.title);
          if (govVerbs.length > 0) {
            console.log(`    Title contains governance-adjacent verbs NOT in allowlist: ${govVerbs.join(", ")}`);
            console.log(`    HYPOTHESIS: delta_verb="${govVerbs[0]}" was returned by Haiku but rejected by DELTA_VERB_ALLOWLIST`);
          }
        }
      } else {
        console.log(`    NOT in backtest cache (prompt_version=${DELTA_PROMPT_VERSION})`);
        console.log(`    (May be cached under a different prompt_version in production)`);
      }
      console.log("");
    }
  }

  // Q3 — Targeted diagnostic: fresh Haiku call WITHOUT allowlist, captures raw verb
  console.log(hr("─"));
  console.log("Q3 DIAGNOSTIC: Fresh Haiku classification of PNG MPA story WITHOUT allowlist filter");
  console.log("(Uses different prompt to capture raw proposed verb before allowlist rejection)");
  console.log("");

  const pngDiagnosticTitle = allPngMatches.length > 0
    ? allPngMatches[0].title
    : "Papua New Guinea announces largest marine protected area in its history, a UK-sized no-take zone explicitly framing a 30% by 2030 commitment";
  const pngDiagnosticSummary = allPngMatches.length > 0
    ? (allPngMatches[0].short_summary ?? allPngMatches[0].description ?? "No summary available")
    : "Papua New Guinea has announced its largest marine protected area, covering a UK-sized no-take zone as part of an explicit 30x30 commitment.";

  // Diagnostic system: relaxed — ask what verb WOULD fit, ignoring the allowlist
  const DIAG_SYSTEM =
    "You classify ocean governance news stories. A story represents change if its core can be stated as [named actor] [action verb] [object].\n\n" +
    "For this diagnostic, you may use ANY action verb that best describes what the actor did — do not restrict yourself to any list.\n\n" +
    "Return JSON: {\"is_governance_delta\": boolean, \"actor\": string|null, \"best_verb\": string|null, \"object\": string|null, \"reasoning\": string}";

  try {
    const diagRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      temperature: 0,
      system: DIAG_SYSTEM,
      messages: [{ role: "user", content: `Title: ${pngDiagnosticTitle}\nSummary: ${pngDiagnosticSummary}` }],
    });
    const diagRaw = diagRes.content[0].type === "text" ? diagRes.content[0].text.trim() : "";
    const diagCleaned = diagRaw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const diagMatch = diagCleaned.match(/\{[\s\S]*\}/);
    if (diagMatch) {
      const diagParsed = JSON.parse(diagMatch[0]);
      console.log(`  Title tested: "${pngDiagnosticTitle.slice(0, 100)}"`);
      console.log(`  Haiku raw diagnostic result:`);
      console.log(`    is_governance_delta: ${diagParsed.is_governance_delta}`);
      console.log(`    actor: ${diagParsed.actor ?? "null"}`);
      console.log(`    best_verb (unconstrained): "${diagParsed.best_verb ?? "null"}"`);
      console.log(`    object: ${diagParsed.object ?? "null"}`);
      console.log(`    reasoning: ${diagParsed.reasoning ?? "none"}`);
      console.log("");
      const bestVerb = (diagParsed.best_verb ?? "").toLowerCase();
      const inAllowlist = DELTA_VERB_ALLOWLIST.has(bestVerb);
      console.log(`  Allowlist check: "${bestVerb}" is ${inAllowlist ? "IN" : "NOT IN"} DELTA_VERB_ALLOWLIST`);
      if (!inAllowlist) {
        console.log(`  CONFIRMED: This verb would be rejected by the allowlist → is_delta forced to false`);
        console.log(`  ALLOWLIST FLAW: "${bestVerb}" describes a genuine governance designation but is excluded.`);
        console.log(`  A country designating an MPA is a policy delta of the same class as a country`);
        console.log(`  'adopting', 'mandating', or 'proposing' a measure — yet none of those synonyms apply.`);
      } else {
        console.log(`  UNEXPECTED: This verb IS in the allowlist. Rejection must have a different cause.`);
        console.log(`  Check the PRIMARY ANGLE or HEADLINE TEST rules for this specific story.`);
      }
    } else {
      console.log("  Haiku diagnostic returned unparseable output:", diagRaw.slice(0, 200));
    }
  } catch (err) {
    console.error("  Diagnostic Haiku call failed:", String(err));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Q4: HEADLINE-BODY COHERENCE BUG — STATIC DIAGNOSIS
  // ════════════════════════════════════════════════════════════════════════════

  console.log("\n" + hr("═"));
  console.log("Q4: HEADLINE-BODY COHERENCE BUG — code path diagnosis");
  console.log(hr("═"));
  console.log("The fallback path in selectLeadFallback() (app/lib/brief/select.ts) builds the");
  console.log("headline from TWO INDEPENDENT selections with NO coherence check between them:\n");
  console.log("  topTracker = highest-score tracker in user's topics (LINE 260-262 of select.ts)");
  console.log("  topStory   = baseCandidates[0] = highest-sig story in user's content topics (LINE 179)\n");
  console.log("Mode 2 of selectLeadFallback fires when:");
  console.log("  topStory.significance_score < 35 (Mode 1 threshold not met)");
  console.log("  AND topTracker.score >= 4.0");
  console.log("  → headline = `${TRACKER_LABELS[topTracker.tracker_slug]} at Pulse ${topTracker.score.toFixed(1)}. ${cleanTitle(topStory.title)}.`\n");
  console.log("The tracker label in the headline is NEVER verified against topStory.topic.");
  console.log("topTracker and topStory are fully independent selections joined by string concat.\n");

  // Show today's actual data for the Mode 2 diagnosis
  const todayStr = today;
  const todayPool = byDay[todayStr] ?? [];

  console.log(`Today's data (${todayStr}): ${todayPool.length} stories in user content pool`);

  if (todayPool.length > 0) {
    // Simulate fallback: baseCandidates (sorted by sig desc, no recently-led filter in backtest)
    const baseCandidates = [...todayPool].sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0));
    const topStory = baseCandidates[0];

    // Fetch tracker scores for today's analysis
    const { data: trackerRows } = await supabase
      .from("velocity_scores")
      .select("tracker_slug, score, interpretation, calculated_at")
      .in("tracker_slug", userTopics)
      .order("calculated_at", { ascending: false })
      .limit(userTopics.length * 3);

    const seenTracker = new Set<string>();
    const uniqueTrackers = (trackerRows ?? []).filter(t => {
      if (seenTracker.has(t.tracker_slug)) return false;
      seenTracker.add(t.tracker_slug);
      return true;
    });

    const topTracker = uniqueTrackers.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    console.log(`\n  topStory (highest-sig in baseCandidates):`);
    console.log(`    sig: ${topStory?.significance_score ?? "N/A"}`);
    console.log(`    topic: ${topStory?.topic ?? "N/A"}`);
    console.log(`    source: ${topStory?.source_name}[${topStory?.source_type ?? "?"}]`);
    console.log(`    title: "${topStory?.title?.slice(0, 80) ?? "N/A"}"`);
    console.log(`    delta_eligible: ${resultMap.get(topStory?.id ?? "")?.is_delta ?? "not in map"}`);

    if (topStory && topTracker) {
      const topStoryTrackerSlugs = Object.entries(TRACKER_TO_TOPICS)
        .filter(([, topics]) => topics.includes(topStory.topic))
        .map(([slug]) => slug);

      console.log(`\n  topTracker (highest-score tracker in user's topics):`);
      console.log(`    tracker_slug: ${topTracker.tracker_slug}`);
      console.log(`    score: ${topTracker.score}`);
      console.log(`    label: "${TRACKER_LABELS[topTracker.tracker_slug] ?? topTracker.tracker_slug}"`);

      console.log(`\n  Topic alignment check:`);
      console.log(`    topStory.topic = "${topStory.topic}"`);
      console.log(`    Tracker slugs for topic "${topStory.topic}": [${topStoryTrackerSlugs.join(", ") || "none"}]`);
      console.log(`    topTracker.tracker_slug = "${topTracker.tracker_slug}"`);
      const aligned = topStoryTrackerSlugs.includes(topTracker.tracker_slug);
      console.log(`    Headline tracker matches story topic: ${aligned}`);
      if (!aligned) {
        console.log(`\n  *** COHERENCE BUG CONFIRMED ***`);
        console.log(`    Headline would read: "${TRACKER_LABELS[topTracker.tracker_slug] ?? topTracker.tracker_slug} at Pulse ${topTracker.score.toFixed(1)}. ${topStory.title.slice(0, 60)}..."`);
        console.log(`    Tracker "${topTracker.tracker_slug}" asserts a state for "${TRACKER_TO_TOPICS[topTracker.tracker_slug]?.join(",") ?? "?"}" topics`);
        console.log(`    Story body is about topic "${topStory.topic}" — unrelated to that tracker`);
        console.log(`    The fallback has no guard: it ALWAYS uses the top tracker regardless of story topic.`);
      } else {
        console.log(`    Topics are aligned — the coherence bug may not have manifested today in this exact form.`);
      }

      // Mode 1 vs Mode 2 disambiguation
      const maxSig = topStory.significance_score ?? 0;
      console.log(`\n  Fallback mode disambiguation:`);
      console.log(`    topStory.sig = ${maxSig}, Mode 1 threshold = 35`);
      if (maxSig >= 35) {
        console.log(`    Mode 1 fires (sig >= 35) → headline = plain story title (NO tracker mention)`);
        console.log(`    Mode 2 (tracker+story hybrid) does NOT fire when sig >= 35`);
        console.log(`    Today's "30x30 at Pulse 7.1" headline implies Damen tugs sig < 35`);
        console.log(`    OR the fallback didn't fire at all (delta-eligible story led instead)`);
      } else {
        console.log(`    sig < 35 → Mode 1 does NOT fire`);
        if (topTracker.score >= 4.0) {
          console.log(`    topTracker.score = ${topTracker.score} >= 4.0 → Mode 2 fires`);
          console.log(`    → headline = tracker label + story title (coherence bug can manifest)`);
        } else {
          console.log(`    topTracker.score = ${topTracker.score} < 4.0 → Mode 3 fires (plain story title)`);
        }
      }
    }
  } else {
    console.log(`  No stories in user pool for today (${todayStr}) — cannot show live Mode 2 data.`);
    console.log(`  Using yesterday's data for illustration:`);
    const yesterday = sortedDays[0];
    console.log(`  Most recent day in pool: ${yesterday} (${byDay[yesterday]?.length ?? 0} stories)`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Q5: GOVERNANCE-VERB EXCLUSION ACROSS 10 DAYS
  // ════════════════════════════════════════════════════════════════════════════

  console.log("\n" + hr("═"));
  console.log("Q5: GOVERNANCE-VERB EXCLUSION — rejected stories with governance-adjacent verbs");
  console.log(hr("═"));
  console.log("Scans rejected stories (is_delta=false) for titles containing verbs like:");
  console.log("announces, designates, declares, establishes, creates, bans, commits, pledges, signs...");
  console.log("These are genuine governance-action verbs NOT in DELTA_VERB_ALLOWLIST.\n");

  let q5TotalExclusions = 0;
  const q5VerbCounts: Record<string, number> = {};
  const q5DayStats: Array<{
    day: string;
    total: number;
    withGovVerb: number;
    highSig: number;
    examples: Array<{ sig: number; topic: string; title: string; verbs: string[] }>;
  }> = [];

  for (const day of backtest10) {
    const dayPool     = byDay[day];
    const rejected    = dayPool.filter(s => resultMap.get(s.id)?.is_delta === false);
    const withGovVerb = rejected.filter(s => governanceAdjacentVerbs(s.title).length > 0);
    const highSig     = withGovVerb.filter(s => (s.significance_score ?? 0) >= 30);

    q5TotalExclusions += withGovVerb.length;
    for (const s of withGovVerb) {
      for (const v of governanceAdjacentVerbs(s.title)) {
        q5VerbCounts[v] = (q5VerbCounts[v] ?? 0) + 1;
      }
    }

    q5DayStats.push({
      day,
      total:       rejected.length,
      withGovVerb: withGovVerb.length,
      highSig:     highSig.length,
      examples:    withGovVerb.slice(0, 5).map(s => ({
        sig:   s.significance_score,
        topic: s.topic,
        title: s.title,
        verbs: governanceAdjacentVerbs(s.title),
      })),
    });
  }

  for (const stat of q5DayStats) {
    console.log(hr("─"));
    console.log(`${stat.day}: ${stat.withGovVerb} of ${stat.total} rejected stories have governance-adjacent verbs (${stat.highSig} with sig>=30)`);
    if (stat.examples.length > 0) {
      for (const e of stat.examples) {
        console.log(`  sig:${String(e.sig).padStart(3)} topic:${e.topic.padEnd(12)} verbs:[${e.verbs.join(",")}]`);
        console.log(`    "${e.title.slice(0, 90)}"`);
      }
    } else {
      console.log("  (no rejections with governance-adjacent verbs this day)");
    }
    console.log("");
  }

  console.log(hr("═"));
  console.log("Q5 SUMMARY across 10 days:");
  console.log(`  Total rejected stories with governance-adjacent verbs: ${q5TotalExclusions}`);
  console.log(`  Verb frequency breakdown:`);
  const sortedVerbs = Object.entries(q5VerbCounts).sort((a, b) => b[1] - a[1]);
  for (const [verb, count] of sortedVerbs) {
    const inList = DELTA_VERB_ALLOWLIST.has(verb) ? " (IN allowlist)" : " (NOT in allowlist)";
    console.log(`    "${verb}": ${count} occurrences${inList}`);
  }
  console.log(`\n  INTERPRETATION:`);
  if (q5TotalExclusions === 0) {
    console.log(`  Zero exclusions found via verb scan. If PNG MPA story was excluded, its title`);
    console.log(`  may not contain the expected verb form, or the story was in a different topic bucket.`);
  } else {
    const avgPerDay = (q5TotalExclusions / backtest10.length).toFixed(1);
    console.log(`  Average ${avgPerDay} governance-verb rejections per day across the 10-day window.`);
    console.log(`  These represent genuine governance actions (designations, announcements, bans)`);
    console.log(`  that the current allowlist systematically excludes.`);
    console.log(`  The allowlist was written for treaty-ratification verbs (adopts, ratifies, mandates)`);
    console.log(`  but ocean governance also includes designation events that use different verb families.`);
  }

  console.log("\n" + hr("═") + "\n");
  console.log("BACKTEST COMPLETE. Full raw output above. No fixes applied.");
  console.log("Five questions answered. Review before any code changes.\n");
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
