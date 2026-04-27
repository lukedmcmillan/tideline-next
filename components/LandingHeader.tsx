"use client";

import { useState, useEffect } from "react";

interface LandingHeaderProps {
  onLoginClick: () => void;
  onCtaClick: () => void;
}

export default function LandingHeader({ onLoginClick, onCtaClick }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        .lh-nav a:hover { color: #0B1628 !important; }
        .lh-login:hover { color: #0B1628 !important; }
        .lh-cta:hover { background: #19243A !important; }
      `}</style>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(250,250,247,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "14px 0",
        borderBottom: `1px solid ${scrolled ? "#E5E1D8" : "transparent"}`,
        transition: "border-color 0.2s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>

            {/* Logo */}
            <a href="/" style={{
              display: "flex", alignItems: "center", gap: 10,
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
              fontSize: 18, color: "#0B1628", letterSpacing: "-0.015em", textDecoration: "none",
            }}>
              <div style={{
                width: 26, height: 26, background: "#0B1628", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 800, fontSize: 13, flexShrink: 0,
              }}>T</div>
              Tideline
            </a>

            {/* Primary nav */}
            <nav className="lh-nav" style={{ display: "flex", gap: 32 }}>
              <a href="#showcase" style={{ fontSize: 14, color: "#3A4A5C", fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}>Platform</a>
              <a href="#pricing" style={{ fontSize: 14, color: "#3A4A5C", fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}>Pricing</a>
              <a href="#methodology" style={{ fontSize: 14, color: "#3A4A5C", fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}>Methodology</a>
            </nav>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                className="lh-login"
                onClick={onLoginClick}
                style={{
                  fontSize: 14, color: "#3A4A5C", fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, transition: "color 0.15s", fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Log in
              </button>
              <button
                className="lh-cta"
                onClick={onCtaClick}
                style={{
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                  background: "#0B1628", color: "white",
                  padding: "8px 16px", fontSize: 13,
                  borderRadius: 8, border: "none", cursor: "pointer",
                  whiteSpace: "nowrap", transition: "background 0.15s",
                }}
              >
                Start free trial
              </button>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
