"use client";

import { useEffect, useRef, useState } from "react";
import AlertToggle from "@/components/AlertToggle";
import VelocityFallback from "@/components/VelocityFallback";
import VelocityEmpty from "@/components/VelocityEmpty";

const F = "'DM Sans',system-ui,sans-serif";
const M = "#9AA0A6";
const T = "#5F6368";
const B = "#DADCE0";
const TK = "#E8EAED";

// Maps the short slug used by tracker pages (e.g. "isa") to the full slug
// used in user_alert_preferences (e.g. "isa-deep-sea-mining"). Trackers not
// listed here don't get an alert toggle.
const ALERT_SLUG: Record<string, string> = {
  "isa": "isa-deep-sea-mining",
  "bbnj": "bbnj-high-seas-treaty",
  "iuu": "iuu-fishing",
  "30x30": "30x30-mpa",
  "blue-finance": "blue-finance-tnfd",
  "imo-shipping": "imo-shipping-emissions",
  "wto-fisheries": "wto-fisheries-subsidies",
  "offshore-wind": "offshore-wind",
  "cites-marine": "cites-marine",
  "plastics": "plastics-treaty",
};

function col(s: number) { return s < 4 ? "#E24B4A" : s <= 7 ? "#EF9F27" : "#1D9E75"; }

const THRESHOLDS: Record<string, number> = {
  isa: 6.5, bbnj: 7.0, iuu: 6.0, "30x30": 7.5, "blue-finance": 7.0,
  plastics: 5.0, "imo-shipping": 5.0, "wto-fisheries": 5.0, "offshore-wind": 3.5, "cites-marine": 5.0,
};

const INST_TYPES: Record<string, { type: number; name: string; multiplier: number }> = {
  "isa": { type: 2, name: "Mixed architecture", multiplier: 0.75 },
  "bbnj": { type: 3, name: "Consensus-dependent", multiplier: 0.46 },
  "iuu": { type: 2, name: "Mixed architecture", multiplier: 0.85 },
  "30x30": { type: 1, name: "Unilateral", multiplier: 0.85 },
  "blue-finance": { type: 6, name: "Voluntary standard-setting", multiplier: 0.80 },
  "plastics": { type: 3, name: "Consensus-dependent", multiplier: 0.46 },
  "imo-shipping": { type: 2, name: "Mixed architecture", multiplier: 0.75 },
  "wto-fisheries": { type: 5, name: "Ratification milestone", multiplier: 0.75 },
  "offshore-wind": { type: 1, name: "Unilateral", multiplier: 0.85 },
  "cites-marine": { type: 2, name: "Mixed architecture", multiplier: 0.75 },
};

function fdt(iso: string) { const d = new Date(iso); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

interface Latest { score: number; score_volume: number | null; score_recency: number | null; score_signals: number | null; momentum_direction: "accelerating" | "stable" | "decelerating"; interpretation: string }
interface Pt { score: number; score_volume: number | null; score_recency: number | null; score_signals: number | null; calculated_at: string; interpretation?: string }

function momBadge(dir: string) {
  if (dir === "accelerating") return { bg: "#E8F7F2", color: "#1D9E75" };
  if (dir === "decelerating") return { bg: "#FDEAEA", color: "#E24B4A" };
  return { bg: "#FEF3E2", color: "#EF9F27" };
}

function Sub({ label, value, isSignals }: { label: string; value: number | null; isSignals?: boolean }) {
  const has = value != null && value > 0;
  const c = has ? col(value!) : M;
  return (
    <div style={{ padding: "14px 20px" }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M, marginBottom: 4 }}>{label}</div>
      {has ? (
        <>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: c, marginBottom: 6 }}>{value}<span style={{ fontSize: 10, fontWeight: 400, color: M }}>/10</span></div>
          <div style={{ height: 2, background: TK, borderRadius: 99 }}><div style={{ height: 2, width: `${((value ?? 0) / 10) * 100}%`, background: c, borderRadius: 99 }} /></div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 400, color: "#C5C5C5" }}>{"\u2014"}</div>
          {isSignals && <div style={{ fontFamily: F, fontSize: 10, color: M, marginTop: 4 }}>No signals detected</div>}
        </>
      )}
    </div>
  );
}

function Skeleton() {
  const p: React.CSSProperties = { animation: "vsp 1.2s ease-in-out infinite", background: TK, borderRadius: 4 };
  return (
    <div style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, padding: "16px 20px", marginBottom: 24, height: 200 }}>
      <style>{`@keyframes vsp{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      <div style={{ ...p, width: 80, height: 9, marginBottom: 14 }} />
      <div style={{ ...p, width: 100, height: 30, marginBottom: 10 }} />
      <div style={{ ...p, width: "100%", height: 2, marginBottom: 20 }} />
      <div style={{ ...p, width: "100%", height: 60 }} />
    </div>
  );
}

export default function VelocityScore({ slug }: { slug: string }) {
  const [data, setData] = useState<Latest | null>(null);
  const [hist, setHist] = useState<Pt[]>([]);
  const [loading, setLoading] = useState(true);
  const [noScores, setNoScores] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; pt: Pt } | null>(null);
  const [modal, setModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/velocity/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.status === "no_scores_yet") {
          setNoScores(true);
        } else if (d?.latest) {
          setData(d.latest);
          setHist((d.history ?? []).slice().reverse());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (hist.length < 2 || !data || !canvasRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const go = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const C = (window as any).Chart; if (!C) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (chartRef.current) (chartRef.current as any).destroy();
      const pc = hist.map(h => col(h.score));
      const thr = THRESHOLDS[slug] ?? 5.0;
      chartRef.current = new C(canvasRef.current, {
        type: "line",
        data: { labels: hist.map(h => fdt(h.calculated_at)), datasets: [{ data: hist.map(h => h.score), borderColor: col(data.score), borderWidth: 1.5, pointBackgroundColor: pc, pointBorderColor: pc, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false }] },
        options: {
          responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
          plugins: {
            legend: { display: false }, tooltip: { enabled: false },
            annotation: {
              annotations: {
                threshold: {
                  type: "line", yMin: thr, yMax: thr,
                  borderColor: "rgba(239,159,39,0.5)", borderWidth: 1, borderDash: [4, 4],
                  label: { display: true, content: "Alert threshold", position: "end", font: { size: 8 }, color: "#9AA0A6", backgroundColor: "transparent" },
                },
              },
            },
          },
          scales: {
            y: { min: 0, max: 10, ticks: { stepSize: 2, font: { size: 9, family: F }, color: M, padding: 3 }, grid: { color: "rgba(232,234,237,0.9)", drawTicks: false }, border: { display: false } },
            x: { display: false },
          },
          onHover: (_: unknown, els: Array<{ index: number }>) => {
            if (els.length > 0) {
              const i = els[0].index;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m = (chartRef.current as any).getDatasetMeta(0);
              const p = m.data[i];
              const cw = wrapRef.current?.getBoundingClientRect().width ?? 400;
              const ttWidth = 224;
              const left = p.x + 10 + ttWidth > cw ? p.x - ttWidth - 10 : p.x + 10;
              setTip({ x: left, y: Math.max(p.y - 40, 0), pt: hist[i] });
            } else setTip(null);
          },
        },
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Chart) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).chartjsPluginAnnotation) {
        const sa = document.createElement("script");
        sa.src = "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js";
        sa.onload = go;
        document.head.appendChild(sa);
      } else { go(); }
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => {
      const sa = document.createElement("script");
      sa.src = "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js";
      sa.onload = go;
      document.head.appendChild(sa);
    };
    document.head.appendChild(s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { if (chartRef.current) (chartRef.current as any).destroy(); };
  }, [hist, data, slug]);

  if (loading) return <Skeleton />;
  if (noScores) return <VelocityEmpty slug={slug} />;
  if (!data) return <VelocityFallback slug={slug} />;

  const c = col(data.score);
  const mb = momBadge(data.momentum_direction);
  const inst = INST_TYPES[slug];

  return (
    <>
      <div ref={wrapRef} style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>

        {/* Header bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px", borderBottom: `0.5px solid ${B}` }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M }}>PULSE SCORE</div>
            {data.interpretation && (
              <div style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.5, marginTop: 4 }}>{data.interpretation}</div>
            )}
          </div>
          <a
            href="/methodology"
            onClick={(e) => { e.preventDefault(); setModal(true); }}
            style={{ fontFamily: F, fontSize: 10, color: M, border: `0.5px solid ${B}`, borderRadius: 99, padding: "3px 10px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            How this is calculated
          </a>
        </div>

        {/* Score section */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `0.5px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: F, fontSize: 40, fontWeight: 700, color: c, lineHeight: 1 }}>{data.score}</span>
            <span style={{ fontFamily: F, fontSize: 16, color: M }}>/10</span>
            <span
              style={{
                fontFamily: F,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 99,
                background: mb.bg,
                color: mb.color,
              }}
            >
              {data.momentum_direction.charAt(0).toUpperCase() + data.momentum_direction.slice(1)}
            </span>
          </div>
          <div style={{ height: 3, background: TK, borderRadius: 99, marginTop: 10 }}>
            <div style={{ height: 3, width: `${(data.score / 10) * 100}%`, background: c, borderRadius: 99 }} />
          </div>
        </div>

        {/* Sub-scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `0.5px solid ${B}` }}>
          <Sub label="Volume trend" value={data.score_volume} />
          <div style={{ borderLeft: `0.5px solid ${B}`, borderRight: `0.5px solid ${B}` }}>
            <Sub label="Recency" value={data.score_recency} />
          </div>
          <Sub label="Decision signals" value={data.score_signals} isSignals />
        </div>

        {/* Chart */}
        {hist.length >= 2 && (
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M }}>10-WEEK TREND</div>
              <div style={{ fontFamily: F, fontSize: 10, color: M }}>Hover for weekly detail</div>
            </div>
            <div style={{ height: 80, position: "relative" }} onMouseLeave={() => setTip(null)}>
              <canvas ref={canvasRef} />
              {tip && (
                <div style={{ position: "absolute", left: tip.x, top: tip.y, fontFamily: F, width: 220, padding: "8px 10px", background: "#fff", border: `0.5px solid ${B}`, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", zIndex: 10, pointerEvents: "none" }}>
                  <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: M, marginBottom: 4 }}>{fdt(tip.pt.calculated_at)}</div>
                  <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: col(tip.pt.score), marginBottom: 6 }}>{tip.pt.score}<span style={{ fontSize: 10, fontWeight: 400, color: M }}>/10</span></div>
                  {(["Volume", "Recency", "Signals"] as const).map((lbl, i) => {
                    const v = [tip.pt.score_volume, tip.pt.score_recency, tip.pt.score_signals][i];
                    return <div key={lbl} style={{ fontFamily: F, display: "flex", justifyContent: "space-between", fontSize: 10 }}><span style={{ color: M }}>{lbl}</span><span style={{ fontWeight: 500, color: T }}>{v != null ? v : "\u2014"}</span></div>;
                  })}
                  {tip.pt.interpretation && <div style={{ fontFamily: F, fontSize: 10, fontStyle: "italic", color: M, marginTop: 5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{tip.pt.interpretation}</div>}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 10px" }}>
              {hist.map(h => <div key={h.calculated_at} style={{ fontFamily: F, fontSize: 9, color: M, textAlign: "center", flex: 1 }}>{fdt(h.calculated_at)}</div>)}
            </div>
          </div>
        )}

        {/* Institutional type footer */}
        {inst && (
          <div style={{ padding: "10px 20px", borderTop: `0.5px solid ${B}`, background: "#FAFAFA" }}>
            <div style={{ fontFamily: F, fontSize: 11, color: M }}>
              Type {inst.type} {"\u00B7"} {inst.name} {"\u00B7"} Risk multiplier {inst.multiplier}x
            </div>
          </div>
        )}
      </div>

      {/* Band-crossing alert toggle (renders nothing for unauthenticated users) */}
      {ALERT_SLUG[slug] && <AlertToggle trackerSlug={ALERT_SLUG[slug]} />}

      {/* Methodology modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, padding: "24px 28px", maxWidth: 480, width: "90vw", maxHeight: "80vh", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#202124" }}>How the Pulse Score is calculated</span>
              <button onClick={() => setModal(false)} style={{ fontSize: 18, color: M, cursor: "pointer", border: "none", background: "transparent", padding: "0 4px" }}>{"\u00D7"}</button>
            </div>
            <div style={{ borderTop: `0.5px solid ${B}`, marginTop: 12, marginBottom: 16 }} />

            {/* What it is */}
            <p style={{ fontSize: 13, color: T, lineHeight: 1.6, margin: 0 }}>The Pulse Score measures the intensity of observable public regulatory activity in this domain. It is a conditions indicator {"\u2014"} not a prediction. Elevated score means the window for a significant governance event is open. It does not mean an outcome will occur.</p>

            {/* The equation */}
            <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M, marginTop: 16, marginBottom: 8, display: "block" }}>THE EQUATION</span>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#202124", background: "#F8F9FA", borderRadius: 6, padding: "12px 16px", lineHeight: 1.8, whiteSpace: "pre" }}>{"BASE SCORE =\n  (Volume Trend    \u00D7 0.40) +\n  (Recency         \u00D7 0.35) +\n  (Decision Signals \u00D7 0.25)\n\nADJUSTED SCORE =\n  Base Score \u00D7 Institutional Risk Multiplier"}</div>

            {/* Three signals */}
            <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M, marginTop: 16, marginBottom: 10, display: "block" }}>THE THREE SIGNALS</span>
            <div style={{ borderLeft: "2px solid #E8EAED", paddingLeft: 12, marginBottom: 10, fontSize: 12, color: T, lineHeight: 1.5 }}>
              <strong style={{ color: "#202124" }}>Volume Trend (40%)</strong> {"\u2014"} is more being written about this domain than last month? Compares document volume in the past 30 days against the prior 30.
            </div>
            <div style={{ borderLeft: "2px solid #E8EAED", paddingLeft: 12, marginBottom: 10, fontSize: 12, color: T, lineHeight: 1.5 }}>
              <strong style={{ color: "#202124" }}>Recency (35%)</strong> {"\u2014"} how recently was the last significant document published? Uses exponential decay {"\u2014"} a document 14 days old scores 5.0/10, 30 days old scores 2.2/10.
            </div>
            <div style={{ borderLeft: "2px solid #E8EAED", paddingLeft: 12, marginBottom: 10, fontSize: 12, color: T, lineHeight: 1.5 }}>
              <strong style={{ color: "#202124" }}>Decision Signals (25%)</strong> {"\u2014"} does recent language signal a concrete decision is approaching? Scans for: adopt, ratif, enforce, deadline, agreement, binding, implement, mandate, entry into force.
            </div>

            {/* Multiplier note */}
            <div style={{ marginTop: 16, background: "#FEF9EC", borderRadius: 6, padding: "12px 14px", fontSize: 12, color: T, lineHeight: 1.6 }}>
              <strong style={{ color: "#202124" }}>Institutional Risk Multiplier</strong> {"\u2014"} the score is adjusted based on whether the governance body can act unilaterally (multiplier 0.85) or requires full consensus with structural veto players (multiplier 0.46). This is why BBNJ and Plastics scores run structurally lower than equivalent activity in IMO or CITES.
            </div>

            {/* Failure modes */}
            <p style={{ marginTop: 14, fontSize: 12, color: M, lineHeight: 1.5, fontStyle: "italic" }}>The score cannot detect surprise unilateral actions, confidential commercial transactions, or informal negotiating dynamics. Elevated score = conditions present. Not elevated score does not mean nothing will happen.</p>

            {/* Footer */}
            <div style={{ borderTop: `0.5px solid ${B}`, marginTop: 20, marginBottom: 0, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: M }}>Updated every four days {"\u00B7"} Pulse Score</span>
              <a href="/methodology" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: "#1D9E75", textDecoration: "none" }}>Read full methodology {"\u2192"}</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
