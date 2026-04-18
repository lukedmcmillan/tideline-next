import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_API_KEY = process.env.JINA_API_KEY!;
const DOCS_PER_RUN = 50;
const EMBED_BATCH_SIZE = 20;
const ARTICLE_MAX = 800;
const PARA_MAX = 600;
const OVERLAP = 100;

// ─── Chunking (from scripts/embed-documents.ts) ─────────────────────────────

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

  const HARD_CAP = 1200;
  const capped: string[] = [];
  for (const chunk of raw) {
    if (chunk.length <= HARD_CAP) {
      capped.push(chunk);
    } else {
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let buf = "";
      for (const s of sentences) {
        if ((buf + " " + s).length > HARD_CAP && buf) {
          capped.push(buf.trim());
          buf = s;
        } else {
          buf = buf ? buf + " " + s : s;
        }
      }
      if (buf) capped.push(buf.trim());
    }
  }

  const tocPattern = /Article\s+\d+\./gi;
  return capped.filter((c) => {
    if (c.length < 100) return false;
    if (/^Table of Contents|^Copyright|^ISBN|^For more information/i.test(c.trim())) return false;
    const refs = c.match(tocPattern);
    if (refs && refs.length >= 3) {
      const withoutRefs = c.replace(tocPattern, "").replace(/\s+/g, " ").trim();
      if (withoutRefs.length < 100) return false;
    }
    return true;
  });
}

// ─── Batch embedding ────────────────────────────────────────────────────────

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
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina API ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ─── Process single document ────────────────────────────────────────────────

interface DocResult {
  document_id: string;
  title: string;
  chunks_created: number;
  error: string | null;
}

async function processDocument(doc: {
  id: string;
  title: string;
  file_url: string;
}): Promise<DocResult> {
  try {
    // Download from Supabase storage
    const { data: blob, error: dlError } = await supabase.storage
      .from("tideline-documents")
      .download(doc.file_url);

    if (dlError || !blob) {
      return { document_id: doc.id, title: doc.title, chunks_created: 0, error: `Download failed: ${dlError?.message || "no data"}` };
    }

    // Extract text
    let fullText: string;
    try {
      const buffer = await blob.arrayBuffer();
      const result = await extractText(new Uint8Array(buffer));
      const pages = result.text;
      fullText = Array.isArray(pages) ? pages.join("\n") : String(pages);
    } catch (err) {
      return { document_id: doc.id, title: doc.title, chunks_created: 0, error: `PDF parse: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (fullText.length < 100) {
      return { document_id: doc.id, title: doc.title, chunks_created: 0, error: "Insufficient text (scanned PDF?)" };
    }

    // Chunk
    const chunks = chunkText(fullText);
    if (chunks.length === 0) {
      return { document_id: doc.id, title: doc.title, chunks_created: 0, error: "No chunks after filtering" };
    }

    // Embed in batches and insert
    let inserted = 0;
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

      let embeddings: number[][];
      try {
        embeddings = await embedBatch(batch);
      } catch (err) {
        // Retry once
        try {
          await new Promise((r) => setTimeout(r, 2000));
          embeddings = await embedBatch(batch);
        } catch (retryErr) {
          continue;
        }
      }

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
        continue;
      }

      inserted += batch.length;
    }

    return { document_id: doc.id, title: doc.title, chunks_created: inserted, error: null };
  } catch (err) {
    return { document_id: doc.id, title: doc.title, chunks_created: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Find approved documents that have no chunks yet
  const { data: allDocs, error: fetchError } = await supabase
    .from("documents")
    .select("id, title, file_url")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(DOCS_PER_RUN + 50);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!allDocs || allDocs.length === 0) {
    await logRun(0, 0, 0, null);
    return NextResponse.json({ documents_processed: 0, chunks_created: 0 });
  }

  // Filter to docs without existing chunks
  const docIds = allDocs.map((d) => d.id);
  const { data: existingChunks } = await supabase
    .from("document_chunks")
    .select("document_id")
    .in("document_id", docIds);

  const hasChunks = new Set((existingChunks || []).map((e) => e.document_id));
  const toProcess = allDocs.filter((d) => !hasChunks.has(d.id)).slice(0, DOCS_PER_RUN);

  if (toProcess.length === 0) {
    await logRun(0, 0, 0, null);
    return NextResponse.json({ documents_processed: 0, chunks_created: 0, message: "All documents already embedded" });
  }

  // Process in parallel batches of 5
  const PARALLEL = 5;
  const results: DocResult[] = [];

  for (let i = 0; i < toProcess.length; i += PARALLEL) {
    const batch = toProcess.slice(i, i + PARALLEL);
    const batchResults = await Promise.all(batch.map(processDocument));
    results.push(...batchResults);
  }

  const succeeded = results.filter((r) => r.chunks_created > 0);
  const failed = results.filter((r) => r.error && r.chunks_created === 0);
  const totalChunks = results.reduce((sum, r) => sum + r.chunks_created, 0);

  await logRun(
    results.length,
    totalChunks,
    failed.length,
    failed.length > 0 ? failed.map((f) => `${f.title}: ${f.error}`).join("; ") : null
  );

  return NextResponse.json({
    documents_processed: results.length,
    documents_succeeded: succeeded.length,
    documents_failed: failed.length,
    chunks_created: totalChunks,
    duration_ms: Date.now() - startTime,
    failed: failed.length > 0 ? failed.map((f) => ({ title: f.title, error: f.error })) : undefined,
  });
}

async function logRun(docsProcessed: number, chunksCreated: number, failedCount: number, errorText: string | null) {
  await supabase.from("cron_log").insert({
    agent_name: "embed-documents",
    stories_processed: docsProcessed,
    events_created: chunksCreated,
    errors: errorText,
  });
}
