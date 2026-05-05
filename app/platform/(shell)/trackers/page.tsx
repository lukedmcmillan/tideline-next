"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sparkline from "@/components/Sparkline";

/* ── Tokens (dark, matches dashboard-v2) ──────────────────── */
const BG = "#0B1628";
const SURFACE = "#0D1E35";
const SURFACE_HI = "#122845";
const BORDER = "#1A2A44";
const BORDER2 = "#24375A";
const TEXT0 = "#E8EDF4";
const TEXT1 = "#8BA0BC";
const TEXT2 = "#5B6F8C";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const F = "'DM Sans', system-ui, sans-serif";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif";
const M = "'DM Sans', sans-serif";

function sc(v: number) { return v >= 7 ? TEAL_BRIGHT : v >= 4 ? AMBER : RED; }
function daysUntil(ds: string) { const t = new Date(); t.setHours(0,0,0,0); const d = new Date(ds); d.setHours(0,0,0,0); return Math.ceil((d.getTime()-t.getTime())/(864e5)); }
function dayColor(d: number|null) { if (d===null) return RED; if (d<=0) return RED; if (d<=90) return AMBER; return TEAL_BRIGHT; }
function dayLabel(d: number|null) { if (d===null) return "TBC"; if (d<=0) return "TODAY"; return String(d); }

/* ── Trajectory colour + footer styling ───────────────────── */
function trajColor(traj: string) {
  const t = traj.toLowerCase();
  if (t.includes("accel") || t.includes("advancing") || t.includes("implementing")) return TEAL_BRIGHT;
  if (t.includes("stall") || t.includes("stable")) return AMBER;
  return RED;
}

function trajFooterStyle(traj: string) {
  const c = trajColor(traj);
  const rgb = c === TEAL_BRIGHT ? "39,200,147" : c === AMBER ? "239,159,39" : "226,75,74";
  return { bg: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)`, color: c };
}

/* ── Sub-score colour by magnitude ────────────────────────── */
function subScoreColor(v: number) {
  if (v >= 6) return TEAL_BRIGHT;
  if (v >= 3) return AMBER;
  return RED;
}

/* ── Data ──────────────────────────────────────────────────── */
const _mepc = daysUntil("2026-04-27"), _wto = daysUntil("2026-09-15"), _cbd = daysUntil("2026-10-15"), _isa2 = daysUntil("2026-07-01");

const TRACKERS = [
  { slug: "imo-shipping", domain: "IMO Shipping", name: "Shipping Emissions", score: 5.6, sv: 6.1, sr: 6.6, ss: 3.0, mom: "up" as const, traj: "Accelerating", next: "MEPC 84 \u00B7 27 Apr", nextHot: true, history: [3.2,3.8,4.1,4.4,4.6,4.8,5.1,5.3,5.5,5.6], nextEvent: "MEPC 84", nextDate: "2026-04-27" },
  { slug: "wto-fisheries", domain: "WTO Fisheries", name: "Fisheries Subsidies", score: 4.9, sv: 5.1, sr: 5.9, ss: 2.3, mom: "up" as const, traj: "Advancing", next: "Deadline \u00B7 15 Sep", history: [3.6,3.8,4.0,4.1,4.3,4.4,4.6,4.7,4.8,4.9], nextEvent: "Compliance deadline", nextDate: "2026-09-15" },
  { slug: "isa", domain: "ISA Mining", name: "ISA Mining Code", score: 4.6, sv: 6.2, sr: 4.8, ss: 1.5, mom: "flat" as const, traj: "Stalling", next: "Council II \u00B7 Jul", history: [2.9,3.5,4.1,4.6,5.1,5.5,6.1,6.3,5.4,4.6], nextEvent: "ISA Council 31st Part 2", nextDate: "2026-07-14" },
  { slug: "bbnj", domain: "High Seas Treaty", name: "BBNJ", score: 2.8, sv: 2.9, sr: 3.7, ss: 1.4, mom: "flat" as const, traj: "Advancing", next: "COP1 \u00B7 Jan 2027", history: [3.3,3.7,3.6,3.4,3.2,3.0,3.3,3.4,3.1,2.8], nextEvent: "BBNJ COP1", nextDate: "2027-01-01" },
  { slug: "plastics", domain: "Plastics Treaty", name: "INC Negotiations", score: 1.5, sv: 1.3, sr: 1.9, ss: 0.5, mom: "dn" as const, traj: "Stalled", next: "INC-6 \u00B7 date TBC", history: [2.3,2.2,1.9,1.8,1.7,1.6,1.5,1.6,1.5,1.5] },
  { slug: "30x30", domain: "Marine Protected Areas", name: "30x30 Target", score: 5.2, sv: 5.8, sr: 6.3, ss: 1.7, mom: "up" as const, traj: "Advancing", next: "CBD COP17 \u00B7 Oct", history: [4.9,5.9,5.6,5.4,5.2,5.0,5.4,5.6,5.3,5.2], nextEvent: "CBD COP17", nextDate: "2026-10-15" },
  { slug: "iuu", domain: "Illegal Fishing", name: "IUU Enforcement", score: 4.6, sv: 4.9, sr: 6.0, ss: 1.7, mom: "flat" as const, traj: "Advancing", next: "EU review \u00B7 Q3", history: [5.0,5.4,5.2,4.9,4.8,4.6,4.8,5.0,4.8,4.6], nextEvent: "EU CATCH review", nextDate: "2026-09-01" },
  { slug: "blue-finance", domain: "Blue Finance", name: "Blue Finance / TNFD", score: 4.7, sv: 4.9, sr: 6.2, ss: 1.6, mom: "flat" as const, traj: "Advancing", next: "ISSB draft \u00B7 Oct", history: [4.2,4.9,5.1,5.0,4.8,4.6,4.9,5.0,4.8,4.7], nextEvent: "ISSB exposure draft", nextDate: "2026-10-01" },
  { slug: "offshore-wind", domain: "Offshore Wind", name: "Offshore Wind & MSP", score: 5.0, sv: 5.3, sr: 6.5, ss: 2.6, mom: "flat" as const, traj: "Blocked (US)", next: "Appellate ruling \u00B7 2026", history: [5.0,6.1,6.6,6.3,5.9,5.6,5.8,5.4,5.2,5.0] },
  { slug: "cites-marine", domain: "CITES Marine", name: "CITES Marine Species", score: 4.0, sv: 4.2, sr: 5.1, ss: 1.5, mom: "flat" as const, traj: "Implementing", next: "Std Committee \u00B7 2026", history: [6.3,6.1,5.7,5.3,5.0,4.7,4.4,4.3,4.1,4.0], nextEvent: "CITES trade review", nextDate: "2026-06-01" },
];

const CDS = [
  { d: dayLabel(_mepc), ev: "MEPC 84", sub: "IMO Net-Zero vote \u00B7 London", c: dayColor(_mepc) },
  { d: dayLabel(_wto), ev: "WTO Compliance", sub: "Fisheries subsidies deadline", c: dayColor(_wto) },
  { d: dayLabel(_cbd), ev: "CBD COP17", sub: "30x30 implementation review", c: dayColor(_cbd) },
  { d: dayLabel(_isa2), ev: "ISA Council II", sub: "NORI contract, Mining Code", c: dayColor(_isa2) },
  { d: "TBC", ev: "INC-6", sub: "Plastics treaty, date unset", c: RED },
];

/* ── Momentum Badge (outline only) ────────────────────────── */
function Mom({ m }: { m: "up" | "flat" | "dn" }) {
  const x = m === "up" ? { c: TEAL_BRIGHT, t: "\u25B2 Accel" }
    : m === "dn" ? { c: RED, t: "\u25BC Decel" }
    : { c: TEXT1, t: "\u2192 Stable" };
  return <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", padding: "1px 5px", borderRadius: 3, color: x.c, background: "transparent", border: `1px solid ${x.c}`, alignSelf: "flex-end", marginBottom: 2 }}>{x.t}</span>;
}

/* ── Tracker Card ─────────────────────────────────────────── */
function Card({ t, anim, onClick, live }: {
  t: typeof TRACKERS[number]; anim: boolean;
  onClick: () => void; live?: { score: number; sv: number; sr: number; ss: number };
}) {
  const [hov, setHov] = useState(false);
  const score = live?.score ?? t.score;
  const sv = live?.sv ?? t.sv;
  const sr = live?.sr ?? t.sr;
  const ss = live?.ss ?? t.ss;
  const c = sc(score);

  const foot = trajFooterStyle(t.traj);

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? SURFACE_HI : SURFACE, borderTop: `1px solid ${hov ? TEAL_BRIGHT : BORDER}`, borderRight: `1px solid ${hov ? TEAL_BRIGHT : BORDER}`, borderBottom: `1px solid ${hov ? TEAL_BRIGHT : BORDER}`, borderLeft: `4px solid ${c}`, borderRadius: 6, display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", position: "relative", transition: "background 0.15s, border-color 0.15s" }}>
      {/* open hint */}
      <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, color: TEXT1, opacity: hov ? 1 : 0, pointerEvents: "none", transition: "opacity 0.12s", zIndex: 2 }}>Open {"\u2197"}</span>
      {/* body */}
      <div style={{ flex: 1, padding: "6px 9px 4px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEXT1, marginBottom: 2 }}>{t.domain}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: M, color: c, lineHeight: 1, transition: "all 0.9s cubic-bezier(.4,0,.2,1)" }}>{(anim ? score : 0).toFixed(1)}</span>
          <span style={{ fontSize: 10, color: TEXT2, marginRight: 6 }}>/10</span>
          <Mom m={t.mom} />
        </div>
        <div style={{ height: 2, background: BORDER, borderRadius: 1, marginBottom: 4 }}>
          <div style={{ height: 2, borderRadius: 1, background: c, width: anim ? `${score * 10}%` : "0%", transition: "width 0.9s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        {/* sub-scores */}
        <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", marginBottom: 4, flexShrink: 0 }}>
          {([["VOL", sv], ["REC", sr], ["SIG", ss]] as [string, number][]).map(([lbl, val], i) => (
            <div key={lbl} style={{ padding: "3px 4px", flex: 1, borderRight: i < 2 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: TEXT1, fontFamily: M, marginBottom: 1 }}>{lbl}</div>
              {val === 0 ? (
                <div style={{ fontSize: 13, fontWeight: 500, fontFamily: M, color: TEXT2 }}>&ndash;</div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 500, fontFamily: M, color: subScoreColor(val) }}>{val.toFixed(1)}</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 80 }}>
          <Sparkline history={t.history} score={score} withFill strokeWidth={2} fillOpacity={0.15} size="expanded" />
        </div>
      </div>
      {/* footer — coloured by trajectory */}
      <div style={{ padding: "3px 8px", borderTop: foot.border, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: foot.bg, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: M, color: foot.color }}>{t.traj}</span>
        <span style={{ fontSize: 10, fontFamily: M, color: TEXT1 }}>{t.next}</span>
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

  /* ── Sort cards by score descending ── */
  const sorted = [...TRACKERS].sort((a, b) => {
    const scoreA = liveScores[a.slug]?.score ?? a.score;
    const scoreB = liveScores[b.slug]?.score ?? b.score;
    return scoreB - scoreA;
  });

  /* ── Ticker uses live scores ── */
  const TICKER: { l: string; v: number | null; s?: string }[] = TRACKERS.map(t => ({
    l: t.domain,
    v: liveScores[t.slug]?.score ?? t.score,
  }));
  const tkDupe = [...TICKER, ...TICKER];

  /* ── Alert banner logic ── */
  const alerts = TRACKERS.map(t => {
    const score = liveScores[t.slug]?.score ?? t.score;
    if (!("nextDate" in t) || !t.nextDate) return null;
    const days = Math.ceil((new Date(t.nextDate).getTime() - Date.now()) / 86400000);
    if (days < 0 || days > 30) return null;
    const threshold = t.slug === "offshore-wind" ? 3.5 : 5.0;
    if (score < threshold) return null;
    return { ...t, days, liveScore: score };
  }).filter(Boolean) as (typeof TRACKERS[number] & { days: number; liveScore: number })[];
  const urgentAlert = alerts.sort((a, b) => a.days - b.days)[0] ?? null;

  return (
    <>
      <style>{`
        @keyframes scrollLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes alertPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        @media(max-width:768px){
          .trackers-page{height:auto!important;overflow:visible!important}
          .trackers-s3{flex:none!important;overflow:visible!important;min-height:0!important}
          .trackers-alert{flex-wrap:wrap!important;min-height:auto!important}
          .trackers-alert>button{width:100%!important;justify-content:center!important;margin-top:8px!important}
          .trackers-cd{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none}
          .trackers-cd::-webkit-scrollbar{display:none}
          .trackers-cd-cell{min-width:130px!important;flex-shrink:0!important;flex:none!important}
          .trackers-cd-wrap{position:relative}
          .trackers-cd-wrap::after{content:'';position:absolute;top:0;right:0;bottom:0;width:40px;background:linear-gradient(to right,transparent,#0B1628);pointer-events:none;z-index:1}
          .trackers-grid{grid-template-columns:1fr 1fr!important;overflow:visible!important;grid-auto-rows:auto!important}
        }
      `}</style>
      <div className="trackers-page" style={{ background: BG, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F }}>

        {/* S1: topbar */}
        <div style={{ height: 38, background: SURFACE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 12px 0 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT0 }}>Live Signal Trackers</span>
          <span className="mob-hide" style={{ width: 1, height: 16, background: BORDER2, margin: "0 14px" }} />
          <span className="mob-hide" style={{ fontSize: 11, color: TEXT1 }}>Pulse Score {"\u00B7"} recalculated every four days</span>
          {Object.keys(liveScores).length === 0 && <span style={{ fontSize: 10, color: TEXT2, marginLeft: 12 }}>Recalculating scores...</span>}
        </div>

        {/* S1.5: hero alert banner */}
        {urgentAlert && (
          <div className="trackers-alert" style={{ background: `linear-gradient(135deg, ${SURFACE} 0%, ${SURFACE} 60%, rgba(226,75,74,0.15) 100%)`, borderBottom: `1px solid ${BORDER}`, padding: "16px 20px", minHeight: 90, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: RED, flexShrink: 0, animation: "alertPulse 1.5s ease-in-out infinite" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, color: TEXT0 }}>
                  {urgentAlert.nextEvent} <span style={{ color: TEAL_BRIGHT }}>{"\u00B7"} {urgentAlert.days}d</span>
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FFFFFF", background: RED, padding: "2px 8px", borderRadius: 3 }}>
                  {urgentAlert.liveScore >= 7 ? "HIGH" : "ELEVATED"}
                </span>
                <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT1, border: `1px solid ${BORDER2}`, padding: "1px 6px", borderRadius: 3 }}>
                  {urgentAlert.domain}
                </span>
              </div>
              <span style={{ fontSize: 12, color: TEXT1 }}>
                {urgentAlert.domain} score elevated, preparation window open now
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: M, color: AMBER, background: "rgba(239,159,39,0.15)", border: "1px solid rgba(239,159,39,0.3)", padding: "3px 10px", borderRadius: 4, flexShrink: 0 }}>
              {urgentAlert.liveScore.toFixed(1)} {"\u25B2"}
            </span>
            <button
              className="mob-tap"
              onClick={() => router.push(`/platform/tracker/${urgentAlert.slug}`)}
              style={{ fontSize: 11, fontWeight: 600, color: "#0A1628", background: TEAL_BRIGHT, border: "none", padding: "6px 14px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}
            >
              Open tracker {"\u2192"}
            </button>
          </div>
        )}

        {/* S2: ticker */}
        <div style={{ height: 24, flexShrink: 0, borderBottom: `1px solid ${BORDER}`, background: SURFACE, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", animation: "scrollLeft 45s linear infinite" }}>
            {tkDupe.map((it, i) => (
              <span key={i} style={{ fontSize: 10, fontFamily: M, color: TEXT1, padding: "0 18px", borderRight: `1px solid ${BORDER}` }}>
                {it.l} {it.v !== null ? <span style={{ fontWeight: 600, color: sc(it.v) }}>{it.v.toFixed(1)}</span> : <span style={{ color: TEXT2 }}>{it.s}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* S3: grid area */}
        <div className="trackers-s3" style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "6px 14px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {/* countdowns */}
          <div className="trackers-cd-wrap" style={{ flexShrink: 0 }}>
            <div className="trackers-cd" style={{ display: "flex", gap: 5 }}>
              {CDS.map((cd, i) => (
                <div key={cd.ev} className="trackers-cd-cell" style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 10, borderRight: i < CDS.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                  <div><span style={{ fontSize: 18, fontWeight: 700, fontFamily: M, color: AMBER, lineHeight: 1 }}>{cd.d}</span>{cd.d !== "TBC" && <span style={{ fontSize: 11, fontFamily: M, color: TEXT2, marginLeft: 2 }}>d</span>}</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: TEXT0 }}>{cd.ev}</span>
                    <span style={{ fontSize: 9, color: TEXT1, marginTop: 1 }}>{cd.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* grid: 5 columns desktop, 2 columns mobile, sorted by score desc */}
          <div className="trackers-grid" style={{ flex: 1, minHeight: 0, overflow: "auto", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridAutoRows: "1fr", gap: 6 }}>
            {sorted.map(t => (
              <Card key={t.slug} t={t} anim={anim} onClick={() => router.push(`/platform/tracker/${t.slug}`)} live={liveScores[t.slug]} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
