import { NextRequest, NextResponse } from "next/server";
import { getEmailFromSession } from "@/app/lib/auth";
import { getSubscriptionAccess } from "@/app/lib/subscription";

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);

  if (!email) {
    // No session (auth bypassed or not logged in) — default to active access.
    // When middleware auth is re-enabled, unauthenticated users won't reach
    // /platform/* at all, so this fallback only applies during auth bypass.
    return NextResponse.json({ status: "active", canReadFeed: true, canReadTrackers: true, canUseAgent: true, daysRemaining: null });
  }

  const access = await getSubscriptionAccess(email);
  return NextResponse.json(access);
}
