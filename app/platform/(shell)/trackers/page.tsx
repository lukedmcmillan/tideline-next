"use client";

import { useState, useEffect } from "react";
import { Chart } from "chart.js/auto";
import { Line } from "react-chartjs-2";

/* ── Design tokens ─────────────────────────────────────────── */
const NAVY = "#0A1628";
const TEAL = "#1D9E75";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const BORDER = "#E8EAED";
const BG = "#F5F6F8";
const WHITE = "#FFFFFF";
const F = "'DM Sans', system-ui, sans-serif";
const M = "'DM Mono', monospace";

/* ── Helpers ───────────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s > 7) return TEAL;
  if (s >= 4) return AMBER;
  return RED;
}

/* ── Data ──────────────────────────────────────────────────── */
const TRACKERS = [
  { domain: "IMO · Decarbonisation", name: "Shipping Emissions", score: 7.4, sv: 8.1, sr: 8.8, ss: 4.0, mom: "up" as const, traj: "Accelerating", next: "MEPC 84 · 27 Apr", nextHot: true, urgent: "16 days", history: [4.2,5.1,5.4,5.8,6.1,6.4,6.8,7.1,7.3,7.4], grid: "1/3", gridR: "1/3" },
  { domain: "WTO · Trade", name: "Fisheries Subsidies", score: 6.5, sv: 6.8, sr: 7.9, ss: 3.0, mom: "up" as const, traj: "Advancing", next: "Deadline · 15 Sep", history: [4.8,5.1,5.3,5.5,5.7,5.9,6.1,6.3,6.4,6.5], grid: "3/5", gridR: "1/3" },
  { domain: "ISA · Deep-Sea Mining", name: "Mining Code", score: 6.1, sv: 8.3, sr: 6.4, ss: 2.0, mom: "flat" as const, traj: "Stalling", next: "Council II · Jul", history: [3.8,4.6,5.4,6.1,6.8,7.3,8.1,8.4,7.2,6.1], grid: "5/6", gridR: "1/2" },
  { domain: "High Seas Treaty", name: "BBNJ", score: 6.1, sv: 6.4, sr: 8.1, ss: 3.0, mom: "flat" as const, traj: "Advancing", next: "COP1 · Jan 2027", history: [7.2,8.1,7.8,7.4,6.9,6.6,7.1,7.3,6.8,6.1], grid: "5/6", gridR: "2/3" },
  { domain: "Plastics Treaty", name: "INC Negotiations", score: 3.2, sv: 2.8, sr: 4.1, ss: 1.0, mom: "dn" as const, traj: "Stalled", next: "INC-6 · date TBC", urgent: "Stalled", history: [5.1,4.8,4.2,3.9,3.6,3.4,3.3,3.4,3.3,3.2], grid: "1/3", gridR: "3/4" },
  { domain: "Ocean MPAs", name: "30×30 Target", score: 6.1, sv: 6.8, sr: 7.4, ss: 2.0, mom: "up" as const, traj: "Advancing", next: "CBD COP17 · Oct", history: [5.8,6.9,6.6,6.3,6.1,5.9,6.4,6.6,6.2,6.1], grid: "3/4", gridR: "3/4" },
  { domain: "IUU Fishing", name: "Enforcement", score: 5.4, sv: 5.8, sr: 7.1, ss: 2.0, mom: "flat" as const, traj: "Advancing", next: "EU review · Q3", history: [5.9,6.4,6.1,5.8,5.6,5.4,5.7,5.9,5.6,5.4], grid: "4/5", gridR: "3/4" },
  { domain: "Ocean Finance", name: "Blue Finance / TNFD", score: 5.9, sv: 6.1, sr: 7.8, ss: 2.0, mom: "flat" as const, traj: "Advancing", next: "ISSB draft · Oct", history: [5.2,6.1,6.4,6.2,6.0,5.8,6.1,6.3,6.0,5.9], grid: "5/6", gridR: "3/4" },
  { domain: "Marine Spatial Planning", name: "Offshore Wind", score: 5.9, sv: 6.2, sr: 7.6, ss: 3.0, mom: "flat" as const, traj: "Blocked (US)", next: "Appellate ruling · 2026", history: [5.9,7.2,7.8,7.4,6.9,6.6,6.8,6.4,6.1,5.9], grid: "1/2", gridR: "4/5" },
  { domain: "Species Trade", name: "CITES Marine", score: 5.3, sv: 5.6, sr: 6.8, ss: 2.0, mom: "flat" as const, traj: "Implementing", next: "Std Committee · 2026", history: [8.4,8.1,7.6,7.1,6.6,6.2,5.9,5.7,5.5,5.3], grid: "2/3", gridR: "4/5" },
];

const TICKER_ITEMS = [
  { label: "IMO Shipping", value: 7.4, arrow: "↑" },
  { label: "WTO Subsidies", value: 6.5, arrow: "↑" },
  { label: "ISA Mining", value: 6.1, arrow: "→" },
  { label: "BBNJ", value: 6.1, arrow: "→" },
  { label: "30×30", value: 6.1, arrow: "↑" },
  { label: "IUU Fishing", value: 5.4, arrow: "→" },
  { label: "Blue Finance", value: 5.9, arrow: "→" },
  { label: "CITES Marine", value: 5.3, arrow: "→" },
  { label: "Offshore Wind", value: 5.9, arrow: "→" },
  { label: "Plastics", value: 3.2, arrow: "↓" },
  { label: "MEPC 84", value: null, arrow: "16d" },
  { label: "WTO", value: null, arrow: "157d" },
];

const COUNTDOWNS = [
  { days: "16", event: "MEPC 84", sub: "IMO Net-Zero vote · London", color: AMBER, border: AMBER, bg: "rgba(239,159,39,.06)" },
  { days: "157", event: "WTO Compliance", sub: "Fisheries subsidies deadline", color: TEAL, border: TEAL, bg: "rgba(29,158,117,.06)" },
  { days: "265", event: "CBD COP17", sub: "30×30 implementation review", color: TEAL, border: TEAL, bg: "rgba(29,158,117,.06)" },
  { days: "296", event: "ISA Council II", sub: "NORI contract · Mining Code", color: T4, border: BORDER, bg: WHITE },
  { days: "TBC", event: "INC-6", sub: "Plastics treaty · date unset", color: RED, border: BORDER, bg: WHITE },
];

/* ── Momentum badge ────────────────────────────────────────── */
function MomentumBadge({ mom }: { mom: "up" | "flat" | "dn" }) {
  const map = {
    up:   { bg: "rgba(29,158,117,.1)",  color: TEAL,  text: "▲ Accel" },
    flat: { bg: "rgba(239,159,39,.1)",   color: AMBER, text: "→ Stable" },
    dn:   { bg: "rgba(226,75,74,.08)",   color: RED,   text: "▼ Decel" },
  };
  const m = map[mom];
  return (
    <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: m.bg, color: m.color }}>
      {m.text}
    </span>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ history, score }: { history: number[]; score: number }) {
  const c = scoreColor(score);
  return (
    <div style={{ flex: 1, minHeight: 0, marginTop: 4 }}>
      <Line
        data={{
          labels: history.map((_, i) => i),
          datasets: [{
            data: history,
            borderColor: c,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            backgroundColor: c + "14",
            tension: 0.4,
          }],
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            x: { display: false },
            y: { display: false, min: 0, max: 10 },
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        }}
      />
    </div>
  );
}

/* ── Tracker card ──────────────────────────────────────────── */
function TrackerCard({
  t,
  animated,
  featured,
}: {
  t: typeof TRACKERS[number];
  animated: boolean;
  featured: boolean;
}) {
  const c = scoreColor(t.score);
  const displayScore = animated ? t.score : 0;
  const momColor = t.mom === "up" ? TEAL : t.mom === "dn" ? RED : AMBER;
  const urgentColor = t.urgent === "Stalled" ? RED : AMBER;
  const urgentBg = t.urgent === "Stalled" ? "rgba(226,75,74,.08)" : "rgba(239,159,39,.1)";

  return (
    <div
      style={{
        gridColumn: t.grid,
        gridRow: t.gridR,
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* top accent bar */}
      <div style={{ height: 3, background: c }} />

      <div style={{ padding: featured ? "12px" : "8px 10px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* domain */}
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase", color: T4 }}>
          {t.domain}
        </div>

        {/* name */}
        <div style={{ fontSize: featured ? 14 : 12, fontWeight: 700, color: T1, marginTop: 2 }}>
          {t.name}
        </div>

        {/* score row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span
            style={{
              fontSize: featured ? 28 : 22,
              fontWeight: 700,
              fontFamily: M,
              color: c,
              transition: "all 900ms cubic-bezier(.4,0,.2,1)",
            }}
          >
            {displayScore.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: T4 }}>/10</span>
          <MomentumBadge mom={t.mom} />
        </div>

        {/* progress bar */}
        <div style={{ height: 3, background: BG, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: animated ? `${t.score * 10}%` : "0%",
              background: c,
              borderRadius: 2,
              transition: "width 900ms cubic-bezier(.4,0,.2,1)",
            }}
          />
        </div>

        {/* sub-scores */}
        <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 9, fontFamily: M }}>
          <span style={{ color: scoreColor(t.sv) }}>Vol {t.sv.toFixed(1)}</span>
          <span style={{ color: scoreColor(t.sr) }}>Reg {t.sr.toFixed(1)}</span>
          <span style={{ color: scoreColor(t.ss) }}>Stk {t.ss.toFixed(1)}</span>
        </div>

        {/* sparkline */}
        <Sparkline history={t.history} score={t.score} />

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: momColor }}>{t.traj}</span>
          <span style={{ fontSize: 9, fontFamily: M, color: T4 }}>{t.next}</span>
        </div>
      </div>

      {/* urgent badge */}
      {t.urgent && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 3,
            background: urgentBg,
            color: urgentColor,
          }}
        >
          {t.urgent}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function TrackersPage() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* duplicate ticker items for seamless loop */
  const tickerDupe = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F }}>

        {/* ── Section 1: Status chips ───────────────────── */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          {/* MEPC 84 chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 12,
            fontSize: 10, fontWeight: 600, fontFamily: M,
            color: AMBER, background: "rgba(239,159,39,.08)", border: "1px solid rgba(239,159,39,.2)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: AMBER, animation: "pulse 2s ease infinite" }} />
            MEPC 84 · 16 days
          </div>

          {/* WTO chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 12,
            fontSize: 10, fontWeight: 600, fontFamily: M,
            color: AMBER, background: "rgba(239,159,39,.08)", border: "1px solid rgba(239,159,39,.2)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: AMBER, animation: "pulse 2s ease infinite" }} />
            WTO deadline · 157 days
          </div>

          {/* Plastics chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 12,
            fontSize: 10, fontWeight: 600, fontFamily: M,
            color: RED, background: "rgba(226,75,74,.08)", border: "1px solid rgba(226,75,74,.2)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: RED, animation: "pulse 2s ease infinite" }} />
            Plastics stalled
          </div>
        </div>

        {/* ── Section 2: Ticker bar ─────────────────────── */}
        <div style={{ height: 28, background: NAVY, display: "flex", alignItems: "center" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
            color: TEAL, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,.08)",
          }}>
            LIVE
          </span>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{
              display: "inline-flex", gap: 80, whiteSpace: "nowrap",
              animation: "ticker 80s linear infinite", paddingLeft: "100%",
            }}>
              {tickerDupe.map((item, i) => (
                <span key={i} style={{ fontSize: 11, fontFamily: M, color: "rgba(255,255,255,.6)" }}>
                  {item.label}{" "}
                  {item.value !== null ? (
                    <span style={{ color: scoreColor(item.value) }}>{item.value.toFixed(1)}</span>
                  ) : null}
                  {item.arrow}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 3: Countdown strip ────────────────── */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          {COUNTDOWNS.map((cd, i) => (
            <div
              key={i}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 6,
                border: `1px solid ${cd.border}`, background: cd.bg,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: M, color: cd.color }}>
                {cd.days}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: T3, marginTop: 2 }}>
                {cd.event}
              </div>
              <div style={{ fontSize: 10, color: T4, marginTop: 1 }}>
                {cd.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Section 4: Tracker grid ───────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(4, 1fr)",
            gap: 7,
            padding: "0 16px 16px",
            flex: 1,
          }}
        >
          {TRACKERS.map((t) => {
            const cols = t.grid.split("/");
            const rows = t.gridR.split("/");
            const spanCols = Number(cols[1]) - Number(cols[0]);
            const spanRows = Number(rows[1]) - Number(rows[0]);
            const featured = spanCols >= 2 || spanRows >= 2;
            return (
              <TrackerCard key={t.name} t={t} animated={animated} featured={featured} />
            );
          })}
        </div>
      </div>
    </>
  );
}
