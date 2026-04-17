import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES } from "@/app/lib/tracker-metadata";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SLUGS = Object.keys(DOMAIN_NAMES);

export async function GET() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const items = await Promise.all(
    SLUGS.map(async (slug) => {
      // Latest score
      const { data: latest } = await supabase
        .from("velocity_scores")
        .select("score")
        .eq("tracker_slug", slug)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Score from ~7 days ago
      const { data: prior } = await supabase
        .from("velocity_scores")
        .select("score")
        .eq("tracker_slug", slug)
        .lte("calculated_at", sevenDaysAgo)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const score = latest?.score ?? 0;
      const priorScore = prior?.score ?? score;
      const delta = Math.round((score - priorScore) * 10) / 10;

      return {
        slug,
        name: DOMAIN_NAMES[slug] ?? slug,
        score,
        delta,
      };
    })
  );

  return NextResponse.json(items);
}
