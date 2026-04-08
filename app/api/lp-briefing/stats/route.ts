import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const [entitiesRes, storiesRes] = await Promise.all([
    supabase.from("entities").select("id", { count: "exact", head: true }),
    supabase.from("stories").select("source_name", { count: "exact", head: true }),
  ]);

  // Distinct source count via a separate query (Supabase has no DISTINCT aggregation via REST)
  const { data: sources } = await supabase
    .from("stories")
    .select("source_name")
    .not("source_name", "is", null)
    .limit(5000);

  const uniqueSources = new Set((sources || []).map((s) => s.source_name)).size;

  return NextResponse.json({
    entities: entitiesRes.count ?? 0,
    sources: uniqueSources,
    stories: storiesRes.count ?? 0,
  });
}
