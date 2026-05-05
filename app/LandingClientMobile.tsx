"use client";

import { useState, useEffect } from "react";
import EarlyAccessModal from "@/components/EarlyAccessModal";

// ─────────────────────────────────────────────────────────────────────────────
// Tideline — Mobile Landing Page
// Target: 360–430px wide (primary 390×844, iPhone 14/15 Pro)
// Design ref: landing-rebuild/design_handoff_mobile_landing/README.md
// Inline styles throughout — matches codebase pattern (CLAUDE_RULES.md)
// Bug fixes documented inline with [BUG-FIX n] markers
// ─────────────────────────────────────────────────────────────────────────────

interface SocialProof {
  entities: number;
  documents: number;
  trackers: number;
  sources: number;
  verifiedDate: string;
  isFallback: boolean;
}

// ── Shared glyph ────────────────────────────────────────────────────────────

function TidelineGlyph({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      background: "#1D9E75",      // teal rounded-square per README spec
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 800,
      fontSize: Math.round(size * 0.5),
      flexShrink: 0,
    }}>
      T
    </div>
  );
}

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Platform",    href: "#showcase"    },
  { label: "Pricing",     href: "#pricing"     },
  { label: "Built for",   href: "#built-for"   },
  { label: "Methodology", href: "#methodology" },
];

// ── Mobile Header + Hamburger Drawer ─────────────────────────────────────────
// [BUG-FIX 1] Desktop tri-link layout clipped "Methodology" at right edge.
//             This header collapses to logo + hamburger only. No nav links visible.

function MobileHeader({ onCta, onLogin }: { onCta: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled]       = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // Hairline border appears once scrollY > 12px
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Body scroll lock while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* ── Sticky header bar ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        background: "rgba(250,250,247,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid #E5E1D8" : "1px solid transparent",
        transition: "border-color 0.2s",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          minHeight: 56,
        }}>
          {/* Logo wordmark */}
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <TidelineGlyph size={28} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 19,
              color: "#0B1628",
              letterSpacing: "-0.015em",
            }}>
              Tideline
            </span>
          </a>

          {/* Hamburger — 44×44 tap target per iOS HIG */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              width: 44,
              height: 44,
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="#0B1628" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Full-screen drawer ────────────────────────────────────────────── */}
      {drawerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          animation: "tdl-slide-down 0.22s cubic-bezier(0.2,0.8,0.3,1) both",
        }}>
          {/* Drawer header row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            minHeight: 56,
            borderBottom: "1px solid #E5E1D8",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TidelineGlyph size={28} />
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 19,
                color: "#0B1628",
                letterSpacing: "-0.015em",
              }}>
                Tideline
              </span>
            </div>

            {/* X close — 44×44 tap target */}
            <button
              onClick={closeDrawer}
              aria-label="Close menu"
              style={{
                width: 44,
                height: 44,
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M5 5l12 12M17 5L5 17" stroke="#0B1628" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Nav links — scrollable */}
          <nav style={{ flex: 1, padding: "8px 20px", overflowY: "auto" }} aria-label="Site navigation">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 4px",
                  borderBottom: i < NAV_ITEMS.length - 1 ? "1px solid #EDEAE3" : "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: "#0B1628",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  minHeight: 44,
                }}
              >
                {item.label}
                <span style={{
                  color: "#9AA8B8",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  →
                </span>
              </a>
            ))}

            {/* Account section */}
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              color: "#6B7A8C",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginTop: 32,
              marginBottom: 12,
              paddingLeft: 4,
            }}>
              Account
            </div>
            <a
              href="#login"
              onClick={(e) => { e.preventDefault(); closeDrawer(); onLogin(); }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 4px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                color: "#3A4A5C",
                textDecoration: "none",
                borderBottom: "1px solid #EDEAE3",
                minHeight: 44,
              }}
            >
              Log in
            </a>
          </nav>

          {/* Pinned bottom CTA panel */}
          <div style={{
            padding: "16px 20px 32px",
            borderTop: "1px solid #E5E1D8",
            background: "#FFFFFF",
            flexShrink: 0,
          }}>
            <button
              onClick={() => { closeDrawer(); onCta(); }}
              style={{
                width: "100%",
                minHeight: 50,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                background: "#0B1628",
                color: "white",
                fontSize: 16,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Start your 7-day free trial
            </button>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#6B7A8C",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}>
              No card required · 47 founding spots left
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingClientMobile({ socialProof }: { socialProof: SocialProof }) {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const openModal = () => setShowEarlyAccess(true);

  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      background: "#FAFAF7",
      color: "#0B1628",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* ── 1. Promo bar ──────────────────────────────────────────────────── */}
      {/* Mobile-tightened: 8px vertical padding, sentence case, wraps cleanly */}
      <div style={{
        background: "#0B1628",
        color: "rgba(255,255,255,0.85)",
        padding: "8px 16px",
        textAlign: "center",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        letterSpacing: "0.04em",
        lineHeight: 1.6,
      }}>
        47 founding spots · £39/month, locked for life ·{" "}
        <a
          href="#pricing"
          onClick={(e) => { e.preventDefault(); openModal(); }}
          style={{ color: "#1D9E75", textDecoration: "none" }}
        >
          Claim yours →
        </a>
      </div>

      {/* ── 2. Header + Drawer ────────────────────────────────────────────── */}
      <MobileHeader onCta={openModal} onLogin={openModal} />

      {/* Hover utilities — inline styles can't express :hover, inject once here */}
      <style>{`
        .mob-cta-primary:hover  { background: #19243A !important; }
        .mob-link-ghost:hover   { color: #1D9E75 !important; border-color: #1D9E75 !important; }
        .mob-link-plain:hover   { color: #1D9E75 !important; }
        .mob-cta-white:hover    { background: #F4F2EC !important; }
      `}</style>

      {/* ── 3. Hero ───────────────────────────────────────────────────────── */}
      {/* Padding: 24px top / 20px sides / 24px bottom — tightened */}
      <section style={{ padding: "20px 20px 20px" }}>

        {/* Eyebrow: live dot + "Ocean intelligence · Live" */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#1D9E75",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}>
          <span style={{
            width: 6,
            height: 6,
            background: "#1D9E75",
            borderRadius: "50%",
            display: "inline-block",
            flexShrink: 0,
            animation: "tdl-pulse 2.5s ease-in-out infinite",
          }} />
          Ocean intelligence · Live
        </div>

        {/* H1: 38px Plus Jakarta 800, teal accent (colour only, no italic), no trailing period */}
        {/* [BUG-FIX 9] Period removed from "ocean governance" */}
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          color: "#0B1628",
          textWrap: "balance" as never,
          margin: "0 0 12px",
        }}>
          The platform of record for{" "}
          <em style={{ fontStyle: "normal", color: "#1D9E75" }}>ocean governance</em>
        </h1>

        {/* Sub: 16px DM Sans, max-width 32ch */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          lineHeight: 1.55,
          color: "#3A4A5C",
          maxWidth: "32ch",
          margin: "0 0 16px",
        }}>
          A destination for ocean governance professionals. Track entities, search the document library, build research projects, and receive a personalised brief before 7am.
        </p>

        {/* Primary CTA: full-width, 52px min-height, 10px radius */}
        <button
          onClick={openModal}
          className="mob-cta-primary"
          style={{
            width: "100%",
            minHeight: 52,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            background: "#0B1628",
            color: "white",
            fontSize: 16,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            marginBottom: 10,
            transition: "background 0.15s",
          }}
        >
          Start your 7-day free trial
        </button>

        {/* Secondary link: centred, 14px DM Sans 600, navy underline */}
        <a
          href="#showcase"
          className="mob-link-ghost"
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 18,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#0B1628",
            textDecoration: "none",
            borderBottom: "1px solid #0B1628",
            paddingBottom: 2,
            width: "fit-content",
            margin: "0 auto 10px",
            transition: "color 0.15s, border-color 0.15s",
          }}
        >
          See the platform →
        </a>

        {/* Trust line: DM Sans 11px, flex-wrap, amber scarcity */}
        {/* [BUG-FIX 10] Founding spots weight bumped to 600 for legibility */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 10px",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#6B7A8C",
        }}>
          <span>No card required</span>
          <span style={{ color: "#E5E1D8" }}>·</span>
          <span>7 days full access</span>
          <span style={{ color: "#E5E1D8" }}>·</span>
          <span style={{ color: "#C97A1A", fontWeight: 600 }}>47 founding spots left</span>
        </div>

      </section>

      {/* ── Pricing anchor line ───────────────────────────────────────────── */}
      {/* DM Sans 12px, centred, amber scarcity link to #pricing           */}
      <div style={{
        textAlign: "center",
        padding: "0 20px 10px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: "#6B7A8C",
      }}>
        From £39/month for founding members.{" "}
        <a
          href="#pricing"
          style={{ color: "#1D9E75", textDecoration: "none" }}
        >
          See pricing →
        </a>
      </div>

      {/* ── 4. Pulse Card ─────────────────────────────────────────────────── */}
      {/* Margin: 0 20px 8px. Card: white, 1px solid #E5E1D8, 14px radius, 20px padding */}
      {/* [BUG-FIX 2] Score (7.2) now stacks ABOVE band/meaning text.
                     Desktop 2-col grid produced an empty hole at 390px. */}
      <div style={{
        margin: "0 20px 8px",
        background: "#FFFFFF",
        border: "1px solid #E5E1D8",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 12px 32px rgba(11,22,40,0.08)",
      }}>

        {/* Header row: eyebrow + title + multiplier pill */}
        <div style={{ paddingBottom: 10, borderBottom: "1px solid #E5E1D8", marginBottom: 12 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: "#6B7A8C",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            Live tracker
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#0B1628",
              letterSpacing: "-0.01em",
            }}>
              ISA Deep-Sea Mining
            </div>
            {/* Outline pill aligned right */}
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              color: "#6B7A8C",
              border: "1px solid #E5E1D8",
              padding: "3px 8px",
              borderRadius: 99,
              letterSpacing: "0.06em",
              background: "#FAFAF7",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              0.70x
            </div>
          </div>
        </div>

        {/* Score block — vertical stack (score above band text) */}
        <div style={{ marginBottom: 10 }}>
          {/* Score numeral: DM Sans 54px / 500 / teal / -0.045em / lh 0.9 */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 54,
            color: "#1D9E75",
            lineHeight: 0.9,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            marginBottom: 8,
          }}>
            7.2
          </div>
          {/* Band label */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#1D9E75",
            letterSpacing: "0.16em",
            marginBottom: 4,
            textTransform: "uppercase",
          }}>
            Elevated · Active conditions
          </div>
          {/* Delta */}
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#6B7A8C",
          }}>
            ↑ <span style={{ color: "#1D9E75" }}>+0.4 vs last week</span>
          </div>
        </div>

        {/* Sparkline: full-width, 44px tall, teal stroke + gradient fill + terminal halo */}
        <div style={{ marginBottom: 10, height: 44 }}>
          <svg
            width="100%"
            height="56"
            viewBox="0 0 400 64"
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="mob-spark-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Fill area */}
            <path
              d="M 0 50 L 50 46 L 100 42 L 150 40 L 200 35 L 250 30 L 300 24 L 350 18 L 400 12 L 400 64 L 0 64 Z"
              fill="url(#mob-spark-grad)"
            />
            {/* Line: 2.5px teal stroke */}
            <path
              d="M 0 50 L 50 46 L 100 42 L 150 40 L 200 35 L 250 30 L 300 24 L 350 18 L 400 12"
              fill="none"
              stroke="#1D9E75"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal halo: 6px transparent + 3.5px solid teal dot */}
            <circle cx={400} cy={12} r={6} fill="#1D9E75" opacity={0.2} />
            <circle cx={400} cy={12} r={3.5} fill="#1D9E75" />
          </svg>
        </div>

        {/* Components grid: 2×2 on mobile */}
        {/* [BUG-FIX 8] Labels are Volume/Recency/Decision/Risk — no % suffixes (they wrapped at 390px) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 14px",
          padding: "10px 0",
          borderTop: "1px solid #E5E1D8",
          borderBottom: "1px solid #E5E1D8",
          marginBottom: 10,
        }}>
          {[
            { label: "Volume",   value: "8.2"   },
            { label: "Recency",  value: "9.0"   },
            { label: "Decision", value: "7.5"   },
            { label: "Risk",     value: "×0.70" },
          ].map((c) => (
            <div key={c.label}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                color: "#9AA8B8",
                letterSpacing: "0.08em",
                marginBottom: 4,
                textTransform: "uppercase",
              }}>
                {c.label}
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                color: "#0B1628",
                fontWeight: 500,
              }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {/* Disclosure footer */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          color: "#6B7A8C",
          lineHeight: 1.5,
        }}>
          <span style={{ color: "#C97A1A", marginRight: 6, fontWeight: 500 }}>Disclosure</span>
          ISA commercial licensing runs structurally lower in this index. Read alongside ISA portal.
        </div>

      </div>

      {/* ── 5. Showcase ───────────────────────────────────────────────────── */}
      {/* Padding: 48px vertical / 20px sides. #FAFAF7 bg. */}
      {/* Three rows: eyebrow → H3 → body → link → visual card */}
      <section id="showcase" style={{ padding: "32px 20px", background: "#FAFAF7" }}>

        {/* ── Row 1: The Feed ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#6B7A8C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            The feed
          </div>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#0B1628",
            margin: "0 0 8px",
            textWrap: "balance" as never,
          }}>
            Every signal, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>one inbox</em>
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            color: "#3A4A5C",
            maxWidth: "38ch",
            margin: "0 0 8px",
          }}>
            Continuous coverage from over 100 independent news outlets and primary source publishers. Tagged to entities and trackers, summarised in the platform, with the source one click away.
          </p>
          <a
            href="/platform/feed"
            className="mob-link-ghost"
            style={{
              display: "inline-block",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#0B1628",
              textDecoration: "none",
              borderBottom: "1px solid #0B1628",
              paddingBottom: 2,
              marginBottom: 14,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            See the feed →
          </a>
          {/* FeedMini */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E5E1D8",
            borderRadius: 12,
            boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)",
            padding: 12,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 8,
              borderBottom: "1px solid #E5E1D8",
              marginBottom: 2,
            }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#0B1628", letterSpacing: "-0.01em" }}>Live feed</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9AA8B8", letterSpacing: "0.04em" }}>12 min ago</div>
            </div>
            {[
              { tracker: "ISA",      entity: "Pacific Minerals",     time: "2h", headline: "ISA council defers vote on mining code amid scientific objections",      source: "International Seabed Authority · Press release" },
              { tracker: "BBNJ",     entity: "UN Treaty Collection", time: "4h", headline: "BBNJ ratification reaches 34 parties as Pacific bloc confirms support",  source: "UN Treaty Collection · Filing"                   },
              { tracker: "IMO MEPC", entity: "ACME Shipping",        time: "6h", headline: "MEPC 83 opens with revised CII corridor proposals on the table",         source: "IMO Documents · Working paper"                   },
            ].map((item, idx, arr) => (
              <div key={item.tracker} style={{ padding: "9px 0", borderBottom: idx < arr.length - 1 ? "1px solid #EDEAE3" : "none" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase", color: "#1D9E75", background: "#E8F4EE" }}>{item.tracker}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6B7A8C", border: "1px solid #E5E1D8", background: "#FAFAF7" }}>{item.entity}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9AA8B8", marginLeft: "auto" }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.4, color: "#0B1628", fontWeight: 500, marginBottom: 4 }}>{item.headline}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7A8C" }}>{item.source}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2: The Pulse ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
            The pulse
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#0B1628", margin: "0 0 8px", textWrap: "balance" as never }}>
            Ten domains, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>scored weekly</em>
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: "#3A4A5C", maxWidth: "38ch", margin: "0 0 8px" }}>
            Recognise when something might be coming so you can prepare. A regulatory activity index calibrated against the historical record, with the methodology published openly.
          </p>
          <a href="#methodology" className="mob-link-ghost" style={{ display: "inline-block", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#0B1628", textDecoration: "none", borderBottom: "1px solid #0B1628", paddingBottom: 2, marginBottom: 14, transition: "color 0.15s, border-color 0.15s" }}>
            Read the methodology →
          </a>
          {/* PulseMini */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 12, boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)", padding: 14 }}>
            <div style={{ paddingBottom: 10, borderBottom: "1px solid #E5E1D8", marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>Updated Monday</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#0B1628", letterSpacing: "-0.01em" }}>BBNJ High Seas Treaty</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7A8C", border: "1px solid #E5E1D8", padding: "3px 8px", borderRadius: 99, letterSpacing: "0.06em", background: "#FAFAF7", whiteSpace: "nowrap", flexShrink: 0 }}>0.70x</div>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 48, color: "#1D9E75", lineHeight: 0.95, fontWeight: 500, letterSpacing: "-0.04em", marginBottom: 6 }}>6.4</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#1D9E75", letterSpacing: "0.14em", marginBottom: 2, textTransform: "uppercase" }}>Watch</div>
            <div style={{ fontSize: 13, color: "#0B1628", marginBottom: 3 }}>Conditions developing</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#6B7A8C", marginBottom: 10 }}>↑ <span style={{ color: "#1D9E75" }}>+0.6 vs last week</span></div>
            <svg viewBox="0 0 400 64" preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block", marginBottom: 10 }}>
              <defs><linearGradient id="mob-ps-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1D9E75" stopOpacity={0.18} /><stop offset="100%" stopColor="#1D9E75" stopOpacity={0} /></linearGradient></defs>
              <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16 L 400 64 L 0 64 Z" fill="url(#mob-ps-grad)" />
              <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16" fill="none" stroke="#1D9E75" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={400} cy={16} r={3.5} fill="#1D9E75" />
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px", padding: "8px 0", borderTop: "1px solid #E5E1D8" }}>
              {[{ l: "Volume", v: "7.4" }, { l: "Recency", v: "8.0" }, { l: "Decision", v: "5.5" }, { l: "Risk", v: "×0.70" }].map(c => (
                <div key={c.l}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.08em", marginBottom: 3, textTransform: "uppercase" }}>{c.l}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0B1628", fontWeight: 500 }}>{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: The Workspace ── */}
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
            The workspace
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#0B1628", margin: "0 0 8px", textWrap: "balance" as never }}>
            Choose what to follow. The platform <em style={{ fontStyle: "normal", color: "#1D9E75" }}>watches</em>.
          </h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: "#3A4A5C", maxWidth: "38ch", margin: "0 0 8px" }}>
            Pick the entities, regulators, or companies you care about. Whenever they appear in the press, in a document, or in a regulatory filing, that information attaches itself to your active projects automatically.
          </p>
          <a href="#" className="mob-link-ghost" style={{ display: "inline-block", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#0B1628", textDecoration: "none", borderBottom: "1px solid #0B1628", paddingBottom: 2, marginBottom: 14, transition: "color 0.15s, border-color 0.15s" }}>
            Tour the workspace →
          </a>
          {/* WorkspaceMini */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 12, boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E1D8" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#1D9E75", background: "#E8F4EE", padding: "3px 8px", borderRadius: 99, letterSpacing: "0.06em", marginBottom: 6, display: "inline-block", textTransform: "uppercase" }}>Regulatory watch</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#0B1628", letterSpacing: "-0.01em" }}>BBNJ Ratification Tracker</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9AA8B8", whiteSpace: "nowrap" }}>12 · 3 new</div>
              </div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 10, textTransform: "uppercase" }}>Attached</div>
              {[
                { tag: "Primary · Library", tagColor: "#1D9E75", title: "PIF Communiqué on BBNJ ratification commitments",      meta: "PIF Secretariat · 12 Mar 2026"       },
                { tag: "Primary · Library", tagColor: "#1D9E75", title: "UN Treaty Collection: BBNJ signatories deposited",     meta: "UN Treaty Collection · 18 Apr"       },
                { tag: "Secondary · Feed",  tagColor: "#C97A1A", title: "BBNJ ratification reaches 34 parties",                 meta: "Reuters · 4h ago"                    },
              ].map((item, i, arr) => (
                <div key={i} style={{ padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #EDEAE3" : "none" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase", color: item.tagColor }}>{item.tag}</div>
                  <div style={{ color: "#0B1628", fontSize: 13, lineHeight: 1.4, marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#9AA8B8" }}>{item.meta}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 16px", background: "#FAFAF7", borderTop: "1px solid #E5E1D8", position: "relative" }}>
              <div style={{ position: "absolute", top: 14, right: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#C97A1A", border: "1px solid #E8C896", background: "#FBF3E5", padding: "3px 8px", borderRadius: 99, letterSpacing: "0.08em", textTransform: "uppercase" }}>Q3 2026</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 10, textTransform: "uppercase" }}>Ask Tideline</div>
              <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 12, color: "#0B1628", fontWeight: 500, lineHeight: 1.45 }}>
                What did Pacific bloc states commit to at PrepCom III?
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#3A4A5C" }}>
                The Pacific Islands Forum bloc collectively committed to depositing instruments before the second BBNJ COP<sup style={{ color: "#1D9E75", fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500 }}>¹</sup>. Fiji, Palau, and the Marshall Islands have since deposited<sup style={{ color: "#1D9E75", fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 500 }}>²</sup>.
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── 7. Value band (replaces full Comparison on mobile) ───────────── */}
      {/* Closing line lifted from Comparison, stands alone above mid-CTA.  */}
      <div style={{
        padding: "20px 20px 14px",
        background: "#FAFAF7",
        borderTop: "1px solid #E5E1D8",
      }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 19,
          color: "#0B1628",
          lineHeight: 1.35,
          letterSpacing: "-0.015em",
          maxWidth: "34ch",
        }}>
          <div>Less than <em style={{ fontStyle: "normal", color: "#1D9E75" }}>£25 a week</em>.</div>
          <div>Less than a single billable hour.</div>
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#6B7A8C",
          marginTop: 8,
        }}>
          7-day free trial · No card required
        </div>
      </div>

      {/* ── 8. Mid-CTA strip ──────────────────────────────────────────────── */}
      {/* Padding: 32/20. Navy panel, 14px radius, 28/22 inner. Vertical stack. */}
      {/* [BUG-FIX 3] Heading + button stack vertically; no desktop 2-col grid */}
      <section style={{ padding: "0 20px 24px", background: "#FAFAF7" }}>
        <div style={{
          background: "#0B1628",
          padding: "22px 18px",
          borderRadius: 14,
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "white",
            marginBottom: 4,
            textWrap: "balance" as never,
          }}>
            Try it free for 7 days. No card required.
          </div>
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 14,
            lineHeight: 1.5,
          }}>
            Founding member pricing locked at £39/month for life. 47 spots left.
          </div>
          <button
            onClick={openModal}
            className="mob-cta-white"
            style={{
              width: "100%",
              minHeight: 50,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              background: "white",
              color: "#0B1628",
              fontSize: 15,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            Start your 7-day free trial
          </button>
        </div>
      </section>

      {/* ── 9. "Not" strip ────────────────────────────────────────────────── */}
      {/* Padding: 32/20. #F4F2EC bg. Hairline rules top + bottom + between rows. */}
      {/* [BUG-FIX 5] Rows separated by 1px solid #E5E1D8 (was 3 centred paras) */}
      <section style={{
        background: "#F4F2EC",
        padding: "20px 20px",
        borderTop: "1px solid #E5E1D8",
        borderBottom: "1px solid #E5E1D8",
      }}>
        {[
          { h: "Not Google Alerts.",        b: "Volume is not signal. Tideline scores activity, attributes sources, tracks how stories evolve." },
          { h: "Not a chatbot.",             b: "Curated by the platform's tracking systems and verified before it lands in your inbox." },
          { h: "Not an academic database.", b: "For working professionals who need the answer in five minutes, not the literature review in five hours." },
        ].map((item, i, arr) => (
          <div
            key={item.h}
            style={{
              padding: "10px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #E5E1D8" : "none",
            }}
          >
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#0B1628",
              marginBottom: 6,
              letterSpacing: "-0.015em",
              margin: "0 0 6px",
            }}>
              {item.h}
            </h3>
            <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.5, margin: 0 }}>{item.b}</p>
          </div>
        ))}
      </section>

      {/* ── 10. Built for ─────────────────────────────────────────────────── */}
      {/* Padding: 48/20. #FAFAF7 bg. H2 at 26px. 5-row table. */}
      {/* [BUG-FIX 6] H2 reduced to 26px to stay ≤2 lines at 390px */}
      <section id="built-for" style={{ padding: "32px 20px", background: "#FAFAF7" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#6B7A8C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Built for
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#0B1628",
            margin: 0,
            textWrap: "balance" as never,
          }}>
            Five sectors, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>one platform</em>
          </h2>
        </div>

        <div style={{ borderTop: "1px solid #E5E1D8" }}>
          {[
            { name: "Marine lawyers",      track: "Track regulatory changes across IMO, ISA, FAO, OSPAR.", get: "Cited regulatory briefs in minutes." },
            { name: "ESG and blue finance", track: "Track TNFD, BBNJ, blue bonds, ISA exposure.",          get: "Portfolio intelligence with citable sources." },
            { name: "Shipping compliance",  track: "Track IMO MEPC, MARPOL, EU MRV, port state.",          get: "Compliance window awareness early." },
            { name: "Conservation NGOs",    track: "Track 30x30, IUU, MPAs, consultations.",               get: "Replace six tabs and Google Alerts." },
            { name: "Climate finance",      track: "Track ISA, debt-for-nature, sustainable finance.",     get: "Emerging market signal early." },
          ].map((seg) => (
            <div
              key={seg.name}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid #E5E1D8",
              }}
            >
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#0B1628",
                marginBottom: 4,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}>
                {seg.name}
              </div>
              <div style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.5, marginBottom: 2 }}>{seg.track}</div>
              <div style={{ fontSize: 14, color: "#6B7A8C", lineHeight: 1.5 }}>{seg.get}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. Supporting band ───────────────────────────────────────────── */}
      {/* Stacked cards: Directory then Brief. #FAFAF7 bg, 48/20 padding.    */}
      <section style={{ padding: "32px 20px", background: "#FAFAF7", borderTop: "1px solid #E5E1D8" }}>

        {/* Directory card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E1D8",
          borderRadius: 14,
          padding: 18,
          marginBottom: 14,
          boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)",
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: "#6B7A8C",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            The directory
          </div>
          <h4 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#0B1628",
            marginBottom: 8,
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
            margin: "0 0 6px",
          }}>
            Every entity, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>in one place</em>
          </h4>
          <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.5, margin: "0 0 12px" }}>
            928 entities across companies, regulators, contractors, and financial institutions. Star the ones that matter. Don&apos;t see an entity you&apos;re looking for? Email us and we&apos;ll add it.
          </p>
          {/* Directory mini */}
          <div style={{ background: "#FAFAF7", border: "1px solid #E5E1D8", borderRadius: 10, padding: 12 }}>
            <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9AA8B8" }}>
              ⌕  Search 928 entities…
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { name: "Pacific Minerals Ltd", type: "Contractor",    tags: [{ l: "ISA", c: "#C97A1A", bg: "#FBF3E5" }, { l: "Active", c: "#1D9E75", bg: "#E8F4EE" }], starred: true,  focused: true  },
                { name: "ACME Shipping Ltd",    type: "Operator",      tags: [{ l: "MEPC 83", c: "#1D9E75", bg: "#E8F4EE" }],                                              starred: false, focused: false },
                { name: "Intl Seabed Authority",type: "Regulator",     tags: [{ l: "2 stories", c: "#1D9E75", bg: "#E8F4EE" }],                                            starred: false, focused: false },
                { name: "BlackRock Blue Bond",  type: "Investor",      tags: [{ l: "TNFD", c: "#C97A1A", bg: "#FBF3E5" }],                                                 starred: true,  focused: false },
              ].map((card) => (
                <div
                  key={card.name}
                  style={{
                    background: "white",
                    border: card.focused ? "1px solid #1D9E75" : "1px solid #E5E1D8",
                    borderRadius: 6,
                    padding: 10,
                    position: "relative",
                    boxShadow: card.focused ? "0 0 0 2px rgba(29,158,117,0.12)" : "none",
                  }}
                >
                  {card.starred && (
                    <div style={{ position: "absolute", top: 8, right: 8, color: "#1D9E75", fontSize: 11 }}>★</div>
                  )}
                  <div style={{ fontSize: 11, color: "#0B1628", fontWeight: 600, marginBottom: 4, paddingRight: card.starred ? 14 : 0, lineHeight: 1.3 }}>{card.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: "#9AA8B8", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>{card.type}</div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {card.tags.map((tag) => (
                      <span key={tag.l} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: tag.c, background: tag.bg, letterSpacing: "0.04em", textTransform: "uppercase" }}>{tag.l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brief card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E1D8",
          borderRadius: 14,
          padding: 18,
          boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)",
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: "#6B7A8C",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            The brief
          </div>
          <h4 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#0B1628",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
            margin: "0 0 6px",
          }}>
            Personalised, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>before 7am</em>
          </h4>
          <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.5, margin: "0 0 14px" }}>
            Every weekday morning, only the entities and domains you track. Sourced from the feed, scored against the trackers, quality-checked before it lands.
          </p>
          {/* iPhone frame — 65% viewport width, centered */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "65%",
              maxWidth: 240,
              background: "#1d1d1f",
              borderRadius: 28,
              padding: 6,
              boxShadow: "inset 0 0 0 1px #3a3a3d, 0 16px 40px -8px rgba(11,22,40,0.25)",
            }}>
              <div style={{ background: "#FAFAF7", borderRadius: 22, overflow: "hidden", aspectRatio: "9/17", position: "relative" }}>
                {/* Dynamic island */}
                <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: 56, height: 16, background: "#000", borderRadius: 10, zIndex: 5 }} />
                {/* Screen content */}
                <div style={{ padding: "28px 12px 14px", fontSize: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#0B1628", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>Tideline · 6:47</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10, color: "#0B1628", lineHeight: 1.25, marginBottom: 9, letterSpacing: "-0.01em" }}>Friday · 4 entities moved overnight</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 7, color: "#1D9E75", letterSpacing: "0.12em", paddingBottom: 6, borderBottom: "1px solid #E5E1D8", marginBottom: 7, textTransform: "uppercase" }}>Friday 25 April</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: "#0B1628", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>Good morning.</div>
                  <div style={{ fontSize: 7.5, color: "#3A4A5C", lineHeight: 1.4, marginBottom: 9, fontFamily: "'DM Sans', sans-serif" }}>All 4 of your tracked entities moved yesterday.</div>
                  <div style={{ padding: "7px 0", borderTop: "1px solid #E5E1D8" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 6, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 3, textTransform: "uppercase" }}>The watch</div>
                    <div style={{ fontSize: 7.5, fontWeight: 600, color: "#0B1628", lineHeight: 1.3, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>ISA defers vote on mining code</div>
                    <div style={{ fontSize: 7, color: "#3A4A5C", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>Council postponed following ITLOS objections.</div>
                  </div>
                  <div style={{ padding: "7px 0", borderTop: "1px solid #E5E1D8" }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 6, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 5, textTransform: "uppercase" }}>Your entities</div>
                    {/* ACME Shipping — inline sparkline */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D9E75", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                        <div style={{ fontSize: 7, fontWeight: 600, color: "#0B1628", fontFamily: "'DM Sans', sans-serif" }}>ACME Shipping</div>
                        <svg width="30" height="10" viewBox="0 0 30 10" style={{ flexShrink: 0 }}>
                          <path d="M0 8 L5 6.5 L10 5 L15 3.5 L20 2.5 L25 1.5 L30 0.5" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 6.5, color: "#3A4A5C", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>MEPC 83 papers reference fleet emissions.</div>
                    </div>
                  </div>
                  {/* Pacific Minerals — amber pulse badge */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C97A1A", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                        <div style={{ fontSize: 7, fontWeight: 600, color: "#0B1628", fontFamily: "'DM Sans', sans-serif" }}>Pacific Minerals</div>
                        <span style={{ background: "#FBF3E5", color: "#C97A1A", fontSize: 5.5, padding: "1px 4px", borderRadius: 99, fontWeight: 600, letterSpacing: "0.03em", flexShrink: 0 }}>↑ 7.2</span>
                      </div>
                      <div style={{ fontSize: 6.5, color: "#3A4A5C", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>ISA Pulse moved 6.4 → 7.2 overnight.</div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. Founder ───────────────────────────────────────────────────── */}
      <section style={{ padding: "32px 20px 24px", background: "#FAFAF7", borderTop: "1px solid #E5E1D8" }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "#6B7A8C",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: 20,
        }}>
          Built by
        </div>
        {/* Photo + bio stacked vertically on mobile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 80px circle photo placeholder */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #D8D4C8, #B8B4A8 70%)",
            border: "1px solid #E5E1D8",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 8,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 7,
            color: "rgba(11,22,40,0.4)",
            letterSpacing: "0.08em",
            flexShrink: 0,
          }}>
            FOUNDER
          </div>
          <div>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#0B1628",
              marginBottom: 12,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              margin: "0 0 8px",
            }}>
              One founder. <em style={{ fontStyle: "normal", color: "#1D9E75" }}>No shortcuts</em>.
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "#3A4A5C", margin: "0 0 10px" }}>
              Tideline is built by Luke McMillan, a sole founder with a decade in ocean policy. Every line of code, every scraper, every editorial decision passes through one set of hands. The methodology is published openly because the person responsible for it answers for it. Tideline was built from interviews with 32 ocean governance professionals across legal, ESG, shipping compliance, and conservation — before a single line of code was written.
            </p>
            <a
              href="/methodology"
              className="mob-link-plain"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#0B1628",
                textDecoration: "none",
                borderBottom: "1px solid #0B1628",
                paddingBottom: 2,
                transition: "color 0.15s",
              }}
            >
              Read the longer story →
            </a>
          </div>
        </div>
      </section>

      {/* ── 13. Pricing ───────────────────────────────────────────────────── */}
      {/* Padding: 48/20. #F4F2EC bg. 3 stacked cards. Founding member featured. */}
      <section id="pricing" style={{ padding: "32px 20px", background: "#F4F2EC" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#6B7A8C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Pricing
          </div>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 32,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "#0B1628",
            margin: 0,
          }}>
            One platform. <em style={{ fontStyle: "normal", color: "#1D9E75" }}>No tiers</em>.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {[
            {
              name: "Founding member",
              sub: "Locked for life",
              price: "£39",
              per: "per month, forever",
              features: ["Direct line to the founder. Shape what gets built next.", "Full platform access", "Personalised brief", "All trackers", "Workspace and library", "All future features included"],
              cta: "Start your 7-day free trial",
              featured: true,
              badge: "47 of 50 left",
            },
            {
              name: "Individual",
              sub: "7-day free trial",
              price: "£99",
              per: "per month",
              features: ["Full platform access", "Personalised brief", "All trackers", "Workspace and library", "Directory of 928 entities"],
              cta: "Start your 7-day free trial",
              featured: false,
            },
            {
              name: "Team",
              sub: "10 seats",
              price: "£699",
              per: "per month",
              features: ["Everything in Individual", "10 seats", "Shared library and projects", "Priority support"],
              cta: "Talk to us",
              featured: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              style={{
                background: "#FFFFFF",
                border: tier.featured ? "1px solid #0B1628" : "1px solid #E5E1D8",
                borderRadius: 14,
                padding: "18px 18px",
                position: "relative",
                boxShadow: tier.featured ? "0 12px 36px rgba(11,22,40,0.12)" : "0 1px 2px rgba(11,22,40,0.04)",
                marginTop: tier.featured ? 8 : 0,
              }}
            >
              {tier.badge && (
                <div style={{
                  position: "absolute",
                  top: -10,
                  left: 22,
                  background: "#C97A1A",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                  borderRadius: 99,
                  textTransform: "uppercase",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 4, textTransform: "uppercase" }}>{tier.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: tier.featured ? "#C97A1A" : "#9AA8B8", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>{tier.sub}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 44, color: "#0B1628", lineHeight: 1, letterSpacing: "-0.035em" }}>{tier.price}</div>
                <div style={{ fontSize: 13, color: "#6B7A8C" }}>{tier.per}</div>
              </div>
              <ul style={{ listStyle: "none", marginBottom: 14, padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: "#3A4A5C", padding: "4px 0", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={openModal}
                style={{
                  width: "100%",
                  minHeight: 48,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  background: tier.featured ? "#0B1628" : "transparent",
                  color: tier.featured ? "white" : "#0B1628",
                  fontSize: 14,
                  borderRadius: 10,
                  border: tier.featured ? "none" : "1px solid #0B1628",
                  cursor: "pointer",
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 14. Final navy CTA ────────────────────────────────────────────── */}
      {/* Different copy from mid-CTA. #0B1628 bg, white button.            */}
      <section style={{
        background: "#0B1628",
        padding: "40px 20px",
        textAlign: "center",
        color: "white",
      }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 40,
          color: "white",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          margin: "0 0 10px",
          textWrap: "balance" as never,
        }}>
          Start <em style={{ fontStyle: "normal", color: "#1D9E75" }}>the trial</em>.
        </h2>
        <p style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.7)",
          margin: "0 0 20px",
          lineHeight: 1.5,
        }}>
          Seven days. Full platform access. No card required.
        </p>
        <button
          onClick={openModal}
          className="mob-cta-white"
          style={{
            width: "100%",
            minHeight: 52,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            background: "white",
            color: "#0B1628",
            fontSize: 16,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            marginBottom: 10,
            transition: "background 0.15s",
          }}
        >
          Start your 7-day free trial
        </button>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}>
          Cancel any time. Your data stays yours.
        </div>
      </section>

      {/* ── 15. Footer ────────────────────────────────────────────────────── */}
      {/* #0B1628 bg. 36/20 padding. Logo + 2×2 link grid + copyright.      */}
      <footer style={{
        background: "#0B1628",
        color: "rgba(255,255,255,0.7)",
        padding: "28px 20px 20px",
      }}>
        {/* Logo + wordmark + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 28,
            height: 28,
            background: "#1D9E75",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
          }}>
            T
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.015em" }}>Tideline</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 2 }}>Ocean Intelligence</div>
          </div>
        </div>

        {/* 2×2 link grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 16px", marginBottom: 18 }}>
          {[
            { h: "Platform", l: ["Feed", "Trackers", "Workspace", "Library"] },
            { h: "Company",  l: ["Methodology", "Pricing", "Founder", "Contact"] },
            { h: "Legal",    l: ["Privacy", "Terms"] },
            { h: "Account",  l: ["Log in", "Subscribe"] },
          ].map((col) => (
            <div key={col.h}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>
                {col.h}
              </div>
              {col.l.map((li) => (
                <a
                  key={li}
                  href="#"
                  style={{
                    display: "block",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.85)",
                    textDecoration: "none",
                    padding: "4px 0",
                    minHeight: 28,
                  }}
                >
                  {li}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.04em",
          borderTop: "1px solid #1A2C45",
          paddingTop: 16,
        }}>
          © 2026 Tideline · Built by the journalist who covers this beat.
        </div>
      </footer>

      {showEarlyAccess && <EarlyAccessModal onClose={() => setShowEarlyAccess(false)} />}
    </div>
  );
}
