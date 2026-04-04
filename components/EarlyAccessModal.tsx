"use client";

import { useState } from "react";

const TEAL = "#0E7C86";
const TEXT = "#202124";
const SEC = "#5F6368";
const MUTED = "#9CA3AF";
const BD = "#E8EAED";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

export default function EarlyAccessModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const valid = email.trim().includes("@");

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {}
    setDone(true);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", maxWidth: 440, width: "100%",
          borderRadius: 4, padding: 32, position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: F, fontSize: 18, color: MUTED, padding: 0, lineHeight: 1,
          }}
        >
          {"\u2715"}
        </button>

        {done ? (
          /* Success state */
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: TEAL,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 8 }}>
              You're on the list.
            </div>
            <div style={{ fontFamily: F, fontSize: 14, color: SEC }}>
              I'll be in touch.
            </div>
          </div>
        ) : (
          /* Form */
          <>
            <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 500, color: TEXT, margin: "0 0 8px" }}>
              Join Tideline as a founding member.
            </h2>
            <p style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: SEC, margin: "0 0 28px" }}>
              Founding members get the price, the access, and the ear of the person building it.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Your work email"
              autoFocus
              style={{
                width: "100%", height: 40, border: "none",
                borderBottom: `2px solid ${BD}`, borderRadius: 0,
                fontSize: 16, fontFamily: F, color: TEXT,
                padding: "0 0 4px 0", background: "transparent", outline: "none",
                marginBottom: 24,
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderBottomColor = TEAL; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderBottomColor = BD; }}
            />
            <button
              onClick={submit}
              disabled={!valid || submitting}
              style={{
                width: "100%", height: 40, fontSize: 14, fontWeight: 500, fontFamily: F,
                color: valid && !submitting ? "#fff" : "#BDC1C6",
                background: valid && !submitting ? TEAL : "#F1F3F4",
                border: "none", borderRadius: 4,
                cursor: valid && !submitting ? "pointer" : "not-allowed",
                boxShadow: valid && !submitting ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {submitting ? "Joining..." : "Join early access"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
