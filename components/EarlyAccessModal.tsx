"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const TEAL = "#1D9E75";
const TEXT = "#202124";
const SEC = "#5F6368";
const MUTED = "#9CA3AF";
const BD = "#E8EAED";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

export default function EarlyAccessModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const valid = email.trim().includes("@") && email.trim().includes(".");

  const handleGoogle = () => {
    signIn("google", { callbackUrl: "/onboarding" });
  };

  const handleEmail = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await signIn("email", { email: email.trim(), callbackUrl: "/onboarding", redirect: false });
      setEmailSent(true);
    } catch {}
    setSubmitting(false);
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

        {emailSent ? (
          /* Email sent confirmation */
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
              Check your email for your sign-in link.
            </div>
          </div>
        ) : (
          /* Sign-in form */
          <>
            <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 500, color: TEXT, margin: "0 0 8px" }}>
              Start your 7-day free trial
            </h2>
            <p style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: SEC, margin: "0 0 28px" }}>
              No card required. Full platform access from day one.
            </p>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              style={{
                width: "100%", height: 44, fontSize: 14, fontWeight: 500, fontFamily: F,
                color: "#fff", background: TEAL,
                border: "none", borderRadius: 4,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#fff"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: BD }} />
              <span style={{ fontSize: 12, color: MUTED, fontFamily: F }}>or sign in with email</span>
              <div style={{ flex: 1, height: 1, background: BD }} />
            </div>

            {/* Email input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEmail(); }}
              placeholder="your@email.com"
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

            {/* Send magic link */}
            <button
              onClick={handleEmail}
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
              {submitting ? "Sending..." : "Send magic link"}
            </button>

            <p style={{ fontFamily: F, fontSize: 12, color: MUTED, textAlign: "center", margin: "20px 0 0" }}>
              Already have an account? The Google button will log you in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
