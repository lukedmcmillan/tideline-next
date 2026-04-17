"use client";

import { useEffect, useState } from "react";
import type { OvernightData } from "@/app/lib/types/dashboard";

const TEAL_BRIGHT = "#27C893";
const TEAL = "#1D9E75";
const BORDER = "#1A2A44";
const TEXT = "#E8EDF4";
const TEXT_DIM = "#5B6F8C";
const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

function todayKey(): string {
  const d = new Date();
  return `tideline_overnight_dismissed_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OvernightReveal() {
  const [data, setData] = useState<OvernightData | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked

  useEffect(() => {
    const key = todayKey();
    if (localStorage.getItem(key)) {
      setDismissed(true);
      return;
    }
    setDismissed(false);
    fetch("/api/dashboard/overnight")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(todayKey(), new Date().toISOString().split("T")[0]);
    setDismissed(true);
  }

  if (dismissed || !data) return null;

  return (
    <>
      <style>{`
        @keyframes overnightSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
      <div style={{
        margin: "20px 32px 0",
        padding: "18px 22px",
        background: "linear-gradient(135deg, rgba(29,158,117,0.08), rgba(29,158,117,0.02) 60%, transparent)",
        border: `1px solid rgba(29,158,117,0.25)`,
        borderRadius: 12,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        animation: "overnightSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 240, height: "100%",
          background: "radial-gradient(circle at right, rgba(29,158,117,0.15), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Moon icon */}
        <div style={{
          width: 34, height: 34,
          background: "rgba(29,158,117,0.15)",
          border: "1px solid rgba(29,158,117,0.3)",
          borderRadius: 8,
          display: "grid", placeItems: "center",
          color: TEAL_BRIGHT,
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </div>

        {/* Body */}
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            color: TEAL_BRIGHT,
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            While you were away · {data.hours} hrs
          </div>
          <div style={{
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.55,
            color: TEXT,
          }}>
            Tideline processed{" "}
            <b style={{ color: TEAL_BRIGHT, fontWeight: 600 }}>
              <span style={{ fontFamily: MONO, fontWeight: 500 }}>{data.doc_count} documents</span>
            </b>{" "}
            from {data.source_count} sources overnight.{" "}
            <b style={{ color: TEAL_BRIGHT, fontWeight: 600 }}>{data.top_mover_line}</b>.{" "}
            <b style={{ color: TEAL_BRIGHT, fontWeight: 600 }}>
              <span style={{ fontFamily: MONO, fontWeight: 500 }}>{data.divergence_line}</span>
            </b>.{" "}
            <b style={{ color: TEAL_BRIGHT, fontWeight: 600 }}>{data.countdown_line}</b>{" "}
            — your readiness score just ticked to{" "}
            <b style={{ color: TEAL_BRIGHT, fontWeight: 600 }}>
              <span style={{ fontFamily: MONO, fontWeight: 500 }}>{data.readiness_pct}%</span>
            </b>.
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          style={{
            background: "none",
            border: "none",
            color: TEXT_DIM,
            fontFamily: SANS,
            fontSize: 12,
            cursor: "pointer",
            padding: "4px 8px",
            alignSelf: "flex-start",
          }}
        >
          Dismiss
        </button>
      </div>
    </>
  );
}
