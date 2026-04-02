import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SearchResult {
  id: string;
  story_id: string;
  content: string;
  similarity: number;
}

export async function searchSimilarStories(
  queryEmbedding: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: limit,
  });

  if (error) {
    console.error("[Search] RPC error:", error);
    return [];
  }

  return data || [];
}
