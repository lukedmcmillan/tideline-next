/**
 * Backfill: blue_carbon_credits tracker tag for stories from the last 60 days.
 *
 * Uses the same Haiku classification approach as score-significance/route.ts.
 * Stories are re-classified only for the blue_carbon_credits dimension —
 * existing cross_tracker_flags values are preserved (append-only, not replaced).
 *
 * Double-tag handling:
 * - Stories tagged blue_finance may also legitimately carry blue_carbon_credits
 *   if the story covers both domains (e.g., a sovereign blue carbon bond that also
 *   uses a credit registry). These are logged as OVERLAP for manual review.
 * - Stories tagged blue_finance that are NOT also blue carbon credit stories
 *   should NOT be tagged blue_carbon_credits. The Haiku prompt enforces this.
 *
 * Run once after deployment. Delete after confirming results.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-blue-carbon-credits.ts
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

const BACKFILL_SYSTEM = `You classify whether an ocean news story belongs to the Blue Carbon & Biodiversity Credits tracker.

This tracker covers: biodiversity credits, blue carbon credits, marine MRV (measurement, reporting, verification), credit registries. Specifically: Verra marine protocols, Plan Vivo Blue, Gold Standard marine, ICVCM Core Carbon Principles marine applications, mangrove/seagrass/salt marsh credits, ocean carbon removal credits (mCDR), and credit registry decisions or actions.

DO NOT assign if the story is primarily about:
- Blue bond issuance or sovereign blue bonds (that is the blue_finance tracker)
- Debt-for-nature swaps (blue_finance)
- TNFD framework adoption (blue_finance)
- General marine science with no credit/registry angle

REQUIRED TEST before assigning: Is there a named credit instrument, registry action, MRV protocol, or market transaction specifically in the blue carbon or marine biodiversity credit domain?

Return JSON only: { "assign": true|false, "reason": "one sentence" }`;

async function classifyStory(title: string, summary: string): Promise<boolean> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      temperature: 0,
      system: [{ type: "text", text: BACKFILL_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Title: ${title}\nSummary: ${summary}` }],
    });
    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return false;
    const parsed = JSON.parse(match[0]);
    return parsed.assign === true;
  } catch {
    return false;
  }
}

async function main() {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`\nBackfilling blue_carbon_credits for stories since ${since.slice(0, 10)}\n`);

  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, short_summary, cross_tracker_flags")
    .gte("published_at", since)
    .eq("status", "live")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) { console.error("Fetch error:", error.message); process.exit(1); }
  if (!stories || stories.length === 0) { console.log("No stories found."); return; }

  // Exclude stories already tagged blue_carbon_credits
  const candidates = stories.filter(
    s => !((s.cross_tracker_flags as string[] || []).includes("blue_carbon_credits"))
  );
  console.log(`Total stories: ${stories.length}, already tagged: ${stories.length - candidates.length}, to evaluate: ${candidates.length}\n`);

  let tagged = 0;
  let overlaps = 0;
  let skipped = 0;

  for (const story of candidates) {
    const flags = (story.cross_tracker_flags as string[]) || [];
    const alreadyBlueFinance = flags.includes("blue_finance");

    const assign = await classifyStory(story.title, story.short_summary ?? "");

    if (!assign) { skipped++; continue; }

    const newFlags = [...flags, "blue_carbon_credits"];
    const { error: updateErr } = await supabase
      .from("stories")
      .update({ cross_tracker_flags: newFlags })
      .eq("id", story.id);

    if (updateErr) {
      console.error(`  [ERR] ${story.id}: ${updateErr.message}`);
      continue;
    }

    tagged++;
    if (alreadyBlueFinance) {
      overlaps++;
      console.log(`  [OVERLAP blue_finance+blue_carbon_credits] ${story.title.slice(0, 90)}`);
    } else {
      console.log(`  [TAGGED] ${story.title.slice(0, 90)}`);
    }
  }

  console.log(`\n── Summary ──────────────────────────────────────────────`);
  console.log(`  Evaluated:   ${candidates.length}`);
  console.log(`  Tagged:      ${tagged}`);
  console.log(`  Skipped:     ${skipped}`);
  console.log(`  Overlaps:    ${overlaps} (carry both blue_finance + blue_carbon_credits — review manually)`);
  console.log(`────────────────────────────────────────────────────────\n`);
}

main().catch(console.error);
