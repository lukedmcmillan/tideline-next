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
 * Renders a 30-day score history as a polyline with optional area fill.
 * viewBox 100x26, stroke colour matches current score band.
 */
export default function Sparkline({
  history,
  score,
  withFill,
}: {
  history: number[];
  score: number;
  withFill?: boolean;
}) {
  if (!history || history.length < 2) return null;

  const color = strokeColor(score);
  const min = 0;
  const max = 10;
  const w = 100;
  const h = 26;
  const pad = 2;
  const usableH = h - pad * 2;
  const step = w / (history.length - 1);

  const points = history.map((val, i) => {
    const x = Math.round(i * step * 100) / 100;
    const y = Math.round((pad + usableH - ((val - min) / (max - min)) * usableH) * 100) / 100;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPath = `M${points[0]} ${points.slice(1).map(p => `L${p}`).join(" ")} L${w},${h} L0,${h} Z`;
  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width="100%" height="26" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {withFill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
