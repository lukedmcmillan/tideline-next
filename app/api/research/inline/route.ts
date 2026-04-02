import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

function isPrimary(sourceType: string): boolean {
  return sourceType === "gov" || sourceType === "reg";
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, context } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    // 1. Generate query embedding
    const embedding = await getEmbedding(query.trim());

    let sources: { title: string; source_name: string; published_at: string; link: string; source_type: string; similarity: number }[] = [];
    let sourcesContext = "";

    if (embedding) {
      // 2. Semantic search via RPC
      const { data: matches } = await supabase.rpc("match_documents", {
        query_embedding: JSON.stringify(embedding),
        match_count: 8,
      });

      if (matches && matches.length > 0) {
        // 3. Join with stories table
        const storyIds = matches.map((m: { story_id: string }) => m.story_id);
        const { data: stories } = await supabase
          .from("stories")
          .select("id, title, source_name, published_at, short_summary, link, source_type")
          .in("id", storyIds);

        if (stories && stories.length > 0) {
          const storyMap = new Map(stories.map((s) => [s.id, s]));
          const similarityMap = new Map(matches.map((m: { story_id: string; similarity: number }) => [m.story_id, m.similarity]));

          // Build sources array ordered by similarity
          sources = matches
            .map((m: { story_id: string; similarity: number }) => {
              const s = storyMap.get(m.story_id);
              if (!s) return null;
              return {
                title: s.title,
                source_name: s.source_name,
                published_at: s.published_at,
                link: s.link,
                source_type: s.source_type,
                similarity: m.similarity,
              };
            })
            .filter(Boolean);

          // 4. Build sources context block
          sourcesContext = sources
            .map((s, i) => {
              const date = new Date(s.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              const tier = isPrimary(s.source_type) ? "PRIMARY" : "SECONDARY";
              return `${i + 1}. [${tier}] "${s.title}" — ${s.source_name}, ${date}\n   ${s.short_summary || "(no summary)"}`;
            })
            .join("\n\n");
        }
      }
    }

    // 5. Call Claude with RAG context
    const systemPrompt = sourcesContext
      ? "You are Tideline's research assistant. Answer questions about ocean governance, policy, regulation, and finance using only the provided Tideline sources. Cite sources by name. Distinguish between primary sources (government, regulatory bodies) and secondary sources (media, NGOs). Never fabricate information. If the sources don't contain enough information to answer, say so directly."
      : "You are Tideline, an ocean governance intelligence platform. Answer the question concisely in 2-3 sentences. Be factual. If you reference a specific event, treaty, organisation or regulatory development, name it precisely. No em dashes. Declarative sentences only.";

    const userMessage = sourcesContext
      ? `Question: ${query.trim()}${context ? `\n\nAdditional context: ${context}` : ""}\n\nTideline sources:\n${sourcesContext}\n\nAnswer the question using these sources only. Cite which sources you used.`
      : context ? `Context: ${context}\n\nQuestion: ${query.trim()}` : query.trim();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ answer: text, query: query.trim(), sources });
  } catch (err) {
    console.error("Inline research error:", err);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
