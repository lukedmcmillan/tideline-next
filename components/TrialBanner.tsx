"use client";

import { useState, useEffect } from "react";

const M = "var(--font-mono), 'DM Mono', monospace";
const TEAL = "#1D9E75";
const SS_KEY = "tideline_trial_banner_dismissed";

export default function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(SS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "6px 16px",
      background: "#0D1F35",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <span style={{
        fontFamily: M,
        fontSize: 10,
        fontWeight: 500,
        color: "rgba(255, 255, 255, 0.5)",
        letterSpacing: "0.04em",
      }}>
        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining on your trial.
      </span>
      <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: M, fontSize: 10 }}>&mdash;</span>
      <a
        href="/pricing"
        style={{
          fontFamily: M,
          fontSize: 10,
          fontWeight: 500,
          color: TEAL,
          textDecoration: "none",
          letterSpacing: "0.04em",
        }}
      >
        Continue access
      </a>
      <button
        onClick={() => { sessionStorage.setItem(SS_KEY, "1"); setDismissed(true); }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: M,
          fontSize: 10,
          color: "rgba(255,255,255,0.25)",
          marginLeft: 8,
          padding: 0,
        }}
      >
        &times;
      </button>
    </div>
  );
}
