import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project_id, content } = await req.json();
  if (!project_id || !content?.trim()) {
    return NextResponse.json({ error: "project_id and content required" }, { status: 400 });
  }

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

  const { error } = await supabase
    .from("project_auto_entries")
    .insert({
      project_id,
      entry_type: "STRONG",
      content: content.trim(),
      auto_inserted: false,
      reviewed: true,
    });

  if (error) {
    console.error("[QuickNote] Insert error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
