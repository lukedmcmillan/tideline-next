import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PRICE_MAP: Record<string, string | undefined> = {
  founding: process.env.STRIPE_PRICE_FOUNDING_MONTHLY,
  individual: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY,
  individual_annual: process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL,
  team: process.env.STRIPE_PRICE_TEAM_MONTHLY,
};

const TIER_MAP: Record<string, string> = {
  founding: "founding",
  individual: "individual",
  individual_annual: "individual",
  team: "team",
};

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier } = await req.json();
  const priceId = PRICE_MAP[tier];
  if (!priceId) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  // Get or create Stripe customer
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id, trial_ends_at")
    .eq("email", email)
    .single();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email });
    customerId = customer.id;
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("email", email);
  }

  // Only offer trial if user hasn't had one yet
  const hadTrial = user?.trial_ends_at != null;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: tier === "team" ? 10 : 1 }],
    ...(hadTrial ? {} : { subscription_data: { trial_period_days: 7 } }),
    success_url: `${process.env.NEXTAUTH_URL}/platform/feed?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/upgrade`,
    metadata: { tier: TIER_MAP[tier], email },
  });

  return NextResponse.json({ url: session.url });
}
