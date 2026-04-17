// TEMPORARILY DISABLED in page.tsx. Re-enable by re-adding
// <TickerStrip /> to the dashboard. Route at
// /api/dashboard/ticker remains live. See commit for removal context.
"use client";

import { useEffect, useState } from "react";
import type { MixedTickerItem } from "@/app/lib/types/dashboard";

const BG2 = "#0D1E35";
const BG3 = "#122845";
const BORDER = "#1A2A44";
const BORDER_HI = "#24375A";
const TEAL_BRIGHT = "#27C893";
const TEAL_GLOW = "rgba(29,158,117,0.18)";
const RED = "#E24B4A";
const AMBER = "#EF9F27";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const MONO = "'DM Mono', ui-monospace, monospace";

// Micro-pill matching .hero-chip from mockup
const PILL_BASE: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "2px 7px",
  borderRadius: 4,
  fontWeight: 500,
  lineHeight: 1,
  flexShrink: 0,
};

function renderItem(item: MixedTickerItem) {
  switch (item.type) {
    case "headline":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...PILL_BASE, color: TEXT_MUTED, border: `1px solid ${TEXT_MUTED}` }}>NEWS</span>
          <span style={{ color: TEXT }}>{item.title}</span>
          <span style={{ color: TEXT_DIM }}>{item.source_name}</span>
          <span style={{ color: TEXT_DIM }}>{item.time_ago}</span>
        </span>
      );

    case "score_delta":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: TEXT_MUTED }}>{item.name}</span>
          <span style={{ color: TEXT, fontWeight: 500 }}>{item.score.toFixed(1)}</span>
          <span style={{ color: item.delta > 0 ? TEAL_BRIGHT : RED }}>
            {item.delta > 0 ? "\u25B2" : "\u25BC"} {Math.abs(item.delta).toFixed(1)}
          </span>
        </span>
      );

    case "countdown":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...PILL_BASE, color: AMBER, border: `1px solid ${AMBER}` }}>EVENT</span>
          <span style={{ color: TEXT }}>{item.event_name}</span>
          <span style={{ color: AMBER }}>in {item.days} days</span>
        </span>
      );

    case "new_divergence":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...PILL_BASE, color: "#fff", background: RED, border: `1px solid ${RED}` }}>CONFLICT</span>
          <span style={{ color: TEXT }}>{item.source_a} vs {item.source_b}</span>
          <span style={{ color: RED }}>{item.score.toFixed(1)}/10</span>
        </span>
      );

    case "doc_ingestion":
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: TEAL_BRIGHT, fontWeight: 500 }}>+{item.count} documents</span>
          <span style={{ color: TEXT_DIM }}>{item.source}</span>
          <span style={{ color: TEXT_DIM }}>{item.time_ago}</span>
        </span>
      );

    default:
      return null;
  }
}

export default function TickerStrip() {
  const [items, setItems] = useState<MixedTickerItem[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/ticker")
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerPulse {
          0% { box-shadow: 0 0 0 0 ${TEAL_GLOW}; }
          70% { box-shadow: 0 0 0 8px rgba(29,158,117,0); }
          100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
      <div style={{
        background: BG2,
        borderBottom: `1px solid ${BORDER}`,
        height: 36,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* LIVE label */}
        <div style={{
          background: BG3,
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: TEXT_MUTED,
          textTransform: "uppercase",
          borderRight: `1px solid ${BORDER}`,
          flexShrink: 0,
          gap: 8,
        }}>
          <span style={{
            width: 6, height: 6,
            background: TEAL_BRIGHT,
            borderRadius: "50%",
            display: "inline-block",
            animation: "tickerPulse 2s infinite",
          }} />
          LIVE
        </div>

        {/* Scrolling track */}
        <div style={{
          display: "flex",
          gap: 28,
          paddingLeft: 20,
          animation: "tickerScroll 60s linear infinite",
          whiteSpace: "nowrap",
          fontFamily: MONO,
          fontSize: 11.5,
        }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {renderItem(item)}
              {i < doubled.length - 1 && (
                <span style={{ color: BORDER_HI }}>&middot;</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
