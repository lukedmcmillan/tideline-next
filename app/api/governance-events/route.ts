import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const body = searchParams.get("body");
  const topic = searchParams.get("topic");
  const significance = searchParams.get("significance");
  const eventId = searchParams.get("id");

  // Single event lookup
  if (eventId) {
    const { data, error } = await supabase
      .from("governance_events")
      .select("*, governance_bodies(name, abbreviation, website, sector)")
      .eq("id", eventId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get expected decisions for this event
    const { data: decisions } = await supabase
      .from("expected_decisions")
      .select("*")
      .eq("event_id", eventId);

    // Get related events from same body
    const { data: related } = await supabase
      .from("governance_events")
      .select("id, title, starts_at, significance")
      .eq("body_id", data.body_id)
      .neq("id", eventId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5);

    return NextResponse.json({ event: data, decisions: decisions || [], related: related || [] });
  }

  // List query — upcoming events
  let query = supabase
    .from("governance_events")
    .select("*, governance_bodies(name, abbreviation, website, sector)")
    .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // include events from past week
    .order("starts_at", { ascending: true })
    .limit(200);

  if (body) {
    // Look up body_id from abbreviation
    const { data: bodyData } = await supabase
      .from("governance_bodies")
      .select("id")
      .eq("abbreviation", body)
      .single();
    if (bodyData) query = query.eq("body_id", bodyData.id);
  }

  if (topic) {
    query = query.contains("topics", [topic]);
  }

  if (significance) {
    query = query.eq("significance", significance);
  }

  const { data: events, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all bodies for reference
  const { data: bodies } = await supabase
    .from("governance_bodies")
    .select("id, name, abbreviation, sector")
    .eq("is_active", true)
    .order("abbreviation");

  // Compute stats
  const upcoming = (events || []).filter(
    (e: any) => new Date(e.starts_at) > new Date()
  );
  const critical = upcoming.filter((e: any) => e.significance === "critical");

  return NextResponse.json({
    events: events || [],
    bodies: bodies || [],
    stats: {
      total_upcoming: upcoming.length,
      critical_count: critical.length,
      next_critical: critical[0]?.title || null,
      next_critical_date: critical[0]?.starts_at || null,
    },
  });
}
