import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `You are Tideline's drafting assistant. Your only job is to compile the user's notes and the summaries of their attached sources into a single coherent draft.

Strict rules:
1. Use ONLY content present in the user's notes and the provided source summaries. Do not introduce facts, claims, statistics, names, dates, or context that are not in the input.
2. Do not speculate, hedge with opinions, or add commentary. No phrases like "it is worth noting", "however, it", "on the other hand", "some experts argue", "it has been suggested", "there are concerns", "various stakeholders", "it should be noted".
3. Preserve the user's voice. The notes are the spine; sources support the notes.
4. Structure the draft to fit the requested format and tone.
5. No em dashes anywhere. Use commas, full stops, or restructure.
6. Output plain prose only. Use simple paragraph breaks. Use H1 and H2 markdown headings (# and ##) for structure if the format calls for it.
7. Do not invent a headline if the notes do not provide one. Use the project name as a working title only.
8. End the draft cleanly. No closing summary or call to action unless the notes contain one.`;

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name: id } = await params;
  const { notes, sources, format, tone, projectName } = await req.json();

  const sourceBlock = Array.isArray(sources) && sources.length > 0
    ? sources.map((s: { name: string; summary?: string }, i: number) => `Source ${i + 1}: ${s.name}\n${s.summary || ""}`).join("\n\n")
    : "(no sources attached)";

  const userPrompt = `Project: ${projectName || "Untitled"}
Format: ${format || "Briefing"}
Tone: ${tone || "Journalistic"}

User notes:
${notes || "(no notes provided)"}

Attached source summaries:
${sourceBlock}

Compile a draft now following the rules.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("\n")
    .replace(/—/g, ", ");

  const { data, error } = await supabase
    .from("project_drafts")
    .upsert(
      {
        project_id: id,
        content,
        format: format || null,
        tone: tone || null,
        title: projectName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    )
    .select("id, content, format, tone, title")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
}
