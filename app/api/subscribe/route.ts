// ORPHAN, scheduled for removal.
// Legacy Stripe Elements flow. Superseded by /api/stripe/checkout which uses
// Stripe Checkout + the new /upgrade page. Kept until after the first paying
// customer to avoid distraction. Do not wire new callers to this endpoint.
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

export async function POST(req: NextRequest) {
  try {
    const { email, paymentMethodId } = await req.json();

    if (!email || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    let isExisting = false;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      isExisting = true;
    } else {
      customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Only attach payment method for existing customers (new customers already have it attached)
    if (isExisting) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID! }],
      trial_period_days: 14,
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
    });

    // Store subscription in Supabase
    const periodEnd = subscription.items.data[0]?.current_period_end;
    await supabase.from("subscriptions").upsert(
      {
        email,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (subscription.pending_setup_intent) {
      const setupIntent =
        subscription.pending_setup_intent as import("stripe").Stripe.SetupIntent;
      return NextResponse.json({ clientSecret: setupIntent.client_secret });
    }

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
