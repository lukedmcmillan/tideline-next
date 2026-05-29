/**
 * scripts/diag-category-primary-angle.ts
 *
 * Revision to diag-category-invariance.ts.
 * Tests the category classifier WITH the primary-angle rule added to the prompt.
 *
 * Key question: does the Mongabay BBNJ story flip from GOVERNANCE_CHANGE to
 * ANALYSIS_OR_FINDING / EXPLAINER_OR_DISCUSSION once the prompt explicitly
 * instructs: "category is determined by the PRIMARY NEWS ANGLE, not by
 * governance entities mentioned in context or background"?
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-category-primary-angle.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Test stories ───────────────────────────────────────────────────────────────

const PNG_TITLE   = "Papua New Guinea announces largest MPA in its history";
const PNG_SUMMARY = "Papua New Guinea has officially established the Western Manus Marine Protected Area, covering 208,000 square kilometres — roughly the size of the United Kingdom. The fully no-take zone is the country's largest MPA and represents a binding national commitment to protect 30 percent of its territorial waters by 2030, directly fulfilling a 30x30 pledge made at COP15.";

const MONGABAY_TITLE   = "Sharks and rays do not know boundaries and a new high seas treaty could help protect them";
const MONGABAY_SUMMARY = "Scientists say the newly signed BBNJ Treaty provides a framework that could protect highly migratory species like sharks and rays in international waters. Researchers analysed movement data and concluded that a coordinated MPA network under the treaty would benefit open-ocean species currently beyond national jurisdiction.";

const DAMEN_TITLE   = "Damen Fuel Flexible Tugs product guidance announcement";
const DAMEN_SUMMARY = "Damen has released new product guidance for its Fuel Flexible Tug range, which can run on diesel, methanol, or ammonia, enabling operators to future-proof fleet investments.";

const SEAPEAK_TITLE   = "Seapeak grows LNG orderbook with $756m Samsung Heavy trio";
const SEAPEAK_SUMMARY = "Seapeak has placed an order with Samsung Heavy Industries for three new LNG carriers worth $756 million, expanding its fleet and orderbook.";

const SCOTLAND_TITLE   = "Seabed life triples after bottom trawling ban in Scotland protected area";
const SCOTLAND_SUMMARY = "Five years after Scotland closed the South Arran Marine Protected Area to bottom trawling, a scientific survey found invertebrate and fish biomass had tripled. The ban was introduced in 2016; this study documents recovery results through 2021.";

// ── Prompt WITH primary-angle rule ────────────────────────────────────────────

const PROMPT_WITH_PRIMARY_ANGLE =
  "Classify this ocean news story into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: An official authority (national government, intergovernmental body, treaty secretariat) took a binding or formal action: designation of protected area, ratification, adoption of regulation, enforcement action, sanction, ban, approval, entry into force, formal commitment. The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Primary event is a research publication, scientific study, data release, or expert analysis. The news is that findings exist.\n" +
  "- COMMERCIAL_BUSINESS: Primary event is a company product launch, commercial deal, fleet order, JV, funding round, or vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Primary event is a conference proceeding, expert opinion, background explainer, policy debate, or meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence report as news TODAY — not by governance entities, treaties, or bodies mentioned in passing as context or background.\n" +
  "- A science paper that discusses a treaty as context → ANALYSIS_OR_FINDING (the science is the news)\n" +
  "- A story about researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A story about a past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A story reporting a new formal designation, ratification, or decision made THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event, not when it is mentioned as background context for analysis or discussion.\n\n" +
  "Return JSON only: {\"category\": string, \"reasoning\": string (one sentence explaining the primary news angle)}";

// ── Prompt WITHOUT primary-angle rule (baseline) ──────────────────────────────

const PROMPT_BASELINE =
  "Classify this ocean news story into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action — designation of protected area, ratification, adoption of regulation, enforcement action, sanction, ban, approval, entry into force, formal commitment.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, merger, JV, funding round, vendor announcement.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceedings, expert opinion, background explainer, policy discussion.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Return JSON only: {\"category\": string, \"reasoning\": string (one sentence)}";

// ── Classifier ─────────────────────────────────────────────────────────────────

async function classify(
  system: string,
  title: string,
  summary: string,
): Promise<{ category: string; reasoning: string }> {
  const res = await anthropic.messages.create({
    model:       "claude-haiku-4-5-20251001",
    max_tokens:  200,
    temperature: 0,
    system,
    messages: [{ role: "user", content: `Title: ${title}\nSummary: ${summary}` }],
  });
  const raw     = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return { category: "PARSE_ERROR", reasoning: raw.slice(0, 100) };
  return JSON.parse(match[0]);
}

function hr(n = 80) { return "─".repeat(n); }

async function main() {
  console.log("PRIMARY-ANGLE RULE PROOF — Category classifier revision");
  console.log("Testing: does Mongabay BBNJ flip to ANALYSIS/EXPLAINER with explicit primary-angle rule?");
  console.log("Model: claude-haiku-4-5-20251001 | temperature: 0\n");

  const stories = [
    { label: "PNG MPA (should stay GOVERNANCE_CHANGE)",        title: PNG_TITLE,      summary: PNG_SUMMARY },
    { label: "Mongabay BBNJ (should flip to ANALYSIS/EXPLAINER)", title: MONGABAY_TITLE, summary: MONGABAY_SUMMARY },
    { label: "Damen tugs (should stay COMMERCIAL_BUSINESS)",   title: DAMEN_TITLE,    summary: DAMEN_SUMMARY },
    { label: "Seapeak LNG (should stay COMMERCIAL_BUSINESS)",  title: SEAPEAK_TITLE,  summary: SEAPEAK_SUMMARY },
    { label: "Scotland trawling ban study (post-hoc science story about a past ban — should be ANALYSIS_OR_FINDING, not GOVERNANCE_CHANGE)", title: SCOTLAND_TITLE, summary: SCOTLAND_SUMMARY },
  ];

  console.log(hr("═"));
  console.log("BASELINE (no primary-angle rule)");
  console.log(hr("═"));
  const baseResults: Record<string, string> = {};
  for (const s of stories) {
    const r = await classify(PROMPT_BASELINE, s.title, s.summary);
    baseResults[s.label] = r.category;
    console.log(`  ${s.label}`);
    console.log(`    category: ${r.category}`);
    console.log(`    reasoning: ${r.reasoning}`);
    console.log("");
  }

  console.log(hr("═"));
  console.log("WITH PRIMARY-ANGLE RULE");
  console.log(hr("═"));
  const newResults: Record<string, string> = {};
  for (const s of stories) {
    const r = await classify(PROMPT_WITH_PRIMARY_ANGLE, s.title, s.summary);
    newResults[s.label] = r.category;
    console.log(`  ${s.label}`);
    console.log(`    category: ${r.category}`);
    console.log(`    reasoning: ${r.reasoning}`);
    console.log("");
  }

  console.log(hr("═"));
  console.log("COMPARISON SUMMARY");
  console.log(hr("═"));
  for (const s of stories) {
    const before = baseResults[s.label];
    const after  = newResults[s.label];
    const changed = before !== after ? " *** CHANGED ***" : " (unchanged)";
    console.log(`  ${s.label.split(" (")[0]}`);
    console.log(`    Before: ${before} → After: ${after}${changed}`);
  }

  console.log("\n" + hr("═"));
  console.log("VERDICT:");
  const mongabayBefore = baseResults[stories[1].label];
  const mongabayAfter  = newResults[stories[1].label];
  const pngBefore = baseResults[stories[0].label];
  const pngAfter  = newResults[stories[0].label];
  const pngHolds = pngAfter === "GOVERNANCE_CHANGE";
  const mongabayFlipped = mongabayAfter !== "GOVERNANCE_CHANGE";
  console.log(`  PNG MPA stays GOVERNANCE_CHANGE: ${pngHolds ? "YES" : "NO — PROBLEM"} (${pngBefore} → ${pngAfter})`);
  console.log(`  Mongabay BBNJ flips away from GOVERNANCE_CHANGE: ${mongabayFlipped ? "YES — primary-angle rule works" : "NO — rule insufficient, prompt needs more work"} (${mongabayBefore} → ${mongabayAfter})`);
  if (!mongabayFlipped) {
    console.log("  !!! Mongabay BBNJ did NOT flip. Primary-angle rule needs strengthening before the classifier is production-ready.");
  }
  if (!pngHolds) {
    console.log("  !!! PNG MPA was incorrectly reclassified. Primary-angle rule is over-broad.");
  }
  if (pngHolds && mongabayFlipped) {
    console.log("  Primary-angle rule is correctly discriminating. Safe to incorporate into production prompt.");
  }
  console.log("");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
