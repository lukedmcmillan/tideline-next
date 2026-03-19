"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const BLUE_LIGHT = "#e8f2f9";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER_LIGHT = "#e8e8e8";
const MUTED = "#666";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

const SRC: Record<string, { bg: string; color: string }> = {
  reg: { bg: "#e8f2f9", color: "#1d6fa4" },
  res: { bg: "#eaf3de", color: "#2D6A0A" },
  ngo: { bg: "#f0eef9", color: "#4A3F8C" },
  gov: { bg: "#fff3e0", color: "#7A4500" },
  esg: { bg: "#fde8e8", color: "#8C1A1A" },
  media: { bg: "#f5f5f5", color: "#444" },
};

interface Story {
  id: string;
  title: string;
  link: string;
  source_name: string;
  topic: string;
  source_type: string;
  published_at: string;
  short_summary: string | null;
  full_summary: string | null;
  is_pro: boolean;
}

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

  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [shortSummary, setShortSummary] = useState<string | null>(null);
  const [fullSummary, setFullSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Fetch story from Supabase via API
  useEffect(() => {
    if (!id) return;

    fetch(`/api/stories?id=${id}`)
      .then(r => r.json())
      .then(data => {
        const found = data.stories?.find((s: Story) => s.id === id);
        if (found) {
          setStory(found);
        } else {
          // Try fetching all and finding by id
          fetch("/api/stories?limit=200")
            .then(r => r.json())
            .then(allData => {
              const s = allData.stories?.find((s: Story) => s.id === id);
              if (s) {
                setStory(s);
              } else {
                setNotFound(true);
              }
            });
        }
      })
      .catch(() => setNotFound(true));
  }, [id]);

  // Fetch related stories once we have the topic
  useEffect(() => {
    if (!story) return;

    fetch(`/api/stories?topic=${story.topic}&limit=6`)
      .then(r => r.json())
      .then(data => {
        const others = (data.stories || []).filter((s: Story) => s.id !== story.id).slice(0, 4);
        setRelated(others);
      })
      .catch(() => {});
  }, [story]);

  // Generate summary
  useEffect(() => {
    if (!story) return;
    if (story.short_summary) {
      setShortSummary(story.short_summary);
      setFullSummary(story.full_summary);
      return;
    }

    setSummaryLoading(true);
    fetch("/api/summarise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id }),
    })
      .then(r => r.json())
      .then(data => {
        setShortSummary(data.short_summary || null);
        setFullSummary(data.full_summary || null);
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [story]);

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Story not found.</div>
        <Link href="/platform" style={{ color: BLUE, fontSize: 13, fontFamily: SANS }}>← Back to Intelligence Brief</Link>
      </div>
    </div>
  );

  if (!story) return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: MUTED }}>Loading…</div>
    </div>
  );

  const sc = SRC[story.source_type] || SRC.res;

  return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, color: NAVY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Masthead */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: SERIF, textDecoration: "none", letterSpacing: "-0.02em" }}>TIDELINE</a>
            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Ocean Intelligence</span>
          </div>
          <Link href="/platform" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: SANS, textDecoration: "none" }}>
            ← Back to Intelligence Brief
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 64, alignItems: "start" }}>

          {/* MAIN */}
          <div>
            {/* Meta */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, padding: "2px 8px", background: sc.bg, color: sc.color, fontWeight: 600, borderRadius: 2, fontFamily: SANS }}>{story.source_name}</span>
              <span style={{ fontSize: 11, color: BLUE, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: SANS }}>{story.topic}</span>
              <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto", fontFamily: MONO }}>{formatDate(story.published_at)}</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 30, fontWeight: 700, color: NAVY, lineHeight: 1.35, margin: "0 0 32px", fontFamily: SERIF, letterSpacing: "-0.02em" }}>
              {story.title}
            </h1>

            {/* Intelligence summary */}
            <div style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: 20, marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: BLUE, marginBottom: 14, fontFamily: SANS }}>Intelligence Analysis</div>
              {summaryLoading ? (
                <div>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 16, background: "#f0f0f0", borderRadius: 2, marginBottom: 10, width: i === 3 ? "60%" : "100%", animation: "pulse 1.5s ease-in-out infinite" }} />
                  ))}
                </div>
              ) : shortSummary ? (
                <div>
                  <p style={{ fontSize: 16, color: "#222", lineHeight: 1.85, margin: "0 0 16px", fontFamily: SANS }}>{shortSummary}</p>
                  {fullSummary && (
                    <>
                      {showFull && (
                        <p style={{ fontSize: 15, color: "#444", lineHeight: 1.85, margin: "0 0 16px", fontFamily: SANS }}>{fullSummary}</p>
                      )}
                      <button onClick={() => setShowFull(p => !p)} style={{ background: "none", border: "none", color: BLUE, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" as const, padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {showFull ? "Show less ▲" : "Read full analysis ▼"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>Summary unavailable.</div>
              )}
            </div>

            {/* Source link */}
            <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, paddingTop: 24, marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12, fontFamily: SANS }}>Primary Source</div>
              <a href={story.link} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px", border: `1px solid ${BORDER_LIGHT}`,
                background: OFF_WHITE, color: NAVY, textDecoration: "none",
                fontSize: 13, fontWeight: 600, fontFamily: SANS, borderRadius: 2
              }}>
                <span style={{ fontSize: 11, padding: "1px 7px", background: sc.bg, color: sc.color, fontWeight: 600, borderRadius: 2, fontFamily: SANS }}>{story.source_name}</span>
                View original source →
              </a>
            </div>

            <Link href="/platform" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, color: MUTED, fontFamily: SANS, textDecoration: "none",
              borderBottom: `1px solid ${BORDER_LIGHT}`, paddingBottom: 1
            }}>
              ← Back to Intelligence Brief
            </Link>
          </div>

          {/* SIDEBAR */}
          <div style={{ position: "sticky" as const, top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 16, fontFamily: SANS }}>Related Intelligence</div>
            {related.length === 0 ? (
              <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>Loading related stories…</div>
            ) : (
              related.map((r, i) => {
                const rSc = SRC[r.source_type] || SRC.res;
                return (
                  <Link key={r.id} href={`/platform/story/${r.id}`} style={{
                    display: "block", padding: "14px 0",
                    borderBottom: i < related.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none",
                    textDecoration: "none"
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 10, padding: "1px 6px", background: rSc.bg, color: rSc.color, fontWeight: 600, borderRadius: 2, fontFamily: SANS }}>{r.source_name}</span>
                      <span style={{ fontSize: 10, color: BLUE, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, fontFamily: SANS }}>{r.topic}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.4, fontFamily: SERIF }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 5, fontFamily: MONO }}>{formatDate(r.published_at)}</div>
                  </Link>
                );
              })
            )}
            <div style={{ marginTop: 20 }}>
              <Link href="/platform" style={{ fontSize: 12, color: BLUE, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>View all stories →</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, background: OFF_WHITE, padding: "18px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: SERIF, textDecoration: "none" }}>TIDELINE</a>
          <span style={{ fontSize: 11, color: "#aaa", fontFamily: MONO }}>© {new Date().getFullYear()} · tideline.io</span>
        </div>
      </div>
    </div>
  );
}