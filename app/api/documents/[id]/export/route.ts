import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc, error } = await supabase
    .from("project_documents")
    .select("title, content_text")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lines = (doc.content_text || "").split("\n").filter((l: string) => l.trim());
  const children = [
    new Paragraph({
      children: [new TextRun({ text: doc.title, bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    ...lines.map(
      (line: string) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 120 },
        })
    ),
  ];

  const document = new Document({
    sections: [{ children }],
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
