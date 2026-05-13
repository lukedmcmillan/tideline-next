/* eslint-disable @typescript-eslint/no-require-imports */
import { config } from "dotenv";
config({ path: ".env.local" });

import { extractText } from "unpdf";
import { randomUUID } from "crypto";
import { fetchAsTideline, RobotsBlocked } from "../app/lib/http-client";

let _supabase: any;
function getSupabase() {
  if (!_supabase) {
    const { createClient } = require("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) { console.error("Missing SUPABASE env vars"); process.exit(1); }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

let _anthropic: any;
function getAnthropic() {
  if (!_anthropic) {
    const Anthropic = require("@anthropic-ai/sdk").default;
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

const BATCH_LIMIT = 500;
const DELAY_MS = 2000;
const limitArg = process.argv.find(a => a.startsWith("--limit="));
const TOTAL_LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

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
  const msg = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
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

// Parse machine-safe decision slug (written by InforMEA scraper) back to human-readable title.
// Pattern: {TREATY}_DEC_{major}_{minor}[_REV_{revref}]
// Examples:
//   "CITES_DEC_20_49"          -> "CITES Decision 20.49"
//   "CITES_DEC_19_178_REV_COP20" -> "CITES Decision 19.178 (Rev. CoP20)"
// Returns null if file_name doesn't match the expected slug pattern.
function parseDecisionId(fileName: string): string | null {
  const m = fileName.match(/^([A-Z]+)_DEC_(\d+)_(\d+)(?:_REV_(.+))?$/);
  if (!m) return null;
  const treaty = m[1];
  const baseTitle = `${treaty} Decision ${m[2]}.${m[3]}`;
  if (!m[4]) return baseTitle;
  // Format revision reference: COP20 -> CoP20
  const revFormatted = m[4].replace(/COP(\d+)/i, "CoP$1");
  return `${baseTitle} (Rev. ${revFormatted})`;
}

// Fetch page text via Jina reader (handles JS-rendered pages).
// r.jina.ai has a 0ms rate-limit override in http-client.ts (Jina manages its own
// crawl etiquette toward the target domain; Tideline is not the direct HTTP client).
async function fetchViaJina(url: string): Promise<string> {
  const jinaKey = process.env.JINA_API_KEY;
  const res = await fetchAsTideline(`https://r.jina.ai/${url}`, {
    headers: jinaKey ? { "Authorization": `Bearer ${jinaKey}` } : {},
  });
  if (!res.ok) throw new Error(`Jina HTTP ${res.status}`);
  return res.text();
}

async function markFailed(id: string, reason: string) {
  await getSupabase()
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
  source_format: string | null;
}) {
  console.log(`\nProcessing: ${item.file_name} [${item.source_format ?? "pdf"}]`);

  const isHtml = item.source_format === "html";

  // Download content — PDF or HTML via Jina
  let fullText: string;
  let pdfBuffer: ArrayBuffer | null = null;

  if (isHtml) {
    // HTML path: fetch rendered page text via Jina
    try {
      fullText = await fetchViaJina(item.file_url);
    } catch (err) {
      await markFailed(item.id, `Jina fetch error: ${err}`);
      return;
    }
    if (!fullText || fullText.trim().length < 100) {
      await markFailed(item.id, "HTML fetch returned insufficient text");
      return;
    }
  } else {
    // PDF path: download with canonical Tideline UA + robots.txt compliance
    try {
      const res = await fetchAsTideline(item.file_url);
      if (!res.ok) { await markFailed(item.id, `Download HTTP ${res.status}`); return; }
      pdfBuffer = await res.arrayBuffer();
    } catch (err) {
      if (err instanceof RobotsBlocked) {
        await markFailed(item.id, `RobotsBlocked: ${err.domain} — ${err.rule}`);
        return;
      }
      await markFailed(item.id, `Download error: ${err}`);
      return;
    }

    try {
      const bufferCopy = pdfBuffer.slice(0);
      const result = await extractText(new Uint8Array(bufferCopy));
      const pages = result.text;
      fullText = Array.isArray(pages) ? pages.join("\n") : String(pages);
    } catch (err) {
      await markFailed(item.id, `PDF parse error: ${err}`);
      return;
    }
  }

  // STEP 0 — RELEVANCE (first 1000 chars)

  if (!fullText || fullText.trim().length === 0) {
    await markFailed(item.id, "SKIP: empty text extraction");
    return;
  }

  const previewText = fullText.slice(0, 1000);
  if (previewText.trim().length < 100) {
    await markFailed(item.id, isHtml ? "HTML fetch returned insufficient text" : "Scanned PDF — insufficient text");
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
    await markFailed(item.id, "Insufficient extractable text");
    return;
  }

  // STEP 2 — EXTRACT (Pass 1)
  const extractRaw = await haikuCall(
    `Precise ocean governance metadata extractor.
title: exact official title, never paraphrase.
source_organisation: issuing body only.
document_type: MUST be exactly one of: treaty,resolution,report,regulation,scientific_paper,ngo_report,government_document,court_filing,other — no other values ever.
published_date: YYYY-MM-DD. Year only -> YYYY-01-01. Month-year -> YYYY-MM-01. Unknown -> empty string.
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
  // For decision ID filenames (e.g. CITES_DEC_20_49), the decision number is the primary title.
  // Claude's extracted title becomes the subtitle (descriptive text).
  const decisionId = parseDecisionId(item.file_name);
  const primaryTitle = decisionId ?? String(verified.title || "").trim();
  const subtitle = decisionId ? String(verified.title || "").trim() : null;

  const sourceOrg = String(verified.source_organisation || "").trim();
  const docType = sanitiseDocumentType(String(verified.document_type || ""));
  const pubDate = sanitiseDate(verified.published_date as string | null);
  const topicTags = Array.isArray(verified.topic_tags) ? verified.topic_tags as string[] : [];
  const regionTags = Array.isArray(verified.region_tags) ? verified.region_tags as string[] : [];

  // STEP 5 — VALIDATE
  if (primaryTitle.length <= 5 || /^https?:\/\//.test(primaryTitle) || /\.\w{2,4}$/.test(primaryTitle)) {
    await markFailed(item.id, `Validation failed: bad title "${primaryTitle}"`);
    return;
  }
  if (sourceOrg.length <= 3) {
    await markFailed(item.id, `Validation failed: bad source_organisation "${sourceOrg}"`);
    return;
  }

  // STEP 6 — STORAGE (PDF only; HTML documents are not uploaded to storage)
  let storedFileUrl: string;
  let fileSizeBytes: number | null = null;

  if (isHtml) {
    // HTML: file_url in documents is the canonical page URL
    storedFileUrl = item.file_url;
  } else {
    const uuid = randomUUID();
    const storagePath = `library/${uuid}.pdf`;
    const { error: uploadError } = await getSupabase().storage
      .from("tideline-documents")
      .upload(storagePath, Buffer.from(pdfBuffer!), {
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) {
      await markFailed(item.id, `Storage upload failed: ${uploadError.message}`);
      return;
    }
    storedFileUrl = storagePath;
    fileSizeBytes = pdfBuffer!.byteLength;
  }

  // STEP 7 — INSERT
  const { error: insertError } = await getSupabase().from("documents").insert({
    title:               primaryTitle,
    subtitle:            subtitle || undefined,
    source_organisation: sourceOrg,
    document_type:       docType,
    published_date:      pubDate,
    file_url:            storedFileUrl,
    canonical_url:       isHtml ? item.file_url : null,
    source_format:       item.source_format ?? (isHtml ? "html" : "pdf"),
    file_size_bytes:     fileSizeBytes,
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
  await getSupabase()
    .from("document_queue")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", item.id);

  console.log(`  OK: "${primaryTitle}" (${docType})`);
}

const loopMode = process.argv.includes("--loop") || limitArg !== undefined;
const formatFilter = process.argv.find(a => a.startsWith("--format="))?.split("=")[1] ?? null;
const domainFilter = process.argv.find(a => a.startsWith("--domain="))?.split("=")[1] ?? null;

async function processBatch(): Promise<number> {
  let query = getSupabase()
    .from("document_queue")
    .select("id, file_url, file_name, is_primary_source, source_domain, source_format")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (formatFilter) query = query.eq("source_format", formatFilter);
  if (domainFilter) query = query.eq("source_domain", domainFilter);

  const { data: items, error } = await query;

  if (error) {
    console.error("Queue fetch error:", error.message);
    return 0;
  }

  if (!items || items.length === 0) return 0;

  console.log(`Found ${items.length} pending items\n`);

  for (let i = 0; i < items.length; i++) {
    await getSupabase()
      .from("document_queue")
      .update({ status: "processing" })
      .eq("id", items[i].id);

    await processItem(items[i]);

    if (i < items.length - 1) await sleep(DELAY_MS);
  }

  return items.length;
}

async function main() {
  console.log("=== Tideline Library Processor Agent ===");
  const limitDisplay = TOTAL_LIMIT === Infinity ? "unlimited" : String(TOTAL_LIMIT);
  const filterDisplay = [
    formatFilter ? `Format: ${formatFilter}` : "",
    domainFilter ? `Domain: ${domainFilter}` : "",
  ].filter(Boolean).map(s => ` | ${s}`).join("");
  console.log(`Batch size: ${BATCH_LIMIT} | Limit: ${limitDisplay} | Loop mode: ${loopMode}${filterDisplay}\n`);

  let totalProcessed = 0;
  let batchNum = 0;

  do {
    batchNum++;
    if (batchNum > 1) console.log(`\n--- Batch ${batchNum} ---\n`);

    const count = await processBatch();
    totalProcessed += count;

    if (count === 0) {
      console.log("No pending items in queue.");
      break;
    }

    console.log(`\nBatch ${batchNum} done (${count} items, ${totalProcessed} total)`);

    if (totalProcessed >= TOTAL_LIMIT) {
      console.log(`Reached --limit of ${TOTAL_LIMIT}. Stopping.`);
      break;
    }
  } while (loopMode);

  console.log(`\n=== Processing complete. ${totalProcessed} items processed. ===`);
}

main().catch(console.error);
