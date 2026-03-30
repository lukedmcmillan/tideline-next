import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import {
  Document, Paragraph, TextRun, Packer, HeadingLevel,
  Header, Footer, AlignmentType, convertInchesToTwip,
  LevelFormat, TabStopPosition, TabStopType,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(req: NextRequest): Promise<string | null> {
  const email = await getEmailFromSession(req);
  if (!email) return null;
  const { data } = await supabase.from("users").select("id").eq("email", email).single();
  return data?.id || null;
}

interface Footnote {
  title: string;
  source: string;
  date: string;
}

function parseMarks(node: any): TextRun[] {
  if (!node.text) return [];
  const bold = node.marks?.some((m: any) => m.type === "bold") || false;
  const italic = node.marks?.some((m: any) => m.type === "italic") || false;
  return [new TextRun({ text: node.text, bold, italics: italic, font: "Calibri", size: 22 })];
}

function parseTiptapContent(content: any): { paragraphs: Paragraph[]; footnotes: Footnote[] } {
  const paragraphs: Paragraph[] = [];
  const footnotes: Footnote[] = [];

  if (!content?.content) return { paragraphs, footnotes };

  for (const node of content.content) {
    if (node.type === "heading") {
      const text = node.content?.map((c: any) => c.text || "").join("") || "";
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, bold: true, font: "Calibri", size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (node.type === "paragraph") {
      const runs: TextRun[] = [];
      for (const child of (node.content || [])) {
        runs.push(...parseMarks(child));
      }
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
      } else {
        paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
      }
    } else if (node.type === "bulletList") {
      for (const li of (node.content || [])) {
        const liRuns: TextRun[] = [];
        for (const p of (li.content || [])) {
          for (const child of (p.content || [])) {
            liRuns.push(...parseMarks(child));
          }
        }
        paragraphs.push(new Paragraph({
          children: liRuns,
          bullet: { level: 0 },
          spacing: { after: 60 },
        }));
      }
    } else if (node.type === "blockquote") {
      // Citation or research block — extract as footnote
      const texts: string[] = [];
      for (const p of (node.content || [])) {
        for (const child of (p.content || [])) {
          if (child.text) texts.push(child.text);
        }
      }
      const fullText = texts.join(" ");
      const fnIndex = footnotes.length + 1;
      footnotes.push({ title: fullText.slice(0, 100), source: "Tideline Intelligence", date: "" });
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: fullText.slice(0, 200), italics: true, font: "Calibri", size: 22 }),
          new TextRun({ text: ` [${fnIndex}]`, font: "Calibri", size: 18, superScript: true }),
        ],
        spacing: { after: 120 },
      }));
    }
  }

  return { paragraphs, footnotes };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc, error } = await supabase
    .from("project_documents")
    .select("title, content, content_text")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  let mainChildren: Paragraph[];
  let footnotes: Footnote[] = [];

  if (doc.content) {
    const parsed = parseTiptapContent(doc.content);
    mainChildren = parsed.paragraphs;
    footnotes = parsed.footnotes;
  } else {
    const lines = (doc.content_text || "").split("\n").filter((l: string) => l.trim());
    mainChildren = lines.map((line: string) => new Paragraph({
      children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
      spacing: { after: 120 },
    }));
  }

  // Title paragraph
  const titlePara = new Paragraph({
    children: [new TextRun({ text: doc.title, bold: true, font: "Calibri", size: 36 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
  });

  // Footnotes section
  const footnoteParagraphs: Paragraph[] = [];
  if (footnotes.length > 0) {
    footnoteParagraphs.push(new Paragraph({ spacing: { before: 480 } }));
    footnoteParagraphs.push(new Paragraph({
      children: [new TextRun({ text: "Sources", bold: true, font: "Calibri", size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 120 },
    }));
    for (let i = 0; i < footnotes.length; i++) {
      const fn = footnotes[i];
      footnoteParagraphs.push(new Paragraph({
        children: [new TextRun({ text: `[${i + 1}] ${fn.title} \u2014 ${fn.source}`, font: "Calibri", size: 18, color: "5F6368" })],
        spacing: { after: 60 },
      }));
    }
  }

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
              new TextRun({ text: doc.title, font: "Calibri", size: 16, color: "202124" }),
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
      children: [titlePara, ...mainChildren, ...footnoteParagraphs],
    }],
  });

  const buffer = await Packer.toBuffer(document);
  const filename = doc.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.docx"`,
    },
  });
}
