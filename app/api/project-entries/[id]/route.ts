import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  // 1. Auth — resolve caller identity
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { data: user } = await supabase.from("users").select("id").eq("email", email).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 2. Ownership check — SELECT user_id FROM projects WHERE id = $1, compare to user.id.
  //    This MUST run before the SECURITY DEFINER RPC below. If this returns null
  //    the caller does not own this project and we return 404.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // 3. Atomic last_viewed_at update.
  //    touch_project_viewed is SECURITY DEFINER (bypasses RLS). The ownership
  //    check above is the only authorisation gate — it MUST precede this call.
  //    Returns the previous last_viewed_at, or -infinity for first-ever visit
  //    (so all entries compare as new on a freshly created project).
  const { data: prevTs, error: rpcError } = await supabase.rpc("touch_project_viewed", {
    p_project_id: projectId,
  });

  if (rpcError) {
    console.error("[project-entries] touch_project_viewed RPC failed:", rpcError.message);
    return NextResponse.json({ error: "Failed to update view timestamp" }, { status: 500 });
  }

  const prevViewedAt: string = prevTs as string;

  // 4. Fetch entries
  const { data: entries, error } = await supabase
    .from("project_auto_entries")
    .select("id, story_id, entry_type, content, matched_entity_id, auto_inserted, reviewed, inserted_at")
    .eq("project_id", projectId)
    .order("inserted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 5a. Enrich with story metadata (title, source, date, link)
  const storyIds = (entries || []).map(e => e.story_id).filter(Boolean);
  let storyMap = new Map<string, Record<string, unknown>>();

  if (storyIds.length > 0) {
    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, source_name, published_at, link")
      .in("id", storyIds);

    if (stories) storyMap = new Map(stories.map(s => [s.id, s]));
  }

  // 5b. Resolve matched entity names for entity_match rows
  const matchedEntityIds = (entries || []).map(e => e.matched_entity_id).filter(Boolean);
  let entityNameMap = new Map<string, string>();

  if (matchedEntityIds.length > 0) {
    const { data: entityRows } = await supabase
      .from("entities")
      .select("id, name")
      .in("id", matchedEntityIds);

    if (entityRows) entityNameMap = new Map(entityRows.map(e => [e.id, e.name]));
  }

  const result = (entries || []).map(e => {
    const story = storyMap.get(e.story_id);
    return {
      ...e,
      story_title: story?.title ?? null,
      story_source: story?.source_name ?? null,
      story_date: story?.published_at ?? null,
      story_link: story?.link ?? null,
      matched_entity_name: e.matched_entity_id ? (entityNameMap.get(e.matched_entity_id) ?? null) : null,
    };
  });

  // 6. Compute new_count server-side: entries inserted after the previous view.
  //    Parse both sides to Date to avoid lexical string comparison pitfalls.
  const prevTime = new Date(prevViewedAt).getTime();
  const newCount = result.filter(e => new Date(e.inserted_at).getTime() > prevTime).length;

  return NextResponse.json({
    entries: result,
    new_count: newCount,
    prev_viewed_at: prevViewedAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await req.json();
  const { entry_id } = body;
  if (!entry_id) return NextResponse.json({ error: "entry_id required" }, { status: 400 });

  const update: Record<string, boolean> = {};
  if (body.reviewed  !== undefined) update.reviewed  = body.reviewed;
  if (body.accepted  !== undefined) update.accepted  = body.accepted;
  if (body.dismissed !== undefined) update.dismissed = body.dismissed;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("project_auto_entries")
    .update(update)
    .eq("id", entry_id)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
