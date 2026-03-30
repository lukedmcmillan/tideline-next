import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are Tideline, an ocean intelligence platform. Answer concisely in 2-3 sentences with a source reference if possible. Draw on your knowledge of ocean governance, ISA, BBNJ, IUU fishing, blue finance, IMO shipping regulations. No em dashes. Declarative sentences only.\n\nQuestion: ${query.trim()}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("Inline research error:", err);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
