import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = typeof body.tracker_slug === "string" ? body.tracker_slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "tracker_slug required" }, { status: 400 });

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  await supabase.from("tracker_page_views").insert({
    tracker_slug: slug,
    user_id: user?.id || null,
  });

  return NextResponse.json({ ok: true });
}
