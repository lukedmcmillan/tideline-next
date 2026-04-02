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
    return NextResponse.json({ showModal: false });
  }

  const { data: user } = await supabase
    .from("users")
    .select("day5_modal_shown, has_dismissed_day5_modal")
    .eq("email", email)
    .single();

  const showModal = user?.day5_modal_shown === true && user?.has_dismissed_day5_modal === false;
  return NextResponse.json({ showModal });
}
