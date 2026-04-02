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
    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("users")
    .update({ first_login_completed: true })
    .eq("email", email);

  return NextResponse.json({ ok: true });
}
