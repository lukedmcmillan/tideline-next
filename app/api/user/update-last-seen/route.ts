import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();

  // Update last_seen_at and increment streak if applicable
  const { data: user } = await supabase
    .from("users")
    .select("last_seen_at, streak_days")
    .eq("email", email)
    .single();

  let streakDays = user?.streak_days || 0;
  if (user?.last_seen_at) {
    const lastSeen = new Date(user.last_seen_at);
    const hoursSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 20 && hoursSince < 48) {
      streakDays += 1;
    } else if (hoursSince >= 48) {
      streakDays = 1;
    }
  } else {
    streakDays = 1;
  }

  await supabase
    .from("users")
    .update({ last_seen_at: now, streak_days: streakDays })
    .eq("email", email);

  return NextResponse.json({ ok: true, streak_days: streakDays });
}
