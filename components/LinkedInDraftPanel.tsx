"use client";

import { useState } from "react";

const WHITE = "#FFFFFF";
const BG = "#F8F9FA";
const RED = "#D93025";
const TEAL = "#1D9E75";
const T1 = "#202124";
const T4 = "#9AA0A6";
const BLT = "#E8EAED";
const BORDER = "#DADCE0";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

interface Props {
  postText: string;
  onChange: (text: string) => void;
  loading: boolean;
  onClose: () => void;
  error?: string | null;
}

export default function LinkedInDraftPanel({ postText, onChange, loading, onClose, error }: Props) {
  const [copied, setCopied] = useState(false);

  const copyPost = () => {
    navigator.clipboard.writeText(postText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const charCount = postText.length;
  const overLimit = charCount > 700;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: WHITE, borderTop: `1px solid ${BORDER}`,
      boxShadow: "0 -8px 30px rgba(0,0,0,.1)",
      padding: "20px 24px 24px",
      maxHeight: "50vh", overflowY: "auto",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T1 }}>LinkedIn post draft</span>
          <button onClick={onClose} style={{ fontFamily: F, fontSize: 12, color: T4, background: "none", border: "none", cursor: "pointer" }}>Close</button>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: T4, padding: "20px 0" }}>Generating draft...</div>
        ) : error ? (
          <div style={{ fontSize: 13, color: RED, padding: "20px 0" }}>{error}</div>
        ) : (
          <>
            <textarea
              value={postText}
              onChange={e => onChange(e.target.value)}
              rows={8}
              style={{
                width: "100%", resize: "vertical", border: `1px solid ${BLT}`,
                borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.65,
                color: T1, fontFamily: F, background: BG, outline: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{
                fontFamily: F, fontSize: 11,
                color: overLimit ? RED : T4,
              }}>
                {charCount} / 700 chars {overLimit ? "(over optimal length)" : ""}
              </span>
              <button onClick={copyPost} style={{
                fontSize: 12, fontWeight: 500, fontFamily: F,
                color: "#fff", background: TEAL,
                border: "none", borderRadius: 8, padding: "7px 16px",
                cursor: "pointer",
              }}>
                {copied ? "Copied!" : "Copy post"}
              </button>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: T4, marginTop: 10 }}>
              Edit before posting. Always verify facts.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
