"use client";

import { useRouter } from "next/navigation";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const TEAL = "#1D9E75";
const T1 = "#202124";
const T3 = "#5F6368";
const BORDER = "#E4E4E4";

interface Story {
  id: string;
  title: string;
  link: string;
  source_name: string;
  source_type: string;
  published_at: string;
  short_summary: string | null;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "-").replace(/&#8212;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)));
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function isTier1(sourceType: string) {
  return sourceType === "gov" || sourceType === "reg";
}

export default function StoryCard({
  story,
  isRead,
  onRead,
  onBookmark,
  isBookmarked,
}: {
  story: Story;
  isRead: boolean;
  onRead: (id: string) => void;
  onBookmark: (id: string) => void;
  isBookmarked: boolean;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => { onRead(story.id); router.push(`/platform/story/${story.id}`); }}
      style={{
        background: "#ffffff",
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "box-shadow 0.15s",
        opacity: isRead ? 0.55 : 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* Headline */}
      <div style={{
        fontFamily: F,
        fontSize: 15,
        fontWeight: 500,
        color: T1,
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        marginBottom: 6,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }}>
        {decodeHtml(story.title)}
      </div>

      {/* Summary */}
      {story.short_summary && (
        <div style={{
          fontFamily: F,
          fontSize: 12,
          fontWeight: 300,
          color: T1,
          opacity: 0.65,
          lineHeight: 1.6,
          marginBottom: 10,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {story.short_summary}
        </div>
      )}

      {/* Footer: tier dot + source + time + bookmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isTier1(story.source_type) ? TEAL : "#C4C4C4",
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: M, fontSize: 10, color: T1, opacity: 0.4 }}>
          {story.source_name}
        </span>
        <span style={{ fontFamily: M, fontSize: 10, color: T1, opacity: 0.4 }}>
          {fmtTime(story.published_at)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark(story.id); }}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            fontSize: 14,
            color: isBookmarked ? TEAL : "#C4C4C4",
          }}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark story"}
        >
          {isBookmarked ? "\u2605" : "\u2606"}
        </button>
      </div>
    </div>
  );
}
