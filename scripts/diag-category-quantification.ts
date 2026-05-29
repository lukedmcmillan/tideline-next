/**
 * scripts/diag-category-quantification.ts
 *
 * Quantifies gov_sig dependence in the proposed category-gate design.
 *
 * The design doc revision requires REAL NUMBERS from the 30-day set:
 *   (a) How often does category alone decide lead-eligibility?
 *   (b) How often would classifier gov_sig be the deciding factor vs
 *       existing stories.significance_score?
 *
 * Q5-reversal architecture under test:
 *   Gate:    category === 'GOVERNANCE_CHANGE'
 *   Order:   stories.significance_score (desc)
 *   Gov_sig: advisory only (never gates, never orders)
 *
 * Output:
 *   - GOVERNANCE_CHANGE story count per day (30-day)
 *   - significance_score distribution among GOVERNANCE_CHANGE stories
 *   - Day-by-day: what THE LEAD would be under category+significance_score
 *   - Fallback rate (days with no GOVERNANCE_CHANGE at sig>=35)
 *   - Gov_sig dependence table: for each GOVERNANCE_CHANGE story, does
 *     gov_sig rank agree with significance_score rank? When they diverge,
 *     which is right?
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-category-quantification.ts
 */

import { createClient }      from "@supabase/supabase-js";
import Anthropic             from "@anthropic-ai/sdk";
import { createHash }        from "crypto";

// ── Env ───────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const TEST_EMAIL    = process.env.TEST_EMAIL ?? "(not set)";

if (!SUPABASE_URL || !SERVICE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing env vars — need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
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

// ── Category classifier prompt (Variant A + primary-angle rule) ───────────────
// This is the proposed production prompt. SHA-256 hash = cache key.

const CATEGORY_SYSTEM =
  "You classify ocean governance news stories into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action — " +
    "designation of protected area, ratification, adoption of regulation, enforcement action, " +
    "sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional " +
    "authority (government, IGO, treaty secretariat) — not a company or research team. " +
    "The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis. " +
    "The news is that findings exist, not that an authority acted.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round, " +
    "vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer, " +
    "policy debate, meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Also return governance_significance (0–100): how important is this to ocean-policy professionals, " +
  "regardless of category. A COMMERCIAL story can score 30; a GOVERNANCE_CHANGE can score 92.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence " +
  "report as news TODAY — not by governance entities mentioned in background context.\n" +
  "- A science paper discussing a treaty as context → ANALYSIS_OR_FINDING\n" +
  "- Researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A new formal designation, ratification, or decision THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event.\n\n" +
  "Return JSON only: {\"category\": string, \"governance_significance\": integer, \"reasoning\": string}";

const CATEGORY_PROMPT_VERSION = createHash("sha256")
  .update(CATEGORY_SYSTEM)
  .digest("hex")
  .slice(0, 16);

// ── Types ──────────────────────────────────────────────────────────────────────

interface Story {
  id:                string;
  title:             string;
  source_name:       string;
  source_type:       string | null;
  topic:             string;
  significance_score: number;
  short_summary:     string | null;
  description:       string | null;
  published_at:      string;
}

interface CategoryResult {
  category:               string;
  governance_significance: number;
  reasoning:              string;
}

// ── Phase 1: Cache warming ─────────────────────────────────────────────────────

async function warmCategoryCache(
  candidates: Story[],
): Promise<{ modelCallsMade: number; cacheHits: number }> {
  if (candidates.length === 0) return { modelCallsMade: 0, cacheHits: 0 };

  const ids = candidates.map(s => s.id);

  // Load all existing cache entries for this prompt version
  const { data: cached } = await supabase
    .from("delta_classifications")
    .select("story_id, actor")
    .in("story_id", ids)
    .eq("prompt_version", CATEGORY_PROMPT_VERSION);

  // Treat PARSE_ERROR / ERROR entries as uncached — they need re-classification
  const goodCacheIds = new Set(
    (cached ?? [])
      .filter(r => !["PARSE_ERROR","ERROR"].some(bad => (r.actor ?? "").includes(bad)))
      .map(r => r.story_id)
  );

  const uncached = candidates.filter(s => !goodCacheIds.has(s.id));
  if (uncached.length === 0) return { modelCallsMade: 0, cacheHits: goodCacheIds.size };

  console.log(`  Classifying ${uncached.length} stories via Haiku (${goodCacheIds.size} already cached)...`);

  // Batches of 10 at a time; max_tokens=300 so reasoning field never truncates JSON
  const BATCH = 10;
  const newResults: Array<{ story_id: string; result: CategoryResult }> = [];

  for (let i = 0; i < uncached.length; i += BATCH) {
    const batch = uncached.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(async s => {
        try {
          const res = await anthropic.messages.create({
            model:       "claude-haiku-4-5-20251001",
            max_tokens:  300,   // must be large enough that reasoning never truncates the closing }
            temperature: 0,
            system:      [{ type: "text", text: CATEGORY_SYSTEM, cache_control: { type: "ephemeral" } }],
            messages:    [{ role: "user", content: `Title: ${s.title}\nSummary: ${s.short_summary ?? s.description ?? ""}` }],
          });
          const raw     = res.content[0].type === "text" ? res.content[0].text.trim() : "";
          const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          const match   = cleaned.match(/\{[\s\S]*\}/);
          if (!match) return { story_id: s.id, result: { category: "PARSE_ERROR", governance_significance: 0, reasoning: raw.slice(0, 80) } };
          const parsed  = JSON.parse(match[0]) as CategoryResult;
          return { story_id: s.id, result: parsed };
        } catch (err) {
          return { story_id: s.id, result: { category: "ERROR", governance_significance: 0, reasoning: String(err).slice(0, 80) } };
        }
      })
    );
    newResults.push(...batchResults);
    if (i + BATCH < uncached.length) {
      process.stdout.write(`    ...${Math.min(i + BATCH, uncached.length)}/${uncached.length}\r`);
    }
  }
  console.log(`    ${uncached.length}/${uncached.length} classified`);

  // Upsert — ignoreDuplicates: false so PARSE_ERROR entries get overwritten
  const toInsert = newResults.map(({ story_id, result }) => ({
    story_id,
    prompt_version: CATEGORY_PROMPT_VERSION,
    is_delta:       result.category === "GOVERNANCE_CHANGE",
    actor:          JSON.stringify({ category: result.category, gov_sig: result.governance_significance }),
    delta_verb:     result.category,
    object:         result.reasoning.slice(0, 255),
  }));

  const { error } = await supabase
    .from("delta_classifications")
    .upsert(toInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: false });
  if (error) {
    console.error("  Upsert error:", error.message);
    process.exit(1);
  }

  return { modelCallsMade: uncached.length, cacheHits: goodCacheIds.size };
}

// ── Phase 2: Read from cache ───────────────────────────────────────────────────

async function readCategoryCache(storyIds: string[]): Promise<Map<string, CategoryResult>> {
  if (storyIds.length === 0) return new Map();

  const resultMap = new Map<string, CategoryResult>();
  const PAGE = 900;

  for (let offset = 0; offset < storyIds.length; offset += PAGE) {
    const batch = storyIds.slice(offset, offset + PAGE);
    const { data, error } = await supabase
      .from("delta_classifications")
      .select("story_id, actor, delta_verb, object")
      .in("story_id", batch)
      .eq("prompt_version", CATEGORY_PROMPT_VERSION);
    if (error) { console.error("Read error:", error.message); process.exit(1); }
    for (const row of data ?? []) {
      try {
        const parsed = JSON.parse(row.actor ?? "{}") as { category: string; gov_sig: number };
        resultMap.set(row.story_id, {
          category:               parsed.category ?? row.delta_verb ?? "PARSE_ERROR",
          governance_significance: parsed.gov_sig ?? 0,
          reasoning:              row.object ?? "",
        });
      } catch {
        resultMap.set(row.story_id, { category: row.delta_verb ?? "PARSE_ERROR", governance_significance: 0, reasoning: "" });
      }
    }
  }

  const missing = storyIds.filter(id => !resultMap.has(id));
  if (missing.length > 0) {
    console.error(`\n!!! CACHE COVERAGE FAILURE: ${missing.length} stories missing after warming.`);
    process.exit(1);
  }
  return resultMap;
}

function hr(char = "─", n = 80) { return char.repeat(n); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("CATEGORY-GATE GOV_SIG DEPENDENCE QUANTIFICATION — 30-DAY STORY SET");
  console.log("Architecture under test: category gates | significance_score orders | gov_sig advisory");
  console.log(`CATEGORY_PROMPT_VERSION: ${CATEGORY_PROMPT_VERSION}`);
  console.log("══════════════════════════════════════════════════════════════════════════════\n");

  // Fetch user topics
  const { data: user } = await supabase
    .from("users").select("email, topics").eq("email", TEST_EMAIL).single();
  if (!user) { console.error(`User not found: ${TEST_EMAIL}`); process.exit(1); }

  const userTopics: string[] = Array.isArray(user.topics) ? user.topics : [];
  const contentTopics = new Set(userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t]));
  console.log(`User: ${user.email}`);
  console.log(`Tracker topics: ${userTopics.sort().join(", ")}`);
  console.log(`Expanded content topics: ${[...contentTopics].sort().join(", ")}\n`);

  // Fetch 30-day story pool
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
  console.log(`30-day pool: ${pool30.length} stories with short_summary\n`);

  // Phase 1: warm cache
  console.log("PHASE 1: Category classification (warm cache)...");
  const { modelCallsMade, cacheHits } = await warmCategoryCache(pool30);
  if (modelCallsMade === 0) {
    console.log(`  All ${pool30.length} stories served from persistent cache. Zero model calls.`);
  } else {
    console.log(`  ${modelCallsMade} new classifications, ${cacheHits} cache hits`);
  }

  // Phase 2: read cache
  console.log("\nPHASE 2: Reading classifications from DB...");
  const catMap = await readCategoryCache(pool30.map(s => s.id));
  console.log(`  ${catMap.size}/${pool30.length} stories confirmed\n`);

  // Group by day
  const byDay: Record<string, Story[]> = {};
  for (const s of pool30) {
    const day = s.published_at.slice(0, 10);
    (byDay[day] ??= []).push(s);
  }
  const sortedDays = Object.keys(byDay).sort().reverse();

  // ── Analysis 1: Overall category distribution ───────────────────────────────

  console.log(hr("═"));
  console.log("ANALYSIS 1 — OVERALL CATEGORY DISTRIBUTION (30 days)");
  console.log(hr("═"));

  const catCounts: Record<string, number> = {};
  for (const s of pool30) {
    const cat = catMap.get(s.id)?.category ?? "UNKNOWN";
    catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  }
  const total = pool30.length;
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(30)} ${String(count).padStart(4)} / ${total} (${Math.round(count / total * 100)}%)`);
  }

  // ── Analysis 2: GOVERNANCE_CHANGE significance_score distribution ───────────

  const govStories = pool30.filter(s => catMap.get(s.id)?.category === "GOVERNANCE_CHANGE");
  console.log(`\n  GOVERNANCE_CHANGE stories: ${govStories.length} of ${total}`);

  console.log("\n" + hr("═"));
  console.log("ANALYSIS 2 — GOVERNANCE_CHANGE stories.significance_score DISTRIBUTION");
  console.log(hr("═"));

  const sigBands = [
    { label: "sig >= 70", stories: govStories.filter(s => s.significance_score >= 70) },
    { label: "sig 50–69", stories: govStories.filter(s => s.significance_score >= 50 && s.significance_score < 70) },
    { label: "sig 40–49", stories: govStories.filter(s => s.significance_score >= 40 && s.significance_score < 50) },
    { label: "sig 35–39", stories: govStories.filter(s => s.significance_score >= 35 && s.significance_score < 40) },
    { label: "sig 20–34", stories: govStories.filter(s => s.significance_score >= 20 && s.significance_score < 35) },
    { label: "sig  0–19", stories: govStories.filter(s => s.significance_score < 20) },
  ];
  for (const b of sigBands) {
    const pct = govStories.length > 0 ? Math.round(b.stories.length / govStories.length * 100) : 0;
    console.log(`  ${b.label}: ${String(b.stories.length).padStart(3)} stories (${pct}%)`);
  }

  const govAtFloor35 = govStories.filter(s => s.significance_score >= 35).length;
  const govAtFloor50 = govStories.filter(s => s.significance_score >= 50).length;
  console.log(`\n  GOVERNANCE_CHANGE at sig>=35: ${govAtFloor35} / ${govStories.length} (${Math.round(govAtFloor35 / Math.max(govStories.length, 1) * 100)}%)`);
  console.log(`  GOVERNANCE_CHANGE at sig>=50: ${govAtFloor50} / ${govStories.length} (${Math.round(govAtFloor50 / Math.max(govStories.length, 1) * 100)}%)`);

  // ── Analysis 3: Gov_sig vs significance_score rank agreement ────────────────

  console.log("\n" + hr("═"));
  console.log("ANALYSIS 3 — GOV_SIG vs SIGNIFICANCE_SCORE: RANK AGREEMENT");
  console.log(hr("═"));
  console.log("For each day with >=2 GOVERNANCE_CHANGE stories:");
  console.log("  Does ranking by gov_sig agree with ranking by significance_score?");
  console.log("  Disagreement = gov_sig would pick a different lead than significance_score.\n");

  let daysWithMultiGov = 0;
  let rankAgreeDays    = 0;
  let rankDisagreeDays = 0;
  const rankDisagreeExamples: Array<{ day: string; sigLead: Story; govSigLead: Story; sigScore: number; govSig: number }> = [];

  for (const day of sortedDays) {
    const dayGov = byDay[day]
      .filter(s => catMap.get(s.id)?.category === "GOVERNANCE_CHANGE")
      .filter(s => s.significance_score >= 35);  // only eligible stories

    if (dayGov.length < 2) continue;
    daysWithMultiGov++;

    const bySignificance = [...dayGov].sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0));
    const byGovSig       = [...dayGov].sort((a, b) => (catMap.get(b.id)?.governance_significance ?? 0) - (catMap.get(a.id)?.governance_significance ?? 0));

    if (bySignificance[0].id === byGovSig[0].id) {
      rankAgreeDays++;
    } else {
      rankDisagreeDays++;
      rankDisagreeExamples.push({
        day,
        sigLead:    bySignificance[0],
        govSigLead: byGovSig[0],
        sigScore:   bySignificance[0].significance_score,
        govSig:     catMap.get(byGovSig[0].id)?.governance_significance ?? 0,
      });
    }
  }

  if (daysWithMultiGov === 0) {
    console.log("  No days with >=2 GOVERNANCE_CHANGE stories at sig>=35 — rank comparison not applicable.");
    console.log("  Gov_sig is never the tiebreaker because there is rarely a tie to break.");
    console.log("  Conclusion: category + significance_score is sufficient. Gov_sig adds no decision value.");
  } else {
    console.log(`  Days with >=2 GOVERNANCE_CHANGE stories (sig>=35): ${daysWithMultiGov}`);
    console.log(`  Rank AGREES (sig_score and gov_sig pick same lead): ${rankAgreeDays} (${Math.round(rankAgreeDays / daysWithMultiGov * 100)}%)`);
    console.log(`  Rank DISAGREES (gov_sig would pick different lead): ${rankDisagreeDays} (${Math.round(rankDisagreeDays / daysWithMultiGov * 100)}%)`);
    if (rankDisagreeExamples.length > 0) {
      console.log("\n  Disagreement examples (gov_sig would pick a different lead):");
      for (const ex of rankDisagreeExamples.slice(0, 5)) {
        const sigGovSig   = catMap.get(ex.sigLead.id)?.governance_significance ?? 0;
        const govSigSig   = ex.govSigLead.significance_score;
        console.log(`\n  Day: ${ex.day}`);
        console.log(`    sig_score picks: sig:${ex.sigScore} gov_sig:${sigGovSig} "${ex.sigLead.title.slice(0, 60)}"`);
        console.log(`    gov_sig picks:   sig:${govSigSig} gov_sig:${ex.govSig} "${ex.govSigLead.title.slice(0, 60)}"`);
        // Show which is "right" by human judgment where possible
        const sigReasoning = catMap.get(ex.sigLead.id)?.reasoning ?? "";
        const govReasoning = catMap.get(ex.govSigLead.id)?.reasoning ?? "";
        console.log(`    sig_score lead reasoning: ${sigReasoning.slice(0, 80)}`);
        console.log(`    gov_sig lead reasoning:   ${govReasoning.slice(0, 80)}`);
      }
    }
    if (rankDisagreeDays === 0) {
      console.log("\n  CONCLUSION: Gov_sig rank agrees with significance_score rank 100% of days.");
      console.log("  Using significance_score (independently computed) produces identical lead selection.");
      console.log("  Gov_sig provides zero additional discriminating power. Q5 reversal is safe.");
    } else {
      const disagreePct = Math.round(rankDisagreeDays / daysWithMultiGov * 100);
      console.log(`\n  CONCLUSION: Gov_sig disagrees on ${disagreePct}% of days with multiple gov stories.`);
      console.log(`  Review disagreement examples above to determine if gov_sig or significance_score`);
      console.log(`  picks the better lead. This informs whether the Q5 reversal is safe.`);
    }
  }

  // ── Analysis 4: Day-by-day THE LEAD under category+significance_score ────────

  console.log("\n" + hr("═"));
  console.log("ANALYSIS 4 — DAY-BY-DAY THE LEAD under category+significance_score (sig>=35 floor)");
  console.log(hr("═"));
  console.log("THE LEAD = top GOVERNANCE_CHANGE story at sig>=35 | SIGNAL = no qualifying GC story\n");

  let catLeadDays  = 0;
  let signalDays   = 0;
  let totalDays    = 0;

  for (const day of sortedDays) {
    totalDays++;
    const dayPool = byDay[day];
    const govEligible = dayPool
      .filter(s => catMap.get(s.id)?.category === "GOVERNANCE_CHANGE" && s.significance_score >= 35)
      .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0));

    const topStory = dayPool
      .filter(s => s.significance_score >= 35)
      .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0] ?? null;

    const lead = govEligible[0] ?? null;

    if (lead) {
      catLeadDays++;
      const govSig = catMap.get(lead.id)?.governance_significance ?? 0;
      const oldCat = catMap.get(topStory?.id ?? "")?.category ?? "N/A";
      const topIsGov = topStory?.id === lead.id;
      const sameAsOld = topIsGov ? " ✓ same as OLD" : ` ← NEW LEAD (OLD would have been: ${oldCat} sig:${topStory?.significance_score} "${topStory?.title?.slice(0, 40)}")`;
      console.log(`${day} | THE LEAD  | sig:${String(lead.significance_score).padStart(3)} gov_sig:${String(govSig).padStart(3)} | ${lead.topic.padEnd(14)} | "${lead.title.slice(0, 55)}"${sameAsOld}`);
    } else {
      signalDays++;
      const topCat = topStory ? (catMap.get(topStory.id)?.category ?? "UNKNOWN") : "no stories";
      console.log(`${day} | THE SIGNAL| (no GOVERNANCE_CHANGE at sig>=35) — top story: ${topCat} sig:${topStory?.significance_score ?? 0} "${topStory?.title?.slice(0, 40) ?? ""}"`);
    }
  }

  // ── Analysis 5: Fallback rate ──────────────────────────────────────────────

  console.log("\n" + hr("═"));
  console.log("ANALYSIS 5 — FALLBACK RATE COMPARISON");
  console.log(hr("═"));
  console.log(`Total days in 30-day pool: ${totalDays}`);
  console.log(`Category-gate lead days (GOVERNANCE_CHANGE at sig>=35): ${catLeadDays} (${Math.round(catLeadDays / totalDays * 100)}%)`);
  console.log(`Signal days (no qualifying GOVERNANCE_CHANGE):          ${signalDays} (${Math.round(signalDays / totalDays * 100)}%)`);
  console.log(`Delta-test fallback rate (from prior backtest, floor=35): 33%`);
  const improvement = 33 - Math.round(signalDays / totalDays * 100);
  if (improvement > 0) {
    console.log(`\nCategory gate reduces fallback rate by ~${improvement} percentage points vs Delta Test.`);
    console.log("Interpretation: Delta Test was excluding legitimate GOVERNANCE_CHANGE events via verb lottery.");
  } else if (improvement === 0) {
    console.log("\nCategory gate fallback rate matches Delta Test.");
  } else {
    console.log(`\nCategory gate fallback rate is HIGHER than Delta Test by ${Math.abs(improvement)} percentage points.`);
    console.log("Investigate: the category gate may be correctly identifying quiet governance days");
    console.log("that the Delta Test was wrongly filling with non-governance leads.");
  }

  // ── Analysis 6: Commercial story gate check ────────────────────────────────

  console.log("\n" + hr("═"));
  console.log("ANALYSIS 6 — COMMERCIAL STORY GATE CHECK");
  console.log(hr("═"));
  const commercialAsGov = pool30.filter(
    s => catMap.get(s.id)?.category === "GOVERNANCE_CHANGE" &&
    s.source_type === "esg"
  );
  const topicMismatch = pool30.filter(
    s => catMap.get(s.id)?.category === "COMMERCIAL_BUSINESS" &&
    (s.significance_score ?? 0) >= 35
  );

  console.log(`ESG-source stories classified GOVERNANCE_CHANGE: ${commercialAsGov.length}`);
  if (commercialAsGov.length > 0) {
    for (const s of commercialAsGov.slice(0, 5)) {
      console.log(`  sig:${s.significance_score} "${s.title.slice(0, 70)}"`);
    }
    console.log("  ACTION NEEDED: Review — ESG sources should generally classify COMMERCIAL_BUSINESS.");
  } else {
    console.log("  None — category gate correctly excludes ESG commercial stories.");
  }

  console.log(`\nCOMMERCIAL_BUSINESS stories at sig>=35: ${topicMismatch.length}`);
  if (topicMismatch.length > 0) {
    for (const s of topicMismatch.slice(0, 5)) {
      const govSig = catMap.get(s.id)?.governance_significance ?? 0;
      console.log(`  sig:${s.significance_score} gov_sig:${govSig} "${s.title.slice(0, 70)}"`);
    }
    console.log("  These would NEVER appear as THE LEAD under category gate (correctly excluded).");
  } else {
    console.log("  None above sig>=35 — no relevant commercial stories in pool this period.");
  }

  // ── Final summary ──────────────────────────────────────────────────────────

  console.log("\n" + hr("═"));
  console.log("SUMMARY FOR DESIGN DOC REVISION 1");
  console.log(hr("═"));
  console.log(`30-day pool: ${pool30.length} stories | ${sortedDays.length} days`);
  console.log(`GOVERNANCE_CHANGE: ${govStories.length} (${Math.round(govStories.length / total * 100)}% of pool)`);
  console.log(`  at sig>=35: ${govAtFloor35} (${Math.round(govAtFloor35 / Math.max(govStories.length, 1) * 100)}% of GC stories)`);
  console.log(`  at sig>=50: ${govAtFloor50} (${Math.round(govAtFloor50 / Math.max(govStories.length, 1) * 100)}% of GC stories)`);
  console.log(`Category-gate lead rate: ${Math.round(catLeadDays / totalDays * 100)}% of days`);
  console.log(`Signal (fallback) rate:  ${Math.round(signalDays / totalDays * 100)}% of days`);
  if (daysWithMultiGov > 0) {
    console.log(`Gov_sig vs sig_score rank agreement: ${Math.round(rankAgreeDays / daysWithMultiGov * 100)}% of multi-GC days`);
  } else {
    console.log("Gov_sig rank comparison: N/A (no days with >=2 eligible GOVERNANCE_CHANGE stories)");
  }
  console.log("\n" + hr("═") + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
