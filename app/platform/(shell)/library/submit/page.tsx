"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

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
const M      = "var(--font-sans), 'DM Sans', sans-serif";

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
  low:    { color: RED_T, label: "Metadata needs review" },
};

export default function SubmitDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [scanWarning, setScanWarning] = useState("");

  // Metadata fields
  const [title, setTitle] = useState("");
  const [sourceOrg, setSourceOrg] = useState("");
  const [docType, setDocType] = useState("report");
  const [pubDate, setPubDate] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [topicTags, setTopicTags] = useState<string[]>([]);

  // Submission state
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const extractMetadata = useCallback(async (f: File) => {
    setExtracting(true);
    setScanWarning("");
    setConfidence(null);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      extractMetadata(f);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) extractMetadata(f);
  }

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

  async function handleSubmit() {
    if (!file || !title.trim() || !confirmed) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("source_organisation", sourceOrg.trim());
      formData.append("document_type", docType);
      formData.append("published_date", pubDate);
      formData.append("topic_tags", topicTags.join(","));
      formData.append("contributor_confirmed", "true");

      const res = await fetch("/api/documents/submit", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Submission failed. Please try again.");
    }
    setSubmitting(false);
  }

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

  // Success state
  if (submitted) {
    return (
      <div style={{ padding: "24px 48px 40px" }}>
        <div style={{
          maxWidth: 480, marginTop: 40,
          border: `1px solid ${TEAL}`, borderRadius: 8,
          padding: "32px 28px", background: "#F0FAF6",
        }}>
          <div style={{
            fontFamily: F, fontSize: 20, fontWeight: 600,
            color: NAVY, marginBottom: 12,
          }}>
            Document submitted
          </div>
          <p style={{
            fontFamily: F, fontSize: 14, color: T2,
            lineHeight: 1.6, margin: "0 0 20px",
          }}>
            Your document has been submitted for review.
            You will be notified when it goes live.
          </p>
          <Link
            href="/platform/library"
            style={{
              fontFamily: F, fontSize: 13, fontWeight: 500,
              color: TEAL, textDecoration: "none",
            }}
          >
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse-field {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <div style={{ padding: "24px 48px 40px" }}>
        {/* Header */}
        <h1 style={{
          fontFamily: F, fontSize: 28, fontWeight: 600,
          color: NAVY, margin: "0 0 4px", letterSpacing: "-.02em",
        }}>
          Submit a document
        </h1>
        <p style={{
          fontFamily: F, fontSize: 13, color: T3,
          margin: "0 0 28px", lineHeight: 1.5,
        }}>
          Share a primary source with the Tideline community.
          Submissions are reviewed before they go live.
        </p>

        <div style={{ maxWidth: 560 }}>
          {/* Step 1: File upload */}
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
                accept=".pdf"
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
                  <div style={{ fontFamily: F, fontSize: 14, color: T3 }}>Drop a PDF here or click to browse</div>
                  <div style={{ fontFamily: M, fontSize: 12, color: T4, marginTop: 4 }}>PDF up to 50 MB</div>
                </div>
              )}
            </div>
          </div>

          {/* Scan warning */}
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

          {/* Step 2: Metadata fields */}
          <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={extracting ? "Extracting..." : "Document title"}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
            <label style={labelStyle}>Source organisation</label>
            <input
              type="text" value={sourceOrg} onChange={e => setSourceOrg(e.target.value)}
              placeholder={extracting ? "Extracting..." : "Organisation name"}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
            <label style={labelStyle}>Document type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {DOC_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20, ...extractingFieldStyle }}>
            <label style={labelStyle}>Published date</label>
            <input
              type="date" value={pubDate} onChange={e => setPubDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24, ...extractingFieldStyle }}>
            <label style={labelStyle}>Topic tags</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: topicTags.length ? 8 : 0 }}>
              {topicTags.map(tag => (
                <span key={tag} style={{
                  fontFamily: M, fontSize: 11, color: T2,
                  background: BLT, padding: "3px 10px", borderRadius: 3,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  {tag}
                  <span
                    onClick={() => setTopicTags(topicTags.filter(t => t !== tag))}
                    style={{ cursor: "pointer", color: T4, fontSize: 14, lineHeight: 1 }}
                  >
                    &times;
                  </span>
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

          {/* Step 3: Rights confirmation */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              cursor: "pointer", fontFamily: F, fontSize: 13, color: T2,
              lineHeight: 1.5,
            }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, accentColor: TEAL }}
              />
              I confirm I have the right to share this document
            </label>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: F, fontSize: 13, color: RED_T,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || extracting || !file || !title.trim() || !confirmed}
              style={{
                fontFamily: F, fontSize: 14, fontWeight: 500,
                color: WHITE,
                background: (!file || !title.trim() || !confirmed || extracting) ? T4 : TEAL,
                padding: "12px 28px", borderRadius: 4,
                border: "none",
                cursor: (!file || !title.trim() || !confirmed || extracting) ? "default" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit for review"}
            </button>
            <Link
              href="/platform/library"
              style={{ fontFamily: F, fontSize: 13, color: T4, textDecoration: "none" }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
