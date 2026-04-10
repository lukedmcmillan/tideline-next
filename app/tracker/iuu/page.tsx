"use client";

import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";

const F = "'DM Sans',system-ui,sans-serif";
const NAVY = "#0a1628";
const TEAL = "#1D9E75";
const BLUE = "#1d6fa4";
const WHITE = "#ffffff";
const BD = "#DADCE0";
const MU = "#9AA0A6";
const T1 = "#202124";
const T2 = "#5F6368";

interface CardingRow {
  id: string;
  country: string;
  card_type: "red" | "yellow";
  issued_date: string;
  reason: string | null;
  trade_impact: string | null;
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

function fdt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Metric Cards ────────────────────────────────────────────────────────────

function MetricCards({ redCount, yellowCount }: { redCount: number; yellowCount: number }) {
  const cards = [
    { label: "Active Red Cards", value: String(redCount), color: "#E24B4A" },
    { label: "Yellow Card Warnings", value: String(yellowCount), color: "#EF9F27" },
    { label: "EU Catch Status", value: "Live", color: TEAL },
    { label: "US Legislation", value: "Advancing", color: "#EF9F27" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }} className="iuu-metrics">
      {cards.map((c) => (
        <div key={c.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderTop: `3px solid ${c.color}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: c.color, letterSpacing: "-0.03em" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── EU Carding Table ────────────────────────────────────────────────────────

function CardingTable({ rows }: { rows: CardingRow[] }) {
  if (rows.length === 0) return null;
  const pill = (type: string) => type === "red"
    ? { background: "rgba(226,75,74,.08)", color: "#A32D2D", border: "1px solid rgba(226,75,74,.18)" }
    : { background: "rgba(186,117,23,.1)", color: "#854F0B", border: "1px solid rgba(186,117,23,.2)" };
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>EU Carding Status</div>
      <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.8fr 2fr 1.4fr", padding: "10px 16px", borderBottom: `0.5px solid ${BD}` }}>
          {["Country", "Card", "Issued", "Reason", "Trade impact"].map(h => (
            <div key={h} style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: MU }}>{h}</div>
          ))}
        </div>
        {rows.map((r) => {
          const p = pill(r.card_type);
          return (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.8fr 2fr 1.4fr", padding: "10px 16px", borderBottom: `0.5px solid ${BD}`, alignItems: "center", minHeight: 40 }}>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1 }}>{r.country}</div>
              <div><span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, ...p }}>{r.card_type}</span></div>
              <div style={{ fontFamily: F, fontSize: 12, color: T2 }}>{r.issued_date ? fdt(r.issued_date) : "\u2014"}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.5 }}>{r.reason || "\u2014"}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.5 }}>{r.trade_impact || "\u2014"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent Events ───────────────────────────────────────────────────────────

function RecentEvents({ events }: { events: TrackerEvent[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Recent Events</div>
      <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
        {events.length === 0 ? (
          <div style={{ fontFamily: F, fontSize: 12, color: MU, padding: "24px 16px" }}>No events recorded yet</div>
        ) : events.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: `0.5px solid ${BD}` }}>
            <div style={{ paddingTop: 5, flexShrink: 0 }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: e.event_type === "milestone" ? TEAL : MU }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F, fontSize: 10, color: MU, marginBottom: 3 }}>{fdt(e.event_date)}</div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 3 }}>{e.title}</div>
              {e.summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6 }}>{e.summary}</div>}
              {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, color: BLUE, textDecoration: "none", marginTop: 3, display: "inline-block" }}>Source {"\u2197"}</a>}
            </div>
            <span style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: e.event_type === "milestone" ? TEAL : MU, flexShrink: 0, paddingTop: 5 }}>{e.event_type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Related Stories ─────────────────────────────────────────────────────────

function RecentStories({ stories }: { stories: FeedStory[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Related Stories</div>
      {stories.length === 0 ? (
        <div style={{ fontFamily: F, background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, padding: "24px 16px", fontSize: 12, color: MU }}>No stories matched to this tracker yet</div>
      ) : (
        <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
          {stories.map((s) => (
            <a key={s.id} href={`/platform/story/${s.id}`} style={{ textDecoration: "none", display: "block", padding: "14px 16px", borderBottom: `0.5px solid ${BD}` }}>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 3 }}>{s.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F, fontSize: 10, color: MU }}>{s.source_name}</span>
                <span style={{ fontFamily: F, fontSize: 10, color: MU }}>{new Date(s.published_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
              </div>
              {s.short_summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginTop: 4 }}>{s.short_summary}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IUUTracker() {
  const [loading, setLoading] = useState(true);
  const [carding, setCarding] = useState<CardingRow[]>([]);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => { document.title = "Illegal Fishing | Tideline"; }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/iuu/carding").then(r => r.ok ? r.json() : []),
      fetch("/api/tracker-events?slug=iuu&limit=8").then(r => r.ok ? r.json() : { events: [] }),
      fetch("/api/stories?limit=5&tracker=iuu").then(r => r.ok ? r.json() : { stories: [] }),
    ]).then(([card, ev, st]) => {
      setCarding(card);
      setEvents(ev.events || []);
      setStories(st.stories || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const redCount = carding.filter(c => c.card_type === "red").length;
  const yellowCount = carding.filter(c => c.card_type === "yellow").length;

  return (
    <div style={{ fontFamily: F, color: T1, background: "#f8f9fa", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .iuu-metrics { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>Live Intelligence Tracker</div>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
            Illegal Fishing
          </h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 600, lineHeight: 1.7 }}>
            Monitoring IUU fishing enforcement, EU carding decisions, vessel listings, and RFMO actions globally.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="iuu" />
        {loading ? (
          <div style={{ fontFamily: F, textAlign: "center", padding: "60px 20px", fontSize: 13, color: MU }}>Loading tracker data...</div>
        ) : (
          <>
            <MetricCards redCount={redCount} yellowCount={yellowCount} />
            <CardingTable rows={carding} />
            <RecentEvents events={events} />
            <RecentStories stories={stories} />
          </>
        )}
      </div>
    </div>
  );
}
