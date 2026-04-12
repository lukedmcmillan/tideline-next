"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

/* ── Tokens ────────────────────────────────────────────────── */
const BG = "#F8F9FA";
const SURFACE = "#FFFFFF";
const BORDER = "#DADCE0";
const BORDER2 = "#E8EAED";
const TEXT0 = "#202124";
const TEXT1 = "#5F6368";
const TEXT2 = "#9AA0A6";
const TEAL = "#1D9E75";
const TEAL_BG = "rgba(29,158,117,.08)";
const TEAL_BD = "rgba(29,158,117,.2)";
const AMBER = "#EF9F27";
const AMBER_BG = "rgba(239,159,39,.08)";
const AMBER_BD = "rgba(239,159,39,.2)";
const RED = "#E24B4A";
const RED_BG = "rgba(226,75,74,.07)";
const RED_BD = "rgba(226,75,74,.18)";
const F = "'DM Sans', system-ui, sans-serif";
const M = "'DM Mono', monospace";

function sc(v: number) { return v < 4 ? RED : v <= 7 ? AMBER : TEAL; }

/* ── Data ──────────────────────────────────────────────────── */
const TRACKERS = [
  { slug: "imo-shipping", domain: "IMO \u00B7 Decarbonisation", name: "Shipping Emissions", score: 7.4, sv: 8.1, sr: 8.8, ss: 4.0, mom: "up" as const, traj: "Accelerating", next: "MEPC 84 \u00B7 27 Apr", nextHot: true, urgent: "16 days", history: [4.2,5.1,5.4,5.8,6.1,6.4,6.8,7.1,7.3,7.4], grid: "1/3", gridR: "1/3" },
  { slug: "wto-fisheries", domain: "WTO \u00B7 Trade", name: "Fisheries Subsidies", score: 6.5, sv: 6.8, sr: 7.9, ss: 3.0, mom: "up" as const, traj: "Advancing", next: "Deadline \u00B7 15 Sep", history: [4.8,5.1,5.3,5.5,5.7,5.9,6.1,6.3,6.4,6.5], grid: "3/5", gridR: "1/3" },
  { slug: "isa", domain: "ISA \u00B7 Deep-Sea Mining", name: "Mining Code", score: 6.1, sv: 8.3, sr: 6.4, ss: 2.0, mom: "flat" as const, traj: "Stalling", next: "Council II \u00B7 Jul", history: [3.8,4.6,5.4,6.1,6.8,7.3,8.1,8.4,7.2,6.1], grid: "5/6", gridR: "1/2" },
  { slug: "bbnj", domain: "High Seas Treaty", name: "BBNJ", score: 6.1, sv: 6.4, sr: 8.1, ss: 3.0, mom: "flat" as const, traj: "Advancing", next: "COP1 \u00B7 Jan 2027", history: [7.2,8.1,7.8,7.4,6.9,6.6,7.1,7.3,6.8,6.1], grid: "5/6", gridR: "2/3" },
  { slug: "plastics", domain: "Plastics Treaty", name: "INC Negotiations", score: 3.2, sv: 2.8, sr: 4.1, ss: 1.0, mom: "dn" as const, traj: "Stalled", next: "INC-6 \u00B7 date TBC", urgent: "Stalled", history: [5.1,4.8,4.2,3.9,3.6,3.4,3.3,3.4,3.3,3.2], grid: "1/3", gridR: "3/4" },
  { slug: "30x30", domain: "Ocean MPAs", name: "30\u00D730 Target", score: 6.1, sv: 6.8, sr: 7.4, ss: 2.0, mom: "up" as const, traj: "Advancing", next: "CBD COP17 \u00B7 Oct", history: [5.8,6.9,6.6,6.3,6.1,5.9,6.4,6.6,6.2,6.1], grid: "3/4", gridR: "3/4" },
  { slug: "iuu", domain: "IUU Fishing", name: "Enforcement", score: 5.4, sv: 5.8, sr: 7.1, ss: 2.0, mom: "flat" as const, traj: "Advancing", next: "EU review \u00B7 Q3", history: [5.9,6.4,6.1,5.8,5.6,5.4,5.7,5.9,5.6,5.4], grid: "4/5", gridR: "3/4" },
  { slug: "blue-finance", domain: "Ocean Finance", name: "Blue Finance / TNFD", score: 5.9, sv: 6.1, sr: 7.8, ss: 2.0, mom: "flat" as const, traj: "Advancing", next: "ISSB draft \u00B7 Oct", history: [5.2,6.1,6.4,6.2,6.0,5.8,6.1,6.3,6.0,5.9], grid: "5/6", gridR: "3/4" },
  { slug: "offshore-wind", domain: "Marine Spatial Planning", name: "Offshore Wind", score: 5.9, sv: 6.2, sr: 7.6, ss: 3.0, mom: "flat" as const, traj: "Blocked (US)", next: "Appellate ruling \u00B7 2026", history: [5.9,7.2,7.8,7.4,6.9,6.6,6.8,6.4,6.1,5.9], grid: "1/2", gridR: "4/5" },
  { slug: "cites-marine", domain: "Species Trade", name: "CITES Marine", score: 5.3, sv: 5.6, sr: 6.8, ss: 2.0, mom: "flat" as const, traj: "Implementing", next: "Std Committee \u00B7 2026", history: [8.4,8.1,7.6,7.1,6.6,6.2,5.9,5.7,5.5,5.3], grid: "2/3", gridR: "4/5" },
];

const TICKER = [
  { l: "IMO Shipping", v: 7.4 }, { l: "WTO Subsidies", v: 6.5 }, { l: "ISA Mining", v: 6.1 },
  { l: "BBNJ", v: 6.1 }, { l: "30\u00D730", v: 6.1 }, { l: "IUU Fishing", v: 5.4 },
  { l: "Blue Finance", v: 5.9 }, { l: "CITES Marine", v: 5.3 }, { l: "Offshore Wind", v: 5.9 },
  { l: "Plastics", v: 3.2 }, { l: "MEPC 84", v: null, s: "16d" }, { l: "WTO Deadline", v: null, s: "157d" },
  { l: "BBNJ COP1", v: null, s: "Jan 2027" }, { l: "ISA Council II", v: null, s: "Jul 2026" },
] as { l: string; v: number | null; s?: string }[];

const CDS = [
  { d: "16", ev: "MEPC 84", sub: "IMO Net-Zero vote \u00B7 London", c: AMBER, bd: AMBER_BD, bg: AMBER_BG },
  { d: "157", ev: "WTO Compliance", sub: "Fisheries subsidies deadline", c: TEAL, bd: BORDER, bg: SURFACE },
  { d: "265", ev: "CBD COP17", sub: "30\u00D730 implementation review", c: TEAL, bd: BORDER, bg: SURFACE },
  { d: "296", ev: "ISA Council II", sub: "NORI contract \u00B7 Mining Code", c: TEXT1, bd: BORDER, bg: SURFACE },
  { d: "TBC", ev: "INC-6", sub: "Plastics treaty \u00B7 date unset", c: RED, bd: BORDER, bg: SURFACE },
];

/* ── Momentum Badge ───────────────────────────────────────── */
function Mom({ m }: { m: "up" | "flat" | "dn" }) {
  const x = m === "up" ? { c: TEAL, bg: TEAL_BG, bd: TEAL_BD, t: "\u25B2 Accel" }
    : m === "dn" ? { c: RED, bg: RED_BG, bd: RED_BD, t: "\u25BC Decel" }
    : { c: AMBER, bg: AMBER_BG, bd: AMBER_BD, t: "\u2192 Stable" };
  return <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", padding: "2px 6px", borderRadius: 3, color: x.c, background: x.bg, border: `1px solid ${x.bd}`, alignSelf: "flex-end", marginBottom: 2 }}>{x.t}</span>;
}

/* ── Sparkline ────────────────────────────────────────────── */
function Spark({ h, s }: { h: number[]; s: number }) {
  const c = sc(s);
  const pr = h.map((_, i) => i === h.length - 1 ? 3 : 0);
  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <Line
        data={{ labels: h.map((_, i) => i), datasets: [{ data: h, borderColor: c, borderWidth: 1.5, pointRadius: pr, pointBackgroundColor: c, fill: true, backgroundColor: c + "18", tension: 0.4 }] }}
        options={{ maintainAspectRatio: false, responsive: true, scales: { x: { display: false }, y: { display: false, min: 0, max: 10 } }, plugins: { legend: { display: false }, tooltip: { enabled: false } } }}
      />
    </div>
  );
}

/* ── Tracker Card ─────────────────────────────────────────── */
function Card({ t, anim, feat, onClick, live }: {
  t: typeof TRACKERS[number]; anim: boolean; feat: boolean;
  onClick: () => void; live?: { score: number; sv: number; sr: number; ss: number };
}) {
  const [hov, setHov] = useState(false);
  const score = live?.score ?? t.score;
  const sv = live?.sv ?? t.sv;
  const sr = live?.sr ?? t.sr;
  const ss = live?.ss ?? t.ss;
  const c = sc(score);

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ gridColumn: t.grid, gridRow: t.gridR, background: SURFACE, border: `0.5px solid ${hov ? "#BBBFC3" : BORDER}`, borderRadius: 6, display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", position: "relative", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: hov ? "0 1px 8px rgba(0,0,0,.06)" : "none" }}>
      {/* open */}
      <span style={{ position: "absolute", top: 8, right: t.urgent ? 56 : 8, fontSize: 9, color: TEXT2, opacity: hov ? 1 : 0, pointerEvents: "none", transition: "opacity 0.12s", zIndex: 2 }}>Open {"\u2197"}</span>
      {/* urgent */}
      {t.urgent && <span style={{ position: "absolute", top: 7, right: 7, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: t.urgent === "Stalled" ? RED : AMBER, background: t.urgent === "Stalled" ? RED_BG : AMBER_BG, border: `1px solid ${t.urgent === "Stalled" ? RED_BD : AMBER_BD}`, padding: "2px 5px", borderRadius: 3, zIndex: 2 }}>{t.urgent}</span>}
      {/* accent */}
      <div style={{ height: 3, background: c, flexShrink: 0 }} />
      {/* body */}
      <div style={{ flex: 1, padding: feat ? "10px 12px 7px" : "9px 11px 6px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEXT2, marginBottom: 2 }}>{t.domain}</div>
        <div style={{ fontSize: feat ? 13 : 11, fontWeight: 600, color: TEXT0, lineHeight: 1.2, marginBottom: 6 }}>{t.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 3 }}>
          <span style={{ fontSize: feat ? 28 : 22, fontWeight: 700, fontFamily: M, color: c, lineHeight: 1, transition: "all 0.9s cubic-bezier(.4,0,.2,1)" }}>{(anim ? score : 0).toFixed(1)}</span>
          <span style={{ fontSize: 11, color: TEXT2, marginRight: 6 }}>/10</span>
          <Mom m={t.mom} />
        </div>
        <div style={{ height: 2, background: BORDER2, borderRadius: 1, marginBottom: 6 }}>
          <div style={{ height: 2, borderRadius: 1, background: c, width: anim ? `${score * 10}%` : "0%", transition: "width 0.9s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        {/* sub-scores */}
        <div style={{ display: "flex", border: `0.5px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", marginBottom: 6, flexShrink: 0 }}>
          {([["Vol", sv], ["Rec", sr], ["Sig", ss]] as [string, number][]).map(([lbl, val], i) => (
            <div key={lbl} style={{ padding: "4px 6px", flex: 1, borderRight: i < 2 ? `0.5px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: TEXT2, marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: sc(val) }}>{val.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <Spark h={t.history} s={score} />
      </div>
      {/* footer */}
      <div style={{ padding: "5px 12px", borderTop: `0.5px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: BG }}>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", color: c }}>{t.traj}</span>
        <span style={{ fontSize: 9, color: t.nextHot ? c : TEXT2 }}>{t.next}</span>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function TrackersPage() {
  const router = useRouter();
  const [anim, setAnim] = useState(false);
  const [liveScores, setLiveScores] = useState<Record<string, { score: number; sv: number; sr: number; ss: number }>>({});

  useEffect(() => { const id = requestAnimationFrame(() => setAnim(true)); return () => cancelAnimationFrame(id); }, []);

  useEffect(() => {
    Promise.all(
      TRACKERS.map(t =>
        fetch(`/api/velocity/${t.slug}`).then(r => r.ok ? r.json() : null)
          .then(d => d?.latest ? { slug: t.slug, score: d.latest.score, sv: d.latest.score_volume ?? 0, sr: d.latest.score_recency ?? 0, ss: d.latest.score_signals ?? 0 } : null)
          .catch(() => null)
      )
    ).then(res => {
      const m: Record<string, { score: number; sv: number; sr: number; ss: number }> = {};
      res.forEach(r => { if (r) m[r.slug] = { score: r.score, sv: r.sv, sr: r.sr, ss: r.ss }; });
      if (Object.keys(m).length > 0) setLiveScores(m);
    });
  }, []);

  const tkDupe = [...TICKER, ...TICKER];

  return (
    <>
      <style>{`
        @keyframes scrollLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
      <div style={{ background: BG, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F }}>

        {/* S1 — topbar */}
        <div style={{ height: 46, background: SURFACE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT0 }}>Ocean Governance Trackers</span>
          <span style={{ width: 1, height: 16, background: BORDER, margin: "0 14px" }} />
          <span style={{ fontSize: 11, color: TEXT2 }}>Pulse Score v2 {"\u00B7"} recalculated every Monday</span>
          {Object.keys(liveScores).length === 0 && <span style={{ fontSize: 10, color: TEXT2, marginLeft: 12 }}>Recalculating scores...</span>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {[
              { t: "MEPC 84 \u00B7 16 days", c: AMBER, bg: AMBER_BG, bd: AMBER_BD },
              { t: "WTO deadline \u00B7 157 days", c: AMBER, bg: AMBER_BG, bd: AMBER_BD },
              { t: "Plastics stalled", c: RED, bg: RED_BG, bd: RED_BD },
            ].map(ch => (
              <span key={ch.t} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, color: ch.c, background: ch.bg, border: `1px solid ${ch.bd}` }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", animation: "blink 1.5s ease-in-out infinite" }} />
                {ch.t}
              </span>
            ))}
          </div>
        </div>

        {/* S2 — ticker */}
        <div style={{ height: 30, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", animation: "scrollLeft 45s linear infinite" }}>
            {tkDupe.map((it, i) => (
              <span key={i} style={{ fontSize: 10, fontFamily: M, color: TEXT2, padding: "0 18px", borderRight: `1px solid ${BORDER2}` }}>
                {it.l} {it.v !== null ? <span style={{ fontWeight: 600, color: sc(it.v) }}>{it.v.toFixed(1)}</span> : <span style={{ color: it.s && it.s.includes("d") ? TEAL : TEXT2 }}>{it.s}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* S3 — grid area */}
        <div style={{ flex: 1, overflow: "hidden", padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* countdowns */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {CDS.map(cd => (
              <div key={cd.ev} style={{ flex: 1, background: cd.bg, border: `0.5px solid ${cd.bd}`, borderRadius: 6, padding: "7px 13px", display: "flex", alignItems: "center", gap: 10 }}>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: cd.c, lineHeight: 1 }}>{cd.d}</span>{cd.d !== "TBC" && <span style={{ fontSize: 11, color: TEXT2, marginLeft: 2 }}>d</span>}</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: TEXT0 }}>{cd.ev}</span>
                  <span style={{ fontSize: 10, color: TEXT2, marginTop: 1 }}>{cd.sub}</span>
                </div>
              </div>
            ))}
          </div>
          {/* grid */}
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 0.8fr 0.8fr", gap: 6 }}>
            {TRACKERS.map(t => {
              const cols = t.grid.split("/"); const rows = t.gridR.split("/");
              const feat = Number(cols[1]) - Number(cols[0]) >= 2 || Number(rows[1]) - Number(rows[0]) >= 2;
              return <Card key={t.slug} t={t} anim={anim} feat={feat} onClick={() => router.push(`/tracker/${t.slug}`)} live={liveScores[t.slug]} />;
            })}
          </div>
        </div>
      </div>
    </>
  );
}
