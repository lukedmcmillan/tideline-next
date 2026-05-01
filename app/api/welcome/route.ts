import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromSession } from "@/app/lib/auth";
import { getWelcomeData } from "@/app/lib/welcome/data";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const data = await getWelcomeData(userId);
  return NextResponse.json(data);
}
