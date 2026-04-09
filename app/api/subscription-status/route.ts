import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubscriptionStatus } from "@/app/lib/subscription";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);

  if (!email) {
    return NextResponse.json({ status: "none", trialEnd: null, currentPeriodEnd: null, needsOnboarding: false });
  }

  const result = await getSubscriptionStatus(email);

  // Check if user needs onboarding
  const { data: user } = await supabase
    .from("users")
    .select("topics, sector, is_admin, tier")
    .eq("email", email)
    .single();

  const needsOnboarding = !user?.topics || (Array.isArray(user.topics) && user.topics.length === 0);

  let trialDaysRemaining: number | null = null;
  if (result.status === "trialing" && result.trialEnd) {
    const msLeft = new Date(result.trialEnd).getTime() - Date.now();
    trialDaysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({ ...result, needsOnboarding, sector: user?.sector || null, trialDaysRemaining, isAdmin: user?.is_admin || false, tier: user?.tier || "free" });
}
