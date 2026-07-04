/**
 * app/lib/research.ts — Research RAG pipeline
 * RESEARCH-RAG-SPEC.md Sections 5, 6, 7
 *
 * Pipeline:
 *   embedQuery → retrieveChunks → abstentionGate → synthesise
 *     → verifyCitations → checkFaithfulness → assembleResponse
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding } from "./embeddings";
import { extractKeywords } from "./query-expansion";

// ─── Constants ───────────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.55;       // retrieval floor — gate handles quality
const MATCH_COUNT = 25;              // K
const ABSTAIN_TOP_THRESHOLD = 0.72; // Mechanism 5: top similarity must exceed this
const ABSTAIN_MIN_THRESHOLD = 0.78; // Mechanism 5: at least MIN_CHUNKS must exceed this
const ABSTAIN_MIN_CHUNKS = 3;       // Mechanism 5

const SONNET_MODEL = "claude-sonnet-4-6";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const HAIKU_RETRY_DELAY_MS = 2000;
const ABSTAIN_NEARBY_COUNT = 5;

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResearchFilters {
  sourceTiers: ("PRIMARY" | "SECONDARY")[];
  dateFrom?: string;   // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD
  scope: "all_library" | "my_uploads";
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  // Parent document metadata
  title: string;
  sourceOrganisation: string | null;
  sourceType: string | null;   // GOVERNMENT|NGO|ACADEMIC|PRESS|null — display only
  sourceTier: string;          // PRIMARY|SECONDARY
  documentType: string | null;
  canonicalUrl: string | null;
  createdAt: string;
}

export interface AbstentionResult {
  abstain: boolean;
  reason?: string;
}

export interface CitedSource {
  documentId: string;
  title: string;
  sourceOrganisation: string | null;
  sourceType: string | null;
  sourceTier: string;
  documentType: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  similarity: number;
  chunkIndex: number;
}

export interface ResearchResponse {
  answer: string | null;
  abstained: boolean;
  abstentionReason?: string;
  citedSources: CitedSource[];
  funnel: {
    inScope: number;
    retrieved: number;
    cited: number;
    latencyMs: number;
  };
  faithfulnessStripped: number;
  partialCitationCount: number;
  nearestDocs?: Array<{
    title: string;
    canonicalUrl: string | null;
    similarity: number;
  }>;
}

// ─── embedQuery ──────────────────────────────────────────────────────────────

/**
 * Embed a query using Jina jina-embeddings-v2-base-en (768-d).
 * Reuses the existing generateEmbedding infrastructure.
 * Throws on Jina 5xx — callers should surface as HTTP 503.
 */
export async function embedQuery(query: string): Promise<number[]> {
  return generateEmbedding(query);
}

// ─── retrieveChunks ──────────────────────────────────────────────────────────

interface RetrieveResult {
  chunks: RetrievedChunk[];
  inScopeCount: number;
}

/**
 * Vector search over document_chunks with source_tier / date / scope pre-filters
 * applied in SQL before the ANN sort (RESEARCH-RAG-SPEC.md Section 5, Step 2).
 *
 * my_uploads scope is not implemented in v1 — throws with status 400.
 */
export async function retrieveChunks(
  embedding: number[],
  filters: ResearchFilters
): Promise<RetrieveResult> {
  if (filters.scope === "my_uploads") {
    const err = Object.assign(
      new Error("my_uploads scope is not implemented in Research v1"),
      { status: 400 }
    );
    throw err;
  }

  // Run count and vector search in parallel.
  const [countResult, rpcResult] = await Promise.all([
    buildInScopeCount(filters),
    supabase.rpc("match_document_chunks_filtered", {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
      filter_source_tiers: filters.sourceTiers.length > 0 ? filters.sourceTiers : [],
      filter_date_from: filters.dateFrom ?? null,
      filter_date_to: filters.dateTo ?? null,
    }),
  ]);

  if (rpcResult.error) {
    throw new Error(`retrieveChunks RPC failed: ${rpcResult.error.message}`);
  }

  const rows = (rpcResult.data ?? []) as Array<{
    id: string;
    document_id: string;
    chunk_text: string;
    chunk_index: number;
    similarity: number;
    title: string;
    source_organisation: string | null;
    source_type: string | null;
    source_tier: string;
    document_type: string | null;
    canonical_url: string | null;
    created_at: string;
  }>;

  const chunks: RetrievedChunk[] = rows.map((r) => ({
    id: r.id,
    documentId: r.document_id,
    chunkText: r.chunk_text,
    chunkIndex: r.chunk_index,
    similarity: r.similarity,
    title: r.title,
    sourceOrganisation: r.source_organisation,
    sourceType: r.source_type,
    sourceTier: r.source_tier,
    documentType: r.document_type,
    canonicalUrl: r.canonical_url,
    createdAt: r.created_at,
  }));

  return { chunks, inScopeCount: countResult };
}

async function buildInScopeCount(filters: ResearchFilters): Promise<number> {
  let q = supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (filters.sourceTiers.length > 0) {
    q = q.in("source_tier", filters.sourceTiers);
  }
  if (filters.dateFrom) {
    q = q.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    q = q.lte("created_at", filters.dateTo);
  }

  const { count } = await q;
  return count ?? 0;
}

// ─── abstentionGate ──────────────────────────────────────────────────────────

/**
 * Mechanism 5 — abstention gate.
 * Abstain if:
 *   (a) no chunks retrieved, OR
 *   (b) keyword-intersection guard: zero chunks contain any query term
 *       (catches wrong-subject retrieval on acronym queries), OR
 *   (c) top similarity < ABSTAIN_TOP_THRESHOLD (0.72), OR
 *   (d) fewer than ABSTAIN_MIN_CHUNKS (3) chunks score >= ABSTAIN_MIN_THRESHOLD (0.78)
 */
export function abstentionGate(chunks: RetrievedChunk[], query: string): AbstentionResult {
  if (chunks.length === 0) {
    return { abstain: true, reason: "No relevant passages found in the library." };
  }

  // (b) Keyword-intersection guard: if no retrieved chunk contains any
  // query keyword, the results are wrong-subject regardless of cosine score.
  const keywords = extractKeywords(query);
  if (keywords.length > 0) {
    const anyChunkMatchesAnyKeyword = chunks.some((c) => {
      const text = c.chunkText.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    if (!anyChunkMatchesAnyKeyword) {
      return {
        abstain: true,
        reason: `Retrieved passages do not appear related to the query terms (${keywords.join(", ")}).`,
      };
    }
  }

  const topSim = chunks[0].similarity;
  if (topSim < ABSTAIN_TOP_THRESHOLD) {
    return {
      abstain: true,
      reason: `Best match similarity ${topSim.toFixed(3)} is below the reliability threshold (${ABSTAIN_TOP_THRESHOLD}).`,
    };
  }

  const strongCount = chunks.filter((c) => c.similarity >= ABSTAIN_MIN_THRESHOLD).length;
  if (strongCount < ABSTAIN_MIN_CHUNKS) {
    return {
      abstain: true,
      reason: `Only ${strongCount} passage(s) exceed the strong-match threshold (${ABSTAIN_MIN_THRESHOLD}); minimum required is ${ABSTAIN_MIN_CHUNKS}.`,
    };
  }

  return { abstain: false };
}

// ─── synthesise ──────────────────────────────────────────────────────────────

/**
 * Mechanism 1 + 2 — Sonnet closed-book synthesis with mandatory [n] citations.
 * Prompt verbatim from RESEARCH-RAG-SPEC.md Section 6.
 * Citation numbering is made explicit: [1] = first passage listed, etc.
 */
export async function synthesise(
  query: string,
  chunks: RetrievedChunk[]
): Promise<string> {
  const passageList = chunks
    .map((c, i) => {
      const org = c.sourceOrganisation ?? "Unknown organisation";
      const type = c.sourceType ?? "document";
      const date = c.createdAt.slice(0, 10);
      return `[${i + 1}] ${c.title} (${org}, ${type}, ${date}): ${c.chunkText}`;
    })
    .join("\n\n");

  const systemPrompt = `You are Tideline Research. You answer ONLY from the numbered source passages provided below. You may not use any knowledge outside these passages.

RULES:
- Citations use the bracket numbers from the SOURCE PASSAGES list: [1] refers to the first passage listed, [2] to the second, and so on. Never write a citation number outside the range [1]–[${chunks.length}].
- Every factual claim must end with a citation [n] referencing the source passage number that supports it. Multiple: [2][5].
- If a claim cannot be supported by a provided passage, DO NOT write it.
- If the passages do not answer the question, say exactly: "The provided sources do not contain enough information to answer this reliably."
- When passages disagree, present both positions and cite each. Do not decide which is correct. State that the sources diverge.
- No outside facts. No dates, numbers, names, or events not in the passages.
- British English. No em dashes (use a colon or full stop). Plain, precise, professional register. No hedging filler.

SOURCE PASSAGES:
${passageList}`;

  const msg = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      { role: "user", content: `QUESTION: ${query}\n\nWrite the answer now. Citations are mandatory on every factual sentence.` },
    ],
  });

  const block = msg.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected non-text response from synthesis model");
  }
  return block.text;
}

// ─── verifyCitations ─────────────────────────────────────────────────────────

interface VerifyResult {
  answer: string;
  stripCount: number;
}

/**
 * Mechanism 3 — deterministic citation verification (zero model calls).
 * Parses all [n] markers. Any n outside 1..retrievedChunks.length is invalid.
 * Strips every sentence containing an invalid marker. Logs stripped claims.
 */
export function verifyCitations(
  answer: string,
  retrievedChunks: RetrievedChunk[]
): VerifyResult {
  const maxIndex = retrievedChunks.length;

  // Collect all marker values present
  const markerRe = /\[(\d+)\]/g;
  const invalidIndices = new Set<number>();
  for (const m of answer.matchAll(markerRe)) {
    const n = parseInt(m[1]);
    if (n < 1 || n > maxIndex) {
      invalidIndices.add(n);
      console.warn(`[research] verifyCitations: invalid citation [${n}] (max ${maxIndex}) — sentence will be stripped`);
    }
  }

  if (invalidIndices.size === 0) {
    return { answer, stripCount: 0 };
  }

  // Build a regex matching any invalid marker
  const invalidPattern = [...invalidIndices].map((n) => `\\[${n}\\]`).join("|");
  const invalidRe = new RegExp(invalidPattern);

  // Split into sentences and drop those containing an invalid marker
  const sentences = splitSentences(answer);
  let stripCount = 0;
  const kept: string[] = [];
  for (const s of sentences) {
    if (invalidRe.test(s)) {
      stripCount++;
      console.warn(`[research] verifyCitations: stripped sentence: "${s.slice(0, 80)}..."`);
    } else {
      kept.push(s);
    }
  }

  return { answer: kept.join(" ").trim(), stripCount };
}

// ─── checkFaithfulness ───────────────────────────────────────────────────────

interface FaithfulnessResult {
  answer: string;
  faithfulnessStripped: number;
  partialCitationCount: number;
}

/**
 * Mechanism 4 — per-claim faithfulness check via one batched Haiku call.
 * Prompt from RESEARCH-RAG-SPEC.md Section 7.
 *
 * Reliability contract (fail-closed):
 *   - Retry once after HAIKU_RETRY_DELAY_MS on any error.
 *   - If retry also fails, throw. Callers MUST NOT silently skip this step.
 *   An unreachable Haiku must surface as HTTP 503, not a silent pass.
 */
export async function checkFaithfulness(
  answer: string,
  retrievedChunks: RetrievedChunk[]
): Promise<FaithfulnessResult> {
  const claims = parseCitedClaims(answer);

  if (claims.length === 0) {
    return { answer, faithfulnessStripped: 0, partialCitationCount: 0 };
  }

  // Build batched prompt
  const claimLines = claims
    .map((c, i) => {
      // Use the first cited chunk as the primary source for the faithfulness check.
      // For multi-citation claims, checking the first cited source is conservative.
      const chunkIdx = c.citedIndices[0] - 1; // convert 1-based to 0-based
      const chunk = retrievedChunks[chunkIdx];
      const sourceText = chunk ? chunk.chunkText.slice(0, 500) : "(source not found)";
      return `CLAIM ${i + 1}: "${c.text}"  SOURCE: "${sourceText}"`;
    })
    .join("\n");

  const prompt = `For each claim, decide whether the SOURCE supports it.\nReturn JSON array only: [{"id":1,"verdict":"SUPPORTED|PARTIAL|UNSUPPORTED"}]\n\n${claimLines}`;

  let verdicts: Array<{ id: number; verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" }>;

  try {
    verdicts = await callHaikuFaithfulness(prompt);
  } catch (firstErr) {
    console.warn(`[research] checkFaithfulness: first attempt failed — retrying in ${HAIKU_RETRY_DELAY_MS}ms`, firstErr);
    await sleep(HAIKU_RETRY_DELAY_MS);
    try {
      verdicts = await callHaikuFaithfulness(prompt);
    } catch (retryErr) {
      // Fail closed: do not let unverified claims through.
      const err = Object.assign(
        new Error("Faithfulness check unavailable — Haiku call failed after retry"),
        { status: 503 }
      );
      throw err;
    }
  }

  // Apply verdicts: strip UNSUPPORTED, keep PARTIAL (flag only)
  let faithfulnessStripped = 0;
  let partialCitationCount = 0;
  const strippedClaimTexts = new Set<string>();

  for (const v of verdicts) {
    const claim = claims[v.id - 1];
    if (!claim) continue;

    if (v.verdict === "UNSUPPORTED") {
      faithfulnessStripped++;
      strippedClaimTexts.add(claim.text);
      console.warn(`[research] checkFaithfulness: stripped UNSUPPORTED claim: "${claim.text.slice(0, 80)}..."`);
    } else if (v.verdict === "PARTIAL") {
      partialCitationCount++;
      console.info(`[research] checkFaithfulness: flagged PARTIAL claim: "${claim.text.slice(0, 80)}..."`);
    }
  }

  // Rebuild answer without stripped sentences
  let finalAnswer = answer;
  if (strippedClaimTexts.size > 0) {
    const sentences = splitSentences(answer);
    const kept = sentences.filter((s) => !strippedClaimTexts.has(s));
    finalAnswer = kept.join(" ").trim();
  }

  return { answer: finalAnswer, faithfulnessStripped, partialCitationCount };
}

async function callHaikuFaithfulness(
  prompt: string
): Promise<Array<{ id: number; verdict: "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" }>> {
  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Non-text response from Haiku");

  const raw = block.text.trim();
  // Strip markdown code fences if present
  const json = raw.startsWith("```") ? raw.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "") : raw;
  return JSON.parse(json);
}

// ─── assembleResponse ────────────────────────────────────────────────────────

interface AssembleParams {
  query: string;
  retrievedChunks: RetrievedChunk[];
  abstentionResult: AbstentionResult;
  finalAnswer: string | null;
  faithfulnessStripped: number;
  partialCitationCount: number;
  inScopeCount: number;
  startTime: number;
}

/**
 * Compose the full ResearchResponse sent to the frontend.
 * RESEARCH-RAG-SPEC.md Section 8.
 */
export function assembleResponse(params: AssembleParams): ResearchResponse {
  const {
    retrievedChunks,
    abstentionResult,
    finalAnswer,
    faithfulnessStripped,
    partialCitationCount,
    inScopeCount,
    startTime,
  } = params;

  const latencyMs = Date.now() - startTime;

  if (abstentionResult.abstain) {
    const nearestDocs = retrievedChunks.slice(0, ABSTAIN_NEARBY_COUNT).map((c) => ({
      title: c.title,
      canonicalUrl: c.canonicalUrl,
      similarity: c.similarity,
    }));

    return {
      answer: null,
      abstained: true,
      abstentionReason: abstentionResult.reason,
      citedSources: [],
      funnel: {
        inScope: inScopeCount,
        retrieved: retrievedChunks.length,
        cited: 0,
        latencyMs,
      },
      faithfulnessStripped: 0,
      partialCitationCount: 0,
      nearestDocs,
    };
  }

  // Determine which chunks are actually cited in the final answer
  const citedIndices = new Set<number>();
  if (finalAnswer) {
    for (const m of finalAnswer.matchAll(/\[(\d+)\]/g)) {
      const n = parseInt(m[1]);
      if (n >= 1 && n <= retrievedChunks.length) {
        citedIndices.add(n - 1); // 0-based
      }
    }
  }

  const citedSources: CitedSource[] = [...citedIndices]
    .sort((a, b) => a - b)
    .map((i) => {
      const c = retrievedChunks[i];
      return {
        documentId: c.documentId,
        title: c.title,
        sourceOrganisation: c.sourceOrganisation,
        sourceType: c.sourceType,
        sourceTier: c.sourceTier,
        documentType: c.documentType,
        canonicalUrl: c.canonicalUrl,
        createdAt: c.createdAt,
        similarity: c.similarity,
        chunkIndex: c.chunkIndex,
      };
    });

  return {
    answer: finalAnswer,
    abstained: false,
    citedSources,
    funnel: {
      inScope: inScopeCount,
      retrieved: retrievedChunks.length,
      cited: citedSources.length,
      latencyMs,
    },
    faithfulnessStripped,
    partialCitationCount,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string.
  // Preserves citation markers like [1] at the end of sentences.
  return text
    .split(/(?<=[.!?](?:\[\d+\])*)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCitedClaims(
  answer: string
): Array<{ text: string; citedIndices: number[] }> {
  const sentences = splitSentences(answer);
  const claims: Array<{ text: string; citedIndices: number[] }> = [];

  for (const sentence of sentences) {
    const markers = [...sentence.matchAll(/\[(\d+)\]/g)];
    if (markers.length > 0) {
      claims.push({
        text: sentence,
        citedIndices: markers.map((m) => parseInt(m[1])),
      });
    }
  }

  return claims;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
