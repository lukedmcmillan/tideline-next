import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: [text],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json();
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  const embedding = await getEmbedding(query.trim());
  if (!embedding) {
    return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
  }

  const { data: matches, error: rpcError } = await supabase.rpc("match_documents", {
    query_embedding: JSON.stringify(embedding),
    match_count: 10,
  });

  if (rpcError) {
    console.error("[Search] RPC error:", rpcError);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const storyIds = matches.map((m: { story_id: string }) => m.story_id);
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("id, title, source_name, published_at, short_summary, link")
    .in("id", storyIds);

  if (storiesError) {
    console.error("[Search] Stories fetch error:", storiesError);
    return NextResponse.json({ error: "Failed to fetch story details" }, { status: 500 });
  }

  const storyMap = new Map((stories || []).map((s) => [s.id, s]));

  const results = matches
    .map((m: { story_id: string; similarity: number }) => {
      const story = storyMap.get(m.story_id);
      if (!story) return null;
      return {
        story_id: m.story_id,
        title: story.title,
        source_name: story.source_name,
        published_at: story.published_at,
        short_summary: story.short_summary,
        link: story.link,
        similarity: m.similarity,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ results });
}
