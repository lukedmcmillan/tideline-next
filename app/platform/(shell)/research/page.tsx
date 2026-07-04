"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import DesktopOnly from "@/components/DesktopOnly";

// ─── Design tokens ───────────────────────────────────────────────────────────
const NAVY    = "#0B1628";
const NAVY2   = "#0D1E35";
const TEAL    = "#1D9E75";
const TEAL_LIGHT = "#E6F4F1";
const TEAL_BG = "rgba(29,158,117,0.06)";
const WHITE   = "#FFFFFF";
const BG      = "#F8F9FA";
const WARM    = "#FAFAF8";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const F       = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const MONO    = "'DM Mono', 'IBM Plex Mono', monospace";

// ─── API types ───────────────────────────────────────────────────────────────
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
  verification: { citationStripped: number; faithfulnessStripped: number; partialCount: number };
  meta: { strategies_used: number; text_search_fallback: boolean; total_chunks_found: number; top_chunks_used: number; latencyMs: number };
  searchResults: LibraryDoc[];
  totalDocuments: number;
}

const SUGGESTIONS = [
  { q: "What is BBNJ?", label: "Treaty" },
  { q: "What changed in deep-sea mining regulation recently?", label: "Regulation" },
  { q: "What is the current MARPOL Annex VI enforcement trend?", label: "Enforcement" },
  { q: "What does the ISA mining code say about environmental bonds?", label: "Policy" },
];

// ─── Pipeline stage indicator ────────────────────────────────────────────────
const STAGES = ["Searching library", "Ranking sources", "Generating answer"] as const;
const STAGE_MS = [0, 2000, 5000];

function useStageProgress(isLoading: boolean) {
  const [stage, setStage] = useState(-1);
  const start = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (isLoading) {
      start.current = Date.now();
      setStage(0);
      const tick = () => {
        const elapsed = Date.now() - start.current;
        let s = 0;
        for (let i = STAGE_MS.length - 1; i >= 0; i--) {
          if (elapsed >= STAGE_MS[i]) { s = i; break; }
        }
        setStage(s);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf.current);
      setStage(-1);
    }
    return () => cancelAnimationFrame(raf.current);
  }, [isLoading]);

  return stage;
}

// ─── Citation chip ───────────────────────────────────────────────────────────
function Cite({ n }: { n: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color: TEAL, background: TEAL_LIGHT,
      borderRadius: 4, padding: "2px 6px", fontFamily: MONO, verticalAlign: "super",
      lineHeight: 1, marginLeft: 1, marginRight: 1, cursor: "pointer",
    }}>{n}</span>
  );
}

// ─── Markdown renderer ──────────────────────────────────────────────────────
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    const cite = part.match(/^\[(\d+)\]$/);
    if (cite) { nodes.push(<Cite key={`c${i}`} n={parseInt(cite[1])} />); return; }
    const segs = part.split(/(\*\*[^*]+\*\*)/g);
    segs.forEach((seg, j) => {
      const bold = seg.match(/^\*\*(.+)\*\*$/);
      if (bold) { nodes.push(<strong key={`b${i}-${j}`} style={{ fontWeight: 600 }}>{bold[1]}</strong>); }
      else if (seg) { nodes.push(<span key={`t${i}-${j}`}>{seg}</span>); }
    });
  });
  return nodes;
}

function MarkdownAnswer({ text }: { text: string }) {
  const sanitised = text.replace(/<[^>]*>/g, "");
  const lines = sanitised.split("\n");
  const els: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flush = () => {
    if (!listItems.length) return;
    const items = listItems.map((item, i) => <li key={i} style={{ marginBottom: 3 }}>{renderInline(item)}</li>);
    els.push(listType === "ol"
      ? <ol key={`ol${els.length}`} style={{ margin: "8px 0", paddingLeft: 22, lineHeight: 1.75, color: T1 }}>{items}</ol>
      : <ul key={`ul${els.length}`} style={{ margin: "8px 0", paddingLeft: 22, lineHeight: 1.75, color: T1 }}>{items}</ul>);
    listItems = []; listType = null;
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flush(); continue; }
    const h3 = t.match(/^###\s+(.+)/);
    if (h3) { flush(); els.push(<h4 key={`h${els.length}`} style={{ fontSize: 13, fontWeight: 600, color: T1, margin: "14px 0 4px" }}>{renderInline(h3[1])}</h4>); continue; }
    const h2 = t.match(/^##\s+(.+)/);
    if (h2) { flush(); els.push(<h3 key={`h${els.length}`} style={{ fontSize: 14, fontWeight: 600, color: T1, margin: "16px 0 6px" }}>{renderInline(h2[1])}</h3>); continue; }
    const h1 = t.match(/^#\s+(.+)/);
    if (h1) { flush(); els.push(<h2 key={`h${els.length}`} style={{ fontSize: 15, fontWeight: 600, color: T1, margin: "18px 0 6px" }}>{renderInline(h1[1])}</h2>); continue; }
    const ul = t.match(/^[-*]\s+(.+)/);
    if (ul) { if (listType === "ol") flush(); listType = "ul"; listItems.push(ul[1]); continue; }
    const ol = t.match(/^\d+\.\s+(.+)/);
    if (ol) { if (listType === "ul") flush(); listType = "ol"; listItems.push(ol[1]); continue; }
    flush();
    els.push(<p key={`p${els.length}`} style={{ lineHeight: 1.8, color: T1, margin: "4px 0" }}>{renderInline(t)}</p>);
  }
  flush();
  return <div style={{ fontSize: 14, fontWeight: 300 }}>{els}</div>;
}

// ─── Tier badge ──────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, fontFamily: MONO, letterSpacing: ".05em",
      textTransform: "uppercase", color: tier === "PRIMARY" ? TEAL : T4,
      border: `1px solid ${tier === "PRIMARY" ? TEAL : BLT}`,
      borderRadius: 3, padding: "1px 5px",
    }}>{tier}</span>
  );
}

// ─── Answer card ─────────────────────────────────────────────────────────────
function AnswerCard({ question, data }: { question: string; data: ResearchResponse }) {
  const { answer, sources, verification, meta } = data;

  return (
    <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden", marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      {/* Question */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 15, color: T1, fontWeight: 500 }}>{question}</div>
      </div>
      {/* Answer */}
      <div style={{ padding: "20px 24px" }}>
        <MarkdownAnswer text={answer!} />
      </div>
      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em", textTransform: "uppercase", color: T4, marginBottom: 10, paddingTop: 16, borderTop: `1px solid ${BLT}` }}>
            {sources.length} source{sources.length !== 1 ? "s" : ""} cited
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
            {sources.map((s, i) => (
              <div key={i} onClick={() => s.file_url && window.open(s.file_url, "_blank")} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                background: BG, borderRadius: 8, cursor: s.file_url ? "pointer" : "default",
                transition: "background .15s",
              }}
                onMouseEnter={e => { if (s.file_url) e.currentTarget.style.background = TEAL_LIGHT; }}
                onMouseLeave={e => { e.currentTarget.style.background = BG; }}
              >
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 22, height: 22, borderRadius: 6, background: TEAL_LIGHT,
                  fontSize: 11, fontWeight: 700, color: TEAL, fontFamily: MONO, flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T1, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {s.title}{s.file_url ? " \u2197" : ""}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: MONO, color: T4, marginTop: 3 }}>
                    {[s.source_organisation, s.published_date?.slice(0, 10)].filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${BLT}`, padding: "10px 24px",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        fontFamily: MONO, fontSize: 10, color: T4,
      }}>
        <span>{meta.top_chunks_used} passages</span>
        {verification.citationStripped > 0 && <span>{verification.citationStripped} invalid citation{verification.citationStripped !== 1 ? "s" : ""} removed</span>}
        <span style={{ marginLeft: "auto" }}>{(meta.latencyMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ─── Abstention card ─────────────────────────────────────────────────────────
function AbstentionCard({ question, data }: { question: string; data: ResearchResponse }) {
  return (
    <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden", marginBottom: 28 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 15, color: T1, fontWeight: 500 }}>{question}</div>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.7, color: T2 }}>
          The library does not contain enough information to answer this reliably.
        </div>
        {data.abstentionReason && (
          <div style={{ fontSize: 12, fontFamily: MONO, color: T4, marginTop: 10, padding: "8px 12px", background: BG, borderRadius: 6 }}>
            {data.abstentionReason}
          </div>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${BLT}`, padding: "10px 24px", fontFamily: MONO, fontSize: 10, color: T4 }}>
        {data.meta.total_chunks_found} passages checked \u00b7 {(data.meta.latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}

// ─── Library results ─────────────────────────────────────────────────────────
function LibraryResults({ docs, total }: { docs: LibraryDoc[]; total: number }) {
  if (docs.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: ".08em",
        textTransform: "uppercase", color: T4, marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        Library
        <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{total.toLocaleString()} documents</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: BLT, borderRadius: 8, overflow: "hidden" }}>
        {docs.map((d) => (
          <div key={d.id} style={{
            background: WHITE, padding: "12px 16px",
            display: "flex", alignItems: "baseline", gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4 }}>
                {d.title}
              </div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: T4, marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {d.source_organisation && <span>{d.source_organisation}</span>}
                {d.published_date && <span>{d.published_date.slice(0, 10)}</span>}
                {d.document_type && <span>{d.document_type}</span>}
                <TierBadge tier={d.source_tier} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeStage = useStageProgress(isLoading);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault(); inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleSubmit = async (text?: string) => {
    const q = (text || query).trim();
    if (!q) return;
    setQuery(q); setSubmitted(q); setIsLoading(true); setData(null); setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }), signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally { setIsLoading(false); }
  };

  const hasResult = data !== null;
  const showEmpty = !hasResult && !isLoading && !error;

  return (
    <DesktopOnly featureName="Ask Tideline">
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", fontFamily: F, background: WARM }}>

      {/* ── Hero / Search ── */}
      <div style={{
        background: WHITE, borderBottom: `1px solid ${BLT}`,
        padding: showEmpty ? "56px 40px 40px" : "20px 40px 18px",
        display: "flex", flexDirection: "column", alignItems: "center",
        transition: "padding .3s ease",
      }}>
        {showEmpty && (
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.8"/><path d="M12.5 12.5l3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontSize: 24, fontWeight: 600, color: T1, letterSpacing: "-.03em" }}>Ask Tideline</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 300, color: T3, maxWidth: 440, lineHeight: 1.55 }}>
              Cited answers from the document library. We don&apos;t search the internet. We search the library we built.
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{
          width: "100%", maxWidth: 600, height: 52,
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 26,
          display: "flex", alignItems: "center", padding: "0 6px 0 20px", gap: 10,
          boxShadow: showEmpty ? "0 2px 12px rgba(0,0,0,.06)" : "0 1px 3px rgba(0,0,0,.04)",
          transition: "box-shadow .3s",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke={T4} strokeWidth="1.6"/>
            <path d="M12.5 12.5l3 3" stroke={T4} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Ask anything about ocean governance, regulation, or policy..."
            autoFocus
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: F, fontSize: 15, fontWeight: 300, color: T1,
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            style={{
              height: 40, padding: "0 20px", borderRadius: 20,
              background: isLoading ? T4 : TEAL, border: "none",
              fontSize: 13, fontWeight: 600, color: WHITE, letterSpacing: "-.01em",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background .15s, transform .1s",
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Strapline */}
        {showEmpty && (
          <div style={{ fontSize: 12, color: T4, marginTop: 14, fontWeight: 300 }}>
            Tideline reports what sources say. It does not tell you what to conclude.
          </div>
        )}

        {/* Suggestion chips */}
        {showEmpty && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 24, maxWidth: 640 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSubmit(s.q)} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: T2, padding: "8px 16px",
                background: WHITE, border: `1px solid ${BLT}`, borderRadius: 20,
                cursor: "pointer", transition: "all .15s", fontFamily: F, fontWeight: 400,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BLT; e.currentTarget.style.color = T2; }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: MONO, textTransform: "uppercase",
                  color: TEAL, background: TEAL_LIGHT, borderRadius: 3, padding: "2px 5px",
                  letterSpacing: ".04em",
                }}>{s.label}</span>
                {s.q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div style={{ padding: "28px 40px 40px", maxWidth: 780, width: "100%", margin: "0 auto" }}>

        {/* Loading stages */}
        {isLoading && (
          <div style={{ padding: "24px 0 32px" }}>
            {STAGES.map((label, i) => {
              const isActive = i === activeStage;
              const isDone = i < activeStage;
              return (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                  fontFamily: MONO, fontSize: 12,
                  color: isActive ? TEAL : isDone ? T4 : BLT,
                  transition: "color .3s",
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: isActive ? TEAL : isDone ? T4 : "transparent",
                    border: !isActive && !isDone ? `1.5px solid ${BLT}` : "none",
                    flexShrink: 0,
                  }} />
                  {label}{isActive ? "..." : ""}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 400, color: T2 }}>{error}</div>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <>
            {data.abstained
              ? <AbstentionCard question={submitted} data={data} />
              : data.answer
                ? <AnswerCard question={submitted} data={data} />
                : null}
            <LibraryResults docs={data.searchResults} total={data.totalDocuments} />
          </>
        )}
      </div>
    </div>
    </DesktopOnly>
  );
}
