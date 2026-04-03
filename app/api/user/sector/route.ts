import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function PATCH(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sector } = await req.json();
  if (!sector || typeof sector !== "string") {
    return NextResponse.json({ error: "sector required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ sector })
    .eq("email", email);

  if (error) {
    console.error("[Sector] Update error:", error.message);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
