import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_API_KEY = process.env.JINA_API_KEY!;
const BATCH_SIZE = 20;
const STORIES_PER_FETCH = 500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v2-base-en",
      input: texts,
      truncate: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

async function main() {
  console.log("=== Tideline Story Embeddings Backfill ===\n");

  if (!JINA_API_KEY) {
    console.error("JINA_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  // Fetch all stories with usable text content
  const { data: allStories, error: fetchError } = await supabase
    .from("stories")
    .select("id, title, source_name, published_at, link, short_summary, description")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(STORIES_PER_FETCH);

  if (fetchError) {
    console.error("Fetch error:", fetchError.message);
    process.exit(1);
  }

  if (!allStories || allStories.length === 0) {
    console.log("No stories with short_summary found.");
    return;
  }

  console.log(`Fetched ${allStories.length} stories with short_summary.\n`);

  // Resume: find which story_ids already have a story_chunks row
  const storyIds = allStories.map((s) => s.id);
  const { data: existingChunks } = await supabase
    .from("story_chunks")
    .select("story_id")
    .in("story_id", storyIds);

  const alreadyEmbedded = new Set((existingChunks || []).map((c) => c.story_id));
  const toProcess = allStories.filter((s) => !alreadyEmbedded.has(s.id));

  if (toProcess.length === 0) {
    console.log(`All ${allStories.length} stories already embedded.`);
    return;
  }

  console.log(`${alreadyEmbedded.size} already embedded. Processing ${toProcess.length} remaining.\n`);

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    // Build embed text for each story: title + short_summary
    const embedTexts = batch.map((s) => {
      const summary = s.short_summary || s.description || "";
      return `${s.title}. ${summary}`.trim();
    });

    let embeddings: number[][];
    try {
      embeddings = await embedBatch(embedTexts);
    } catch (err) {
      console.error(`  Batch ${i}–${i + batch.length - 1} embed error: ${err}`);
      failed += batch.length;
      failedIds.push(...batch.map((s) => s.id));
      await sleep(2000);
      continue;
    }

    const rows = batch.map((s, j) => ({
      story_id: s.id,
      chunk_text: embedTexts[j],
      chunk_index: 0,
      embedding: JSON.stringify(embeddings[j]),
      issuing_body: s.source_name ?? null,
      document_type: "news",
      date_issued: s.published_at ? s.published_at.slice(0, 10) : null,
      source_url: s.link ?? null,
    }));

    const { error: insertError } = await supabase.from("story_chunks").insert(rows);

    if (insertError) {
      console.error(`  Insert error batch ${i}: ${insertError.message}`);
      failed += batch.length;
      failedIds.push(...batch.map((s) => s.id));
      continue;
    }

    processed += batch.length;

    // Progress report every 100 stories
    if (processed % 100 === 0 || processed + failed === toProcess.length) {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = processed / elapsedSec;
      const remaining = toProcess.length - processed - failed;
      const estRemainSec = rate > 0 ? remaining / rate : 0;
      const estRemainMin = (estRemainSec / 60).toFixed(1);
      console.log(
        `[${processed}/${toProcess.length}] processed  failed=${failed}  elapsed=${elapsedSec.toFixed(0)}s  est_remaining=${estRemainMin}m`
      );
    }

    // Rate limit: 500ms between batches
    if (i + BATCH_SIZE < toProcess.length) await sleep(500);
  }

  console.log(`\n=== Complete. ${processed} stories embedded, ${failed} failed. ===`);
  if (failedIds.length > 0) {
    console.log("Failed story IDs:", failedIds.join(", "));
  }
}

main().catch(console.error);
