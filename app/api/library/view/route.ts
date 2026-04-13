import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { document_id } = await req.json();
  if (!document_id) {
    return NextResponse.json({ error: "Missing document_id" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("document_views")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_id", document_id)
    .gte("viewed_at", twentyFourHoursAgo)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("document_views").insert({
    user_id: user.id,
    document_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
