"use client";

import type { HeroSignalData } from "@/app/lib/types/dashboard";

const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const TEAL_BRIGHT = "#27C893";
const TEAL_GLOW = "rgba(29,158,117,0.18)";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";

type D = NonNullable<HeroSignalData["scanning"]>;

export default function HeroSignalScanning({ d }: { d: D }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <style>{`
        @keyframes scanPulse {
          0% { box-shadow: 0 0 0 0 ${TEAL_GLOW}; }
          70% { box-shadow: 0 0 0 16px rgba(29,158,117,0); }
          100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
        }
      `}</style>
      <div style={{
        width: 12, height: 12, borderRadius: "50%",
        background: TEAL_BRIGHT,
        animation: "scanPulse 2s infinite",
        marginBottom: 20,
      }} />
      <div style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em",
        color: TEAL_BRIGHT, textTransform: "uppercase", marginBottom: 12,
      }}>
        Scanning
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: TEXT, marginBottom: 8 }}>
        No priority signal right now
      </div>
      <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.5 }}>
        {d.processed_today > 0
          ? `${d.processed_today} stories processed today, ${d.flagged_today} above threshold so far.`
          : "Tideline is scanning. Check back shortly."}
      </div>
    </div>
  );
}
