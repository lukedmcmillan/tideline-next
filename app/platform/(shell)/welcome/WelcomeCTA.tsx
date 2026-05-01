"use client";

import { useState } from "react";

const TEAL = "#1D9E75";
const F = "'DM Sans', -apple-system, sans-serif";

export default function WelcomeCTA() {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      await fetch("/api/welcome/seen", { method: "POST" });
    } catch {
      // Non-blocking: navigate even if mark-seen fails
    }
    window.location.href = "/platform/feed";
  };

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: TEAL,
        color: "#fff",
        fontFamily: F,
        fontSize: 15,
        fontWeight: 600,
        border: "none",
        borderRadius: 4,
        padding: "14px 28px",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {loading ? "Opening…" : "Open dashboard →"}
    </button>
  );
}
