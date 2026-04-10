"use client";

import { useState, useRef, useEffect } from "react";
import DesktopOnly from "@/components/DesktopOnly";

const BG      = "#F8F9FA";
const WHITE   = "#FFFFFF";
const NAVY    = "#0A1628";
const NAVY2   = "#0D1F35";
const TEAL    = "#1D9E75";
const TEAL_BG = "rgba(29,158,117,0.07)";
const TEAL_B  = "rgba(29,158,117,0.22)";
const AMBER   = "#F9AB00";
const RED     = "#D93025";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const F       = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M       = "var(--font-mono), 'DM Mono', monospace";

const ANSWER = `Enforcement of MARPOL Annex VI has intensified measurably since Q3 2025, with port state control detentions for air emissions violations rising 34% year-on-year according to the Tokyo MOU annual report`;
const ANSWER_B = `. The IMO\u2019s Carbon Intensity Indicator framework, which entered into force in January 2026, has created a new category of compliance exposure. Ships rated D or E for three consecutive years now face mandatory corrective action plans`;
const ANSWER_C = `. Three enforcement actions in the Tideline IUU tracker in the last 60 days involved Annex VI violations as secondary charges alongside flag state irregularities, suggesting port state authorities are increasingly bundling emissions compliance into broader inspections`;

const SOURCES = [
  { n: 1, title: "Tokyo MOU Annual Report 2025", meta: "Tideline brief \u00b7 14 Jan 2026 \u00b7 Tier 1" },
  { n: 2, title: "IMO MEPC 83: CII Framework", meta: "Tideline tracker entry \u00b7 6 Mar 2026 \u00b7 Tier 1" },
  { n: 3, title: "Tideline IUU Enforcement Tracker", meta: "Last 60 days \u00b7 3 matching events" },
];

const SUGGESTIONS = [
  { icon: "doc", text: "Draft a situation report on BBNJ developments for the last 30 days" },
  { icon: "doc", text: "Outline a consultation response to the OSPAR North-East Atlantic fisheries proposal based on my uploaded documents" },
  { icon: "search", text: "What changed in deep-sea mining regulation in the last 30 days?" },
  { icon: "search", text: "What does the ISA deferral mean for my uploaded OSPAR report?" },
];

const IcDoc = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v10H2z" stroke="currentColor" strokeWidth="1.3" rx="1.5"/><path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IcSrch = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

// ── Cite chip ─────────────────────────────────────────────────────────────
function Cite({ n }: { n: number }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, background: TEAL_BG, borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}>[{n}]</span>;
}

// ── Answer card ───────────────────────────────────────────────────────────
function AnswerCard({ question }: { question: string }) {
  const [tipVisible, setTipVisible] = useState(false);

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
      {/* Question */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 24px", background: BG, borderBottom: `1px solid ${BLT}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.4"/><path d="M10.5 10.5l3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </div>
        <div style={{ fontSize: 15, color: T1, fontStyle: "italic", lineHeight: 1.4, paddingTop: 2 }}>{question}</div>
      </div>
      {/* Answer body */}
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.85, color: T1, marginBottom: 22 }}>
          {ANSWER} <Cite n={1} />
          {ANSWER_B} <Cite n={2} />
          {ANSWER_C} <Cite n={3} />.
        </div>

        {/* Sources */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10, paddingTop: 18, borderTop: `1px solid ${BLT}` }}>Sources</div>
        {SOURCES.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < SOURCES.length - 1 ? `1px solid ${BLT}` : "none", cursor: "pointer" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T4, fontFamily: M, flexShrink: 0 }}>{s.n}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T1, transition: "color .12s" }}>{s.title} {"\u2197"}</div>
              <div style={{ fontSize: 12, color: T4, marginTop: 1 }}>{s.meta}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div style={{ background: BG, borderTop: `1px solid ${BLT}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} /> 847 documents searched
        </div>
        <div style={{ position: "relative", cursor: "default" }} onMouseEnter={() => setTipVisible(true)} onMouseLeave={() => setTipVisible(false)}>
          <span style={{ fontSize: 12, color: T4 }}>{"\u2713"} 3 claims verified</span>
          {tipVisible && (
            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", color: "rgba(255,255,255,.9)", borderRadius: 8, fontSize: 12, lineHeight: 1.55, padding: "10px 14px", width: 280, zIndex: 100, textAlign: "left", boxShadow: "0 4px 16px rgba(0,0,0,.3)", pointerEvents: "none" }}>
              Each factual claim in this answer was cross-referenced against a primary source in Tideline&apos;s dataset before being included.
              <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", border: "5px solid transparent", borderTopColor: "#1a1a2e" }} />
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: T4 }}>Updated 26 Mar 2026</div>
      </div>
    </div>
  );
}

// ── Upload section ────────────────────────────────────────────────────────
function UploadSection() {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 40 }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T1 }}>Upload documents to research</div>
        <div style={{ fontSize: 13, fontWeight: 300, color: T3, marginTop: 4, lineHeight: 1.5 }}>Tideline answers questions across your uploaded files and its own dataset together. Upload a regulation, contract, or report and ask anything about it.</div>
      </div>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ margin: "20px 24px 24px", border: `2px dashed ${hov ? TEAL : BORDER}`, borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer", background: hov ? TEAL_BG : "transparent", transition: "all .2s" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: BG, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 15V4M12 4L9 7M12 4l3 3" stroke={T4} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={T4} strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T1, marginBottom: 4 }}>Drop a file here, or click to browse</div>
        <div style={{ fontSize: 13, fontWeight: 300, color: T3 }}>PDF, Word and text files supported</div>
        <div style={{ fontSize: 12, color: T4, marginTop: 6 }}>Up to 20MB per file</div>
      </div>
    </div>
  );
}

// ── Right panel (rendered via portal-like approach in layout) ──────────
// For now we include it inline since the layout right panel is shared.
// This content would ideally be slotted. We render it below the main.

// ── Main page ─────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [counter, setCounter] = useState(0);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = (text?: string) => {
    const q = text || query;
    if (!q.trim()) return;
    setQuery(q);
    setSubmittedQuery(q);
    setIsLoading(true);
    setHasAnswer(false);
    setCounter(0);

    let count = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      count += Math.floor(Math.random() * 40) + 20;
      if (count >= 847) { count = 847; if (intervalRef.current) clearInterval(intervalRef.current); }
      setCounter(count);
    }, 80);

    setTimeout(() => {
      setIsLoading(false);
      setHasAnswer(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCounter(847);
    }, 1800);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <DesktopOnly featureName="Research library">
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(.65)}}`}</style>

      {/* ── HERO / SEARCH ── */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: hasAnswer ? "32px 40px 28px" : "56px 40px 38px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transition: "padding .3s" }}>
        {/* Logo row: only in empty state */}
        {!hasAnswer && !isLoading && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11c0-4.5 3.5-8 8-8s8 3.5 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><circle cx="11" cy="16" r="3" fill="white"/></svg>
              </div>
              <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.025em", color: T1 }}>Tideline Research</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 300, color: T3, marginBottom: 26, lineHeight: 1.5, maxWidth: 480 }}>
              Cited answers from <strong style={{ fontWeight: 500, color: T1 }}>847 documents</strong> across 14 months of ocean governance intelligence.
            </div>
          </>
        )}

        {/* Search bar */}
        <div style={{ width: "100%", maxWidth: 580, height: 52, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 26, display: "flex", alignItems: "center", padding: "0 8px 0 22px", gap: 12, boxShadow: "0 1px 6px rgba(60,64,67,.18)", marginBottom: 8 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke={T4} strokeWidth="1.6"/><path d="M14 14l4.5 4.5" stroke={T4} strokeWidth="1.6" strokeLinecap="round"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Ask a question about governance, regulation, climate, finance or policy\u2026"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: F, fontSize: 15, fontWeight: 300, color: T1 }}
          />
          <button onClick={() => handleSubmit()} style={{ width: 38, height: 38, borderRadius: 20, background: NAVY, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = NAVY2)}
            onMouseLeave={e => (e.currentTarget.style.background = NAVY)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Editorial principle */}
        <div style={{ fontSize: 12, color: T4, marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 500, color: T3 }}>Tideline reports what sources say. It does not tell you what to conclude.</strong>
        </div>

        {/* Date range: only in empty state */}
        {!hasAnswer && !isLoading && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "6px 16px", fontSize: 12, color: T3, marginBottom: 20 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x=".5" y="1.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 .5v1M10 .5v1M.5 5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span>From</span>
              <input type="date" defaultValue="2025-01-01" style={{ border: "none", background: "transparent", fontFamily: F, fontSize: 12, color: T2, outline: "none", cursor: "pointer" }} />
              <span>to</span>
              <input type="date" defaultValue={today} style={{ border: "none", background: "transparent", fontFamily: F, fontSize: 12, color: T2, outline: "none", cursor: "pointer" }} />
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: TEAL, cursor: "pointer" }}>All time</span>
            </div>

            {/* Suggestions */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>Try asking</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 620, marginBottom: 18 }}>
              {SUGGESTIONS.map((s, i) => (
                <span key={i} onClick={() => handleSubmit(s.text)} style={{ display: "flex", alignItems: "center", gap: 8, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "8px 18px", fontSize: 13, color: T2, cursor: "pointer", transition: "all .15s" }}>
                  {s.icon === "doc" ? <IcDoc /> : <IcSrch />}
                  {s.text}
                </span>
              ))}
            </div>

            {/* Dataset stat */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, animation: "pulse 2.2s ease-in-out infinite" }} />
              Drawing from 847 documents across 14 months of ocean governance intelligence
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ padding: 28, maxWidth: 820, margin: "0 auto", width: "100%" }}>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontFamily: M, fontSize: 14, color: T4 }}>Searching {Math.min(counter, 847)} records...</div>
          </div>
        )}

        {/* Answer state */}
        {hasAnswer && !isLoading && (
          <>
            <AnswerCard question={submittedQuery || "What is the current enforcement trend under MARPOL Annex VI?"} />
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <span style={{ fontFamily: M, fontSize: 11, color: T4 }}>8 of 10 queries used today</span>
            </div>
          </>
        )}

        {/* Sample answer: empty state only */}
        {!hasAnswer && !isLoading && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4 }}>
              Example: what a research answer looks like
              <span style={{ flex: 1, height: 1, background: BLT }} />
            </div>
            <AnswerCard question="What is the current enforcement trend under MARPOL Annex VI?" />
          </>
        )}

        {/* Upload section, always visible */}
        <UploadSection />
      </div>
    </div>
    </DesktopOnly>
  );
}
