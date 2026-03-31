import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateEmbedding(text: string): Promise<number[]> {
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
  });

  if (!res.ok) {
    throw new Error(`Jina embedding failed: ${res.status}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function searchPrimaryChunks(
  embedding: number[],
  matchThreshold: number,
  matchCount: number
): Promise<
  {
    chunk_text: string;
    issuing_body: string | null;
    document_type: string | null;
    date_issued: string | null;
    source_url: string | null;
    similarity: number;
  }[]
> {
  const { data, error } = await supabase.rpc("match_primary_chunks", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw new Error(error.message);
  return data || [];
}
