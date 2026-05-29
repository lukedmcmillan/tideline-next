/**
 * Finding A + B Diagnostic
 * Finding A: Inspect each GOVERNANCE_CHANGE-classified story (non-PNG) for true/false positive
 * Finding B: Classification coverage stall — why have no new classifications been added since May 22?
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORY_PROMPT_VERSION = "f6491a2171c78bdf";

async function main() {
  console.log("=".repeat(80));
  console.log("FINDING A — GOVERNANCE_CHANGE FALSE-POSITIVE AUDIT");
  console.log("=".repeat(80));

  // Get all GOVERNANCE_CHANGE rows for current prompt_version
  const { data: gcRows, error: gcErr } = await supabase
    .from("delta_classifications")
    .select("story_id, category, governance_significance, classified_at")
    .eq("prompt_version", CATEGORY_PROMPT_VERSION)
    .eq("category", "GOVERNANCE_CHANGE")
    .order("classified_at", { ascending: false });

  if (gcErr) { console.error("Error fetching GC rows:", gcErr.message); process.exit(1); }

  console.log(`\nTotal GOVERNANCE_CHANGE classified stories: ${gcRows?.length ?? 0}`);
  console.log();

  if (!gcRows || gcRows.length === 0) {
    console.log("No GOVERNANCE_CHANGE rows found.");
  } else {
    // Fetch story details for each
    const storyIds = gcRows.map(r => r.story_id);
    const { data: stories, error: sErr } = await supabase
      .from("stories")
      .select("id, title, short_summary, description, source_name, source_type, topic, significance_score, published_at, link")
      .in("id", storyIds);

    if (sErr) { console.error("Error fetching stories:", sErr.message); process.exit(1); }

    const storyMap = new Map((stories ?? []).map(s => [s.id, s]));

    for (let i = 0; i < gcRows.length; i++) {
      const row = gcRows[i];
      const story = storyMap.get(row.story_id);
      console.log(`\n[${i + 1}] Story ID: ${row.story_id}`);
      console.log(`    Classified at: ${row.classified_at}`);
      console.log(`    gov_significance (advisory): ${row.governance_significance}`);
      if (!story) {
        console.log(`    *** STORY ROW NOT FOUND (deleted?) ***`);
        continue;
      }
      console.log(`    Title:     ${story.title}`);
      console.log(`    Source:    ${story.source_name} (${story.source_type})`);
      console.log(`    Topic:     ${story.topic}`);
      console.log(`    Sig score: ${story.significance_score}`);
      console.log(`    Published: ${story.published_at}`);
      console.log(`    Summary:   ${(story.short_summary ?? story.description ?? "").slice(0, 250)}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("FINDING B — CLASSIFICATION COVERAGE STALL");
  console.log("=".repeat(80));

  // B1: Where is categoryCandidates called?
  console.log("\nB1. categoryCandidates() trigger:");
  console.log("    Called exclusively from send-brief/route.ts (line ~328)");
  console.log("    Input: pool.candidate_stories from brief_buffer.stories");
  console.log("    brief_buffer is populated by generate-brief cron (runs first)");
  console.log("    Only stories in that day's brief_buffer are ever classified");
  console.log("    Stories published after generate-brief ran are NOT in the pool");

  // B2: Unclassified stories since May 22
  console.log("\nB2. Stories published since 2026-05-22 with no classification row:");
  const { data: allRecent, error: recentErr } = await supabase
    .from("stories")
    .select("id, title, topic, significance_score, published_at, short_summary")
    .gte("published_at", "2026-05-22T00:00:00Z")
    .eq("status", "live")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(200);

  if (recentErr) { console.error("Error:", recentErr.message); }
  else {
    const recentIds = (allRecent ?? []).map(s => s.id);
    const { data: classified } = await supabase
      .from("delta_classifications")
      .select("story_id")
      .in("story_id", recentIds)
      .eq("prompt_version", CATEGORY_PROMPT_VERSION);

    const classifiedSet = new Set((classified ?? []).map(r => r.story_id));
    const unclassified = (allRecent ?? []).filter(s => !classifiedSet.has(s.id));

    console.log(`    Total live+summarised stories published since May 22: ${allRecent?.length ?? 0}`);
    console.log(`    Classified under v:${CATEGORY_PROMPT_VERSION}: ${classifiedSet.size}`);
    console.log(`    Unclassified: ${unclassified.length}`);

    // Show unclassified breakdown by day
    const byDay: Record<string, number> = {};
    for (const s of unclassified) {
      const day = s.published_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    console.log("    Unclassified breakdown by publish date:");
    for (const [day, count] of Object.entries(byDay).sort()) {
      console.log(`      ${day}: ${count} stories`);
    }

    // Show the top 5 unclassified stories by significance
    const topUnclassified = unclassified
      .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))
      .slice(0, 5);
    console.log("    Top 5 unclassified stories by significance:");
    for (const s of topUnclassified) {
      console.log(`      sig=${s.significance_score} [${s.topic}] (${s.published_at.slice(0,10)}) ${s.title.slice(0, 90)}`);
    }
  }

  // B3: Today's brief_buffer — how many stories, how many classified
  console.log("\nB3. Today's brief_buffer candidate pool:");
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  for (const dateStr of [today, yesterday]) {
    const { data: buf } = await supabase
      .from("brief_buffer")
      .select("stories, story_count, generated_at")
      .eq("date", dateStr)
      .maybeSingle();

    if (!buf) {
      console.log(`    ${dateStr}: no brief_buffer row`);
      continue;
    }

    const pool = buf.stories as { candidate_stories?: { id: string; published_at: string }[] };
    const candidates = pool?.candidate_stories ?? [];
    console.log(`    ${dateStr}: ${candidates.length} candidate stories (generated_at: ${buf.generated_at ?? "unknown"})`);

    if (candidates.length > 0) {
      const poolIds = candidates.map(s => s.id);
      const { data: poolClassified } = await supabase
        .from("delta_classifications")
        .select("story_id, category")
        .in("story_id", poolIds)
        .eq("prompt_version", CATEGORY_PROMPT_VERSION);

      const poolClassMap = new Map((poolClassified ?? []).map(r => [r.story_id, r.category]));
      const gcInPool = [...poolClassMap.values()].filter(c => c === "GOVERNANCE_CHANGE").length;
      const unclassifiedInPool = candidates.filter(s => !poolClassMap.has(s.id)).length;

      console.log(`      Classified: ${poolClassMap.size} / ${candidates.length}`);
      console.log(`      GOVERNANCE_CHANGE in pool: ${gcInPool}`);
      console.log(`      Unclassified (cache miss → will be classified at send-brief): ${unclassifiedInPool}`);

      // Show category distribution
      const catDist: Record<string, number> = {};
      for (const cat of poolClassMap.values()) {
        catDist[cat as string] = (catDist[cat as string] ?? 0) + 1;
      }
      console.log("      Category distribution for classified stories:");
      for (const [cat, count] of Object.entries(catDist).sort((a, b) => b[1] - a[1])) {
        console.log(`        ${cat}: ${count}`);
      }
    }
  }

  // B4: Was May 20 a one-time classification event?
  console.log("\nB4. Classification event timeline — rows in delta_classifications by date:");
  const { data: allClassRows } = await supabase
    .from("delta_classifications")
    .select("classified_at")
    .eq("prompt_version", CATEGORY_PROMPT_VERSION)
    .order("classified_at", { ascending: true });

  if (allClassRows && allClassRows.length > 0) {
    const byDate: Record<string, number> = {};
    for (const r of allClassRows) {
      const day = (r.classified_at ?? "").slice(0, 10);
      byDate[day] = (byDate[day] ?? 0) + 1;
    }
    console.log("    New classification rows per day (prompt_version f6491a2171c78bdf):");
    for (const [day, count] of Object.entries(byDate).sort()) {
      const bar = "█".repeat(Math.min(count, 50));
      console.log(`      ${day}: ${count.toString().padStart(3)} ${bar}`);
    }
  }

  // B5: Check brief_sends for fallback pattern + timing
  console.log("\nB5. brief_sends since May 20 (fallback pattern):");
  const { data: sends } = await supabase
    .from("brief_sends")
    .select("sent_at, delta_fallback, lead_story_id, tracker_slug, send_type")
    .eq("email", "lukedmcmillan@gmail.com")
    .gte("sent_at", "2026-05-20T00:00:00Z")
    .order("sent_at", { ascending: true });

  if (sends && sends.length > 0) {
    console.log(`    Total sends since May 20: ${sends.length}`);
    for (const s of sends) {
      const fallbackFlag = s.delta_fallback ? "FALLBACK" : "gate2  ";
      console.log(`      ${s.sent_at?.slice(0,10)} ${fallbackFlag} lead=${s.lead_story_id?.slice(0,8) ?? "null"} type=${s.send_type}`);

      if (s.lead_story_id) {
        const { data: leadStory } = await supabase
          .from("stories")
          .select("title, topic, significance_score, short_summary")
          .eq("id", s.lead_story_id)
          .single();
        if (leadStory) {
          const { data: leadCls } = await supabase
            .from("delta_classifications")
            .select("category, governance_significance")
            .eq("story_id", s.lead_story_id)
            .eq("prompt_version", CATEGORY_PROMPT_VERSION)
            .maybeSingle();
          console.log(`             Title: ${leadStory.title.slice(0, 90)}`);
          console.log(`             Topic: ${leadStory.topic}  sig=${leadStory.significance_score}`);
          console.log(`             Category: ${leadCls?.category ?? "unclassified"}  gov_sig=${leadCls?.governance_significance ?? "n/a"}`);
          console.log(`             Summary: ${(leadStory.short_summary ?? "").slice(0, 200)}`);
        }
      }
    }
  } else {
    console.log("    No sends found since May 20 for lukedmcmillan@gmail.com");
  }

  console.log("\n" + "=".repeat(80));
  console.log("DIAGNOSTIC COMPLETE");
  console.log("=".repeat(80));
}

main().catch(console.error);
