import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const sourceOrganisation = formData.get("source_organisation") as string | null;
  const documentType = formData.get("document_type") as string | null;
  const publishedDate = formData.get("published_date") as string | null;
  const topicTagsRaw = formData.get("topic_tags") as string | null;
  const regionTagsRaw = formData.get("region_tags") as string | null;
  const contributorConfirmed = formData.get("contributor_confirmed") === "true";

  if (!contributorConfirmed) {
    return NextResponse.json(
      { error: "You must confirm you have the right to share this document." },
      { status: 400 }
    );
  }

  if (!file || !title) {
    return NextResponse.json({ error: "File and title are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
  }

  const topicTags = topicTagsRaw ? topicTagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const regionTags = regionTagsRaw ? regionTagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Upload to storage
  const fileExt = file.name.split(".").pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("tideline-documents")
    .upload(filePath, buffer, { contentType: file.type });

  if (uploadError) {
    console.error("Storage upload error:", uploadError.message);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  const { error: insertError } = await supabase
    .from("documents")
    .insert({
      title,
      source_organisation: sourceOrganisation,
      document_type: documentType,
      published_date: publishedDate || null,
      file_url: filePath,
      file_size_bytes: file.size,
      is_public: true,
      status: "pending",
      submitted_by: user.id,
      contributor_confirmed: true,
      topic_tags: topicTags,
      region_tags: regionTags,
    });

  if (insertError) {
    console.error("Document insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Your document has been submitted for review. We will notify you when it is approved.",
  });
}
