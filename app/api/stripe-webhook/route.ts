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
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    const updateData: Record<string, unknown> = { subscription_status: status };
    if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId;
    await supabase.from("users").update(updateData).eq("email", email);
  } else {
    await supabase.from("users").insert({
      email,
      subscription_status: status,
      stripe_subscription_id: stripeSubscriptionId ?? null,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      topics: [],
      timezone: "Europe/London",
    });
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
        const tier = session.metadata?.tier;
        const updateData: Record<string, unknown> = { subscription_status: "active" };
        if (subscriptionId) updateData.stripe_subscription_id = subscriptionId;
        if (tier) updateData.tier = tier;
        await supabase.from("users").update(updateData).eq("email", email);

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
      const email = await getCustomerEmail(subscription.customer as string);
      if (email) {
        await upsertSubscription(email, subscription);
        await syncUserStatus(
          email,
          subscription.status === "active" || subscription.status === "trialing" ? subscription.status : "cancelled",
          subscription.id
        );
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
        await supabase.from("users").update({ tier: "free" }).eq("email", email);
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
          // Mark past_due in subscriptions table but do NOT cancel user access yet.
          // Stripe retries 3 to 4 times before actually cancelling; customer.subscription.deleted
          // will fire if all retries fail.
          await upsertSubscription(email, subscription, "past_due");

          // Send payment failed email via Resend
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Tideline <noreply@thetideline.co>",
                to: email,
                subject: "Payment failed, update your card",
                html: `
                  <div style="max-width:520px;margin:40px auto;font-family:'DM Sans',Arial,sans-serif;">
                    <div style="background:#0A1628;padding:20px 32px;">
                      <span style="font-size:14px;font-weight:500;color:#ffffff;letter-spacing:0.18em;text-transform:uppercase;font-family:'DM Mono',monospace;">TIDELINE</span>
                    </div>
                    <div style="padding:40px 32px;background:#ffffff;border:1px solid #E4E4E4;">
                      <h1 style="font-size:22px;color:#202124;margin:0 0 16px;font-family:'DM Sans',Arial,sans-serif;font-weight:700;">Payment failed</h1>
                      <p style="font-size:15px;color:#5F6368;margin:0 0 20px;line-height:1.6;">We were unable to charge your card for your Tideline subscription. Please update your payment details to keep your access active.</p>
                      <a href="${process.env.NEXTAUTH_URL}/api/portal" style="display:inline-block;padding:13px 28px;background:#1D9E75;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:7px;">Update payment</a>
                      <p style="font-size:12px;color:#9AA0A6;margin:24px 0 0;">If you need help, reply to this email or contact luke@thetideline.co</p>
                    </div>
                  </div>
                `,
              }),
            });
          } catch (err) {
            console.error("[stripe-webhook] Resend email error:", err);
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
