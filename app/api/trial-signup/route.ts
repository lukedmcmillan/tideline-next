import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendWelcomeEmail(email: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Luke from Tideline <noreply@thetideline.co>",
      to: email,
      subject: "You're in — and you've locked in \u00A325 for life",
      html: `
        <div style="max-width:520px;margin:40px auto;font-family:Georgia,serif;">
          <div style="background:#0a1628;padding:20px 32px;border-bottom:3px solid #1d6fa4;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;">TIDELINE</span>
          </div>
          <div style="padding:40px 32px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);">
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
              You just became one of Tideline's first 200 subscribers.
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
              That matters more than it might sound. The platform is live, the feeds are running, and the morning brief lands before 7am. But we're still early &mdash; and the people who back something at the start are the ones who shape what it becomes.
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
              Your subscription is locked at &pound;25/month for as long as you stay subscribed. When we open to the wider market, the price goes to &pound;49. That rate is yours permanently.
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
              <strong style="color:#0a1628;">Here's what to do now:</strong>
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px;font-family:Arial,sans-serif;">
              Log in at <a href="https://www.thetideline.co/login" style="color:#1d6fa4;text-decoration:underline;">thetideline.co/login</a> and go straight to the feed. Pick two or three topics from the sidebar that matter most to your work. The brief will be waiting tomorrow morning.
            </p>
            <a href="https://www.thetideline.co/login" style="display:inline-block;padding:13px 28px;background:#1d6fa4;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;">Open your feed</a>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:24px 0 0;font-family:Arial,sans-serif;">
              If you know someone who should be reading this, send them to <a href="https://www.thetideline.co" style="color:#1d6fa4;text-decoration:underline;">thetideline.co</a> &mdash; and reply to this email to let me know. I'll make sure you're looked after.
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:16px 0 0;font-family:Arial,sans-serif;">
              And if you ever want to talk about what you're seeing in the platform, reply to this email. It comes straight to me.
            </p>
            <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:24px 0 0;font-family:Arial,sans-serif;">
              Luke<br/>
              <span style="color:#6b7280;">Founder, Tideline</span>
            </p>
          </div>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, topics } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("trial_signups")
      .upsert({
        email,
        topics: topics || [],
        signed_up_at: new Date().toISOString(),
        status: "trial",
      }, { onConflict: "email" });

    if (error) {
      console.error("Supabase error:", error);
      // Don't fail — user still gets through
    }

    // Send welcome email (don't block the response)
    sendWelcomeEmail(email).catch(err =>
      console.error("Welcome email error:", err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Trial signup error:", err);
    return NextResponse.json({ success: true }); // Always succeed from user's perspective
  }
}
