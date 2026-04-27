import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const defaultSince = new Date(now.getTime() - 8 * 3600 * 1000);

  // Get user row
  const { data: userRow } = await supabase
    .from("users")
    .select("id, last_dashboard_view, topics")
    .eq("email", email)
    .single();

  const since = userRow?.last_dashboard_view
    ? new Date(userRow.last_dashboard_view)
    : defaultSince;

  const userTopics: string[] = Array.isArray(userRow?.topics) ? userRow.topics as string[] : [];

  // Total new stories + 7-day sparkline in one query
  let count = 0;
  const sparkline = [0, 0, 0, 0, 0, 0, 0];

  if (userTopics.length > 0) {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const { data: recentStories } = await supabase
      .from("stories")
      .select("published_at")
      .in("topic", userTopics)
      .gte("published_at", sevenDaysAgo.toISOString())
      .lte("published_at", now.toISOString());

    const todayDay = Math.floor(now.getTime() / 86400000);
    for (const story of recentStories ?? []) {
      const storyDay = Math.floor(new Date(story.published_at).getTime() / 86400000);
      const daysAgo = todayDay - storyDay;
      if (daysAgo >= 0 && daysAgo < 7) {
        sparkline[6 - daysAgo]++;
      }
      // Count new since last dashboard view
      if (new Date(story.published_at) > since) count++;
    }
  }

  // Per-project new story counts
  const projects: { id: string; name: string; new_count: number }[] = [];

  if (userRow?.id) {
    const { data: projRows } = await supabase
      .from("projects")
      .select("id, name, topic_tags")
      .eq("user_id", userRow.id)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (projRows && projRows.length > 0) {
      const topicArrays = projRows.map(p =>
        Array.isArray(p.topic_tags) ? p.topic_tags as string[] : []
      );
      const counts = await Promise.all(
        topicArrays.map(async (topics) => {
          if (topics.length === 0) return 0;
          const { count: c } = await supabase
            .from("stories")
            .select("id", { count: "exact", head: true })
            .in("topic", topics)
            .gt("published_at", since.toISOString());
          return c ?? 0;
        })
      );
      for (let i = 0; i < projRows.length; i++) {
        projects.push({ id: projRows[i].id, name: projRows[i].name, new_count: counts[i] });
      }
    }
  }

  return NextResponse.json({ count, since: since.toISOString(), sparkline, projects });
}
