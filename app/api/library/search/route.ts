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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const type = req.nextUrl.searchParams.get("type")?.trim() || "";

  let query = supabase
    .from("documents")
    .select("id, title, source_organisation, document_type, published_date, topic_tags, region_tags, file_size_bytes, created_at")
    .eq("status", "approved")
    .eq("is_public", true);

  if (type) {
    query = query.eq("document_type", type);
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,source_organisation.ilike.%${q}%`);
  }

  query = query.order("created_at", { ascending: false }).limit(20);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data, count: data?.length || 0 });
}
