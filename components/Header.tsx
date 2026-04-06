"use client";

import { useState, useEffect, useRef } from "react";
import { TidelineLogo } from "@/components/ui/TidelineLogo";

const TEAL = "#1D9E75";
const TEAL_HOVER = "#178a65";
const INK = "#202124";
const SECONDARY = "#5F6368";
const BORDER = "#E8EAED";
const WHITE = "#FFFFFF";
const F = "'DM Sans', system-ui, sans-serif";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Who it\u2019s for", href: "#who" },
  { label: "Pricing", href: "#pricing" },
  { label: "Methodology", href: "#methodology" },
];

export default function Header({
  currentPage,
  showNav = true,
  onJoinClick,
  onLoginClick,
}: {
  currentPage?: string;
  showNav?: boolean;
  onJoinClick?: () => void;
  onLoginClick?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div ref={menuRef} style={{ position: "sticky", top: 0, zIndex: 100, background: WHITE }}>
      <style>{`
        .hdr-nav-links { display: flex; align-items: center; gap: 32px; }
        .hdr-actions { display: flex; align-items: center; gap: 12px; }
        .hdr-burger { display: none; }
        .hdr-mobile-menu { display: none; }
        .hdr-nav-link:hover { color: ${INK} !important; }
        .hdr-join-btn:hover { background: ${TEAL_HOVER} !important; }
        @media (max-width: 768px) {
          .hdr-nav-links { display: none !important; }
          .hdr-actions { display: none !important; }
          .hdr-burger { display: flex !important; }
          .hdr-mobile-menu { display: block !important; }
        }
      `}</style>

      {/* Header bar */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        height: 64,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Left: logo */}
          <a href="/" style={{ textDecoration: "none" }}>
            <TidelineLogo size="md" theme="light" />
          </a>

          {/* Centre: nav links (desktop only) */}
          {showNav && (
            <div className="hdr-nav-links">
              {NAV_LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  className="hdr-nav-link"
                  style={{
                    fontFamily: F, fontSize: 14, fontWeight: 400,
                    color: currentPage === l.href ? TEAL : SECONDARY,
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Right: actions (desktop only) */}
          {showNav && (
            <div className="hdr-actions">
              <button
                onClick={onLoginClick}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: F, fontSize: 14, fontWeight: 500,
                  color: TEAL, padding: 0,
                }}
              >
                Log in
              </button>
              <button
                className="hdr-join-btn"
                onClick={onJoinClick}
                style={{
                  background: TEAL, color: WHITE, border: "none",
                  fontFamily: F, fontSize: 14, fontWeight: 500,
                  padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                }}
              >
                Join early access
              </button>
            </div>
          )}

          {/* Hamburger (mobile only) */}
          {showNav && (
            <button
              className="hdr-burger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 40, height: 40,
                alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer",
                padding: 0,
              }}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4l12 12M16 4L4 16" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 5h16M2 10h16M2 15h16" stroke={INK} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {showNav && menuOpen && (
        <div
          className="hdr-mobile-menu"
          style={{
            background: WHITE,
            borderBottom: `1px solid ${BORDER}`,
            padding: "16px 24px",
          }}
        >
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={closeMenu}
              style={{
                display: "block",
                padding: "14px 0",
                borderBottom: i < NAV_LINKS.length - 1 ? "1px solid #F1F3F4" : "none",
                fontFamily: F, fontSize: 15, fontWeight: 400,
                color: INK, textDecoration: "none",
              }}
            >
              {l.label}
            </a>
          ))}

          <button
            onClick={() => { closeMenu(); onLoginClick?.(); }}
            style={{
              width: "100%", height: 44, marginTop: 8,
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: 6, fontFamily: F, fontSize: 14,
              fontWeight: 500, color: INK, cursor: "pointer",
            }}
          >
            Log in
          </button>
          <button
            onClick={() => { closeMenu(); onJoinClick?.(); }}
            style={{
              width: "100%", height: 44, marginTop: 8,
              background: TEAL, border: "none",
              borderRadius: 6, fontFamily: F, fontSize: 14,
              fontWeight: 500, color: WHITE, cursor: "pointer",
            }}
          >
            Join early access
          </button>
        </div>
      )}
    </div>
  );
}
