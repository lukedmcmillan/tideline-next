import { createClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_API_KEY = process.env.JINA_API_KEY!;
const BATCH_SIZE = 20; // Jina batch limit
const ARTICLE_MAX = 800;
const PARA_MAX = 600;
const OVERLAP = 100;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Article-aware chunking: legal documents split on Article boundaries,
// non-legal documents split by paragraph. Both use 100-char overlap.
function chunkText(text: string): string[] {
  const articleParts = text.split(/(?=\nArticle\s+\d+)/i);
  const isLegal = articleParts.length >= 3;

  let raw: string[];

  if (isLegal) {
    raw = [];
    for (const article of articleParts) {
      const trimmed = article.trim();
      if (!trimmed) continue;
      if (trimmed.length <= ARTICLE_MAX) {
        raw.push(trimmed);
      } else {
        const paras = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
        let buf = "";
        for (const p of paras) {
          if ((buf + "\n\n" + p).length > ARTICLE_MAX && buf) {
            raw.push(buf);
            const tail = buf.slice(-OVERLAP);
            buf = tail + "\n\n" + p;
          } else {
            buf = buf ? buf + "\n\n" + p : p;
          }
        }
        if (buf) raw.push(buf);
      }
    }
  } else {
    raw = [];
    const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    let buf = "";
    for (const p of paras) {
      if ((buf + "\n\n" + p).length > PARA_MAX && buf) {
        raw.push(buf);
        const tail = buf.slice(-OVERLAP);
        buf = tail + "\n\n" + p;
      } else {
        buf = buf ? buf + "\n\n" + p : p;
      }
    }
    if (buf) raw.push(buf);
  }

  const tocPattern = /Article\s+\d+\./gi;
  return raw.filter((c) => {
    if (c.length < 100) return false;
    const refs = c.match(tocPattern);
    if (refs && refs.length >= 3) {
      const withoutRefs = c.replace(tocPattern, "").replace(/\s+/g, " ").trim();
      if (withoutRefs.length < 100) return false;
    }
    return true;
  });
}

// Batch embed via Jina API
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
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

async function processDocument(doc: {
  id: string;
  title: string;
  file_url: string;
}) {
  console.log(`\n  Processing: ${doc.title}`);

  // Download PDF from Supabase storage
  const { data: blob, error: dlError } = await supabase.storage
    .from("tideline-documents")
    .download(doc.file_url);

  if (dlError || !blob) {
    console.log(`    SKIP: Download failed — ${dlError?.message || "no data"}`);
    return 0;
  }

  // Extract text
  let fullText: string;
  try {
    const buffer = await blob.arrayBuffer();
    const result = await extractText(new Uint8Array(buffer));
    const pages = result.text;
    fullText = Array.isArray(pages) ? pages.join("\n") : String(pages);
  } catch (err) {
    console.log(`    SKIP: PDF parse error — ${err}`);
    return 0;
  }

  if (fullText.length < 100) {
    console.log("    SKIP: Insufficient text (scanned PDF?)");
    return 0;
  }

  // Chunk
  const chunks = chunkText(fullText);
  console.log(`    ${chunks.length} chunks (${fullText.length} chars)`);

  if (chunks.length === 0) return 0;

  // Embed in batches
  let inserted = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch);

    const rows = batch.map((text, j) => ({
      document_id: doc.id,
      chunk_text: text,
      chunk_index: i + j,
      embedding: JSON.stringify(embeddings[j]),
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(rows);

    if (insertError) {
      console.log(`    INSERT ERROR (batch ${i}): ${insertError.message}`);
      continue;
    }

    inserted += batch.length;

    // Rate limit: 500ms between Jina batches
    if (i + BATCH_SIZE < chunks.length) await sleep(500);
  }

  console.log(`    OK: ${inserted} chunks embedded`);
  return inserted;
}

async function main() {
  console.log("=== Tideline Document Embeddings Pipeline ===\n");

  // Find documents with no chunks yet
  // LEFT JOIN approach: fetch documents, check which have no chunks
  const { data: allDocs, error: fetchError } = await supabase
    .from("documents")
    .select("id, title, file_url")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fetchError) {
    console.error("Fetch error:", fetchError.message);
    return;
  }

  if (!allDocs || allDocs.length === 0) {
    console.log("No approved documents found.");
    return;
  }

  // Filter to those with no existing chunks
  const unembedded: typeof allDocs = [];
  for (const doc of allDocs) {
    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);

    if (count === 0) unembedded.push(doc);
  }

  if (unembedded.length === 0) {
    console.log(`All ${allDocs.length} documents already have chunks.`);
    return;
  }

  console.log(
    `Found ${unembedded.length} documents without chunks (of ${allDocs.length} total)\n`
  );

  let totalChunks = 0;
  for (const doc of unembedded) {
    const count = await processDocument(doc);
    totalChunks += count;
    // Rate limit between documents
    await sleep(1000);
  }

  console.log(
    `\n=== Complete. ${totalChunks} chunks embedded across ${unembedded.length} documents. ===`
  );
}

main().catch(console.error);
