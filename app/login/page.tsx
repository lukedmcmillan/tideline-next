"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const NAVY    = "#0a1628";
const BLUE    = "#1d6fa4";
const WHITE   = "#ffffff";
const BORDER  = "rgba(0,0,0,0.08)";
const TEXT_SEC = "#6b7280";
const SANS    = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF   = "Georgia, serif";

const FREE_DOMAINS = ["gmail", "hotmail", "yahoo", "outlook", "icloud", "aol", "protonmail", "live", "msn"];

function isProfessional(email: string): boolean {
  const domain = email.split("@")[1]?.split(".")[0]?.toLowerCase();
  return !FREE_DOMAINS.includes(domain || "");
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify");
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    input:focus { outline: none; border-color: ${BLUE} !important; box-shadow: 0 0 0 3px rgba(29,111,164,0.12); }
  `;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!isProfessional(email)) {
      setEmailError("Please use a professional email address. Tideline is a professional tool.");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      await signIn("email", { email, redirect: false, callbackUrl: "/platform/feed" });
      setSent(true);
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verify || sent) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", background: "#f5f4ef", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: SANS }}>
          <div style={{ maxWidth: 480, width: "100%", background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid #22c55e`, padding: "44px 40px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>
              ✓
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 12, letterSpacing: "-0.02em" }}>Check your inbox</h1>
            <p style={{ fontSize: 15, color: TEXT_SEC, lineHeight: 1.7, marginBottom: 8 }}>
              We sent a sign-in link to <strong style={{ color: NAVY }}>{email || "your email"}</strong>.
            </p>
            <p style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.7 }}>
              Click the link in the email to access your Tideline dashboard. The link expires in 24 hours.
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 24, lineHeight: 1.6 }}>
              No email? Check your spam folder or{" "}
              <button onClick={() => { setSent(false); }} style={{ background: "none", border: "none", color: BLUE, fontSize: 12, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", padding: 0 }}>
                try again
              </button>.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#f5f4ef", display: "flex", flexDirection: "column", fontFamily: SANS }}>

        {/* Nav */}
        <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center" }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{ maxWidth: 440, width: "100%" }}>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#991b1b", fontFamily: SANS }}>
                Sign-in failed. The link may have expired. Please try again.
              </div>
            )}

            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid ${BLUE}`, padding: "40px 36px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Ocean Intelligence</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                Sign in to Tideline
              </h1>
              <p style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, marginBottom: 28 }}>
                Enter your professional email and we'll send you a sign-in link. No password needed.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Professional email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@organisation.com"
                    required
                    style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${emailError ? "#ef4444" : BORDER}`, fontSize: 15, fontFamily: SANS, background: WHITE, color: NAVY }}
                  />
                  {emailError
                    ? <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6, fontFamily: SANS }}>{emailError}</p>
                    : <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, fontFamily: SANS }}>We don't accept Gmail, Hotmail or Yahoo addresses.</p>
                  }
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", padding: "13px", background: loading ? "#9ca3af" : BLUE, border: "none", color: WHITE, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: SANS }}
                >
                  {loading ? "Sending..." : "Send sign-in link"}
                </button>
              </form>

              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 24, paddingTop: 20 }}>
                <p style={{ fontSize: 13, color: TEXT_SEC, textAlign: "center", fontFamily: SANS }}>
                  Don't have an account?{" "}
                  <a href="/start" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Start your free trial</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
