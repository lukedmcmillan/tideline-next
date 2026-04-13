import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, document_id, created_at")
    .eq("user_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

export async function PATCH(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { notification_id } = await req.json();
  if (!notification_id) {
    return NextResponse.json({ error: "Missing notification_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notification_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
