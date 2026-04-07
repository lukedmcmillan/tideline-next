"use client";

import { useState, useEffect } from "react";

const NAVY = "#0A1628";
const TEAL = "#1D9E75";
const WHITE = "#FFFFFF";
const OFF_WHITE = "#F8F9FA";
const BORDER = "#DADCE0";
const T1 = "#202124";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

interface TrackerEvent {
  id: string;
  event_date: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  source_name: string | null;
  event_type: string;
  significance: string | null;
}

interface FeedStory {
  id: string;
  title: string;
  source_name: string;
  published_at: string;
  short_summary: string | null;
}

// Hardcoded metrics with source attribution.
// Source: isa.org.jm (verified April 2026). Live scraping is planned for the next pass.
const METRICS = [
  { label: "Active contractors", value: "31", source: "isa.org.jm, April 2026" },
  { label: "Pending applications", value: "0", source: "isa.org.jm, April 2026" },
  { label: "Council sessions in 2026", value: "1", source: "isa.org.jm, April 2026" },
];

const STATUS_LINE = "Mining code negotiations ongoing";
const STATUS_SOURCE = "ISA Council 29th Session, March 2026";

const EVENT_TYPE_LABELS: Record<string, string> = {
  council_decision: "Council decision",
  assembly_resolution: "Assembly resolution",
  ltc_recommendation: "LTC recommendation",
  news_mention: "News",
  regulation_update: "Regulation update",
  update: "Update",
};

const SIGNIFICANCE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: "rgba(29,158,117,0.08)", color: TEAL, border: "rgba(29,158,117,0.3)" },
  medium: { bg: "#FEF9C3", color: "#A16207", border: "#FDE047" },
  low: { bg: "#F1F3F4", color: T3, border: BORDER },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetricCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }} className="metric-grid">
      {METRICS.map((m) => (
        <div key={m.label} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${TEAL}`, padding: "20px 22px" }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>
            {m.label}
          </div>
          <div style={{ fontFamily: M, fontSize: 32, fontWeight: 600, color: TEAL, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>
            {m.value}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: T4, lineHeight: 1.5 }}>
            {m.source}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventTimeline({ events }: { events: TrackerEvent[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>
        Recent events
      </div>
      {events.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: 20, fontFamily: F, fontSize: 13, color: T4 }}>
          No events recorded yet. The scraper runs daily at 04:30 UTC.
        </div>
      ) : (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
          {events.map((e, i) => {
            const isHigh = e.significance === "high";
            const sig = SIGNIFICANCE_COLORS[e.significance || "low"] || SIGNIFICANCE_COLORS.low;
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: i < events.length - 1 ? `1px solid ${BORDER}` : "none",
                  borderLeft: isHigh ? `3px solid ${TEAL}` : "3px solid transparent",
                }}
              >
                <div style={{ flexShrink: 0, width: 90 }}>
                  <div style={{ fontFamily: M, fontSize: 11, fontWeight: 500, color: T3, letterSpacing: "0.02em" }}>
                    {fmtDate(e.event_date)}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: M, fontSize: 9, fontWeight: 500, textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "2px 8px", borderRadius: 4,
                      background: sig.bg, color: sig.color, border: `1px solid ${sig.border}`,
                    }}>
                      {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                    </span>
                    {e.source_name && (
                      <span style={{ fontFamily: M, fontSize: 10, color: T4, letterSpacing: "0.04em" }}>
                        {e.source_name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 6 }}>
                    {e.title}
                  </div>
                  {e.summary && (
                    <div
                      style={{
                        fontFamily: F, fontSize: 12.5, fontWeight: 400, color: T3, lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 2 as never,
                        WebkitBoxOrient: "vertical" as never,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      {e.summary}
                    </div>
                  )}
                  {e.source_url && (
                    <a
                      href={e.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none" }}
                    >
                      View source {"\u2197"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentStories({ stories }: { stories: FeedStory[] }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>
        Related stories from Tideline
      </div>
      {stories.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: 20, fontFamily: F, fontSize: 13, color: T4 }}>
          No stories matched to this tracker yet.
        </div>
      ) : (
        stories.map((s) => (
          <a key={s.id} href={`/platform/story/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{
                background: WHITE,
                border: `1px solid ${BORDER}`,
                padding: "14px 20px",
                marginBottom: 8,
                borderRadius: 6,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = TEAL; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
            >
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 6 }}>
                {s.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: s.short_summary ? 6 : 0 }}>
                <span style={{ fontFamily: M, fontSize: 10, color: T4 }}>{s.source_name}</span>
                <span style={{ fontFamily: M, fontSize: 10, color: T4 }}>
                  {new Date(s.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
              {s.short_summary && (
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 400, color: T3, lineHeight: 1.6 }}>
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

function SetAlertButton() {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "error">("idle");

  const subscribe = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracker_slug: "isa" }),
      });
      if (res.ok) setState("subscribed");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  const label =
    state === "loading" ? "Subscribing..." :
    state === "subscribed" ? "Alerts on" :
    state === "error" ? "Try again" :
    "Set alert";

  return (
    <button
      onClick={subscribe}
      disabled={state === "loading" || state === "subscribed"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 18px",
        fontFamily: F,
        fontSize: 13,
        fontWeight: 500,
        color: state === "subscribed" ? TEAL : WHITE,
        background: state === "subscribed" ? "rgba(29,158,117,0.1)" : TEAL,
        border: state === "subscribed" ? `1px solid ${TEAL}` : "1px solid transparent",
        borderRadius: 6,
        cursor: state === "loading" || state === "subscribed" ? "default" : "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 5.5a4 4 0 018 0v3l1 1.5H2l1-1.5v-3z" strokeLinejoin="round"/>
        <path d="M5.5 12a1.5 1.5 0 003 0" strokeLinecap="round"/>
      </svg>
      {label}
    </button>
  );
}

export default function ISATracker() {
  const [loading, setLoading] = useState(true);
  const [trackerEvents, setTrackerEvents] = useState<TrackerEvent[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/tracker-events?slug=isa&limit=20").then((r) => r.ok ? r.json() : { events: [] }),
      fetch("/api/stories?limit=5&tracker=isa").then((r) => r.ok ? r.json() : { stories: [] }),
    ])
      .then(([events, stories]) => {
        setTrackerEvents(events.events || []);
        setFeedStories(stories.stories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: F, color: T1, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .metric-grid { grid-template-columns: repeat(1, 1fr) !important; }
        }
      `}</style>

      <div style={{ background: NAVY, padding: "48px 24px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>
            Live intelligence tracker
          </div>
          <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 600, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 12px" }}>
            International Seabed Authority
          </h1>
          <p style={{ fontFamily: F, fontSize: 14, color: "rgba(255,255,255,0.6)", maxWidth: 640, lineHeight: 1.7, margin: "0 0 18px" }}>
            Licensing of deep-sea exploration contracts, mining code negotiations, and environmental safeguards under UNCLOS Part XI.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(29,158,117,0.15)", border: `1px solid ${TEAL}`, borderRadius: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} />
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: WHITE }}>{STATUS_LINE}</span>
            <span style={{ fontFamily: M, fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>{STATUS_SOURCE}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <SetAlertButton />
        </div>

        <MetricCards />

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F, fontSize: 13, color: T4 }}>
            Loading tracker data...
          </div>
        ) : (
          <>
            <EventTimeline events={trackerEvents} />
            <RecentStories stories={feedStories} />
          </>
        )}
      </div>
    </div>
  );
}
