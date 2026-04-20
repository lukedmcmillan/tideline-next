"use client";

import { useEffect, useState } from "react";
import type { HeroSignalData } from "@/app/lib/types/dashboard";
import HeroSignalBandCrossing from "@/components/HeroSignalBandCrossing";
import HeroSignalGovernance from "@/components/HeroSignalGovernance";
import HeroSignalVelocity from "@/components/HeroSignalVelocity";

const BG2 = "#0D1E35";
const BG3 = "#122845";
const BORDER = "#1A2A44";
const RED_SOFT = "rgba(226,75,74,0.15)";

export default function HeroSignal() {
  const [data, setData] = useState<HeroSignalData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/hero-signal")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{
        gridColumn: "1 / 2",
        gridRow: "1 / 3",
        background: `linear-gradient(160deg, ${BG2}, ${BG3} 120%)`,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 28,
        minHeight: 460,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ color: "#5B6F8C", fontSize: 13 }}>Loading signal...</span>
      </div>
    );
  }

  const content = (() => {
    switch (data.type) {
      case "band_crossing": return data.band_crossing ? <HeroSignalBandCrossing d={data.band_crossing} /> : null;
      case "governance_event": return data.governance_event ? <HeroSignalGovernance d={data.governance_event} /> : null;
      case "top_velocity": return data.top_velocity ? <HeroSignalVelocity d={data.top_velocity} /> : null;
      default: return null;
    }
  })();

  return (
    <div style={{
      gridColumn: "1 / 2",
      gridRow: "1 / 3",
      background: `linear-gradient(160deg, ${BG2}, ${BG3} 120%)`,
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: 28,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      minHeight: 460,
    }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "-50%", right: "-30%",
        width: 400, height: 400,
        background: `radial-gradient(circle, ${RED_SOFT}, transparent 65%)`,
        pointerEvents: "none",
      }} />
      {content}
    </div>
  );
}
