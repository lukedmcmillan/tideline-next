"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ── Design tokens (match layout.tsx) ─────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const RED    = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

const SRC_COLORS: Record<string, { bg: string; color: string }> = {
  gov:   { bg: "#dbeafe", color: "#1e40af" },
  reg:   { bg: "#fee2e2", color: "#991b1b" },
  ngo:   { bg: "#dcfce7", color: "#166534" },
  res:   { bg: "#f3e8ff", color: "#6b21a8" },
  media: { bg: "#fef3c7", color: "#78350f" },
  esg:   { bg: "#ccfbf1", color: "#134e4a" },
};

const TOPIC_LABELS: Record<string, string> = {
  governance: "Governance", dsm: "Deep-Sea Mining", bluefinance: "Blue Finance",
  climate: "Climate", iuu: "IUU Fishing", mpa: "30x30", fisheries: "Fisheries",
  science: "Science", acidification: "Climate", technology: "Technology", all: "Ocean",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [story, setStory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [shortSummary, setShortSummary] = useState<string | null>(null);
  const [fullSummary, setFullSummary] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/stories?id=${id}`)
      .then(r => r.json())
      .then(data => {
        const s = data.story || (data.stories && data.stories[0]);
        if (!s) return;
        setStory(s);
        setLoading(false);
        if (s.short_summary) setShortSummary(s.short_summary);
        if (s.full_summary) setFullSummary(s.full_summary);

        fetch(`/api/stories?topic=${s.topic}&limit=5`)
          .then(r => r.json())
          .then(d => setRelated((d.stories || []).filter((r: any) => r.id !== id).slice(0, 4)));

        if (!s.short_summary) {
          setGenerating(true);
          fetch("/api/summarise", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId: id }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.short_summary) setShortSummary(d.short_summary);
              if (d.full_summary) setFullSummary(d.full_summary);
            })
            .finally(() => setGenerating(false));
        }
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "16px 24px 40px" }}>
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div style={{ padding: "16px 24px 40px" }}>
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>Story not found.</div>
      </div>
    );
  }

  const sc = SRC_COLORS[story.source_type] || SRC_COLORS.media;
  const topicTag = TOPIC_LABELS[story.topic] || story.topic;
  const isPro = story.is_pro || story.source_type === "gov" || story.source_type === "reg";

  return (
    <div style={{ padding: "16px 24px 40px", maxWidth: 720 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/platform/feed")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 500, color: T4, background: "none",
          border: "none", cursor: "pointer", fontFamily: F,
          padding: 0, marginBottom: 24,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 7H2M2 7l4-4M2 7l4 4" />
        </svg>
        Back to feed
      </button>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: sc.bg, color: sc.color, borderRadius: 4 }}>{story.source_name}</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4, background: BG, borderRadius: 4, padding: "2px 8px" }}>{story.source_type}</span>
        {isPro && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: TEAL, background: "rgba(29,158,117,.1)", borderRadius: 4, padding: "2px 7px" }}>Tier 1</span>}
        <span style={{ fontSize: 12, color: T4, marginLeft: "auto" }}>{fmtDate(story.published_at)}</span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-.02em", color: T1, marginBottom: 24 }}>
        {story.title}
      </h1>

      {/* Tracker tags */}
      {topicTag && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", border: `1px solid rgba(29,158,117,.22)`, borderRadius: 4, padding: "3px 9px", color: TEAL, background: "rgba(255,255,255,.7)" }}>{topicTag}</span>
          {story.alert_type && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", background: "rgba(217,48,37,.1)", borderRadius: 4, padding: "3px 9px", color: RED }}>{story.alert_type.replace("_", " ")}</span>
          )}
        </div>
      )}

      {/* Tideline brief */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: TEAL, marginBottom: 12 }}>
          Tideline brief
        </div>

        {generating && !shortSummary ? (
          <div style={{ padding: "16px 20px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: T4 }}>Generating brief...</div>
          </div>
        ) : shortSummary ? (
          <div style={{ padding: "20px 24px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8 }}>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: T1, fontFamily: "Georgia, serif", marginBottom: fullSummary ? 16 : 0 }}>
              {shortSummary}
            </p>
            {fullSummary && (
              <>
                {expanded && (
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: T2, fontFamily: "Georgia, serif", marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${BLT}` }}>
                    {fullSummary}
                  </p>
                )}
                <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, padding: 0 }}>
                  {expanded ? "Show less" : "Read full analysis"}
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ padding: "16px 20px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLT}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: T4 }}>Summary pending. Check back shortly.</div>
          </div>
        )}
      </div>

      {/* Original source link */}
      <div style={{ marginBottom: 32, paddingTop: 24, borderTop: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Primary source</div>
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", border: `1.5px solid ${BORDER}`, background: WHITE,
            borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500,
            color: T1, fontFamily: F,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", background: sc.bg, color: sc.color, borderRadius: 3 }}>{story.source_name}</span>
          View original source {"\u2197"}
        </a>
      </div>

      {/* Related stories */}
      {related.length > 0 && (
        <div style={{ paddingTop: 24, borderTop: `1px solid ${BLT}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>Related stories</div>
          {related.map((r) => {
            const rSc = SRC_COLORS[r.source_type] || SRC_COLORS.media;
            return (
              <a
                key={r.id}
                href={`/platform/story/${r.id}`}
                style={{ display: "block", padding: "14px 0", borderBottom: `1px solid ${BLT}`, textDecoration: "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", background: rSc.bg, color: rSc.color, borderRadius: 3 }}>{r.source_name}</span>
                  <span style={{ fontSize: 11, color: T4 }}>{fmtDate(r.published_at)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4 }}>{r.title}</div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
