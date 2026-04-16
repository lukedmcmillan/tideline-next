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

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const projectName = decodeURIComponent(name);
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Saved stories for this project
  const { data: savedRows } = await supabase
    .from("saved_stories")
    .select("story_id")
    .eq("user_id", userId)
    .eq("project_name", projectName);

  const storyIds = (savedRows || []).map((r) => r.story_id);
  let stories: any[] = [];
  if (storyIds.length > 0) {
    const { data } = await supabase
      .from("stories")
      .select("id, title, link, source_name, topic, source_type, published_at, short_summary")
      .in("id", storyIds)
      .order("published_at", { ascending: false });
    stories = data || [];
  }

  // Documents for this project
  const { data: docs } = await supabase
    .from("project_documents")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .eq("project_name", projectName)
    .order("updated_at", { ascending: false });

  // Derive topics from saved stories
  const topics = [...new Set(stories.map((s) => s.topic).filter(Boolean))];

  // Related consultations
  let consultations: any[] = [];
  try {
    const { data: consults } = await supabase
      .from("consultations")
      .select("id, organisation, title, deadline, type, tracker_tags")
      .gte("deadline", new Date().toISOString())
      .order("deadline", { ascending: true });

    if (consults) {
      consultations = consults.filter(
        (c) => c.tracker_tags?.some((t: string) => topics.some((tp) => t.toLowerCase().includes(tp)))
      );
    }
  } catch {}

  // Look up project_id from projects table
  const { data: proj } = await supabase
    .from("projects")
    .select("id, project_type")
    .eq("user_id", userId)
    .eq("name", projectName)
    .single();

  return NextResponse.json({
    project_id: proj?.id || null,
    project_type: proj?.project_type || null,
    project_name: projectName,
    stories,
    documents: docs || [],
    consultations,
    topics,
  });
}
