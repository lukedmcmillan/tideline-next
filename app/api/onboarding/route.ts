import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession, getUserIdFromSession } from "@/app/lib/auth";
import { JOB_TYPES, type JobType } from "@/app/lib/onboarding/starter-sets";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    job_type,
    entity_ids,
    custom_entity_ids,
    brief_time,
    timezone,
  } = body as {
    job_type: JobType;
    entity_ids: string[];
    custom_entity_ids?: string[];
    brief_time: string;
    timezone: string;
  };

  // Validate job_type
  if (!job_type || !JOB_TYPES.includes(job_type)) {
    return NextResponse.json({ error: "Valid job_type required" }, { status: 400 });
  }

  // Validate entities (min 3 from starter + custom combined)
  const allEntityIds = [...(entity_ids || []), ...(custom_entity_ids || [])];
  if (allEntityIds.length < 3) {
    return NextResponse.json({ error: "Select at least 3 entities" }, { status: 400 });
  }

  // Validate brief_time format (HH:MM)
  if (!brief_time || !/^\d{2}:\d{2}$/.test(brief_time)) {
    return NextResponse.json({ error: "brief_time must be HH:MM format" }, { status: 400 });
  }

  // Validate timezone
  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json({ error: "Timezone required" }, { status: 400 });
  }

  // 1. Insert user_entities (upsert, skip duplicates)
  const userEntityRows = allEntityIds.map((entityId) => ({
    user_id: userId,
    entity_id: entityId,
  }));

  if (userEntityRows.length > 0) {
    const { error: ueError } = await supabase
      .from("user_entities")
      .upsert(userEntityRows, { onConflict: "user_id,entity_id", ignoreDuplicates: true });

    if (ueError) {
      console.error("[onboarding] user_entities insert error:", ueError.message);
      return NextResponse.json({ error: "Failed to save entity selections" }, { status: 500 });
    }
  }

  // 2. Derive topics from selected entities' tracker_tags for feed compatibility
  const { data: selectedEntities } = await supabase
    .from("entities")
    .select("tracker_tag")
    .in("id", allEntityIds);

  const trackerTags = new Set<string>();
  for (const e of selectedEntities || []) {
    if (e.tracker_tag) trackerTags.add(e.tracker_tag);
  }
  // Also pull tracker_tags from entity_mentions or starter set config
  // For now, the topics array feeds into the existing feed filter
  const topics = Array.from(trackerTags);

  // 3. Update user record
  const { error: userError } = await supabase
    .from("users")
    .update({
      job_type,
      brief_time,
      timezone,
      topics: topics.length > 0 ? topics : undefined,
      onboarded_at: new Date().toISOString(),
      onboarding_completed: true,
    })
    .eq("email", email);

  if (userError) {
    console.error("[onboarding] user update error:", userError.message);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }

  // 4. Schedule first morning brief for tomorrow at chosen time in user timezone
  try {
    const [hours, minutes] = brief_time.split(":").map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build a date string in the user's timezone, then convert to UTC
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const localDateStr = `${year}-${month}-${day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

    // Use Intl to compute the UTC offset for the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(tomorrow);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    // Parse offset like "GMT+1" or "GMT-5:30" into minutes
    let offsetMinutes = 0;
    if (offsetPart?.value) {
      const match = offsetPart.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        offsetMinutes = sign * (parseInt(match[2]) * 60 + parseInt(match[3] || "0"));
      }
    }

    // Create UTC timestamp: local time minus offset
    const scheduledFor = new Date(localDateStr + "Z");
    scheduledFor.setMinutes(scheduledFor.getMinutes() - offsetMinutes);

    await supabase.from("morning_brief_queue").insert({
      user_id: userId,
      scheduled_for: scheduledFor.toISOString(),
      status: "pending",
    });
  } catch (err) {
    // Non-blocking: log but don't fail onboarding
    console.error("[onboarding] brief queue insert error:", err);
  }

  return NextResponse.json({ success: true });
}
