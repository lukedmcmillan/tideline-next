"use client";

const M = "var(--font-mono), 'DM Mono', monospace";
const TEAL = "#1D9E75";
const T4 = "#9AA0A6";

const SEGMENTS = ["All", "Gov & Reg", "NGO", "Media", "ESG"];

export default function SegmentSwitcher({
  active,
  onChange,
}: {
  active: string;
  onChange: (segment: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {SEGMENTS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            fontFamily: M,
            fontSize: 11,
            fontWeight: 500,
            color: active === s ? TEAL : T4,
            background: "none",
            border: "none",
            borderBottom: active === s ? `2px solid ${TEAL}` : "2px solid transparent",
            cursor: "pointer",
            padding: "6px 12px",
            letterSpacing: "0.02em",
            transition: "color 0.1s",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
