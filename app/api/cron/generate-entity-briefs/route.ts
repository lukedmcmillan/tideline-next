import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getUserEntityFeed,
  qualityGate,
  composeEntityBriefHtml,
  generateEntitySubjectLine,
} from "@/app/lib/entity-brief";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Returns the user's local time-of-day in minutes since midnight.
 * Handles "24:MM" edge case from Intl (midnight returns 24:00 on some runtimes).
 */
function localMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);

  const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10) % 24;
  const m = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
  return h * 60 + m;
}

/**
 * Returns "YYYY-MM-DD" in the user's local timezone (en-CA locale).
 */
function localDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

/**
 * Returns true if the current moment is within the 30-minute window
 * starting at the user's brief_time in their timezone.
 * brief_time comes from Postgres TIME column as "HH:MM" or "HH:MM:SS".
 */
function inBriefWindow(date: Date, briefTime: string, timezone: string): boolean {
  const [bh, bm] = briefTime.split(":").map(Number);
  const briefMins = bh * 60 + bm;
  const nowMins = localMinutes(date, timezone);
  return nowMins >= briefMins && nowMins < briefMins + 30;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // 1. Fetch onboarded active/trialing users
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, timezone, brief_time")
      .not("onboarded_at", "is", null)
      .in("subscription_status", ["active", "trialing"]);

    if (usersErr) {
      console.error("[generate-entity-briefs] Users fetch error:", usersErr.message);
      return NextResponse.json({ error: usersErr.message }, { status: 500 });
    }

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users || []) {
      try {
        const tz = user.timezone || "UTC";
        const briefTime: string = user.brief_time || "07:00";

        // 2. Check if now is within the 30-min brief window for this user
        if (!inBriefWindow(now, briefTime, tz)) {
          skipped++;
          continue;
        }

        // 3. Skip if already queued or sent today (in user's local timezone)
        const todayStr = localDate(now, tz);
        const { data: existing } = await supabase
          .from("morning_brief_queue")
          .select("id")
          .eq("user_id", user.id)
          .gte("scheduled_for", `${todayStr}T00:00:00Z`)
          .lte("scheduled_for", `${todayStr}T23:59:59Z`)
          .in("status", ["pending", "sent"])
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // 4. Build entity feed + gate
        const feed = await getUserEntityFeed(user.id);
        const gate = qualityGate(feed);

        if (gate === "reject") {
          console.log(`[generate-entity-briefs] Rejected for ${user.id} (no tracked entities)`);
          skipped++;
          continue;
        }

        // 5. Compose HTML + subject line
        const html = composeEntityBriefHtml(feed, dateStr);
        const subject = await generateEntitySubjectLine(feed);
        const storyCount = feed.material.length + feed.watch.length + feed.topStories.length;

        // 6. Insert into queue
        const { error: insertErr } = await supabase
          .from("morning_brief_queue")
          .insert({
            user_id: user.id,
            scheduled_for: now.toISOString(),
            status: "pending",
            html_content: html,
            subject_line: subject,
            story_count: storyCount,
            brief_type: "entity",
          });

        if (insertErr) {
          console.error(`[generate-entity-briefs] Insert error for ${user.id}: ${insertErr.message}`);
          errors++;
        } else {
          console.log(`[generate-entity-briefs] Queued for ${user.email} (${gate}, ${storyCount} stories)`);
          generated++;
        }
      } catch (err) {
        console.error(`[generate-entity-briefs] Error processing user ${user.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ generated, skipped, errors });
  } catch (err) {
    console.error("[generate-entity-briefs] Fatal:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
