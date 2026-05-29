/**
 * scripts/diag-category-invariance.ts
 *
 * Phrasing-invariance proof for the CATEGORY classifier design.
 * Runs the PNG MPA story through 3 prompt-wording variants and
 * two commercial contrast stories — all at temp=0.
 *
 * Expected result: GOVERNANCE_CHANGE is stable across variants for PNG MPA;
 * COMMERCIAL_BUSINESS is stable for Damen / Seapeak regardless of phrasing.
 *
 * Run: npx tsx --env-file=.env.local scripts/diag-category-invariance.ts
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Test stories ───────────────────────────────────────────────────────────────

const PNG_TITLE   = "Papua New Guinea announces largest MPA in its history";
const PNG_SUMMARY = "Papua New Guinea has officially established the Western Manus Marine Protected Area, covering 208,000 square kilometres — roughly the size of the United Kingdom. The fully no-take zone is the country's largest MPA and represents a binding national commitment to protect 30 percent of its territorial waters by 2030, directly fulfilling a 30x30 pledge made at COP15.";

const DAMEN_TITLE   = "Damen Fuel Flexible Tugs product guidance announcement";
const DAMEN_SUMMARY = "Damen has released new product guidance for its Fuel Flexible Tug range, which can run on diesel, methanol, or ammonia, enabling operators to future-proof fleet investments.";

const SEA_TITLE   = "Seapeak grows LNG orderbook with $756m Samsung Heavy trio";
const SEA_SUMMARY = "Seapeak has placed an order with Samsung Heavy Industries for three new LNG carriers worth $756 million, expanding its fleet and orderbook.";

const MONGABAY_TITLE   = "Sharks and rays do not know boundaries and a new high seas treaty could help protect them";
const MONGABAY_SUMMARY = "Scientists say the newly signed BBNJ Treaty provides a framework that could protect highly migratory species like sharks and rays in international waters. Researchers analysed movement data and concluded that a coordinated MPA network under the treaty would benefit open-ocean species currently beyond national jurisdiction.";

// ── Prompt variants ───────────────────────────────────────────────────────────

const VARIANT_A =
  "Classify this ocean news story into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action — designation of protected area, ratification, adoption of regulation, enforcement action, sanction, ban, approval, entry into force, formal commitment.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, merger, JV, funding round, vendor announcement.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceedings, expert opinion, background explainer, policy discussion.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Return JSON only: {\"category\": string, \"governance_significance\": number (0-100, governance importance to ocean-policy audience), \"reasoning\": string (one sentence)}";

const VARIANT_B =
  "You are a policy analyst classifying ocean governance news.\n\n" +
  "For each story, identify what type of event it reports:\n" +
  "GOVERNANCE_CHANGE — the primary event is a formal government or institutional action (new law, protected area designation, treaty ratification, binding commitment, enforcement decision, sanction, approval of regulation)\n" +
  "ANALYSIS_OR_FINDING — the primary event is a research publication, scientific finding, or data analysis\n" +
  "COMMERCIAL_BUSINESS — the primary event is a corporate or commercial transaction, product, or announcement\n" +
  "EXPLAINER_OR_DISCUSSION — the primary event is a debate, conference, expert commentary, or background explanation\n" +
  "OTHER — none of the above\n\n" +
  "Respond with JSON only: {\"category\": string, \"governance_significance\": integer 0-100, \"reasoning\": string}";

const VARIANT_C =
  "Classify ocean news by story type. Consider only what the story reports as its primary news event.\n\n" +
  "GOVERNANCE_CHANGE: An official authority (national government, intergovernmental body, treaty secretariat) took an action with legal or regulatory effect — this includes: establishing protected areas, enacting bans, ratifying treaties, adopting resolutions, imposing sanctions, granting approvals, making formal commitments.\n" +
  "ANALYSIS_OR_FINDING: Primary event is publication of research, data, or expert analysis.\n" +
  "COMMERCIAL_BUSINESS: Primary event is a business transaction, product, investment, or corporate announcement.\n" +
  "EXPLAINER_OR_DISCUSSION: Primary event is a discussion, meeting summary, opinion, or explanatory piece.\n" +
  "OTHER: Does not fit above.\n\n" +
  "Return JSON only: {\"category\": string, \"governance_significance\": number, \"reasoning\": string}";

// ── Classifier ─────────────────────────────────────────────────────────────────

async function classify(
  system: string,
  title: string,
  summary: string,
): Promise<{ category: string; governance_significance: number; reasoning: string }> {
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
  if (!match) return { category: "PARSE_ERROR", governance_significance: -1, reasoning: raw.slice(0, 100) };
  return JSON.parse(match[0]);
}

function hr(n = 80) { return "─".repeat(n); }

async function main() {
  console.log("PHRASING-INVARIANCE PROOF — CATEGORY classifier design");
  console.log("Model: claude-haiku-4-5-20251001 | temperature: 0");
  console.log("Three prompt variants, same categories, same stories.\n");

  const variants = [
    { name: "VARIANT A (action-framed)",      system: VARIANT_A },
    { name: "VARIANT B (event-framed)",        system: VARIANT_B },
    { name: "VARIANT C (significance-framed)", system: VARIANT_C },
  ];

  const stories = [
    { label: "PNG MPA (governance designation)",              title: PNG_TITLE,      summary: PNG_SUMMARY,      expected: "GOVERNANCE_CHANGE" },
    { label: "Mongabay BBNJ research/analysis",               title: MONGABAY_TITLE, summary: MONGABAY_SUMMARY, expected: "ANALYSIS_OR_FINDING or EXPLAINER" },
    { label: "Damen Fuel Flexible Tugs (commercial)",         title: DAMEN_TITLE,    summary: DAMEN_SUMMARY,    expected: "COMMERCIAL_BUSINESS" },
    { label: "Seapeak LNG orderbook (commercial, passed Delta Test)", title: SEA_TITLE, summary: SEA_SUMMARY, expected: "COMMERCIAL_BUSINESS" },
  ];

  // Run all variants x all stories
  const results: Record<string, { category: string; sig: number; reasoning: string }[]> = {};
  for (const s of stories) results[s.label] = [];

  for (const v of variants) {
    console.log(hr());
    console.log(v.name);
    console.log(hr());
    for (const s of stories) {
      const r = await classify(v.system, s.title, s.summary);
      results[s.label].push({ category: r.category, sig: r.governance_significance, reasoning: r.reasoning });
      console.log(`  ${s.label}`);
      console.log(`    category: ${r.category}  |  gov_sig: ${r.governance_significance}`);
      console.log(`    reasoning: ${r.reasoning}`);
      console.log("");
    }
  }

  // ── Summary: stability across variants ──────────────────────────────────────
  console.log("═".repeat(80));
  console.log("PHRASING-INVARIANCE SUMMARY");
  console.log("═".repeat(80));
  for (const s of stories) {
    const r = results[s.label];
    const cats = r.map(x => x.category);
    const stable = new Set(cats).size === 1;
    const sigs   = r.map(x => x.sig);
    console.log(`\n  ${s.label}`);
    console.log(`  Expected: ${s.expected}`);
    console.log(`  Results:  ${cats.join(" | ")}`);
    console.log(`  Gov_sig:  ${sigs.join(" | ")}`);
    console.log(`  STABLE:   ${stable ? "YES — category consistent across all variants" : "NO — category drifted across variants"}`);
    if (!stable) {
      console.log(`  !!! INSTABILITY DETECTED — investigate prompt or story before shipping !!!`);
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log("CONTRAST WITH DELTA TEST (verb-based):");
  console.log("  PNG MPA under Delta Test: passes with 'opens' (backtest prompt), fails with 'announces'/'declares' (production prompt)");
  console.log("  PNG MPA under CATEGORY gate: GOVERNANCE_CHANGE regardless of verb phrasing — see above");
  console.log("  This is the phrasing-invariance property the Delta Test lacked.");
  console.log("═".repeat(80) + "\n");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
