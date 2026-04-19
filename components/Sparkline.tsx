"use client";

const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const MUTED = "#8BA0BC";

function strokeColor(score: number): string {
  if (score >= 7) return TEAL_BRIGHT;
  if (score >= 4) return AMBER;
  if (score > 0) return RED;
  return MUTED;
}

/**
 * Inline SVG sparkline. No chart library.
 * Autoscales Y to data range with padding.
 * Two sizes: compact (default, 26px) and expanded (80px, for trackers page).
 */
export default function Sparkline({
  history,
  score,
  withFill,
  strokeWidth = 1.5,
  fillOpacity,
  size = "compact",
}: {
  history: number[];
  score: number;
  withFill?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  size?: "compact" | "expanded";
}) {
  if (!history || history.length < 2) return null;

  const color = strokeColor(score);
  const expanded = size === "expanded";
  const w = expanded ? 200 : 100;
  const h = expanded ? 80 : 26;
  const pad = expanded ? 6 : 2;
  const usableH = h - pad * 2;
  const step = w / (history.length - 1);

  // Autoscale Y to data range with 15% padding
  let dataMin = Math.min(...history);
  let dataMax = Math.max(...history);
  const range = dataMax - dataMin;
  if (range < 0.1) {
    dataMin = dataMin - 0.5;
    dataMax = dataMax + 0.5;
  } else {
    dataMin = dataMin - range * 0.15;
    dataMax = dataMax + range * 0.15;
  }
  const scaledRange = dataMax - dataMin;

  function toY(val: number): number {
    const norm = (val - dataMin) / scaledRange;
    const y = pad + usableH - norm * usableH;
    return Math.round(Math.max(0, Math.min(h, y)) * 100) / 100;
  }

  const coords = history.map((val, i) => ({
    x: Math.round(i * step * 100) / 100,
    y: toY(val),
  }));

  const polyline = coords.map(p => `${p.x},${p.y}`).join(" ");
  const fillPath = `M${coords[0].x},${coords[0].y} ${coords.slice(1).map(p => `L${p.x},${p.y}`).join(" ")} L${w},${h} L0,${h} Z`;
  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  // Last point for endpoint dot
  const last = coords[coords.length - 1];
  const dotR = expanded ? 3.5 : 0;

  // Threshold lines (expanded only) — at score 4.0 and 7.0
  const thresholds = expanded ? [4.0, 7.0] : [];

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* gradient fill under line */}
      {withFill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={fillOpacity ?? 0.35} />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${gradientId})`} />
        </>
      )}

      {/* threshold reference lines */}
      {thresholds.map(tv => {
        const ty = toY(tv);
        if (ty < pad || ty > h - pad) return null;
        return (
          <line
            key={tv}
            x1={0} y1={ty} x2={w} y2={ty}
            stroke="rgba(139,160,188,0.15)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        );
      })}

      {/* data line */}
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* endpoint dot (expanded only) */}
      {expanded && (
        <>
          <circle cx={last.x} cy={last.y} r={dotR + 2} fill={color} fillOpacity={0.3} />
          <circle cx={last.x} cy={last.y} r={dotR} fill={color} />
        </>
      )}
    </svg>
  );
}
