"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const RED_T  = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M      = "var(--font-mono), 'DM Mono', monospace";

const DOC_TYPES = [
  { value: "treaty", label: "Treaty" },
  { value: "resolution", label: "Resolution" },
  { value: "report", label: "Report" },
  { value: "regulation", label: "Regulation" },
  { value: "scientific_paper", label: "Scientific Paper" },
  { value: "ngo_report", label: "NGO Report" },
  { value: "government_document", label: "Government Document" },
  { value: "court_filing", label: "Court Filing" },
  { value: "other", label: "Other" },
];

const CONFIDENCE_DISPLAY: Record<string, { color: string; label: string }> = {
  high:   { color: TEAL,  label: "Metadata verified" },
  medium: { color: AMBER, label: "Please review metadata" },
  low:    { color: RED_T, label: "Metadata needs review - please check all fields" },
};

interface PendingDoc {
  id: string;
  title: string;
  source_organisation: string | null;
  document_type: string | null;
  submitted_by: string | null;
  created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminLibraryPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"upload" | "review">("upload");

  // Upload state
  const [title, setTitle] = useState("");
  const [sourceOrg, setSourceOrg] = useState("");
  const [docType, setDocType] = useState("report");
  const [pubDate, setPubDate] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [regionInput, setRegionInput] = useState("");
  const [regionTags, setRegionTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [scanWarning, setScanWarning] = useState("");

  // Review state
  const [pending, setPending] = useState<PendingDoc[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Admin check
  useEffect(() => {
    fetch("/api/subscription-status")
      .then(r => r.json())
      .then(d => {
        if (d.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.replace("/platform/feed");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.replace("/platform/feed");
      });
  }, [router]);

  // Load pending docs when review tab is active
  useEffect(() => {
    if (tab === "review") loadPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadPending() {
    setReviewLoading(true);
    try {
      const res = await fetch("/api/admin/documents/review");
      const data = await res.json();
      setPending(data.documents || []);
    } catch {
      setPending([]);
    }
    setReviewLoading(false);
  }

  // Auto-extract metadata when file is set
  const extractMetadata = useCallback(async (f: File) => {
    setExtracting(true);
    setScanWarning("");
    setConfidence(null);

    try {
      // Client-side text extraction
      const arrayBuffer = await f.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      const maxPages = Math.min(5, pdf.numPages);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        text += pageText + "\n";
        if (text.length > 6000) break;
      }

      text = text.slice(0, 6000).trim();

      if (text.length < 100) {
        setScanWarning(
          "This appears to be a scanned document. Please fill in the metadata manually."
        );
        setExtracting(false);
        return;
      }

      // Send text only to API (not the file)
      const res = await fetch("/api/library/extract-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.error === "scanned") {
        setScanWarning(data.message);
      } else if (data.title) {
        setTitle(data.title || "");
        setSourceOrg(data.source_organisation || "");
        setDocType(data.document_type || "report");
        setPubDate(data.published_date || "");
        setTopicTags(data.topic_tags || []);
        setRegionTags(data.region_tags || []);
        setConfidence(data.confidence);
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setScanWarning(
        "Could not extract text. Please fill in the metadata manually."
      );
    }

    setExtracting(false);
  }, []);

  function handleTopicKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "," || e.key === "Enter") && topicInput.trim()) {
      e.preventDefault();
      const tag = topicInput.trim().replace(/,+$/, "");
      if (tag && !topicTags.includes(tag)) {
        setTopicTags([...topicTags, tag]);
      }
      setTopicInput("");
    }
  }

  function handleRegionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "," || e.key === "Enter") && regionInput.trim()) {
      e.preventDefault();
      const tag = regionInput.trim().replace(/,+$/, "");
      if (tag && !regionTags.includes(tag)) {
        setRegionTags([...regionTags, tag]);
      }
      setRegionInput("");
    }
  }

  async function handleUpload() {
    if (!file || !title.trim()) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim());
    fd.append("source_organisation", sourceOrg.trim());
    fd.append("document_type", docType);
    fd.append("published_date", pubDate);
    fd.append("topic_tags", topicTags.join(","));
    fd.append("region_tags", regionTags.join(","));

    try {
      const res = await fetch("/api/admin/documents/upload", { method: "POST", body: fd });
      if (res.ok) {
        window.open('/platform/library', '_blank');
        setToast("Document added to library");
        setTitle(""); setSourceOrg(""); setDocType("report"); setPubDate("");
        setTopicTags([]); setRegionTags([]); setFile(null);
        setConfidence(null); setScanWarning("");
        if (fileRef.current) fileRef.current.value = "";
        setTimeout(() => setToast(""), 3000);
      }
    } catch {
      // silent
    }
    setUploading(false);
  }

  async function handleReview(docId: string, action: "approve" | "reject") {
    await fetch("/api/admin/documents/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: docId, action }),
    });
    setPending(pending.filter(d => d.id !== docId));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      extractMetadata(f);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) extractMetadata(f);
  }

  if (isAdmin === null) {
    return <div style={{ padding: 40, fontFamily: F, fontSize: 13, color: T4, textAlign: "center" }}>Loading...</div>;
  }
  if (!isAdmin) return null;

  const labelStyle: React.CSSProperties = {
    fontFamily: F, fontSize: 12, fontWeight: 500,
    color: T3, textTransform: "uppercase",
    letterSpacing: ".05em", marginBottom: 6, display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box" as const,
    fontFamily: F, fontSize: 14, color: T1,
    padding: "10px 14px", border: `1px solid ${BORDER}`,
    borderRadius: 6, outline: "none", background: WHITE,
  };

  const extractingFieldStyle: React.CSSProperties = extracting
    ? { opacity: 0.5, animation: "pulse-field 1.5s ease-in-out infinite" }
    : {};

  return (
    <>
      {/* Pulse animation for extracting state */}
      <style>{`
        @keyframes pulse-field {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 200,
          fontFamily: F, fontSize: 14, fontWeight: 500,
          color: WHITE, background: TEAL,
          padding: "12px 24px", borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,.15)",
        }}>
          {toast}
        </div>
      )}

      <div style={{ padding: "24px 24px 40px" }}>
        {/* Header */}
        <h1 style={{
          fontFamily: F, fontSize: 28, fontWeight: 600,
          color: NAVY, margin: "0 0 24px", letterSpacing: "-.02em",
        }}>
          Library Admin
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: `1px solid ${BLT}` }}>
          {(["upload", "review"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: F, fontSize: 14, fontWeight: 500,
                color: tab === t ? TEAL : T3,
                background: "none", border: "none",
                padding: "10px 20px",
                borderBottom: tab === t ? `2px solid ${TEAL}` : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {t === "upload" ? "Upload Document" : "Review Submissions"}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab === "upload" && (
          <div style={{ maxWidth: 560 }}>
            {/* File upload — first, triggers extraction */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>File</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? TEAL : BORDER}`,
                  borderRadius: 8, padding: "32px 20px",
                  textAlign: "center", cursor: "pointer",
                  background: dragOver ? "#F0FAF6" : WHITE,
                  transition: "all .15s",
                }}
              >
                <input
                  ref={fileRef} type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T1 }}>{file.name}</div>
                    <div style={{ fontFamily: M, fontSize: 12, color: T4, marginTop: 4 }}>
                      {(file.size / 1048576).toFixed(1)} MB
                      {extracting && <span style={{ color: TEAL, marginLeft: 8 }}>Extracting metadata...</span>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: F, fontSize: 14, color: T3 }}>Drop a file here or click to browse</div>
                    <div style={{ fontFamily: M, fontSize: 12, color: T4, marginTop: 4 }}>PDF, DOCX, or TXT up to 50 MB</div>
                  </div>
                )}
              </div>
            </div>

            {/* Scanned document warning */}
            {scanWarning && (
              <div style={{
                fontFamily: F, fontSize: 13, color: "#7A5900",
                background: "#FEF7E0", border: `1px solid ${AMBER}`,
                borderRadius: 6, padding: "10px 14px", marginBottom: 20,
              }}>
                {scanWarning}
              </div>
            )}

            {/* Confidence indicator */}
            {confidence && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: CONFIDENCE_DISPLAY[confidence].color,
                  display: "inline-block",
                }} />
                <span style={{ fontFamily: F, fontSize: 12, color: T3 }}>
                  {CONFIDENCE_DISPLAY[confidence].label}
                </span>
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={extracting ? "Extracting..." : ""}
                style={inputStyle}
              />
            </div>

            {/* Source organisation */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Source organisation</label>
              <input
                type="text" value={sourceOrg} onChange={e => setSourceOrg(e.target.value)}
                placeholder={extracting ? "Extracting..." : ""}
                style={inputStyle}
              />
            </div>

            {/* Document type */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Document type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {DOC_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            {/* Published date */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Published date</label>
              <input
                type="date" value={pubDate} onChange={e => setPubDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Topic tags */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Topic tags</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: topicTags.length ? 8 : 0 }}>
                {topicTags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: M, fontSize: 11, color: T2,
                    background: BLT, padding: "3px 10px", borderRadius: 3,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    {tag}
                    <span onClick={() => setTopicTags(topicTags.filter(t => t !== tag))} style={{ cursor: "pointer", color: T4, fontSize: 14, lineHeight: 1 }}>&times;</span>
                  </span>
                ))}
              </div>
              <input
                type="text" value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                placeholder={extracting ? "Extracting..." : "Type and press Enter or comma"}
                style={inputStyle}
              />
            </div>

            {/* Region tags */}
            <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
              <label style={labelStyle}>Region tags</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: regionTags.length ? 8 : 0 }}>
                {regionTags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: M, fontSize: 11, color: T2,
                    background: BLT, padding: "3px 10px", borderRadius: 3,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    {tag}
                    <span onClick={() => setRegionTags(regionTags.filter(t => t !== tag))} style={{ cursor: "pointer", color: T4, fontSize: 14, lineHeight: 1 }}>&times;</span>
                  </span>
                ))}
              </div>
              <input
                type="text" value={regionInput}
                onChange={e => setRegionInput(e.target.value)}
                onKeyDown={handleRegionKeyDown}
                placeholder={extracting ? "Extracting..." : "Type and press Enter or comma"}
                style={inputStyle}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={uploading || extracting || !file || !title.trim()}
              style={{
                fontFamily: F, fontSize: 14, fontWeight: 500,
                color: WHITE,
                background: (!file || !title.trim() || extracting) ? T4 : TEAL,
                padding: "12px 28px", borderRadius: 4,
                border: "none",
                cursor: (!file || !title.trim() || extracting) ? "default" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Add to library"}
            </button>
          </div>
        )}

        {/* Review tab */}
        {tab === "review" && (
          <div>
            {reviewLoading ? (
              <div style={{ fontSize: 13, color: T4, textAlign: "center", padding: "40px 0" }}>Loading...</div>
            ) : pending.length === 0 ? (
              <div style={{ fontSize: 14, color: T3, textAlign: "center", padding: "60px 0" }}>
                No submissions pending review. You are up to date.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${BLT}` }}>
                      {["Title", "Submitted by", "Date", "Type", "Actions"].map(h => (
                        <th key={h} style={{
                          textAlign: "left", padding: "10px 12px",
                          fontFamily: F, fontSize: 11, fontWeight: 600,
                          color: T4, textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(doc => (
                      <tr key={doc.id} style={{ borderBottom: `1px solid ${BLT}` }}>
                        <td style={{ padding: "12px", color: T1, fontWeight: 500 }}>{doc.title}</td>
                        <td style={{ padding: "12px", fontFamily: M, fontSize: 12, color: T3 }}>{doc.submitted_by || "Unknown"}</td>
                        <td style={{ padding: "12px", fontFamily: M, fontSize: 12, color: T4 }}>{fmtDate(doc.created_at)}</td>
                        <td style={{ padding: "12px" }}>
                          {doc.document_type && (
                            <span style={{
                              fontFamily: M, fontSize: 10, fontWeight: 500,
                              letterSpacing: ".04em", textTransform: "uppercase",
                              color: WHITE, background: TEAL,
                              padding: "2px 8px", borderRadius: 3,
                            }}>
                              {doc.document_type.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px", display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleReview(doc.id, "approve")}
                            style={{
                              fontFamily: F, fontSize: 13, fontWeight: 500,
                              color: WHITE, background: TEAL,
                              padding: "6px 16px", borderRadius: 4,
                              border: "none", cursor: "pointer",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(doc.id, "reject")}
                            style={{
                              fontFamily: F, fontSize: 13, fontWeight: 500,
                              color: RED_T, background: "none",
                              padding: "6px 16px", borderRadius: 4,
                              border: `1px solid ${RED_T}`, cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
