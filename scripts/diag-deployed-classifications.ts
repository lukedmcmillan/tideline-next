// Finds what the deployed send-brief actually classified the key stories as.
// The deployed CATEGORY_PROMPT_VERSION differs from local (send-brief/route.ts has unstaged changes).
// We know the two active versions are: cd801992653803c2 and 6807a3b824b33540

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Key story IDs from today's brief
const PNG_MPA_ID  = "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e";
const VAQUITA_ID  = "7f3fa186-ec56-40e7-bf50-3eaa7d2bcb0e";
const UK_FISH_ID  = "c345fd58-e43b-4138-8ede-30e6dd5f91b1";

async function main() {
  // Get ALL classifications for the three key stories across ALL versions
  const { data: rows } = await supabase
    .from("delta_classifications")
    .select("story_id, prompt_version, category, governance_significance, classified_at")
    .in("story_id", [PNG_MPA_ID, VAQUITA_ID, UK_FISH_ID])
    .order("classified_at", { ascending: false });

  console.log("=== KEY STORY CLASSIFICATIONS (all versions) ===");
  if (!rows || rows.length === 0) {
    console.log("NONE — none of the three key stories have been classified");
  } else {
    for (const r of rows) {
      const name = r.story_id === PNG_MPA_ID ? "PNG_MPA" : r.story_id === VAQUITA_ID ? "VAQUITA" : "UK_FISH";
      console.log(`  ${name} | version=${r.prompt_version} | category=${r.category} | gov_sig=${r.governance_significance} | classified_at=${r.classified_at}`);
    }
  }

  // Get today's candidate pool
  const { data: buffer } = await supabase
    .from("brief_buffer")
    .select("stories")
    .eq("date", "2026-05-20")
    .single();

  if (!buffer?.stories) { console.log("No buffer"); return; }
  const pool = buffer.stories as any;
  const candidates = pool.candidate_stories as Array<{ id: string; title: string; significance_score: number; topic: string }>;
  const ids = candidates.map(s => s.id);

  // Get ALL classifications for ALL pool stories across ALL versions
  const { data: allRows } = await supabase
    .from("delta_classifications")
    .select("story_id, prompt_version, category, governance_significance, classified_at")
    .in("story_id", ids)
    .order("classified_at", { ascending: false });

  // Find which prompt_version had the most recent classifications for pool stories
  const versionLastSeen = new Map<string, string>();
  const versionStoryCount = new Map<string, Set<string>>();
  for (const r of allRows ?? []) {
    if (!versionLastSeen.has(r.prompt_version) || r.classified_at > versionLastSeen.get(r.prompt_version)!) {
      versionLastSeen.set(r.prompt_version, r.classified_at);
    }
    if (!versionStoryCount.has(r.prompt_version)) versionStoryCount.set(r.prompt_version, new Set());
    versionStoryCount.get(r.prompt_version)!.add(r.story_id);
  }

  console.log("\n=== POOL COVERAGE BY PROMPT VERSION ===");
  for (const [v, stories] of versionStoryCount) {
    console.log(`  version=${v}: ${stories.size}/${ids.length} pool stories classified, latest=${versionLastSeen.get(v)}`);
  }

  // For the most recently used version, show the Gate 2 ranking
  // Find version with most recent classification of pool stories
  const sorted = [...versionLastSeen.entries()].sort((a, b) => b[1].localeCompare(a[1]));
  const deployedVersion = sorted[0]?.[0];
  console.log(`\nMost recently used deployed version: ${deployedVersion}`);

  if (deployedVersion) {
    const { data: deployedRows } = await supabase
      .from("delta_classifications")
      .select("story_id, category, governance_significance")
      .in("story_id", ids)
      .eq("prompt_version", deployedVersion);

    const deployedMap = new Map((deployedRows ?? []).map(r => [r.story_id, r]));

    const SIG_FLOOR = 35;
    const govEligible = candidates
      .filter(s => {
        const cls = deployedMap.get(s.id);
        return cls?.category === "GOVERNANCE_CHANGE" && (s.significance_score ?? 0) >= SIG_FLOOR;
      })
      .map(s => {
        const cls = deployedMap.get(s.id);
        return { id: s.id, title: s.title?.slice(0, 100), sig: s.significance_score, category: cls?.category, gov_sig: cls?.governance_significance, topic: s.topic };
      })
      .sort((a, b) => (b.sig ?? 0) - (a.sig ?? 0));

    console.log(`\n=== GATE 2 RANKING (deployed version ${deployedVersion}) ===`);
    if (govEligible.length === 0) {
      console.log("EMPTY — fallback path would fire");
    } else {
      for (let i = 0; i < govEligible.length; i++) {
        const s = govEligible[i];
        console.log(`  #${i+1}: sig=${s.sig} | gov_sig=${s.gov_sig} | category=${s.category} | topic=${s.topic} | "${s.title}"`);
      }
    }

    // All classifications for pool stories under deployed version
    console.log(`\n=== ALL POOL CLASSIFICATIONS (deployed version ${deployedVersion}) ===`);
    const allClassified = candidates.map(s => {
      const cls = deployedMap.get(s.id);
      return { title: s.title?.slice(0, 80), sig: s.significance_score, category: cls?.category ?? "UNCLASSIFIED", gov_sig: cls?.governance_significance ?? null };
    }).sort((a, b) => (b.sig ?? 0) - (a.sig ?? 0));
    for (const s of allClassified) {
      const mark = s.category === "GOVERNANCE_CHANGE" && (s.sig ?? 0) >= SIG_FLOOR ? " ***" : "";
      console.log(`  sig=${s.sig} | ${s.category} | gov_sig=${s.gov_sig}${mark} | "${s.title}"`);
    }
  }
}

main().catch(console.error);
