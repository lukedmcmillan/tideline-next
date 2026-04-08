import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ entities: [] });

  const { data, error } = await supabase
    .from("entities")
    .select("id, name, entity_type, mention_count")
    .ilike("name", `%${q}%`)
    .order("mention_count", { ascending: false })
    .limit(20);

  console.log("[entities/search]", { q, count: data?.length || 0, error: error?.message });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entities: data || [] });
}
