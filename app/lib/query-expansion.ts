import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ExpandedQuery {
  original: string;
  concepts: string[];
  variations: string[];
  timeframe: string | null;
  geography: string | null;
}

export async function expandQuery(originalQuery: string): Promise<ExpandedQuery> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: [{
        type: "text",
        text: `You expand natural language questions into search terms for an ocean governance document library. Return JSON only, no markdown.`,
        cache_control: { type: "ephemeral" },
      }],
      messages: [{
        role: "user",
        content: `User question: "${originalQuery}"

Return this exact JSON structure:
{
  "concepts": ["5-7 official/technical terms that would appear in regulatory or policy documents on this topic"],
  "variations": [
    "technical/formal rephrasing of the question",
    "policy/regulatory rephrasing",
    "enforcement/compliance rephrasing"
  ],
  "timeframe": "extracted timeframe or null",
  "geography": "extracted geography or null"
}

Examples of good concept expansion:
- "fishing regulation issues" → ["fisheries management framework", "catch quota allocation", "IUU fishing enforcement", "flag state compliance", "RFMO governance", "stock assessment methodology"]
- "shipping pollution problems" → ["MARPOL compliance", "ballast water management", "sulphur emission limits", "marine pollution prevention", "IMO regulations", "port state control"]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return {
      original: originalQuery,
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.slice(0, 7) : [],
      variations: Array.isArray(parsed.variations) ? parsed.variations.slice(0, 3) : [],
      timeframe: parsed.timeframe || null,
      geography: parsed.geography || null,
    };
  } catch (err) {
    console.error("[query-expansion] Failed, using original query:", err);
    return {
      original: originalQuery,
      concepts: [],
      variations: [],
      timeframe: null,
      geography: null,
    };
  }
}

export interface ScoredChunk {
  chunk_text: string;
  similarity: number;
  relevanceScore: number;
  document_id?: string | null;
  chunk_index?: number;
  issuing_body?: string | null;
  document_type?: string | null;
  date_issued?: string | null;
  source_url?: string | null;
  searchStrategy: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "about", "what", "how", "why",
  "when", "where", "which", "who", "has", "have", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "can",
  "this", "that", "these", "those", "it", "its", "been", "being",
  "last", "over", "past", "and", "or", "but", "not", "any", "some",
  "many", "much", "most", "more", "very", "than",
]);

export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

const AUTHORITATIVE_BODIES = ["IMO", "FAO", "ISA", "UNCLOS", "UNEP", "CBD", "CITES", "IWC", "OECD", "CCAMLR"];

export function scoreChunk(
  chunk: { chunk_text: string; similarity: number; date_issued?: string | null; issuing_body?: string | null },
  originalQuery: string
): number {
  let score = chunk.similarity || 0;

  const queryWords = extractKeywords(originalQuery);
  const chunkLower = chunk.chunk_text.toLowerCase();
  const exactMatches = queryWords.filter((w) => chunkLower.includes(w)).length;
  if (queryWords.length > 0) {
    score += (exactMatches / queryWords.length) * 0.2;
  }

  if (chunk.date_issued) {
    try {
      const docYear = new Date(chunk.date_issued).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - docYear <= 5) score += 0.1;
    } catch { /* ignore bad dates */ }
  }

  if (chunk.issuing_body) {
    if (AUTHORITATIVE_BODIES.some((b) => chunk.issuing_body!.includes(b))) {
      score += 0.15;
    }
  }

  return score;
}

export function deduplicateChunks<T extends { chunk_text: string }>(chunks: T[]): T[] {
  const seen = new Set<string>();
  return chunks.filter((c) => {
    const key = c.chunk_text.slice(0, 120);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
