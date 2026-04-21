"use client";

import { useState, useEffect } from "react";

const NAVY = "#0B1628";
const TEAL = "#1D9E75";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const DIM = "#4A6280";
const MUTED = "#8BA0BC";
const F = "'DM Sans', sans-serif";

interface TrackerHeroProps {
  slug: string;
  title: string;
  insight: string;
  stage: number;
  stageName: string;
  stageDesc: string;
  stageSource: string;
  traj: string;
  trajDesc: string;
  trajSource: string;
  nextEvent: string;
  nextDate: string | null;
  nextLocation: string;
  score?: number | null;
}

function alertBand(score: number | null | undefined, slug?: string) {
  if (score == null) return null;
  const isWind = slug === "offshore-wind";
  const highT = isWind ? 5.5 : 7.0;
  const elevT = isWind ? 3.5 : 5.0;
  const watchT = isWind ? 2.0 : 3.0;
  if (score >= highT) return { label: "HIGH ALERT", bg: "rgba(29,158,117,0.2)", color: TEAL, sub: "Prepare now \u00B7 2\u20134 weeks" };
  if (score >= elevT) return { label: "ELEVATED CONDITIONS", bg: "rgba(239,159,39,0.2)", color: AMBER, sub: "Monitor closely \u00B7 4\u20138 weeks" };
  if (score >= watchT) return { label: "WATCH", bg: "rgba(255,255,255,0.1)", color: MUTED, sub: "Routine monitoring" };
  return { label: "QUIET", bg: "rgba(255,255,255,0.06)", color: DIM, sub: "Low activity" };
}

function trajColor(traj: string) {
  if (/Accelerat|Advanc|Implement/i.test(traj)) return TEAL;
  if (/Stall|Stable|Decelerat/i.test(traj)) return AMBER;
  if (/Block|Declin/i.test(traj)) return RED;
  return MUTED;
}

export default function TrackerHero({
  slug,
  title,
  insight,
  stage,
  stageName,
  stageDesc,
  stageSource,
  traj,
  trajDesc,
  trajSource,
  nextEvent,
  nextDate,
  nextLocation,
  score,
}: TrackerHeroProps) {
  const [liveScore, setLiveScore] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/velocity/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        console.log("velocity response:", data);
        const s = data?.latest?.score ?? data?.score;
        if (s != null) setLiveScore(s);
      })
      .catch(() => {});
  }, [slug]);

  const band = alertBand(liveScore ?? score ?? null, slug);
  const daysUntil = nextDate ? Math.ceil((new Date(nextDate).getTime() - Date.now()) / 86400000) : null;
  const dateFmt = nextDate
    ? new Date(nextDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: "20px 24px",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: F,
    fontSize: 9,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: DIM,
    marginBottom: 8,
  };

  const sourceStyle: React.CSSProperties = {
    fontFamily: F,
    fontSize: 10,
    color: DIM,
    marginTop: 12,
  };

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .tracker-hero-inner { padding: 0 16px !important; }
        .tracker-hero-cards { grid-template-columns: 1fr 1fr !important; }
        .tracker-hero-next-event { grid-column: 1 / -1 !important; }
      }
    `}</style>
    <div style={{ background: NAVY, padding: "40px 0" }}>
      <div className="tracker-hero-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        {/* Row 1: eyebrow + alert pill */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: TEAL }}>
            LIVE INTELLIGENCE TRACKER
          </div>
          {liveScore !== null && band && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: F,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 4,
                  background: band.bg,
                  color: band.color,
                  border: `1px solid ${band.color}`,
                }}
              >
                {band.label}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                {band.sub}
              </div>
            </div>
          )}
        </div>

        {/* Row 2: title */}
        <h1
          style={{
            fontFamily: F,
            fontSize: 32,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          {title}
        </h1>

        {/* Row 3: insight */}
        <p
          style={{
            fontFamily: F,
            fontSize: 15,
            color: MUTED,
            lineHeight: 1.6,
            marginBottom: 24,
            margin: "0 0 24px 0",
          }}
        >
          {insight}
        </p>

        {/* Row 4: three cards */}
        <div className="tracker-hero-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
          {/* Card 1: Stage */}
          <div style={cardStyle}>
            <div style={labelStyle}>STAGE {stage} OF 5</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: n <= stage ? TEAL : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: "#FFFFFF", marginTop: 8 }}>
              {stageName}
            </div>
            <div style={{ fontFamily: F, fontSize: 13, color: MUTED, lineHeight: 1.5, marginTop: 4 }}>
              {stageDesc}
            </div>
            <div style={sourceStyle}>verified {"\u2713"} {"\u00B7"} {stageSource}</div>
          </div>

          {/* Card 2: Trajectory */}
          <div style={cardStyle}>
            <div style={labelStyle}>TRAJECTORY</div>
            <div style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: trajColor(traj), marginBottom: 0 }}>
              {traj}
            </div>
            <div style={{ fontFamily: F, fontSize: 13, color: MUTED, lineHeight: 1.5, marginTop: 4 }}>
              {trajDesc}
            </div>
            <div style={sourceStyle}>verified {"\u2713"} {"\u00B7"} {trajSource}</div>
          </div>

          {/* Card 3: Next Event */}
          <div className="tracker-hero-next-event" style={cardStyle}>
            <div style={labelStyle}>NEXT EVENT</div>
            {daysUntil !== null ? (
              daysUntil <= 0 ? (
                <div style={{ fontFamily: F, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>NOW</div>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: F, fontSize: 36, fontWeight: 700, color: "#FFFFFF" }}>{daysUntil}</span>
                  <span style={{ fontFamily: F, fontSize: 14, color: DIM }}>days</span>
                </div>
              )
            ) : (
              <div style={{ fontFamily: F, fontSize: 24, fontWeight: 700, color: DIM }}>TBC</div>
            )}
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#FFFFFF", marginTop: 4 }}>
              {nextEvent}
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: MUTED }}>
              {dateFmt ? `${dateFmt}` : ""}{dateFmt && nextLocation ? " " : ""}{nextLocation}
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Status bar: alert + momentum summary */}
    {band && (
      <div style={{ padding: "10px 48px", background: "#F8F9FA", borderBottom: "0.5px solid #DADCE0", display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 12 }}>
        <span style={{ color: "#5F6368" }}>Alert status:</span>
        <span style={{ color: band.color, fontWeight: 600 }}>{band.label}</span>
        <span style={{ color: "#9AA0A6", margin: "0 4px" }}>{"\u00B7"}</span>
        <span style={{ color: "#5F6368" }}>Momentum:</span>
        <span style={{ color: trajColor(traj), fontWeight: 600 }}>{traj}</span>
      </div>
    )}
    </>
  );
}
