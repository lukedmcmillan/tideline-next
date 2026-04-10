"use client";

interface SparklinePoint {
  score: number;
  calculated_at: string;
}

function getColor(score: number): string {
  if (score < 4) return "#E57368";
  if (score <= 7) return "#E5A847";
  return "#1D9E75";
}

export default function VelocitySparkline({ data }: { data: SparklinePoint[] }) {
  if (data.length < 2) return null;

  // Reverse so oldest is first (left), newest is last (right)
  const points = [...data].reverse();
  const color = getColor(points[points.length - 1].score);

  const w = 200;
  const h = 40;
  const pad = 4;

  const xStep = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: pad + i * xStep,
    y: pad + ((10 - p.score) / 10) * (h - pad * 2),
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "40px" }} preserveAspectRatio="none">
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r="3" fill={color} />
    </svg>
  );
}
