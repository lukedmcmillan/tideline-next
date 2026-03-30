import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRACKER_TOPICS: { topic: string; name: string }[] = [
  { topic: "governance", name: "BBNJ Treaty" },
  { topic: "dsm", name: "ISA Mining" },
  { topic: "iuu", name: "IUU Enforcement" },
  { topic: "mpa", name: "30x30 Protection" },
  { topic: "bluefinance", name: "Blue Finance" },
];

export async function GET(req: NextRequest) {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // Fetch story counts for last 24h and 48h per tracker topic
  const trackers = await Promise.all(
    TRACKER_TOPICS.map(async ({ topic, name }) => {
      const [r24, r48] = await Promise.all([
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("topic", topic)
          .gte("published_at", h24),
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("topic", topic)
          .gte("published_at", h48),
      ]);
      const count24 = r24.count ?? 0;
      const count48 = r48.count ?? 0;
      return { name, count24, count48 };
    })
  );

  // Fetch workspace projects from saved_stories for current user
  let projects: { name: string; count: number }[] = [];
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
        projects = [...counts.entries()].map(([name, count]) => ({ name, count }));
      }
    }
  }

  return NextResponse.json({ trackers, projects });
}
