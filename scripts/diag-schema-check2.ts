import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORY_SYSTEM =
  "You classify ocean governance news stories into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action \u2014\n" +
  "  designation of protected area, ratification, adoption of regulation, enforcement action,\n" +
  "  sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional\n" +
  "  authority (government, IGO, treaty secretariat) \u2014 not a company or research team.\n" +
  "  The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "  The news is that findings exist, not that an authority acted.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round,\n" +
  "  vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer,\n" +
  "  policy debate, meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Also return governance_significance (0-100): how important is this to ocean-policy professionals,\n" +
  "regardless of category. Advisory only \u2014 not used for gating or ordering.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence\n" +
  "report as news TODAY \u2014 not by governance entities mentioned in background context.\n" +
  "- A science paper discussing a treaty as context \u2192 ANALYSIS_OR_FINDING\n" +
  "- Researchers modelling what a treaty COULD enable \u2192 ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A past government action being studied for outcomes \u2192 ANALYSIS_OR_FINDING\n" +
  "- A new formal designation, ratification, or decision THIS CYCLE \u2192 GOVERNANCE_CHANGE\n" +
  "- A past governance event (treaty entered into force, regulation adopted, law signed \u2014 months or\n" +
  "  years ago) cited as historical background for what scientists, experts, or conservationists\n" +
  "  discussed at a conference, summit, or scientific meeting \u2192 EXPLAINER_OR_DISCUSSION. The\n" +
  "  governance event is context, not today's news.\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today,\n" +
  "not when a past formal action is stated as established fact to set context for current analysis,\n" +
  "discussion, or conference proceedings.\n\n" +
  "Return JSON only:\n" +
  "{\"category\": string, \"governance_significance\": integer, \"reasoning\": string (one sentence)}";

const VERSION_ALT = createHash("sha256").update(CATEGORY_SYSTEM).digest("hex").slice(0, 16);

// Also try the version from send-brief exactly as written (with literal arrow chars if different)
const CATEGORY_SYSTEM_LITERAL =
  "You classify ocean governance news stories into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action —\n" +
  "  designation of protected area, ratification, adoption of regulation, enforcement action,\n" +
  "  sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional\n" +
  "  authority (government, IGO, treaty secretariat) — not a company or research team.\n" +
  "  The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "  The news is that findings exist, not that an authority acted.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round,\n" +
  "  vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer,\n" +
  "  policy debate, meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Also return governance_significance (0-100): how important is this to ocean-policy professionals,\n" +
  "regardless of category. Advisory only — not used for gating or ordering.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence\n" +
  "report as news TODAY — not by governance entities mentioned in background context.\n" +
  "- A science paper discussing a treaty as context → ANALYSIS_OR_FINDING\n" +
  "- Researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A new formal designation, ratification, or decision THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "- A past governance event (treaty entered into force, regulation adopted, law signed — months or\n" +
  "  years ago) cited as historical background for what scientists, experts, or conservationists\n" +
  "  discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The\n" +
  "  governance event is context, not today's news.\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today,\n" +
  "not when a past formal action is stated as established fact to set context for current analysis,\n" +
  "discussion, or conference proceedings.\n\n" +
  "Return JSON only:\n" +
  "{\"category\": string, \"governance_significance\": integer, \"reasoning\": string (one sentence)}";

const VERSION_LITERAL = createHash("sha256").update(CATEGORY_SYSTEM_LITERAL).digest("hex").slice(0, 16);

console.log("Version with em-dashes (\u2014) and Unicode arrows (\u2192):", VERSION_ALT);
console.log("Version with em-dashes (\u2014) and ASCII arrows (\u2192 as → literal):", VERSION_LITERAL);
console.log("Are they the same?", VERSION_ALT === VERSION_LITERAL);

async function main() {
  // Get all distinct prompt_versions
  const { data: versions } = await supabase
    .from("delta_classifications")
    .select("prompt_version, classified_at")
    .order("classified_at", { ascending: false })
    .limit(1000);

  const versionCounts = new Map<string, number>();
  let latestByVersion = new Map<string, string>();
  for (const r of versions ?? []) {
    versionCounts.set(r.prompt_version, (versionCounts.get(r.prompt_version) ?? 0) + 1);
    if (!latestByVersion.has(r.prompt_version)) latestByVersion.set(r.prompt_version, r.classified_at);
  }

  console.log("\n=== ALL DISTINCT PROMPT_VERSIONS IN delta_classifications ===");
  for (const [v, count] of [...versionCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const latest = latestByVersion.get(v);
    const marker = v === VERSION_LITERAL ? " [CURRENT_LITERAL]" : v === VERSION_ALT ? " [CURRENT_ALT]" : "";
    console.log(`  ${v}${marker}: ${count} rows, latest: ${latest}`);
  }

  // Test actual INSERT with CATEGORY_PROMPT_VERSION (16 chars)
  console.log("\n=== REAL INSERT TEST with f6491a2171c78bdf ===");
  const realInsert = {
    story_id: "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e", // PNG MPA
    prompt_version: "f6491a2171c78bdf",
    is_delta: false,
    category: "GOVERNANCE_CHANGE",
    governance_significance: 85,
  };
  const { error: re } = await supabase
    .from("delta_classifications")
    .upsert(realInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: true });
  console.log("INSERT f6491a2171c78bdf:", re ? `ERROR: ${re.message}` : "OK");

  // Verify it's there
  const { data: verify } = await supabase
    .from("delta_classifications")
    .select("story_id, prompt_version, category, governance_significance, classified_at")
    .eq("story_id", "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e")
    .eq("prompt_version", "f6491a2171c78bdf");
  console.log("Verify after INSERT:", JSON.stringify(verify));

  // Clean up
  if (!re) {
    await supabase.from("delta_classifications")
      .delete()
      .eq("story_id", "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e")
      .eq("prompt_version", "f6491a2171c78bdf");
    console.log("Cleaned up test row");
  }

  // Test with VERSION_LITERAL
  if (VERSION_LITERAL !== "f6491a2171c78bdf") {
    console.log(`\n=== REAL INSERT TEST with ${VERSION_LITERAL} (LITERAL version) ===`);
    const litInsert = {
      story_id: "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e",
      prompt_version: VERSION_LITERAL,
      is_delta: false,
      category: "GOVERNANCE_CHANGE",
      governance_significance: 85,
    };
    const { error: le } = await supabase
      .from("delta_classifications")
      .upsert(litInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: true });
    console.log(`INSERT ${VERSION_LITERAL}:`, le ? `ERROR: ${le.message}` : "OK");
    if (!le) {
      await supabase.from("delta_classifications")
        .delete()
        .eq("story_id", "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e")
        .eq("prompt_version", VERSION_LITERAL);
    }
  }
}

main().catch(console.error);
