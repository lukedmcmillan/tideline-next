import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRACKERS: { name: string; topics: string[] }[] = [
  { name: "BBNJ Treaty", topics: ["governance"] },
  { name: "ISA Mining", topics: ["dsm"] },
  { name: "IUU Enforcement", topics: ["iuu"] },
  { name: "30x30 Protection", topics: ["mpa"] },
  { name: "Blue Finance", topics: ["bluefinance"] },
];

export async function GET(req: NextRequest) {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const in14d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Tracker counts — stories per topic in last 24h and 48h
  let trackers: { name: string; count24: number; count48: number }[] = [];
  try {
    trackers = await Promise.all(
      TRACKERS.map(async ({ name, topics }) => {
        const [r24, r48] = await Promise.all([
          supabase
            .from("stories")
            .select("id", { count: "exact", head: true })
            .in("topic", topics)
            .gte("published_at", h24),
          supabase
            .from("stories")
            .select("id", { count: "exact", head: true })
            .in("topic", topics)
            .gte("published_at", h48),
        ]);
        return {
          name,
          count24: r24.count ?? 0,
          count48: r48.count ?? 0,
        };
      })
    );
  } catch {
    trackers = TRACKERS.map(({ name }) => ({ name, count24: 0, count48: 0 }));
  }

  // 2. Workspace projects — saved_stories grouped by project_name for current user
  let projects: { name: string; count: number }[] = [];
  try {
    const email = await getEmailFromSession(req);
    if (email) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (user) {
        const { data: saved } = await supabase
          .from("saved_stories")
          .select("project_name")
          .eq("user_id", user.id);

        if (saved && saved.length > 0) {
          const counts = new Map<string, number>();
          for (const row of saved) {
            counts.set(row.project_name, (counts.get(row.project_name) || 0) + 1);
          }
          projects = [...counts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        }
      }
    }
  } catch {
    projects = [];
  }

  // 3. Urgent consultations — deadline within 14 days
  let urgent_count = 0;
  try {
    const { count, error } = await supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .gte("deadline", now.toISOString())
      .lte("deadline", in14d);

    if (!error && count !== null) {
      urgent_count = count;
    }
  } catch {
    urgent_count = 0;
  }

  return NextResponse.json({ trackers, projects, urgent_count });
}
