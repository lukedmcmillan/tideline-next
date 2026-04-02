import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(req: NextRequest): Promise<string | null> {
  let email = await getEmailFromSession(req);
  if (!email) email = "lukedmcmillan@hotmail.com";
  const { data } = await supabase.from("users").select("id").eq("email", email).single();
  return data?.id || null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ projects: [] });

  // Fetch from projects table
  const { data: projRows } = await supabase
    .from("projects")
    .select("id, name, project_type, topic_tags, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!projRows || projRows.length === 0) {
    // Fallback: check saved_stories for legacy implicit projects
    const { data: savedRows } = await supabase
      .from("saved_stories")
      .select("project_name")
      .eq("user_id", userId);

    if (!savedRows || savedRows.length === 0) return NextResponse.json({ projects: [] });

    const counts = new Map<string, number>();
    for (const row of savedRows) {
      if (row.project_name === "library") continue;
      counts.set(row.project_name, (counts.get(row.project_name) || 0) + 1);
    }

    const projects = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ projects });
  }

  const projects = projRows.map(p => ({ id: p.id, name: p.name, project_type: p.project_type, count: 0 }));
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    console.log("[Projects POST] userId:", userId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, project_type } = body;
    console.log("[Projects POST] body:", JSON.stringify(body));
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    // Create project row
    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: name.trim(), project_type: project_type || null })
      .select("id")
      .single();

    console.log("[Projects POST] project:", project, "error:", projError);
    if (projError) return NextResponse.json({ error: projError.message }, { status: 500 });

    // Create anchor document
    const { data: doc, error: docError } = await supabase
      .from("project_documents")
      .insert({ user_id: userId, project_id: project.id, project_name: name.trim(), title: "Project brief" })
      .select("id")
      .single();

    console.log("[Projects POST] doc:", doc, "error:", docError);
    if (docError) return NextResponse.json({ error: docError.message }, { status: 500 });

    return NextResponse.json({ project_id: project.id, project: name.trim(), document_id: doc.id });
  } catch (err) {
    console.error("[Projects POST] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
