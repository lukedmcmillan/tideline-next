import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCustomerEmail(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer.email ?? null;
}

async function upsertSubscription(
  email: string,
  subscription: Stripe.Subscription,
  statusOverride?: string
) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  await supabase.from("subscriptions").upsert(
    {
      email,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: statusOverride ?? subscription.status,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const email = await getCustomerEmail(subscription.customer as string);
      if (email) await upsertSubscription(email, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const email = await getCustomerEmail(subscription.customer as string);
      if (email) await upsertSubscription(email, subscription, "canceled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetail = invoice.parent?.subscription_details;
      if (subDetail?.subscription) {
        const subId = typeof subDetail.subscription === "string"
          ? subDetail.subscription
          : subDetail.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        const email = await getCustomerEmail(subscription.customer as string);
        if (email) await upsertSubscription(email, subscription, "past_due");
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
