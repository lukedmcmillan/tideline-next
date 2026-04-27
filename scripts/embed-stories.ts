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

async function fetchAllEligibleStories() {
  const PAGE = 1000;
  let offset = 0;
  const results: { id: string; title: string; source_name: string | null; published_at: string | null; link: string | null; description: string | null; full_summary: string | null }[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, source_name, published_at, link, description, full_summary")
      .or("description.not.is.null,full_summary.not.is.null")
      .order("published_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return results;
}

async function main() {
  const isBackfill = process.argv.includes("--backfill");
  console.log(`=== Tideline Story Embeddings${isBackfill ? " (--backfill: all stories)" : ""} ===\n`);

  if (!JINA_API_KEY) {
    console.error("JINA_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  // Fetch eligible stories
  let allStories: Awaited<ReturnType<typeof fetchAllEligibleStories>>;
  if (isBackfill) {
    allStories = await fetchAllEligibleStories();
  } else {
    const { data, error } = await supabase
      .from("stories")
      .select("id, title, source_name, published_at, link, description, full_summary")
      .or("description.not.is.null,full_summary.not.is.null")
      .order("published_at", { ascending: false })
      .limit(STORIES_PER_FETCH);
    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    allStories = data ?? [];
  }

  if (allStories.length === 0) {
    console.log("No eligible stories found.");
    return;
  }

  console.log(`Fetched ${allStories.length} eligible stories.\n`);

  // Resume: load ALL embedded story_ids (paginated to avoid URL-length limits)
  const alreadyEmbedded = new Set<string>();
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data: chunk } = await supabase
      .from("story_chunks")
      .select("story_id")
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (!chunk || chunk.length === 0) break;
    chunk.forEach((c) => alreadyEmbedded.add(c.story_id));
    if (chunk.length < PAGE) break;
    page++;
  }

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
      const text = (s.description && s.description.length > 500)
        ? `${s.title}. ${s.description}`
        : `${s.title}. ${s.full_summary ?? ""}`;
      return text.trim();
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
