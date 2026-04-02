import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ showWelcome: false });
  }

  const { data: user } = await supabase
    .from("users")
    .select("first_login_completed")
    .eq("email", email)
    .single();

  const showWelcome = user?.first_login_completed === false;
  return NextResponse.json({ showWelcome });
}
