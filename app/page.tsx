"use client";

import { useState, useEffect, useRef, CSSProperties } from "react";

/* ─── DESIGN TOKENS ─── */
const NAVY = "#0A1628";
const TEAL = "#1D9E75";
const TEAL_D = "#178a63";
const TEAL_BG = "rgba(29,158,117,.07)";
const TEAL_B = "rgba(29,158,117,.18)";
const AMBER = "#F9AB00";
const RED = "#D93025";
const BLUE = "#185FA5";
const WHITE = "#fff";
const SURF = "#F8F9FA";
const SURF2 = "#F1F3F4";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT = "#E8EAED";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const R8 = "8px";
const R12 = "12px";
const R16 = "16px";
const EL1 = "0 1px 2px 0 rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15)";
const EL2 = "0 1px 2px 0 rgba(60,64,67,.3),0 2px 6px 2px rgba(60,64,67,.15)";
const EL3 = "0 4px 8px 3px rgba(60,64,67,.15),0 1px 3px rgba(60,64,67,.3)";

/* ─── TICKER WORDS ─── */
const TICKER_WORDS = [
  "ocean and climate policy",
  "blue finance and investment",
  "maritime law and regulation",
  "ESG and climate disclosure",
  "marine and climate insurance",
  "ocean conservation",
  "shipping and port compliance",
  "ocean journalism and research",
  "climate and nature risk",
  "blue economy strategy",
  "international environmental law",
  "sustainable finance",
];

/* ─── SEGMENT DATA ─── */
interface SegFeature {
  icon: string;
  label: string;
  desc: string;
}
interface SegmentData {
  pain: string;
  hl: string;
  body: string;
  cta: string;
  features: SegFeature[];
}

const SEGMENTS: Record<string, SegmentData> = {
  ngo: {
    pain: "\u201CThe consultation closes Friday. I haven\u2019t started the response.\u201D",
    hl: "From deadline to submission. In hours.",
    body: "The workspace open on your OSPAR response. Sources saved from the feed. /ask querying the primary document. Generate Report producing a structured submission draft from your notes. Three days of work in three hours.",
    cta: "Try the workspace free",
    features: [
      { icon: "clock", label: "Deadline tracker", desc: "Every open consultation flagged in your calendar with days remaining. Never miss a response window." },
      { icon: "search", label: "Research agent", desc: "/ask queries treaty text, governing body decisions, and official consultation documents. Cited answers, primary sources only." },
      { icon: "doc", label: "Generate Report", desc: "Notes converted to a structured consultation response draft. Export to Word. Your name on it." },
      { icon: "feed", label: "Daily brief", desc: "What moved overnight across OSPAR, BBNJ, ISA, IMO, and 85 other sources. Ready before your working day starts." },
    ],
  },
  finance: {
    pain: "\u201CThe ISA vote was deferred. Three funds with seabed exposure found out after the market moved.\u201D",
    hl: "Know before the market does.",
    body: "Workspace open on an ISA Council brief. /ask querying official session documents for contractor exposure. Generate Report producing an investment committee briefing. Primary document analysis, not a news summary.",
    cta: "Start monitoring your watchlist",
    features: [
      { icon: "tracker", label: "Live regulatory trackers", desc: "ISA Mining, Blue Finance, BBNJ Treaty and 7 more. Each pulses when something moves. The ISA deferral in your feed before it hits the wire." },
      { icon: "connect", label: "Cross-tracker connections", desc: "The ISA deferral and BBNJ ratification are the same story. Tideline identifies the mechanism connecting developments across trackers." },
      { icon: "search", label: "Research agent", desc: "/ask queries ISA session documents, contractor liability provisions, and official regulatory publications. Primary documents, cited." },
      { icon: "doc", label: "Investment committee briefing", desc: "Notes to structured briefing in one click. Executive Summary, Key Developments, Implications. Export to Word." },
    ],
  },
  esg: {
    pain: "\u201CThe TNFD ocean guidance updated last quarter. Our board pack section was based on the previous version.\u201D",
    hl: "Never miss a compliance deadline.",
    body: "Compliance deadlines in your calendar with urgency alerts. /ask querying the TNFD framework text directly. Generate Report producing a board-ready section with full provenance trail, ready for sign-off.",
    cta: "See your compliance calendar",
    features: [
      { icon: "clock", label: "Compliance calendar", desc: "CSRD, TNFD, MARPOL Annex VI, IMO CII and every ocean-related compliance deadline. Urgency alerts when windows open." },
      { icon: "search", label: "Framework research", desc: "/ask queries TNFD guidance, CSRD technical standards, and official regulatory publications directly. No commentary, no guesswork." },
      { icon: "doc", label: "Board pack sections", desc: "Notes converted to board-ready sections with full provenance trail. Every claim sourced. Ready for sign-off and audit." },
      { icon: "feed", label: "Regulatory monitoring", desc: "Framework changes, consultation publications, and enforcement actions across CSRD, TNFD, and IMO shipping regulations." },
    ],
  },
  journalism: {
    pain: "\u201CThe story was the pattern across twelve enforcement actions. Six months to piece together manually.\u201D",
    hl: "Follow the entity, not just the story.",
    body: "Entity directory tracks every organisation, vessel, individual across all sources since launch. /ask pulling from primary ISA session records. The pattern that takes months manually takes an afternoon.",
    cta: "Search the entity archive",
    features: [
      { icon: "entity", label: "Entity directory", desc: "Every organisation, vessel, individual, and instrument tracked across all sources since launch. Search by entity, date range, or instrument." },
      { icon: "tracker", label: "Timeline research", desc: "The pattern across twelve enforcement actions in one afternoon. Every mention of an entity, chronologically, across all 89 sources." },
      { icon: "search", label: "Primary source access", desc: "/ask queries ISA session records, BBNJ Treaty Collection, IMO circulars, and official enforcement registers. Document-level citations." },
      { icon: "connect", label: "Cross-source connections", desc: "The Pacific bloc position shift that appeared across three ISA sessions before anyone reported it. Tideline surfaces the pattern." },
    ],
  },
};

/* ─── ICON MAP for segment feature panels ─── */
function SegIcon({ name }: { name: string }) {
  switch (name) {
    case "clock":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4.5l3 1.5" /></svg>);
    case "search":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5l4 4" /></svg>);
    case "doc":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="2" width="14" height="16" rx="2" /><path d="M7 7h6M7 11h6M7 15h4" /></svg>);
    case "feed":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="3" width="16" height="14" rx="2" /><path d="M6 8h8M6 12h5" /></svg>);
    case "tracker":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4l2.5 1.5" /><circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" /></svg>);
    case "connect":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="5" cy="5" r="2.5" /><circle cx="15" cy="15" r="2.5" /><circle cx="15" cy="5" r="2.5" /><path d="M7.2 6.8l5 2M7.2 7.5l5 5" /></svg>);
    case "entity":
      return (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="6" r="3" /><circle cx="14" cy="10" r="2" /><path d="M2 17c0-2.8 2.2-5 5-5h2M12 14c0-1.1.9-2 2-2s2 .9 2 2v3" /></svg>);
    default:
      return null;
  }
}

/* ─── BROWSER FRAME COMPONENT ─── */
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div style={{ background: WHITE, borderRadius: R16, boxShadow: `${EL3},0 8px 32px rgba(60,64,67,.12)`, overflow: "hidden", border: `1px solid ${BORDER}` }}>
      <div style={{ height: 44, background: SURF2, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840" }} />
        </div>
        <div style={{ flex: 1, margin: "0 12px", height: 28, background: WHITE, borderRadius: 14, display: "flex", alignItems: "center", padding: "0 12px", fontFamily: M, fontSize: 11, color: T4, border: `1px solid ${BORDER}`, gap: 7 }}>
          <svg style={{ opacity: 0.5, flexShrink: 0 }} width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="3.5" width="8" height="5.5" rx="1" stroke="#9AA0A6" strokeWidth="1" /><path d="M3.5 3.5V2.5a1.5 1.5 0 013 0v1" stroke="#9AA0A6" strokeWidth="1" /></svg>
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── KEYFRAMES (injected once) ─── */
const KEYFRAMES = `
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.15;transform:scale(.5)}}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes tickerIn{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes tickerOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-100%)}}
html{scroll-behavior:smooth}
`;

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  /* ── TICKER STATE ── */
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerOut, setTickerOut] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerOut(true);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % TICKER_WORDS.length);
        setTickerOut(false);
      }, 300);
    }, 2400);
    return () => clearInterval(iv);
  }, []);

  /* ── WHO TABS ── */
  const [activeTab, setActiveTab] = useState("ngo");
  const [segVisible, setSegVisible] = useState(true);
  const tabLabels: [string, string][] = [
    ["ngo", "NGO & Policy"],
    ["finance", "Investment & Finance"],
    ["esg", "ESG & Compliance"],
    ["journalism", "Journalism & Research"],
  ];

  function handleTab(key: string) {
    if (key === activeTab) return;
    setSegVisible(false);
    setTimeout(() => {
      setActiveTab(key);
      setSegVisible(true);
    }, 180);
  }

  /* ── SCROLL REVEAL ── */
  const revealRefs = useRef<(HTMLElement | null)[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const idx = revealRefs.current.indexOf(en.target as HTMLElement);
            if (idx >= 0) setRevealed((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.05 }
    );
    revealRefs.current.forEach((el) => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  function revealRef(i: number) {
    return (el: HTMLElement | null) => { revealRefs.current[i] = el; };
  }
  function revealStyle(i: number): CSSProperties {
    const on = revealed.has(i);
    return { opacity: on ? 1 : 0, transform: on ? "translateY(0)" : "translateY(14px)", transition: "opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1)" };
  }

  /* ── HERO ANIMATION BASE ── */
  const fuBase: CSSProperties = { opacity: 0, animation: "up .8s cubic-bezier(.16,1,.3,1) forwards" };

  const seg = SEGMENTS[activeTab];

  return (
    <div style={{ fontFamily: F, fontWeight: 400, color: T1, background: WHITE, WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* ━━━ NAV ━━━ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 64, background: WHITE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 40px", gap: 32, boxShadow: EL1 }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: "auto" }}>
          <div style={{ width: 32, height: 32, borderRadius: R8, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(29,158,117,.35)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" /><circle cx="8" cy="12" r="2.5" fill="white" /></svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: T1, letterSpacing: "-.025em" }}>Tideline</span>
        </a>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <a href="#s-feed" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>The platform</a>
          <a href="#s-workspace" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>The workspace</a>
          <a href="#s-who" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>Who it&apos;s for</a>
          <a href="#s-price" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: TEAL, textDecoration: "none", padding: "8px 16px", borderRadius: R8 }}>Log in</a>
          <a href="#s-price" style={{ fontFamily: F, fontSize: 14, fontWeight: 500, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: "10px 20px", cursor: "pointer", textDecoration: "none", letterSpacing: "-.01em", boxShadow: "0 1px 3px rgba(29,158,117,.4)" }}>Start free trial</a>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="hero-section" style={{ padding: "120px 80px 80px", background: WHITE, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* teal gradient top stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${TEAL},#34a853,${TEAL})`, backgroundSize: "200% 100%" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{ ...fuBase, animationDelay: ".18s", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-.04em", color: T1, marginBottom: 24 }}>
            The professional home for everyone<br />
            whose work is shaped by what<br />happens in the <span style={{ color: TEAL }}>ocean.</span>
          </h1>

          {/* Ticker */}
          <div style={{ ...fuBase, animationDelay: ".3s", display: "flex", alignItems: "center", gap: 0, marginBottom: 36, fontSize: "clamp(17px,2vw,22px)", fontWeight: 300, color: T3, flexWrap: "wrap", justifyContent: "center", lineHeight: 1.4 }}>
            <span style={{ marginRight: 10, whiteSpace: "nowrap", color: T2, fontWeight: 400 }}>Built for people who work in</span>
            <span style={{ display: "inline-block", overflow: "hidden", height: "1.4em", verticalAlign: "bottom" }}>
              <span
                style={{
                  display: "inline-block",
                  color: TEAL,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  animation: tickerOut ? "tickerOut .3s cubic-bezier(.4,0,1,1) forwards" : "tickerIn .45s cubic-bezier(.16,1,.3,1) forwards",
                }}
              >
                {TICKER_WORDS[tickerIdx]}
              </span>
            </span>
          </div>

          {/* CTA */}
          <div style={{ ...fuBase, animationDelay: ".58s", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
            <a href="#s-price" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: "14px 32px", cursor: "pointer", textDecoration: "none", letterSpacing: "-.01em", boxShadow: EL1 }}>Start free: no card required</a>
          </div>
          <p style={{ ...fuBase, animationDelay: ".58s", fontSize: 13, color: T4, marginBottom: 52 }}>14-day free trial. Cancel any time.</p>

          {/* Founding strip */}
          <div style={{ ...fuBase, animationDelay: ".72s", display: "inline-flex", alignItems: "center", gap: 14, background: WHITE, border: "1px solid rgba(249,171,0,.25)", borderRadius: R12, padding: "12px 20px", boxShadow: EL1 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, animation: "pulse 1.8s ease infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T2 }}>Founding member pricing closes <strong style={{ color: AMBER, fontWeight: 600 }}>30 April 2026</strong>: £29/month, locked for life</span>
            <a href="#s-price" style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: NAVY, background: AMBER, border: "none", borderRadius: R8, padding: "7px 14px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>Claim a spot →</a>
          </div>
        </div>
      </section>

      {/* ━━━ FEED ━━━ */}
      <section ref={revealRef(0)} style={{ ...revealStyle(0), background: SURF, padding: 80, borderTop: `1px solid ${BORDER}` }} id="s-feed">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="feed-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Feed</div>
              <h2 style={{ fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>Everything that matters, connected, before your day starts.</h2>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>89 primary sources. 10 live trackers. The ISA-BBNJ connection your individual sources never made: <strong style={{ fontWeight: 600, color: T1 }}>identified automatically every morning.</strong></p>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>Read it in the brief. Save stories to a project. Open the workspace and start building your document. <strong style={{ fontWeight: 600, color: T1 }}>You never have to leave.</strong></p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>89<span style={{ fontSize: 18 }}>+</span></div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: T4, marginTop: 3 }}>Primary sources</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>10</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: T4, marginTop: 3 }}>Live trackers</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>3–4<span style={{ fontSize: 18 }}>hrs</span></div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: T4, marginTop: 3 }}>Saved each week</div>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>The daily brief surfaces what you missed: synthesised across every source, with the connections no single outlet makes. The regulatory calendar keeps deadlines visible. The trackers pulse when something moves.</p>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3 }}>This is a <strong style={{ fontWeight: 600, color: T1 }}>live version of the platform</strong>: the feed below is the real Tideline interface.</p>
            </div>
          </div>
          <BrowserFrame url="thetideline.co/feed">
            <iframe className="feed-iframe" src="/embed/feed.html" style={{ width: "100%", height: 520, border: "none", display: "block" }} />
          </BrowserFrame>
        </div>
      </section>

      {/* ━━━ WORKSPACE ━━━ */}
      <section ref={revealRef(1)} style={{ ...revealStyle(1), padding: 80, background: WHITE, borderTop: `1px solid ${BORDER}` }} id="s-workspace">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="workspace-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Workspace</div>
              <h2 style={{ fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>The work looks like yours.<br />Because it is.</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Step 01 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: TEAL }}>01</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 3, letterSpacing: "-.01em" }}>Save sources to a project</div>
                    <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: T3 }}>Stories from the feed saved in one click. Sources panel slides open on the right with Insert buttons.</div>
                  </div>
                </div>
                {/* Step 02 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: TEAL }}>02</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 3, letterSpacing: "-.01em" }}>Query with /ask</div>
                    <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: T3 }}>Type /ask in your document. Tideline queries only primary governing body documents. Cited answers insert directly. No tabs, no copy-pasting.</div>
                  </div>
                </div>
                {/* Step 03 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: M, fontSize: 12, fontWeight: 600, color: TEAL }}>03</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 3, letterSpacing: "-.01em" }}>Generate and export</div>
                    <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: T3 }}>Hit Generate Report. Your notes become a structured draft. Edit it. Export to Word. Your name on it. Tideline invisible.</div>
                  </div>
                </div>
              </div>
              {/* Claim box */}
              <div style={{ background: NAVY, borderRadius: R16, padding: "24px 28px", marginTop: 28 }}>
                <div style={{ fontSize: 17, fontWeight: 300, color: "rgba(255,255,255,.6)", lineHeight: 1.55 }}>The consultation response that takes <strong style={{ color: WHITE, fontWeight: 600 }}>three days</strong> takes <em style={{ color: TEAL, fontStyle: "normal", fontWeight: 600 }}>three hours.</em></div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>The workspace below is the real Tideline interface: open on an OSPAR consultation response with 8 days until the deadline, a /ask query pulling from the primary OSPAR document, and a draft generating on the right.</p>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3 }}>Every person who works in ocean governance, climate policy, blue finance, or maritime law has a version of this deadline. <strong style={{ fontWeight: 600, color: T1 }}>Tideline is where you handle it.</strong></p>
            </div>
          </div>
          <BrowserFrame url="thetideline.co/workspace">
            <iframe className="workspace-iframe" src="/embed/workspace.html" style={{ width: "100%", height: 540, border: "none", display: "block" }} />
          </BrowserFrame>
        </div>
      </section>

      {/* ━━━ WHO USES IT ━━━ */}
      <section ref={revealRef(2)} style={{ ...revealStyle(2), background: SURF, padding: 80, borderTop: `1px solid ${BORDER}` }} id="s-who">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Who uses it</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 10 }}>Your world. Your output.</h2>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.7, color: T3, maxWidth: 500 }}>Same platform. The problem you bring and the document that comes out change depending on what you do.</p>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `2px solid ${BORDER}`, marginBottom: 44, overflowX: "auto" }}>
            {tabLabels.map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleTab(key)}
                style={{
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 500,
                  color: activeTab === key ? TEAL : T4,
                  background: "transparent",
                  border: "none",
                  padding: "12px 24px 14px",
                  cursor: "pointer",
                  position: "relative",
                  whiteSpace: "nowrap",
                  letterSpacing: "-.01em",
                  borderBottom: activeTab === key ? `2px solid ${TEAL}` : "2px solid transparent",
                  marginBottom: -2,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Segment content */}
          <div className="seg-content" style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: 48, alignItems: "start", opacity: segVisible ? 1 : 0, transform: segVisible ? "translateY(0)" : "translateY(6px)", transition: "opacity .28s ease,transform .28s ease" }}>
            <div>
              <div style={{ fontSize: 14, color: T4, fontStyle: "italic", borderLeft: `3px solid ${BLT}`, paddingLeft: 14, marginBottom: 20, lineHeight: 1.55 }}>{seg.pain}</div>
              <h3 style={{ fontSize: "clamp(20px,2.4vw,28px)", fontWeight: 700, letterSpacing: "-.035em", lineHeight: 1.1, color: T1, marginBottom: 12 }}>{seg.hl}</h3>
              <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 22 }}>{seg.body}</p>
              <a href="#s-price" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: TEAL, textDecoration: "none", padding: "8px 16px", borderRadius: R8, border: `1px solid ${TEAL_B}`, background: WHITE, boxShadow: EL1 }}>
                {seg.cta} <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
              </a>
            </div>
            {/* Feature panel */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 8, boxShadow: EL2 }}>
              <div className="fp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {seg.features.map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 20, background: SURF, borderRadius: R8 }}>
                    <div style={{ width: 38, height: 38, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SegIcon name={feat.icon} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginBottom: 4, letterSpacing: "-.01em" }}>{feat.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: T3 }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section ref={revealRef(3)} style={{ ...revealStyle(3), background: WHITE, padding: 80, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 52px" }}>
            <h2 style={{ fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>Everything in one place. You never have to leave.</h2>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3 }}>The feed. The workspace. The trackers. The brief. The research agent. The entity directory. One platform built for professionals whose work is shaped by what happens in the ocean and in the rooms where climate regulation is written.</p>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* The 7am brief — wide */}
            <div className="feat-wide" style={{ gridColumn: "span 2", background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="3" width="18" height="16" rx="2.5" /><path d="M6 8h10M6 12h7" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>The 7am brief</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>Every morning, what moved overnight across ocean governance, climate regulation, blue finance, and maritime enforcement. Synthesised from 89 primary sources across intergovernmental bodies, press, real-time conference reporting, and policy publications. Connections identified. Ready to read in five minutes.</div>
            </div>
            {/* Live trackers */}
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "rgba(24,95,165,.07)", border: "1px solid rgba(24,95,165,.18)", color: BLUE }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M11 7v5l3 2" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>Live trackers</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>10 live regulatory trackers: BBNJ Treaty, ISA Mining, IUU Enforcement, 30x30, IMO Shipping, Blue Finance and more. Each pulses when something moves. Your calendar shows deadlines before they bite.</div>
            </div>
            {/* Workspace */}
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="2" width="16" height="18" rx="2" /><path d="M7 7h8M7 11h8M7 15h5" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>Workspace</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>Save sources, annotate, draft. Consultation responses, board pack sections, research timelines, client briefings. Your output, your name on it. Tideline invisible.</div>
            </div>
            {/* Generate Report */}
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "rgba(249,171,0,.08)", border: "1px solid rgba(249,171,0,.2)", color: AMBER }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M8 11l2.5 2.5 4-4" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>Generate Report</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>Notes converted to a structured draft in one click: Executive Summary, Key Developments, Implications. Export to Word or PDF. Your name on it. Tideline does not appear.</div>
            </div>
            {/* Research agent */}
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: "rgba(24,95,165,.07)", border: "1px solid rgba(24,95,165,.18)", color: BLUE }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="6" /><path d="M14 14l5 5" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>Research agent</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>Type /ask anywhere in your document. Tideline queries only primary governing body documents: treaty text, ISA publications, IMO circulars, OSPAR official records. Cited answers. No journalism, no commentary. Unbroken provenance.</div>
            </div>
            {/* Entity directory — wide */}
            <div className="feat-wide" style={{ gridColumn: "span 2", background: SURF, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="3" /><circle cx="16" cy="16" r="3" /><circle cx="16" cy="6" r="3" /><path d="M8.8 7.5l4.7 2M8.8 8.5l4.7 5" /></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>Entity directory</div>
              <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>Every organisation, vessel, individual, and instrument tracked across all sources since launch. The pattern across twelve enforcement actions that takes six months manually takes an afternoon. Search by entity, date range, or instrument.</div>
            </div>
          </div>
          {/* Sources strip */}
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: R12, padding: "22px 28px", display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase" as const, color: TEAL, flexShrink: 0 }}>89 primary sources</div>
            <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: T4 }}>Tideline monitors intergovernmental bodies, legal databases, enforcement registers, climate frameworks, financial disclosures, specialist press, and real-time conference reporting. Every source rated before it enters the platform. Tier 1 sources (IMO, ISA, BBNJ Treaty Collection, OSPAR, IISD) are the only sources the research agent draws from. Tier 2 sources (Lloyd&apos;s List, Bloomberg Law, Reuters, FT where directly covering governance) feed the daily brief and trackers.</div>
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section ref={revealRef(4)} style={{ ...revealStyle(4), padding: 80, background: SURF, borderTop: `1px solid ${BORDER}` }} id="s-price">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase" as const, color: TEAL, marginBottom: 24 }}>Pricing</div>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {/* Founding member */}
            <div style={{ background: WHITE, border: "1px solid rgba(249,171,0,.3)", borderRadius: R16, padding: 28, boxShadow: EL2, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" as const, color: AMBER, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: AMBER, animation: "pulse 1.8s ease infinite" }} />
                Founding member
              </div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£29<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: "0" }}>/month</span></div>
              <div style={{ fontSize: 13, fontWeight: 300, color: T3, lineHeight: 1.5, margin: "7px 0 16px" }}>Not a discount. An identity. Full plan including the Workspace. Price never increases. Closes 30 April 2026.</div>
              <a href="#" style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", background: AMBER, color: NAVY, border: "none", borderRadius: R8, padding: "10px 22px", fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer", textDecoration: "none", boxShadow: EL1 }}>Claim a founding member spot →</a>
              <div style={{ fontFamily: M, fontSize: 11, color: T4, marginTop: 8 }}>No credit card · Cancel any time</div>
            </div>

            {/* Individual */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28, boxShadow: EL1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase" as const, color: T4, marginBottom: 10 }}>Individual</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£79<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: "0" }}>/month</span></div>
              <div style={{ fontSize: 14, fontWeight: 300, color: T3, margin: "7px 0 22px", lineHeight: 1.5 }}>For the professional who needs to know: and produce: before the working day starts.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                {[
                  "Full daily brief every morning",
                  "10 live trackers across ocean, climate and blue finance",
                  "Cross-tracker connections identified automatically",
                  "Workspace with /ask against primary sources only",
                  "Generate Report: notes to structured draft",
                  "Entity directory: every organisation, vessel, person",
                  "Export to Word and PDF",
                ].map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 300, color: T2, lineHeight: 1.45 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0, marginTop: 6 }} />
                    {feat}
                  </div>
                ))}
              </div>
              <a href="#" style={{ marginTop: "auto", display: "block", textAlign: "center", fontFamily: F, fontSize: 15, fontWeight: 600, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: 14, textDecoration: "none", cursor: "pointer", letterSpacing: "-.01em", boxShadow: EL1 }}>Start free: no card required</a>
              <div style={{ textAlign: "center", fontSize: 12, color: T4, marginTop: 8 }}>14-day free trial.</div>
            </div>

            {/* Team plan */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28, boxShadow: EL1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase" as const, color: T4, marginBottom: 10 }}>Team plan</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£399<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: "0" }}>/month</span></div>
              <div style={{ fontSize: 14, fontWeight: 300, color: T3, margin: "7px 0 22px", lineHeight: 1.5 }}>For organisations where the intelligence needs to outlast any one person. Shared projects, shared workspace, shared memory.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                {[
                  "Everything in Individual",
                  "10 seats, each with their own projects and workspace",
                  "Shared projects: annotations, saved sources, research",
                  "Institutional memory stays when people leave",
                  "Unlimited Research and /ask queries",
                  "Reports with full provenance trail for sign-off",
                  "Priority support",
                ].map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 300, color: T2, lineHeight: 1.45 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0, marginTop: 6 }} />
                    {feat}
                  </div>
                ))}
              </div>
              <a href="#" style={{ marginTop: "auto", display: "block", textAlign: "center", fontFamily: F, fontSize: 15, fontWeight: 600, background: WHITE, color: TEAL, border: `1.5px solid ${TEAL}`, borderRadius: R8, padding: 14, textDecoration: "none", cursor: "pointer", letterSpacing: "-.01em", boxShadow: "none" }}>Talk to us about team plans</a>
              <div style={{ textAlign: "center", fontSize: 12, color: T4, marginTop: 8 }}>14-day free trial. No card required.</div>
            </div>
          </div>

          {/* Alts */}
          <div style={{ paddingTop: 20, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 300, color: T3 }}>NGO or academic? <a href="#" style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}>50% off, apply here</a></div>
            <div style={{ fontSize: 14, fontWeight: 300, color: T3 }}>Need more than 10 seats? <a href="#" style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}>Talk to us about enterprise pricing</a></div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: "32px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T3, letterSpacing: "-.02em" }}>Tideline</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href="#s-feed" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>The platform</a>
          <a href="#s-workspace" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>The workspace</a>
          <a href="#s-who" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Who it&apos;s for</a>
          <a href="#s-price" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Pricing</a>
          <a href="#" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ fontSize: 13, color: TEAL, textDecoration: "none" }}>Source methodology →</a>
        </div>
        <div style={{ fontSize: 12, color: T4 }}>© 2026 Tideline</div>
      </footer>

      {/* ━━━ RESPONSIVE OVERRIDES ━━━ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media(max-width:960px){
          nav{padding:0 20px !important;gap:12px !important}
          .nav-links{display:none !important}
          .hero-section{padding:88px 24px 60px !important}
          .hero-section ~ section{padding:60px 24px !important}
          .feed-grid,.workspace-grid,.seg-content{grid-template-columns:1fr !important;gap:32px !important}
          .feed-iframe{height:380px !important}
          .workspace-iframe{height:400px !important}
          footer{padding:24px !important;flex-direction:column !important}
          .pricing-grid{grid-template-columns:1fr !important}
        }
        @media(max-width:640px){
          .feat-grid{grid-template-columns:1fr !important}
          .feat-wide{grid-column:span 1 !important}
          .fp-grid{grid-template-columns:1fr !important}
        }
      `}} />
    </div>
  );
}
