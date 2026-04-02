import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  let email = await getEmailFromSession(req);
  if (!email) email = "lukedmcmillan@hotmail.com";

  const { data: user } = await supabase.from("users").select("id").eq("email", email).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: entries, error } = await supabase
    .from("project_auto_entries")
    .select("id, story_id, entry_type, content, auto_inserted, reviewed, inserted_at")
    .eq("project_id", projectId)
    .order("inserted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const storyIds = (entries || []).map(e => e.story_id);
  let storyMap = new Map<string, any>();

  if (storyIds.length > 0) {
    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, source_name, published_at, link")
      .in("id", storyIds);

    if (stories) storyMap = new Map(stories.map(s => [s.id, s]));
  }

  const result = (entries || []).map(e => {
    const story = storyMap.get(e.story_id);
    return {
      ...e,
      story_title: story?.title || null,
      story_source: story?.source_name || null,
      story_date: story?.published_at || null,
      story_link: story?.link || null,
    };
  });

  return NextResponse.json({ entries: result });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  let email = await getEmailFromSession(req);
  if (!email) email = "lukedmcmillan@hotmail.com";

  const body = await req.json();
  const { entry_id } = body;
  if (!entry_id) return NextResponse.json({ error: "entry_id required" }, { status: 400 });

  const update: Record<string, boolean> = {};
  if (body.reviewed !== undefined) update.reviewed = body.reviewed;
  if (body.accepted !== undefined) update.accepted = body.accepted;
  if (body.dismissed !== undefined) update.dismissed = body.dismissed;

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { error } = await supabase
    .from("project_auto_entries")
    .update(update)
    .eq("id", entry_id)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
