import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Get latest status per country (most recent recorded_at)
  const { data: allRows, error } = await supabase
    .from("treaty_ratifications")
    .select("country_name, status, status_date, recorded_at, changed_from")
    .eq("treaty_name", "BBNJ Agreement")
    .order("recorded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate: keep only the latest row per country
  const seen = new Set<string>();
  const countries: {
    country_name: string;
    status: string;
    status_date: string | null;
    recorded_at: string;
    changed_from: string | null;
  }[] = [];

  for (const row of allRows || []) {
    if (!seen.has(row.country_name)) {
      seen.add(row.country_name);
      countries.push(row);
    }
  }

  // Get full change history for timeline
  const { data: timeline } = await supabase
    .from("treaty_ratifications")
    .select("country_name, status, status_date, recorded_at")
    .eq("treaty_name", "BBNJ Agreement")
    .eq("status", "ratified")
    .order("status_date", { ascending: true });

  const ratifiedCount = countries.filter((c) => c.status === "ratified").length;
  const signedCount = countries.filter((c) => c.status === "signed").length;

  return NextResponse.json({
    countries,
    timeline: timeline || [],
    stats: {
      ratified: ratifiedCount,
      signed: signedCount,
      threshold: 60,
      treaty_status:
        ratifiedCount >= 60 ? "In force" : `${60 - ratifiedCount} needed`,
      entry_into_force: ratifiedCount >= 60 ? "17 January 2026" : null,
    },
  });
}
