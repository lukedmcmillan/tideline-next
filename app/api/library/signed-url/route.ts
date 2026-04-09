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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("file_url, status, is_public")
    .eq("id", id)
    .eq("status", "approved")
    .eq("is_public", true)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("tideline-documents")
    .createSignedUrl(doc.file_url, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
