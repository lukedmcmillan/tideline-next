import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_API_KEY = process.env.JINA_API_KEY!;
const BATCH_SIZE = 20;

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
  const isBackfill = process.argv.includes("--backfill");
  console.log(`=== Tideline Entity Embeddings${isBackfill ? " (--backfill)" : ""} ===\n`);

  if (!JINA_API_KEY) {
    console.error("JINA_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  // Fetch entities with no embedding (safe to re-run — WHERE embedding IS NULL)
  const PAGE = 1000;
  let offset = 0;
  const toProcess: { id: string; name: string; description: string | null }[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("entities")
      .select("id, name, description")
      .is("embedding", null)
      .range(offset, offset + PAGE - 1);

    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    toProcess.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  if (toProcess.length === 0) {
    console.log("All entities already have embeddings.");
    return;
  }

  console.log(`${toProcess.length} entities need embeddings.\n`);

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    // Build embed text: name + description (if present)
    const embedTexts = batch.map((e) =>
      `${e.name}. ${e.description ?? ""}`.trim()
    );

    let embeddings: number[][];
    try {
      embeddings = await embedBatch(embedTexts);
    } catch (err) {
      console.error(`  Batch ${i}–${i + batch.length - 1} embed error: ${err}`);
      failed += batch.length;
      failedIds.push(...batch.map((e) => e.id));
      await sleep(2000);
      continue;
    }

    // Update each entity's embedding directly
    for (let j = 0; j < batch.length; j++) {
      const { error: updateError } = await supabase
        .from("entities")
        .update({ embedding: JSON.stringify(embeddings[j]) })
        .eq("id", batch[j].id);

      if (updateError) {
        console.error(`  Update error for ${batch[j].name}: ${updateError.message}`);
        failed++;
        failedIds.push(batch[j].id);
      } else {
        processed++;
      }
    }

    // Progress report every batch
    const elapsedSec = (Date.now() - startTime) / 1000;
    const rate = processed / elapsedSec;
    const remaining = toProcess.length - processed - failed;
    const estRemainSec = rate > 0 ? remaining / rate : 0;
    const estRemainMin = (estRemainSec / 60).toFixed(1);
    console.log(
      `[${processed}/${toProcess.length}] processed  failed=${failed}  elapsed=${elapsedSec.toFixed(0)}s  est_remaining=${estRemainMin}m`
    );

    // Rate limit: 500ms between batches
    if (i + BATCH_SIZE < toProcess.length) await sleep(500);
  }

  console.log(`\n=== Complete. ${processed} entities embedded, ${failed} failed. ===`);
  if (failedIds.length > 0) {
    console.log("Failed entity IDs:", failedIds.join(", "));
  }
}

main().catch(console.error);
