"use client";

import React from "react";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const TEAL = "#1D9E75";
const INK = "#202124";
const SECONDARY = "#5F6368";
const BORDER = "#E8EAED";

export default function DesktopOnly({
  featureName,
  children,
}: {
  featureName: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .desktop-only-gate-mobile { display: none; }
        .desktop-only-gate-content { display: contents; }
        @media (max-width: 768px) {
          .desktop-only-gate-mobile { display: flex !important; }
          .desktop-only-gate-content { display: none !important; }
        }
      `}</style>

      {/* Mobile: clean message */}
      <div
        className="desktop-only-gate-mobile"
        style={{
          minHeight: "calc(100vh - 120px)",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "#FAFAFA",
        }}
      >
        {/* Monitor icon */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="6" width="36" height="26" rx="3" stroke={BORDER} strokeWidth="2" />
          <path d="M18 38h12" stroke={BORDER} strokeWidth="2" strokeLinecap="round" />
          <path d="M24 32v6" stroke={BORDER} strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div style={{
          fontFamily: F, fontSize: 20, fontWeight: 500,
          color: INK, marginTop: 16, marginBottom: 8,
          textAlign: "center",
        }}>
          {featureName} is built for desktop
        </div>

        <div style={{
          fontFamily: F, fontSize: 14, fontWeight: 400,
          color: SECONDARY, textAlign: "center",
          maxWidth: 280, marginBottom: 24, lineHeight: 1.6,
        }}>
          This feature works best on a larger screen.
        </div>

        <button
          onClick={() => {
            const url = typeof window !== "undefined" ? window.location.href : "";
            window.location.href = `mailto:?subject=${encodeURIComponent("Tideline")}&body=${encodeURIComponent(url)}`;
          }}
          style={{
            width: "100%", maxWidth: 280, height: 44,
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 6, fontFamily: F, fontSize: 14,
            fontWeight: 500, color: INK, cursor: "pointer",
          }}
        >
          Send this link to myself
        </button>

        <a
          href="/platform/feed"
          style={{
            fontFamily: F, fontSize: 14, fontWeight: 500,
            color: TEAL, textDecoration: "none", marginTop: 16,
          }}
        >
          Back to feed
        </a>
      </div>

      {/* Desktop: render children */}
      <div className="desktop-only-gate-content">
        {children}
      </div>
    </>
  );
}
