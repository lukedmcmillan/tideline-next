"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const NAVY       = "#0a1628";
const BLUE       = "#1d6fa4";
const WHITE      = "#ffffff";
const OFF_WHITE  = "#f5f4ef";
const BORDER     = "rgba(0,0,0,0.08)";
const TEXT_PRI   = "#1a1a1a";
const TEXT_SEC   = "#6b7280";
const TEXT_TER   = "#9ca3af";
const SANS       = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF      = "Georgia, serif";

const SRC: Record<string, { bg: string; color: string }> = {
  gov:   { bg: "#dbeafe", color: "#1e40af" },
  reg:   { bg: "#fee2e2", color: "#991b1b" },
  ngo:   { bg: "#dcfce7", color: "#166534" },
  res:   { bg: "#f3e8ff", color: "#6b21a8" },
  media: { bg: "#fef3c7", color: "#78350f" },
  esg:   { bg: "#ccfbf1", color: "#134e4a" },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function StoryPage() {
  const params = useParams();
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

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .story-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 56px;
      align-items: start;
    }
    .story-sidebar {
      position: sticky;
      top: 40px;
    }
    @media (max-width: 768px) {
      .story-grid {
        grid-template-columns: 1fr;
        gap: 40px;
      }
      .story-sidebar {
        position: static;
        border-top: 1px solid rgba(0,0,0,0.08);
        padding-top: 32px;
      }
    }
  `;

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>Loading...</div>
      </div>
    </>
  );

  if (!story) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>Story not found.</div>
      </div>
    </>
  );

  const sc = SRC[story.source_type] || SRC.media;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: OFF_WHITE, fontFamily: SANS }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "36px 20px 80px" }}>
          <div className="story-grid">

            {/* Main column */}
            <div>
              <Link href="/platform/feed" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_SEC, textDecoration: "none", marginBottom: 28, borderBottom: `1px solid ${BORDER}`, paddingBottom: 1 }}>
                Back to Intelligence Brief
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, padding: "2px 8px", background: sc.bg, color: sc.color, fontWeight: 600, borderRadius: 4, fontFamily: SANS }}>{story.source_name}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#f1f5f9", color: "#475569", fontWeight: 600, borderRadius: 4, fontFamily: SANS, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{story.topic}</span>
                <span style={{ fontSize: 12, color: TEXT_SEC, fontFamily: SANS, marginLeft: "auto" }}>{formatDate(story.published_at)}</span>
              </div>

              <h1 style={{ fontFamily: SERIF, fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: NAVY, lineHeight: 1.3, letterSpacing: "-0.02em", marginBottom: 28 }}>
                {story.title}
              </h1>

              {/* Intelligence Analysis */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: BLUE, marginBottom: 14, fontFamily: SANS }}>
                  Intelligence Analysis
                </div>
                {generating && !shortSummary ? (
                  <div style={{ padding: "16px 20px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLUE}` }}>
                    <div style={{ fontSize: 13, color: TEXT_SEC, fontFamily: SANS }}>Generating intelligence brief...</div>
                  </div>
                ) : shortSummary ? (
                  <div style={{ padding: "20px 24px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLUE}` }}>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: TEXT_PRI, fontFamily: SERIF, marginBottom: fullSummary ? 16 : 0 }}>
                      {shortSummary}
                    </p>
                    {fullSummary && (
                      <>
                        {expanded && (
                          <p style={{ fontSize: 14, lineHeight: 1.8, color: TEXT_PRI, fontFamily: SERIF, marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                            {fullSummary}
                          </p>
                        )}
                        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: BLUE, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS, padding: 0 }}>
                          {expanded ? "Show less" : "Read full analysis"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "16px 20px", background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BORDER}` }}>
                    <div style={{ fontSize: 13, color: TEXT_SEC, fontFamily: SANS }}>Summary unavailable.</div>
                  </div>
                )}
              </div>

              {/* Primary source */}
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: TEXT_SEC, marginBottom: 12, fontFamily: SANS }}>Primary Source</div>
                <a href={story.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", border: `1px solid ${BORDER}`, background: WHITE, color: NAVY, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: SANS, borderRadius: 4 }}>
                  <span style={{ fontSize: 11, padding: "1px 7px", background: sc.bg, color: sc.color, fontWeight: 600, fontFamily: SANS, borderRadius: 3 }}>{story.source_name}</span>
                  View original source
                </a>
              </div>
            </div>

            {/* Sidebar */}
            <div className="story-sidebar">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: TEXT_SEC, marginBottom: 16, fontFamily: SANS }}>Related Intelligence</div>
              {related.length === 0 ? (
                <div style={{ fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>Loading...</div>
              ) : (
                related.map((r, i) => {
                  const rSc = SRC[r.source_type] || SRC.media;
                  return (
                    <Link key={r.id} href={`/platform/story/${r.id}`} style={{ display: "block", padding: "14px 0", borderBottom: i < related.length - 1 ? `1px solid ${BORDER}` : "none", textDecoration: "none" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: 10, padding: "1px 6px", background: rSc.bg, color: rSc.color, fontWeight: 600, fontFamily: SANS, borderRadius: 3 }}>{r.source_name}</span>
                        <span style={{ fontSize: 10, color: BLUE, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, fontFamily: SANS }}>{r.topic}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.4, fontFamily: SERIF, marginBottom: 4 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: TEXT_TER, fontFamily: SANS }}>{formatDate(r.published_at)}</div>
                    </Link>
                  );
                })
              )}
              <div style={{ marginTop: 20 }}>
                <Link href="/platform/feed" style={{ fontSize: 12, color: BLUE, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>View all stories</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, background: WHITE, padding: "18px 20px" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <a href="/" style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: SERIF, textDecoration: "none" }}>TIDELINE</a>
            <span style={{ fontSize: 11, color: TEXT_TER, fontFamily: SANS }}>2026 · thetideline.co</span>
          </div>
        </div>
      </div>
    </>
  );
}
