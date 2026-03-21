"use client";

import { useState } from "react";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER_LIGHT = "#e8e8e8";
const MUTED = "#666";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, serif";

function WhoItsForDropdown() {
  const [open, setOpen] = useState(false);

  const items = [
    { title: "NGO & Policy Teams", desc: "For organisations tracking regulatory change across multiple issues simultaneously." },
    { title: "Corporate & ESG", desc: "For sustainability teams monitoring supply chain exposure, blue finance, and ocean risk." },
    { title: "Ocean Investors & Funds", desc: "For blue economy VCs, impact funds, and ESG analysts tracking deals, regulation, and science." },
    { title: "Journalists & Researchers", desc: "For professionals who need primary sources fast — not news aggregation." },
  ];

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 400, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        Who It&apos;s For <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 16px)", left: "50%", transform: "translateX(-50%)", background: WHITE, border: `1px solid ${BORDER_LIGHT}`, padding: "8px", width: 480, zIndex: 200, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
          <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: WHITE, border: `1px solid ${BORDER_LIGHT}`, borderRight: "none", borderBottom: "none" }} />
          {items.map((item, i) => (
            <a key={i} href="/start" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", textDecoration: "none", borderBottom: i < items.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = OFF_WHITE)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>{item.title}</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, fontFamily: SANS }}>{item.desc}</div>
            </a>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, padding: "12px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: SANS }}>10 days free · No credit card required</span>
            <a href="/start" style={{ padding: "6px 16px", background: BLUE, color: WHITE, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS, textDecoration: "none", borderRadius: 2 }}>Begin trial →</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Ocean Intelligence</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Live Feed</a>
            <WhoItsForDropdown />
            <a href="/trackers" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Trackers</a>
            <a href="/#pricing" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Pricing</a>
            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
            <a href="/start" style={{ padding: "8px 20px", background: BLUE, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 2, fontFamily: SANS, textDecoration: "none" }}>Try Pro free →</a>
          </div>
        </div>
      </div>
    </>
  );
}
