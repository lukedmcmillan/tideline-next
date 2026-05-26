import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Document, Paragraph, TextRun, Packer, HeadingLevel,
  Header, Footer, AlignmentType, convertInchesToTwip,
  TabStopPosition, TabStopType,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

// Parse inline HTML (bold/italic/underline) into TextRun array.
// Handles: <strong>, <b>, <em>, <i>, <u>, and strips other tags.
function parseInlineRuns(html: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = html.split(/(<\/?(strong|b|em|i|u|s|mark|code|span)[^>]*>)/i);
  let bold = false, italic = false, underline = false;

  for (const part of parts) {
    if (!part) continue;
    if (/^<(strong|b)\b/i.test(part)) { bold = true; continue; }
    if (/^<\/(strong|b)>/i.test(part)) { bold = false; continue; }
    if (/^<(em|i)\b/i.test(part)) { italic = true; continue; }
    if (/^<\/(em|i)>/i.test(part)) { italic = false; continue; }
    if (/^<u\b/i.test(part)) { underline = true; continue; }
    if (/^<\/u>/i.test(part)) { underline = false; continue; }
    if (/^<[^>]+>$/.test(part)) continue; // skip other tags

    const text = decodeEntities(part);
    if (text) {
      runs.push(new TextRun({
        text,
        bold: bold || undefined,
        italics: italic || undefined,
        underline: underline ? {} : undefined,
        font: "Calibri",
        size: 22,
      }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: "", font: "Calibri", size: 22 })];
}

// Convert Tiptap HTML to docx Paragraph array.
// Handles top-level: <h1>-<h3>, <p>, <ul>, <ol>, <blockquote>.
// Inline formatting: <strong>, <em>, <u> via parseInlineRuns.
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  // Match top-level block elements (non-greedy, non-nested same-tag assumption for v1)
  const blockRe = /<(h[1-3]|p|ul|ol|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[3];

    if (tag === "h1") {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, ""));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, bold: true, font: "Calibri", size: 40 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 240 },
      }));
    } else if (tag === "h2") {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, ""));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, bold: true, font: "Calibri", size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (tag === "h3") {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, ""));
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, bold: true, font: "Calibri", size: 24 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    } else if (tag === "p") {
      const runs = parseInlineRuns(inner);
      paragraphs.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    } else if (tag === "ul" || tag === "ol") {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      let index = 1;
      while ((liMatch = liRe.exec(inner)) !== null) {
        const liContent = liMatch[1].replace(/<\/?p[^>]*>/gi, "");
        const runs = parseInlineRuns(liContent);
        if (tag === "ul") {
          paragraphs.push(new Paragraph({
            children: runs,
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        } else {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `${index}. `, font: "Calibri", size: 22 }), ...runs],
            spacing: { after: 60 },
          }));
          index++;
        }
      }
    } else if (tag === "blockquote") {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text, italics: true, font: "Calibri", size: 22, color: "5F6368" })],
          indent: { left: convertInchesToTwip(0.5) },
          spacing: { after: 120 },
          border: { left: { style: "single", size: 8, color: "1D9E75", space: 8 } },
        }));
      }
    }
  }

  return paragraphs;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch draft — id is the project UUID (sent by the client from realProjectId.current)
  const { data: draft, error } = await supabase
    .from("project_drafts")
    .select("title, content")
    .eq("project_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const docTitle = draft.title || "Untitled Draft";
  const html = draft.content || "";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  let bodyParagraphs: Paragraph[];
  if (html.trimStart().startsWith("<")) {
    bodyParagraphs = htmlToDocxParagraphs(html);
  } else {
    // Legacy plain-text fallback
    bodyParagraphs = html.split("\n").filter((l: string) => l.trim()).map((line: string) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
        spacing: { after: 120 },
      })
    );
  }

  const titlePara = new Paragraph({
    children: [new TextRun({ text: docTitle, bold: true, font: "Calibri", size: 36 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
  });

  const document = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: docTitle, font: "Calibri", size: 16, color: "202124" }),
              new TextRun({ text: "\tTideline Ocean Intelligence", font: "Calibri", size: 16, color: "1D9E75" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ text: `Generated by Tideline \u00B7 thetideline.co \u00B7 ${today}`, font: "Calibri", size: 18, color: "9AA0A6" })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [titlePara, ...bodyParagraphs],
    }],
  });

  const buffer = await Packer.toBuffer(document);
  const filename = docTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
    },
  });
}
