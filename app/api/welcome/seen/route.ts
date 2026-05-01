import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("users")
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq("email", email);

  if (error) {
    console.error("[welcome/seen] update error:", error.message);
    return NextResponse.json({ error: "Failed to mark welcome seen" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
