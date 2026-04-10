import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { extractText } from "unpdf";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const BATCH_LIMIT = 50;
const DELAY_MS = 2000;

const VALID_DOCUMENT_TYPES = [
  "treaty", "resolution", "report", "regulation",
  "scientific_paper", "ngo_report", "government_document",
  "court_filing", "other",
];

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  "international agreement": "treaty",
  "agreement": "treaty", "convention": "treaty",
  "protocol": "treaty", "directive": "regulation",
  "decision": "resolution", "recommendation": "resolution",
  "assessment": "report", "review": "report",
  "paper": "scientific_paper", "journal article": "scientific_paper",
  "policy brief": "ngo_report",
  "government report": "government_document",
  "national report": "government_document",
  "filing": "court_filing", "judgment": "court_filing",
};

function sanitiseDocumentType(raw: string | null): string {
  if (!raw) return "other";
  const lower = raw.toLowerCase().trim();
  if (VALID_DOCUMENT_TYPES.includes(lower)) return lower;
  return DOCUMENT_TYPE_MAP[lower] || "other";
}

function sanitiseDate(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === "") return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return null;
}

async function haikuCall(system: string, userContent: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userContent }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function markFailed(id: string, reason: string) {
  await supabase
    .from("document_queue")
    .update({ status: "failed", error_message: reason })
    .eq("id", id);
  console.log(`  FAILED: ${reason}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processItem(item: {
  id: string; file_url: string; file_name: string;
  is_primary_source: boolean; source_domain: string;
}) {
  console.log(`\nProcessing: ${item.file_name}`);

  // Download PDF
  let pdfBuffer: ArrayBuffer;
  try {
    const res = await fetch(item.file_url, {
      headers: { "User-Agent": "Tideline Library Bot/1.0" },
    });
    if (!res.ok) { await markFailed(item.id, `Download HTTP ${res.status}`); return; }
    pdfBuffer = await res.arrayBuffer();
  } catch (err) {
    await markFailed(item.id, `Download error: ${err}`);
    return;
  }

  // STEP 0 — RELEVANCE (first 1000 chars)
  let fullText: string;
  try {
    const result = await extractText(new Uint8Array(pdfBuffer));
    const pages = result.text;
    fullText = Array.isArray(pages) ? pages.join("\n") : String(pages);
  } catch (err) {
    await markFailed(item.id, `PDF parse error: ${err}`);
    return;
  }

  const previewText = fullText.slice(0, 1000);
  if (previewText.length < 100) {
    await markFailed(item.id, "Scanned PDF — insufficient text");
    return;
  }

  const relevanceRaw = await haikuCall(
    "Ocean governance relevance classifier.\nReturn only JSON: {\"relevant\":true/false, \"reason\":\"string\"}\nRelevant = directly about ocean governance, marine policy, maritime law, ocean science, fisheries, marine conservation, or international ocean law.",
    previewText
  );
  const relevance = parseJson(relevanceRaw);
  if (!relevance || relevance.relevant !== true) {
    const reason = relevance?.reason || "Not relevant to ocean governance";
    await markFailed(item.id, `Not relevant: ${reason}`);
    return;
  }

  // STEP 1 — TEXT (first 6000 chars)
  const extractedText = fullText.slice(0, 6000);
  if (extractedText.length < 100) {
    await markFailed(item.id, "Scanned PDF — insufficient extractable text");
    return;
  }

  // STEP 2 — EXTRACT (Pass 1)
  const extractRaw = await haikuCall(
    `Precise ocean governance metadata extractor.
title: exact official title, never paraphrase.
source_organisation: issuing body only.
document_type: MUST be exactly one of: treaty,resolution,report,regulation,scientific_paper,ngo_report,government_document,court_filing,other — no other values ever.
published_date: YYYY-MM-DD. Year only → YYYY-01-01. Month-year → YYYY-MM-01. Unknown → empty string.
topic_tags: 3-6 established ocean governance terms.
region_tags: specific regions or Global.
Return only valid JSON. No markdown.`,
    extractedText
  );
  const extracted = parseJson(extractRaw);
  if (!extracted) {
    await markFailed(item.id, "Metadata extraction failed — invalid JSON");
    return;
  }

  // STEP 3 — VERIFY (Pass 2)
  const verifyRaw = await haikuCall(
    `Ocean governance metadata verifier.
Correct all errors in extracted metadata.
document_type MUST be one of the exact allowed values: treaty,resolution,report,regulation,scientific_paper,ngo_report,government_document,court_filing,other.
published_date MUST be YYYY-MM-DD or empty string.
title must be exact official title not paraphrased.
Return only corrected JSON. No markdown.`,
    JSON.stringify(extracted)
  );
  const verified = parseJson(verifyRaw) || extracted;

  // STEP 4 — SANITISE
  const title = String(verified.title || "").trim();
  const sourceOrg = String(verified.source_organisation || "").trim();
  const docType = sanitiseDocumentType(String(verified.document_type || ""));
  const pubDate = sanitiseDate(verified.published_date as string | null);
  const topicTags = Array.isArray(verified.topic_tags) ? verified.topic_tags as string[] : [];
  const regionTags = Array.isArray(verified.region_tags) ? verified.region_tags as string[] : [];

  // STEP 5 — VALIDATE
  if (title.length <= 5 || /^https?:\/\//.test(title) || /\.\w{2,4}$/.test(title)) {
    await markFailed(item.id, `Validation failed: bad title "${title}"`);
    return;
  }
  if (sourceOrg.length <= 3) {
    await markFailed(item.id, `Validation failed: bad source_organisation "${sourceOrg}"`);
    return;
  }

  // STEP 6 — STORAGE
  const uuid = randomUUID();
  const storagePath = `library/${uuid}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("tideline-documents")
    .upload(storagePath, Buffer.from(pdfBuffer), {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) {
    await markFailed(item.id, `Storage upload failed: ${uploadError.message}`);
    return;
  }

  // STEP 7 — INSERT
  const { error: insertError } = await supabase.from("documents").insert({
    title,
    source_organisation: sourceOrg,
    document_type: docType,
    published_date: pubDate,
    file_url: storagePath,
    file_size_bytes: pdfBuffer.byteLength,
    is_public: true,
    is_primary_source: item.is_primary_source,
    status: "approved",
    submitted_by: null,
    approved_by: null,
    contributor_confirmed: false,
    topic_tags: topicTags,
    region_tags: regionTags,
  });
  if (insertError) {
    await markFailed(item.id, `Document insert failed: ${insertError.message}`);
    return;
  }

  // STEP 8 — COMPLETE
  await supabase
    .from("document_queue")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", item.id);

  console.log(`  OK: "${title}" (${docType})`);
}

async function main() {
  console.log("=== Tideline Library Processor Agent ===\n");

  const { data: items, error } = await supabase
    .from("document_queue")
    .select("id, file_url, file_name, is_primary_source, source_domain")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("Queue fetch error:", error.message);
    return;
  }

  if (!items || items.length === 0) {
    console.log("No pending items in queue.");
    return;
  }

  console.log(`Found ${items.length} pending items\n`);

  for (let i = 0; i < items.length; i++) {
    await supabase
      .from("document_queue")
      .update({ status: "processing" })
      .eq("id", items[i].id);

    await processItem(items[i]);

    if (i < items.length - 1) await sleep(DELAY_MS);
  }

  console.log("\n=== Processing complete ===");
}

main().catch(console.error);
