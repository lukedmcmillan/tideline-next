"use client";

import { useState, useEffect } from "react";
import VelocitySparkline from "@/components/VelocitySparkline";

interface VelocityData {
  score: number;
  story_count_30d: number;
  momentum_direction: "accelerating" | "stable" | "decelerating";
  interpretation: string;
  calculated_at: string;
}

interface HistoryPoint {
  score: number;
  calculated_at: string;
}

function getColor(score: number): string {
  if (score < 4) return "#E57368";
  if (score <= 7) return "#E5A847";
  return "#1D9E75";
}

function getArrow(momentum: string): string {
  if (momentum === "accelerating") return "\u25B2";
  if (momentum === "decelerating") return "\u25BC";
  return "\u25B8";
}

export default function VelocityScore({ slug }: { slug: string }) {
  const [data, setData] = useState<VelocityData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    fetch(`/api/velocity/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.latest) {
          setData(d.latest);
          setHistory(d.history ?? []);
        }
      })
      .catch(() => {});
  }, [slug]);

  if (!data) return null;

  const color = getColor(data.score);
  const arrow = getArrow(data.momentum_direction);
  const pct = (data.score / 10) * 100;

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "16px 20px",
      marginBottom: "24px",
      background: "#fff",
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#64748b",
        marginBottom: "8px",
      }}>
        Regulatory Velocity
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "24px",
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}>
          {data.score}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "14px",
          color: "#64748b",
        }}>
          /10
        </span>
        <span style={{ color, fontSize: "14px", fontWeight: 600 }}>
          {arrow} {data.momentum_direction.charAt(0).toUpperCase() + data.momentum_direction.slice(1)}
        </span>
      </div>
      <div style={{
        height: "4px",
        background: "#e2e8f0",
        borderRadius: "2px",
        marginBottom: "10px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "2px",
          transition: "width 0.5s ease",
        }} />
      </div>
      {history.length >= 2 && (
        <>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#64748b",
            marginTop: "12px",
            marginBottom: "4px",
          }}>
            12-week trend
          </div>
          <VelocitySparkline data={history} />
          <div style={{
            display: "flex",
            gap: "16px",
            marginTop: "4px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "11px",
            color: "#64748b",
          }}>
            <span>4 weeks ago: {history[3]?.score?.toFixed(1) ?? "\u2014"}</span>
            <span>12 weeks ago: {history[11]?.score?.toFixed(1) ?? "\u2014"}</span>
          </div>
        </>
      )}
      {data.interpretation && (
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          color: "#64748b",
          lineHeight: 1.5,
          marginTop: "10px",
        }}>
          {data.interpretation}
        </div>
      )}
    </div>
  );
}
