"use client";

import { useState, useEffect, useCallback } from "react";

const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const TEAL   = "#1D9E75";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M      = "var(--font-mono), 'DM Mono', monospace";

interface Document {
  id: string;
  title: string;
  source_organisation: string | null;
  document_type: string | null;
  published_date: string | null;
  topic_tags: string[] | null;
  region_tags: string[] | null;
  file_size_bytes: number | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  treaty: "Treaty",
  resolution: "Resolution",
  report: "Report",
  regulation: "Regulation",
  scientific_paper: "Scientific Paper",
  ngo_report: "NGO Report",
  government_document: "Government Document",
  court_filing: "Court Filing",
  other: "Other",
};

const FILTER_TYPES = [
  { key: "", label: "All" },
  { key: "treaty", label: "Treaty" },
  { key: "resolution", label: "Resolution" },
  { key: "report", label: "Report" },
  { key: "regulation", label: "Regulation" },
  { key: "scientific_paper", label: "Scientific Paper" },
  { key: "ngo_report", label: "NGO Report" },
  { key: "government_document", label: "Government Document" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerDoc, setDrawerDoc] = useState<Document | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const search = useCallback(async (q: string, type: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    try {
      const res = await fetch(`/api/library/search?${params}`);
      const data = await res.json();
      setDocs(data.documents || []);
      setCount(data.count || 0);
      setTotalCount(data.totalCount || 0);
    } catch {
      setDocs([]);
      setCount(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    search(query, activeType);
  }, [query, activeType, search]);

  // Debounced search input
  const [inputVal, setInputVal] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(inputVal), 300);
    return () => clearTimeout(t);
  }, [inputVal]);

  async function handleViewDocument(docId: string) {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/library/signed-url?id=${docId}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // silent fail
    }
    setViewLoading(false);
  }

  return (
    <>
      <style>{`
        .lib-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .lib-drawer-overlay { display: none; }
        .lib-drawer-overlay.open { display: block; }
        @media (max-width: 768px) {
          .lib-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ padding: "24px 24px 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{
            fontFamily: F, fontSize: 28, fontWeight: 600,
            color: NAVY, margin: 0, letterSpacing: "-.02em",
          }}>
            The Tideline Library
          </h1>
        </div>
        <div style={{
          fontFamily: M, fontSize: 13, color: TEAL,
          marginBottom: 20,
        }}>
          {loading ? "..." : `${totalCount} curated documents`}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search treaties, reports, regulations..."
            style={{
              width: "100%", boxSizing: "border-box",
              fontFamily: F, fontSize: 14, color: T1,
              padding: "12px 16px", border: `1px solid ${BORDER}`,
              borderRadius: 8, outline: "none",
              background: WHITE,
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap",
          marginBottom: 24,
        }}>
          {FILTER_TYPES.map(ft => (
            <button
              key={ft.key}
              onClick={() => setActiveType(ft.key)}
              style={{
                fontFamily: M, fontSize: 12, fontWeight: 500,
                padding: "6px 14px", borderRadius: 20,
                border: activeType === ft.key ? `1px solid ${TEAL}` : `1px solid ${BORDER}`,
                background: activeType === ft.key ? TEAL : WHITE,
                color: activeType === ft.key ? WHITE : T3,
                cursor: "pointer",
                letterSpacing: ".01em",
              }}
            >
              {ft.label}
            </button>
          ))}
        </div>

        {/* Document grid */}
        {loading ? (
          <div style={{ fontSize: 13, color: T4, textAlign: "center", padding: "40px 0" }}>
            Loading...
          </div>
        ) : docs.length === 0 ? (
          <div style={{ fontSize: 14, color: T3, textAlign: "center", padding: "60px 0" }}>
            No documents found. Try a different search.
          </div>
        ) : (
          <div className="lib-grid">
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setDrawerDoc(doc)}
                style={{
                  background: WHITE, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: "20px",
                  cursor: "pointer", transition: "border-color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
              >
                {/* Type badge */}
                {doc.document_type && (
                  <span style={{
                    fontFamily: M, fontSize: 10, fontWeight: 500,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    color: WHITE, background: TEAL,
                    padding: "2px 8px", borderRadius: 3,
                    display: "inline-block", marginBottom: 10,
                  }}>
                    {TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                )}

                {/* Title */}
                <div style={{
                  fontFamily: F, fontSize: 15, fontWeight: 600,
                  color: T1, lineHeight: 1.4, marginBottom: 8,
                }}>
                  {doc.title}
                </div>

                {/* Source + date */}
                <div style={{
                  fontFamily: F, fontSize: 13, color: T3,
                  marginBottom: 10,
                }}>
                  {doc.source_organisation}
                  {doc.source_organisation && doc.published_date ? " \u00B7 " : ""}
                  {doc.published_date && (
                    <span style={{ fontFamily: M, fontSize: 12, color: T4 }}>
                      {fmtDate(doc.published_date)}
                    </span>
                  )}
                </div>

                {/* Topic tags */}
                {doc.topic_tags && doc.topic_tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {doc.topic_tags.map(tag => (
                      <span key={tag} style={{
                        fontFamily: M, fontSize: 10, fontWeight: 500,
                        color: T3, background: BLT,
                        padding: "2px 8px", borderRadius: 3,
                        textTransform: "uppercase", letterSpacing: ".04em",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in drawer overlay */}
      <div
        className={`lib-drawer-overlay${drawerDoc ? " open" : ""}`}
        onClick={() => setDrawerDoc(null)}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(10, 22, 40, 0.4)",
        }}
      />
      {/* Slide-in drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: "100vw", zIndex: 101,
        background: WHITE, boxShadow: "-4px 0 24px rgba(0,0,0,.08)",
        transform: drawerDoc ? "translateX(0)" : "translateX(100%)",
        transition: "transform .25s ease",
        overflowY: "auto",
        padding: "32px 28px",
      }}>
        {drawerDoc && (
          <>
            {/* Close */}
            <button
              onClick={() => setDrawerDoc(null)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none",
                fontSize: 20, color: T4, cursor: "pointer",
              }}
            >
              &#x2715;
            </button>

            {/* Type badge */}
            {drawerDoc.document_type && (
              <span style={{
                fontFamily: M, fontSize: 10, fontWeight: 500,
                letterSpacing: ".06em", textTransform: "uppercase",
                color: WHITE, background: TEAL,
                padding: "3px 10px", borderRadius: 3,
                display: "inline-block", marginBottom: 16,
              }}>
                {TYPE_LABELS[drawerDoc.document_type] || drawerDoc.document_type}
              </span>
            )}

            {/* Title */}
            <h2 style={{
              fontFamily: F, fontSize: 20, fontWeight: 600,
              color: NAVY, margin: "0 0 16px", lineHeight: 1.35,
            }}>
              {drawerDoc.title}
            </h2>

            {/* Metadata rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {drawerDoc.source_organisation && (
                <div>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Source</div>
                  <div style={{ fontFamily: F, fontSize: 14, color: T1 }}>{drawerDoc.source_organisation}</div>
                </div>
              )}
              {drawerDoc.published_date && (
                <div>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Published</div>
                  <div style={{ fontFamily: M, fontSize: 13, color: T2 }}>{fmtDate(drawerDoc.published_date)}</div>
                </div>
              )}
              {drawerDoc.file_size_bytes && (
                <div>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>File size</div>
                  <div style={{ fontFamily: M, fontSize: 13, color: T2 }}>{fmtSize(drawerDoc.file_size_bytes)}</div>
                </div>
              )}
            </div>

            {/* Tags */}
            {drawerDoc.topic_tags && drawerDoc.topic_tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Topics</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {drawerDoc.topic_tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: M, fontSize: 10, fontWeight: 500,
                      color: T3, background: BLT,
                      padding: "3px 10px", borderRadius: 3,
                      textTransform: "uppercase", letterSpacing: ".04em",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {drawerDoc.region_tags && drawerDoc.region_tags.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Regions</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {drawerDoc.region_tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: M, fontSize: 10, fontWeight: 500,
                      color: T3, background: BLT,
                      padding: "3px 10px", borderRadius: 3,
                      textTransform: "uppercase", letterSpacing: ".04em",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* View document button - fetches signed URL */}
            <button
              onClick={() => handleViewDocument(drawerDoc.id)}
              disabled={viewLoading}
              style={{
                display: "inline-block",
                fontFamily: F, fontSize: 14, fontWeight: 500,
                color: WHITE, background: viewLoading ? T4 : TEAL,
                padding: "12px 28px", borderRadius: 4,
                border: "none", cursor: viewLoading ? "default" : "pointer",
              }}
            >
              {viewLoading ? "Opening..." : "View document"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
