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

  const { topics, timezone } = await req.json();

  if (!Array.isArray(topics) || topics.length < 3) {
    return NextResponse.json({ error: "Select at least 3 topics" }, { status: 400 });
  }

  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json({ error: "Timezone required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ topics, timezone })
    .eq("email", email);

  if (error) {
    console.error("Onboarding save error:", error.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
