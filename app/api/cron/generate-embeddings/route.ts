import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let storiesProcessed = 0;
  let embeddingsCreated = 0;

  try {
    // Fetch stories without embeddings
    const { data: stories, error: fetchError } = await supabase
      .from("stories")
      .select("id, title, short_summary")
      .not("short_summary", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      errors.push(`Fetch error: ${fetchError.message}`);
      await logRun(0, 0, errors.join("; "));
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!stories || stories.length === 0) {
      console.log("[Embeddings] No stories found");
      await logRun(0, 0, null);
      return NextResponse.json({ stories_processed: 0, embeddings_created: 0 });
    }

    // Filter out stories that already have embeddings
    const storyIds = stories.map((s) => s.id);
    const { data: existing } = await supabase
      .from("embeddings")
      .select("story_id")
      .in("story_id", storyIds);

    const existingIds = new Set((existing || []).map((e) => e.story_id));
    const toProcess = stories.filter((s) => !existingIds.has(s.id));

    if (toProcess.length === 0) {
      console.log("[Embeddings] All stories already have embeddings");
      await logRun(0, 0, null);
      return NextResponse.json({ stories_processed: 0, embeddings_created: 0 });
    }

    console.log(`[Embeddings] Processing ${toProcess.length} stories`);

    for (const story of toProcess) {
      storiesProcessed++;
      const content = `${story.title}. ${story.short_summary}`;

      try {
        const embedding = await getEmbedding(content);

        if (!embedding) {
          errors.push(`No embedding for "${story.title}"`);
          console.error(`[Embeddings] Failed to get embedding for "${story.title}"`);
          continue;
        }

        const { error: insertError } = await supabase
          .from("embeddings")
          .insert({
            story_id: story.id,
            content,
            embedding: JSON.stringify(embedding),
          });

        if (insertError) {
          errors.push(`Insert error for "${story.title}": ${insertError.message}`);
          continue;
        }

        embeddingsCreated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Story "${story.title}": ${msg}`);
        console.error(`[Embeddings] Error for "${story.title}":`, msg);
      }
    }

    console.log(`[Embeddings] Done. Processed: ${storiesProcessed}, Created: ${embeddingsCreated}`);
    await logRun(storiesProcessed, embeddingsCreated, errors.length > 0 ? errors.join("; ") : null);

    return NextResponse.json({
      stories_processed: storiesProcessed,
      embeddings_created: embeddingsCreated,
      errors: errors.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error("[Embeddings] Fatal error:", msg);
    await logRun(storiesProcessed, embeddingsCreated, errors.join("; "));
    return NextResponse.json({ error: "Embeddings generation failed" }, { status: 500 });
  }
}

async function logRun(storiesProcessed: number, embeddingsCreated: number, errorText: string | null) {
  await supabase.from("cron_log").insert({
    agent_name: "generate-embeddings",
    stories_processed: storiesProcessed,
    events_created: embeddingsCreated,
    errors: errorText,
  });
}
