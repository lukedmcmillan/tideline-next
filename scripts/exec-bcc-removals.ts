/**
 * One-shot: remove blue_carbon_credits tag from the two confirmed false positives.
 * Approved by user 2026-05-27 after diag-bcc-retag.ts verdict review.
 *
 * Stories targeted (identified by link):
 *   1. Triton Sustainability Challenge — https://scripps.ucsd.edu/news/triton-sustainability-challenge-advances-environmental-innovations-concept-impact
 *   2. The ocean is fighting climate change — https://phys.org/news/2026-05-ocean-climate-people.html
 *
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/exec-bcc-removals.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FALSE_POSITIVE_LINKS = [
  "https://scripps.ucsd.edu/news/triton-sustainability-challenge-advances-environmental-innovations-concept-impact",
  "https://phys.org/news/2026-05-ocean-climate-people.html",
];

async function main() {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, link, cross_tracker_flags")
    .in("link", FALSE_POSITIVE_LINKS);

  if (error) { console.error("Fetch error:", error.message); process.exit(1); }
  if (!stories || stories.length === 0) {
    console.log("No matching stories found — already removed or links changed.");
    return;
  }

  console.log(`\nRemoving blue_carbon_credits from ${stories.length} stories:\n`);

  for (const story of stories) {
    const flags = (story.cross_tracker_flags as string[]) || [];
    if (!flags.includes("blue_carbon_credits")) {
      console.log(`  [SKIP — not tagged] ${story.title.slice(0, 90)}`);
      continue;
    }

    const newFlags = flags.filter((f: string) => f !== "blue_carbon_credits");
    const { error: updateErr } = await supabase
      .from("stories")
      .update({ cross_tracker_flags: newFlags })
      .eq("id", story.id);

    if (updateErr) {
      console.error(`  [ERR] ${story.id}: ${updateErr.message}`);
      continue;
    }

    console.log(`  [REMOVED] ${story.title.slice(0, 90)}`);
    console.log(`    flags: [${flags.join(", ")}] → [${newFlags.join(", ")}]`);
  }

  console.log("\nDone.\n");
}

main().catch(console.error);
