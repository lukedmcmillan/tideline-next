"use client";

import type { HeroSignalData } from "@/app/lib/types/dashboard";

const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const BORDER_HI = "#24375A";

type D = NonNullable<HeroSignalData["band_crossing"]>;

const BAND_COLORS: Record<string, string> = {
  HIGH: "#E24B4A", ELEVATED: AMBER, WATCH: TEXT_MUTED, LOW: TEXT_DIM,
};

export default function HeroSignalBandCrossing({ d }: { d: D }) {
  const color = BAND_COLORS[d.band_to] || TEAL_BRIGHT;
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
        color: color, textTransform: "uppercase", marginBottom: 10,
      }}>
        Band crossing detected
      </div>

      <h2 style={{
        fontFamily: DISPLAY, fontWeight: 800, fontSize: 28,
        lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20, color: TEXT,
      }}>
        {d.name} moved from <span style={{ color }}>{d.band_from}</span> to <span style={{ color }}>{d.band_to}</span>
      </h2>

      <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 800, color, marginBottom: 8 }}>
        {d.score.toFixed(1)}<span style={{ fontSize: 16, color: TEXT_MUTED }}>/10</span>
      </div>

      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>
        Direction: {direction}
      </div>

      {d.interpretation && (
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.55, marginBottom: 20 }}>
          {d.interpretation}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button className="mob-tap" style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 600,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: TEAL, color: "#0A1628",
        }}>View tracker</button>
        <button className="mob-tap" style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, cursor: "pointer",
          background: "transparent", color: TEXT_MUTED, border: `1px solid ${BORDER_HI}`,
        }}>View sources</button>
        <button className="mob-tap" style={{
          fontFamily: "'DM Sans'", fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: "transparent", color: TEXT_DIM, marginLeft: "auto",
        }}>Dismiss</button>
      </div>
    </div>
  );
}
