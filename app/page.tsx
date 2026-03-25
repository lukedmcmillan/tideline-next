"use client";

import { useState, useEffect } from "react";

const NAVY      = "#0B1D35";
const TEAL      = "#1D9E75";
const WHITE     = "#ffffff";
const OFF_WHITE = "#F5F4EF";
const INK       = "#111827";
const MUTED     = "#64748b";
const TEXT_TER  = "#94a3b8";
const AMBER     = "#d97706";
const SANS      = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF     = "'Instrument Serif', Georgia, serif";
const MONO      = "'DM Mono', monospace";

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
        <div style={{ position: "absolute", top: 64, left: 0, right: 0, background: NAVY, borderTop: "1px solid rgba(255,255,255,0.06)", zIndex: 200, padding: "8px 0 16px" }}>
          {[
            { label: "Trackers", href: "/tracker/bbnj" },
            { label: "Governance", href: "/tracker/governance" },
            { label: "About", href: "/#founder" },
            { label: "Pricing", href: "/#pricing" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "13px 24px", color: "rgba(255,255,255,0.6)", fontSize: 15, fontFamily: SANS, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {item.label}
            </a>
          ))}
          <div style={{ padding: "16px 24px 0" }}>
            <a href="/subscribe" style={{ display: "block", padding: "13px", background: TEAL, color: WHITE, fontSize: 14, fontWeight: 600, borderRadius: 4, fontFamily: SANS, textAlign: "center", textDecoration: "none" }}>Free trial</a>
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
    { q: "Is there a contract or minimum commitment?", a: "No contract. No minimum term. Cancel any time from your account settings. No emails, no phone calls, no questions asked." },
    { q: "What does Tideline actually cover?", a: "More than 80 hand-curated sources across 31 ocean subject areas, spanning coral reef science, deep-sea mining regulation, IUU fishing enforcement, blue finance, and international ocean governance. Selected by an ocean journalist. Not an algorithm." },
    { q: "How is this different from Google Alerts or free news sites?", a: "Google Alerts gives you volume. Tideline gives you signal. Free news covers what happened. Tideline covers what is moving: regulatory decisions, scientific preprints, NGO briefings, parliamentary records, and institutional databases that do not surface in mainstream coverage. Curated by an ocean journalist with two decades in the sector, delivered as it breaks." },
    { q: "Do you sell or share subscriber data?", a: "Never. Your data is used solely to deliver your Tideline subscription. It is not sold, shared, or used for advertising." },
  ];
  return (
    <div>
      {faqs.map((faq, i) => (
        <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16, minHeight: 44 }}>
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

// ── Tracker card ──────────────────────────────────────────────────────────
function TrackerCard({ t }: { t: any }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? WHITE : OFF_WHITE, border: `1px solid ${hov ? TEAL : "#e5e7eb"}`, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", transition: "all 0.15s ease", cursor: "pointer", flex: "0 0 auto" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, fontFamily: MONO, marginBottom: 6 }}>{t.cat}</div>
      <div style={{ fontSize: 15, fontWeight: 400, color: NAVY, fontFamily: SERIF, lineHeight: 1.3, marginBottom: 10, flex: 1 }}>{t.name}</div>
      {t.statusType === "number" ? (
        <div style={{ fontSize: 26, fontWeight: 400, color: TEAL, fontFamily: SERIF, marginBottom: 4 }}>{t.statusValue}</div>
      ) : (
        <div style={{ fontSize: 12, fontWeight: 700, color: t.statusColor, fontFamily: MONO, letterSpacing: "0.04em", marginBottom: 4 }}>{t.statusValue}</div>
      )}
      <div style={{ fontSize: 11, color: TEXT_TER, fontFamily: SANS, lineHeight: 1.5, marginBottom: 10 }}>{t.context}</div>
      {t.progress !== null && (
        <div style={{ height: 2, background: "#e5e7eb", borderRadius: 1, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${t.progress}%`, background: TEAL, borderRadius: 1 }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f0f0ed" }}>
        <span style={{ fontSize: 9, color: TEXT_TER, fontFamily: MONO }}>{t.updated}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "livepulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, fontFamily: MONO }}>Live</span>
        </span>
      </div>
    </div>
  );
}

const TRACKERS = [
  { cat: "UN \u00b7 Ocean Governance", name: "High Seas Treaty (BBNJ)", statusType: "text", statusValue: "IN FORCE", statusColor: TEAL, context: "84 / 155 parties ratified", progress: 54, updated: "Updated today" },
  { cat: "ISA \u00b7 Seabed Mining", name: "Deep-Sea Mining Decisions", statusType: "text", statusValue: "DEFERRED", statusColor: AMBER, context: "Nodule mining code \u00b7 Next: Jul 2026", progress: null, updated: "Updated 2 days ago" },
  { cat: "Interpol \u00b7 IUU Fishing", name: "IUU Fishing Enforcement", statusType: "number", statusValue: "47", statusColor: TEAL, context: "Vessels detained this quarter", progress: null, updated: "Updated today" },
  { cat: "Global \u00b7 Marine Protected Areas", name: "30x30 Ocean Protection", statusType: "number", statusValue: "9.61%", statusColor: TEAL, context: "Target: 30% by 2030", progress: 32, updated: "Updated this week" },
  { cat: "Finance \u00b7 Ocean Capital", name: "Blue Finance Monitor", statusType: "number", statusValue: "$4.2bn", statusColor: TEAL, context: "Tracked this year \u00b7 23 instruments", progress: null, updated: "Updated today" },
  { cat: "IMO \u00b7 Shipping", name: "Shipping Decarbonisation", statusType: "text", statusValue: "MEPC 84 \u00b7 Jun 2026", statusColor: MUTED, context: "GHG strategy review pending", progress: null, updated: "Updated 3 days ago" },
  { cat: "IWC \u00b7 Cetacean Policy", name: "Whaling and Cetacean Policy", statusType: "number", statusValue: "1,277", statusColor: TEAL, context: "Minke quota 2026 \u00b7 Up 12% vs 2025", progress: null, updated: "Updated this week" },
  { cat: "Finance \u00b7 Carbon Markets", name: "Ocean Carbon Markets", statusType: "text", statusValue: "DEVELOPING", statusColor: MUTED, context: "Blue carbon issuances tracked", progress: null, updated: "Updated this week" },
  { cat: "Licensing \u00b7 Spatial Planning", name: "Marine Spatial Planning", statusType: "number", statusValue: "34", statusColor: TEAL, context: "Licences issued this quarter", progress: null, updated: "Updated this week" },
  { cat: "Arctic Council \u00b7 Governance", name: "Arctic Governance", statusType: "text", statusValue: "ACTIVE", statusColor: TEAL, context: "Shipping routes and resource rights", progress: null, updated: "Updated this week" },
];

const SEGMENTS = [
  { who: "ESG Analyst \u00b7 Shipping / Asset Management", pain: "Never caught out on an ocean disclosure again.", body: "Your TNFD report is due. The ISA made a decision six weeks ago that materially affects your ocean-related disclosures. You did not know. Your legal team did not know. Your auditor is asking questions you cannot answer. Tideline maps every governance development directly to your disclosure obligations - before your filing deadline, not after." },
  { who: "Policy Officer \u00b7 NGO / Intergovernmental", pain: "Always the most informed person in the room.", body: "The funder asks what happened at the last ISA Council session. The minister asks where BBNJ implementation stands. The journalist asks about the 30x30 numbers. The worst moment in any policy professional\u2019s career is not having the answer. Tideline means you always do." },
  { who: "Maritime Lawyer \u00b7 Compliance Consultant", pain: "The answer in 30 seconds. Not three hours.", body: "Your client emails at 8am asking about MARPOL enforcement trends in the Pacific. You bill at \u00A3300 an hour. The answer exists in Tideline\u2019s database. Search it, read the cited source, send the reply. That is not a convenience. That is a business model." },
  { who: "VC \u00b7 Ocean Investor", pain: "The deal you almost missed.", body: "Blue carbon credits. Sovereign debt swaps. Development bank ocean commitments. The patterns that predict where institutional capital moves next are in the data - if you can see the data six months before it becomes a Bloomberg headline. Your competitors are reading the same public announcements. You are reading the pattern underneath them." },
  { who: "Shipping Company \u00b7 Ocean Industry", pain: "The regulation you did not see coming.", body: "IMO announces a sulphur compliance change. A port state control directive takes effect. An ISA decision reshapes contractor obligations. Each one has operational and financial consequences for your fleet. The companies that know first adapt first. The companies that find out last pay the most." },
  { who: "Ocean Journalist \u00b7 Researcher", pain: "The story was always in the data. You just could not see it.", body: "Fourteen ISA contractors received exploration licences in the last 18 months. Six received blue finance commitments from the same development bank. Three are registered in the same jurisdiction. That is not a coincidence. That is a story. Tideline found it in 40 seconds. Your competitors will find it in six months." },
];

// ── Main ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [live, setLive] = useState<any>(null);

  useEffect(() => {
    fetch("/api/landing-data")
      .then(r => r.json())
      .then(setLive)
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: SANS, color: INK, background: WHITE }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        a { text-decoration: none; color: inherit; }
        .tracker-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
        .segment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .nav-centre { display: flex; }
        .nav-mobile { display: none; }
        @media (max-width: 900px) {
          .tracker-grid { grid-template-columns: repeat(2,1fr); }
          .segment-grid { grid-template-columns: 1fr; }
          .nav-centre { display: none !important; }
          .nav-cta-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          .section-pad { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <div style={{ background: NAVY, position: "sticky", top: 0, zIndex: 100 }}>
        <div className="section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "relative" }}>
          <a href="/" style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 400, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1 }}>Tideline</span>
            <span style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: MONO, marginTop: 2 }}>OCEAN INTELLIGENCE</span>
          </a>
          <div className="nav-centre" style={{ alignItems: "center", gap: 28 }}>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, fontFamily: SANS }}>Trackers</a>
            <a href="/tracker/governance" style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, fontFamily: SANS }}>Governance</a>
            <a href="/#founder" style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, fontFamily: SANS }}>About</a>
            <a href="/#pricing" style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, fontFamily: SANS }}>Pricing</a>
          </div>
          <a href="/subscribe" className="nav-cta-desktop" style={{ padding: "8px 20px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 600, borderRadius: 4, fontFamily: SANS }}>Free trial</a>
          <div className="nav-mobile" style={{ alignItems: "center" }}>
            <MobileNav />
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div className="section-pad" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "9px 64px", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "livepulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>Breaking</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>{live?.ticker?.title || "Monitoring 80+ institutional sources across 31 ocean topics"}</strong>
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: MONO, marginLeft: "auto", flexShrink: 0 }}>{live?.ticker?.age || ""}</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: NAVY }}>
        <div className="section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 64px 128px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(52px, 8vw, 80px)", fontWeight: 400, letterSpacing: "-0.02em", color: WHITE, lineHeight: 1.0, margin: 0, fontFamily: SERIF }}>
            The brief. The trackers. <span style={{ color: TEAL }}>The edge.</span>
          </h1>
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.15)", margin: "36px auto" }} />
          <p style={{ fontSize: 19, fontWeight: 400, color: "rgba(255,255,255,0.38)", fontFamily: SERIF, fontStyle: "italic", margin: "0 0 20px", maxWidth: 580 }}>
            Read by professionals in shipping, ESG, maritime law and ocean policy.
          </p>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, maxWidth: 580, fontFamily: SANS, fontWeight: 300, margin: "0 0 40px" }}>
            The ocean space moves fast. Tideline tracks everything that matters across governance, regulation, finance and policy - so you are never the professional who missed it.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/subscribe" style={{ padding: "15px 32px", background: TEAL, color: WHITE, fontSize: 14, fontWeight: 600, borderRadius: 4, fontFamily: SANS, display: "inline-block" }}>Start free trial</a>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: "4px" }}>View trackers</a>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", fontFamily: MONO, marginTop: 12, lineHeight: 1.6 }}>{"\u00A3"}79/month after your 14-day free trial. No card required to start.</div>
        </div>
      </div>

      {/* ── TRACKERS ── */}
      <div style={{ background: WHITE, padding: "76px 0" }}>
        <div className="section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ display: "inline-block", width: 28, height: 1, background: TEAL }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, fontFamily: MONO }}>Live trackers</span>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Live trackers. Updated daily.</h2>
            <p style={{ fontSize: 14, color: MUTED, fontFamily: SANS, margin: 0, maxWidth: 480 }}>Ten trackers covering every development that matters to ocean professionals.</p>
          </div>
          <div className="tracker-grid" style={{ marginBottom: 32 }}>
            {TRACKERS.map((t, i) => {
              // Wire BBNJ card to live data
              if (i === 0 && live?.trackers) {
                const lt = live.trackers;
                return <TrackerCard key={i} t={{
                  ...t,
                  context: `${lt.bbnj_ratified} / ${lt.bbnj_total} parties ratified`,
                  progress: lt.bbnj_progress,
                }} />;
              }
              return <TrackerCard key={i} t={t} />;
            })}
          </div>
          <a href="/tracker/bbnj" style={{ padding: "10px 24px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 600, borderRadius: 4, fontFamily: SANS, display: "inline-block" }}>View all trackers</a>
        </div>
      </div>

      {/* ── WHO IT IS FOR ── */}
      <div style={{ background: OFF_WHITE, padding: "76px 0" }}>
        <div className="section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ display: "inline-block", width: 28, height: 1, background: TEAL }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, fontFamily: MONO }}>Who it is for</span>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Never the professional who missed it.</h2>
            <p style={{ fontSize: 14, color: MUTED, fontFamily: SANS, fontStyle: "italic", margin: 0 }}>The ocean space does not wait for you to catch up.</p>
          </div>
          <div className="segment-grid">
            {SEGMENTS.map((seg, i) => (
              <div key={i} style={{ background: WHITE, border: "1px solid #e5e7eb", borderLeft: `3px solid ${TEAL}`, borderRadius: "0 8px 8px 0", padding: 22 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, fontFamily: MONO, marginBottom: 8 }}>{seg.who}</div>
                <div style={{ fontSize: 18, fontWeight: 400, color: NAVY, fontFamily: SERIF, lineHeight: 1.3, marginBottom: 10 }}>{seg.pain}</div>
                <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS, lineHeight: 1.7 }}>{seg.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{ background: WHITE, padding: "76px 0" }}>
        <div className="section-pad" style={{ maxWidth: 900, margin: "0 auto", padding: "0 64px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 12, fontFamily: MONO }}>Pricing</div>
            <h2 style={{ fontSize: 36, fontWeight: 400, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Choose your depth.</h2>
          </div>
          <div className="segment-grid">
            <div style={{ background: NAVY, borderTop: `4px solid ${TEAL}`, padding: "32px 28px", position: "relative", borderRadius: "0 0 8px 8px" }}>
              <div style={{ position: "absolute", top: -1, right: 0, background: TEAL, color: WHITE, fontSize: 9, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.1em", fontFamily: MONO }}>RECOMMENDED</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: MONO }}>Individual</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 42, fontWeight: 400, color: WHITE, fontFamily: SERIF }}>{"\u00A3"}79</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>/month</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18, marginBottom: 24 }}>
                {["Daily personalised brief", "All 31 intelligence topics", "Live regulatory trackers", "Intelligence Agent search", "Treaty and governance calendar", "14-day free trial"].map(f => (
                  <div key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 9, lineHeight: 1.7, display: "flex", gap: 10, fontFamily: SANS }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>{"\u2713"}</span> {f}
                  </div>
                ))}
              </div>
              <a href="/subscribe" style={{ display: "block", padding: "12px", background: TEAL, color: WHITE, fontSize: 13, fontWeight: 600, borderRadius: 4, fontFamily: SANS, textAlign: "center" }}>Start free trial</a>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 10, fontFamily: MONO }}>No card required to start.</div>
            </div>
            <div style={{ background: WHITE, border: "1px solid #e5e7eb", borderTop: `4px solid ${TEAL}`, padding: "32px 28px", borderRadius: "0 0 8px 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontFamily: MONO }}>Enterprise</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 42, fontWeight: 400, color: NAVY, fontFamily: SERIF }}>{"\u00A3"}389</span>
                <span style={{ fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>/month</span>
              </div>
              <div style={{ borderTop: `1px solid #e5e7eb`, paddingTop: 18, marginBottom: 24 }}>
                {["Everything in Individual", "Up to 5 team seats", "Slack and email integration", "Priority incident alerts", "Monthly briefing with Luke McMillan", "API access"].map(f => (
                  <div key={f} style={{ fontSize: 13, color: INK, marginBottom: 9, lineHeight: 1.7, display: "flex", gap: 10, fontFamily: SANS }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>{"\u2713"}</span> {f}
                  </div>
                ))}
              </div>
              <a href="mailto:luke@thetideline.co" style={{ display: "block", padding: "12px", background: "transparent", border: "1.5px solid #e5e7eb", color: NAVY, fontSize: 13, fontWeight: 600, borderRadius: 4, fontFamily: SANS, textAlign: "center" }}>Contact sales</a>
              <div style={{ fontSize: 11, color: TEXT_TER, textAlign: "center", marginTop: 10, fontFamily: MONO }}>One seat costs less than two hours of a researcher's time per month.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{ padding: "76px 0", background: NAVY }}>
        <div className="section-pad" style={{ maxWidth: 700, margin: "0 auto", padding: "0 64px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ display: "inline-block", width: 28, height: 1, background: TEAL }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, fontFamily: MONO }}>Common questions</span>
            </div>
          </div>
          <FAQAccordion />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 36, fontFamily: SANS, lineHeight: 1.7 }}>
            Still have questions?{" "}
            <a href="/subscribe" style={{ color: TEAL, fontWeight: 600, textDecoration: "none" }}>Start free trial</a>
            {" "}or{" "}
            <a href="mailto:luke@thetideline.co" style={{ color: TEAL, fontWeight: 600, textDecoration: "none" }}>get in touch</a>.
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: NAVY, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 0" }}>
        <div className="section-pad footer-row" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 64px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: MONO }}>TIDELINE {"\u00b7"} <span style={{ color: TEAL }}>Ocean Intelligence</span> {"\u00b7"} thetideline.co</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: MONO }}>Assembled from primary sources {"\u00b7"} Every answer cited</span>
        </div>
      </div>
    </div>
  );
}
