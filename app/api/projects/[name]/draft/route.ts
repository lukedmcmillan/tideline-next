import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name: id } = await params;
  const { data, error } = await supabase
    .from("project_drafts")
    .select("id, project_id, title, content, format, tone, updated_at")
    .eq("project_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name: id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = { project_id: id, updated_at: new Date().toISOString() };
  if (typeof body.content === "string") update.content = body.content;
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.format === "string") update.format = body.format;
  if (typeof body.tone === "string") update.tone = body.tone;

  const { data, error } = await supabase
    .from("project_drafts")
    .upsert(update, { onConflict: "project_id" })
    .select("id, project_id, title, content, format, tone, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: data });
}
