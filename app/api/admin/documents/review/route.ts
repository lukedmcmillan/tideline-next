import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAdmin(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("email", email)
    .single();

  return user?.is_admin ? user : null;
}

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, source_organisation, document_type, submitted_by, created_at, topic_tags, region_tags")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { document_id, action } = await req.json();

  if (!document_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    approved_by: admin.id,
    approved_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", document_id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify contributor on approval
  if (action === "approve") {
    const { data: doc } = await supabase
      .from("documents")
      .select("title, submitted_by")
      .eq("id", document_id)
      .single();

    if (doc?.submitted_by) {
      const { data: contributor } = await supabase
        .from("users")
        .select("documents_contributed")
        .eq("id", doc.submitted_by)
        .single();

      await supabase
        .from("users")
        .update({
          documents_contributed: (contributor?.documents_contributed || 0) + 1,
        })
        .eq("id", doc.submitted_by);

      await supabase.from("notifications").insert({
        user_id: doc.submitted_by,
        type: "document_approved",
        title: "Your document is live",
        message: `Your document "${doc.title}" is now live in the Tideline Library.`,
        document_id,
      });
    }
  }

  return NextResponse.json({ success: true, status: update.status });
}
