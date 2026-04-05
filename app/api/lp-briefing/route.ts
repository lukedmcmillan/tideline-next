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

  const { searchParams } = new URL(req.url);
  const fundName = searchParams.get("fund_name");
  const from = searchParams.get("from"); // ISO date, e.g. 2026-03-01
  const to = searchParams.get("to"); // ISO date, e.g. 2026-04-05

  if (!fundName) {
    return NextResponse.json(
      { error: "fund_name is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("lp_briefing")
    .select("*")
    .eq("fund_name", fundName)
    .order("published_at", { ascending: false });

  if (from) {
    query = query.gte("published_at", `${from}T00:00:00Z`);
  }
  if (to) {
    query = query.lte("published_at", `${to}T23:59:59Z`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      fund_name: fundName,
      period: { from: from || null, to: to || null },
      generated_at: new Date().toISOString(),
      summary: { total_mentions: 0, entities_tracked: 0, stories_covered: 0 },
      entities: [],
    });
  }

  // Group by entity for structured output
  const entityMap = new Map<
    string,
    {
      entity_id: string;
      entity_name: string;
      entity_type: string;
      relationship: string;
      total_mentions: number;
      stories: {
        story_id: string;
        title: string;
        link: string;
        source_name: string;
        topic: string;
        published_at: string;
        description: string | null;
        short_summary: string | null;
        alert_type: string | null;
        mention_context: string | null;
      }[];
    }
  >();

  for (const row of data) {
    if (!entityMap.has(row.entity_id)) {
      entityMap.set(row.entity_id, {
        entity_id: row.entity_id,
        entity_name: row.entity_name,
        entity_type: row.entity_type,
        relationship: row.relationship,
        total_mentions: row.total_mentions,
        stories: [],
      });
    }
    entityMap.get(row.entity_id)!.stories.push({
      story_id: row.story_id,
      title: row.story_title,
      link: row.story_link,
      source_name: row.source_name,
      topic: row.topic,
      published_at: row.published_at,
      description: row.story_description,
      short_summary: row.short_summary,
      alert_type: row.alert_type,
      mention_context: row.mention_context,
    });
  }

  const entities = Array.from(entityMap.values()).sort(
    (a, b) => b.stories.length - a.stories.length
  );

  const uniqueStories = new Set(data.map((r) => r.story_id));

  return NextResponse.json({
    fund_name: fundName,
    period: { from: from || null, to: to || null },
    generated_at: new Date().toISOString(),
    summary: {
      total_mentions: data.length,
      entities_tracked: entities.length,
      stories_covered: uniqueStories.size,
    },
    entities,
  });
}
