import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function sendReservationEmail(email: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Luke from Tideline <noreply@thetideline.co>",
      to: email,
      subject: "Your founding place is reserved",
      html: `<div style="max-width:520px;margin:40px auto;font-family:'DM Sans',Arial,sans-serif;">
        <p style="font-size:16px;color:#15201B;line-height:1.7;margin:0 0 16px;">Your founding place at Tideline is reserved for 7 days.</p>
        <p style="font-size:16px;color:#15201B;line-height:1.7;margin:0 0 16px;">When you're ready, sign in to activate your account and start your first brief.</p>
        <p style="font-size:16px;color:#15201B;line-height:1.7;margin:0 0 16px;">If you have questions, reply to this email.</p>
        <p style="font-size:16px;color:#15201B;line-height:1.7;margin:0;">Luke<br/>Founder, Tideline</p>
      </div>`,
    }),
  }).catch((err) => console.error("Resend error:", err));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot: reject if website field is filled
  if (body.website) {
    return NextResponse.json({ ok: true }); // silent success to bots
  }

  const email = (body.email || "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Check for existing active reservation (do NOT reset clock)
  const { data: existing } = await supabase
    .from("trial_signups")
    .select("id, expires_at")
    .eq("email", email)
    .eq("status", "reserved")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You already have an active reservation. Check your email." },
      { status: 409 },
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { error: insertErr } = await supabase.from("trial_signups").insert({
    email,
    status: "reserved",
    reserved_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (insertErr) {
    console.error("Reserve insert error:", insertErr);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  // Send confirmation email (fire-and-forget)
  sendReservationEmail(email);

  return NextResponse.json({ ok: true });
}
