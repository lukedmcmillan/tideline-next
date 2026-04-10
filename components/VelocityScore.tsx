"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VelocityData {
  score: number;
  score_volume: number | null;
  score_recency: number | null;
  score_signals: number | null;
  story_count_30d: number;
  momentum_direction: "accelerating" | "stable" | "decelerating";
  interpretation: string;
  calculated_at: string;
}

interface HistoryPoint {
  score: number;
  score_volume: number | null;
  score_recency: number | null;
  score_signals: number | null;
  calculated_at: string;
  interpretation?: string;
}

const F = "'DM Sans', system-ui, sans-serif";
const MONO = "'DM Mono', monospace";
const MUTED = "#9AA0A6";
const TEXT = "#5F6368";
const BORDER = "#DADCE0";
const TRACK = "#E8EAED";

function color(score: number): string {
  if (score < 4) return "#E24B4A";
  if (score <= 7) return "#EF9F27";
  return "#1D9E75";
}

function arrowChar(m: string): string {
  if (m === "accelerating") return "\u25B2";
  if (m === "decelerating") return "\u25BC";
  return "\u25B8";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SubScore({ label, value }: { label: string; value: number | null }) {
  const hasValue = value !== null && value !== undefined;
  const c = hasValue ? color(value) : MUTED;
  return (
    <div style={{ padding: "12px 20px" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: MUTED, marginBottom: 4 }}>{label}</div>
      {hasValue ? (
        <>
          <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: c, marginBottom: 6 }}>
            {value}<span style={{ fontSize: 10, fontWeight: 400, color: MUTED }}>/10</span>
          </div>
          <div style={{ height: 2, background: TRACK, borderRadius: 1 }}>
            <div style={{ height: 2, width: `${(value / 10) * 100}%`, background: c, borderRadius: 1 }} />
          </div>
        </>
      ) : (
        <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: MUTED }}>{"\u2014"}</div>
      )}
    </div>
  );
}

function Skeleton() {
  const pulse: React.CSSProperties = { animation: "vsPulse 1.2s ease-in-out infinite", background: TRACK, borderRadius: 4 };
  return (
    <div style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
      <style>{`@keyframes vsPulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
      <div style={{ ...pulse, width: 120, height: 9, marginBottom: 16 }} />
      <div style={{ ...pulse, width: 80, height: 32, marginBottom: 12 }} />
      <div style={{ ...pulse, width: "100%", height: 3, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: "12px 20px" }}>
            <div style={{ ...pulse, width: 60, height: 9, marginBottom: 8 }} />
            <div style={{ ...pulse, width: 40, height: 14 }} />
          </div>
        ))}
      </div>
      <div style={{ ...pulse, width: "100%", height: 88, marginTop: 14 }} />
    </div>
  );
}

export default function VelocityScore({ slug }: { slug: string }) {
  const [data, setData] = useState<VelocityData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: HistoryPoint } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    fetch(`/api/velocity/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.latest) {
          setData(d.latest);
          setHistory((d.history ?? []).slice().reverse());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const initChart = useCallback(() => {
    if (!canvasRef.current || history.length < 2 || !data) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chartRef.current as any).destroy();
    }

    const lineColor = color(data.score);
    const pointColors = history.map((h) => color(h.score));

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: history.map((h) => fmtDate(h.calculated_at)),
        datasets: [{
          data: history.map((h) => h.score),
          borderColor: lineColor,
          borderWidth: 1.5,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { stepSize: 2, font: { size: 9, family: MONO }, color: MUTED },
            grid: { color: "rgba(232,234,237,0.8)", drawTicks: false },
            border: { display: false },
          },
          x: {
            display: false,
          },
        },
        onHover: (_: unknown, elements: Array<{ index: number }>) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const meta = (chartRef.current as any).getDatasetMeta(0);
            const pt = meta.data[idx];
            setTooltip({ x: pt.x, y: pt.y, point: history[idx] });
          } else {
            setTooltip(null);
          }
        },
      },
    });
  }, [history, data]);

  useEffect(() => {
    if (history.length < 2 || !data) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Chart) {
      initChart();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = initChart;
    document.head.appendChild(script);
    return () => {
      if (chartRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chartRef.current as any).destroy();
      }
    };
  }, [history, data, initChart]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const c = color(data.score);
  const pct = (data.score / 10) * 100;

  return (
    <div style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${BORDER}`, borderRadius: 8, marginBottom: 24 }}>
      {/* 1. Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: MUTED }}>Regulatory Velocity</div>
        <button onClick={() => {}} style={{ fontFamily: F, fontSize: 10, color: TEXT, background: "none", border: `0.5px solid ${BORDER}`, borderRadius: 99, padding: "3px 10px", cursor: "pointer" }}>
          {"\u24D8"} How this is calculated
        </button>
      </div>

      {/* 2. Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "8px 20px 6px" }}>
        <span style={{ fontSize: 36, fontWeight: 600, color: c, lineHeight: 1 }}>{data.score}</span>
        <span style={{ fontSize: 14, color: MUTED }}>/10</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: c, marginLeft: 8 }}>
          {arrowChar(data.momentum_direction)} {data.momentum_direction.charAt(0).toUpperCase() + data.momentum_direction.slice(1)}
        </span>
      </div>

      {/* 3. Progress */}
      <div style={{ margin: "0 20px 14px", height: 3, background: TRACK, borderRadius: 2 }}>
        <div style={{ height: 3, width: `${pct}%`, background: c, borderRadius: 2 }} />
      </div>

      {/* 4. Sub-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `0.5px solid ${BORDER}`, borderBottom: `0.5px solid ${BORDER}` }}>
        <SubScore label="Volume trend" value={data.score_volume} />
        <div style={{ borderLeft: `0.5px solid ${BORDER}`, borderRight: `0.5px solid ${BORDER}` }}>
          <SubScore label="Recency" value={data.score_recency} />
        </div>
        <SubScore label="Decision signals" value={data.score_signals} />
      </div>

      {/* 5. Chart */}
      {history.length >= 2 && (
        <div style={{ padding: "14px 20px 0", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: MUTED }}>10-week trend</div>
            <div style={{ fontSize: 10, color: MUTED }}>Hover for weekly detail</div>
          </div>
          <div style={{ height: 88, position: "relative" }} onMouseLeave={() => setTooltip(null)}>
            <canvas ref={canvasRef} />
            {tooltip && (
              <div style={{
                position: "absolute", left: tooltip.x + 12, top: Math.max(0, tooltip.y - 60),
                background: "#fff", border: `0.5px solid ${BORDER}`, borderRadius: 6,
                padding: "10px 14px", zIndex: 10, pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", minWidth: 140,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: MUTED, marginBottom: 4 }}>{fmtDate(tooltip.point.calculated_at)}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: color(tooltip.point.score), marginBottom: 6 }}>{tooltip.point.score}<span style={{ fontSize: 11, color: MUTED }}>/10</span></div>
                <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 6, fontSize: 11, color: TEXT, lineHeight: 1.8 }}>
                  <div>Volume: {tooltip.point.score_volume ?? "\u2014"}/10</div>
                  <div>Recency: {tooltip.point.score_recency ?? "\u2014"}/10</div>
                  <div>Signals: {tooltip.point.score_signals ?? "\u2014"}/10</div>
                </div>
                {tooltip.point.interpretation && (
                  <div style={{ fontSize: 10, color: MUTED, fontStyle: "italic", marginTop: 4 }}>{tooltip.point.interpretation}</div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 10px" }}>
            {history.map((h) => (
              <div key={h.calculated_at} style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>{fmtDate(h.calculated_at)}</div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Interpretation */}
      {data.interpretation && (
        <div style={{ padding: "12px 20px", borderTop: `0.5px solid ${BORDER}`, fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
          {data.interpretation}
        </div>
      )}
    </div>
  );
}
