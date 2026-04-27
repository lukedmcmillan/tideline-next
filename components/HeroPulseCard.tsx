"use client";

// Static marketing component — NOT a live VelocityScore mount.
// Curated content with timed animations matching mockup-v5.html.
// Animation keyframes live in styles/landing.css (lp-score-in, lp-fade-in, lp-draw-line, lp-pulse).

export default function HeroPulseCard() {
  const NAVY   = "#0B1628";
  const TEAL   = "#1D9E75";
  const AMBER  = "#C97A1A";
  const RULE   = "#E5E1D8";
  const MUTED  = "#6B7A8C";
  const DIM    = "#9AA8B8";
  const BODY   = "#3A4A5C";

  const components = [
    { label: "Volume 35%",  val: "8.2"   },
    { label: "Recency 30%", val: "9.0"   },
    { label: "Decision 20%",val: "7.5"   },
    { label: "Risk 15%",    val: "×0.70" },
  ];

  // Sparkline path for trendline (upward trend 50 → 12)
  const linePath = "M 0 50 L 50 46 L 100 42 L 150 40 L 200 35 L 250 30 L 300 24 L 350 18 L 400 12";
  const fillPath = `${linePath} L 400 64 L 0 64 Z`;

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 14,
      padding: 24,
      boxShadow: "0 1px 2px rgba(11,22,40,0.04), 0 12px 32px rgba(11,22,40,0.08)",
      border: `1px solid ${RULE}`,
    }}>

      {/* Head */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        paddingBottom: 18, borderBottom: `1px solid ${RULE}`, marginBottom: 22,
      }}>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>
            Live tracker
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 19, color: NAVY, letterSpacing: "-0.01em" }}>
            ISA Deep-Sea Mining
          </div>
        </div>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED,
          border: `1px solid ${RULE}`, padding: "4px 9px", borderRadius: 99,
          letterSpacing: "0.06em", background: "#FAFAF7", whiteSpace: "nowrap",
        }}>
          Multilateral · 0.70x
        </div>
      </div>

      {/* Score row */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 22, alignItems: "center", marginBottom: 18 }}>
        {/* Animated score number */}
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 68, color: TEAL,
          lineHeight: 0.95, fontWeight: 500, letterSpacing: "-0.04em",
          opacity: 0,
          animation: "lp-score-in 1s cubic-bezier(0.2,0.8,0.3,1) 0.3s forwards",
        }}>
          7.2
        </div>
        <div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10, color: TEAL,
            letterSpacing: "0.14em", marginBottom: 4, textTransform: "uppercase",
            opacity: 0, animation: "lp-fade-in 0.6s ease 0.7s forwards",
          }}>
            Elevated
          </div>
          <div style={{
            fontSize: 14, color: NAVY, marginBottom: 6,
            opacity: 0, animation: "lp-fade-in 0.6s ease 0.85s forwards",
          }}>
            Active conditions · prepare
          </div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11, color: MUTED,
            opacity: 0, animation: "lp-fade-in 0.6s ease 1s forwards",
          }}>
            ↑ <span style={{ color: TEAL }}>+0.4 vs last week</span>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 18, height: 64 }}>
        <svg width="100%" height="64" viewBox="0 0 400 64" preserveAspectRatio="none" style={{ display: "block" }}>
          <defs>
            <linearGradient id="lp-spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.18} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Fill fades in after line draws */}
          <path
            d={fillPath}
            fill="url(#lp-spark-fill)"
            style={{ opacity: 0, animation: "lp-fade-in 1s ease 1.2s forwards" }}
          />
          {/* Line draws in */}
          <path
            d={linePath}
            fill="none"
            stroke={TEAL}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: "lp-draw-line 1.8s ease-out 0.5s forwards",
            }}
          />
          {/* Terminal dot */}
          <circle cx={400} cy={12} r={3.5} fill={TEAL} style={{ opacity: 0, animation: "lp-fade-in 0.4s ease 2.1s forwards" }} />
          <circle cx={400} cy={12} r={7} fill={TEAL} opacity={0.2} style={{ opacity: 0, animation: "lp-fade-in 0.4s ease 2.1s forwards" }} />
        </svg>
      </div>

      {/* Component grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12,
        padding: "14px 0",
        borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`,
        marginBottom: 14,
      }}>
        {components.map((c) => (
          <div key={c.label}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM,
              letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase",
            }}>
              {c.label}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: NAVY, fontWeight: 500 }}>
              {c.val}
            </div>
          </div>
        ))}
      </div>

      {/* Disclosure — fades in last */}
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, lineHeight: 1.5,
        opacity: 0, animation: "lp-fade-in 0.8s ease 2.3s forwards",
      }}>
        <span style={{ color: AMBER, marginRight: 6, fontWeight: 500 }}>Disclosure</span>
        ISA commercial licensing runs structurally lower in this index. Read alongside ISA portal.
      </div>

    </div>
  );
}
