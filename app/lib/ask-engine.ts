/**
 * app/lib/ask-engine.ts — Shared Ask Tideline engine
 *
 * Unified retrieval + generation pipeline used by:
 *   - /api/workspace/ask (in-project Ask panel)
 *   - /api/research/ask (full-screen research console)
 *
 * Pipeline: expand query → multi-strategy embedding → dual-corpus search
 *   → keyword re-scoring → keyword guard → synthesis → citation verification
 *   → faithfulness check → assemble response
 *
 * Extracted from workspace/ask/route.ts (the working engine) on 2026-07-04.
 * Citation verification + faithfulness check ported from lib/research.ts.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding } from "./embeddings";
import { expandQuery, scoreChunk, deduplicateChunks, extractKeywords } from "./query-expansion";

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SONNET = "claude-sonnet-4-6";
const HAIKU = "claude-haiku-4-5-20251001";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocChunkMatch {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
}

interface StoryChunkMatch {
  chunk_text: string;
  issuing_body: string | null;
  document_type: string | null;
  date_issued: string | null;
  source_url: string | null;
  similarity: number;
}

export interface AskSource {
  document_id: string | null;
  title: string;
  source_organisation: string | null;
  published_date: string | null;
  file_url: string | null;
  chunk_text: string;
  relevanceScore: number;
}

export interface AskVerification {
  citationStripped: number;
  faithfulnessStripped: number;
  partialCount: number;
}

export interface AskResult {
  answer: string | null;
  abstained: boolean;
  abstentionReason?: string;
  sources: Array<{
    document_id: string | null;
    title: string;
    source_organisation: string | null;
    published_date: string | null;
    file_url: string | null;
  }>;
  verification: AskVerification;
  meta: {
    strategies_used: number;
    text_search_fallback: boolean;
    total_chunks_found: number;
    top_chunks_used: number;
    latencyMs: number;
  };
}

export interface AskOptions {
  scope?: "corpus" | "project";
  /** Skip the Haiku faithfulness check for speed. Citation verification (deterministic) still runs. */
  skipFaithfulness?: boolean;
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Tideline, an ocean governance intelligence assistant with access to a curated library of primary source documents.

Rules:
- Answer ONLY using source documents that directly address the question. Ignore tangentially related sources.
- If a source mentions the topic only in passing (one sentence, as an example, or unrelated context) do not cite it.
- Every factual claim must cite its source using bracket numbers: [1], [2], etc. These refer to the numbered source documents provided.
- If fewer than 2 sources directly address the question, say: "The Tideline library has limited coverage on this topic."
- Never speculate or add information beyond what the sources contain.
- Be concise. Do not pad the answer.
- When sources disagree, present both positions and cite each. Do not decide which is correct.
- British English. No em dashes. Plain, precise, professional register.

For broad questions, provide:
1. Overview of key issues/themes found in the documents
2. Specific examples with citations
3. Timeline of developments where relevant

Always acknowledge the scope of your search. If documents cover only certain aspects, say so.`;

// ─── Core engine ─────────────────────────────────────────────────────────────

export async function askTideline(
  question: string,
  opts?: AskOptions
): Promise<AskResult> {
  const startTime = Date.now();

  // 1. Expand query via Haiku
  const expanded = await expandQuery(question);

  // 2. Generate embeddings for original + concept string (skip variations for speed)
  const textsToEmbed = [
    question,
    expanded.concepts.length > 0 ? expanded.concepts.join(" ") : null,
  ].filter((t): t is string => !!t);

  const embeddings = await Promise.all(
    textsToEmbed.map((t) => generateEmbedding(t))
  );

  // 3. Parallel search: original query (tighter) + concept string (wider)
  const searchResults = await Promise.all(
    embeddings.map((emb, i) => {
      const embJson = JSON.stringify(emb);
      if (i === 0) {
        return searchBothCorpora(embJson, 0.45, 0.4, 12, 10);
      } else {
        return searchBothCorpora(embJson, 0.3, 0.25, 10, 8);
      }
    })
  );

  // Combine + dedup
  const allDocChunks: DocChunkMatch[] = [];
  const allStoryChunks: StoryChunkMatch[] = [];
  for (const r of searchResults) {
    allDocChunks.push(...r.docChunks);
    allStoryChunks.push(...r.storyChunks);
  }
  const dedupedDocChunks = deduplicateChunks(allDocChunks);
  const dedupedStoryChunks = deduplicateChunks(allStoryChunks);

  // 4. Text search fallback if semantic search found nothing
  let textSearchChunks: StoryChunkMatch[] = [];
  if (dedupedDocChunks.length === 0 && dedupedStoryChunks.length === 0) {
    const keywords = extractKeywords(question);
    if (keywords.length > 0) {
      const tsQuery = keywords.join(" | ");
      const { data: textResults } = await supabase
        .from("document_chunks")
        .select("chunk_text, document_id")
        .textSearch("chunk_text", tsQuery, { type: "websearch", config: "english" })
        .limit(8);

      if (textResults && textResults.length > 0) {
        textSearchChunks = textResults.map((r) => ({
          chunk_text: r.chunk_text,
          issuing_body: null,
          document_type: null,
          date_issued: null,
          source_url: null,
          similarity: 0.15,
        }));
      }
    }
  }

  // 5. Fetch document metadata
  const docIds = [...new Set(dedupedDocChunks.map((c) => c.document_id))];
  let docMetaMap = new Map<string, { id: string; title: string; source_organisation: string | null; published_date: string | null; file_url: string | null }>();
  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, title, source_organisation, published_date, file_url")
      .in("id", docIds);
    if (docs) {
      docMetaMap = new Map(docs.map((d) => [d.id, d]));
    }
  }

  // 6. Build unified source list with relevance scoring
  const sources: AskSource[] = [];
  for (const chunk of dedupedDocChunks) {
    const meta = docMetaMap.get(chunk.document_id);
    sources.push({
      document_id: chunk.document_id,
      title: meta?.title || "Unknown document",
      source_organisation: meta?.source_organisation || null,
      published_date: meta?.published_date || null,
      file_url: meta?.file_url || null,
      chunk_text: chunk.chunk_text,
      relevanceScore: scoreChunk(
        { chunk_text: chunk.chunk_text, similarity: chunk.similarity, date_issued: meta?.published_date, issuing_body: meta?.source_organisation },
        question
      ),
    });
  }
  for (const chunk of [...dedupedStoryChunks, ...textSearchChunks]) {
    sources.push({
      document_id: null,
      title: chunk.issuing_body || "Primary source",
      source_organisation: chunk.issuing_body || null,
      published_date: chunk.date_issued || null,
      file_url: chunk.source_url || null,
      chunk_text: chunk.chunk_text,
      relevanceScore: scoreChunk(chunk, question),
    });
  }

  // Sort by relevance and take top 12
  sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topSources = sources.slice(0, 12);
  const latencyMs = () => Date.now() - startTime;

  // 7. Keyword guard: if zero top sources contain any query keyword, abstain
  const keywords = extractKeywords(question);
  if (topSources.length > 0 && keywords.length > 0) {
    const anyMatch = topSources.some((s) => {
      const text = s.chunk_text.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    if (!anyMatch) {
      return {
        answer: null,
        abstained: true,
        abstentionReason: `Retrieved passages do not appear related to the query terms (${keywords.join(", ")}).`,
        sources: topSources.map(stripChunkText),
        verification: { citationStripped: 0, faithfulnessStripped: 0, partialCount: 0 },
        meta: { strategies_used: searchResults.length, text_search_fallback: textSearchChunks.length > 0, total_chunks_found: sources.length, top_chunks_used: topSources.length, latencyMs: latencyMs() },
      };
    }
  }

  // 8. No sources at all
  if (topSources.length === 0) {
    return {
      answer: null,
      abstained: true,
      abstentionReason: "No relevant passages found in the library.",
      sources: [],
      verification: { citationStripped: 0, faithfulnessStripped: 0, partialCount: 0 },
      meta: { strategies_used: searchResults.length, text_search_fallback: textSearchChunks.length > 0, total_chunks_found: 0, top_chunks_used: 0, latencyMs: latencyMs() },
    };
  }

  // 9. Build context for Claude
  const contextBlock = topSources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}${s.source_organisation ? ` — ${s.source_organisation}` : ""}${s.published_date ? ` (${s.published_date})` : ""}\n${s.chunk_text}`
    )
    .join("\n\n---\n\n");

  // 10. Synthesise via Sonnet
  const msg = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2048,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\n--- SOURCE DOCUMENTS ---\n\n${contextBlock}`,
      },
    ],
  });

  let rawAnswer = msg.content[0].type === "text" ? msg.content[0].text : "";

  // 11. Citation verification (Mechanism 3 — deterministic, zero model calls)
  const { answer: verifiedAnswer, stripCount: citationStripped } =
    verifyCitations(rawAnswer, topSources.length);

  // 12. Faithfulness check (Mechanism 4 — Haiku, optional for speed)
  let faithfulnessStripped = 0;
  let partialCount = 0;
  let finalAnswer = verifiedAnswer;

  if (!opts?.skipFaithfulness) {
    try {
      const faithResult = await checkFaithfulness(verifiedAnswer, topSources);
      finalAnswer = faithResult.answer;
      faithfulnessStripped = faithResult.stripped;
      partialCount = faithResult.partialCount;
    } catch (err) {
      console.warn("[ask-engine] faithfulness check failed, returning citation-verified answer only:", err);
      finalAnswer = verifiedAnswer;
    }
  }

  return {
    answer: finalAnswer,
    abstained: false,
    sources: topSources.map(stripChunkText),
    verification: { citationStripped, faithfulnessStripped, partialCount },
    meta: {
      strategies_used: searchResults.length,
      text_search_fallback: textSearchChunks.length > 0,
      total_chunks_found: sources.length,
      top_chunks_used: topSources.length,
      latencyMs: latencyMs(),
    },
  };
}

// ─── Dual-corpus search ──────────────────────────────────────────────────────

async function searchBothCorpora(
  embeddingJson: string,
  docThreshold: number,
  storyThreshold: number,
  docCount: number,
  storyCount: number
): Promise<{ docChunks: DocChunkMatch[]; storyChunks: StoryChunkMatch[] }> {
  const [docResult, storyResult] = await Promise.all([
    supabase.rpc("match_document_chunks", {
      query_embedding: embeddingJson,
      match_threshold: docThreshold,
      match_count: docCount,
    }),
    supabase.rpc("match_story_chunks", {
      query_embedding: embeddingJson,
      match_threshold: storyThreshold,
      match_count: storyCount,
    }),
  ]);
  return {
    docChunks: docResult.data || [],
    storyChunks: storyResult.data || [],
  };
}

// ─── Citation verification (Mechanism 3) ─────────────────────────────────────

function verifyCitations(
  answer: string,
  maxIndex: number
): { answer: string; stripCount: number } {
  const markerRe = /\[(\d+)\]/g;
  const invalidIndices = new Set<number>();
  for (const m of answer.matchAll(markerRe)) {
    const n = parseInt(m[1]);
    if (n < 1 || n > maxIndex) {
      invalidIndices.add(n);
    }
  }

  if (invalidIndices.size === 0) {
    return { answer, stripCount: 0 };
  }

  const invalidPattern = [...invalidIndices].map((n) => `\\[${n}\\]`).join("|");
  const invalidRe = new RegExp(invalidPattern);
  const sentences = splitSentences(answer);
  let stripCount = 0;
  const kept: string[] = [];
  for (const s of sentences) {
    if (invalidRe.test(s)) {
      stripCount++;
    } else {
      kept.push(s);
    }
  }

  return { answer: kept.join(" ").trim(), stripCount };
}

// ─── Faithfulness check (Mechanism 4) ────────────────────────────────────────

async function checkFaithfulness(
  answer: string,
  sources: AskSource[]
): Promise<{ answer: string; stripped: number; partialCount: number }> {
  const claims = parseCitedClaims(answer);
  if (claims.length === 0) {
    return { answer, stripped: 0, partialCount: 0 };
  }

  const claimLines = claims
    .map((c, i) => {
      const sourceIdx = c.citedIndices[0] - 1;
      const source = sources[sourceIdx];
      const sourceText = source ? source.chunk_text.slice(0, 500) : "(source not found)";
      return `CLAIM ${i + 1}: "${c.text}"  SOURCE: "${sourceText}"`;
    })
    .join("\n");

  const prompt = `For each claim, decide whether the SOURCE supports it.\nReturn JSON array only: [{"id":1,"verdict":"SUPPORTED|PARTIAL|UNSUPPORTED"}]\n\n${claimLines}`;

  let verdicts: Array<{ id: number; verdict: string }>;
  try {
    verdicts = await callHaikuFaithfulness(prompt);
  } catch {
    // Retry once
    await new Promise((r) => setTimeout(r, 2000));
    verdicts = await callHaikuFaithfulness(prompt);
  }

  let stripped = 0;
  let partialCount = 0;
  const strippedTexts = new Set<string>();

  for (const v of verdicts) {
    const claim = claims[v.id - 1];
    if (!claim) continue;
    if (v.verdict === "UNSUPPORTED") {
      stripped++;
      strippedTexts.add(claim.text);
    } else if (v.verdict === "PARTIAL") {
      partialCount++;
    }
  }

  let finalAnswer = answer;
  if (strippedTexts.size > 0) {
    const sentences = splitSentences(answer);
    finalAnswer = sentences.filter((s) => !strippedTexts.has(s)).join(" ").trim();
  }

  return { answer: finalAnswer, stripped, partialCount };
}

async function callHaikuFaithfulness(
  prompt: string
): Promise<Array<{ id: number; verdict: string }>> {
  const msg = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Non-text response");
  const raw = block.text.trim();
  const json = raw.startsWith("```") ? raw.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "") : raw;
  return JSON.parse(json);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
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

function stripChunkText(s: AskSource): Omit<AskSource, "chunk_text" | "relevanceScore"> {
  return {
    document_id: s.document_id,
    title: s.title,
    source_organisation: s.source_organisation,
    published_date: s.published_date,
    file_url: s.file_url,
  };
}
