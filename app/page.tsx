"use client";

import { useState } from "react";

// ── Design system (from MESSAGING_HOUSE.md) ──────────────────────────────────
const NAVY      = "#0B1D35";
const TEAL      = "#1D9E75";
const WHITE     = "#ffffff";
const OFF_WHITE = "#FAFAF7";
const INK       = "#111827";
const BORDER    = "rgba(0,0,0,0.08)";
const MUTED     = "#64748b";
const TEXT_TER  = "#94a3b8";
const SANS      = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF     = "'Instrument Serif', Georgia, serif";
const MONO      = "'DM Mono', monospace";
const RED       = "#d32f2f";
const GREEN     = "#2e7d32";

const LUKE_PHOTO = "https://substackcdn.com/image/fetch/$s_!A-7H!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd4e131cc-7392-4ae8-8a40-5d8a8b4498a6_2550x2550.png";

const SRC: Record<string, { bg: string; color: string }> = {
  reg: { bg: "#e8f2f9", color: "#1d6fa4" },
  res: { bg: "#eaf3de", color: "#2D6A0A" },
  ngo: { bg: "#f0eef9", color: "#4A3F8C" },
  gov: { bg: "#fff3e0", color: "#7A4500" },
};

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
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: NAVY, borderTop: "1px solid rgba(255,255,255,0.08)", zIndex: 200, padding: "8px 0 16px" }}>
          {[
            { label: "The Brief", href: "/platform/feed" },
            { label: "Trackers", href: "/tracker/bbnj" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Sign in", href: "/login" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "13px 24px", color: "rgba(255,255,255,0.75)", fontSize: 15, fontFamily: SANS, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {item.label}
            </a>
          ))}
          <div style={{ padding: "16px 24px 0" }}>
            <a href="/subscribe" style={{ display: "block", padding: "13px", background: TEAL, color: WHITE, fontSize: 14, fontWeight: 700, borderRadius: 4, fontFamily: SANS, textAlign: "center", textDecoration: "none" }}>Start free trial</a>
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
      a: "No contract. No minimum term. Cancel any time from your account settings. No emails, no phone calls, no questions asked.",
    },
    {
      q: "What does Tideline actually cover?",
      a: "More than 80 hand-curated sources across 31 ocean subject areas, spanning coral reef science, deep-sea mining regulation, IUU fishing enforcement, blue finance, and international ocean governance. Selected by an ocean journalist. Not an algorithm.",
    },
    {
      q: "How is this different from Google Alerts or free news sites?",
      a: "Google Alerts gives you volume. Tideline gives you signal. Free news covers what happened. Tideline covers what is moving: regulatory decisions, scientific preprints, NGO briefings, parliamentary records, and institutional databases that do not surface in mainstream coverage. Curated by an ocean journalist with two decades in the sector, delivered as it breaks.",
    },
    {
      q: "Do you sell or share subscriber data?",
      a: "Never. Your data is used solely to deliver your Tideline subscription. It is not sold, shared, or used for advertising.",
    },
  ];
  return (
    <div>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16, minHeight: 44 }}
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
    <div style={{ fontFamily: SANS, color: INK, background: WHITE }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        a { text-decoration: none; color: inherit; }

        .hero-grid { display: grid; grid-template-columns: 1fr 400px; gap: 72px; align-items: center; }
        .founder-grid { display: grid; grid-template-columns: 240px 1fr; gap: 72px; align-items: start; }
        .segments-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .trackers-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .nav-desktop { display: flex; }
        .nav-mobile { display: none; }
        .hero-widget { display: block; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .hero-widget { display: block; width: 100%; }
          .founder-grid { grid-template-columns: 1fr; gap: 32px; text-align: center; }
          .segments-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          .trackers-grid { grid-template-columns: 1fr; }
          .hero-widget { display: none; }
        }
      `}</style>

      {/* ── NAV ── */}
      <div style={{ background: NAVY, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "relative" }}>
          <a href="/" style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 400, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1 }}>Tideline</span>
            <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: MONO, marginTop: 2 }}>OCEAN INTELLIGENCE</span>
          </a>
          <div className="nav-desktop" style={{ alignItems: "center", gap: 28 }}>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Trackers</a>
            <a href="/tracker/governance" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Governance</a>
            <a href="/#founder" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>About</a>
            <a href="/#pricing" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Pricing</a>
          </div>
          <div className="nav-desktop" style={{ alignItems: "center", gap: 16 }}>
            <a href="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: SANS }}>Sign in</a>
            <a href="/subscribe" style={{ padding: "8px 20px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: SANS }}>Free trial</a>
          </div>
          <div className="nav-mobile" style={{ alignItems: "center" }}>
            <MobileNav />
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 20px 64px" }}>
          <div className="hero-grid">
            <div>
              <h1 style={{ fontSize: "clamp(42px, 8vw, 72px)", fontWeight: 400, letterSpacing: "-0.03em", color: WHITE, lineHeight: 1.1, margin: "0 0 28px", fontFamily: SERIF }}>
                The brief.<br />
                The trackers.<br />
                <span style={{ color: TEAL }}>The edge.</span>
              </h1>
              <p style={{ fontSize: "clamp(15px, 2.5vw, 17px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, fontFamily: SANS }}>
                The ocean space moves fast. Tideline tracks everything that matters across governance, regulation, finance and policy. So you are never the professional who missed it.
              </p>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <a href="/subscribe" style={{ padding: "14px 32px", background: TEAL, color: WHITE, fontSize: 15, fontWeight: 700, borderRadius: 4, fontFamily: SANS, display: "block" }}>Start free trial</a>
                <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: 3 }}>View trackers</a>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: SANS }}>14 days free. No credit card required.</div>
            </div>

            {/* Live feed card */}
            <div className="hero-widget" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#0A1628", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "livepulse 1.5s ease-in-out infinite" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: "0.12em", fontFamily: MONO }}>LIVE</span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", fontFamily: MONO }}>NOW</span>
              </div>
              {[
                { time: "3m",  tag: "Seabed Mining",           title: "ISA defers nodule mining code vote amid scientific uncertainty" },
                { time: "17m", tag: "Coral Reefs",              title: "44% of reef-building coral species now at risk of extinction" },
                { time: "42m", tag: "IUU Fishing",              title: "47 vessels detained across Pacific for illegal fishing violations" },
                { time: "1h",  tag: "Shipping",                 title: "MEPC 84 adopts revised GHG strategy with 2030 interim targets" },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: MONO }}>{item.time}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: TEAL, fontFamily: MONO, letterSpacing: "0.04em" }}>{item.tag}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.45, fontFamily: SANS }}>{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }} className="segments-grid">
          {[
            { num: "80+", label: "Curated institutional sources" },
            { num: "31", label: "Ocean intelligence topics" },
            { num: "10", label: "Governance bodies tracked" },
            { num: "Daily", label: "Briefing to your inbox" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: i < 3 ? `1px solid ${BORDER}` : "none", padding: "28px 16px" }}>
              <div style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 700, color: TEAL, fontFamily: MONO, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.4, fontFamily: SANS }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRACKERS ── */}
      <div style={{ padding: "72px 0", background: OFF_WHITE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
              <span style={{ display: "inline-block", width: 28, height: 2, background: TEAL }} />
              Live trackers
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 10px" }}>The decisions that move before the news does.</h2>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, maxWidth: 500, fontFamily: SANS }}>Tideline tracks regulatory shifts in real time. Not after the fact.</p>
          </div>
          <div className="trackers-grid" style={{ marginBottom: 28 }}>
            {[
              { cat: "ISA · Seabed Mining",             title: "Nodule mining code vote",         status: "DEFERRED",  detail: "Next expected: Jul 2026", statusColor: "#e65100" },
              { cat: "Norway · Whaling & Hunting",      title: "Minke quota 2026",                status: "1,277",     detail: "Up 12% vs 2025",         statusColor: RED      },
              { cat: "Global · Marine Protected Areas",  title: "Ocean MPA coverage",              status: "9.61%",     detail: "Target: 30% by 2030",    statusColor: TEAL     },
              { cat: "UN · Ocean Governance",            title: "High Seas Treaty (BBNJ)",         status: "IN FORCE",  detail: "Since 17 Jan 2026",      statusColor: GREEN    },
            ].map((card, i) => (
              <div key={i} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${card.statusColor}`, padding: "20px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6, fontFamily: MONO }}>{card.cat}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 14, fontFamily: SERIF }}>{card.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 700, color: card.statusColor, fontFamily: MONO }}>{card.status}</span>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>{card.detail}</span>
                </div>
              </div>
            ))}
          </div>
          <a href="/tracker/bbnj" style={{ padding: "10px 24px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: SANS, display: "inline-block" }}>View trackers</a>
        </div>
      </div>

      {/* ── WHO IT IS FOR ── */}
      <div style={{ padding: "72px 0", borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
              <span style={{ display: "inline-block", width: 28, height: 2, background: TEAL }} />
              Who Tideline is for
            </div>
          </div>
          <div className="segments-grid">
            {[
              { title: "ESG Analyst", pain: "Never caught out on an ocean disclosure again.", line: "Tideline maps ocean governance developments directly to TNFD and CSRD disclosure requirements. So your filings reflect what actually happened." },
              { title: "Policy Officer", pain: "Always the most informed person in the room.", line: "Every governance development, treaty update and regulatory shift tracked in one place. So you walk into every meeting knowing more than anyone else at the table." },
              { title: "Maritime Lawyer", pain: "Research that took hours. Now takes seconds.", line: "Ask the Intelligence Agent any ocean governance question and get a cited, verified answer from a structured database. At \u00A3300 an hour, it pays for itself in the first query." },
              { title: "Ocean Investor", pain: "See where capital is moving before anyone else does.", line: "The Blue Finance Monitor tracks every blue bond, debt swap and development finance commitment across the ocean economy. Months before it becomes conventional wisdom." },
              { title: "Shipping Company", pain: "Know every regulatory development that affects your fleet.", line: "From IMO decisions to port state control updates to IUU enforcement actions. Tideline tracks the regulatory environment your operations depend on." },
              { title: "Ocean Journalist", pain: "Find the story hiding in the governance data.", line: "Cross-reference ISA contractor decisions with blue finance flows. Find the pattern in 18 months of ratification data. Tideline turns governance data into investigative leads." },
            ].map((seg, i) => (
              <div key={i} style={{ background: OFF_WHITE, border: `1px solid ${BORDER}`, padding: "24px", borderLeft: `3px solid ${TEAL}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: SANS, marginBottom: 4 }}>{seg.title}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, fontFamily: SERIF, marginBottom: 10, lineHeight: 1.3 }}>{seg.pain}</div>
                <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS, lineHeight: 1.7 }}>{seg.line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOUNDER ── */}
      <div id="founder" style={{ padding: "72px 0", borderBottom: `1px solid ${BORDER}`, background: OFF_WHITE }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div className="founder-grid">
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: `4px solid ${TEAL}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LUKE_PHOTO} alt="Luke McMillan" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 400, color: NAVY, fontFamily: SERIF, marginBottom: 4 }}>Luke McMillan</div>
              <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: SANS }}>Ocean journalist. The Guardian, BBC Wildlife, Oceanographic Magazine.</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: TEAL, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
                <span style={{ display: "inline-block", width: 28, height: 2, background: TEAL }} />
                Built by the journalist who covers this beat.
              </div>
              <blockquote style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 24px", padding: 0, border: "none" }}>
                The intelligence I needed didn&apos;t exist. So I built it.
              </blockquote>
              <p style={{ fontSize: 15, color: INK, lineHeight: 1.8, marginBottom: 14, fontFamily: SANS }}>
                Two decades reporting on the ocean. From coral reef collapse in Madagascar to deep-sea mining disputes, blue economy investment, and international conservation policy. Writing for The Guardian, BBC Wildlife, and Oceanographic Magazine across every part of the sector Tideline serves.
              </p>
              <p style={{ fontSize: 15, color: INK, lineHeight: 1.8, marginBottom: 28, fontFamily: SANS }}>
                That reporting meant constant conversations with NGOs, investors, policy teams, and scientists. All of them making decisions based on what was happening in the ocean right now. The intelligence infrastructure they needed did not exist. So I built it.
              </p>
              <a href="/subscribe" style={{ padding: "12px 28px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: SANS, display: "inline-block" }}>Start free trial</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{ padding: "72px 0", borderBottom: `1px solid ${BORDER}`, background: WHITE }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 12, fontFamily: SANS }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Choose your depth.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="segments-grid">
            {/* Individual */}
            <div style={{ background: NAVY, borderTop: `4px solid ${TEAL}`, padding: "32px 28px", position: "relative" }}>
              <div style={{ position: "absolute", top: -1, right: 0, background: TEAL, color: WHITE, fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.1em", fontFamily: SANS }}>RECOMMENDED</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: SANS }}>Individual</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: "clamp(32px,6vw,42px)", fontWeight: 700, color: WHITE, letterSpacing: "-0.04em", fontFamily: MONO }}>£79</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>/month</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 18, marginBottom: 24 }}>
                {["Daily personalised brief", "All 31 intelligence topics", "Live regulatory trackers", "Intelligence Agent search", "Treaty and governance calendar", "14-day free trial"].map(f => (
                  <div key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 10, lineHeight: 1.7, display: "flex", gap: 10, fontFamily: SANS }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <a href="/subscribe" style={{ display: "block", padding: "12px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: SANS, textAlign: "center" }}>Start free trial</a>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 10, fontFamily: SANS }}>No credit card required to start.</div>
            </div>
            {/* Enterprise */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid ${TEAL}`, padding: "32px 28px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: SANS }}>Enterprise</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: "clamp(32px,6vw,42px)", fontWeight: 700, color: NAVY, letterSpacing: "-0.04em", fontFamily: MONO }}>£389</span>
                <span style={{ fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>/month</span>
              </div>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 18, marginBottom: 24 }}>
                {["Everything in Individual", "Up to 5 team seats", "Slack and email integration", "Priority incident alerts", "Monthly briefing with Luke McMillan", "API access"].map(f => (
                  <div key={f} style={{ fontSize: 13, color: INK, marginBottom: 10, lineHeight: 1.7, display: "flex", gap: 10, fontFamily: SANS }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <a href="mailto:luke@thetideline.co" style={{ display: "block", padding: "12px", background: "transparent", border: `1.5px solid ${BORDER}`, color: NAVY, fontSize: 13, fontWeight: 700, borderRadius: 4, fontFamily: SANS, textAlign: "center" }}>Contact sales</a>
              <div style={{ fontSize: 11, color: TEXT_TER, textAlign: "center", marginTop: 10, fontFamily: SANS }}>One seat costs less than two hours of a researcher's time per month.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{ padding: "72px 0", background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontFamily: SANS }}>
              <span style={{ display: "inline-block", width: 28, height: 2, background: TEAL }} />
              Common questions
            </div>
          </div>
          <FAQAccordion />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 36, fontFamily: SANS, lineHeight: 1.7 }}>
            Still have questions?{" "}
            <a href="/subscribe" style={{ color: TEAL, fontWeight: 600, textDecoration: "none" }}>Start free trial</a>
            {" "}or{" "}
            <a href="mailto:luke@thetideline.co" style={{ color: TEAL, fontWeight: 600, textDecoration: "none" }}>get in touch</a>.
          </p>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ background: "#112236", padding: "clamp(56px,10vw,96px) 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(32px,6vw,42px)", fontWeight: 400, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 20px" }}>
            The ocean space moves fast.<br />Tideline moves faster.
          </h2>
          <p style={{ fontSize: "clamp(15px,2.5vw,17px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 36, fontFamily: SANS }}>
            Governance, regulation, finance and policy. Tracked. Structured. Delivered.
          </p>
          <a href="/subscribe" style={{ padding: "14px 32px", background: TEAL, color: WHITE, fontSize: 15, fontWeight: 700, borderRadius: 4, fontFamily: SANS, display: "inline-block" }}>Start free trial</a>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: SANS, marginTop: 16 }}>14 days free. No credit card required.</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: OFF_WHITE, padding: "18px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 400, color: NAVY, fontFamily: SERIF }}>Tideline</a>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <span key={l} style={{ fontSize: 12, color: TEXT_TER, cursor: "pointer", fontFamily: SANS }}>{l}</span>
            ))}
            <a href="#faq" style={{ fontSize: 12, color: TEXT_TER, fontFamily: SANS, textDecoration: "none" }}>FAQ</a>
            <span style={{ fontSize: 12, color: TEXT_TER, fontFamily: MONO }}>© 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
