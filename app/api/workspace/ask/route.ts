import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function embedQuestion(text: string): Promise<number[]> {
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v2-base-en",
      input: [text],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina embedding failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

interface DocChunkMatch {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
}

interface PrimaryChunkMatch {
  chunk_text: string;
  issuing_body: string | null;
  document_type: string | null;
  date_issued: string | null;
  source_url: string | null;
  similarity: number;
}

interface DocumentMeta {
  id: string;
  title: string;
  source_organisation: string | null;
  published_date: string | null;
  file_url: string | null;
}

interface Source {
  document_id: string | null;
  title: string;
  source_organisation: string | null;
  published_date: string | null;
  file_url: string | null;
  chunk_text: string;
}

const SYSTEM_PROMPT = `You are Tideline, an ocean governance intelligence assistant. Answer using ONLY the provided source documents. Every factual claim must cite its source as [Source: title, organisation, date]. If the answer cannot be found in the provided documents, say so explicitly. Never speculate.`;

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 1000) {
    return NextResponse.json(
      { error: "question required (max 1000 chars)" },
      { status: 400 }
    );
  }

  // 1. Embed the question
  let embedding: number[];
  try {
    embedding = await embedQuestion(question);
  } catch (err) {
    console.error("[workspace/ask] Embedding error:", err);
    return NextResponse.json(
      { error: "Failed to embed question" },
      { status: 500 }
    );
  }

  const embeddingJson = JSON.stringify(embedding);
  console.log("[workspace/ask] Embedding generated, length:", embedding.length);

  // 2. Parallel RPC calls: library document chunks + primary source chunks
  const [docChunksResult, primaryChunksResult] = await Promise.all([
    supabase.rpc("match_document_chunks", {
      query_embedding: embeddingJson,
      match_threshold: 0.6,
      match_count: 12,
    }),
    supabase.rpc("match_primary_chunks", {
      query_embedding: embeddingJson,
      match_threshold: 0.55,
      match_count: 8,
    }),
  ]);

  const docChunks: DocChunkMatch[] = docChunksResult.data || [];
  const primaryChunks: PrimaryChunkMatch[] = primaryChunksResult.data || [];

  console.log("[workspace/ask] match_document_chunks:", docChunksResult.error ? `ERROR: ${JSON.stringify(docChunksResult.error)}` : `${docChunks.length} results`);
  console.log("[workspace/ask] match_primary_chunks:", primaryChunksResult.error ? `ERROR: ${JSON.stringify(primaryChunksResult.error)}` : `${primaryChunks.length} results`);
  if (docChunks.length > 0) console.log("[workspace/ask] Top doc chunk similarity:", docChunks[0].similarity);
  if (primaryChunks.length > 0) console.log("[workspace/ask] Top primary chunk similarity:", primaryChunks[0].similarity);

  // 3. Fetch document metadata for library chunks
  const docIds = [...new Set(docChunks.map((c) => c.document_id))];
  let docMetaMap = new Map<string, DocumentMeta>();

  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, title, source_organisation, published_date, file_url")
      .in("id", docIds);

    if (docs) {
      docMetaMap = new Map(docs.map((d) => [d.id, d]));
    }
  }

  // 4. Build unified source list
  const sources: Source[] = [];
  const seenChunks = new Set<string>();

  for (const chunk of docChunks) {
    const key = chunk.chunk_text.slice(0, 100);
    if (seenChunks.has(key)) continue;
    seenChunks.add(key);

    const meta = docMetaMap.get(chunk.document_id);
    sources.push({
      document_id: chunk.document_id,
      title: meta?.title || "Unknown document",
      source_organisation: meta?.source_organisation || null,
      published_date: meta?.published_date || null,
      file_url: meta?.file_url || null,
      chunk_text: chunk.chunk_text,
    });
  }

  for (const chunk of primaryChunks) {
    const key = chunk.chunk_text.slice(0, 100);
    if (seenChunks.has(key)) continue;
    seenChunks.add(key);

    sources.push({
      document_id: null,
      title: chunk.issuing_body || "Primary source",
      source_organisation: chunk.issuing_body || null,
      published_date: chunk.date_issued || null,
      file_url: chunk.source_url || null,
      chunk_text: chunk.chunk_text,
    });
  }

  // 5. Build context for Claude
  console.log("[workspace/ask] Total sources for Claude:", sources.length, "(doc:", docChunks.length, "primary:", primaryChunks.length, ")");
  if (sources.length === 0) {
    return NextResponse.json({
      answer:
        "I could not find any relevant documents in the Tideline library to answer this question. Try rephrasing your query or broadening the topic.",
      sources: [],
    });
  }

  const contextBlock = sources
    .map(
      (s, i) =>
        `[Document ${i + 1}] ${s.title}${s.source_organisation ? ` — ${s.source_organisation}` : ""}${s.published_date ? ` (${s.published_date})` : ""}\n${s.chunk_text}`
    )
    .join("\n\n---\n\n");

  // 6. Call Claude Sonnet
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\n--- SOURCE DOCUMENTS ---\n\n${contextBlock}`,
      },
    ],
  });

  const answer =
    msg.content[0].type === "text" ? msg.content[0].text : "No answer generated.";

  // 7. Return answer + sources (without chunk_text in response to save bandwidth)
  const responseSources = sources.map((s) => ({
    document_id: s.document_id,
    title: s.title,
    source_organisation: s.source_organisation,
    published_date: s.published_date,
    file_url: s.file_url,
  }));

  return NextResponse.json({ answer, sources: responseSources });
}
