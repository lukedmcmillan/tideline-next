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

export const maxDuration = 60;

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

  const body = await req.json();
  const {
    title,
    source_organisation: sourceOrganisation,
    document_type: documentType,
    published_date: publishedDate,
    topic_tags: topicTags = [],
    region_tags: regionTags = [],
    file_path: filePath,
    file_size_bytes: fileSizeBytes,
  } = body;

  if (!title || !filePath) {
    return NextResponse.json({ error: "Title and file_path are required" }, { status: 400 });
  }

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      title,
      source_organisation: sourceOrganisation || null,
      document_type: sanitiseDocumentType(documentType),
      published_date: (publishedDate && publishedDate.trim() !== "") ? publishedDate : null,
      file_url: filePath,
      file_size_bytes: fileSizeBytes || 0,
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
