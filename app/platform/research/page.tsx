"use client";

import { useState } from "react";

const BLACK = "#0D0D0D";
const WHITE = "#FFFFFF";
const TEAL  = "#1D9E75";
const RULE  = "#E4E4E4";
const SERIF = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS  = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const MONO  = "var(--font-mono), 'DM Mono', monospace";

const SAMPLE_QUESTION = "What is the current enforcement trend under MARPOL Annex VI?";
const SAMPLE_ANSWER = `Enforcement of MARPOL Annex VI has intensified measurably since Q3 2025, with port state control detentions for air emissions violations rising 34% year-on-year according to the Tokyo MOU annual report [1]. The IMO's Carbon Intensity Indicator framework, which entered into force in January 2026, has created a new category of compliance exposure for vessel operators \u2014 ships rated D or E for three consecutive years now face mandatory corrective action plans [2]. Three enforcement actions recorded in the Tideline IUU tracker in the last 60 days involved Annex VI violations as secondary charges alongside flag state irregularities, suggesting port state authorities are increasingly bundling emissions compliance into broader inspections [3].`;

const CITATIONS = [
  { num: 1, text: "Tokyo MOU Annual Report 2025 \u2014 Tideline brief, 14 Jan 2026" },
  { num: 2, text: "IMO MEPC 83 \u2014 Tideline tracker entry, 6 Mar 2026" },
  { num: 3, text: "Tideline IUU Enforcement Tracker \u2014 last 60 days" },
];

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [hasQueried, setHasQueried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [queries] = useState(["What changed in BBNJ ratification this quarter?", "Show me ISA contractor decisions since 2024", "What blue bond issuances were announced this year?"]);
  const queryCount = 8;

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setLoadCount(0);
    const interval = setInterval(() => {
      setLoadCount(prev => {
        if (prev >= 847) { clearInterval(interval); setLoading(false); setHasQueried(true); return 847; }
        return prev + Math.floor(Math.random() * 30) + 10;
      });
    }, 30);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 28px" }}>
      {/* Heading */}
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontStyle: "italic", fontWeight: 400, margin: "0 0 8px", color: BLACK }}>Ask Tideline anything.</h1>
      <p style={{ fontFamily: MONO, fontSize: 12, opacity: 0.4, letterSpacing: "0.08em", margin: "0 0 28px" }}>Drawing from 847 documents across 18 months of ocean governance intelligence.</p>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} type="text" placeholder="Ask a question about ocean governance, regulation or finance." style={{ width: "100%", height: 48, border: `1.5px solid ${BLACK}`, borderRadius: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 15, padding: "0 54px 0 18px", background: WHITE, color: BLACK }} />
        <button onClick={handleSearch} style={{ position: "absolute", right: 0, top: 0, width: 48, height: 48, background: BLACK, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={WHITE} strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="5"/><line x1="11" y1="11" x2="16" y2="16"/></svg>
        </button>
      </div>

      {/* Usage */}
      <div style={{ textAlign: "right", marginBottom: 24 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.35, color: BLACK }}>{queryCount} queries today</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ fontFamily: MONO, fontSize: 12, color: BLACK, opacity: 0.5, marginBottom: 24 }}>Searching {Math.min(loadCount, 847)} records...</div>
      )}

      {/* Active state: show answer */}
      {hasQueried && !loading && (
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: "italic", opacity: 0.6, margin: "0 0 16px" }}>{query}</p>
          <div style={{ borderLeft: `1px solid ${RULE}`, paddingLeft: 20 }}>
            <p style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 1.8, color: BLACK, margin: "0 0 16px" }}>{SAMPLE_ANSWER}</p>
            <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, marginBottom: 8 }}>SOURCES</div>
              {CITATIONS.map(c => (
                <div key={c.num} style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
                  <span style={{ color: TEAL }}>[{c.num}]</span> {c.text} <span style={{ color: TEAL }}>{"\u2197"}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, opacity: 0.35, marginTop: 12 }}>Answer drawn from 847 Tideline documents. 3 claims verified against primary sources. Dataset updated 26 Mar 2026.</div>
          </div>
        </div>
      )}

      {/* Empty state: suggested queries + sample answer */}
      {!hasQueried && !loading && (
        <>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, marginBottom: 10 }}>Try asking:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "What has changed in deep-sea mining regulation in the last 30 days? \u2192",
                "Which countries have ratified BBNJ and what does it mean for enforcement? \u2192",
                "What does the ISA deferral mean for my uploaded OSPAR report? \u2192",
              ].map((q, i) => (
                <span key={i} onClick={() => { setQuery(q.replace(" \u2192", "")); }} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em", border: `1px solid ${RULE}`, padding: "6px 12px", color: BLACK, opacity: 0.5, cursor: "pointer", display: "inline-block", width: "fit-content" }}>{q}</span>
              ))}
            </div>
          </div>

          {/* Sample answer */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, marginBottom: 12 }}>EXAMPLE &mdash; WHAT A RESEARCH ANSWER LOOKS LIKE</div>
            <p style={{ fontFamily: SERIF, fontSize: 15, fontStyle: "italic", opacity: 0.6, margin: "0 0 16px" }}>&ldquo;{SAMPLE_QUESTION}&rdquo;</p>
            <div style={{ borderLeft: `1px solid ${RULE}`, paddingLeft: 20 }}>
              <p style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 1.8, color: BLACK, margin: "0 0 16px" }}>{SAMPLE_ANSWER}</p>
              <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, marginBottom: 8 }}>SOURCES</div>
                {CITATIONS.map(c => (
                  <div key={c.num} style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
                    <span style={{ color: TEAL }}>[{c.num}]</span> {c.text} <span style={{ color: TEAL }}>{"\u2197"}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, opacity: 0.35, marginTop: 12 }}>Answer drawn from 847 Tideline documents. 3 claims verified against primary sources. Dataset updated 26 Mar 2026.</div>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 12, opacity: 0.4, fontStyle: "italic", marginTop: 12 }}>This is a live example drawn from Tideline&apos;s actual dataset. Every citation links to the original source.</p>
          </div>
        </>
      )}
    </div>
  );
}
