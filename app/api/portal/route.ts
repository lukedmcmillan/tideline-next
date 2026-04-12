import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function resolveCustomerId(email: string): Promise<string | null> {
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("email", email)
    .single();

  let customerId = user?.stripe_customer_id ?? null;

  // Fallback: search Stripe directly by email if not stored yet
  if (!customerId) {
    const customers = await getStripe().customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("email", email);
    }
  }

  return customerId;
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await resolveCustomerId(email);
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account" },
      { status: 404 },
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/platform/feed`,
  });

  return NextResponse.json({ url: session.url });
}

// GET supports direct browser navigation from a plain anchor tag
export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const customerId = await resolveCustomerId(email);
  if (!customerId) {
    return NextResponse.redirect(new URL("/upgrade", req.url));
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/platform/feed`,
  });

  return NextResponse.redirect(session.url);
}
