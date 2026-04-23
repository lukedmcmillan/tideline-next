import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/entities/track — add entity to user_entities
export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const entity_id = body?.entity_id;
  if (!entity_id || typeof entity_id !== "string") {
    return NextResponse.json({ error: "entity_id required" }, { status: 400 });
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("user_entities")
    .insert({ user_id: userRow.id, entity_id })
    .select()
    .single();

  if (error && error.code !== "23505") {
    // 23505 = unique violation (already tracking) — treat as success
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/entities/track — remove entity from user_entities
export async function DELETE(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const entity_id = body?.entity_id;
  if (!entity_id || typeof entity_id !== "string") {
    return NextResponse.json({ error: "entity_id required" }, { status: 400 });
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("user_entities")
    .delete()
    .eq("user_id", userRow.id)
    .eq("entity_id", entity_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
