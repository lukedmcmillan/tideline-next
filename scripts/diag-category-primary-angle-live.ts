/**
 * scripts/diag-category-primary-angle-live.ts
 *
 * Three-condition primary-angle proof using EXACT live-DB summaries.
 *
 * This replaces diag-category-proof-v2.ts, which used handcrafted summaries.
 * The live Mongabay BBNJ summary ("came into force in January 2026...") differs
 * materially from the handcrafted one and was still classifying GOVERNANCE_CHANGE
 * in production. That invalidated the prior proof.
 *
 * WHAT THIS SCRIPT TESTS:
 *   Phase 1 — Existing primary-angle rule against live DB summaries.
 *              Expected: Condition 1 FAILS (live Mongabay → still GOVERNANCE_CHANGE).
 *
 *   Phase 2 — Revised primary-angle rule that explicitly handles the
 *              "past governance event cited as context" pattern.
 *              Required: Condition 1 PASS 3/3, Condition 2 PASS, Condition 3 PASS.
 *
 * Stories NOT in live DB (Damen, Scotland study) are retained with handcrafted
 * summaries and flagged [NOT IN DB — HANDCRAFTED]. Verdict for those rows
 * is advisory only; they serve as regression guards.
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-category-primary-angle-live.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Test corpus — LIVE DB summaries where available ────────────────────────────

const STORIES = [
  {
    id:           "png-mpa",
    label:        "PNG MPA (genuine governance designation)",
    sourceLabel:  "[LIVE DB — id: found via fetch-proof-stories-live.ts]",
    title:        "Papua New Guinea announces largest MPA in its history",
    // Live DB short_summary (from fetch-proof-stories-live.ts run 2026-05-19)
    summary:      "Papua New Guinea has declared the Western Manus Marine Protected Area, a strictly no-take zone covering approximately 200,000 km² of the Bismarck Sea, making it the country's largest marine protected area. The declaration represents a binding national commitment and directly advances Papua New Guinea's 30x30 pledge made at COP15.",
    expected:     "GOVERNANCE_CHANGE",
    target:       false,
    boundary:     false,
    liveDb:       true,
  },
  {
    id:           "mongabay-bbnj",
    label:        "Mongabay BBNJ (science/conference story — must FLIP)",
    sourceLabel:  "[LIVE DB — id: 3cedc0ba-7072-437d-a005-2678b34cb82c, pub: 2026-05-12, sig: 68]",
    title:        "Sharks and rays do not know boundaries and a new high seas treaty seeks to protect them",
    // EXACT live DB short_summary fetched 2026-05-19 via fetch-mongabay-live.ts
    summary:      "The Biodiversity Beyond National Jurisdiction Agreement, known as the High Seas Treaty, came into force in January 2026, and shark scientists and conservationists meeting at Sharks International 2026 in Sri Lanka identified it as a potential turning point for migratory shark and ray conservation. The treaty creates a legal framework for establishing marine protected areas in the high seas, with Important Shark and Ray Areas identified as a tool for designating critical migratory routes and habitats under that framework.",
    expected:     "ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION",
    target:       true,
    boundary:     false,
    liveDb:       true,
  },
  {
    id:           "damen-tugs",
    label:        "Damen Fuel Flexible Tugs (commercial product)",
    sourceLabel:  "[NOT IN DB — HANDCRAFTED — advisory only]",
    title:        "Damen Fuel Flexible Tugs product guidance announcement",
    summary:      "Damen has released new product guidance for its Fuel Flexible Tug range, which can run on diesel, methanol, or ammonia, enabling operators to future-proof fleet investments.",
    expected:     "COMMERCIAL_BUSINESS",
    target:       false,
    boundary:     false,
    liveDb:       false,
  },
  {
    id:           "seapeak-lng",
    label:        "Seapeak LNG orderbook (commercial fleet order)",
    sourceLabel:  "[LIVE DB — found via fetch-proof-stories-live.ts]",
    title:        "Seapeak grows LNG orderbook with $756m Samsung Heavy trio",
    // Live DB short_summary
    summary:      "Seapeak has contracted three 174,000 cu m dual-fuel X-DF LNG carriers at Samsung Heavy Industries for a combined fully built-up cost of approximately $756m, expanding its LNG fleet and orderbook.",
    expected:     "COMMERCIAL_BUSINESS",
    target:       false,
    boundary:     false,
    liveDb:       true,
  },
  {
    id:           "scotland-study",
    label:        "Scotland trawling study (post-hoc science)",
    sourceLabel:  "[NOT IN DB — HANDCRAFTED — advisory only]",
    title:        "Seabed life triples after bottom trawling ban in Scotland protected area",
    summary:      "Five years after Scotland closed the South Arran Marine Protected Area to bottom trawling, a scientific survey found invertebrate and fish biomass had tripled. The ban was introduced in 2016; this study documents recovery results through 2021.",
    expected:     "ANALYSIS_OR_FINDING",
    target:       false,
    boundary:     false,
    liveDb:       false,
  },
  {
    id:           "boundary-synthetic",
    label:        "BOUNDARY: governance change WITH expert analysis attached",
    sourceLabel:  "[SYNTHETIC — must stay GOVERNANCE_CHANGE, not over-correct to EXPLAINER]",
    title:        "Norway ratifies BBNJ Treaty as legal experts debate enforcement gaps",
    summary:      "[SYNTHETIC] Norway has formally deposited its instrument of ratification for the BBNJ Treaty at the United Nations, becoming the 22nd country to do so. The ratification — a binding legal act — triggers new obligations under the agreement. Legal scholars welcomed the step but raised questions about whether existing monitoring frameworks are sufficient. Three marine law analysts debated enforcement capacity at a parallel side event.",
    expected:     "GOVERNANCE_CHANGE",
    target:       false,
    boundary:     true,
    liveDb:       false,
  },
];

// ── Prompt variants ─────────────────────────────────────────────────────────────

// Existing primary-angle rule (from diag-category-proof-v2.ts — tested against handcrafted summaries)
const RULE_V1 =
  "\nPRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence report as news TODAY — not by governance entities, treaties, or bodies mentioned in passing as context or background.\n" +
  "- A science paper that discusses a treaty as context → ANALYSIS_OR_FINDING (the science is the news)\n" +
  "- A story about researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A story about a past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A story reporting a new formal designation, ratification, or decision made THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event, not when it is mentioned as background context for analysis or discussion.\n";

// Revised primary-angle rule — adds explicit handling for the "past governance event
// cited as context for conference discussion" pattern (the live Mongabay failure case).
const RULE_V2 =
  "\nPRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence report as news TODAY — not by governance entities, treaties, or bodies mentioned as context or background.\n" +
  "- A science paper that discusses a treaty as context → ANALYSIS_OR_FINDING (the science is the news)\n" +
  "- A story about researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A story about a past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A story reporting a new formal designation, ratification, or decision made THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "- A past governance event (treaty entered into force, regulation adopted, law signed — months or years ago) cited as historical background for what scientists, experts, or conservationists discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The governance event is context, not today's news.\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today, not when a past formal action is stated as established fact to set context for current analysis, discussion, or conference proceedings.\n";

function injectRule(base: string, rule: string): string {
  const jsonIdx = base.lastIndexOf("Return JSON");
  return base.slice(0, jsonIdx) + rule + "\n" + base.slice(jsonIdx);
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
  { name: "A", base: VARIANT_A_BASE },
  { name: "B", base: VARIANT_B_BASE },
  { name: "C", base: VARIANT_C_BASE },
];

// ── Classifier ──────────────────────────────────────────────────────────────────

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
  if (expected === "ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION") {
    return category === "ANALYSIS_OR_FINDING" || category === "EXPLAINER_OR_DISCUSSION";
  }
  return category === expected;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

// ── Run one full proof phase ─────────────────────────────────────────────────────

async function runPhase(
  phaseLabel: string,
  rule: string,
): Promise<boolean> {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`${phaseLabel}`);
  console.log(`${"═".repeat(80)}\n`);

  const results: Record<string, Record<string, { category: string; reasoning: string }>> = {};
  for (const s of STORIES) {
    results[s.id] = {};
    for (const v of VARIANTS) {
      const prompt = injectRule(v.base, rule);
      const out = await classify(prompt, s.title, s.summary);
      results[s.id][v.name] = out;
      const flag = s.target ? " [TARGET]" : s.boundary ? " [BOUNDARY]" : "";
      const ok = isCorrect(out.category, s.expected);
      console.log(`  ${v.name} | ${s.id}${flag}`);
      console.log(`    → ${pad(out.category, 28)} ${ok ? "✓" : "✗"}  ${out.reasoning.slice(0, 90)}`);
    }
    console.log("");
  }

  // Condition 1
  const target = STORIES.find(s => s.target)!;
  const c1 = VARIANTS.every(v => isCorrect(results[target.id][v.name].category, target.expected));

  // Condition 2 (live-DB stories only for primary verdict; handcrafted advisory)
  const controls = STORIES.filter(s => !s.target && !s.boundary);
  const c2LivePass = controls
    .filter(s => s.liveDb)
    .every(s => VARIANTS.every(v => isCorrect(results[s.id][v.name].category, s.expected)));
  const c2AllPass = controls
    .every(s => VARIANTS.every(v => isCorrect(results[s.id][v.name].category, s.expected)));

  // Condition 3
  const boundary = STORIES.find(s => s.boundary)!;
  const c3 = VARIANTS.every(v => isCorrect(results[boundary.id][v.name].category, boundary.expected));

  console.log(`─── ${phaseLabel} — CONDITION VERDICTS ───`);
  console.log(`  C1 target flips 3/3:              ${c1 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  C2 live-DB controls survive 3/3:  ${c2LivePass ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  C2 all controls (incl. handcraft): ${c2AllPass ? "✓ PASS" : "✗ FAIL (advisory)"}`);
  console.log(`  C3 boundary stays GOV_CHANGE 3/3: ${c3 ? "✓ PASS" : "✗ FAIL"}`);

  if (!c1) {
    const mongabay = STORIES.find(s => s.target)!;
    console.log(`\n  [DETAIL — TARGET] Mongabay BBNJ results per variant:`);
    for (const v of VARIANTS) {
      const r = results[mongabay.id][v.name];
      console.log(`    Variant ${v.name}: ${r.category}  | ${r.reasoning.slice(0, 100)}`);
    }
  }

  const pass = c1 && c2LivePass && c3;
  console.log(`\n  PHASE VERDICT: ${pass ? "ALL CONDITIONS PASS" : "ONE OR MORE CONDITIONS FAIL"}`);
  return pass;
}

// ── Main ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(80));
  console.log("CATEGORY CLASSIFIER — LIVE-SUMMARY PRIMARY-ANGLE PROOF");
  console.log("Model: claude-haiku-4-5-20251001 | temp: 0 | Variants: A / B / C");
  console.log("Stories sourced from live production DB (2026-05-19)");
  console.log("═".repeat(80));

  console.log("\nSUMMARY COMPARISON — TARGET STORY (Mongabay BBNJ):");
  console.log("  HANDCRAFTED (prior proof — invalid):");
  console.log('  "Scientists say the newly signed BBNJ Treaty provides a framework that could protect');
  console.log('  highly migratory species like sharks and rays..."');
  console.log("  LIVE DB (what production classifies):");
  console.log('  "The Biodiversity Beyond National Jurisdiction Agreement, known as the High Seas');
  console.log('  Treaty, came into force in January 2026, and shark scientists and conservationists');
  console.log('  meeting at Sharks International 2026 in Sri Lanka identified it as a potential');
  console.log('  turning point for migratory shark and ray conservation..."');
  console.log('  ROOT CAUSE: "came into force" is a textbook GOVERNANCE_CHANGE trigger phrase.');
  console.log('  The model anchors on it even though the primary news event is a May 2026 conference.');

  const phase1Pass = await runPhase(
    "PHASE 1 — EXISTING RULE (from diag-category-proof-v2.ts, tested on handcrafted summaries)",
    RULE_V1,
  );

  if (phase1Pass) {
    console.log("\n═".repeat(80));
    console.log("PHASE 1 PASSED ON LIVE SUMMARIES.");
    console.log("Existing rule is sufficient. No revision needed.");
    console.log("Proceed to doc update with production proof confirmed.");
    return;
  }

  console.log("\n  Phase 1 failed on live summaries (expected). Running Phase 2 with revised rule.");
  console.log("\n  RULE REVISION: adding explicit handling for");
  console.log('  "past governance event cited as context for conference/scientific discussion".');

  const phase2Pass = await runPhase(
    "PHASE 2 — REVISED RULE (adds past-event-as-context bullet)",
    RULE_V2,
  );

  console.log("\n" + "═".repeat(80));
  console.log("FINAL VERDICT");
  console.log("═".repeat(80));
  console.log(`  Phase 1 (existing rule vs live summaries): ${phase1Pass ? "PASS" : "FAIL (expected)"}`);
  console.log(`  Phase 2 (revised rule vs live summaries):  ${phase2Pass ? "PASS" : "FAIL"}`);

  if (phase2Pass) {
    console.log("\n  REVISED RULE PASSES ALL THREE CONDITIONS ON LIVE PRODUCTION SUMMARIES.");
    console.log("  Action:");
    console.log("  1. Replace RULE_V1 with RULE_V2 in the production CATEGORY_SYSTEM prompt.");
    console.log("  2. Update claudedocs/brief-category-gate-redesign.md:");
    console.log("     - Section 1: proof status → RESOLVED (live summaries, revised rule)");
    console.log("     - Note summary comparison (handcrafted vs live)");
    console.log("     - Note rule addition (past-event-as-context bullet)");
    console.log("  3. Specify quiet-day behaviour in Section 3.");
    console.log("  4. Proceed to gate-redesign implementation (Step B).");
  } else {
    console.log("\n  REVISED RULE ALSO FAILS. Primary-angle rule needs further rework.");
    console.log("  Do NOT proceed to implementation. Diagnose which condition fails and why.");
    console.log("  Check: is the model anchoring on 'came into force' despite the rule bullet?");
    console.log("  If so, the rule needs stronger negative framing or an explicit example");
    console.log("  that matches the exact live-DB sentence pattern.");
  }
  console.log("═".repeat(80) + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
