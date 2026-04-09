import { NextRequest, NextResponse } from "next/server";
import { getEmailFromSession } from "@/app/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MODEL = "claude-haiku-4-5-20251001";
const TEXT_LIMIT = 6000;
const SCANNED_THRESHOLD = 200;

const EXTRACTION_SYSTEM = `You are a precise document metadata extractor specialising in ocean governance, maritime law, environmental policy, and international treaties. You extract metadata from legal and policy documents with high accuracy.

Rules:
- title: use the exact official title as it appears in the document. Never paraphrase or shorten it.
- source_organisation: the issuing body, not a distributor or host website. For UN documents use the specific body (e.g. 'United Nations Division for Ocean Affairs' not just 'United Nations').
- document_type: choose the most precise match. Use treaty only for binding international agreements. Use resolution for formal decisions by governing bodies. Use regulation for legally binding rules. Use report for assessments, reviews, and analyses. Use scientific_paper for peer-reviewed research. Use ngo_report for civil society publications. Use government_document for national government publications. Use court_filing for legal proceedings. Use other only if none of the above fit.
- published_date: find the adoption date, publication date, or signature date in that order of preference. Format as YYYY-MM-DD. If only year is found use YYYY-01-01. If genuinely unknown return empty string.
- topic_tags: 3 to 6 specific tags. Use established terms from ocean governance: BBNJ, UNCLOS, ISA, IMO, MARPOL, 30x30, IUU fishing, deep-sea mining, marine protected areas, blue carbon, high seas, fisheries, shipping, biodiversity, climate, plastics, coral reefs, whaling, polar oceans. Do not invent vague tags.
- region_tags: use specific regions where applicable: Global, Arctic, Antarctic, Pacific, Atlantic, Indian Ocean, Mediterranean, North Sea, Pacific Island States, Caribbean, Baltic. Use Global if the document applies worldwide.

Return only valid JSON. No markdown. No explanation. No preamble. Just the JSON object.`;

const VERIFICATION_SYSTEM = `You are a metadata verifier. Review this extracted metadata against the document text and correct any errors.

Pay special attention to:
- Is the title the exact official title or a paraphrase? Correct to exact.
- Is the document_type the most precise available? Correct if not.
- Is the published_date accurate and correctly formatted? Correct if not.
- Are topic_tags specific established terms or vague invented ones? Replace vague tags with established ocean governance terminology.

Return only the corrected JSON object. No markdown. No explanation.`;

interface ExtractedMetadata {
  title: string;
  source_organisation: string;
  document_type: string;
  published_date: string;
  topic_tags: string[];
  region_tags: string[];
}

function computeConfidence(first: ExtractedMetadata, verified: ExtractedMetadata): "high" | "medium" | "low" {
  const titleMatch = first.title === verified.title;
  const sourceMatch = first.source_organisation === verified.source_organisation;
  const typeMatch = first.document_type === verified.document_type;

  if (titleMatch && sourceMatch && typeMatch) return "high";

  const dateMatch = first.published_date === verified.published_date;
  const tagsMatch = JSON.stringify(first.topic_tags) === JSON.stringify(verified.topic_tags);

  if ((titleMatch || sourceMatch || typeMatch) && (dateMatch || tagsMatch)) return "medium";

  return "low";
}

function parseJSON(text: string): ExtractedMetadata | null {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.type === "text/plain") {
    text = buffer.toString("utf-8").slice(0, TEXT_LIMIT);
  } else if (file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text.slice(0, TEXT_LIMIT);
    } catch {
      return NextResponse.json({
        error: "scanned",
        message: "This appears to be a scanned document. Please fill in the metadata manually.",
      });
    }
  } else if (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = (await import("mammoth")).default;
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value.slice(0, TEXT_LIMIT);
    } catch {
      return NextResponse.json({
        error: "scanned",
        message: "Could not extract text from this document. Please fill in the metadata manually.",
      });
    }
  } else {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  // Scanned PDF fallback
  if (text.trim().length < SCANNED_THRESHOLD) {
    return NextResponse.json({
      error: "scanned",
      message: "This appears to be a scanned document. Please fill in the metadata manually.",
    });
  }

  // Pass 1: Extract
  const extractionResponse = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM,
    messages: [{ role: "user", content: `Extract metadata from this document:\n\n${text}` }],
  });

  const firstText = extractionResponse.content[0].type === "text" ? extractionResponse.content[0].text : "";
  const firstResult = parseJSON(firstText);

  if (!firstResult) {
    return NextResponse.json({ error: "Failed to extract metadata" }, { status: 500 });
  }

  // Pass 2: Verify
  const verificationResponse = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: VERIFICATION_SYSTEM,
    messages: [{ role: "user", content: `Extracted metadata: ${JSON.stringify(firstResult)}\n\nDocument text: ${text}` }],
  });

  const verifiedText = verificationResponse.content[0].type === "text" ? verificationResponse.content[0].text : "";
  const verifiedResult = parseJSON(verifiedText);

  const final = verifiedResult || firstResult;
  const confidence = verifiedResult ? computeConfidence(firstResult, verifiedResult) : "low";

  return NextResponse.json({ ...final, confidence });
}
