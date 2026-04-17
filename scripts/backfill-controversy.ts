/* eslint-disable @typescript-eslint/no-require-imports */
// Run: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-controversy.ts

let _supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>;
function getSupabase() {
  if (!_supabase) {
    const { createClient } = require("@supabase/supabase-js");
    _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _anthropic: any;
function getAnthropic() {
  if (!_anthropic) {
    const Anthropic = require("@anthropic-ai/sdk").default;
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

const SYSTEM_PROMPT = `You score the controversy level of ocean governance stories. Return JSON only. No markdown.

Assess two dimensions:

controversy_domain_score: 0-10. Is the underlying governance topic actively disputed among authoritative actors?
High (8-10): ISA exploitation regulations, deep sea mining moratorium, IUU enforcement methodology, MSC certification credibility, BBNJ implementation disputes
Medium (4-7): IMO emissions targets, 30x30 designation progress, WTO fisheries subsidies
Low (0-3): Settled science, routine regulatory updates, administrative announcements

controversy_framing_score: 0-10. Does this specific story present competing positions or signal active dispute?
High (8-10): Story explicitly references disagreement, legal challenge, conflicting data, or competing conclusions
Medium (4-7): Story presents one position but notes opposition exists
Low (0-3): Single settled view, no indication of dispute

controversy_reason: one sentence explaining the score. Plain English, no jargon, no em dashes. Address the reader as "you" if relevant.

Return: {"controversy_domain_score": number, "controversy_framing_score": number, "controversy_reason": "string"}`;

function computeLabel(composite: number): string {
  if (composite >= 8.0) return "DISPUTED";
  if (composite >= 6.0) return "CONTESTED";
  if (composite >= 3.0) return "DEVELOPING";
  return "SETTLED";
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function scoreStory(title: string, sourceName: string, shortSummary: string): Promise<{
  score: number; label: string; reason: string;
}> {
  const msg = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Title: "${title}"\nSource: ${sourceName}\n\nSummary: ${shortSummary}` }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const domain = Math.max(0, Math.min(10, Math.round((parsed.controversy_domain_score || 0) * 10) / 10));
  const framing = Math.max(0, Math.min(10, Math.round((parsed.controversy_framing_score || 0) * 10) / 10));
  const composite = Math.round((domain * 0.60 + framing * 0.40) * 10) / 10;

  return {
    score: composite,
    label: computeLabel(composite),
    reason: String(parsed.controversy_reason || "").slice(0, 500),
  };
}

async function main() {
  console.log("=== Backfill controversy scores ===\n");

  const { data: stories, error } = await getSupabase()
    .from("stories")
    .select("id, title, source_name, short_summary")
    .eq("status", "live")
    .is("controversy_score", null)
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) { console.error("Fetch error:", error.message); process.exit(1); }
  if (!stories || stories.length === 0) { console.log("No stories to backfill."); return; }

  console.log(`Found ${stories.length} stories to score.\n`);

  let processed = 0;
  let errors = 0;
  const dist: Record<string, number> = { DISPUTED: 0, CONTESTED: 0, DEVELOPING: 0, SETTLED: 0 };
  const BATCH = 10;

  for (let i = 0; i < stories.length; i += BATCH) {
    const batch = stories.slice(i, i + BATCH);

    for (const s of batch) {
      try {
        const { score, label, reason } = await scoreStory(s.title, s.source_name, s.short_summary);

        await getSupabase()
          .from("stories")
          .update({ controversy_score: score, controversy_label: label, controversy_reason: reason })
          .eq("id", s.id);

        dist[label] = (dist[label] || 0) + 1;
        processed++;
      } catch (err) {
        errors++;
        console.error(`  Error on "${s.title.slice(0, 50)}":`, err instanceof Error ? err.message : err);
      }
    }

    if ((i + BATCH) % 50 < BATCH) {
      console.log(`Processed ${Math.min(i + BATCH, stories.length)}/${stories.length}...`);
    }

    if (i + BATCH < stories.length) await sleep(1000);
  }

  console.log(`\n=== Done ===`);
  console.log(`Total processed: ${processed}`);
  console.log(`Total errors: ${errors}`);
  console.log(`Distribution: DISPUTED=${dist.DISPUTED} CONTESTED=${dist.CONTESTED} DEVELOPING=${dist.DEVELOPING} SETTLED=${dist.SETTLED}`);
}

main().catch(console.error);
