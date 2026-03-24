import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getEmailFromSession(req: NextRequest): string | null {
  const cookie = req.cookies.get("tideline_session")?.value;
  if (!cookie) return null;
  try {
    const decoded = JSON.parse(Buffer.from(cookie, "base64").toString());
    if (new Date(decoded.expires) < new Date()) return null;
    return decoded.email ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const email = getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { topics, bodies } = await req.json();

  // Check for existing subscription
  const { data: existing } = await supabase
    .from("calendar_subscriptions")
    .select("calendar_token")
    .eq("user_email", email)
    .single();

  if (existing) {
    // Update filters on existing subscription
    await supabase
      .from("calendar_subscriptions")
      .update({ filters: { topics: topics || [], bodies: bodies || [] } })
      .eq("user_email", email);

    const baseUrl = "https://www.thetideline.co";
    const icalUrl = `${baseUrl}/api/calendar/${existing.calendar_token}`;

    return NextResponse.json({
      token: existing.calendar_token,
      ical_url: icalUrl,
      google_url: `https://www.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`,
      outlook_url: icalUrl,
      apple_url: icalUrl.replace("https://", "webcal://"),
    });
  }

  // Create new subscription
  const { data: sub, error } = await supabase
    .from("calendar_subscriptions")
    .insert({
      user_email: email,
      filters: { topics: topics || [], bodies: bodies || [] },
    })
    .select("calendar_token")
    .single();

  if (error || !sub) {
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }

  const baseUrl = "https://www.thetideline.co";
  const icalUrl = `${baseUrl}/api/calendar/${sub.calendar_token}`;

  return NextResponse.json({
    token: sub.calendar_token,
    ical_url: icalUrl,
    google_url: `https://www.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`,
    outlook_url: icalUrl,
    apple_url: icalUrl.replace("https://", "webcal://"),
  });
}
