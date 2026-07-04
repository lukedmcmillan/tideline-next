"use client";

import { useState, useRef } from "react";
import DesktopOnly from "@/components/DesktopOnly";

const BG      = "#F8F9FA";
const WHITE   = "#FFFFFF";
const NAVY    = "#0A1628";
const NAVY2   = "#0D1F35";
const TEAL    = "#1D9E75";
const TEAL_BG = "rgba(29,158,117,0.07)";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const F       = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M       = "var(--font-sans), 'DM Sans', sans-serif";

const SUGGESTIONS = [
  { icon: "search", text: "What is BBNJ?" },
  { icon: "search", text: "What changed in deep-sea mining regulation in the last 30 days?" },
  { icon: "search", text: "What is the current enforcement trend under MARPOL Annex VI?" },
  { icon: "search", text: "What does the ISA mining code say about environmental bonds?" },
];

const IcSrch = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

// ── Types matching the API response ──────────────────────────────────────
interface CitedSource {
  documentId: string;
  title: string;
  sourceOrganisation: string | null;
  sourceType: string | null;
  sourceTier: string;
  documentType: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  similarity: number;
  chunkIndex: number;
}

interface NearestDoc {
  title: string;
  canonicalUrl: string | null;
  similarity: number;
}

interface ResearchResult {
  answer: string | null;
  abstained: boolean;
  abstentionReason?: string;
  citedSources: CitedSource[];
  funnel: {
    inScope: number;
    retrieved: number;
    cited: number;
    latencyMs: number;
  };
  faithfulnessStripped: number;
  partialCitationCount: number;
  nearestDocs?: NearestDoc[];
  queryId?: string;
  error?: string;
}

// ── Cite chip ─────────────────────────────────────────────────────────────
function Cite({ n }: { n: number }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, background: TEAL_BG, borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}>[{n}]</span>;
}

// ── Render answer text with inline citation chips ─────────────────────────
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) return <Cite key={i} n={parseInt(match[1])} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Answer card ───────────────────────────────────────────────────────────
function AnswerCard({ question, result }: { question: string; result: ResearchResult }) {
  const { answer, citedSources, funnel, faithfulnessStripped } = result;
  const verifiedCount = citedSources.length - faithfulnessStripped;

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
          <AnswerText text={answer!} />
        </div>

        {/* Sources */}
        {citedSources.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10, paddingTop: 18, borderTop: `1px solid ${BLT}` }}>Sources</div>
            {citedSources.map((s, i) => (
              <div key={s.documentId + "-" + s.chunkIndex} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < citedSources.length - 1 ? `1px solid ${BLT}` : "none", cursor: s.canonicalUrl ? "pointer" : "default" }}
                onClick={() => s.canonicalUrl && window.open(s.canonicalUrl, "_blank")}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T4, fontFamily: M, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>
                    {s.title} {s.canonicalUrl ? "\u2197" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: T4, marginTop: 1 }}>
                    {[s.sourceOrganisation, s.sourceTier, s.createdAt?.slice(0, 10)].filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {/* Footer */}
      <div style={{ background: BG, borderTop: `1px solid ${BLT}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} />
          {funnel.inScope.toLocaleString()} documents searched
        </div>
        <div style={{ fontSize: 12, color: T4 }}>
          {funnel.retrieved} passages retrieved
        </div>
        {verifiedCount > 0 && (
          <div style={{ fontSize: 12, color: T4 }}>
            {"\u2713"} {verifiedCount} claim{verifiedCount !== 1 ? "s" : ""} verified
          </div>
        )}
        <div style={{ fontSize: 12, color: T4 }}>
          {(funnel.latencyMs / 1000).toFixed(1)}s
        </div>
      </div>
    </div>
  );
}

// ── Abstention card ───────────────────────────────────────────────────────
function AbstentionCard({ question, result }: { question: string; result: ResearchResult }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 24px", background: BG, borderBottom: `1px solid ${BLT}` }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.4"/><path d="M10.5 10.5l3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </div>
        <div style={{ fontSize: 15, color: T1, fontStyle: "italic", lineHeight: 1.4, paddingTop: 2 }}>{question}</div>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.85, color: T2, marginBottom: 16 }}>
          The library does not contain enough information to answer this reliably.
        </div>
        {result.abstentionReason && (
          <div style={{ fontSize: 13, color: T4, marginBottom: 16 }}>
            {result.abstentionReason}
          </div>
        )}
        {result.nearestDocs && result.nearestDocs.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10, paddingTop: 18, borderTop: `1px solid ${BLT}` }}>Nearest documents</div>
            {result.nearestDocs.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", cursor: d.canonicalUrl ? "pointer" : "default" }}
                onClick={() => d.canonicalUrl && window.open(d.canonicalUrl, "_blank")}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>
                  {d.title} {d.canonicalUrl ? "\u2197" : ""}
                </div>
                <div style={{ fontSize: 12, color: T4, marginLeft: "auto", flexShrink: 0 }}>
                  {(d.similarity * 100).toFixed(0)}% match
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ background: BG, borderTop: `1px solid ${BLT}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 20, fontSize: 12, color: T4 }}>
        <span>{result.funnel.inScope.toLocaleString()} documents searched</span>
        <span>{result.funnel.retrieved} passages retrieved</span>
        <span>{(result.funnel.latencyMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────
function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 300, color: T2, lineHeight: 1.6 }}>
        {message}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (text?: string) => {
    const q = (text || query).trim();
    if (!q) return;
    setQuery(q);
    setSubmittedQuery(q);
    setIsLoading(true);
    setResult(null);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data: ResearchResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const hasResult = result !== null;
  const today = new Date().toISOString().split("T")[0];

  return (
    <DesktopOnly featureName="Research library">
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(.65)}}`}</style>

      {/* ── HERO / SEARCH ── */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: hasResult || isLoading ? "32px 40px 28px" : "56px 40px 38px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transition: "padding .3s" }}>
        {/* Logo row: only in empty state */}
        {!hasResult && !isLoading && !error && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11c0-4.5 3.5-8 8-8s8 3.5 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><circle cx="11" cy="16" r="3" fill="white"/></svg>
              </div>
              <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.025em", color: T1 }}>Tideline Research</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 300, color: T3, marginBottom: 26, lineHeight: 1.5, maxWidth: 480 }}>
              Cited answers from the document library. We don&apos;t search the internet. We search the library we built.
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
            placeholder="Ask a question about governance, regulation, climate, finance or policy..."
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: F, fontSize: 15, fontWeight: 300, color: T1 }}
          />
          <button onClick={() => handleSubmit()} disabled={isLoading} style={{ width: 38, height: 38, borderRadius: 20, background: isLoading ? T4 : NAVY, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: isLoading ? "not-allowed" : "pointer", flexShrink: 0, transition: "background .15s" }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = NAVY2; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = NAVY; }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Editorial principle */}
        <div style={{ fontSize: 12, color: T4, marginBottom: 20, maxWidth: 480, lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 500, color: T3 }}>Tideline reports what sources say. It does not tell you what to conclude.</strong>
        </div>

        {/* Date range + suggestions: only in empty state */}
        {!hasResult && !isLoading && !error && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "6px 16px", fontSize: 12, color: T3, marginBottom: 20 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x=".5" y="1.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 .5v1M10 .5v1M.5 5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span>From</span>
              <input type="date" defaultValue="2025-01-01" style={{ border: "none", background: "transparent", fontFamily: F, fontSize: 12, color: T2, outline: "none", cursor: "pointer" }} />
              <span>to</span>
              <input type="date" defaultValue={today} style={{ border: "none", background: "transparent", fontFamily: F, fontSize: 12, color: T2, outline: "none", cursor: "pointer" }} />
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: TEAL, cursor: "pointer" }}>All time</span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>Try asking</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 620, marginBottom: 18 }}>
              {SUGGESTIONS.map((s, i) => (
                <span key={i} onClick={() => handleSubmit(s.text)} style={{ display: "flex", alignItems: "center", gap: 8, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "8px 18px", fontSize: 13, color: T2, cursor: "pointer", transition: "all .15s" }}>
                  <IcSrch />
                  {s.text}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ padding: 28, maxWidth: 820, margin: "0 auto", width: "100%" }}>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, animation: "pulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontFamily: M, fontSize: 14, color: T4 }}>Searching the library...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <ErrorCard message={error} />
        )}

        {/* Abstention state */}
        {result && result.abstained && !isLoading && (
          <AbstentionCard question={submittedQuery} result={result} />
        )}

        {/* Answer state */}
        {result && !result.abstained && result.answer && !isLoading && (
          <AnswerCard question={submittedQuery} result={result} />
        )}
      </div>
    </div>
    </DesktopOnly>
  );
}
