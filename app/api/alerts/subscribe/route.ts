import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_SLUGS = new Set([
  "isa",
  "bbnj",
  "iuu",
  "30x30",
  "blue-finance",
  "governance",
]);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tracker_slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tracker_slug = body.tracker_slug;
  if (!tracker_slug || !VALID_SLUGS.has(tracker_slug)) {
    return NextResponse.json({ error: "Invalid tracker_slug" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_alert_subscriptions")
    .upsert(
      { user_email: email, tracker_slug },
      { onConflict: "user_email,tracker_slug", ignoreDuplicates: true },
    );

  if (error) {
    console.error("[alerts/subscribe] insert error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tracker_slug });
}

export async function DELETE(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const tracker_slug = url.searchParams.get("tracker_slug");
  if (!tracker_slug || !VALID_SLUGS.has(tracker_slug)) {
    return NextResponse.json({ error: "Invalid tracker_slug" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_alert_subscriptions")
    .delete()
    .eq("user_email", email)
    .eq("tracker_slug", tracker_slug);

  if (error) {
    console.error("[alerts/subscribe] delete error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
