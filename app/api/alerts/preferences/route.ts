import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function userIdFromRequest(req: NextRequest): Promise<string | null> {
  const email = await getEmailFromSession(req);
  if (!email) return null;
  const { data, error } = await admin()
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

// GET /api/alerts/preferences?tracker_slug=xxx
// Returns { alerts_enabled: boolean }. Defaults to true when no row exists
// (smoke-alarm semantics: new subscribers should be opted in).
export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const trackerSlug = req.nextUrl.searchParams.get("tracker_slug");
  if (!trackerSlug) return NextResponse.json({ error: "tracker_slug required" }, { status: 400 });

  const { data, error } = await admin()
    .from("user_alert_preferences")
    .select("alerts_enabled")
    .eq("user_id", userId)
    .eq("tracker_slug", trackerSlug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // No row → default to true (Part 1 seed default; new subscribers not yet seeded).
  const alertsEnabled = data?.alerts_enabled ?? true;
  return NextResponse.json({ alerts_enabled: alertsEnabled });
}

// POST /api/alerts/preferences  body: { tracker_slug: string, alerts_enabled: boolean }
// Upserts on (user_id, tracker_slug).
export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { tracker_slug?: unknown; alerts_enabled?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const trackerSlug = typeof body.tracker_slug === "string" ? body.tracker_slug : null;
  const alertsEnabled = typeof body.alerts_enabled === "boolean" ? body.alerts_enabled : null;
  if (!trackerSlug || alertsEnabled === null) {
    return NextResponse.json({ error: "tracker_slug (string) and alerts_enabled (boolean) required" }, { status: 400 });
  }

  const { data, error } = await admin()
    .from("user_alert_preferences")
    .upsert(
      { user_id: userId, tracker_slug: trackerSlug, alerts_enabled: alertsEnabled, updated_at: new Date().toISOString() },
      { onConflict: "user_id,tracker_slug" }
    )
    .select("alerts_enabled")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts_enabled: data.alerts_enabled });
}
