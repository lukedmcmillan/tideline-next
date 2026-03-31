"use client";

import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — extracted from tideline-landing-v15 reference
   ═══════════════════════════════════════════════════════════════════════ */
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
const F = "'DM Sans', system-ui, sans-serif";
const M = "'DM Mono', monospace";
const R8 = "8px";
const R12 = "12px";
const R16 = "16px";
const EL1 = "0 1px 2px 0 rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15)";
const EL2 = "0 1px 2px 0 rgba(60,64,67,.3),0 2px 6px 2px rgba(60,64,67,.15)";
const EL3 = "0 4px 8px 3px rgba(60,64,67,.15),0 1px 3px rgba(60,64,67,.3)";

/* ═══════════════════════════════════════════════════════════════════════
   TICKER
   ═══════════════════════════════════════════════════════════════════════ */
const TICKER_WORDS = [
  "ocean and climate policy", "blue finance and investment",
  "maritime law and regulation", "ESG and climate disclosure",
  "marine and climate insurance", "ocean conservation",
  "shipping and port compliance", "ocean journalism and research",
  "climate and nature risk", "blue economy strategy",
  "international environmental law", "sustainable finance",
];

function Ticker() {
  const [idx, setIdx] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setOut(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % TICKER_WORDS.length);
        setOut(false);
      }, 300);
    }, 2400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36, fontSize: "clamp(17px,2vw,22px)", fontWeight: 300, flexWrap: "wrap" }}>
      <span style={{ color: T2, fontWeight: 400, whiteSpace: "nowrap" }}>Built for people who work in</span>
      <div style={{ display: "inline-block", overflow: "hidden", height: "1.4em", verticalAlign: "bottom", minWidth: 280, textAlign: "left" }}>
        <span
          key={idx}
          style={{
            display: "inline-block", color: TEAL, fontWeight: 600, whiteSpace: "nowrap",
            animation: out ? "tickerOut .3s cubic-bezier(.4,0,1,1) forwards" : "tickerIn .45s cubic-bezier(.16,1,.3,1) forwards",
          }}
        >
          {TICKER_WORDS[idx]}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SEGMENT TABS
   ═══════════════════════════════════════════════════════════════════════ */
type SegKey = "ngo" | "finance" | "esg" | "journalism";

interface SegFeature { icon: string; label: string; desc: string }
interface SegData { pain: string; hl: string; body: string; cta: string; features: SegFeature[] }

const SEGS: Record<SegKey, SegData> = {
  ngo: {
    pain: "\u201CThe consultation closes Friday. I haven't started the response.\u201D",
    hl: "From deadline to submission. In hours.",
    body: "Workspace open on your consultation response. Sources saved from the feed. /ask querying the primary document directly. Generate Report producing a structured submission draft from your notes. Three days of work in three hours.",
    cta: "Try the workspace free",
    features: [
      { icon: "clock", label: "Deadline tracker", desc: "Every open consultation flagged with days remaining. Urgency signals in your calendar before the window closes." },
      { icon: "search", label: "Research agent", desc: "/ask queries treaty text, governing body decisions, and official consultation documents. Tier 1 only, cited." },
      { icon: "doc", label: "Generate Report", desc: "Notes to structured consultation response in one click. Export to Word. Your name on it." },
      { icon: "feed", label: "Live feed", desc: "Articles and reports summarised as they land across ocean governance, climate regulation, and blue finance. Save to your project in one click." },
    ],
  },
  finance: {
    pain: "\u201CThree funds with seabed exposure found out after the market had already moved.\u201D",
    hl: "Know before the market does.",
    body: "Regulatory developments that move blue economy markets, identified in Tier 1 primary sources before they reach the wire. /ask querying official session documents for exposure analysis. Generate Report producing an investment committee briefing from your notes.",
    cta: "Start monitoring your watchlist",
    features: [
      { icon: "tracker", label: "Live regulatory trackers", desc: "ISA Mining, Blue Finance, BBNJ Treaty and 7 more. Each pulses when something moves in primary documents or press." },
      { icon: "connect", label: "Cross-tracker connections", desc: "Developments across separate trackers connected automatically. The mechanism identified, not just the event." },
      { icon: "search", label: "Research agent", desc: "/ask queries ISA session documents, contractor liability provisions, and official regulatory publications. Primary documents, cited." },
      { icon: "doc", label: "Investment committee brief", desc: "Notes to structured briefing in one click. Executive Summary, Key Developments, Implications. Export to Word." },
    ],
  },
  esg: {
    pain: "\u201CThe TNFD ocean guidance updated last quarter. Our board pack section was based on the previous version.\u201D",
    hl: "Never miss a compliance deadline.",
    body: "Compliance deadlines in your calendar with urgency alerts. /ask querying TNFD framework text, CSRD technical standards, and IMO circulars directly. Generate Report producing a board-ready section with full provenance trail, ready for sign-off.",
    cta: "See your compliance calendar",
    features: [
      { icon: "clock", label: "Compliance calendar", desc: "CSRD, TNFD, MARPOL, IMO CII and every ocean-related compliance deadline. Urgency alerts when windows open." },
      { icon: "search", label: "Framework research", desc: "/ask queries TNFD guidance, CSRD technical standards, and official regulatory publications. Tier 1 only, no guesswork." },
      { icon: "doc", label: "Board pack sections", desc: "Notes converted to board-ready output with full provenance trail. Every claim sourced. Ready for sign-off and audit." },
      { icon: "feed", label: "Regulatory monitoring", desc: "Framework changes, consultation publications, and enforcement actions across CSRD, TNFD, and IMO shipping regulations." },
    ],
  },
  journalism: {
    pain: "\u201CThe story was the pattern across twelve enforcement actions. Six months to piece together manually.\u201D",
    hl: "Follow the entity, not just the story.",
    body: "Entity directory tracks every organisation, vessel, and individual across all sources since launch. /ask pulling from primary session records directly. The pattern that takes months manually takes an afternoon.",
    cta: "Search the entity archive",
    features: [
      { icon: "entity", label: "Entity directory", desc: "Every organisation, vessel, individual, and instrument tracked across all sources since launch. Search by entity, date range, or instrument." },
      { icon: "tracker", label: "Timeline research", desc: "Every mention of an entity, chronologically, across all 89 sources. The pattern visible across months of records in one view." },
      { icon: "search", label: "Primary source access", desc: "/ask queries ISA session records, BBNJ Treaty Collection, IMO circulars, and official enforcement registers. Document-level citations." },
      { icon: "connect", label: "Cross-source connections", desc: "Patterns identified across separate sources and sessions. The position shift that appeared across three sessions before anyone reported it." },
    ],
  },
};

const SEG_ICONS: Record<string, React.ReactNode> = {
  clock: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5.5V9l2.5 1.5"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><path d="M12 12l4 4"/></svg>,
  doc: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2.5" y="1.5" width="13" height="15" rx="2"/><path d="M6 6.5h6M6 9.5h6M6 12.5h4"/></svg>,
  feed: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="1.5" y="2.5" width="15" height="13" rx="2"/><path d="M5 7h8M5 10.5h5"/></svg>,
  tracker: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 1.5"/><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/></svg>,
  connect: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="4" cy="4" r="2.5"/><circle cx="14" cy="14" r="2.5"/><circle cx="14" cy="4" r="2.5"/><path d="M6.2 5.8l4.8 2M6.2 6.5l4.8 5"/></svg>,
  entity: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="5" r="2.5"/><circle cx="13" cy="8.5" r="2"/><path d="M1.5 15c0-2.5 2-4.5 4.5-4.5h2M11.5 12.5c0-1 .9-1.8 1.8-1.8s1.8.8 1.8 1.8v2.5"/></svg>,
};

const SEG_TABS: { key: SegKey; label: string }[] = [
  { key: "ngo", label: "NGO & Policy" },
  { key: "finance", label: "Investment & Finance" },
  { key: "esg", label: "ESG & Compliance" },
  { key: "journalism", label: "Journalism & Research" },
];

function SegmentTabs() {
  const [active, setActive] = useState<SegKey>("ngo");
  const [fade, setFade] = useState(false);
  const seg = SEGS[active];

  const switchTab = (k: SegKey) => {
    if (k === active) return;
    setFade(true);
    setTimeout(() => { setActive(k); setFade(false); }, 180);
  };

  return (
    <div>
      <div style={{ display: "flex", borderBottom: `2px solid ${BORDER}`, marginBottom: 44, overflowX: "auto" }}>
        {SEG_TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} style={{
            fontFamily: F, fontSize: 14, fontWeight: 500, color: active === t.key ? TEAL : T4,
            background: "transparent", border: "none", padding: "12px 24px 14px", cursor: "pointer",
            position: "relative", whiteSpace: "nowrap", transition: "color .15s",
          }}>
            {t.label}
            {active === t.key && <span style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: TEAL, borderRadius: "2px 2px 0 0" }} />}
          </button>
        ))}
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "2fr 3fr", gap: 48, alignItems: "start",
        opacity: fade ? 0 : 1, transform: fade ? "translateY(6px)" : "translateY(0)",
        transition: "opacity .28s ease, transform .28s ease",
      }}>
        <div>
          <div style={{ fontSize: 14, color: T4, fontStyle: "italic", borderLeft: `3px solid ${BLT}`, paddingLeft: 14, marginBottom: 20, lineHeight: 1.55 }}>{seg.pain}</div>
          <h3 style={{ fontSize: "clamp(20px,2.4vw,28px)", fontWeight: 700, letterSpacing: "-.035em", lineHeight: 1.1, color: T1, marginBottom: 12 }}>{seg.hl}</h3>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 22 }}>{seg.body}</p>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: TEAL, textDecoration: "none", padding: "8px 16px", borderRadius: R8, border: `1px solid ${TEAL_B}`, background: WHITE, transition: "all .15s", boxShadow: EL1 }}>{seg.cta} {"\u2192"}</a>
        </div>
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 8, boxShadow: EL2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {seg.features.map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 18, background: SURF, borderRadius: R8, transition: "background .15s" }}>
                <div style={{ width: 36, height: 36, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{SEG_ICONS[f.icon]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginBottom: 4, letterSpacing: "-.01em" }}>{f.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.6, color: T3 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(14px)", transition: "opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1)" } as React.CSSProperties };
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const feed = useReveal();
  const workspace = useReveal();
  const features = useReveal();
  const who = useReveal();
  const pricing = useReveal();

  return (
    <div style={{ fontFamily: "var(--font-sans), 'DM Sans', system-ui, sans-serif", fontWeight: 400, color: T1, background: WHITE, WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.15;transform:scale(.5)}}
        @keyframes tickerIn{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes tickerOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-100%)}}
        @keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{opacity:0;animation:fu .8s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.06s}.d2{animation-delay:.18s}.d3{animation-delay:.3s}.d4{animation-delay:.44s}
        @media(max-width:960px){
          .nav-links-d{display:none!important}
          .sf-top-g,.sw-top-g,.seg-content-g{grid-template-columns:1fr!important;gap:32px!important}
          .feat-grid-g{grid-template-columns:1fr 1fr!important}
          .fp-grid-g{grid-template-columns:1fr!important}
          .sec-pad{padding:64px 24px!important}
          .hero-pad{padding:96px 24px 64px!important}
          .footer-d{padding:24px!important;flex-direction:column!important}
          .feed-if{height:380px!important}.ws-if{height:400px!important}
          .pricing-grid-g{grid-template-columns:1fr!important}
        }
        @media(max-width:600px){
          .feat-grid-g{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, height: 64, background: WHITE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 48px", gap: 32, boxShadow: EL1 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: "auto" }}>
          <div style={{ width: 32, height: 32, borderRadius: R8, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="12" r="2.5" fill="white"/></svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: T1, letterSpacing: "-.025em" }}>Tideline</span>
        </a>
        <div className="nav-links-d" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <a href="#s-feed" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>The platform</a>
          <a href="#s-workspace" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>Workspace</a>
          <a href="#s-who" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>Who it&#39;s for</a>
          <a href="#s-price" style={{ fontSize: 14, fontWeight: 500, color: T3, textDecoration: "none", padding: "6px 12px", borderRadius: R8 }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: TEAL, textDecoration: "none", padding: "8px 16px", borderRadius: R8 }}>Log in</a>
          <a href="#s-price" style={{ fontFamily: F, fontSize: 14, fontWeight: 500, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: "10px 20px", textDecoration: "none", boxShadow: EL1 }}>Start free trial</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-pad" style={{ minHeight: "100vh", background: WHITE, display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 80px 80px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ content: "''", position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${TEAL},#34a853,#1a73e8,${TEAL})`, backgroundSize: "300% 100%", animation: "gradShift 6s ease infinite" }} />
        <div style={{ maxWidth: 820, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 className="fu d1" style={{ fontSize: "clamp(32px,4.8vw,58px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-.04em", color: T1, marginBottom: 28 }}>
            The professional home for everyone whose work<br />is shaped by what happens in the <span style={{ color: TEAL }}>ocean.</span>
          </h1>
          <div className="fu d2"><Ticker /></div>
          <div className="fu d3" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
            <a href="#s-price" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: "14px 32px", textDecoration: "none", letterSpacing: "-.01em", boxShadow: EL1 }}>Start free, no card required</a>
          </div>
          <p className="fu d3" style={{ fontSize: 13, color: T4, marginBottom: 48 }}>14-day free trial. Cancel any time.</p>
          <div className="fu d4" style={{ display: "inline-flex", alignItems: "center", gap: 14, background: WHITE, border: "1px solid rgba(249,171,0,.25)", borderRadius: R12, padding: "12px 20px", boxShadow: EL1, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, animation: "pulse 1.8s ease infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T2 }}>Founding member pricing closes <strong style={{ color: AMBER, fontWeight: 600 }}>30 April 2026</strong>, £29/month locked for life</span>
            <a href="#s-price" style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: NAVY, background: AMBER, border: "none", borderRadius: R8, padding: "7px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>Claim a spot</a>
          </div>
        </div>
      </section>

      {/* ── FEED ── */}
      <section ref={feed.ref as any} style={{ ...feed.style, background: SURF, padding: "80px", borderTop: `1px solid ${BORDER}` }} className="sec-pad" id="s-feed">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sf-top-g" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 56, alignItems: "start", marginBottom: 48 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Feed</div>
              <h2 style={{ fontSize: "clamp(24px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>Primary sources and press. Both. Always current.</h2>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>Most professionals monitor press or primary documents. Tideline does both simultaneously. Each article and report is automatically summarised so you can triage without reading everything in full. You always know which tier you are reading from.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R12, padding: "14px 16px", flex: 1, minWidth: 200, boxShadow: EL1 }}>
                  <div>
                    <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", display: "inline-block", background: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_B}`, marginBottom: 6 }}>Tier 1</span>
                    <div style={{ fontSize: 12, fontWeight: 300, color: T3, lineHeight: 1.5 }}>Primary sources: treaty text, governing body decisions, official consultation documents, enforcement registers. What /ask draws from exclusively.</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R12, padding: "14px 16px", flex: 1, minWidth: 200, boxShadow: EL1 }}>
                  <div>
                    <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", display: "inline-block", background: SURF2, color: T3, border: `1px solid ${BORDER}`, marginBottom: 6 }}>Tier 2</span>
                    <div style={{ fontSize: 12, fontWeight: 300, color: T3, lineHeight: 1.5 }}>Press: specialist outlets, financial reporting, conference coverage, opinion. Feeds the live stream and trackers alongside primary sources.</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>89<span style={{ fontSize: 16 }}>+</span></div><div style={{ fontSize: 12, color: T4, marginTop: 3 }}>Sources monitored</div></div>
                <div><div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>10</div><div style={{ fontSize: 12, color: T4, marginTop: 3 }}>Live trackers</div></div>
                <div><div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.05em", color: TEAL, lineHeight: 1 }}>3<span style={{ fontSize: 16 }}>hrs</span></div><div style={{ fontSize: 12, color: T4, marginTop: 3 }}>Saved per day</div></div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>Save anything to a project. Open the workspace. Build your document from what you have found. You never have to leave.</p>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>The distinction matters. When you use /ask in the workspace, it draws only from Tier 1 primary sources. Not press, not commentary. So when a cited answer appears in your document, you know exactly what it rests on.</p>
              <div style={{ background: NAVY, borderRadius: R16, padding: "24px 28px", marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: M, marginBottom: 16 }}>Why the distinction matters</div>
                {["Cited answers in your document trace to a named primary source, not a press summary", "Press summarises what primary documents decided. Tideline gives you both.", "The provenance trail from source document to your finished report is unbroken."].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(29,158,117,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,.6)", lineHeight: 1.55 }}>{t}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 300, color: T4, marginTop: 12 }}>The feed below is the live Tideline interface.</p>
            </div>
          </div>
          <div style={{ borderRadius: 20, boxShadow: "0 24px 80px rgba(60,64,67,.15),0 4px 16px rgba(60,64,67,.08)", overflow: "hidden", border: "1px solid rgba(60,64,67,.1)", background: NAVY }}>
            <div style={{ height: 8, background: NAVY }} />
            <iframe className="feed-if" src="/embed/feed.html" style={{ width: "100%", height: 520, border: "none", display: "block" }} title="Tideline feed" />
          </div>
        </div>
      </section>

      {/* ── WORKSPACE ── */}
      <section ref={workspace.ref as any} style={{ ...workspace.style, padding: "80px", background: WHITE, borderTop: `1px solid ${BORDER}` }} className="sec-pad" id="s-workspace">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="sw-top-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start", marginBottom: 48 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Workspace</div>
              <h2 style={{ fontSize: "clamp(24px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>The only place where the research and the document are the same thing.</h2>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>Every professional who produces written work from primary source intelligence knows the problem. You research in one place. You write in another. You copy, paste, check, recheck. And somewhere in the middle you lose the thread between what the source actually said and what ended up in the document.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {[
                  { n: "01", t: "Save sources from the feed", b: "Stories and documents saved in one click. The source is in your workspace before you open a new tab." },
                  { n: "02", t: "Query with /ask, without leaving", b: "Type /ask anywhere in your document. Tideline queries treaty text, IMO circulars, and official consultation records. The cited answer inserts directly. No copy-pasting. No second tab." },
                  { n: "03", t: "Generate the draft from your notes", b: "Hit Generate Report. Your notes become a structured draft. Export to Word. The provenance is unbroken from source to finished output. That exists nowhere else in this space." },
                ].map(s => (
                  <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: R8, background: TEAL_BG, border: `1px solid ${TEAL_B}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: M, fontSize: 11, fontWeight: 600, color: TEAL, flexShrink: 0 }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 3, letterSpacing: "-.01em" }}>{s.t}</div>
                      <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.6, color: T3 }}>{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: NAVY, borderRadius: R16, padding: "22px 26px", marginTop: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 300, color: "rgba(255,255,255,.6)", lineHeight: 1.55 }}>
                  The consultation response that takes <strong style={{ color: WHITE, fontWeight: 600 }}>three days</strong> takes <em style={{ color: TEAL, fontStyle: "normal", fontWeight: 600 }}>three hours.</em> The situation report that takes a day takes <em style={{ color: TEAL, fontStyle: "normal", fontWeight: 600 }}>twenty minutes.</em>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>The workspace open on an OSPAR consultation response, 8 days until the deadline, /ask pulling from the OSPAR primary document, a draft generating. Every professional whose work touches ocean governance, climate policy, blue finance, or maritime law has a version of this deadline.</p>
              <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 16 }}>Consultation responses. Board pack sections. Client briefings. Research timelines. The document that comes out has your name on it. Tideline does not appear.</p>
              <p style={{ fontSize: 14, fontWeight: 300, color: T4, marginTop: 8 }}>The workspace below is the live Tideline interface.</p>
            </div>
          </div>
          <div style={{ borderRadius: 20, boxShadow: "0 24px 80px rgba(60,64,67,.15),0 4px 16px rgba(60,64,67,.08)", overflow: "hidden", border: "1px solid rgba(60,64,67,.1)", background: NAVY }}>
            <div style={{ height: 8, background: NAVY }} />
            <iframe className="ws-if" src="/embed/workspace.html" style={{ width: "100%", height: 540, border: "none", display: "block" }} title="Tideline workspace" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={features.ref as any} style={{ ...features.style, background: SURF, padding: "80px", borderTop: `1px solid ${BORDER}` }} className="sec-pad">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 52px" }}>
            <h2 style={{ fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 14 }}>Everything in one place. You never have to leave.</h2>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.75, color: T3 }}>The feed. The workspace. The trackers. The research agent. The entity directory. One platform built for professionals whose work is shaped by what happens in the ocean and in the rooms where climate regulation is written.</p>
          </div>
          <div className="feat-grid-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="3" width="18" height="16" rx="2.5"/><path d="M6 8h10M6 12h7"/></svg>, ic: "teal", t: "Live feed", b: "Articles and reports from 89 sources land continuously and are summarised automatically. Tier 1 primary documents and Tier 2 press in the same stream, clearly labelled. Triage in seconds. The connections between separate developments are identified as they emerge." },
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M11 7v5l3 2"/></svg>, ic: "blue", t: "Live trackers", b: "10 regulatory trackers: BBNJ Treaty, ISA Mining, IUU Enforcement, 30x30, IMO Shipping, Blue Finance and more. Each pulses when something moves. Your compliance calendar shows deadlines before they bite." },
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="2" width="16" height="18" rx="2"/><path d="M7 7h8M7 11h8M7 15h5"/></svg>, ic: "teal", t: "Workspace", b: "Save sources, annotate, draft. Consultation responses, board pack sections, research timelines, client briefings. Your output, your name on it. Tideline invisible." },
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M8 11l2.5 2.5 4-4"/></svg>, ic: "amber", t: "Generate Report", b: "Notes converted to a structured draft in one click: Executive Summary, Key Developments, Implications. Export to Word or PDF. The report carries your name. Tideline does not appear." },
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="6"/><path d="M14 14l5 5"/></svg>, ic: "blue", t: "Research agent", b: "Type /ask anywhere in your document. Draws only from Tier 1 primary sources: treaty text, ISA publications, IMO circulars, OSPAR official records. Cited answers. No journalism. Unbroken provenance from source to finished document." },
              { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="3"/><circle cx="16" cy="16" r="3"/><circle cx="16" cy="6" r="3"/><path d="M8.8 7.5l4.7 2M8.8 8.5l4.7 5"/></svg>, ic: "teal", t: "Entity directory", b: "Every organisation, vessel, individual, and instrument tracked across all sources since launch. The pattern across twelve enforcement actions that takes months manually takes an afternoon. Search by entity, date range, or instrument." },
            ].map((c, i) => {
              const bg = c.ic === "teal" ? { background: TEAL_BG, border: `1px solid ${TEAL_B}`, color: TEAL }
                       : c.ic === "blue" ? { background: "rgba(24,95,165,.07)", border: "1px solid rgba(24,95,165,.18)", color: BLUE }
                       : { background: "rgba(249,171,0,.08)", border: "1px solid rgba(249,171,0,.2)", color: AMBER };
              return (
                <div key={i} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28, transition: "box-shadow .2s, transform .2s", cursor: "default" }}>
                  <div style={{ width: 44, height: 44, borderRadius: R12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, ...bg }}>{c.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8, letterSpacing: "-.02em" }}>{c.t}</div>
                  <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T3 }}>{c.b}</div>
                </div>
              );
            })}
          </div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: R12, padding: "20px 26px", display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ fontFamily: M, fontSize: 11, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: TEAL, flexShrink: 0 }}>89 sources</div>
            <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.7, color: T4 }}>Intergovernmental bodies, legal databases, enforcement registers, climate frameworks, financial disclosures, specialist press, financial reporting, and real-time conference coverage. Every source rated before it enters the platform. The research agent draws only from Tier 1 sources. Tier 2 feeds the live stream and trackers.</div>
          </div>
        </div>
      </section>

      {/* ── WHO ── */}
      <section ref={who.ref as any} style={{ ...who.style, background: WHITE, padding: "80px", borderTop: `1px solid ${BORDER}` }} className="sec-pad" id="s-who">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 12, letterSpacing: "-.01em" }}>Who uses it</div>
            <h2 style={{ fontSize: "clamp(24px,3.2vw,38px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1.08, color: T1, marginBottom: 0 }}>Your world. Your output.</h2>
            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.7, color: T3, maxWidth: 500, marginTop: 10 }}>Same platform. The problem you bring and the document that comes out change depending on what you do.</p>
          </div>
          <SegmentTabs />
        </div>
      </section>

      {/* ── PRICING ── */}
      <section ref={pricing.ref as any} style={{ ...pricing.style, padding: "80px", background: SURF, borderTop: `1px solid ${BORDER}` }} className="sec-pad" id="s-price">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: TEAL, marginBottom: 24 }}>Pricing</div>
          <div className="pricing-grid-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
            {/* Founding */}
            <div style={{ background: WHITE, border: "1px solid rgba(249,171,0,.3)", borderRadius: R16, padding: 28, boxShadow: EL2, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: AMBER, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: AMBER, animation: "pulse 1.8s ease infinite" }} />
                Founding member
              </div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£29<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: 0 }}>/month</span></div>
              <div style={{ fontSize: 13, fontWeight: 300, color: T3, lineHeight: 1.5, margin: "7px 0 16px" }}>Not a discount. An identity. Full plan including the Workspace. Price never increases. Closes 30 April 2026.</div>
              <a href="/signup" style={{ display: "inline-flex", background: AMBER, color: NAVY, border: "none", borderRadius: R8, padding: "10px 22px", fontFamily: F, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: EL1, marginTop: "auto" }}>Claim a founding member spot</a>
              <div style={{ fontSize: 11, color: T4, marginTop: 8, fontFamily: M }}>No credit card. Cancel any time.</div>
            </div>
            {/* Individual */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28, background: WHITE, boxShadow: EL1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>Individual</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£79<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: 0 }}>/month</span></div>
              <div style={{ fontSize: 14, fontWeight: 300, color: T3, margin: "7px 0 22px", lineHeight: 1.5 }}>For the professional who needs to stay current and produce work that shows it.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                {["Live feed updated continuously, with automatic summaries", "10 live trackers across ocean, climate and blue finance", "Connections between developments identified automatically", "Workspace with /ask against Tier 1 primary sources only", "Generate Report, notes to structured draft", "Entity directory, every organisation, vessel, person", "Export to Word and PDF"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 300, color: T2, lineHeight: 1.45 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, flexShrink: 0, marginTop: 7 }} />
                    {f}
                  </div>
                ))}
              </div>
              <a href="/signup" style={{ display: "block", textAlign: "center", fontFamily: F, fontSize: 15, fontWeight: 600, background: TEAL, color: "white", border: "none", borderRadius: R8, padding: 14, textDecoration: "none", boxShadow: EL1, marginTop: "auto" }}>Start free, no card required</a>
              <div style={{ textAlign: "center", fontSize: 12, color: T4, marginTop: 8 }}>14-day free trial.</div>
            </div>
            {/* Team */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: R16, padding: 28, background: WHITE, boxShadow: EL1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>Team</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-.055em", color: T1, lineHeight: 1 }}>£399<span style={{ fontSize: 17, fontWeight: 400, color: T4, letterSpacing: 0 }}>/month</span></div>
              <div style={{ fontSize: 14, fontWeight: 300, color: T3, margin: "7px 0 22px", lineHeight: 1.5 }}>For organisations where the intelligence needs to stay when people move on. 10 seats, shared workspace, shared projects.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                {["Everything in Individual, for 10 people", "Shared workspace projects and annotations", "Shared entity watchlists and tracker alerts", "Institutional intelligence that stays when someone leaves", "Centralised billing and seat management"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 300, color: T2, lineHeight: 1.45 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, flexShrink: 0, marginTop: 7 }} />
                    {f}
                  </div>
                ))}
              </div>
              <a href="/signup" style={{ display: "block", textAlign: "center", fontFamily: F, fontSize: 15, fontWeight: 600, background: NAVY, color: "white", border: "none", borderRadius: R8, padding: 14, textDecoration: "none", boxShadow: EL1, marginTop: "auto" }}>Start team trial, no card required</a>
              <div style={{ textAlign: "center", fontSize: 12, color: T4, marginTop: 8 }}>14-day free trial.</div>
            </div>
          </div>
          <div style={{ paddingTop: 20, borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 300, color: T3 }}>NGO or academic? <a href="/signup" style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}>50% off, apply here</a></div>
            <div style={{ fontSize: 14, fontWeight: 300, color: T3 }}>Enterprise or custom team size? <a href="/signup" style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}>Talk to us</a></div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-d" style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, padding: "32px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T3, letterSpacing: "-.02em" }}>Tideline</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href="#s-feed" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>The platform</a>
          <a href="#s-workspace" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Workspace</a>
          <a href="#s-who" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Who it&#39;s for</a>
          <a href="#s-price" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Pricing</a>
          <a href="#" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ fontSize: 13, color: T4, textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ fontSize: 13, color: TEAL, textDecoration: "none" }}>Source methodology</a>
        </div>
        <div style={{ fontSize: 12, color: T4 }}>2026 Tideline</div>
      </footer>
    </div>
  );
}
