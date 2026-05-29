import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";
import * as fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_API_KEY = process.env.JINA_API_KEY!;
const BATCH_SIZE = 20; // Jina batch limit
const ARTICLE_MAX = 800;
const PARA_MAX = 600;
const OVERLAP = 100;

// CLI flags
const args = process.argv.slice(2);
const reembed = args.includes("--reembed");
const sampleArg = args.find((a) => a.startsWith("--sample="));
const sampleSize = sampleArg ? parseInt(sampleArg.split("=")[1], 10) : null;
const logArg = args.find((a) => a.startsWith("--log="));
const logFile = logArg
  ? logArg.split("=")[1]
  : `embed-documents-${new Date().toISOString().slice(0, 10)}.log`;
const enableLog = !!logArg;

// Logger: write to console + optional file
let logStream: fs.WriteStream | null = null;
if (enableLog) {
  logStream = fs.createWriteStream(logFile, { flags: "a" });
}
function log(...parts: unknown[]) {
  const line = parts.map(String).join(" ");
  console.log(line);
  logStream?.write(line + "\n");
}

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

  // Hard cap: split any chunk exceeding 1200 chars by sentence boundary
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
    const refs = c.match(tocPattern);
    if (refs && refs.length >= 3) {
      const withoutRefs = c.replace(tocPattern, "").replace(/\s+/g, " ").trim();
      if (withoutRefs.length < 100) return false;
    }
    return true;
  });
}

// Strip null bytes and other control characters that Postgres rejects.
function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, "")                         // strip literal null bytes
    .replace(/\\u0000/g, "")                        // strip escaped null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""); // strip other non-printable control chars
}

// Batch embed via Jina API with exponential backoff on 429/5xx.
// Retries up to MAX_RETRIES times. On persistent 429 after all retries,
// throws so the caller can log to embedding_errors and move on.
// Never hangs forever: each attempt is capped at 30s by AbortSignal.timeout.
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 2000; // 2s, 4s, 8s, 16s, 32s

async function embedBatch(texts: string[]): Promise<number[][]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      log(`    [retry ${attempt}/${MAX_RETRIES}] waiting ${delayMs / 1000}s before retry…`);
      await sleep(delayMs);
    }

    let res: Response;
    try {
      res = await fetch("https://api.jina.ai/v1/embeddings", {
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
    } catch (fetchErr) {
      // Network error or timeout — retry
      lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      log(`    [attempt ${attempt + 1}] network error: ${lastError.message}`);
      continue;
    }

    if (res.ok) {
      const data = await res.json();
      return data.data.map((d: { embedding: number[] }) => d.embedding);
    }

    const body = await res.text();
    lastError = new Error(`Jina API ${res.status}: ${body}`);

    if (res.status === 429 || res.status >= 500) {
      // Rate-limit or server error — retry with backoff
      log(`    [attempt ${attempt + 1}] ${res.status} — will retry`);
      continue;
    }

    // 4xx other than 429 (bad request, auth failure) — no point retrying
    throw lastError;
  }

  // Exhausted all retries
  throw new Error(`Jina API failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
}

async function logError(
  documentId: string,
  errorType: string,
  errorMessage: string
) {
  await supabase.from("embedding_errors").insert({
    document_id: documentId,
    error_type: errorType,
    error_message: errorMessage,
  });
}

async function processDocument(
  doc: { id: string; title: string; file_url: string },
  stats: { totalChars: number; totalChunks: number }
): Promise<number> {
  log(`\n  Processing: ${doc.title}`);

  // Clear any partial chunks from a previous interrupted run.
  // embedded_at IS NULL means the doc was never fully completed — stale
  // chunks from a mid-batch kill must be removed before re-inserting so
  // we don't accumulate duplicates. This DELETE is a no-op for fresh docs.
  const { error: clearErr } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", doc.id);
  if (clearErr) {
    log(`    WARN: Could not clear partial chunks for ${doc.id}: ${clearErr.message}`);
  }

  // Download PDF from Supabase storage
  const { data: blob, error: dlError } = await supabase.storage
    .from("tideline-documents")
    .download(doc.file_url);

  if (dlError || !blob) {
    const msg = dlError?.message || "no data";
    log(`    SKIP: Download failed — ${msg}`);
    await logError(doc.id, "download_failed", msg);
    return 0;
  }

  // Extract text
  let fullText: string;
  try {
    const buffer = await blob.arrayBuffer();
    const result = await extractText(new Uint8Array(buffer));
    const pages = result.text;
    fullText = sanitizeText(Array.isArray(pages) ? pages.join("\n") : String(pages));
  } catch (err) {
    const msg = String(err);
    log(`    SKIP: PDF parse error — ${msg}`);
    await logError(doc.id, "extract_failed", msg);
    return 0;
  }

  if (fullText.length < 100) {
    log("    SKIP: Insufficient text (scanned PDF?)");
    await logError(doc.id, "text_too_short", `${fullText.length} chars`);
    return 0;
  }

  stats.totalChars += fullText.length;

  // Chunk
  const chunks = chunkText(fullText);
  log(`    ${chunks.length} chunks (${fullText.length} chars)`);
  stats.totalChunks += chunks.length;

  if (chunks.length === 0) return 0;

  // Embed in batches
  let inserted = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    let embeddings: number[][];
    try {
      embeddings = await embedBatch(batch);
    } catch (err) {
      const msg = String(err);
      log(`    EMBED ERROR (batch ${i}): ${msg}`);
      await logError(doc.id, "embed_failed", msg);
      continue;
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
      log(`    INSERT ERROR (batch ${i}): ${insertError.message}`);
      await logError(doc.id, "insert_failed", insertError.message);
      continue;
    }

    inserted += batch.length;

    // Rate limit: 500ms between Jina batches
    if (i + BATCH_SIZE < chunks.length) await sleep(500);
  }

  if (inserted === chunks.length) {
    // All chunks inserted — mark fully embedded
    await supabase
      .from("documents")
      .update({ embedded_at: new Date().toISOString() })
      .eq("id", doc.id);
    log(`    OK: ${inserted} of ${chunks.length} chunks embedded`);
  } else if (inserted > 0) {
    // Partial insert — don't set embedded_at so the doc retries on next run
    await logError(doc.id, "insert_failed", `partial: ${inserted} of ${chunks.length} chunks inserted`);
    log(`    PARTIAL: ${inserted} of ${chunks.length} chunks inserted — leaving embedded_at NULL for retry`);
  } else {
    // Zero chunks inserted — all batches failed; logError already called per-batch above
    log(`    FAILED: 0 of ${chunks.length} chunks inserted`);
  }
  return inserted;
}

async function main() {
  log(
    `=== Tideline Document Embeddings Pipeline${reembed ? " (RE-EMBED)" : ""}${sampleSize ? ` (--sample=${sampleSize})` : ""} ===\n`
  );

  if (!JINA_API_KEY) {
    log("JINA_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  // Fetch ALL approved documents, ordered by id (stable checkpoint order).
  // Uses explicit pagination (1000/page) to bypass PostgREST max_rows cap.
  type DocRow = { id: string; title: string; file_url: string; embedded_at: string | null };
  const allDocs: DocRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data: page, error: fetchError } = await supabase
      .from("documents")
      .select("id, title, file_url, embedded_at")
      .eq("status", "approved")
      .order("id", { ascending: true })
      .limit(PAGE)
      .range(offset, offset + PAGE - 1);

    if (fetchError) {
      log("Fetch error:", fetchError.message);
      return;
    }
    if (!page || page.length === 0) break;
    allDocs.push(...page);
    log(`  [fetch] page offset=${offset} got ${page.length} rows (running total: ${allDocs.length})`);
    if (page.length < PAGE) break;
    offset += PAGE;
  }

  if (allDocs.length === 0) {
    log("No approved documents found.");
    return;
  }

  log(`Total approved documents: ${allDocs.length}`);

  let unembedded: typeof allDocs;

  if (reembed) {
    log(`--reembed: Deleting existing chunks for all documents...`);
    for (const doc of allDocs) {
      await supabase.from("document_chunks").delete().eq("document_id", doc.id);
      await supabase
        .from("documents")
        .update({ embedded_at: null })
        .eq("id", doc.id);
    }
    log("Existing chunks deleted.\n");
    unembedded = allDocs;
  } else {
    // Skip any document where embedded_at IS NOT NULL (resumability)
    unembedded = allDocs.filter((d) => !d.embedded_at);
  }

  if (unembedded.length === 0) {
    log(`All ${allDocs.length} documents already embedded (embedded_at IS NOT NULL).`);
    return;
  }

  // --sample=N: take N random docs from unembedded pool
  let toProcess = unembedded;
  if (sampleSize && sampleSize < unembedded.length) {
    const shuffled = [...unembedded].sort(() => Math.random() - 0.5);
    toProcess = shuffled.slice(0, sampleSize);
    log(
      `--sample=${sampleSize}: randomly selected ${sampleSize} of ${unembedded.length} unembedded docs\n`
    );
  } else {
    log(
      `Found ${unembedded.length} documents without embedded_at (of ${allDocs.length} total)\n`
    );
  }

  // Cost constants: Jina jina-embeddings-v2-base-en = $0.02 / 1M tokens
  // Rough approximation: 1 char ≈ 0.25 tokens
  const COST_PER_M_TOKENS = 0.02;
  const CHARS_PER_TOKEN = 4;

  const startTime = Date.now();
  let totalChunks = 0;
  let totalDocs = 0;
  let totalChars = 0;
  const stats = { totalChars: 0, totalChunks: 0 };

  for (let idx = 0; idx < toProcess.length; idx++) {
    const doc = toProcess[idx];
    const count = await processDocument(doc, stats);
    totalChunks += count;
    totalDocs++;
    totalChars = stats.totalChars;

    // Progress every 100 docs or at end
    if (totalDocs % 100 === 0 || totalDocs === toProcess.length) {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = totalDocs / elapsedSec; // docs/sec
      const remaining = toProcess.length - totalDocs;
      const estRemainSec = rate > 0 ? remaining / rate : 0;
      const estRemainMin = (estRemainSec / 60).toFixed(1);
      const tokensEst = Math.round(totalChars / CHARS_PER_TOKEN);
      const costEst = ((tokensEst / 1_000_000) * COST_PER_M_TOKENS).toFixed(4);
      log(
        `\n[PROGRESS] ${totalDocs}/${toProcess.length} docs | ${totalChunks} chunks | ~${tokensEst.toLocaleString()} tokens | ~$${costEst} | elapsed=${elapsedSec.toFixed(0)}s | est_remaining=${estRemainMin}m`
      );
    }

    // Rate limit between documents
    await sleep(1000);
  }

  // Final summary
  const elapsedSec = (Date.now() - startTime) / 1000;
  const tokensEst = Math.round(totalChars / CHARS_PER_TOKEN);
  const costEst = ((tokensEst / 1_000_000) * COST_PER_M_TOKENS).toFixed(4);

  log(`\n=== Complete ===`);
  log(`  Documents processed: ${totalDocs} of ${toProcess.length}`);
  log(`  Total chunks embedded: ${totalChunks}`);
  log(`  Avg chunks/doc: ${totalDocs > 0 ? (totalChunks / totalDocs).toFixed(1) : "—"}`);
  log(`  Total chars extracted: ${totalChars.toLocaleString()}`);
  log(`  Estimated tokens: ~${tokensEst.toLocaleString()}`);
  log(`  Estimated cost: ~$${costEst}`);
  log(`  Elapsed: ${(elapsedSec / 60).toFixed(1)}m`);

  if (sampleSize && unembedded.length > sampleSize) {
    const scale = unembedded.length / sampleSize;
    const projChunks = Math.round(totalChunks * scale);
    const projTokens = Math.round(tokensEst * scale);
    const projCost = ((projTokens / 1_000_000) * COST_PER_M_TOKENS).toFixed(4);
    const projTime = ((elapsedSec * scale) / 3600).toFixed(1);
    log(`\n  --- EXTRAPOLATED TO FULL ${unembedded.length} DOCS ---`);
    log(`  Projected chunks: ~${projChunks.toLocaleString()}`);
    log(`  Projected tokens: ~${projTokens.toLocaleString()}`);
    log(`  Projected cost: ~$${projCost}`);
    log(`  Projected wall time: ~${projTime}h`);
  }

  logStream?.end();
}

main().catch(console.error);
