import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project_id } = await req.json();
  if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  // Verify ownership
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Fetch non-dismissed entries
  const { data: entries } = await supabase
    .from("project_auto_entries")
    .select("content, entry_type, inserted_at")
    .eq("project_id", project_id)
    .eq("dismissed", false)
    .order("inserted_at", { ascending: true })
    .limit(30);

  const count = entries?.length || 0;
  if (count < 3) {
    return NextResponse.json({ narrative: null, entry_count: count });
  }

  // Build prompt
  const entryText = entries!
    .map((e, i) => `${i + 1}. [${e.entry_type || "entry"}] ${e.content}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are an intelligence analyst. Based ONLY on these filed entries, write a 3-paragraph narrative:\n\nPara 1: What happened chronologically.\nPara 2: What the pattern suggests.\nPara 3: What to watch next.\n\nUse only these entries. No speculation. Plain prose. Maximum 200 words.\n\nEntries:\n${entryText}`,
      },
    ],
  });

  const narrative =
    msg.content[0].type === "text" ? msg.content[0].text : "";

  // Save to projects
  const now = new Date().toISOString();
  await supabase
    .from("projects")
    .update({ narrative_summary: narrative, narrative_updated_at: now })
    .eq("id", project_id);

  return NextResponse.json({
    narrative,
    updated_at: now,
    entry_count: count,
  });
}
