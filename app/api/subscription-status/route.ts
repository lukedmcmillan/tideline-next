import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/app/lib/subscription";

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

export async function GET(req: NextRequest) {
  const email = getEmailFromSession(req);

  if (!email) {
    return NextResponse.json({ status: "none", trialEnd: null, currentPeriodEnd: null });
  }

  const result = await getSubscriptionStatus(email);
  return NextResponse.json(result);
}
