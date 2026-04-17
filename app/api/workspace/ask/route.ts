import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getEmailFromSession } from "@/app/lib/auth";
import { expandQuery, scoreChunk, deduplicateChunks, extractKeywords } from "@/app/lib/query-expansion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function embedText(text: string): Promise<number[]> {
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
  relevanceScore: number;
}

async function searchBothCorpora(
  embeddingJson: string,
  docThreshold: number,
  primaryThreshold: number,
  docCount: number,
  primaryCount: number
): Promise<{ docChunks: DocChunkMatch[]; primaryChunks: PrimaryChunkMatch[] }> {
  const [docResult, primaryResult] = await Promise.all([
    supabase.rpc("match_document_chunks", {
      query_embedding: embeddingJson,
      match_threshold: docThreshold,
      match_count: docCount,
    }),
    supabase.rpc("match_primary_chunks", {
      query_embedding: embeddingJson,
      match_threshold: primaryThreshold,
      match_count: primaryCount,
    }),
  ]);
  return {
    docChunks: docResult.data || [],
    primaryChunks: primaryResult.data || [],
  };
}

const SYSTEM_PROMPT = `You are Tideline, an ocean governance intelligence assistant with access to a curated library of primary source documents.

Rules:
- Answer ONLY using source documents that directly address the question. Ignore tangentially related sources.
- If a source mentions the topic only in passing (one sentence, as an example, or unrelated context) do not cite it.
- Every factual claim must cite its source as [Source: title, organisation, date].
- If fewer than 2 sources directly address the question, say: "The Tideline library has limited coverage on this topic. The most relevant document found is [title]. You may want to search the library directly for more."
- Never speculate or add information beyond what the sources contain.
- Be concise. Do not pad the answer.

For broad questions (like "issues with fishing regulations"), provide:
1. Overview of key issues/themes found in the documents
2. Specific examples with citations
3. Timeline of developments where relevant
4. Geographic or sectoral patterns if evident

Always acknowledge the scope of your search. If documents cover only certain aspects of a broad topic, say so and suggest related terms the user could search for.`;

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

  // 1. Expand query via Haiku (concepts + variations)
  const expanded = await expandQuery(question);
  console.log("[workspace/ask] Query expanded:", {
    concepts: expanded.concepts.length,
    variations: expanded.variations.length,
    timeframe: expanded.timeframe,
  });

  // 2. Generate embeddings for original + concept string + variations
  const textsToEmbed = [
    question,
    expanded.concepts.length > 0 ? expanded.concepts.join(" ") : null,
    ...expanded.variations,
  ].filter((t): t is string => !!t);

  let embeddings: number[][];
  try {
    embeddings = await Promise.all(textsToEmbed.map((t) => embedText(t)));
  } catch (err) {
    console.error("[workspace/ask] Embedding error:", err);
    return NextResponse.json(
      { error: "Failed to embed question" },
      { status: 500 }
    );
  }

  // 3. Multi-strategy parallel search
  const searchPromises = embeddings.map((emb, i) => {
    const embJson = JSON.stringify(emb);
    if (i === 0) {
      // Original query — tighter thresholds
      return searchBothCorpora(embJson, 0.5, 0.45, 10, 8);
    } else if (i === 1 && expanded.concepts.length > 0) {
      // Concept string — medium thresholds
      return searchBothCorpora(embJson, 0.35, 0.3, 8, 6);
    } else {
      // Variations — looser thresholds
      return searchBothCorpora(embJson, 0.25, 0.2, 5, 4);
    }
  });

  const searchResults = await Promise.all(searchPromises);

  // Combine all results
  const allDocChunks: DocChunkMatch[] = [];
  const allPrimaryChunks: PrimaryChunkMatch[] = [];
  for (const result of searchResults) {
    allDocChunks.push(...result.docChunks);
    allPrimaryChunks.push(...result.primaryChunks);
  }

  const dedupedDocChunks = deduplicateChunks(allDocChunks);
  const dedupedPrimaryChunks = deduplicateChunks(allPrimaryChunks);

  console.log("[workspace/ask] Search results:", {
    strategies: searchResults.length,
    rawDoc: allDocChunks.length,
    rawPrimary: allPrimaryChunks.length,
    dedupedDoc: dedupedDocChunks.length,
    dedupedPrimary: dedupedPrimaryChunks.length,
  });

  // 4. Text search fallback if semantic search found nothing
  let textSearchChunks: PrimaryChunkMatch[] = [];
  if (dedupedDocChunks.length === 0 && dedupedPrimaryChunks.length === 0) {
    const keywords = extractKeywords(question);
    if (keywords.length > 0) {
      console.log("[workspace/ask] Falling back to text search:", keywords);
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
        console.log("[workspace/ask] Text search found:", textSearchChunks.length);
      }
    }
  }

  // 5. Fetch document metadata for library chunks
  const docIds = [...new Set(dedupedDocChunks.map((c) => c.document_id))];
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

  // 6. Build unified source list with relevance scoring
  const sources: Source[] = [];

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

  for (const chunk of [...dedupedPrimaryChunks, ...textSearchChunks]) {
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

  // Sort by relevance score and take top 12
  sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topSources = sources.slice(0, 12);

  console.log("[workspace/ask] Final sources:", topSources.length, "top score:", topSources[0]?.relevanceScore?.toFixed(3));

  if (topSources.length === 0) {
    return NextResponse.json({
      answer:
        "I could not find any relevant documents in the Tideline library to answer this question. Try rephrasing your query or broadening the topic.",
      sources: [],
    });
  }

  // 7. Build context for Claude
  const contextBlock = topSources
    .map(
      (s, i) =>
        `[Document ${i + 1}] ${s.title}${s.source_organisation ? ` — ${s.source_organisation}` : ""}${s.published_date ? ` (${s.published_date})` : ""}\n${s.chunk_text}`
    )
    .join("\n\n---\n\n");

  // 8. Call Claude Sonnet
  let msg;
  try {
    msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Question: ${question}\n\n--- SOURCE DOCUMENTS ---\n\n${contextBlock}`,
        },
      ],
    });
  } catch (err) {
    console.error("[workspace/ask] Anthropic error:", err);
    return NextResponse.json(
      { error: "Failed to generate answer from Claude" },
      { status: 500 }
    );
  }

  const answer =
    msg.content[0].type === "text" ? msg.content[0].text : "No answer generated.";

  // 9. Return answer + sources
  const responseSources = topSources.map((s) => ({
    document_id: s.document_id,
    title: s.title,
    source_organisation: s.source_organisation,
    published_date: s.published_date,
    file_url: s.file_url,
  }));

  return NextResponse.json({
    answer,
    sources: responseSources,
    meta: {
      strategies_used: searchResults.length,
      text_search_fallback: textSearchChunks.length > 0,
      total_chunks_found: sources.length,
      top_chunks_used: topSources.length,
    },
  });
}
