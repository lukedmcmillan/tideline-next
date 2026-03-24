import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "none";

export async function getSubscriptionStatus(email: string): Promise<{
  status: SubStatus;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
}> {
  // Check the subscriptions table first (Stripe-backed)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, trial_end, current_period_end")
    .eq("email", email)
    .single();

  if (sub) {
    return {
      status: sub.status as SubStatus,
      trialEnd: sub.trial_end,
      currentPeriodEnd: sub.current_period_end,
    };
  }

  // Fall back to trial_signups table (no-card trial)
  const { data: trial } = await supabase
    .from("trial_signups")
    .select("signed_up_at")
    .eq("email", email)
    .single();

  if (trial) {
    const trialEnd = new Date(trial.signed_up_at);
    trialEnd.setDate(trialEnd.getDate() + 14);

    if (trialEnd > new Date()) {
      return {
        status: "trialing",
        trialEnd: trialEnd.toISOString(),
        currentPeriodEnd: null,
      };
    }

    return { status: "canceled", trialEnd: trialEnd.toISOString(), currentPeriodEnd: null };
  }

  return { status: "none", trialEnd: null, currentPeriodEnd: null };
}

export function hasAccess(status: SubStatus): boolean {
  return status === "active" || status === "trialing";
}
