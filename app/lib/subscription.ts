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
  // 1. Check users table first (primary source after webhook sync)
  const { data: user } = await supabase
    .from("users")
    .select("subscription_status, trial_ends_at")
    .eq("email", email)
    .single();

  if (user) {
    if (user.subscription_status === "active") {
      return { status: "active", trialEnd: null, currentPeriodEnd: null };
    }
    if (user.subscription_status === "trial" && user.trial_ends_at) {
      if (new Date(user.trial_ends_at) > new Date()) {
        return { status: "trialing", trialEnd: user.trial_ends_at, currentPeriodEnd: null };
      }
      return { status: "canceled", trialEnd: user.trial_ends_at, currentPeriodEnd: null };
    }
    if (user.subscription_status === "cancelled") {
      return { status: "canceled", trialEnd: user.trial_ends_at, currentPeriodEnd: null };
    }
  }

  // 2. Check subscriptions table (Stripe-backed)
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

  // 3. Fall back to trial_signups table (no-card trial)
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
