"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/platform/feed";
  const isError = searchParams?.get("error");

  return (
    <div style={{ minHeight: "100vh", background: "#0B1D35", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Mono&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
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

        <button
          onClick={() => signIn("google", { callbackUrl })}
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

        <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginTop: 24, lineHeight: 1.6 }}>
          Professional ocean intelligence · Before 7am
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
