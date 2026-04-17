import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// --- Types (mirrored from workspace/ask) ---

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

export interface Source {
  document_id: string | null;
  title: string;
  source_organisation: string | null;
  published_date: string | null;
  file_url: string | null;
}

export interface RAGResult {
  answer: string;
  sources: Source[];
}

// --- extractQuestion: Haiku strips signatures/quoted text ---

export async function extractQuestion(replyText: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system:
      "Extract the user's question from this email reply. Strip signatures, quoted text (lines starting with >), disclaimers, and greetings. Return ONLY the question itself, nothing else. If no clear question exists, return the core statement as a question.",
    messages: [{ role: "user", content: replyText }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return text.trim();
}

// --- queryRAG: dual-corpus vector search + Sonnet generation ---

const RAG_SYSTEM_PROMPT = `You are Tideline, an ocean governance intelligence assistant responding to a subscriber who replied to their daily brief.

Rules:
- Answer ONLY using source documents that directly address the question. Ignore tangentially related sources.
- If a source mentions the topic only in passing (one sentence, as an example, or unrelated context) do not cite it.
- Every factual claim must cite its source as [Source: title, organisation, date].
- If fewer than 2 sources directly address the question, say: "The Tideline library has limited coverage on this topic. The most relevant document found is [title]. You may want to search the library directly for more."
- Never speculate or add information beyond what the sources contain.
- Be concise. Do not pad the answer.
- Write in a tone appropriate for email — direct but not curt.`;

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

export async function queryRAG(question: string): Promise<RAGResult> {
  // 1. Embed
  const embedding = await embedQuestion(question);
  const embeddingJson = JSON.stringify(embedding);

  // 2. Parallel vector search
  const [docChunksResult, primaryChunksResult] = await Promise.all([
    supabase.rpc("match_document_chunks", {
      query_embedding: embeddingJson,
      match_threshold: 0.65,
      match_count: 15,
    }),
    supabase.rpc("match_primary_chunks", {
      query_embedding: embeddingJson,
      match_threshold: 0.62,
      match_count: 10,
    }),
  ]);

  const docChunks: DocChunkMatch[] = docChunksResult.data || [];
  const primaryChunks: PrimaryChunkMatch[] = primaryChunksResult.data || [];

  // 3. Fetch document metadata
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

  // 4. Deduplicate + merge sources
  const sources: (Source & { chunk_text: string })[] = [];
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

  // 5. No sources → early return
  if (sources.length === 0) {
    return {
      answer:
        "I could not find any relevant documents in the Tideline library to answer this question. Try asking in your workspace for a broader search.",
      sources: [],
    };
  }

  // 6. Build context + call Sonnet
  const contextBlock = sources
    .map(
      (s, i) =>
        `[Document ${i + 1}] ${s.title}${s.source_organisation ? ` — ${s.source_organisation}` : ""}${s.published_date ? ` (${s.published_date})` : ""}\n${s.chunk_text}`
    )
    .join("\n\n---\n\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: RAG_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\n--- SOURCE DOCUMENTS ---\n\n${contextBlock}`,
      },
    ],
  });

  const answer =
    msg.content[0].type === "text"
      ? msg.content[0].text
      : "No answer generated.";

  const responseSources: Source[] = sources.map((s) => ({
    document_id: s.document_id,
    title: s.title,
    source_organisation: s.source_organisation,
    published_date: s.published_date,
    file_url: s.file_url,
  }));

  return { answer, sources: responseSources };
}

// --- buildReplyHtml: matches send-brief email styling ---

export function buildReplyHtml(
  name: string,
  answer: string,
  sources: Source[]
): string {
  const F = "'DM Sans',Arial,sans-serif";

  const sourceListHtml = sources
    .map(
      (s) =>
        `<li style="font-family:${F};font-size:12px;color:#5A7290;line-height:1.5;margin-bottom:4px;">${s.title}${s.source_organisation ? ` \u2014 ${s.source_organisation}` : ""}${s.published_date ? ` (${s.published_date})` : ""}</li>`
    )
    .join("");

  const sourcesSection =
    sources.length > 0
      ? `<tr><td style="padding:0 28px 24px;">
          <p style="font-family:${F};font-size:11px;font-weight:600;color:#8BA0BC;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Sources</p>
          <ul style="margin:0;padding:0 0 0 16px;">${sourceListHtml}</ul>
        </td></tr>`
      : "";

  // Convert markdown-style citations to styled text
  const formattedAnswer = answer
    .replace(
      /\n\n/g,
      `</p><p style="font-family:${F};font-size:14px;color:#0B1628;line-height:1.7;margin:0 0 12px;">`
    )
    .replace(
      /\[Source: ([^\]]+)\]/g,
      '<span style="font-size:11px;color:#1D6FA4;">[$1]</span>'
    );

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${F};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #EAECEF;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-family:${F};font-size:18px;font-weight:700;color:#0B1628;letter-spacing:-0.02em;">Tideline</div>
                <div style="font-family:${F};font-size:10px;font-weight:500;color:#1D9E75;letter-spacing:0.18em;text-transform:uppercase;margin-top:3px;">OCEAN INTELLIGENCE</div>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <span style="font-family:${F};font-size:12px;color:#8BA0BC;">Brief reply</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <p style="font-family:${F};font-size:13px;color:#5A7290;margin:0 0 16px;">Hi ${name},</p>
          <p style="font-family:${F};font-size:14px;color:#0B1628;line-height:1.7;margin:0 0 12px;">${formattedAnswer}</p>
        </td></tr>
        ${sourcesSection}
        <tr><td style="padding:16px 28px;border-top:1px solid #EAECEF;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:${F};font-size:13px;color:#3D4F63;">Reply again to ask a follow-up, or open your workspace for deeper research.</td>
            </tr>
            <tr>
              <td style="padding-top:8px;">
                <a href="https://www.thetideline.co/platform/workspace" style="font-family:${F};font-size:12px;color:#1D6FA4;text-decoration:none;margin-right:14px;">Open workspace</a>
                <a href="https://www.thetideline.co/platform/feed" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;">Open feed</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
