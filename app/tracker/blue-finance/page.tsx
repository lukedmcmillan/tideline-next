"use client";

import { useState, useEffect } from "react";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const TEAL = "#1D9E75";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  blue_bonds_issued: number;
  total_capital: string;
  debt_swaps_active: number;
  market_status: string;
}

interface TrackerEvent {
  id: string;
  event_date: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  event_type: string;
}

interface FeedStory {
  id: string;
  title: string;
  source_name: string;
  published_at: string;
  short_summary: string | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  milestone: "#0E7C86",
  setback: "#DC2626",
  update: "#9CA3AF",
};

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Blue Bonds Issued", value: String(stats.blue_bonds_issued), color: TEAL },
    { label: "Total Capital Mobilised", value: stats.total_capital, color: BLUE },
    { label: "Debt Swaps Active", value: String(stats.debt_swaps_active), color: MUTED },
    { label: "Market Status", value: stats.market_status, color: stats.market_status === "Growing" ? TEAL : "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }} className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${c.color}`, padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 8, fontFamily: SANS }}>{c.label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: c.color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "-0.04em" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Recent Events Timeline ──────────────────────────────────────────────────

function RecentEvents({ events }: { events: TrackerEvent[] }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 20, fontFamily: SANS }}>Recent Events</div>
      {events.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS, fontStyle: "italic", padding: "20px 0" }}>No events recorded yet</div>
      ) : (
        events.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ paddingTop: 5, flexShrink: 0 }}>
              <span style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: EVENT_TYPE_COLORS[e.event_type] || EVENT_TYPE_COLORS.update,
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: MUTED, marginBottom: 4 }}>
                {new Date(e.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: NAVY, marginBottom: 4, lineHeight: 1.4 }}>
                {e.title}
              </div>
              {e.summary && (
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 300, color: MUTED, lineHeight: 1.6 }}>
                  {e.summary}
                </div>
              )}
              {e.source_url && (
                <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 11, color: BLUE, textDecoration: "none", marginTop: 4, display: "inline-block" }}>
                  Source &#8599;
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Recent Stories from Feed ────────────────────────────────────────────────

function RecentStories({ stories }: { stories: FeedStory[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 16, fontFamily: SANS }}>Related Stories from Tideline</div>
      {stories.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", fontSize: 13, color: MUTED, fontFamily: SANS, fontStyle: "italic" }}>No stories matched to this tracker yet</div>
      ) : (
        stories.map((s) => (
          <a key={s.id} href={`/platform/story/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: WHITE,
              border: "1px solid #E4E4E4",
              padding: "16px 20px",
              marginBottom: 8,
              borderRadius: 6,
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: NAVY, lineHeight: 1.4, marginBottom: 4 }}>
                {s.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: MUTED }}>
                  {s.source_name}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: MUTED }}>
                  {new Date(s.published_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              {s.short_summary && (
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 300, color: MUTED, lineHeight: 1.6 }}>
                  {s.short_summary}
                </div>
              )}
            </div>
          </a>
        ))
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlueFinanceTracker() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackerEvents, setTrackerEvents] = useState<TrackerEvent[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    fetch("/api/blue-finance-status")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/tracker-events?slug=blue_finance&limit=20")
      .then((r) => r.json())
      .then((data) => setTrackerEvents(data.events || []))
      .catch(() => {});

    fetch("/api/stories?limit=5&tracker=blue_finance")
      .then((r) => r.json())
      .then((data) => setFeedStories(data.stories || []))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: SANS, color: NAVY, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 18, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Feed</a>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>BBNJ Tracker</a>
            <a href="/tracker/isa" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Deep-Sea Mining</a>
            <a href="/tracker/iuu" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>IUU Fishing</a>
            <a href="/tracker/30x30" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>30x30</a>
            <a href="/tracker/blue-finance" style={{ color: WHITE, fontSize: 13, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>Blue Finance</a>
            <a href="/tracker/governance" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Governance Calendar</a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, fontFamily: SANS }}>Live Intelligence Tracker</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
            Blue Finance
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontFamily: SANS, maxWidth: 600, lineHeight: 1.7 }}>
            Blue bonds, debt-for-nature swaps, and ocean investment frameworks — deal flow and regulatory development
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>Loading tracker data...</div>
          </div>
        ) : (
          <>
            {stats && <StatCards stats={stats} />}
            <RecentEvents events={trackerEvents} />
            <RecentStories stories={feedStories} />
          </>
        )}
      </div>
    </div>
  );
}
