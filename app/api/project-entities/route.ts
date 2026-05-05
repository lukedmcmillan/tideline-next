import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Resolve email from session → internal user id
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const email = await getEmailFromSession(req);
  if (!email) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return user?.id ?? null;
}

// Explicit ownership gate — SELECT user_id FROM projects WHERE id = $1
// and compare to the authenticated user. Returns false if project not found.
async function userOwnsProject(projectId: string, userId: string): Promise<boolean> {
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();
  return project?.user_id === userId;
}

// GET /api/project-entities?project_id=<uuid>
// Returns entities tracked by this project joined with name + entity_type.
export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  // 1. Auth
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Ownership check
  const owns = await userOwnsProject(projectId, userId);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 3. Fetch project_entities joined with entity name + type
  const { data, error } = await supabase
    .from("project_entities")
    .select("id, entity_id, created_at, entities(id, name, entity_type)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project_entities: data || [] });
}

// POST /api/project-entities  { project_id, entity_id }
// Adds an entity to a project. Max 10 per project. UNIQUE constraint
// on (project_id, entity_id) — duplicate insert returns 409.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { project_id, entity_id } = body ?? {};
  if (!project_id || !entity_id) {
    return NextResponse.json({ error: "project_id and entity_id required" }, { status: 400 });
  }

  // 1. Auth
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Ownership check
  const owns = await userOwnsProject(project_id, userId);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 3. Max-10 guard
  const { count, error: countError } = await supabase
    .from("project_entities")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project_id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Max 10 entities per project" }, { status: 422 });
  }

  // 4. Insert — DB UNIQUE constraint catches duplicates
  const { error } = await supabase
    .from("project_entities")
    .insert({ project_id, entity_id });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Entity already tracked" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/project-entities  { project_id, entity_id }
// Removes an entity from a project.
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { project_id, entity_id } = body ?? {};
  if (!project_id || !entity_id) {
    return NextResponse.json({ error: "project_id and entity_id required" }, { status: 400 });
  }

  // 1. Auth
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Ownership check
  const owns = await userOwnsProject(project_id, userId);
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 3. Delete
  const { error } = await supabase
    .from("project_entities")
    .delete()
    .eq("project_id", project_id)
    .eq("entity_id", entity_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
