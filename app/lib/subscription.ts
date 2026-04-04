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
    trialEnd.setDate(trialEnd.getDate() + 7);

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

export type AccessLevel = "active" | "trial" | "expired" | "none";

export interface SubscriptionAccess {
  status: AccessLevel;
  canReadFeed: boolean;
  canReadTrackers: boolean;
  canUseAgent: boolean;
  daysRemaining: number | null;
}

export async function getSubscriptionAccess(email: string): Promise<SubscriptionAccess> {
  const sub = await getSubscriptionStatus(email);

  if (sub.status === "active") {
    return { status: "active", canReadFeed: true, canReadTrackers: true, canUseAgent: true, daysRemaining: null };
  }

  if (sub.status === "trialing" && sub.trialEnd) {
    const msLeft = new Date(sub.trialEnd).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    return { status: "trial", canReadFeed: true, canReadTrackers: false, canUseAgent: false, daysRemaining };
  }

  if (sub.status === "canceled" || sub.status === "past_due") {
    return { status: "expired", canReadFeed: false, canReadTrackers: false, canUseAgent: false, daysRemaining: null };
  }

  return { status: "none", canReadFeed: false, canReadTrackers: false, canUseAgent: false, daysRemaining: null };
}
