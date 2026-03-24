"use client";

import { useState } from "react";

// ── Colour system ──────────────────────────────────────────────────────────
const NAVY        = "#0a1628";
const BLUE        = "#1d6fa4";
const BLUE_LIGHT  = "#e8f2f9";
const RED         = "#d32f2f";
const GREEN       = "#2e7d32";
const WHITE       = "#ffffff";
const OFF_WHITE   = "#f5f4ef";
const BORDER      = "rgba(0,0,0,0.08)";
const TEXT_PRI    = "#1a1a1a";
const TEXT_SEC    = "#6b7280";
const TEXT_TER    = "#9ca3af";
const SANS        = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF       = "Georgia, serif";
const MONO        = "'IBM Plex Mono', 'Courier New', monospace";

const LUKE_PHOTO  = "https://substackcdn.com/image/fetch/$s_!A-7H!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd4e131cc-7392-4ae8-8a40-5d8a8b4498a6_2550x2550.png";

const SRC: Record<string, { bg: string; color: string }> = {
  reg: { bg: "#e8f2f9", color: "#1d6fa4" },
  res: { bg: "#eaf3de", color: "#2D6A0A" },
  ngo: { bg: "#f0eef9", color: "#4A3F8C" },
  gov: { bg: "#fff3e0", color: "#7A4500" },
};

// ── Who It's For dropdown ─────────────────────────────────────────────────
function WhoItsForDropdown() {
  const [open, setOpen] = useState(false);
  const items = [
    { title: "NGO & Policy Teams",       desc: "For organisations tracking regulatory change across multiple issues simultaneously." },
    { title: "Corporate & ESG",          desc: "For sustainability teams monitoring supply chain exposure, blue finance, and ocean risk." },
    { title: "Ocean Investors & Funds",  desc: "For blue economy VCs, impact funds, and ESG analysts tracking deals, regulation, and science." },
    { title: "Journalists & Researchers",desc: "For professionals who need primary sources fast — not news aggregation." },
  ];
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 400, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        Who It&apos;s For <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 16px)", left: "50%", transform: "translateX(-50%)", background: WHITE, border: `1px solid ${BORDER}`, padding: "8px", width: 480, zIndex: 200, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
          <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: WHITE, border: `1px solid ${BORDER}`, borderRight: "none", borderBottom: "none" }} />
          {items.map((item, i) => (
            <a key={i} href="/start" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", textDecoration: "none", borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = OFF_WHITE)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>{item.title}</div>
              <div style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.5, fontFamily: SANS }}>{item.desc}</div>
            </a>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: "12px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: TEXT_SEC, fontFamily: SANS }}>14 days free · No credit card required</span>
            <a href="/start" style={{ padding: "6px 16px", background: BLUE, color: WHITE, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: SANS, textDecoration: "none", borderRadius: 2 }}>Begin trial →</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile nav ────────────────────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
        <span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.7)", borderRadius: 1, transition: "all 0.2s", transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ display: "block", width: open ? 0 : 22, height: 2, background: "rgba(255,255,255,0.7)", borderRadius: 1, transition: "all 0.2s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: 22, height: 2, background: "rgba(255,255,255,0.7)", borderRadius: 1, transition: "all 0.2s", transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: NAVY, borderTop: `1px solid rgba(255,255,255,0.08)`, zIndex: 200, padding: "8px 0 16px" }}>
          {[
            { label: "The Brief", href: "/platform/feed" },
            { label: "Who It's For", href: "/start" },
            { label: "Trackers", href: "/start" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Sign in", href: "/login" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "13px 24px", color: "rgba(255,255,255,0.75)", fontSize: 15, fontFamily: SANS, textDecoration: "none", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              {item.label}
            </a>
          ))}
          <div style={{ padding: "16px 24px 0" }}>
            <a href="/subscribe" style={{ display: "block", padding: "13px", background: BLUE, color: WHITE, fontSize: 14, fontWeight: 700, borderRadius: 2, fontFamily: SANS, textAlign: "center", textDecoration: "none" }}>Start free trial →</a>
          </div>
        </div>
      )}
    </>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    {
      q: "Is there a contract or minimum commitment?",
      a: "No contract. No minimum term. Cancel any time from your account settings — no emails, no phone calls, no questions asked.",
    },
    {
      q: "What does Tideline actually cover?",
      a: "More than 80 hand-curated sources across 31 ocean subject areas, spanning coral reef science, deep-sea mining regulation, IUU fishing enforcement, blue finance, and international ocean governance. Selected by an ocean journalist. Not an algorithm.",
    },
    {
      q: "How is this different from Google Alerts or free news sites?",
      a: "Google Alerts gives you volume. Tideline gives you signal. Free news covers what happened. Tideline covers what\u2019s moving — regulatory decisions, scientific preprints, NGO briefings, parliamentary records, and institutional databases that don\u2019t surface in mainstream coverage. Curated by an ocean journalist with two decades in the sector, delivered as it breaks.",
    },
    {
      q: "Do you sell or share subscriber data?",
      a: "Never. Your data is used solely to deliver your Tideline subscription. It is not sold, shared, or used for advertising.",
    },
  ];
  return (
    <div>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}
          >
            <span style={{ fontSize: "clamp(15px,2.5vw,17px)", fontWeight: 600, color: WHITE, fontFamily: SERIF, lineHeight: 1.4 }}>{faq.q}</span>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", flexShrink: 0, transition: "transform 0.2s", transform: openIndex === i ? "rotate(45deg)" : "none" }}>+</span>
          </button>
          {openIndex === i && (
            <div style={{ paddingBottom: 20 }}>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontFamily: SANS, maxWidth: 640 }}>{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ fontFamily: SANS, color: TEXT_PRI, background: WHITE }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        a { text-decoration: none; color: inherit; }

        /* Responsive grid helpers */
        .hero-grid { display: grid; grid-template-columns: 1fr 400px; gap: 72px; align-items: center; }
        .founder-grid { display: grid; grid-template-columns: 240px 1fr; gap: 72px; align-items: start; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); }
        .trackers-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .nav-desktop { display: flex; }
        .nav-mobile { display: none; }
        .hero-widget { display: block; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-widget { display: none; }
          .founder-grid { grid-template-columns: 1fr; gap: 40px; }
          .pricing-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .trackers-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      {/* ── NAV ── */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em" }}>TIDELINE</a>
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>Ocean Intelligence</span>
          </div>
          {/* Desktop nav */}
          <div className="nav-desktop" style={{ alignItems: "center", gap: 28 }}>
            <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>The Brief</a>
            <WhoItsForDropdown />
            <a href="/start" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Trackers</a>
            <a href="/#pricing" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Pricing</a>
            <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
            <a href="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Sign in</a>
            <a href="/subscribe" style={{ padding: "8px 20px", background: BLUE, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 2, fontFamily: SANS }}>Start free trial →</a>
          </div>
          {/* Mobile hamburger */}
          <div className="nav-mobile" style={{ alignItems: "center" }}>
            <MobileNav />
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px 56px" }}>
          <div className="hero-grid">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, marginBottom: 20, fontFamily: SANS }}>Ocean Intelligence Platform</div>
              <h1 style={{ fontSize: "clamp(40px, 8vw, 66px)", fontWeight: 700, letterSpacing: "-0.03em", color: WHITE, lineHeight: 1.05, margin: "0 0 24px", fontFamily: SERIF }}>
                Stop searching.<br />
                <span style={{ color: BLUE }}>Start knowing.</span>
              </h1>
              <p style={{ fontSize: "clamp(15px, 2.5vw, 17px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 12, maxWidth: 460, fontFamily: SANS }}>
                Tideline collates every significant ocean story, research report, and regulatory development — globally, daily, before 7am.
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginBottom: 36, maxWidth: 440, fontFamily: SANS }}>
                Built for NGO policy teams, ocean investors, corporate ESG analysts, and journalists who act on information rather than just consume it.
              </p>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <a href="/start" style={{ padding: "14px 32px", background: BLUE, color: WHITE, fontSize: 15, fontWeight: 700, borderRadius: 2, fontFamily: SANS, whiteSpace: "nowrap", display: "block" }}>Start reading free</a>
                <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: 3 }}>See today&apos;s edition →</a>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>14 days free · No credit card required</div>
            </div>

            {/* Live feed widget — hidden on mobile */}
            <div className="hero-widget" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.25)" }}>
              <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: SERIF }}>TIDELINE</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "livepulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em", fontFamily: SANS }}>LIVE</span>
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: MONO }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
              {[
                { src: "ISA",     srcType: "reg", topic: "Seabed Mining & ISA",        title: "ISA defers nodule mining code vote amid scientific uncertainty" },
                { src: "IUCN",    srcType: "ngo", topic: "Coral Reef Systems",          title: "44% of reef-building coral species now at risk of extinction" },
                { src: "Interpol",srcType: "reg", topic: "IUU Fishing & Enforcement",   title: "47 vessels detained across Pacific for illegal fishing violations" },
                { src: "WDC",     srcType: "ngo", topic: "Captivity & Welfare Law",     title: "SeaWorld announces final orca performance date" },
              ].map((item, i) => {
                const sc = SRC[item.srcType] || SRC.res;
                return (
                  <div key={i} style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, padding: "1px 7px", borderRadius: 2, fontFamily: SANS }}>{item.src}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>{item.topic}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.4, fontFamily: SERIF }}>{item.title}</div>
                  </div>
                );
              })}
              <a href="/start" style={{ display: "block", padding: "11px 16px", background: "rgba(29,111,164,0.12)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700, fontFamily: SANS }}>View full brief — 26 items today →</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: OFF_WHITE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div className="stats-grid">
            {[
              { num: "87+",  label: "Institutional sources monitored daily" },
              { num: "55",   label: "Intelligence topics tracked" },
              { num: "24/7", label: "Monitoring so you don't have to" },
              { num: "7am",  label: "Daily brief delivered" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : "none", padding: "28px 16px" }}>
                <div style={{ fontSize: "clamp(32px,5vw,44px)", fontWeight: 700, color: BLUE, fontFamily: MONO, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: TEXT_SEC, marginTop: 6, lineHeight: 1.4, fontFamily: SANS }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRACKERS ── */}
      <div style={{ padding: "72px 0", background: OFF_WHITE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
              <span style={{ display: "inline-block", width: 28, height: 2, background: BLUE }} />
              Live intelligence indicators
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 700, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Never miss a regulatory shift.</h2>
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0, maxWidth: 500, fontFamily: SANS }}>Tideline tracks the decisions that matter before they make the news.</p>
          </div>
          <div className="trackers-grid" style={{ marginBottom: 28 }}>
            {[
              { cat: "ISA · Seabed Mining",          title: "Nodule mining code vote",        status: "DEFERRED",  detail: "Next expected: Jul 2026", statusColor: "#e65100" },
              { cat: "Norway · Whaling & Hunting",   title: "Minke quota 2026",               status: "1,277",     detail: "↑ 12% vs 2025",          statusColor: RED      },
              { cat: "Global · Marine Protected Areas", title: "Ocean MPAs — global coverage",status: "9.61%",     detail: "Target: 30% by 2030",    statusColor: BLUE     },
              { cat: "UN · Ocean Governance",         title: "High Seas Treaty",              status: "IN FORCE",  detail: "Since Jan 17, 2026",     statusColor: GREEN    },
            ].map((card, i) => (
              <div key={i} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${card.statusColor}`, padding: "20px 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6, fontFamily: SANS }}>{card.cat}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 14, fontFamily: SERIF }}>{card.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 700, color: card.statusColor, fontFamily: MONO }}>{card.status}</span>
                  <span style={{ fontSize: 12, color: TEXT_SEC, fontFamily: SANS }}>{card.detail}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="/start" style={{ padding: "10px 24px", background: BLUE, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 2, fontFamily: SANS }}>See all indicators →</a>
            <span style={{ fontSize: 12, color: TEXT_SEC, fontFamily: SANS }}>Updated continuously. Pro subscribers receive instant alerts on status changes.</span>
          </div>
        </div>
      </div>

      {/* ── FOUNDER ── */}
      <div style={{ padding: "72px 0", borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div className="founder-grid">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: `4px solid ${BLUE}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LUKE_PHOTO} alt="Luke McMillan" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 4 }}>Luke McMillan</div>
              <div style={{ fontSize: 12, color: BLUE, fontWeight: 600, fontFamily: SANS }}>Ocean journalist, The Guardian, BBC Wildlife, Oceanographic Magazine · Head of Hunting &amp; Captivity, WDC · Founder, Ocean Rising, read across 100+ countries</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: BLUE, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
                <span style={{ display: "inline-block", width: 28, height: 2, background: BLUE }} />
                The ocean journalist who built the intelligence tool the sector was missing
              </div>
              <div style={{ fontSize: 64, fontFamily: SERIF, color: BLUE_LIGHT, lineHeight: 0.6, marginBottom: 16, userSelect: "none" }}>&ldquo;</div>
              <blockquote style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 700, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 24px", padding: 0, border: "none" }}>
                The intelligence I needed didn&apos;t exist. So I built it.
              </blockquote>
              <p style={{ fontSize: 15, color: TEXT_PRI, lineHeight: 1.8, marginBottom: 14, fontFamily: SANS }}>
                I&apos;ve spent two decades reporting on the ocean — from coral reef collapse in Madagascar to deep-sea mining disputes, blue economy investment, and international conservation policy. Writing for The Guardian, BBC Wildlife, and Oceanographic Magazine, I&apos;ve reported across every part of the sector Tideline serves.
              </p>
              <p style={{ fontSize: 15, color: TEXT_PRI, lineHeight: 1.8, marginBottom: 28, fontFamily: SANS }}>
                That reporting meant constant conversations with NGOs, investors, policy teams, and scientists — all of them making decisions based on what was happening in the ocean right now. The intelligence infrastructure they needed didn&apos;t exist. So I built it.
              </p>
              <a href="/start" style={{ padding: "12px 28px", background: BLUE, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 2, fontFamily: SANS, display: "inline-block" }}>Read today&apos;s brief →</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{ padding: "72px 0", borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 700, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Intelligence that pays for itself.</h2>
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0, fontFamily: SANS }}>One policy development caught early. One spill flagged before your comms team.</p>
          </div>
          <div className="pricing-grid">
            {[
              {
                name: "Professional", price: "£25", freq: "/month", highlight: true,
                features: ["Daily personalised brief", "All 55 intelligence topics", "Live regulatory indicators", "Intelligent search across all sources", "Breaking incident alerts", "14-day trial — no card required"],
                cta: "Begin 14-day trial", note: "No credit card required"
              },
              {
                name: "Institutional", price: "£199", freq: "/month", highlight: false,
                features: ["Everything in Professional", "Up to 5 team seats", "Slack & email integration", "Priority incident alerts", "Monthly briefing with Luke McMillan", "API access"],
                cta: "Contact us", note: "One seat costs less than two hours of a researcher's time per month."
              },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlight ? NAVY : WHITE, border: plan.highlight ? `2px solid ${BLUE}` : `1px solid ${BORDER}`, borderTop: `4px solid ${BLUE}`, padding: "28px 24px", position: "relative" }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -1, right: 0, background: BLUE, color: WHITE, fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.1em", fontFamily: SANS }}>RECOMMENDED</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,0.4)" : TEXT_SEC, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: SANS }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: "clamp(32px,6vw,42px)", fontWeight: 700, color: plan.highlight ? WHITE : NAVY, letterSpacing: "-0.04em", fontFamily: MONO }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.4)" : TEXT_TER, fontFamily: SANS }}>{plan.freq}</span>
                </div>
                <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.1)" : BORDER}`, paddingTop: 18, marginBottom: 20 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.75)" : TEXT_PRI, marginBottom: 10, lineHeight: 1.7, display: "flex", gap: 10, fontFamily: SANS }}>
                      <span style={{ color: BLUE, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <a href={plan.cta === "Contact us" ? "mailto:luke@tideline.io" : "/start"} style={{ display: "block", padding: "12px", background: plan.highlight ? BLUE : "transparent", border: `1.5px solid ${plan.highlight ? BLUE : BORDER}`, color: plan.highlight ? WHITE : NAVY, fontSize: 13, fontWeight: 700, borderRadius: 2, fontFamily: SANS, textAlign: "center" }}>{plan.cta}</a>
                <div style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,0.3)" : TEXT_TER, textAlign: "center", marginTop: 10, lineHeight: 1.5, fontFamily: SANS }}>{plan.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SIGNPOST ── */}
      <div style={{ background: OFF_WHITE, padding: "20px 20px", textAlign: "center", borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 13, color: TEXT_SEC, margin: "0 0 6px", fontFamily: SANS }}>More interested in ocean stories than policy intelligence?</p>
        <a href="https://oceanrising.substack.com" style={{ fontSize: 13, color: BLUE, fontWeight: 600, fontFamily: SANS }}>
          Ocean Rising — our free newsletter — covers the ocean world for everyone →
        </a>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{ padding: "72px 0", background: NAVY, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
              <span style={{ display: "inline-block", width: 28, height: 2, background: BLUE }} />
              Common questions
            </div>
          </div>
          <FAQAccordion />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 36, fontFamily: SANS, lineHeight: 1.7 }}>
            Still have questions?{" "}
            <a href="/subscribe" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Start your free trial</a>
            {" "}or{" "}
            <a href="mailto:luke@thetideline.co" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>get in touch</a>.
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: OFF_WHITE, padding: "18px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>TIDELINE</a>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <span key={l} style={{ fontSize: 12, color: TEXT_TER, cursor: "pointer", fontFamily: SANS }}>{l}</span>
            ))}
            <a href="#faq" style={{ fontSize: 12, color: TEXT_TER, fontFamily: SANS, textDecoration: "none" }}>FAQ</a>
            <span style={{ fontSize: 12, color: TEXT_TER, fontFamily: MONO }}>© 2026 · tideline.io</span>
          </div>
        </div>
      </div>
    </div>
  );
}
