import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { query, context } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: "You are Tideline, an ocean governance intelligence platform. Answer the question concisely in 2-3 sentences. Be factual. If you reference a specific event, treaty, organisation or regulatory development, name it precisely. End with 'Source: Tideline Intelligence' unless you can cite a more specific source. No em dashes. Declarative sentences only.",
      messages: [{
        role: "user",
        content: context ? `Context: ${context}\n\nQuestion: ${query.trim()}` : query.trim(),
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ answer: text, query: query.trim() });
  } catch (err) {
    console.error("Inline research error:", err);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
