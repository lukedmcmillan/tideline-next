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

const T3 = "#5F6368";
const TEAL_H = "#0E7C86";

const ANGLES = [
  { key: "implications", label: "What this means for your sector" },
  { key: "urgency", label: "Why this matters now" },
  { key: "contrarian", label: "The question nobody\u2019s asking" },
] as const;

interface Props {
  postText: string;
  onChange: (text: string) => void;
  loading: boolean;
  onClose: () => void;
  error?: string | null;
  storyId?: string;
}

export default function LinkedInDraftPanel({ postText, onChange, loading, onClose, error, storyId }: Props) {
  const [copied, setCopied] = useState(false);
  const [rewriting, setRewriting] = useState(false);

  const handleAngle = async (angle: string) => {
    if (!storyId || rewriting) return;
    setRewriting(true);
    try {
      const r = await fetch("/api/story/linkedin-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, angle }),
      });
      const d = await r.json();
      if (d.post_text) onChange(d.post_text);
    } catch {}
    setRewriting(false);
  };

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
            <div style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T1, marginBottom: 16 }}>
              Edit freely. Your name, your voice, your take.
            </div>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: T3, marginBottom: 16 }}>
              Here&apos;s a starting point. Make it yours.
            </div>
            <textarea
              value={rewriting ? "Rewriting..." : postText}
              onChange={e => { if (!rewriting) onChange(e.target.value); }}
              disabled={rewriting}
              rows={8}
              style={{
                width: "100%", resize: "vertical", border: `1px solid ${BLT}`,
                borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.65,
                color: rewriting ? T4 : T1, fontFamily: F, background: BG, outline: "none",
                opacity: rewriting ? 0.6 : 1,
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
                {copied ? "Copied. Edit before you post." : "Copy to clipboard"}
              </button>
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: T4, marginTop: 10 }}>
              Edit before posting. Always verify facts.
            </div>

            {storyId && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${BLT}`, paddingTop: 14 }}>
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: T3, marginBottom: 8 }}>
                  Try a different starting point:
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ANGLES.map(a => (
                    <button
                      key={a.key}
                      onClick={() => handleAngle(a.key)}
                      disabled={rewriting}
                      style={{
                        fontFamily: F, fontSize: 13,
                        border: `1px solid ${BLT}`, borderRadius: 4,
                        padding: "6px 14px", background: "none",
                        color: rewriting ? T4 : T3,
                        cursor: rewriting ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={e => { if (!rewriting) { (e.currentTarget as HTMLElement).style.borderColor = TEAL_H; (e.currentTarget as HTMLElement).style.color = TEAL_H; } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BLT; (e.currentTarget as HTMLElement).style.color = rewriting ? T4 : T3; }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
