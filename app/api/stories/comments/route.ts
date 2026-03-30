import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get("story_id");
  if (!storyId) return NextResponse.json({ comments: [] });

  const { data, error } = await supabase
    .from("story_comments")
    .select("id, comment, created_at, user_id")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ comments: [] });

  // Resolve user emails for initials
  const userIds = [...new Set((data || []).map((c) => c.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, email")
    .in("id", userIds);

  const emailMap = new Map((users || []).map((u) => [u.id, u.email]));
  const comments = (data || []).map((c) => ({
    id: c.id,
    comment: c.comment,
    created_at: c.created_at,
    user_email: emailMap.get(c.user_id) || null,
  }));

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { story_id, comment } = await req.json();
  if (!story_id || !comment?.trim()) {
    return NextResponse.json({ error: "story_id and comment required" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("story_comments")
    .insert({ story_id, user_id: user.id, comment: comment.trim() })
    .select("id, comment, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    comment: { ...data, user_email: email },
  });
}
