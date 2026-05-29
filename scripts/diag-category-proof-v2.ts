/**
 * scripts/diag-category-proof-v2.ts
 *
 * Full three-condition proof for the primary-angle rule in the CATEGORY classifier.
 *
 * Condition 1 — TARGET FLIPS 3/3:
 *   Mongabay BBNJ must classify ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION
 *   across ALL THREE prompt variants (A/B/C) with the primary-angle rule active.
 *   3/3 pass is required. A partial pass means the rule relocated the lottery.
 *
 * Condition 2 — GENUINE GOVERNANCE CASES SURVIVE 3/3:
 *   Every story that was correctly classified in the Section 1 invariance proof
 *   (PNG MPA, Damen, Seapeak, Scotland study) must remain correctly classified
 *   3/3 across all variants. Full before/after table shown for the whole set.
 *
 * Condition 3 — BOUNDARY CASE STAYS GOVERNANCE_CHANGE:
 *   A governance-change story WITH substantial expert discussion/analysis attached
 *   must classify GOVERNANCE_CHANGE, not EXPLAINER. Distinguishes:
 *     "governance change with discussion attached"  → GOVERNANCE_CHANGE
 *     "discussion mentioning a governance change"   → EXPLAINER/ANALYSIS
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-category-proof-v2.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Test corpus ────────────────────────────────────────────────────────────────

const STORIES = [
  {
    id:       "png-mpa",
    label:    "PNG MPA (genuine governance designation)",
    title:    "Papua New Guinea announces largest MPA in its history",
    summary:  "Papua New Guinea has officially established the Western Manus Marine Protected Area, covering 208,000 square kilometres — roughly the size of the United Kingdom. The fully no-take zone is the country's largest MPA and represents a binding national commitment to protect 30 percent of its territorial waters by 2030, directly fulfilling a 30x30 pledge made at COP15.",
    expected: "GOVERNANCE_CHANGE",
    target:   false,
    boundary: false,
  },
  {
    id:       "mongabay-bbnj",
    label:    "Mongabay BBNJ (science story — must FLIP to ANALYSIS/EXPLAINER)",
    title:    "Sharks and rays do not know boundaries and a new high seas treaty could help protect them",
    summary:  "Scientists say the newly signed BBNJ Treaty provides a framework that could protect highly migratory species like sharks and rays in international waters. Researchers analysed movement data and concluded that a coordinated MPA network under the treaty would benefit open-ocean species currently beyond national jurisdiction.",
    expected: "ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION",
    target:   true,   // this is the target that must flip
    boundary: false,
  },
  {
    id:       "damen-tugs",
    label:    "Damen Fuel Flexible Tugs (commercial product)",
    title:    "Damen Fuel Flexible Tugs product guidance announcement",
    summary:  "Damen has released new product guidance for its Fuel Flexible Tug range, which can run on diesel, methanol, or ammonia, enabling operators to future-proof fleet investments.",
    expected: "COMMERCIAL_BUSINESS",
    target:   false,
    boundary: false,
  },
  {
    id:       "seapeak-lng",
    label:    "Seapeak LNG orderbook (commercial fleet order)",
    title:    "Seapeak grows LNG orderbook with $756m Samsung Heavy trio",
    summary:  "Seapeak has placed an order with Samsung Heavy Industries for three new LNG carriers worth $756 million, expanding its fleet and orderbook.",
    expected: "COMMERCIAL_BUSINESS",
    target:   false,
    boundary: false,
  },
  {
    id:       "scotland-study",
    label:    "Scotland trawling study (post-hoc science on past governance action)",
    title:    "Seabed life triples after bottom trawling ban in Scotland protected area",
    summary:  "Five years after Scotland closed the South Arran Marine Protected Area to bottom trawling, a scientific survey found invertebrate and fish biomass had tripled. The ban was introduced in 2016; this study documents recovery results through 2021.",
    expected: "ANALYSIS_OR_FINDING",
    target:   false,
    boundary: false,
  },
  {
    id:       "boundary-synthetic",
    label:    "BOUNDARY (synthetic): governance change WITH expert analysis attached",
    title:    "Norway ratifies BBNJ Treaty as legal experts debate enforcement gaps",
    summary:  "[SYNTHETIC] Norway has formally deposited its instrument of ratification for the BBNJ Treaty at the United Nations, becoming the 22nd country to do so. The ratification — a binding legal act — triggers new obligations under the agreement. Legal scholars welcomed the step but raised questions about whether existing monitoring frameworks are sufficient. Three marine law analysts debated enforcement capacity at a parallel side event, with one describing the ratification as 'politically symbolic until enforcement architecture catches up.'",
    expected: "GOVERNANCE_CHANGE",
    target:   false,
    boundary: true,
  },
];

// ── Prompt variants (from diag-category-invariance.ts Section 1 proof) ─────────

const PRIMARY_ANGLE_RULE =
  "\nPRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence report as news TODAY — not by governance entities, treaties, or bodies mentioned in passing as context or background.\n" +
  "- A science paper that discusses a treaty as context → ANALYSIS_OR_FINDING (the science is the news)\n" +
  "- A story about researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A story about a past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A story reporting a new formal designation, ratification, or decision made THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event, not when it is mentioned as background context for analysis or discussion.\n";

function buildVariant(base: string, withRule: boolean): string {
  if (!withRule) return base;
  // Inject the rule before the final Return JSON instruction
  const jsonIdx = base.lastIndexOf("Return JSON");
  return base.slice(0, jsonIdx) + PRIMARY_ANGLE_RULE + "\n" + base.slice(jsonIdx);
}

const VARIANT_A_BASE =
  "Classify this ocean news story into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action — designation of protected area, ratification, adoption of regulation, enforcement action, sanction, ban, approval, entry into force, formal commitment.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, merger, JV, funding round, vendor announcement.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceedings, expert opinion, background explainer, policy discussion.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Return JSON only: {\"category\": string, \"reasoning\": string (one sentence)}";

const VARIANT_B_BASE =
  "You are a policy analyst classifying ocean governance news.\n\n" +
  "For each story, identify what type of event it reports:\n" +
  "GOVERNANCE_CHANGE — the primary event is a formal government or institutional action (new law, protected area designation, treaty ratification, binding commitment, enforcement decision, sanction, approval of regulation)\n" +
  "ANALYSIS_OR_FINDING — the primary event is a research publication, scientific finding, or data analysis\n" +
  "COMMERCIAL_BUSINESS — the primary event is a corporate or commercial transaction, product, or announcement\n" +
  "EXPLAINER_OR_DISCUSSION — the primary event is a debate, conference, expert commentary, or background explanation\n" +
  "OTHER — none of the above\n\n" +
  "Return JSON only: {\"category\": string, \"reasoning\": string}";

const VARIANT_C_BASE =
  "Classify ocean news by story type. Consider only what the story reports as its primary news event.\n\n" +
  "GOVERNANCE_CHANGE: An official authority (national government, intergovernmental body, treaty secretariat) took an action with legal or regulatory effect — this includes: establishing protected areas, enacting bans, ratifying treaties, adopting resolutions, imposing sanctions, granting approvals, making formal commitments.\n" +
  "ANALYSIS_OR_FINDING: Primary event is publication of research, data, or expert analysis.\n" +
  "COMMERCIAL_BUSINESS: Primary event is a business transaction, product, investment, or corporate announcement.\n" +
  "EXPLAINER_OR_DISCUSSION: Primary event is a discussion, meeting summary, opinion, or explanatory piece.\n" +
  "OTHER: Does not fit above.\n\n" +
  "Return JSON only: {\"category\": string, \"reasoning\": string}";

const VARIANTS = [
  { name: "A (action-framed)",      base: VARIANT_A_BASE },
  { name: "B (event-framed)",       base: VARIANT_B_BASE },
  { name: "C (primary-event-framed)", base: VARIANT_C_BASE },
];

// ── Classifier ─────────────────────────────────────────────────────────────────

async function classify(
  system: string,
  title: string,
  summary: string,
): Promise<{ category: string; reasoning: string }> {
  const res = await anthropic.messages.create({
    model:       "claude-haiku-4-5-20251001",
    max_tokens:  250,
    temperature: 0,
    system,
    messages: [{ role: "user", content: `Title: ${title}\nSummary: ${summary}` }],
  });
  const raw     = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return { category: "PARSE_ERROR", reasoning: raw.slice(0, 120) };
  return JSON.parse(match[0]);
}

function isCorrect(category: string, expected: string): boolean {
  // Accept either category for ANALYSIS/EXPLAINER cases
  if (expected === "ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION") {
    return category === "ANALYSIS_OR_FINDING" || category === "EXPLAINER_OR_DISCUSSION";
  }
  return category === expected;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("CATEGORY CLASSIFIER — THREE-CONDITION PRIMARY-ANGLE PROOF (v2)");
  console.log("Model: claude-haiku-4-5-20251001 | temp: 0 | Variants: A / B / C");
  console.log("══════════════════════════════════════════════════════════════════════════════\n");

  // Results: results[storyId][variantName][withRule] = { category, reasoning }
  const results: Record<string, Record<string, Record<"baseline"|"withRule", { category: string; reasoning: string }>>> = {};
  for (const s of STORIES) {
    results[s.id] = {};
    for (const v of VARIANTS) {
      results[s.id][v.name] = { baseline: { category: "", reasoning: "" }, withRule: { category: "", reasoning: "" } };
    }
  }

  // Run all classifications
  for (const v of VARIANTS) {
    const baselinePrompt = buildVariant(v.base, false);
    const rulePrompt     = buildVariant(v.base, true);

    console.log(`── Running Variant ${v.name} ─────────────────────────────────────────────────`);
    for (const s of STORIES) {
      const base = await classify(baselinePrompt, s.title, s.summary);
      const rule = await classify(rulePrompt,     s.title, s.summary);
      results[s.id][v.name].baseline = base;
      results[s.id][v.name].withRule  = rule;
      const flag = s.boundary ? " [BOUNDARY]" : s.target ? " [TARGET]" : "";
      console.log(`  ${s.id}${flag}`);
      console.log(`    BASELINE: ${pad(base.category, 28)} | ${base.reasoning.slice(0, 80)}`);
      console.log(`    +RULE:    ${pad(rule.category, 28)} | ${rule.reasoning.slice(0, 80)}`);
      console.log("");
    }
  }

  // ── Full comparison table ──────────────────────────────────────────────────

  console.log("\n══════════════════════════════════════════════════════════════════════════════");
  console.log("FULL CLASSIFICATION TABLE — BEFORE vs AFTER PRIMARY-ANGLE RULE");
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(pad("Story", 46) + " │ " + pad("Expected", 16) + " │ " + pad("A base→rule", 40) + " │ " + pad("B base→rule", 40) + " │ " + pad("C base→rule", 40));
  console.log("─".repeat(190));

  for (const s of STORIES) {
    const tag = s.boundary ? " [BOUNDARY]" : s.target ? " [TARGET]" : "";
    const lbl = (s.label.split("(")[0].trim() + tag).slice(0, 45);
    const cols = VARIANTS.map(v => {
      const base = results[s.id][v.name].baseline.category;
      const rule = results[s.id][v.name].withRule.category;
      const ok   = isCorrect(rule, s.expected);
      return pad(`${base} → ${rule}${ok ? " ✓" : " ✗"}`, 40);
    });
    console.log(pad(lbl, 46) + " │ " + pad(s.expected.slice(0, 16), 16) + " │ " + cols.join(" │ "));
  }

  // ── Condition verdicts ─────────────────────────────────────────────────────

  console.log("\n══════════════════════════════════════════════════════════════════════════════");
  console.log("CONDITION VERDICTS");
  console.log("══════════════════════════════════════════════════════════════════════════════\n");

  // Condition 1: Target flips 3/3
  const mongabay = STORIES.find(s => s.target)!;
  const c1Results = VARIANTS.map(v => ({
    variant:  v.name,
    baseline: results[mongabay.id][v.name].baseline.category,
    withRule: results[mongabay.id][v.name].withRule.category,
    flipped:  isCorrect(results[mongabay.id][v.name].withRule.category, mongabay.expected),
    wasGov:   results[mongabay.id][v.name].baseline.category === "GOVERNANCE_CHANGE",
  }));
  const c1Pass = c1Results.every(r => r.flipped);
  console.log("CONDITION 1 — TARGET FLIPS PHRASING-INVARIANT (3/3 variants required):");
  console.log(`  Story: ${mongabay.label}`);
  for (const r of c1Results) {
    const status = r.flipped ? "PASS" : "FAIL";
    console.log(`  Variant ${r.variant}: ${r.baseline} → ${r.withRule}  [${status}]`);
  }
  console.log(`  OVERALL: ${c1Pass ? "✓ PASS — target flips 3/3" : "✗ FAIL — rule did not flip target on all variants (lottery relocated, not ended)"}\n`);

  // Condition 2: All other stories survive 3/3
  const survivalStories = STORIES.filter(s => !s.target && !s.boundary);
  const c2Data: { story: typeof STORIES[0]; results: { v: string; base: string; rule: string; ok: boolean }[] }[] = [];
  for (const s of survivalStories) {
    const vResults = VARIANTS.map(v => ({
      v:    v.name,
      base: results[s.id][v.name].baseline.category,
      rule: results[s.id][v.name].withRule.category,
      ok:   isCorrect(results[s.id][v.name].withRule.category, s.expected),
    }));
    c2Data.push({ story: s, results: vResults });
  }
  const c2Pass = c2Data.every(d => d.results.every(r => r.ok));
  console.log("CONDITION 2 — GENUINE CASES SURVIVE UNCHANGED (3/3 variants each):");
  for (const d of c2Data) {
    console.log(`  ${d.story.label}`);
    console.log(`    Expected: ${d.story.expected}`);
    for (const r of d.results) {
      const status = r.ok ? "PASS" : "FAIL";
      console.log(`    Variant ${r.v}: ${r.base} → ${r.rule}  [${status}]`);
    }
    const allOk = d.results.every(r => r.ok);
    console.log(`    Story result: ${allOk ? "✓ PASS 3/3" : "✗ FAIL — over-correction detected"}\n`);
  }
  console.log(`  OVERALL: ${c2Pass ? "✓ PASS — all genuine cases survive 3/3" : "✗ FAIL — over-correction: primary-angle rule broke a previously-correct case"}\n`);

  // Condition 3: Boundary case stays GOVERNANCE_CHANGE
  const boundary = STORIES.find(s => s.boundary)!;
  const c3Results = VARIANTS.map(v => ({
    variant:  v.name,
    baseline: results[boundary.id][v.name].baseline.category,
    withRule: results[boundary.id][v.name].withRule.category,
    ok:       isCorrect(results[boundary.id][v.name].withRule.category, boundary.expected),
  }));
  const c3Pass = c3Results.every(r => r.ok);
  console.log("CONDITION 3 — BOUNDARY CASE STAYS GOVERNANCE_CHANGE [SYNTHETIC]:");
  console.log(`  Story: ${boundary.label}`);
  console.log(`  (Governance change WITH expert discussion attached — must not over-correct to EXPLAINER)`);
  for (const r of c3Results) {
    const status = r.ok ? "PASS" : "FAIL";
    console.log(`  Variant ${r.variant}: ${r.baseline} → ${r.withRule}  [${status}]`);
  }
  console.log(`  OVERALL: ${c3Pass ? "✓ PASS — boundary case stays GOVERNANCE_CHANGE" : "✗ FAIL — over-correction: governance-with-discussion misclassified as EXPLAINER"}\n`);

  // ── Final verdict ──────────────────────────────────────────────────────────

  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("FINAL VERDICT");
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(`  Condition 1 (target flips 3/3):              ${c1Pass ? "PASS" : "FAIL"}`);
  console.log(`  Condition 2 (genuine cases survive 3/3):     ${c2Pass ? "PASS" : "FAIL"}`);
  console.log(`  Condition 3 (boundary case GOVERNANCE_CHANGE): ${c3Pass ? "PASS" : "FAIL"}`);
  console.log("");
  if (c1Pass && c2Pass && c3Pass) {
    console.log("  ALL THREE CONDITIONS PASS.");
    console.log("  Primary-angle rule is discriminating correctly.");
    console.log("  Safe to incorporate into production classifier prompt and proceed to revised design doc.");
  } else {
    console.log("  ONE OR MORE CONDITIONS FAILED.");
    console.log("  Primary-angle rule needs rework before design doc. Do not proceed on a partial pass.");
    if (!c1Pass) console.log("  → Fix required: rule does not consistently flip the target across all variants.");
    if (!c2Pass) console.log("  → Fix required: rule is over-broad — genuine governance cases are being reclassified.");
    if (!c3Pass) console.log("  → Fix required: rule over-corrects — governance-with-discussion loses GOVERNANCE_CHANGE.");
  }
  console.log("══════════════════════════════════════════════════════════════════════════════\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
