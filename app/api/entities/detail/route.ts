import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Significance banding (no category column on stories)
// >= 25  → Regulatory
// 10-24  → Developing
// < 10   → Enforcement

function bandLabel(score: number): "regulatory" | "developing" | "enforcement" {
  if (score >= 25) return "regulatory";
  if (score >= 10) return "developing";
  return "enforcement";
}

function formatMentionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hhmm = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (isToday) return `TODAY ${hhmm}`;
  const day = d.getDate();
  const mon = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  return `${day} ${mon} ${hhmm}`;
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entity_id = new URL(req.url).searchParams.get("entity_id");
  if (!entity_id) return NextResponse.json({ error: "entity_id required" }, { status: 400 });

  const window90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all mentions for this entity in last 90 days
  const { data: mentions, error } = await supabase
    .from("entity_mentions")
    .select("stories!inner(fetched_at, significance_score, short_summary, source_name, link)")
    .eq("entity_id", entity_id)
    .gte("stories.fetched_at", window90d)
    .eq("stories.status", "live");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type StoryRow = {
    fetched_at: string;
    significance_score: number;
    short_summary: string | null;
    source_name: string | null;
    link: string | null;
  };

  const stories = (mentions ?? [])
    .map(m => m.stories as unknown as StoryRow | null)
    .filter((s): s is StoryRow => s !== null);

  // Sort by fetched_at DESC
  stories.sort((a, b) => b.fetched_at.localeCompare(a.fetched_at));

  // Context breakdown
  const breakdown = { regulatory: 0, developing: 0, enforcement: 0 };
  for (const s of stories) {
    breakdown[bandLabel(s.significance_score ?? 0)]++;
  }

  // Recent 5 mentions
  const recent = stories.slice(0, 5).map(s => {
    const band = bandLabel(s.significance_score ?? 0);
    const categoryLabel = band === "regulatory" ? "Regulatory"
      : band === "developing" ? "Developing"
      : "Enforcement";
    return {
      date_label: formatMentionDate(s.fetched_at),
      category_label: categoryLabel,
      band,
      summary: s.short_summary ?? "",
      source_name: s.source_name ?? "",
      link: s.link ?? "",
    };
  });

  return NextResponse.json({ breakdown, recent });
}
