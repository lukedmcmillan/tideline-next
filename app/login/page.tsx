"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/platform/feed";
  const isError = searchParams?.get("error");
  const isVerify = searchParams?.get("verify") === "1";
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();
      await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, callbackUrl, csrfToken }),
      });
      setEmailSent(true);
    } catch {
      setEmailError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (emailSent || isVerify) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1D35", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Mono&family=DM+Sans:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <div style={{ maxWidth: 400, width: "100%", background: "#ffffff", borderRadius: 8, padding: "48px 40px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0a1628", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Check your email</h2>
          <p style={{ fontSize: 14, color: "#64748b", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            We sent a sign-in link to <strong style={{ color: "#0a1628" }}>{email}</strong>. Click the link to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B1D35", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Mono&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
      `}</style>
      <div style={{ maxWidth: 400, width: "100%", background: "#ffffff", borderRadius: 8, padding: "48px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 400, color: "#0a1628", fontFamily: "'Instrument Serif', Georgia, serif", marginBottom: 4, letterSpacing: "-0.02em" }}>
          Tideline
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em", marginBottom: 36 }}>
          Ocean Intelligence
        </p>

        {isError && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>
              Sign in failed. Please try again.
            </p>
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={() => window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          style={{
            width: "100%",
            padding: "14px",
            background: "#1D9E75",
            border: "none",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: 4,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Email magic link */}
        <form onSubmit={handleEmailSignIn} style={{ textAlign: "left" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `1.5px solid ${emailError ? "#ef4444" : "#e2e8f0"}`,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: 4,
              background: "#ffffff",
              color: "#0a1628",
              marginBottom: emailError ? 0 : 10,
            }}
          />
          {emailError && (
            <p style={{ fontSize: 12, color: "#ef4444", fontFamily: "'DM Sans', sans-serif", margin: "6px 0 10px" }}>{emailError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "transparent",
              border: "1.5px solid #e2e8f0",
              color: "#0a1628",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              borderRadius: 4,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginTop: 24, lineHeight: 1.6 }}>
          See what the ocean is doing today.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0B1D35" }} />}>
      <LoginContent />
    </Suspense>
  );
}
