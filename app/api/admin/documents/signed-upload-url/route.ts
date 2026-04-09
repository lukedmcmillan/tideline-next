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

  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("email", email)
    .single();

  if (!user?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename, contentType } = await req.json();

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  const ext = filename.split(".").pop() || "pdf";
  const filePath = `${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("tideline-documents")
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error("Signed URL error:", error.message);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, filePath });
}
