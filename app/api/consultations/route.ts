import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .order("deadline", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const rows = (data ?? []).map((row) => {
    const deadlineMs = new Date(row.deadline).getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil((deadlineMs - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    return { ...row, days_remaining: daysRemaining };
  });

  const urgent = rows.filter((r) => r.days_remaining <= 14);
  const warning = rows.filter(
    (r) => r.days_remaining > 14 && r.days_remaining <= 60
  );
  const upcoming = rows.filter((r) => r.days_remaining > 60);

  return NextResponse.json({ urgent, warning, upcoming });
}
