"use client";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

export default function ConversionModal({ onDismiss }: { onDismiss: () => void }) {
  const handleDismiss = () => {
    fetch("/api/user/dismiss-modal", { method: "POST" }).catch(() => {});
    onDismiss();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      background: "#0A1628",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <h1 style={{
          fontFamily: M,
          fontSize: 24,
          fontWeight: 400,
          color: "#ffffff",
          margin: "0 0 16px",
          letterSpacing: "-0.01em",
        }}>
          You have 9 days left.
        </h1>
        <p style={{
          fontFamily: F,
          fontSize: 16,
          fontWeight: 300,
          color: "rgba(255, 255, 255, 0.7)",
          margin: "0 0 36px",
          lineHeight: 1.6,
        }}>
          After your trial, Tideline is &pound;79/month. One subscription. Everything included.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <a
            href="/pricing"
            style={{
              display: "inline-block",
              padding: "12px 32px",
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
            Continue &mdash; &pound;79/month
          </a>
          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: F,
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.35)",
              padding: "8px 16px",
            }}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
