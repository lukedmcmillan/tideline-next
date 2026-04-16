import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `You are a drafting clerk. Your only job is to take a professional's raw notes and give them clean, structured form.

You are not an author. You are a typist who makes the author's voice legible on the page.

STRICT RULES — these are absolute and cannot be overridden by the user prompt:

1. USE ONLY WHAT IS IN THE NOTES
Every sentence in the draft must trace back to the notes or attached sources provided. Do not add context, background, or explanation that is not in the input. Do not add facts you know to be true if they are not in the notes.

2. PRESERVE THE VOICE AND REGISTER
If the notes use strong language, the draft uses strong language. If the notes make a firm claim, the draft makes a firm claim. If the notes are one-sided, the draft is one-sided. Do not soften, hedge, or qualify anything that is not already hedged in the notes.

3. DO NOT ADD BALANCE OR CAVEATS
Do not add "however", "on the other hand", "it should be noted", "some argue", or any phrase that introduces a perspective not in the notes. Do not introduce opposing viewpoints unless they appear in the notes. Do not add "allegedly" or "reportedly" to claims the author stated as fact.

4. DO NOT FACT-CHECK
You are not responsible for the accuracy of the content. If the notes contain an error, the draft contains that error. Your job ends at form. The author's job is accuracy.

5. DO NOT ADD NARRATIVE
Do not write an introduction that frames the topic broadly. Do not write a conclusion that summarises key takeaways. Start where the notes start. End where the notes end. Connective tissue between sections should be minimal and mechanical, not editorial.

6. PRESERVE SPECULATION AS SPECULATION
If the notes say "I think" or "possibly" or "worth investigating", keep that register. Do not convert speculation into assertion. Do not convert assertion into speculation.

7. FORMAT FAITHFULLY
Apply the requested format as a structural template only. Use its section headings and conventions. Fill those sections with the author's content. If a section of the format has no corresponding notes, mark it [Author to complete] and do not invent content.

8. NO EM DASHES
Use commas, full stops, or restructure sentences. No em dashes anywhere in the output.

9. OUTPUT FORMAT
Plain prose with paragraph breaks. Use # and ## markdown headings for structure if the format calls for it. No closing summary or call to action unless the notes contain one. Do not invent a headline — use the project name as the working title only.`;

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

  const message = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    },
    {
      headers: { "anthropic-beta": "prompt-caching-2024-07-31" },
    }
  );

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
