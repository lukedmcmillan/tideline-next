import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Trial signup error:", err);
    return NextResponse.json({ success: true }); // Always succeed from user's perspective
  }
}
