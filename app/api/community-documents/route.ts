import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_TRACKERS = new Set([
  "isa",
  "bbnj",
  "iuu",
  "30x30",
  "blue-finance",
  "governance",
]);

const ALLOWED_SUBMISSION_TYPES = new Set([
  "research_paper",
  "report",
  "policy_brief",
  "dataset",
  "consultation_response",
  "press_release",
  "other",
]);

// ── GET: list approved community documents ──────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tracker = searchParams.get("tracker");
  const status = searchParams.get("status") || "approved";
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

  if (tracker && !ALLOWED_TRACKERS.has(tracker)) {
    return NextResponse.json({ error: "Unknown tracker" }, { status: 400 });
  }

  let query = supabase
    .from("project_documents")
    .select(
      `
      id,
      title,
      summary,
      publisher,
      source_url,
      source_domain,
      source_verified,
      file_url,
      page_count,
      tracker_tags,
      submission_type,
      submission_relevance,
      submission_relevance_free,
      submitted_by_display,
      submitted_by_role,
      community_status,
      created_at
    `
    )
    .eq("community_submitted", true)
    .eq("community_status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tracker) {
    query = query.contains("tracker_tags", [tracker]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data || [] });
}

// ── POST: submit a new community document ───────────────────────────────
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token?.email as string | undefined) || null;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const sourceUrl =
    typeof body.source_url === "string" ? body.source_url.trim() : "";
  const fileUrl =
    typeof body.file_url === "string" ? body.file_url.trim() : "";
  const publisher =
    typeof body.publisher === "string" ? body.publisher.trim() : null;
  const summary =
    typeof body.summary === "string" ? body.summary.trim() : null;
  const pageCount =
    typeof body.page_count === "number" && Number.isFinite(body.page_count)
      ? Math.max(0, Math.floor(body.page_count))
      : null;
  const submittedByRole =
    typeof body.submitted_by_role === "string"
      ? body.submitted_by_role.trim()
      : null;
  const submissionType =
    typeof body.submission_type === "string" ? body.submission_type : null;
  const submissionRelevanceFree =
    typeof body.submission_relevance_free === "string"
      ? body.submission_relevance_free.trim()
      : null;

  const trackerTags = Array.isArray(body.tracker_tags)
    ? (body.tracker_tags as unknown[])
        .filter((t): t is string => typeof t === "string")
        .filter((t) => ALLOWED_TRACKERS.has(t))
    : [];

  const submissionRelevance = Array.isArray(body.submission_relevance)
    ? (body.submission_relevance as unknown[]).filter(
        (t): t is string => typeof t === "string"
      )
    : [];

  // Validation
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!sourceUrl && !fileUrl) {
    return NextResponse.json(
      { error: "source_url or file_url is required" },
      { status: 400 }
    );
  }
  if (submissionType && !ALLOWED_SUBMISSION_TYPES.has(submissionType)) {
    return NextResponse.json(
      { error: "Invalid submission_type" },
      { status: 400 }
    );
  }
  if (trackerTags.length === 0) {
    return NextResponse.json(
      { error: "At least one tracker tag is required" },
      { status: 400 }
    );
  }

  // Parse domain from source_url for moderation signals
  let sourceDomain: string | null = null;
  if (sourceUrl) {
    try {
      sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return NextResponse.json(
        { error: "source_url is not a valid URL" },
        { status: 400 }
      );
    }
  }

  // Resolve submitter identity. Prefer NextAuth token.name (Google profile),
  // then fall back to the email local-part. Never ask the user to type it.
  const tokenName =
    typeof token?.name === "string" && token.name.trim()
      ? token.name.trim()
      : null;
  const submittedByDisplay = tokenName || email.split("@")[0];

  // Look up public.users row id for foreign-key traceability
  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!userRow?.id) {
    return NextResponse.json(
      { error: "User not found. Cannot attribute submission." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("project_documents")
    .insert({
      user_id: userRow.id,
      project_name: null,
      title,
      summary,
      publisher,
      source_url: sourceUrl || null,
      source_domain: sourceDomain,
      source_verified: false,
      file_url: fileUrl || null,
      page_count: pageCount,
      tracker_tags: trackerTags,
      submission_type: submissionType,
      submission_relevance: submissionRelevance,
      submission_relevance_free: submissionRelevanceFree,
      submitted_by_user_id: userRow?.id ?? null,
      submitted_by_display: submittedByDisplay,
      submitted_by_role: submittedByRole,
      community_submitted: true,
      community_status: "pending_review",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.id, status: "pending_review" },
    { status: 201 }
  );
}
