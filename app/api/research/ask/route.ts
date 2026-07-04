/**
 * POST /api/research/ask
 * Research RAG endpoint — RESEARCH-RAG-SPEC.md Sections 5–8.
 *
 * Pipeline (all 5 reliability mechanisms):
 *   embed → retrieve → abstention gate → synthesise →
 *   citation verify → faithfulness check → assemble → persist
 *
 * Auth: required (getEmailFromSession). Returns 401 if unauthenticated.
 * Faithfulness check is fail-closed: returns 503 if Haiku is unreachable.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import {
  embedQuery,
  retrieveChunks,
  abstentionGate,
  synthesise,
  verifyCitations,
  checkFaithfulness,
  assembleResponse,
  ResearchFilters,
  ResearchResponse,
} from "@/app/lib/research";

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_SURFACES = [
  "brief_reply",
  "workspace_ask",
  "standalone_research",
  "projects_ask",
] as const;
type SourceSurface = (typeof VALID_SURFACES)[number];

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query =
    typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 500) {
    return NextResponse.json(
      { error: "query required (max 500 chars)" },
      { status: 400 }
    );
  }

  // Source surface — determines per-surface defaults (spec Section 8)
  const sourceSurface: SourceSurface =
    VALID_SURFACES.includes(body.sourceSurface as SourceSurface)
      ? (body.sourceSurface as SourceSurface)
      : "standalone_research";

  // Source tiers — default ALL tiers. SECONDARY is 2.2% of corpus (171/7707 docs)
  // but contains high-quality analytical material (IUCN, OceanCare, NGO analysis).
  // PRIMARY-only excluded 9/11 BBNJ docs causing wrong-subject retrieval.
  // Per-user primary-only toggle deferred to Step 4 (primaryFilter).
  const rawTiers = Array.isArray(body.sourceTiers) ? body.sourceTiers : null;
  const sourceTiers: ("PRIMARY" | "SECONDARY")[] =
    rawTiers !== null
      ? rawTiers.filter(
          (t): t is "PRIMARY" | "SECONDARY" =>
            t === "PRIMARY" || t === "SECONDARY"
        )
      : ["PRIMARY", "SECONDARY"];

  // Date filters
  const dateFrom =
    typeof body.dateFrom === "string" ? body.dateFrom : undefined;
  const dateTo =
    typeof body.dateTo === "string" ? body.dateTo : undefined;

  // Scope
  const scope: "all_library" | "my_uploads" =
    body.scope === "my_uploads" ? "my_uploads" : "all_library";

  const filters: ResearchFilters = { sourceTiers, dateFrom, dateTo, scope };

  const startTime = Date.now();

  // ── Pipeline ────────────────────────────────────────────────────────────────

  // Step 1 — Embed query
  let embedding: number[];
  try {
    embedding = await embedQuery(query);
  } catch (err) {
    console.error("[research/ask] embedQuery failed:", err);
    return NextResponse.json(
      { error: "Embedding service unavailable" },
      { status: 503 }
    );
  }

  // Step 2 — Retrieve chunks
  let chunks: Awaited<ReturnType<typeof retrieveChunks>>["chunks"];
  let inScopeCount: number;
  try {
    const result = await retrieveChunks(embedding, filters);
    chunks = result.chunks;
    inScopeCount = result.inScopeCount;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    if (e.status === 400) {
      return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
    }
    console.error("[research/ask] retrieveChunks failed:", err);
    return NextResponse.json({ error: "Retrieval failed" }, { status: 500 });
  }

  console.log(`[research/ask] retrieved ${chunks.length} chunks, inScope=${inScopeCount}`);

  // Step 3 — Abstention gate (Mechanism 5)
  const abstentionResult = abstentionGate(chunks, query);

  if (abstentionResult.abstain) {
    const response = assembleResponse({
      query,
      retrievedChunks: chunks,
      abstentionResult,
      finalAnswer: null,
      faithfulnessStripped: 0,
      partialCitationCount: 0,
      inScopeCount,
      startTime,
    });
    const queryId = await persistQuery({
      query,
      sourceSurface,
      sourceTiers,
      dateFrom,
      dateTo,
      scope,
      chunksRetrieved: chunks.length,
      chunksCited: 0,
      abstained: true,
      faithfulnessStripped: 0,
      partialCitationCount: 0,
      answer: null,
      citedChunkIds: [],
      latencyMs: response.funnel.latencyMs,
    });
    return NextResponse.json({ ...response, queryId });
  }

  // Step 4 — Synthesise (Mechanisms 1 + 2)
  let rawAnswer: string;
  try {
    rawAnswer = await synthesise(query, chunks);
  } catch (err) {
    console.error("[research/ask] synthesise failed:", err);
    return NextResponse.json({ error: "Synthesis failed" }, { status: 500 });
  }

  // Step 5 — Verify citations (Mechanism 3 — deterministic, zero model calls)
  const { answer: verifiedAnswer } = verifyCitations(rawAnswer, chunks);

  // Step 6 — Faithfulness check (Mechanism 4 — fail-closed)
  let finalAnswer: string;
  let faithfulnessStripped: number;
  let partialCitationCount: number;
  try {
    const faithResult = await checkFaithfulness(verifiedAnswer, chunks);
    finalAnswer = faithResult.answer;
    faithfulnessStripped = faithResult.faithfulnessStripped;
    partialCitationCount = faithResult.partialCitationCount;
  } catch (err: unknown) {
    const e = err as { status?: number };
    const status = e.status === 503 ? 503 : 500;
    console.error("[research/ask] checkFaithfulness failed:", err);
    return NextResponse.json(
      { error: "Faithfulness check unavailable — try again shortly" },
      { status }
    );
  }

  // Step 7 — Assemble response
  const response: ResearchResponse = assembleResponse({
    query,
    retrievedChunks: chunks,
    abstentionResult,
    finalAnswer,
    faithfulnessStripped,
    partialCitationCount,
    inScopeCount,
    startTime,
  });

  // Derive cited chunk UUIDs (document_chunks.id) from 1-based markers in final answer
  const citedChunkIds: string[] = [];
  for (const m of finalAnswer.matchAll(/\[(\d+)\]/g)) {
    const idx = parseInt(m[1]) - 1; // 0-based
    if (idx >= 0 && idx < chunks.length) {
      const chunkId = chunks[idx].id;
      if (!citedChunkIds.includes(chunkId)) citedChunkIds.push(chunkId);
    }
  }

  // Step 8 — Persist to research_queries (non-fatal on failure)
  const queryId = await persistQuery({
    query,
    sourceSurface,
    sourceTiers,
    dateFrom,
    dateTo,
    scope,
    chunksRetrieved: chunks.length,
    chunksCited: response.citedSources.length,
    abstained: false,
    faithfulnessStripped,
    partialCitationCount,
    answer: finalAnswer,
    citedChunkIds,
    latencyMs: response.funnel.latencyMs,
  });

  console.log(
    `[research/ask] complete: cited=${response.citedSources.length} ` +
      `stripped=${faithfulnessStripped} partial=${partialCitationCount} ` +
      `latency=${response.funnel.latencyMs}ms`
  );

  return NextResponse.json({ ...response, queryId });
}

// ─── Persistence ──────────────────────────────────────────────────────────────

interface PersistParams {
  query: string;
  sourceSurface: string;
  sourceTiers: string[];
  dateFrom?: string;
  dateTo?: string;
  scope: string;
  chunksRetrieved: number;
  chunksCited: number;
  abstained: boolean;
  faithfulnessStripped: number;
  partialCitationCount: number;
  answer: string | null;
  citedChunkIds: string[];
  latencyMs: number;
}

async function persistQuery(p: PersistParams): Promise<string | null> {
  // user_id is intentionally null in v1: research_queries.user_id references
  // auth.users(id) (Supabase Auth), but this project uses NextAuth. Adding
  // user attribution requires a separate migration to reference next_auth.users.
  const { data, error } = await supabase
    .from("research_queries")
    .insert({
      user_id: null,
      query: p.query,
      source_surface: p.sourceSurface,
      source_tiers: p.sourceTiers,
      date_from: p.dateFrom ?? null,
      date_to: p.dateTo ?? null,
      scope: p.scope,
      chunks_retrieved: p.chunksRetrieved,
      chunks_cited: p.chunksCited,
      abstained: p.abstained,
      faithfulness_stripped: p.faithfulnessStripped,
      partial_citation_count: p.partialCitationCount,
      answer: p.answer,
      cited_chunk_ids: p.citedChunkIds,
      latency_ms: p.latencyMs,
    })
    .select("id")
    .single();

  if (error) {
    // Non-fatal: log and continue. The answer is already returned to the client.
    console.error("[research/ask] persistQuery failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}
