/**
 * Diagnostic: re-evaluate the 3 blue_carbon_credits-tagged stories
 * against the tightened Haiku classifier prompt.
 *
 * READ-ONLY — prints verdicts only, does NOT modify any tags.
 * Review output, then manually approve removals.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-bcc-retag.ts
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tightened prompt — matches the update applied to score-significance/route.ts
const SYSTEM = `You are an ocean governance significance scorer for Tideline. Classify whether a story belongs to the blue_carbon_credits tracker. Return JSON only. No markdown. No explanation.

blue_carbon_credits — Blue Carbon & Biodiversity Credits. Type 6 / Voluntary standard-setting. Covers biodiversity credits, blue carbon credits, marine MRV (measurement, reporting, verification), and credit registries: Verra marine protocols, Plan Vivo Blue, Gold Standard marine, ICVCM Core Carbon Principles marine applications, mangrove/seagrass/salt marsh credits, ocean carbon removal credits (mCDR), and credit registry decisions or actions. Calibrated threshold: 7.0. True positive rate: ~70% policy-side (provisional — less than 6 months of data). Failure mode: Standards-body methodology releases generate signal that does not always translate to market uptake. Confidential offtake agreements between credit issuers and corporate buyers are structurally invisible. Do NOT assign blue_carbon_credits to: blue bond issuance, debt-for-nature swaps, TNFD framework adoption (those are blue_finance), innovation awards, sustainability challenges, general ocean climate commentary, scientific research about ocean carbon uptake, or any story where the core claim cannot be stated as [named credit instrument or registry or standards body] [delta verb] [object]. Explainer pieces, opinion columns, and science journalism about ocean carbon are explicitly excluded even if they mention credits, MRV, or blue carbon. Required test: Is there a named entity (Verra, Plan Vivo, ICVCM, Gold Standard, a named registry, a named project developer, a named corporate offtaker, a named regulator) taking a specific action (issuing, adopting, retiring, suspending, certifying, ruling on, integrating) on a specific credit instrument, methodology, or registry decision? If the story is about the credit market in general, about ocean carbon science, or about sustainability in general, the answer is no.

Return this exact JSON: { "assign": true|false, "reason": "one sentence" }`;

async function main() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, short_summary, link, source_name, cross_tracker_flags, published_at")
    .contains("cross_tracker_flags", ["blue_carbon_credits"])
    .order("published_at", { ascending: false });

  if (error) { console.error("Fetch error:", error.message); process.exit(1); }
  if (!stories || stories.length === 0) { console.log("No blue_carbon_credits-tagged stories found."); return; }

  console.log(`\nRe-evaluating ${stories.length} blue_carbon_credits-tagged stories against tightened prompt\n`);
  console.log("─".repeat(80));

  for (const story of stories) {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      temperature: 0,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Title: ${story.title}\nSummary: ${story.short_summary ?? ""}` }],
    });

    let verdict = { assign: false, reason: "parse error" };
    try {
      const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) verdict = JSON.parse(match[0]);
    } catch { /* keep default */ }

    const tag = verdict.assign ? "  [KEEP ✓]" : "  [REMOVE ✗]";
    const flags = (story.cross_tracker_flags as string[]) || [];
    const alsoBlueFinance = flags.includes("blue_finance") ? "  (also has blue_finance)" : "";

    console.log(`\n${tag}${alsoBlueFinance}`);
    console.log(`  Title:   ${story.title}`);
    console.log(`  Date:    ${story.published_at?.slice(0, 10)}`);
    console.log(`  Source:  ${story.source_name ?? "—"}  ${story.link ?? ""}`);
    console.log(`  Summary: ${(story.short_summary ?? "").slice(0, 300)}`);
    console.log(`  Verdict: ${verdict.reason}`);
    console.log("  " + "─".repeat(76));
  }

  console.log("\nDone. No tags modified — review above before approving removals.\n");
}

main().catch(console.error);
