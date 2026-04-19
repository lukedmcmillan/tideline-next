import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STARTER_SETS, JOB_TYPES, type JobType } from "@/app/lib/onboarding/starter-sets";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const jobType = req.nextUrl.searchParams.get("job_type") as JobType | null;

  if (!jobType || !JOB_TYPES.includes(jobType)) {
    return NextResponse.json(
      { error: "Valid job_type required: " + JOB_TYPES.join(", ") },
      { status: 400 }
    );
  }

  const starterEntities = STARTER_SETS[jobType];
  const names = starterEntities.map((e) => e.name);

  // Look up entity IDs by name
  const { data: dbEntities, error } = await supabase
    .from("entities")
    .select("id, name, entity_type, mention_count, tracker_tag")
    .in("name", names);

  if (error) {
    console.error("[onboarding/starter-set] DB error:", error.message);
    return NextResponse.json({ error: "Failed to load entities" }, { status: 500 });
  }

  // Build lookup: name -> DB row
  const byName = new Map((dbEntities || []).map((e) => [e.name, e]));

  // Match static config against DB, preserving display order
  const entities = starterEntities
    .map((starter, i) => {
      const db = byName.get(starter.name);
      if (!db) {
        console.warn(
          `[onboarding/starter-set] Entity not found in DB, skipping: "${starter.name}"`
        );
        return null;
      }
      return {
        id: db.id,
        name: db.name,
        entity_type: db.entity_type,
        mention_count: db.mention_count,
        tracker_tags: starter.tracker_tags,
        display_order: i,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ job_type: jobType, entities });
}
