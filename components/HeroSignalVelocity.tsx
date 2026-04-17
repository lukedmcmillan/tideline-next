"use client";

import type { HeroSignalData } from "@/app/lib/types/dashboard";
import Sparkline from "@/components/Sparkline";

const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const BORDER_HI = "#24375A";

type D = NonNullable<HeroSignalData["top_velocity"]>;

export default function HeroSignalVelocity({ d }: { d: D }) {
  const direction = d.direction.charAt(0).toUpperCase() + d.direction.slice(1);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: TEXT_MUTED, textTransform: "uppercase" }}>
          Signal of the day
        </span>
        <span style={{
          padding: "3px 8px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: 4,
          color: TEXT_MUTED, border: `1px solid ${BORDER_HI}`,
        }}>
          {d.name}
        </span>
      </div>

      <div style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em",
        color: TEAL_BRIGHT, textTransform: "uppercase", marginBottom: 10,
      }}>
        Highest velocity tracker
      </div>

      <h2 style={{
        fontFamily: DISPLAY, fontWeight: 800, fontSize: 28,
        lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20, color: TEXT,
      }}>
        {d.name}
      </h2>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, lineHeight: 1, color: TEAL_BRIGHT }}>
          {d.score.toFixed(1)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 16, color: TEXT_MUTED }}>/10</span>
      </div>

      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
        Direction: {direction}
      </div>

      {d.history.length >= 2 && (
        <div style={{ height: 60, marginBottom: 20 }}>
          <Sparkline history={d.history} score={d.score} withFill />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 600,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: TEAL, color: "#0A1628",
        }}>View tracker</button>
        <button style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, cursor: "pointer",
          background: "transparent", color: TEXT_MUTED, border: `1px solid ${BORDER_HI}`,
        }}>View sources</button>
        <button style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: "transparent", color: TEXT_DIM, marginLeft: "auto",
        }}>Dismiss</button>
      </div>
    </div>
  );
}
