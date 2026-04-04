import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface StoryInput {
  id: string;
  title: string;
  short_summary?: string | null;
  full_summary?: string | null;
}

export async function extractEntities(story: StoryInput): Promise<void> {
  try {
    const text = [
      story.title,
      story.short_summary || "",
      (story.full_summary || "").slice(0, 300),
    ]
      .filter(Boolean)
      .join(". ");

    if (text.length < 20) return;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Extract named entities from this text. Return ONLY valid JSON, no other text:\n{"organisations":[],"individuals":[],"instruments":[],"vessels":[]}\nOnly explicitly named entities. Max 10 per category. No generic terms.\n\nText: ${text}`,
        },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string[]>;

    const typeMap: Record<string, string> = {
      organisations: "organisation",
      individuals: "individual",
      instruments: "instrument",
      vessels: "vessel",
    };

    for (const [key, entityType] of Object.entries(typeMap)) {
      const names = parsed[key];
      if (!Array.isArray(names)) continue;

      for (const name of names.slice(0, 10)) {
        if (!name || typeof name !== "string" || name.length < 2) continue;
        const cleaned = name.trim();

        // Upsert entity
        const { data: entity } = await supabase
          .from("entities")
          .upsert(
            { name: cleaned, entity_type: entityType },
            { onConflict: "name,entity_type" },
          )
          .select("id")
          .single();

        if (!entity) continue;

        // Increment mention_count atomically
        await supabase.rpc("increment_entity_count", { entity_id: entity.id });

        // Insert mention
        await supabase
          .from("entity_mentions")
          .upsert(
            {
              entity_id: entity.id,
              story_id: story.id,
              context: story.title,
            },
            { onConflict: "entity_id,story_id", ignoreDuplicates: true },
          );
      }
    }
  } catch (err) {
    console.error("[Entities] Extraction error:", err);
  }
}
