import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const cleaned = email.trim().toLowerCase();

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: cleaned });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Already on the list" });
      }
      console.error("[Waitlist] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Confirmation email to the subscriber (fire-and-forget)
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <brief@thetideline.co>",
        to: cleaned,
        subject: "You're on the Tideline early access list",
        text: "Thanks for your interest in Tideline. I'll be in touch before we launch.\n\n\u2014 Luke",
      }),
    }).catch((err) => console.error("[Waitlist] Confirmation email error:", err));

    // Notification email to Luke (fire-and-forget)
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <brief@thetideline.co>",
        to: "luke@oceanrising.co",
        subject: "New Tideline waitlist signup",
        text: `${cleaned} just joined the waitlist.`,
      }),
    }).catch((err) => console.error("[Waitlist] Notification email error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Waitlist] Error:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
