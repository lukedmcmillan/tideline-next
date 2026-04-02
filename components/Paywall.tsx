"use client";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

export default function Paywall() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{
          fontFamily: F,
          fontSize: 24,
          fontWeight: 500,
          color: "#ffffff",
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}>
          Your access has ended.
        </h1>
        <p style={{
          fontFamily: F,
          fontSize: 16,
          fontWeight: 300,
          color: "rgba(255, 255, 255, 0.7)",
          margin: "0 0 32px",
          lineHeight: 1.5,
        }}>
          Tideline is &pound;79/month. No free tier.
        </p>
        <a
          href="/pricing"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "#0E7C86",
            color: "#ffffff",
            fontFamily: F,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            borderRadius: 6,
            letterSpacing: "-0.01em",
          }}
        >
          Continue access
        </a>
      </div>
    </div>
  );
}
