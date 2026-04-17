import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { userIdFromEmail, ALL_SLUGS } from "@/app/lib/user-preferences";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_SLUGS = new Set(ALL_SLUGS);
const MIN_TOPICS = 1;
const MAX_TOPICS = 5;

// GET /api/user/topics — returns current user's selected tracker slugs
export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await userIdFromEmail(email);
  if (!userId) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("user_topics")
    .select("tracker_slug")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return slugs, or empty array (caller interprets empty as "all 10")
  return NextResponse.json({ slugs: (data || []).map(r => r.tracker_slug) });
}

// PUT /api/user/topics — replace user's selected tracker slugs atomically
// Body: { slugs: string[] } where 1 <= slugs.length <= 5
export async function PUT(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await userIdFromEmail(email);
  if (!userId) return NextResponse.json({ error: "user not found" }, { status: 404 });

  let body: { slugs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!Array.isArray(body.slugs)) {
    return NextResponse.json({ error: "slugs must be an array" }, { status: 400 });
  }
  const slugs = body.slugs.filter((s): s is string => typeof s === "string" && VALID_SLUGS.has(s));
  const unique = [...new Set(slugs)];

  if (unique.length < MIN_TOPICS) {
    return NextResponse.json({ error: `at least ${MIN_TOPICS} domain required` }, { status: 400 });
  }
  if (unique.length > MAX_TOPICS) {
    return NextResponse.json({ error: `maximum ${MAX_TOPICS} domains allowed` }, { status: 400 });
  }

  // Atomic replace: delete existing + insert new
  const { error: delErr } = await supabase
    .from("user_topics")
    .delete()
    .eq("user_id", userId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const rows = unique.map(slug => ({ user_id: userId, tracker_slug: slug }));
  const { error: insErr } = await supabase
    .from("user_topics")
    .insert(rows);

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ slugs: unique });
}
