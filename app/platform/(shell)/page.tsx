"use client";

import { useState, useEffect } from "react";
import OvernightReveal from "@/components/OvernightReveal";
import HeroSignal from "@/components/HeroSignal";
import Sparkline from "@/components/Sparkline";
import type { TickerItem, ProofOfWorkData } from "@/app/lib/types/dashboard";

// ── Design tokens (dark mode, matching mockup) ──────────────────────────
const BG = "#0B1628";
const BG2 = "#0D1E35";
const BG3 = "#122845";
const BORDER = "#1A2A44";
const BORDER_HI = "#24375A";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const AMBER_SOFT = "rgba(239,159,39,0.15)";
const RED = "#E24B4A";
const RED_SOFT = "rgba(226,75,74,0.15)";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";

const SLUG_NAMES: Record<string, string> = {
  isa: "ISA Deep Sea", bbnj: "BBNJ", iuu: "IUU Fishing",
  "30x30": "30x30 MPAs", "blue-finance": "Blue Finance", plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping", "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine", "wto-fisheries": "WTO Fisheries",
};

function scoreColor(s: number): string {
  if (s >= 7) return TEAL_BRIGHT;
  if (s >= 4) return AMBER;
  if (s > 0) return RED;
  return TEXT_DIM;
}

function bandLabel(s: number): { label: string; color: string } {
  if (s >= 7) return { label: "ELEVATED", color: TEAL_BRIGHT };
  if (s >= 4) return { label: "WATCH", color: AMBER };
  return { label: "LOW", color: RED };
}

function arrowChar(delta: number): { char: string; color: string } {
  if (delta > 0) return { char: "\u25B2", color: TEAL_BRIGHT };
  if (delta < 0) return { char: "\u25BC", color: RED };
  return { char: "\u2192", color: TEXT_DIM };
}

function fmtDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

interface VScore { tracker_slug: string; score: number; momentum_direction: string; history?: number[] }
export default function DashboardPage() {
  const [velocityScores, setVelocityScores] = useState<VScore[]>([]);
  const [proofOfWork, setProofOfWork] = useState<ProofOfWorkData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.ok ? r.json() : {}),
      fetch("/api/dashboard/proof-of-work").then(r => r.ok ? r.json() : null),
      // Fetch history for sparklines
      ...Object.keys(SLUG_NAMES).map(slug =>
        fetch(`/api/velocity/${slug}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([dash, pow, ...velocityResponses]: any[]) => {
      const scores = (dash.velocityScores || []) as VScore[];
      // Attach history to each score
      const slugKeys = Object.keys(SLUG_NAMES);
      const enriched = scores.map(s => {
        const idx = slugKeys.indexOf(s.tracker_slug);
        const resp = idx >= 0 ? velocityResponses[idx] : null;
        const history = resp?.history?.map((h: { score: number }) => h.score) || [];
        return { ...s, history };
      });
      setVelocityScores(enriched);
      setProofOfWork(pow);
      setLoaded(true);
    }).catch(() => setLoaded(true));

    fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
  }, []);

  const sorted = [...velocityScores].sort((a, b) => b.score - a.score);
  const watchCount = velocityScores.filter(v => v.score >= 4).length;

  return (
    <div style={{ background: BG, minHeight: "100%", color: TEXT, fontFamily: SANS }}>
      <style>{`
        @media(max-width:768px){
          .dash-header{padding:16px 16px 12px!important}
          .dash-grid{padding:0 16px 16px!important;grid-template-columns:1fr!important}
          .dash-grid>*:first-child{grid-column:1!important;grid-row:auto!important;min-height:300px!important}
          .dash-pow{margin:0 16px!important;flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
        }
      `}</style>

      {/* Overnight Reveal */}
      <OvernightReveal />

      {/* Page Header */}
      <div className="dash-header" style={{ padding: "24px 32px 18px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEXT_MUTED, letterSpacing: "0.02em" }}>
            {fmtDate()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, background: TEAL_BRIGHT, borderRadius: "50%", display: "inline-block" }} />
          Live
        </div>
      </div>

      {/* Grid */}
      <div className="dash-grid" style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 20 }}>

        {/* Hero Signal (spans 2 rows) */}
        <HeroSignal />

        {/* Tracker Velocity with Sparklines */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>Tracker velocity · 30d</span>
            <a href="/platform/trackers" style={{ fontSize: 11.5, color: TEAL_BRIGHT, fontWeight: 500, textDecoration: "none", cursor: "pointer" }}>All trackers →</a>
          </div>
          {sorted.slice(0, 6).map(v => {
            const sc = scoreColor(v.score);
            const a = arrowChar(v.momentum_direction === "accelerating" ? 1 : v.momentum_direction === "decelerating" ? -1 : 0);
            return (
              <div key={v.tracker_slug} style={{
                display: "grid", gridTemplateColumns: "90px 1fr 36px 22px",
                alignItems: "center", gap: 12, padding: "10px 0",
                borderTop: `1px solid ${BORDER}`,
              }}>
                <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {SLUG_NAMES[v.tracker_slug] || v.tracker_slug}
                </div>
                <div style={{ height: 26, display: "flex", alignItems: "center" }}>
                  {v.history && v.history.length >= 2
                    ? <Sparkline history={v.history} score={v.score} />
                    : <div style={{ flex: 1, height: 1, background: BORDER }} />}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, textAlign: "right", color: sc }}>
                  {v.score.toFixed(1)}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, textAlign: "center", color: a.color }}>
                  {a.char}
                </div>
              </div>
            );
          })}
        </div>

        {/* Your Exposure Today */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 14 }}>
            Your exposure today
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, lineHeight: 1, letterSpacing: "-0.03em", color: AMBER }}>{watchCount}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT_MUTED }}>of {velocityScores.length}</span>
          </div>
          <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginBottom: 18 }}>domains in WATCH or above</div>
          <div style={{ marginTop: 2 }}>
            {sorted.slice(0, 6).map(v => {
              const band = bandLabel(v.score);
              const pct = Math.min(100, (v.score / 10) * 100);
              return (
                <div key={v.tracker_slug} style={{ display: "grid", gridTemplateColumns: "1fr 80px 56px", alignItems: "center", gap: 10, padding: "7px 0", fontSize: 12 }}>
                  <div style={{ color: TEXT }}>{SLUG_NAMES[v.tracker_slug] || v.tracker_slug}</div>
                  <div style={{ height: 4, background: BG3, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: band.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textAlign: "right", fontWeight: 500, color: band.color }}>
                    {band.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Summary */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>Score summary</span>
            <a href="/platform/trackers" style={{ fontSize: 11.5, color: TEAL_BRIGHT, fontWeight: 500, textDecoration: "none", cursor: "pointer" }}>All trackers →</a>
          </div>
          <div style={{ fontSize: 12.5, color: TEXT_DIM, padding: "8px 0", textAlign: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: TEAL_BRIGHT }}>{watchCount}</span>
            <span style={{ display: "block", fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>trackers at WATCH or above</span>
          </div>
        </div>

        {/* Most Watched */}
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 14 }}>
            Most watched · this week
          </div>
          {sorted.slice(0, 5).map((v, i) => (
            <div key={v.tracker_slug} style={{
              display: "grid", gridTemplateColumns: "18px 1fr 50px",
              alignItems: "center", gap: 10, padding: "9px 0",
              borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
              fontSize: 12.5,
            }}>
              <div style={{ fontFamily: MONO, color: TEXT_DIM, fontSize: 11 }}>{i + 1}</div>
              <div style={{ color: TEXT }}>{SLUG_NAMES[v.tracker_slug] || v.tracker_slug}</div>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: TEXT_MUTED, textAlign: "right" }}>
                {Math.round(v.score * 14)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof of Work Footer */}
      {proofOfWork && (
        <div className="dash-pow" style={{
          margin: "0 32px",
          padding: "14px 20px",
          background: BG2,
          border: `1px solid ${BORDER}`,
          borderTop: "1px solid rgba(29,158,117,0.25)",
          borderRadius: "10px 10px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontFamily: MONO,
          fontSize: 11,
          color: TEXT_MUTED,
          letterSpacing: "0.04em",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL_BRIGHT, display: "inline-block" }} />
            <span>Last ingestion</span>
            <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.last_ingestion_minutes_ago} MIN AGO</span>
          </div>
          <span className="mob-hide" style={{ color: BORDER_HI }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Today</span>
            <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.docs_today} DOCS</span>
            <span>processed</span>
          </div>
          <span className="mob-hide" style={{ color: BORDER_HI }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.sources_monitored} SOURCES</span>
            <span>monitored</span>
          </div>
          <span className="mob-hide" style={{ color: BORDER_HI }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.active_trackers} TRACKERS</span>
            <span>monitored</span>
          </div>
          <div style={{ marginLeft: "auto", color: TEXT_DIM }}>
            Next scan: {proofOfWork.next_scan_utc} UTC
          </div>
        </div>
      )}

      {!loaded && (
        <div style={{ textAlign: "center", padding: 60, color: TEXT_DIM, fontSize: 13 }}>Loading...</div>
      )}
    </div>
  );
}
