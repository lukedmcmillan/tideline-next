"use client";

import { useState } from "react";

const WHITE = "#FFFFFF";
const T1 = "#202124";
const T3 = "#5F6368";
const T4 = "#80868B";
const BLT = "#E8EAED";
const TEAL_H = "#0E7C86";
const RED_OVER = "#C0392B";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

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
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: WHITE, width: 560,
          maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 96px)",
          borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          height: 56, padding: "0 24px",
          borderBottom: `1px solid ${BLT}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T1 }}>
            Edit freely. Your name, your voice, your take.
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 24, color: T3, background: "none",
              border: "none", cursor: "pointer", padding: 0, lineHeight: 1,
            }}
          >{"\u2715"}</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{
              minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: F, fontSize: 14, color: T4, fontStyle: "italic" }}>
                Writing your draft...
              </span>
            </div>
          ) : error ? (
            <div style={{
              minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: F, fontSize: 14, color: RED_OVER }}>
                Could not generate draft. Try again.
              </span>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: T3, marginBottom: 16 }}>
                Here&apos;s a starting point. Make it yours.
              </div>

              <textarea
                value={rewriting ? "Rewriting..." : postText}
                onChange={e => { if (!rewriting) onChange(e.target.value); }}
                disabled={rewriting}
                style={{
                  width: "100%", minHeight: 160, border: "none",
                  borderBottom: `2px solid ${BLT}`, borderRadius: 0,
                  padding: "8px 0", fontSize: 15, lineHeight: 1.65,
                  color: rewriting ? T4 : T1, fontFamily: F,
                  background: "transparent", outline: "none",
                  resize: "vertical", opacity: rewriting ? 0.5 : 1,
                }}
                onFocus={e => { (e.target as HTMLElement).style.borderBottomColor = TEAL_H; }}
                onBlur={e => { (e.target as HTMLElement).style.borderBottomColor = BLT; }}
              />

              <div style={{
                fontFamily: M, fontSize: 11, color: overLimit ? RED_OVER : T4,
                textAlign: "right", marginTop: 6,
              }}>
                {charCount} / 700
              </div>

              {/* Angle buttons */}
              {storyId && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: T3, marginBottom: 10 }}>
                    Try a different starting point:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ANGLES.map(a => (
                      <button
                        key={a.key}
                        onClick={() => handleAngle(a.key)}
                        disabled={rewriting}
                        style={{
                          fontFamily: F, fontSize: 13, fontWeight: 400,
                          border: `1px solid ${BLT}`, borderRadius: 4,
                          padding: "6px 14px", background: WHITE,
                          color: T3, cursor: rewriting ? "default" : "pointer",
                          opacity: rewriting ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!rewriting) { (e.currentTarget as HTMLElement).style.borderColor = TEAL_H; (e.currentTarget as HTMLElement).style.color = TEAL_H; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BLT; (e.currentTarget as HTMLElement).style.color = T3; }}
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

        {/* Footer */}
        {!loading && !error && (
          <div style={{
            padding: "16px 24px", borderTop: `1px solid ${BLT}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}>
            <button
              onClick={copyPost}
              disabled={!postText}
              style={{
                height: 36, padding: "0 20px", borderRadius: 4,
                fontFamily: F, fontSize: 14, fontWeight: 500,
                color: "#fff", background: TEAL_H,
                border: "none", cursor: postText ? "pointer" : "default",
                opacity: postText ? 1 : 0.5,
              }}
            >
              {copied ? "Copied. Edit before you post." : "Copy to clipboard"}
            </button>
            <button
              onClick={onClose}
              style={{
                fontFamily: F, fontSize: 14, fontWeight: 400,
                color: T3, background: "none", border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
