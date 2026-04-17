"use client";

import { useEffect, useState } from "react";
import type { TickerItem } from "@/app/lib/types/dashboard";

const BG2 = "#0D1E35";
const BG3 = "#122845";
const BORDER = "#1A2A44";
const BORDER_HI = "#24375A";
const TEAL_BRIGHT = "#27C893";
const TEAL_GLOW = "rgba(29,158,117,0.18)";
const RED = "#E24B4A";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const MONO = "'DM Mono', ui-monospace, monospace";

function deltaClass(d: number): { char: string; color: string } {
  if (d > 0) return { char: "\u25B2", color: TEAL_BRIGHT };
  if (d < 0) return { char: "\u25BC", color: RED };
  return { char: "\u2192", color: TEXT_DIM };
}

export default function TickerStrip() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch("/api/trackers/ticker")
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  // Duplicate items for seamless scroll loop
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
        }}>
          {doubled.map((item, i) => {
            const d = deltaClass(item.delta);
            return (
              <span key={`${item.slug}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: MONO,
                  fontSize: 11.5,
                }}>
                  <span style={{ color: TEXT_MUTED }}>{item.name}</span>
                  <span style={{ color: TEXT, fontWeight: 500 }}>{item.score.toFixed(1)}</span>
                  <span style={{ color: d.color }}>
                    {d.char} {Math.abs(item.delta).toFixed(1)}
                  </span>
                </span>
                {i < doubled.length - 1 && (
                  <span style={{ color: BORDER_HI, marginLeft: 0 }}>&middot;</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
