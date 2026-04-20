"use client";

import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";
import TrackerHistory from "@/components/TrackerHistory";
import TrackerMethodology, { TrackerDisclosure } from "@/components/TrackerMethodology";
import TrackerHero from "@/components/TrackerHero";

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlueFinanceTracker() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackerEvents, setTrackerEvents] = useState<TrackerEvent[]>([]);
  useEffect(() => { document.title = "Ocean Finance | Tideline"; }, []);

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

      <TrackerHero
        slug="blue-finance"
        title="Blue Finance and TNFD"
        insight="733 organisations representing $9 trillion in market capitalisation have adopted TNFD reporting. The ISSB is now building a mandatory nature disclosure standard."
        stage={3}
        stageName="Standard Adoption"
        stageDesc="TNFD v1.0 live with 733 adopters. ISSB moving to standard-setting on nature disclosure. EU CSRD alignment confirmed."
        stageSource="TNFD, ISSB Feb 2026"
        traj="Advancing"
        trajDesc="ISSB voted to skip discussion paper and move directly to exposure draft. Mandatory nature disclosure framework approaching."
        trajSource="ISSB meeting, Feb 2026"
        nextEvent="ISSB exposure draft"
        nextDate="2026-10-01"
        nextLocation="London"
      />

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="blue-finance" />
        <TrackerHistory slug="blue-finance" />
        <TrackerMethodology slug="blue-finance" />
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>Loading tracker data...</div>
          </div>
        ) : (
          <>
            {stats && <StatCards stats={stats} />}
            <RecentEvents events={trackerEvents} />
          </>
        )}
      </div>
      <TrackerDisclosure />
    </div>
  );
}
