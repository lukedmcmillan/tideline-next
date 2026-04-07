import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { story_id, action } = await req.json();
  if (!story_id || !action) {
    return NextResponse.json({ error: "Missing story_id or action" }, { status: 400 });
  }

  const adminEmail = token.email as string;
  const now = new Date().toISOString();

  let newStatus: string;
  if (action === "approve") newStatus = "live";
  else if (action === "dismiss") newStatus = "source_unavailable";
  else if (action === "demote") newStatus = "pending_review";
  else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error } = await supabase
    .from("stories")
    .update({
      status: newStatus,
      overridden_at: now,
      overridden_by: adminEmail,
    })
    .eq("id", story_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
