"use client";

import { useEffect, useRef, useState } from "react";

const F = "'DM Sans',system-ui,sans-serif";
const M = "#9AA0A6";
const T = "#5F6368";
const B = "#DADCE0";
const TK = "#E8EAED";

function col(s: number) { return s < 4 ? "#E24B4A" : s <= 7 ? "#EF9F27" : "#1D9E75"; }
function fdt(iso: string) { const d = new Date(iso); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

interface Latest { score: number; score_volume: number | null; score_recency: number | null; score_signals: number | null; momentum_direction: "accelerating" | "stable" | "decelerating"; interpretation: string }
interface Pt { score: number; score_volume: number | null; score_recency: number | null; score_signals: number | null; calculated_at: string; interpretation?: string }

function Arrow({ dir, c }: { dir: string; c: string }) {
  if (dir === "accelerating") return <svg width="8" height="7" viewBox="0 0 8 7" style={{ marginRight: 3 }}><polygon points="4,0 8,7 0,7" fill={c} /></svg>;
  if (dir === "decelerating") return <svg width="8" height="7" viewBox="0 0 8 7" style={{ marginRight: 3 }}><polygon points="4,7 8,0 0,0" fill={c} /></svg>;
  return <svg width="7" height="8" viewBox="0 0 7 8" style={{ marginRight: 3 }}><polygon points="0,0 7,4 0,8" fill={c} /></svg>;
}

function Sub({ label, value }: { label: string; value: number | null }) {
  const has = value != null;
  const c = has ? col(value) : M;
  return (
    <div style={{ padding: "10px 20px" }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M, marginBottom: 4 }}>{label}</div>
      {has ? (
        <>
          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: c, marginBottom: 5 }}>{value}<span style={{ fontSize: 10, fontWeight: 400, color: M }}>/10</span></div>
          <div style={{ height: 2, background: TK, borderRadius: 1 }}><div style={{ height: 2, width: `${(value / 10) * 100}%`, background: c, borderRadius: 1 }} /></div>
        </>
      ) : (
        <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: M }}>{"\u2014"}</div>
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
  const [tip, setTip] = useState<{ x: number; y: number; pt: Pt } | null>(null);
  const [modal, setModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/velocity/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.latest) { setData(d.latest); setHist((d.history ?? []).slice().reverse()); } setLoading(false); })
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
      chartRef.current = new C(canvasRef.current, {
        type: "line",
        data: { labels: hist.map(h => fdt(h.calculated_at)), datasets: [{ data: hist.map(h => h.score), borderColor: col(data.score), borderWidth: 1.5, pointBackgroundColor: pc, pointBorderColor: pc, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false }] },
        options: {
          responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
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
              setTip({ x: Math.min(p.x + 10, cw - 224), y: Math.max(p.y - 40, 0), pt: hist[i] });
            } else setTip(null);
          },
        },
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Chart) { go(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = go;
    document.head.appendChild(s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { if (chartRef.current) (chartRef.current as any).destroy(); };
  }, [hist, data]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const c = col(data.score);

  return (
    <>
      <div ref={wrapRef} style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>

        {/* 1. Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M }}>Pulse</div>
          <button onClick={() => setModal(true)} style={{ fontFamily: F, fontSize: 10, color: M, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 99, padding: "2px 9px", cursor: "pointer" }}>{"\u24D8"} How this is calculated</button>
        </div>

        {/* 2. Score */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, padding: "6px 20px", marginBottom: 5 }}>
          <span style={{ fontFamily: F, fontSize: 34, fontWeight: 600, color: c, lineHeight: 1 }}>{data.score}</span>
          <span style={{ fontFamily: F, fontSize: 13, color: M, marginRight: 8 }}>/10</span>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: c, display: "inline-flex", alignItems: "center" }}>
            <Arrow dir={data.momentum_direction} c={c} />
            {data.momentum_direction.charAt(0).toUpperCase() + data.momentum_direction.slice(1)}
          </span>
        </div>

        {/* 3. Progress */}
        <div style={{ margin: "0 20px 12px", height: 2, background: TK, borderRadius: 1 }}>
          <div style={{ height: 2, width: `${(data.score / 10) * 100}%`, background: c, borderRadius: 1 }} />
        </div>

        {/* 4. Sub-scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `0.5px solid ${B}`, borderBottom: `0.5px solid ${B}` }}>
          <Sub label="Volume trend" value={data.score_volume} />
          <div style={{ borderLeft: `0.5px solid ${B}`, borderRight: `0.5px solid ${B}` }}><Sub label="Recency" value={data.score_recency} /></div>
          <Sub label="Decision signals" value={data.score_signals} />
        </div>

        {/* 5. Chart */}
        {hist.length >= 2 && (
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M }}>10-week trend</div>
              <div style={{ fontFamily: F, fontSize: 10, color: M }}>Hover for weekly detail</div>
            </div>
            <div style={{ height: 90, position: "relative" }} onMouseLeave={() => setTip(null)}>
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

        {/* 6. Interpretation */}
        {data.interpretation && (
          <div style={{ fontFamily: F, padding: "10px 20px", borderTop: `0.5px solid ${B}`, fontSize: 12, color: T, lineHeight: 1.6 }}>{data.interpretation}</div>
        )}
      </div>

      {/* 7. Methodology modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ fontFamily: F, background: "#fff", borderRadius: 8, padding: 24, maxWidth: 480, width: "90vw", position: "relative", zIndex: 51, maxHeight: "80vh", overflowY: "auto" }}>
            <button onClick={() => setModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 14, color: M, cursor: "pointer" }}>{"\u2715"}</button>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginBottom: 12 }}>Pulse Score {"\u2014"} Methodology</div>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "0 0 0" }}>The Pulse score measures how much is happening in this domain right now {"\u2014"} the volume, recency and weight of verified intelligence indexed by Tideline this week.</p>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginTop: 16 }}>The equation</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#202124", background: "#F8F9FA", padding: "8px 12px", borderRadius: 4, margin: "6px 0" }}>Score = (Volume trend {"\u00D7"} 0.4) + (Recency {"\u00D7"} 0.35) + (Decision signals {"\u00D7"} 0.25)</div>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginTop: 14 }}>Volume trend (40%)</div>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "4px 0 0" }}>Compares verified news, reports and regulatory developments indexed in the last 30 days against the prior 30-day period. Rising volume indicates increased institutional attention {"\u2014"} a leading indicator of regulatory movement.</p>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginTop: 14 }}>Recency (35%)</div>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "4px 0 0" }}>Measures days elapsed since the most recent indexed development, using exponential decay. Momentum that goes quiet scores lower regardless of historical activity.</p>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginTop: 14 }}>Decision signals (25%)</div>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "4px 0 0" }}>Identifies intelligence containing language associated with concrete regulatory action {"\u2014"} ratification, adoption, enforcement, sanctions, signed agreements, implementation, deadlines {"\u2014"} then classifies each as positive (+2) or negative ({"\u2212"}1) using AI.</p>
            <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M, marginTop: 14 }}>What it means</div>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "4px 0 0" }}><strong>Above 7, accelerating</strong> {"\u2014"} high activity. Decisions are being made. Act now.</p>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "2px 0 0" }}><strong>4 to 7, stable</strong> {"\u2014"} moderate activity. Monitor weekly.</p>
            <p style={{ fontFamily: F, fontSize: 12, color: T, lineHeight: 1.6, margin: "2px 0 0" }}><strong>Below 4, decelerating</strong> {"\u2014"} quiet period. Pressure is off for now.</p>
            <div style={{ fontFamily: F, fontSize: 10, color: M, marginTop: 16, paddingTop: 12, borderTop: `0.5px solid ${B}` }}>No editorial judgement applied. All underlying intelligence is accessible on the platform. Recalculated every Monday.</div>
          </div>
        </div>
      )}
    </>
  );
}
