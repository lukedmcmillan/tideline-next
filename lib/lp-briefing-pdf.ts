import PDFDocument from "pdfkit";

const TEAL = "#0d9488";
const NAVY = "#0a1628";
const GREY = "#64748b";
const LIGHT_GREY = "#f1f5f9";
const WHITE = "#ffffff";

const TOPIC_COLORS: Record<string, string> = {
  governance: "#1d6fa4",
  fisheries: "#0d9488",
  climate: "#dc2626",
  science: "#7c3aed",
  shipping: "#ea580c",
  bluefinance: "#0891b2",
  pollution: "#ca8a04",
  biodiversity: "#16a34a",
  energy: "#e11d48",
  defence: "#475569",
};

interface BriefingStory {
  story_id: string;
  title: string;
  link: string;
  source_name: string;
  topic: string;
  published_at: string;
  description: string | null;
  short_summary: string | null;
  alert_type: string | null;
  mention_context: string | null;
}

interface BriefingEntity {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  relationship: string;
  total_mentions: number;
  stories: BriefingStory[];
}

interface BriefingData {
  fund_name: string;
  period: { from: string | null; to: string | null };
  generated_at: string;
  summary: {
    total_mentions: number;
    entities_tracked: number;
    stories_covered: number;
  };
  entities: BriefingEntity[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPeriod(period: BriefingData["period"]): string {
  if (period.from && period.to) {
    return `${formatDate(period.from)} – ${formatDate(period.to)}`;
  }
  if (period.from) return `From ${formatDate(period.from)}`;
  if (period.to) return `Up to ${formatDate(period.to)}`;
  return "All time";
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - 72) {
    doc.addPage();
  }
}

export function generateLpBriefingPdf(data: BriefingData): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 56, right: 56 },
    info: {
      Title: `${data.fund_name} – LP Briefing`,
      Author: "Tideline",
      Subject: `Intelligence briefing for ${data.fund_name}`,
    },
  });

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ── Cover page ──

  doc.moveDown(6);

  // Teal accent bar
  doc
    .rect(doc.page.margins.left, doc.y, pageWidth, 4)
    .fill(TEAL);
  doc.moveDown(2);

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(32)
    .fillColor(NAVY)
    .text("LP Intelligence Briefing", { align: "left" });
  doc.moveDown(0.5);

  // Fund name
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(TEAL)
    .text(data.fund_name);
  doc.moveDown(0.3);

  // Period
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(GREY)
    .text(formatPeriod(data.period));
  doc.moveDown(0.2);

  // Generated date
  doc
    .fontSize(10)
    .fillColor(GREY)
    .text(`Generated ${formatDate(data.generated_at)}`);
  doc.moveDown(3);

  // Summary stats row
  const statBoxWidth = pageWidth / 3;
  const statsY = doc.y;
  const stats = [
    { label: "Entities Tracked", value: String(data.summary.entities_tracked) },
    { label: "Stories Covered", value: String(data.summary.stories_covered) },
    { label: "Total Mentions", value: String(data.summary.total_mentions) },
  ];

  stats.forEach((stat, i) => {
    const x = doc.page.margins.left + i * statBoxWidth;
    doc
      .rect(x, statsY, statBoxWidth - 8, 70)
      .fill(LIGHT_GREY);

    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor(TEAL)
      .text(stat.value, x, statsY + 12, {
        width: statBoxWidth - 8,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(GREY)
      .text(stat.label, x, statsY + 46, {
        width: statBoxWidth - 8,
        align: "center",
      });
  });

  doc.y = statsY + 90;
  doc.moveDown(3);

  // Tideline branding footer on cover
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GREY)
    .text("Prepared by Tideline — Ocean Intelligence Platform", {
      align: "center",
    });

  // ── Entity sections ──

  for (const entity of data.entities) {
    doc.addPage();

    // Entity header bar
    const headerY = doc.y;
    doc
      .rect(doc.page.margins.left, headerY, pageWidth, 36)
      .fill(NAVY);

    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .fillColor(WHITE)
      .text(entity.entity_name, doc.page.margins.left + 12, headerY + 10, {
        width: pageWidth - 120,
      });

    // Entity type badge
    const badgeText = entity.entity_type.toUpperCase();
    const badgeWidth = doc.widthOfString(badgeText) + 16;
    doc
      .roundedRect(
        doc.page.margins.left + pageWidth - badgeWidth - 12,
        headerY + 8,
        badgeWidth,
        20,
        3
      )
      .fill(TEAL);
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(WHITE)
      .text(
        badgeText,
        doc.page.margins.left + pageWidth - badgeWidth - 4,
        headerY + 13,
        { width: badgeWidth, align: "center" }
      );

    doc.y = headerY + 46;

    // Relationship + mention count
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(GREY)
      .text(
        `${entity.relationship.replace(/_/g, " ")} · ${entity.total_mentions} total mention${entity.total_mentions !== 1 ? "s" : ""}`
      );
    doc.moveDown(1);

    // Stories, chronological (oldest first within section)
    const sortedStories = [...entity.stories].sort(
      (a, b) =>
        new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );

    for (const story of sortedStories) {
      ensureSpace(doc, 80);

      const storyY = doc.y;

      // Left accent line
      const topicColor = TOPIC_COLORS[story.topic] || GREY;
      doc
        .rect(doc.page.margins.left, storyY, 3, 50)
        .fill(topicColor);

      const contentX = doc.page.margins.left + 14;
      const contentWidth = pageWidth - 14;

      // Date + source + topic
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(GREY)
        .text(
          `${formatDate(story.published_at)}  ·  ${story.source_name}  ·  ${story.topic}`,
          contentX,
          storyY
        );

      // Alert badge
      if (story.alert_type) {
        const alertX = doc.x;
        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor("#dc2626")
          .text(`  ▲ ${story.alert_type.toUpperCase()}`, alertX, storyY, {
            continued: false,
          });
      }

      // Title
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(NAVY)
        .text(decodeHtmlEntities(story.title), contentX, doc.y + 2, {
          width: contentWidth,
          link: story.link,
          underline: false,
        });

      // Summary or description
      const bodyText = story.short_summary || story.description;
      if (bodyText) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(GREY)
          .text(truncate(bodyText, 200), contentX, doc.y + 2, {
            width: contentWidth,
          });
      }

      doc.moveDown(1);
    }
  }

  // ── Final page footer ──
  ensureSpace(doc, 40);
  doc.moveDown(2);
  doc
    .rect(doc.page.margins.left, doc.y, pageWidth, 1)
    .fill(TEAL);
  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GREY)
    .text(
      "This briefing is generated from Tideline's curated ocean intelligence feeds. For questions, contact your Tideline account manager.",
      { align: "center" }
    );

  doc.end();
  return doc;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#124;/g, "|");
}
