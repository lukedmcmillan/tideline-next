import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(req: NextRequest): Promise<string | null> {
  const email = await getEmailFromSession(req);
  if (!email) return null;
  const { data } = await supabase.from("users").select("id").eq("email", email).single();
  return data?.id || null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ projects: [] });

  const { data } = await supabase
    .from("saved_stories")
    .select("project_name")
    .eq("user_id", userId);

  if (!data || data.length === 0) return NextResponse.json({ projects: [] });

  const counts = new Map<string, number>();
  for (const row of data) {
    if (row.project_name === "library") continue;
    counts.set(row.project_name, (counts.get(row.project_name) || 0) + 1);
  }

  const projects = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  // Create a document as the project anchor
  const { data, error } = await supabase
    .from("project_documents")
    .insert({ user_id: userId, project_name: name.trim(), title: "Project brief" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: name.trim(), document_id: data.id });
}
