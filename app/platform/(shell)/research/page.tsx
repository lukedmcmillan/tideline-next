"use client";

import { useState, useRef, useEffect } from "react";
import DesktopOnly from "@/components/DesktopOnly";

// ─── Design tokens (locked) ──────────────────────────────────────────────────
const NAVY    = "#0B1628";
const NAVY2   = "#0D1E35";
const TEAL    = "#1D9E75";
const TEAL_BG = "rgba(29,158,117,0.06)";
const WHITE   = "#FFFFFF";
const BG      = "#F8F9FA";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const F       = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const MONO    = "'DM Mono', 'IBM Plex Mono', monospace";

// ─── API response types ──────────────────────────────────────────────────────
interface AskSource {
  document_id: string | null;
  title: string;
  source_organisation: string | null;
  published_date: string | null;
  file_url: string | null;
}

interface LibraryDoc {
  id: string;
  title: string;
  source_organisation: string | null;
  document_type: string | null;
  source_tier: string | null;
  published_date: string | null;
  created_at: string;
}

interface ResearchResponse {
  answer: string | null;
  abstained: boolean;
  abstentionReason?: string;
  sources: AskSource[];
  verification: {
    citationStripped: number;
    faithfulnessStripped: number;
    partialCount: number;
  };
  meta: {
    strategies_used: number;
    text_search_fallback: boolean;
    total_chunks_found: number;
    top_chunks_used: number;
    latencyMs: number;
  };
  searchResults: LibraryDoc[];
  totalDocuments: number;
  error?: string;
}

const SUGGESTIONS = [
  "What is BBNJ?",
  "What changed in deep-sea mining regulation recently?",
  "What is the current enforcement trend under MARPOL Annex VI?",
  "What does the ISA mining code say about environmental bonds?",
];

// ─── Citation chip ───────────────────────────────────────────────────────────
function Cite({ n }: { n: number }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: TEAL, background: TEAL_BG,
      borderRadius: 3, padding: "1px 5px", fontFamily: MONO,
    }}>[{n}]</span>
  );
}

// ─── Render answer text with inline citations ────────────────────────────────
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) return <Cite key={i} n={parseInt(m[1])} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Tier badge (outline pill) ───────────────────────────────────────────────
function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, fontFamily: MONO, letterSpacing: ".04em",
      textTransform: "uppercase", color: T4,
      border: `1px solid ${BLT}`, borderRadius: 3, padding: "1px 6px",
    }}>{tier}</span>
  );
}

// ─── Answer card ─────────────────────────────────────────────────────────────
function AnswerCard({ question, data }: { question: string; data: ResearchResponse }) {
  const { answer, sources, verification, meta } = data;
  const verifiedCount = sources.length - verification.faithfulnessStripped;

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
      {/* Question header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}`, background: BG }}>
        <div style={{ fontSize: 14, color: T2, fontStyle: "italic", lineHeight: 1.5 }}>{question}</div>
      </div>
      {/* Answer body */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.8, color: T1 }}>
          <AnswerText text={answer!} />
        </div>
      </div>
      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO, letterSpacing: ".06em", textTransform: "uppercase", color: T4, marginBottom: 8, paddingTop: 12, borderTop: `1px solid ${BLT}` }}>
            Sources
          </div>
          {sources.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0",
              borderBottom: i < sources.length - 1 ? `1px solid ${BLT}` : "none",
              cursor: s.file_url ? "pointer" : "default",
            }} onClick={() => s.file_url && window.open(s.file_url, "_blank")}>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: MONO, color: T4, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>
                  {s.title}{s.file_url ? " \u2197" : ""}
                </div>
                <div style={{ fontSize: 11, fontFamily: MONO, color: T4, marginTop: 2 }}>
                  {[s.source_organisation, s.published_date?.slice(0, 10)].filter(Boolean).join(" \u00b7 ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Footer stats */}
      <div style={{
        background: BG, borderTop: `1px solid ${BLT}`, padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        fontFamily: MONO, fontSize: 11, color: T4,
      }}>
        <span>{meta.top_chunks_used} passages used</span>
        {verifiedCount > 0 && <span>{verifiedCount} verified</span>}
        {verification.citationStripped > 0 && <span>{verification.citationStripped} citation{verification.citationStripped !== 1 ? "s" : ""} stripped</span>}
        {verification.faithfulnessStripped > 0 && <span>{verification.faithfulnessStripped} unsupported removed</span>}
        <span>{(meta.latencyMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ─── Abstention card ─────────────────────────────────────────────────────────
function AbstentionCard({ question, data }: { question: string; data: ResearchResponse }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}`, background: BG }}>
        <div style={{ fontSize: 14, color: T2, fontStyle: "italic", lineHeight: 1.5 }}>{question}</div>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: T2 }}>
          The library does not contain enough information to answer this reliably.
        </div>
        {data.abstentionReason && (
          <div style={{ fontSize: 12, fontFamily: MONO, color: T4, marginTop: 8 }}>
            {data.abstentionReason}
          </div>
        )}
      </div>
      <div style={{
        background: BG, borderTop: `1px solid ${BLT}`, padding: "10px 20px",
        fontFamily: MONO, fontSize: 11, color: T4,
      }}>
        {data.meta.total_chunks_found} passages checked \u00b7 {(data.meta.latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}

// ─── Library document list ───────────────────────────────────────────────────
function LibraryResults({ docs, total }: { docs: LibraryDoc[]; total: number }) {
  if (docs.length === 0) return null;
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 600, fontFamily: MONO, letterSpacing: ".06em",
        textTransform: "uppercase", color: T4, marginBottom: 10,
      }}>
        Library ({total.toLocaleString()} documents)
      </div>
      {docs.map((d, i) => (
        <div key={d.id} style={{
          display: "flex", alignItems: "baseline", gap: 12,
          padding: "10px 0",
          borderBottom: i < docs.length - 1 ? `1px solid ${BLT}` : "none",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4 }}>
              {d.title}
            </div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: T4, marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {d.source_organisation && <span>{d.source_organisation}</span>}
              {d.published_date && <span>{d.published_date.slice(0, 10)}</span>}
              {d.document_type && <span>{d.document_type}</span>}
              <TierBadge tier={d.source_tier} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // / key to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = async (text?: string) => {
    const q = (text || query).trim();
    if (!q) return;
    setQuery(q);
    setSubmittedQuery(q);
    setIsLoading(true);
    setData(null);
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

      setData(await res.json());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasResult = data !== null;
  const showEmpty = !hasResult && !isLoading && !error;

  return (
    <DesktopOnly featureName="Research">
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", fontFamily: F }}>

      {/* ── Search header ── */}
      <div style={{
        background: WHITE, borderBottom: `1px solid ${BORDER}`,
        padding: showEmpty ? "48px 40px 32px" : "24px 40px 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        transition: "padding .25s",
      }}>
        {/* Empty state: title + strapline */}
        {showEmpty && (
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: T1, letterSpacing: "-.02em", marginBottom: 8 }}>
              Tideline Research
            </div>
            <div style={{ fontSize: 13, fontWeight: 300, color: T3, maxWidth: 420, lineHeight: 1.5 }}>
              Cited answers from the document library. We don&apos;t search the internet. We search the library we built.
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{
          width: "100%", maxWidth: 560, height: 48,
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6,
          display: "flex", alignItems: "center", padding: "0 8px 0 16px", gap: 10,
          boxShadow: "0 1px 3px rgba(60,64,67,.08)",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke={T4} strokeWidth="1.4"/>
            <path d="M11 11l3.5 3.5" stroke={T4} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Ask a question..."
            autoFocus
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: F, fontSize: 14, fontWeight: 300, color: T1,
            }}
          />
          <span style={{ fontSize: 11, fontFamily: MONO, color: T4, padding: "2px 6px", border: `1px solid ${BLT}`, borderRadius: 3 }}>/</span>
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            style={{
              height: 32, padding: "0 14px", borderRadius: 4,
              background: isLoading ? T4 : NAVY, border: "none",
              fontSize: 12, fontWeight: 500, color: WHITE,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = NAVY2; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = NAVY; }}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Strapline */}
        <div style={{ fontSize: 11, color: T4, marginTop: 10, fontWeight: 300 }}>
          Tideline reports what sources say. It does not tell you what to conclude.
        </div>

        {/* Empty state suggestions */}
        {showEmpty && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20, maxWidth: 600 }}>
            {SUGGESTIONS.map((s, i) => (
              <span key={i} onClick={() => handleSubmit(s)} style={{
                fontSize: 12, color: T3, padding: "6px 14px",
                border: `1px solid ${BLT}`, borderRadius: 4, cursor: "pointer",
                transition: "border-color .15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = TEAL)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BLT)}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Results area ── */}
      <div style={{ padding: "24px 40px", maxWidth: 760, width: "100%", margin: "0 auto" }}>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 13, fontFamily: MONO, color: T4 }}>
              Searching the library...
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{
            background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8,
            padding: "20px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 300, color: T2 }}>{error}</div>
          </div>
        )}

        {/* Answer or abstention */}
        {data && !isLoading && (
          <>
            {data.abstained ? (
              <AbstentionCard question={submittedQuery} data={data} />
            ) : data.answer ? (
              <AnswerCard question={submittedQuery} data={data} />
            ) : null}

            {/* Library search results (always shown when we have data) */}
            <LibraryResults docs={data.searchResults} total={data.totalDocuments} />
          </>
        )}
      </div>
    </div>
    </DesktopOnly>
  );
}
