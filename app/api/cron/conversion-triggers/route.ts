import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <brief@thetideline.co>",
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();

    // ── JOB 1: Day 5 modal flag ───────────────────────────────────────
    // Trial users with 9-10 days remaining (day 4-5 of 14-day trial)
    const day9 = new Date(now + 9 * 24 * 60 * 60 * 1000).toISOString();
    const day10 = new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString();

    const { data: modalUsers, error: modalError } = await supabase
      .from("users")
      .select("id, email")
      .eq("subscription_status", "trial")
      .eq("day5_modal_shown", false)
      .gte("trial_ends_at", day9)
      .lte("trial_ends_at", day10);

    if (modalError) {
      console.error("[Conversion] Modal query error:", modalError);
    }

    let modalFlagged = 0;
    if (modalUsers && modalUsers.length > 0) {
      const ids = modalUsers.map((u) => u.id);
      const { error: updateError } = await supabase
        .from("users")
        .update({ day5_modal_shown: true })
        .in("id", ids);

      if (updateError) {
        console.error("[Conversion] Modal update error:", updateError);
      } else {
        modalFlagged = ids.length;
      }
    }
    console.log(`[Conversion] Day 5 modal: flagged ${modalFlagged} users`);

    // ── JOB 2: Expiry email ───────────────────────────────────────────
    // Trial users with 23-25 hours remaining
    const h23 = new Date(now + 23 * 60 * 60 * 1000).toISOString();
    const h25 = new Date(now + 25 * 60 * 60 * 1000).toISOString();

    const { data: expiryUsers, error: expiryError } = await supabase
      .from("users")
      .select("id, email")
      .eq("subscription_status", "trial")
      .eq("expiry_email_sent", false)
      .gte("trial_ends_at", h23)
      .lte("trial_ends_at", h25);

    if (expiryError) {
      console.error("[Conversion] Expiry query error:", expiryError);
    }

    let emailsSent = 0;
    for (const user of expiryUsers || []) {
      const sent = await sendEmail(
        user.email,
        "Your Tideline trial ends tomorrow",
        `<div style="max-width:520px;margin:40px auto;font-family:'DM Sans',Arial,sans-serif;">
          <div style="background:#0a1628;padding:20px 32px;">
            <span style="font-size:14px;font-weight:400;color:#ffffff;letter-spacing:0.18em;text-transform:uppercase;font-family:monospace;">TIDELINE</span>
          </div>
          <div style="padding:40px 32px;background:#ffffff;border:1px solid #E4E4E4;">
            <h1 style="font-size:22px;color:#0D0D0D;margin:0 0 16px;font-family:Georgia,serif;">Your trial ends tomorrow</h1>
            <p style="font-size:15px;color:#64748B;margin:0 0 28px;font-family:sans-serif;">Your 14-day trial ends tomorrow. To keep access, go to thetideline.co/pricing.</p>
            <a href="https://www.thetideline.co/pricing" style="display:inline-block;padding:13px 28px;background:#0E7C86;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;font-family:sans-serif;border-radius:6px;">Continue access</a>
          </div>
        </div>`
      );

      if (sent) {
        await supabase
          .from("users")
          .update({ expiry_email_sent: true })
          .eq("id", user.id);
        emailsSent++;
        console.log(`[Conversion] Expiry email sent to ${user.email}`);
      } else {
        console.error(`[Conversion] Failed to send expiry email to ${user.email}`);
      }
    }
    console.log(`[Conversion] Expiry emails: sent ${emailsSent}/${(expiryUsers || []).length}`);

    return NextResponse.json({
      modal_flagged: modalFlagged,
      expiry_emails_sent: emailsSent,
      expiry_emails_total: (expiryUsers || []).length,
    });
  } catch (err) {
    console.error("[Conversion] Cron error:", err);
    return NextResponse.json({ error: "Conversion triggers failed" }, { status: 500 });
  }
}
