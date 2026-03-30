import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const topics = req.nextUrl.searchParams.get("topics")?.split(",").filter(Boolean) || [];
  const since = req.nextUrl.searchParams.get("since");
  if (topics.length === 0 || !since) return NextResponse.json({ stories: [] });

  const { data, error } = await supabase
    .from("stories")
    .select("id, title, source_name, topic, published_at, short_summary")
    .in("topic", topics)
    .gt("published_at", since)
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ stories: [] });
  return NextResponse.json({ stories: data || [] });
}
