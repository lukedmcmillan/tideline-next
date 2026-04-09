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

const VALID_DOCUMENT_TYPES = [
  "treaty", "resolution", "report", "regulation",
  "scientific_paper", "ngo_report",
  "government_document", "court_filing", "other",
];

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  "international agreement": "treaty",
  "agreement": "treaty",
  "convention": "treaty",
  "protocol": "treaty",
  "directive": "regulation",
  "decision": "resolution",
  "recommendation": "resolution",
  "assessment": "report",
  "review": "report",
  "paper": "scientific_paper",
  "journal article": "scientific_paper",
  "article": "scientific_paper",
  "civil society": "ngo_report",
  "policy brief": "ngo_report",
  "government report": "government_document",
  "national report": "government_document",
  "filing": "court_filing",
  "judgment": "court_filing",
};

function sanitiseDocumentType(raw: string | null): string {
  if (!raw) return "other";
  const lower = raw.toLowerCase().trim();
  if (VALID_DOCUMENT_TYPES.includes(lower)) return lower;
  return DOCUMENT_TYPE_MAP[lower] || "other";
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin check
  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("email", email)
    .single();

  if (!user?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const sourceOrganisation = formData.get("source_organisation") as string | null;
  const documentType = formData.get("document_type") as string | null;
  const publishedDate = formData.get("published_date") as string | null;
  const topicTagsRaw = formData.get("topic_tags") as string | null;
  const regionTagsRaw = formData.get("region_tags") as string | null;

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

  // Insert document record
  console.log("Inserting document:", JSON.stringify({
    title,
    source_organisation: sourceOrganisation,
    document_type: documentType,
    published_date: (publishedDate && publishedDate.trim() !== "") ? publishedDate : null,
    file_url: filePath,
    file_size_bytes: file.size,
    status: "approved",
  }));
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      title,
      source_organisation: sourceOrganisation,
      document_type: sanitiseDocumentType(documentType),
      published_date: (publishedDate && publishedDate.trim() !== "") ? publishedDate : null,
      file_url: filePath,
      file_size_bytes: file.size,
      is_public: true,
      status: "approved",
      submitted_by: null,
      approved_by: null,
      contributor_confirmed: false,
      topic_tags: topicTags,
      region_tags: regionTags,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Document insert error:", JSON.stringify(insertError));
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }

  return NextResponse.json({ success: true, document_id: doc.id });
}
