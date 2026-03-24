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

async function syncUserStatus(
  email: string,
  status: string,
  stripeSubscriptionId?: string
) {
  // Try update first
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  console.log(`[webhook] syncUserStatus: email=${email}, status=${status}, existing=${!!existing}`);
  if (existing) {
    const updateData: Record<string, unknown> = { subscription_status: status };
    if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId;
    const { error } = await supabase.from("users").update(updateData).eq("email", email);
    if (error) console.error("[webhook] users update error:", error.message);
    else console.log("[webhook] users updated successfully");
  } else {
    // Create user — they may have subscribed before logging in
    const insertData = {
      email,
      subscription_status: status,
      stripe_subscription_id: stripeSubscriptionId ?? null,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      topics: [],
      timezone: "Europe/London",
    };
    console.log("[webhook] inserting user:", JSON.stringify(insertData));
    const { error } = await supabase.from("users").insert(insertData);
    if (error) console.error("[webhook] users insert error:", error.message, error.details, error.hint);
    else console.log("[webhook] users inserted successfully");
  }
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
    // ── Checkout completed ──────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      const subscriptionId = session.subscription as string | null;

      if (email) {
        await syncUserStatus(email, "active", subscriptionId ?? undefined);

        // Also sync the subscriptions table if there's a subscription
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscription(email, subscription);
        }
      }
      break;
    }

    // ── Subscription created or updated ─────────────────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      console.log(`[webhook] ${event.type}: customer=${customerId}, status=${subscription.status}`);
      const email = await getCustomerEmail(customerId);
      console.log(`[webhook] resolved email: ${email}`);
      if (email) {
        await upsertSubscription(email, subscription);
        await syncUserStatus(
          email,
          subscription.status === "active" || subscription.status === "trialing" ? subscription.status : "cancelled",
          subscription.id
        );
      } else {
        console.error(`[webhook] Could not resolve email for customer ${customerId}`);
      }
      break;
    }

    // ── Subscription deleted ────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const email = await getCustomerEmail(subscription.customer as string);
      if (email) {
        await upsertSubscription(email, subscription, "canceled");
        await syncUserStatus(email, "cancelled");
      }
      break;
    }

    // ── Payment failed ──────────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetail = invoice.parent?.subscription_details;
      if (subDetail?.subscription) {
        const subId = typeof subDetail.subscription === "string"
          ? subDetail.subscription
          : subDetail.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        const email = await getCustomerEmail(subscription.customer as string);
        if (email) {
          await upsertSubscription(email, subscription, "past_due");
          await syncUserStatus(email, "cancelled");
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
