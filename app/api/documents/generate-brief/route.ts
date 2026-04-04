import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const TOPIC_MAP: Record<string, string[]> = {
  isa: ["dsm"], mining: ["dsm"], "deep-sea": ["dsm"],
  bbnj: ["governance"], treaty: ["governance"], governance: ["governance"],
  iuu: ["iuu"], fishing: ["iuu", "fisheries"], fisheries: ["fisheries"],
  mpa: ["mpa"], "30x30": ["mpa"],
  finance: ["bluefinance"], bond: ["bluefinance"], blue: ["bluefinance"],
  shipping: ["shipping"], imo: ["shipping"],
  climate: ["climate"], ocean: ["all"],
};

function detectTopics(keywords: string[]): string[] {
  const topics = new Set<string>();
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    for (const [key, vals] of Object.entries(TOPIC_MAP)) {
      if (lower.includes(key)) vals.forEach(v => topics.add(v));
    }
  }
  return topics.size > 0 ? [...topics] : ["governance", "dsm"];
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabase.from("users").select("id").eq("email", email).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { document_id, topic_keywords } = await req.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  const topics = detectTopics(topic_keywords || []);

  // Fetch recent summarised stories
  const { data: stories } = await supabase
    .from("stories")
    .select("title, source_name, short_summary, topic, published_at")
    .in("topic", topics)
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(8);

  if (!stories || stories.length === 0) {
    return NextResponse.json({ error: "No stories found for these topics" }, { status: 404 });
  }

  const topicLabel = topic_keywords?.join(", ") || topics.join(", ");
  const storyContext = stories.map((s, i) =>
    `${i + 1}. "${s.title}" (${s.source_name}, ${new Date(s.published_at).toLocaleDateString("en-GB")})\n   ${s.short_summary}`
  ).join("\n\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are Tideline. Generate a one-page situation report as a starting brief for a professional working on ${topicLabel}. Use the provided stories as your sources. Format with:

Overview (2 paragraphs)
Key Developments (bullet points, cite source by name)
What to Watch (3 bullets)

Be factual. Cite sources by name. No em dashes. Declarative sentences only. No hedging.

STORIES:
${storyContext}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Convert to TipTap JSON
    const lines = text.split("\n").filter(l => l.trim());
    const tiptapContent: any[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ") || trimmed === "Overview" || trimmed === "Key Developments" || trimmed === "What to Watch") {
        tiptapContent.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: trimmed.replace(/^#+\s*/, "") }] });
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        tiptapContent.push({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: trimmed.slice(2) }] }] }] });
      } else {
        tiptapContent.push({ type: "paragraph", content: [{ type: "text", text: trimmed }] });
      }
    }

    const content = { type: "doc", content: tiptapContent };

    // Update document
    await supabase
      .from("project_documents")
      .update({ content, content_text: text, updated_at: new Date().toISOString() })
      .eq("id", document_id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, content });
  } catch (err) {
    console.error("Generate brief error:", err);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
