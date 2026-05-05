/**
 * test-alert-email.tsx — dry-run renderer for ThresholdAlertEmail.
 *
 * Renders two variants and writes HTML to scripts/:
 *   alert-preview-up.html   — ISA WATCH→ELEVATED (upward)
 *   alert-preview-down.html — ISA HIGH→ELEVATED  (downward)
 *
 * Also prints: sparkline SVGs (ramp + flat), Haiku prompt (ISA WATCH→ELEVATED).
 * No Haiku call, no Supabase query.
 *
 * Run: npx tsx scripts/test-alert-email.tsx
 */
import * as React from "react";
import { render } from "@react-email/render";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ThresholdAlertEmail } from "../emails/threshold-alert";
import { buildSparkline } from "../lib/email/sparkline";
import { DOMAIN_NAMES, INST_TYPE, PREP_HORIZON } from "../app/lib/tracker-metadata";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Shared seed data ──────────────────────────────────────────────────────────

const shortSlug = "isa";
const longSlug = "isa-deep-sea-mining";
const trackerName = DOMAIN_NAMES[shortSlug]; // "Deep-Sea Mining"

// ── Fix 2 — Haiku prompt (plain English inst type, no jargon) ────────────────

const PLAIN_INST_TYPE: Record<string, string> = {
  "Type 1": "unilateral decision-maker",
  "Type 1/2": "unilateral decision-maker",
  "Type 2": "plurilateral with clear mandate",
  "Type 3": "multilateral with known veto players",
  "Type 6": "plurilateral with clear mandate",
};

const instData = INST_TYPE[shortSlug];
const instType = instData ? (PLAIN_INST_TYPE[instData.type] ?? "multilateral") : "multilateral";
const prepHorizon = PREP_HORIZON[shortSlug] ?? "timing uncertain";

const haikuPrompt =
  `A Pulse Score for ${trackerName} just moved from WATCH to ELEVATED. ` +
  `This domain's governing body is a ${instType}, with a typical preparation ` +
  `horizon of ${prepHorizon} between elevated signals and decision events. ` +
  `Write one paragraph (max 60 words) explaining what this band crossing means ` +
  `for an ocean compliance, ESG, or legal professional tracking this domain. ` +
  `Plain prose, no em dashes, no jargon, no hedging.`;

console.log("\n=== HAIKU PROMPT (ISA WATCH\u2192ELEVATED) ===\n");
console.log(haikuPrompt);

// ── Fix 4 — Sparkline: ramp vs flat ─────────────────────────────────────────
// Fixed 0–10 y-axis: a flat tracker at 6.0 renders flat, a ramp renders as ramp.

const rampScores = [3.2, 3.8, 4.1, 4.5, 5.0, 5.3, 5.8, 6.1, 6.4, 6.8, 7.1, 7.4];
const flatScores = [6.0, 6.1, 6.0, 6.2, 6.0, 6.1, 6.0, 6.0, 6.1, 6.0, 6.0, 6.1];

const rampSvg = buildSparkline(rampScores, "#1D9E75");
const flatSvg = buildSparkline(flatScores, "#EF9F27"); // WATCH amber for visual contrast

console.log("\n=== SPARKLINE: RAMP (3.2\u21927.4, teal) ===\n");
console.log(rampSvg);
console.log("\n=== SPARKLINE: FLAT (6.0\u20136.2 band, amber) ===\n");
console.log(flatSvg);

// ── Shared story ─────────────────────────────────────────────────────────────

const sampleStory = {
  sourceName: "ISA SECRETARIAT",
  headline:
    "ISA Council adopts revised regulatory framework for polymetallic nodule extraction",
  summary:
    "The ISA Council has agreed a revised regulatory framework setting binding environmental baselines for deep-sea mining contractors, ahead of the next scheduled Council session.",
  publishedAt: "1 May 2026",
};

const ctaUrl = `https://thetideline.co/platform/trackers/${shortSlug}`;
const trackedEntities = ["International Seabed Authority", "ISA Legal and Technical Commission"];

const sampleInterpretationUp =
  "Deep-Sea Mining activity has entered ELEVATED territory, reflecting a measurable increase in ISA Council document publication and contractor correspondence. For compliance and legal professionals, this band typically precedes ISA Council decision windows by 4 to 8 weeks. Monitor contractor licence conditions and regulatory guidance updates closely.";

const sampleInterpretationDown =
  "Deep-Sea Mining activity has dropped from HIGH to ELEVATED. The most active phase of the Council cycle appears to be passing. Immediate decision pressure is reduced, but conditions remain elevated. Continue monitoring for secondary regulatory outputs from the recent session.";

// ── Render variant 1: WATCH→ELEVATED (upward, teal arrow) ────────────────────

async function renderUp() {
  const element = React.createElement(ThresholdAlertEmail, {
    trackerName,
    prevBand: "WATCH" as const,
    newBand: "ELEVATED" as const,
    score: 7.4,
    direction: "accelerating",
    sparklineSvg: rampSvg,
    story: sampleStory,
    interpretation: sampleInterpretationUp,
    ctaUrl,
    trackedEntities,
    // Fix 3: honest preheader — no fabricated session date
    preheaderText: `Score moved from WATCH to ELEVATED.`,
  });
  const html = await render(element);
  const outPath = join(__dirname, "alert-preview-up.html");
  writeFileSync(outPath, html, "utf8");
  console.log(`\n=== WATCH\u2192ELEVATED written to scripts/alert-preview-up.html (${Buffer.byteLength(html)} bytes) ===`);
  return html;
}

// ── Render variant 2: HIGH→ELEVATED (downward, red arrow ▼) ──────────────────

async function renderDown() {
  const element = React.createElement(ThresholdAlertEmail, {
    trackerName,
    prevBand: "HIGH" as const,
    newBand: "ELEVATED" as const,
    score: 8.1,
    direction: "decelerating",
    sparklineSvg: buildSparkline([7.2, 7.8, 8.1, 8.5, 9.0, 8.9, 8.8, 8.6, 8.4, 8.3, 8.2, 8.1], "#1D9E75"),
    story: sampleStory,
    interpretation: sampleInterpretationDown,
    ctaUrl,
    trackedEntities,
    preheaderText: `Score moved from HIGH to ELEVATED.`,
  });
  const html = await render(element);
  const outPath = join(__dirname, "alert-preview-down.html");
  writeFileSync(outPath, html, "utf8");
  console.log(`\n=== HIGH\u2192ELEVATED written to scripts/alert-preview-down.html (${Buffer.byteLength(html)} bytes) ===`);
  return html;
}

async function sendTestEmail(subject: string, html: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — skipping send.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tideline <luke@thetideline.co>",
      reply_to: "luke@thetideline.co",
      to: "lukedmcmillan@gmail.com",
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Resend error: ${res.status} ${body}`);
  } else {
    const data = await res.json().catch(() => ({}));
    console.log(`\nTest email sent → luke@thetideline.co  id=${(data as { id?: string }).id ?? "?"}`);
  }
}

async function main() {
  const [upHtml, downHtml] = await Promise.all([renderUp(), renderDown()]);

  // Spot-check arrow colour in rendered HTML
  const upArrowCheck = upHtml.includes("color:#1D9E75") ? "PASS (teal ▲)" : "FAIL";
  const downArrowCheck = downHtml.includes("color:#E24B4A") && downHtml.includes("\u25BC")
    ? "PASS (red ▼)"
    : "FAIL";
  console.log(`\nArrow colour check — WATCH\u2192ELEVATED: ${upArrowCheck}`);
  console.log(`Arrow colour check — HIGH\u2192ELEVATED:  ${downArrowCheck}`);

  // ── Send real test emails via Resend ──────────────────────────────────────
  const upText = [
    `The Deep-Sea Mining Pulse Score just moved from WATCH to ELEVATED.`,
    ``,
    `Current score: 7.4 / 10`,
    `Direction: Accelerating`,
    ``,
    sampleInterpretationUp,
    ``,
    `View tracker: ${ctaUrl}`,
  ].join("\n");

  const downText = [
    `The Deep-Sea Mining Pulse Score just moved from HIGH to ELEVATED.`,
    ``,
    `Current score: 8.1 / 10`,
    `Direction: Decelerating`,
    ``,
    sampleInterpretationDown,
    ``,
    `View tracker: ${ctaUrl}`,
  ].join("\n");

  await sendTestEmail("Deep-Sea Mining just crossed ELEVATED (WATCH→ELEVATED test)", upHtml, upText);
  await sendTestEmail("Deep-Sea Mining just crossed ELEVATED (HIGH→ELEVATED test)", downHtml, downText);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
