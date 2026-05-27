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

// ─── Domain overview ─────────────────────────────────────────────────────────

function DomainOverview() {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "24px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 16, fontFamily: SANS }}>Domain Scope</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="scope-grid">
        {[
          { label: "Credit instruments tracked", value: "Blue carbon, mangrove, seagrass, salt marsh, mCDR" },
          { label: "Registry coverage", value: "Verra (VCS), Plan Vivo Blue, Gold Standard marine" },
          { label: "Standards bodies", value: "ICVCM Core Carbon Principles (marine), Integrity Council" },
          { label: "MRV signals", value: "Marine MRV protocols, ocean MRV methodology approvals" },
        ].map(({ label, value }) => (
          <div key={label} style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>{label}</div>
            <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS, lineHeight: 1.5 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: "12px 16px", background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 4 }}>
        <div style={{ fontSize: 12, color: "#6D4C41", fontFamily: SANS, lineHeight: 1.6 }}>
          <strong>Not in scope:</strong> Blue bond issuance, debt-for-nature swaps, and TNFD framework adoption are tracked under Blue Finance/TNFD. This tracker covers credit markets specifically — registry actions, methodology approvals, and MRV protocol decisions.
        </div>
      </div>
    </div>
  );
}

// ─── Recent Events Timeline ──────────────────────────────────────────────────

function RecentEvents({ events }: { events: TrackerEvent[] }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 20, fontFamily: SANS }}>Recent Events</div>
      {events.length === 0 ? (
        <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS, fontStyle: "italic", padding: "20px 0" }}>No events recorded yet — tracker launched May 2026</div>
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
              <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginBottom: 4 }}>
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

export default function BlueCarbonCreditsTracker() {
  const [loading, setLoading] = useState(true);
  const [trackerEvents, setTrackerEvents] = useState<TrackerEvent[]>([]);
  useEffect(() => { document.title = "Blue Carbon & Biodiversity Credits | Tideline"; }, []);

  useEffect(() => {
    fetch("/api/tracker-events?slug=blue_carbon_credits&limit=20")
      .then((r) => r.json())
      .then((data) => setTrackerEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: SANS, color: NAVY, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .scope-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <TrackerHero
        slug="blue-carbon-credits"
        title="Blue Carbon & Biodiversity Credits"
        insight="Voluntary carbon markets for ocean-based removals and biodiversity offsets are in an early standardisation phase. Verra, Plan Vivo Blue, and ICVCM are developing marine MRV frameworks; registry-level transaction volumes remain low."
        stage={1}
        stageName="Nascent"
        stageDesc="Marine credit methodologies in development. No dominant standard yet established. ICVCM Core Carbon Principles undergoing marine applicability review."
        stageSource="Verra, ICVCM, Plan Vivo 2025–2026"
        traj="Developing"
        trajDesc="Standards bodies releasing marine-specific MRV guidance. Market volumes limited to pilot transactions. Regulatory clarity pending in EU, UK, and voluntary market frameworks."
        trajSource="ICVCM, Verra, May 2026"
        nextEvent="ICVCM marine methodology review"
        nextDate="2026-12-01"
        nextLocation="TBC"
      />

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="blue-carbon-credits" />
        <TrackerHistory slug="blue-carbon-credits" />
        <TrackerMethodology slug="blue-carbon-credits" />
        <DomainOverview />
        {!loading && <RecentEvents events={trackerEvents} />}
      </div>
      <TrackerDisclosure />
    </div>
  );
}
