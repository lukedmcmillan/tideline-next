import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSubscriptionStatus } from "@/app/lib/subscription";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getEmailFromSession(req: NextRequest): string | null {
  const cookie = req.cookies.get("tideline_session")?.value;
  if (!cookie) return null;

  try {
    const decoded = JSON.parse(Buffer.from(cookie, "base64").toString());
    if (new Date(decoded.expires) < new Date()) return null;
    return decoded.email ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const email = getEmailFromSession(req);

  if (!email) {
    return NextResponse.json({ status: "none", trialEnd: null, currentPeriodEnd: null, needsOnboarding: false });
  }

  const result = await getSubscriptionStatus(email);

  // Check if user needs onboarding
  const { data: user } = await supabase
    .from("users")
    .select("topics")
    .eq("email", email)
    .single();

  const needsOnboarding = !user?.topics || (Array.isArray(user.topics) && user.topics.length === 0);

  return NextResponse.json({ ...result, needsOnboarding });
}
