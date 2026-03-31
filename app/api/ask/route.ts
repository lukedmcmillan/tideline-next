import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding, searchPrimaryChunks } from "@/app/lib/embeddings";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface Source {
  issuing_body: string | null;
  document_type: string | null;
  date_issued: string | null;
  source_url: string | null;
}

export async function POST(req: NextRequest) {
  const { query, projectId } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    // 1. Generate embedding for query
    const embedding = await generateEmbedding(query.trim());

    // 2. Search primary source chunks
    const chunks = await searchPrimaryChunks(embedding, 0.75, 5);

    // 3. Check threshold — need at least 2 chunks
    if (chunks.length < 2) {
      return NextResponse.json({
        answer: null,
        insufficientSources: true,
        message: "No primary source documents found for this query. Check the feed for coverage.",
      });
    }

    // 4. Build context from chunks
    const context = chunks
      .map((c, i) => `[${i + 1}] ${c.issuing_body || "Unknown body"} — ${c.document_type || "Document"}${c.date_issued ? `, ${c.date_issued}` : ""}\n${c.chunk_text}`)
      .join("\n\n");

    // 5. Call Anthropic
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: "You are Tideline's primary source research assistant. Answer questions about ocean governance using only the official documents provided — treaty text, governing body decisions, ISA publications, IMO circulars, UN resolutions. Never use outside knowledge. Never paraphrase a secondary source as if it were primary. For any claim you cannot directly ground in the provided chunks, append [please confirm source] inline. If you cannot answer from the provided chunks say so explicitly. Return prose followed by a Sources list: issuing body, document type, and date for each chunk used.",
      messages: [{ role: "user", content: `Question: ${query.trim()}\n\nPrimary source documents:\n${context}` }],
    });

    const answer = message.content[0].type === "text" ? message.content[0].text : "";

    const sources: Source[] = chunks.map(c => ({
      issuing_body: c.issuing_body,
      document_type: c.document_type,
      date_issued: c.date_issued,
      source_url: c.source_url,
    }));

    return NextResponse.json({ answer, sources, insufficientSources: false });
  } catch (err) {
    console.error("Ask error:", err);
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 });
  }
}
