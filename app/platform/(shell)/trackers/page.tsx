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
function daysUntil(ds: string) { const t = new Date(); t.setHours(0,0,0,0); const d = new Date(ds); d.setHours(0,0,0,0); return Math.ceil((d.getTime()-t.getTime())/(864e5)); }
function dayColor(d: number|null, fb: string) { if (d===null) return RED; if (d<=0) return RED; if (d<=90) return AMBER; return fb; }
function dayLabel(d: number|null) { if (d===null) return "TBC"; if (d<=0) return "TODAY"; return String(d); }

/* ── Data ──────────────────────────────────────────────────── */
const _mepc = daysUntil("2026-04-27"), _wto = daysUntil("2026-09-15"), _cbd = daysUntil("2026-10-15"), _isa2 = daysUntil("2026-07-01");

const TRACKERS = [
  { slug: "imo-shipping", domain: "IMO \u00B7 Decarbonisation", name: "Shipping Emissions", score: 5.6, sv: 6.1, sr: 6.6, ss: 3.0, mom: "up" as const, traj: "Accelerating", next: "MEPC 84 \u00B7 27 Apr", nextHot: true, urgent: `${dayLabel(_mepc)} days`, history: [3.2,3.8,4.1,4.4,4.6,4.8,5.1,5.3,5.5,5.6], grid: "1/3", gridR: "1/3" },
  { slug: "wto-fisheries", domain: "WTO \u00B7 Trade", name: "Fisheries Subsidies", score: 4.9, sv: 5.1, sr: 5.9, ss: 2.3, mom: "up" as const, traj: "Advancing", next: "Deadline \u00B7 15 Sep", history: [3.6,3.8,4.0,4.1,4.3,4.4,4.6,4.7,4.8,4.9], grid: "3/5", gridR: "1/3" },
  { slug: "isa", domain: "ISA \u00B7 Deep-Sea Mining", name: "Mining Code", score: 4.6, sv: 6.2, sr: 4.8, ss: 1.5, mom: "flat" as const, traj: "Stalling", next: "Council II \u00B7 Jul", history: [2.9,3.5,4.1,4.6,5.1,5.5,6.1,6.3,5.4,4.6], grid: "5/6", gridR: "1/2" },
  { slug: "bbnj", domain: "High Seas Treaty", name: "BBNJ", score: 2.8, sv: 2.9, sr: 3.7, ss: 1.4, mom: "flat" as const, traj: "Advancing", next: "COP1 \u00B7 Jan 2027", history: [3.3,3.7,3.6,3.4,3.2,3.0,3.3,3.4,3.1,2.8], grid: "5/6", gridR: "2/3" },
  { slug: "plastics", domain: "Plastics Treaty", name: "INC Negotiations", score: 1.5, sv: 1.3, sr: 1.9, ss: 0.5, mom: "dn" as const, traj: "Stalled", next: "INC-6 \u00B7 date TBC", urgent: "Stalled", history: [2.3,2.2,1.9,1.8,1.7,1.6,1.5,1.6,1.5,1.5], grid: "1/3", gridR: "3/4" },
  { slug: "30x30", domain: "Ocean MPAs", name: "30\u00D730 Target", score: 5.2, sv: 5.8, sr: 6.3, ss: 1.7, mom: "up" as const, traj: "Advancing", next: "CBD COP17 \u00B7 Oct", history: [4.9,5.9,5.6,5.4,5.2,5.0,5.4,5.6,5.3,5.2], grid: "3/4", gridR: "3/4" },
  { slug: "iuu", domain: "IUU Fishing", name: "Enforcement", score: 4.6, sv: 4.9, sr: 6.0, ss: 1.7, mom: "flat" as const, traj: "Advancing", next: "EU review \u00B7 Q3", history: [5.0,5.4,5.2,4.9,4.8,4.6,4.8,5.0,4.8,4.6], grid: "4/5", gridR: "3/4" },
  { slug: "blue-finance", domain: "Ocean Finance", name: "Blue Finance / TNFD", score: 4.7, sv: 4.9, sr: 6.2, ss: 1.6, mom: "flat" as const, traj: "Advancing", next: "ISSB draft \u00B7 Oct", history: [4.2,4.9,5.1,5.0,4.8,4.6,4.9,5.0,4.8,4.7], grid: "5/6", gridR: "3/4" },
  { slug: "offshore-wind", domain: "Marine Spatial Planning", name: "Offshore Wind", score: 5.0, sv: 5.3, sr: 6.5, ss: 2.6, mom: "flat" as const, traj: "Blocked (US)", next: "Appellate ruling \u00B7 2026", history: [5.0,6.1,6.6,6.3,5.9,5.6,5.8,5.4,5.2,5.0], grid: "1/2", gridR: "4/5" },
  { slug: "cites-marine", domain: "Species Trade", name: "CITES Marine", score: 4.0, sv: 4.2, sr: 5.1, ss: 1.5, mom: "flat" as const, traj: "Implementing", next: "Std Committee \u00B7 2026", history: [6.3,6.1,5.7,5.3,5.0,4.7,4.4,4.3,4.1,4.0], grid: "2/3", gridR: "4/5" },
];

const TICKER = [
  { l: "IMO Shipping", v: 5.6 }, { l: "WTO Subsidies", v: 4.9 }, { l: "ISA Mining", v: 4.6 },
  { l: "BBNJ", v: 2.8 }, { l: "30\u00D730", v: 5.2 }, { l: "IUU Fishing", v: 4.6 },
  { l: "Blue Finance", v: 4.7 }, { l: "CITES Marine", v: 4.0 }, { l: "Offshore Wind", v: 5.0 },
  { l: "Plastics", v: 1.5 }, { l: "MEPC 84", v: null, s: `${dayLabel(_mepc)}d` }, { l: "WTO Deadline", v: null, s: `${dayLabel(_wto)}d` },
  { l: "BBNJ COP1", v: null, s: "Jan 2027" }, { l: "ISA Council II", v: null, s: "Jul 2026" },
] as { l: string; v: number | null; s?: string }[];
const CDS = [
  { d: dayLabel(_mepc), ev: "MEPC 84", sub: "IMO Net-Zero vote \u00B7 London", c: dayColor(_mepc, AMBER), bd: _mepc <= 30 ? AMBER_BD : BORDER, bg: _mepc <= 30 ? AMBER_BG : SURFACE },
  { d: dayLabel(_wto), ev: "WTO Compliance", sub: "Fisheries subsidies deadline", c: dayColor(_wto, TEAL), bd: BORDER, bg: SURFACE },
  { d: dayLabel(_cbd), ev: "CBD COP17", sub: "30\u00D730 implementation review", c: dayColor(_cbd, TEAL), bd: BORDER, bg: SURFACE },
  { d: dayLabel(_isa2), ev: "ISA Council II", sub: "NORI contract \u00B7 Mining Code", c: dayColor(_isa2, TEXT1), bd: BORDER, bg: SURFACE },
  { d: "TBC", ev: "INC-6", sub: "Plastics treaty \u00B7 date unset", c: RED, bd: BORDER, bg: SURFACE },
];

/* ── Momentum Badge ───────────────────────────────────────── */
function Mom({ m }: { m: "up" | "flat" | "dn" }) {
  const x = m === "up" ? { c: TEAL, bg: TEAL_BG, bd: TEAL_BD, t: "\u25B2 Accel" }
    : m === "dn" ? { c: RED, bg: RED_BG, bd: RED_BD, t: "\u25BC Decel" }
    : { c: AMBER, bg: AMBER_BG, bd: AMBER_BD, t: "\u2192 Stable" };
  return <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", padding: "1px 5px", borderRadius: 3, color: x.c, background: x.bg, border: `1px solid ${x.bd}`, alignSelf: "flex-end", marginBottom: 2 }}>{x.t}</span>;
}

/* ── Sparkline ────────────────────────────────────────────── */
function Spark({ h, s, feat }: { h: number[]; s: number; feat?: boolean }) {
  const c = sc(s);
  const pr = h.map((_, i) => i === h.length - 1 ? 3 : 0);
  return (
    <div style={{ flex: 1, minHeight: feat ? 60 : 40, position: "relative" }}>
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
      <div style={{ flex: 1, padding: feat ? "6px 9px 4px" : "5px 8px 4px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEXT2, marginBottom: 2 }}>{t.domain}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 3 }}>
          <span style={{ fontSize: feat ? 22 : 18, fontWeight: 700, fontFamily: M, color: c, lineHeight: 1, transition: "all 0.9s cubic-bezier(.4,0,.2,1)" }}>{(anim ? score : 0).toFixed(1)}</span>
          <span style={{ fontSize: 10, color: TEXT2, marginRight: 6 }}>/10</span>
          <Mom m={t.mom} />
        </div>
        <div style={{ height: 2, background: BORDER2, borderRadius: 1, marginBottom: 4 }}>
          <div style={{ height: 2, borderRadius: 1, background: c, width: anim ? `${score * 10}%` : "0%", transition: "width 0.9s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        {/* sub-scores */}
        <div style={{ display: "flex", border: `0.5px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", marginBottom: 4, flexShrink: 0 }}>
          {([["Vol", sv], ["Rec", sr], ["Sig", ss]] as [string, number][]).map(([lbl, val], i) => (
            <div key={lbl} style={{ padding: "2px 4px", flex: 1, borderRight: i < 2 ? `0.5px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 7, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: TEXT2, marginBottom: 1 }}>{lbl}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: sc(val) }}>{val.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <Spark h={t.history} s={score} feat={feat} />
      </div>
      {/* footer */}
      <div style={{ padding: "3px 8px", borderTop: `0.5px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: BG }}>
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
        <div style={{ height: 38, background: SURFACE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px 0 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT0 }}>Ocean Governance Trackers</span>
          <span style={{ width: 1, height: 16, background: BORDER, margin: "0 14px" }} />
          <span style={{ fontSize: 11, color: TEXT2 }}>Pulse Score v2 {"\u00B7"} recalculated every Monday</span>
          {Object.keys(liveScores).length === 0 && <span style={{ fontSize: 10, color: TEXT2, marginLeft: 12 }}>Recalculating scores...</span>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {[
              { t: `MEPC 84 \u00B7 ${dayLabel(_mepc)} days`, c: _mepc <= 30 ? AMBER : TEAL, bg: _mepc <= 30 ? AMBER_BG : TEAL_BG, bd: _mepc <= 30 ? AMBER_BD : TEAL_BD },
              { t: `WTO deadline \u00B7 ${dayLabel(_wto)} days`, c: AMBER, bg: AMBER_BG, bd: AMBER_BD },
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
        <div style={{ height: 24, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", animation: "scrollLeft 45s linear infinite" }}>
            {tkDupe.map((it, i) => (
              <span key={i} style={{ fontSize: 10, fontFamily: M, color: TEXT2, padding: "0 18px", borderRight: `1px solid ${BORDER2}` }}>
                {it.l} {it.v !== null ? <span style={{ fontWeight: 600, color: sc(it.v) }}>{it.v.toFixed(1)}</span> : <span style={{ color: it.s && it.s.includes("d") ? TEAL : TEXT2 }}>{it.s}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* S3 — grid area */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "6px 14px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {/* countdowns */}
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {CDS.map(cd => (
              <div key={cd.ev} style={{ flex: 1, background: cd.bg, border: `0.5px solid ${cd.bd}`, borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <div><span style={{ fontSize: 18, fontWeight: 700, color: cd.c, lineHeight: 1 }}>{cd.d}</span>{cd.d !== "TBC" && <span style={{ fontSize: 11, color: TEXT2, marginLeft: 2 }}>d</span>}</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: TEXT0 }}>{cd.ev}</span>
                  <span style={{ fontSize: 9, color: TEXT2, marginTop: 1 }}>{cd.sub}</span>
                </div>
              </div>
            ))}
          </div>
          {/* grid */}
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 0.75fr 0.75fr", gap: 4 }}>
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
