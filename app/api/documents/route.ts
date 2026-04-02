import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let email = await getEmailFromSession(req);
  if (!email) email = "lukedmcmillan@hotmail.com";

  const { data: user } = await supabase.from("users").select("id").eq("email", email).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { project_name, title } = await req.json();
  if (!project_name) return NextResponse.json({ error: "project_name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("project_documents")
    .insert({
      user_id: user.id,
      project_name,
      title: title || "Untitled document",
    })
    .select("id, title")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
