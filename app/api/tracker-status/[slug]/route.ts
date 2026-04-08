import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_SLUGS = new Set([
  "isa",
  "bbnj",
  "iuu",
  "30x30",
  "blue-finance",
  "governance",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!ALLOWED_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown tracker slug" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tracker_status")
    .select(
      `
      tracker_slug,
      stage_number,
      stage_name,
      stage_description,
      stage_source_url,
      stage_source_label,
      stage_verified_at,
      trajectory,
      trajectory_reason,
      trajectory_source_url,
      trajectory_source_label,
      trajectory_verified_at,
      next_event_name,
      next_event_date,
      next_event_location,
      next_event_source_url,
      updated_at,
      updated_by
    `
    )
    .eq("tracker_slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "No status recorded for this tracker yet" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    slug: data.tracker_slug,
    stage: {
      number: data.stage_number,
      name: data.stage_name,
      description: data.stage_description,
      source_url: data.stage_source_url,
      source_label: data.stage_source_label,
      verified_at: data.stage_verified_at,
    },
    trajectory: {
      direction: data.trajectory,
      reason: data.trajectory_reason,
      source_url: data.trajectory_source_url,
      source_label: data.trajectory_source_label,
      verified_at: data.trajectory_verified_at,
    },
    next_event: data.next_event_name
      ? {
          name: data.next_event_name,
          date: data.next_event_date,
          location: data.next_event_location,
          source_url: data.next_event_source_url,
        }
      : null,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
  });
}
