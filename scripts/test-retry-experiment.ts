/**
 * scripts/test-retry-experiment.ts
 *
 * Phase 2B empirical test — instrumented retry runner.
 *
 * Fetches each queued record for a given domain using the canonical Tideline UA
 * (via fetchAsTideline) and captures per-record diagnostics WITHOUT invoking
 * the Haiku pipeline. This isolates the "does canonical UA unblock this source?"
 * question from the downstream PDF extraction question.
 *
 * Usage:
 *   npx tsx scripts/test-retry-experiment.ts --domain=awionline.org
 *   npx tsx scripts/test-retry-experiment.ts --domain=uk.whales.org
 *
 * Output: per-record stage breakdown + summary table
 * Side-effect: updates document_queue.error_message and status with findings
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchAsTideline, RobotsBlocked } from "../app/lib/http-client";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const domainArg = process.argv.find(a => a.startsWith("--domain="))?.split("=")[1];
if (!domainArg) {
  console.error("Usage: npx tsx scripts/test-retry-experiment.ts --domain=<domain>");
  process.exit(1);
}

type QueueRow = { id: string; file_url: string; file_name: string; source_domain: string };

type RecordResult = {
  id: string;
  url: string;
  httpStatus: number | null;
  contentType: string | null;
  bodyClass: "pdf" | "html" | "empty" | "other" | "robots_blocked" | "fetch_error" | "timeout";
  stage: "robots_check" | "fetch" | "content_detection" | "complete";
  error: string | null;
  wallMs: number;
};

function detectBodyClass(contentType: string | null, bodyPreview: Uint8Array | null): "pdf" | "html" | "empty" | "other" {
  if (!bodyPreview || bodyPreview.length === 0) return "empty";
  // PDF magic bytes: %PDF
  if (bodyPreview[0] === 0x25 && bodyPreview[1] === 0x50 && bodyPreview[2] === 0x44 && bodyPreview[3] === 0x46) return "pdf";
  // Content-Type check
  if (contentType?.includes("pdf")) return "pdf";
  if (contentType?.includes("html") || contentType?.includes("text/plain")) return "html";
  // HTML signature in body
  const snippet = new TextDecoder().decode(bodyPreview.slice(0, 200)).toLowerCase();
  if (snippet.includes("<!doctype html") || snippet.includes("<html")) return "html";
  return "other";
}

async function testRecord(row: QueueRow): Promise<RecordResult> {
  const start = Date.now();
  const result: RecordResult = {
    id: row.id,
    url: row.file_url,
    httpStatus: null,
    contentType: null,
    bodyClass: "fetch_error",
    stage: "fetch",
    error: null,
    wallMs: 0,
  };

  try {
    const res = await fetchAsTideline(row.file_url, { timeoutMs: 20000 });
    result.httpStatus = res.status;
    result.contentType = res.headers.get("content-type");
    result.stage = "content_detection";

    if (!res.ok) {
      result.bodyClass = "fetch_error";
      result.error = `HTTP ${res.status}`;
      result.wallMs = Date.now() - start;
      return result;
    }

    // Read first 512 bytes to detect content type without downloading full body
    const reader = res.body?.getReader();
    let preview: Uint8Array | null = null;
    if (reader) {
      const { value } = await reader.read();
      preview = value ?? null;
      reader.cancel();
    }

    result.bodyClass = detectBodyClass(result.contentType, preview);
    result.stage = "complete";

  } catch (err) {
    if (err instanceof RobotsBlocked) {
      result.bodyClass = "robots_blocked";
      result.stage = "robots_check";
      result.error = `RobotsBlocked: ${err.domain} — ${err.rule}`;
    } else if ((err as Error).name === "TimeoutError" || (err as Error).message?.includes("timeout")) {
      result.bodyClass = "timeout";
      result.error = `Timeout after 20s`;
    } else {
      result.error = String(err).slice(0, 120);
    }
  }

  result.wallMs = Date.now() - start;
  return result;
}

async function main() {
  const { data: rows, error } = await (sb as any)
    .from("document_queue")
    .select("id, file_url, file_name, source_domain")
    .eq("status", "pending")
    .eq("source_domain", domainArg)
    .order("created_at", { ascending: true });

  if (error) { console.error("Queue fetch error:", error.message); process.exit(1); }
  const records = (rows || []) as QueueRow[];

  console.log(`\n=== Phase 2B Retry Experiment — ${domainArg} (${records.length} records) ===`);
  console.log(`UA: Tideline/1.0 (+https://thetideline.co/about-our-crawler; research@thetideline.co)\n`);

  const results: RecordResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    process.stdout.write(`[${i + 1}/${records.length}] ${row.file_url.slice(0, 70)}... `);
    const r = await testRecord(row);
    results.push(r);

    const statusStr = r.httpStatus ? `HTTP ${r.httpStatus}` : "no status";
    const ctStr = r.contentType ? r.contentType.split(";")[0].trim() : "no content-type";
    console.log(`${statusStr} | ${ctStr} | body=${r.bodyClass} | ${r.wallMs}ms${r.error ? ` | ${r.error}` : ""}`);

    // Update document_queue with diagnostic result
    const errorMsg = r.bodyClass === "pdf" && !r.error
      ? null  // leave pending for real processor to handle
      : `[retry-test] HTTP ${r.httpStatus ?? "err"} | body=${r.bodyClass}${r.error ? ` | ${r.error}` : ""}`;

    // Only mark as failed if it clearly can't succeed; leave PDF body as pending
    const newStatus = r.bodyClass === "pdf" ? "pending" : "failed";

    await (sb as any)
      .from("document_queue")
      .update({ status: newStatus, error_message: errorMsg, processed_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  // Summary table
  const counts = {
    "HTTP 403 (still blocked)":    results.filter(r => r.httpStatus === 403).length,
    "HTTP 200 + PDF (pass)":       results.filter(r => r.httpStatus === 200 && r.bodyClass === "pdf").length,
    "HTTP 200 + HTML (UA lifted, wrong content)": results.filter(r => r.httpStatus === 200 && r.bodyClass === "html").length,
    "HTTP 200 + empty":            results.filter(r => r.httpStatus === 200 && r.bodyClass === "empty").length,
    "HTTP 200 + other":            results.filter(r => r.httpStatus === 200 && r.bodyClass === "other").length,
    "RobotsBlocked":               results.filter(r => r.bodyClass === "robots_blocked").length,
    "Timeout":                     results.filter(r => r.bodyClass === "timeout").length,
    "Other HTTP error":            results.filter(r => r.httpStatus !== null && r.httpStatus !== 200 && r.httpStatus !== 403).length,
    "Fetch error (no status)":     results.filter(r => r.httpStatus === null && r.bodyClass !== "robots_blocked" && r.bodyClass !== "timeout").length,
  };

  const total = results.length;
  const avgMs = total > 0 ? Math.round(results.reduce((s, r) => s + r.wallMs, 0) / total) : 0;

  console.log(`\n${"═".repeat(55)}`);
  console.log(`RESULTS — ${domainArg} (${total} records tested, avg ${avgMs}ms/record)`);
  console.log("═".repeat(55));
  for (const [label, n] of Object.entries(counts)) {
    if (n > 0) console.log(`  ${label.padEnd(40)} ${n}/${total}`);
  }

  const ua403 = counts["HTTP 403 (still blocked)"];
  const uaLifted = counts["HTTP 200 + PDF (pass)"] + counts["HTTP 200 + HTML (UA lifted, wrong content)"];
  const robots   = counts["RobotsBlocked"];

  console.log(`\nOption B interpretation for ${domainArg}:`);
  if (robots > 0) {
    console.log(`  → robots.txt BLOCKED ${robots} URLs — Phase 1 working as intended.`);
  }
  if (ua403 === total) {
    console.log(`  → ALL records still HTTP 403. Canonical UA did NOT lift the block.`);
    console.log(`    This source requires Option C (partnership/API access), not Option B.`);
  } else if (ua403 === 0 && uaLifted > 0) {
    console.log(`  → UA block LIFTED (0 403s). Content-type results vary — see breakdown above.`);
  } else if (ua403 > 0 && uaLifted > 0) {
    console.log(`  → MIXED: ${ua403} still blocked, ${uaLifted} UA lifted. Partial Option B win.`);
  } else {
    console.log(`  → Results inconclusive — check individual record errors above.`);
  }
}

main().catch(console.error);
