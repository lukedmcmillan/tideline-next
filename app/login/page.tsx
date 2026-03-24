"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const NAVY  = "#0a1628";
const BLUE  = "#1d6fa4";
const WHITE = "#ffffff";
const OFF_WHITE = "#f5f4ef";
const BORDER = "rgba(0,0,0,0.08)";
const TEXT_SEC = "#6b7280";
const TEXT_TER = "#9ca3af";
const SANS  = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, serif";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const isVerify = searchParams?.get("verify") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn("email", { email, redirect: false, callbackUrl: "/platform/feed" });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    input:focus { outline: none; border-color: ${BLUE} !important; box-shadow: 0 0 0 3px rgba(29,111,164,0.12); }
  `;

  if (submitted || isVerify) return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: SANS }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 480, width: "100%", background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid #22c55e`, padding: "48px 40px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 12, letterSpacing: "-0.02em" }}>Check your email</h1>
        <p style={{ fontSize: 15, color: TEXT_SEC, lineHeight: 1.7, marginBottom: 8 }}>
          We sent a sign-in link to <strong style={{ color: NAVY }}>{email || "your email"}</strong>.
        </p>
        <p style={{ fontSize: 14, color: TEXT_TER, lineHeight: 1.6 }}>
          Click the link in the email to sign in. The link expires in 24 hours.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", flexDirection: "column", fontFamily: SANS }}>
      <style>{CSS}</style>

      {/* Nav */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center" }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: 440, width: "100%" }}>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid ${BLUE}`, padding: "40px 36px" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 8, letterSpacing: "-0.02em" }}>Sign in to Tideline</h1>
            <p style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, marginBottom: 28 }}>
              Enter your professional email and we'll send you a sign-in link.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Professional email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@organisation.com"
                  required
                  style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${error ? "#ef4444" : BORDER}`, fontSize: 15, fontFamily: SANS, borderRadius: 3, background: WHITE, color: NAVY }}
                />
                {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 7, fontFamily: SANS }}>{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "13px", background: loading ? TEXT_TER : BLUE, border: "none", color: WHITE, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", borderRadius: 3, fontFamily: SANS, marginBottom: 16 }}
              >
                {loading ? "Sending link..." : "Send sign-in link"}
              </button>

              <p style={{ fontSize: 12, color: TEXT_TER, textAlign: "center", lineHeight: 1.6, fontFamily: SANS }}>
                No account yet?{" "}
                <a href="/start" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Start your free trial</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f5f4ef" }} />}>
      <LoginForm />
    </Suspense>
  );
}
