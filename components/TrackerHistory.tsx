"use client";

import { HISTORICAL_CASES } from "@/app/lib/tracker-metadata";

const F = "'DM Sans',system-ui,sans-serif";

export default function TrackerHistory({ slug }: { slug: string }) {
  const record = HISTORICAL_CASES[slug];
  if (!record) return null;

  return (
    <div style={{ fontFamily: F, background: "#fff", border: "0.5px solid #DADCE0", borderRadius: 8, padding: "20px 24px", marginTop: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: "#9AA0A6" }}>Historical signal record</div>
        <div style={{ background: "#F8F9FA", border: "0.5px solid #DADCE0", borderRadius: 99, padding: "3px 10px", fontSize: 10, color: "#5F6368" }}>
          {record.hitRate} hit rate above threshold
        </div>
      </div>

      {/* Threshold statement */}
      <div style={{ fontSize: 13, color: "#5F6368", marginBottom: 16, lineHeight: 1.5 }}>
        Alert threshold: {record.threshold}/10 &mdash; the level above which conditions for a significant outcome have historically been present in this domain.
      </div>

      {/* Cases */}
      {record.cases.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < record.cases.length - 1 ? "0.5px solid #F1F3F4" : "none", marginBottom: i < record.cases.length - 1 ? 12 : 0 }}>
          <div style={{ width: 64, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#0B1628" }}>{c.date}</div>
            <div style={{
              fontSize: 10, padding: "2px 6px", borderRadius: 3, marginTop: 4, display: "inline-block",
              background: c.outcomePositive ? "#F0FDF4" : "#FEF2F2",
              color: c.outcomePositive ? "#1D9E75" : "#E24B4A",
              border: c.outcomePositive ? "1px solid rgba(29,158,117,.2)" : "1px solid rgba(226,75,74,.2)",
            }}>
              {c.score}/10
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0B1628", marginBottom: 3 }}>{c.event}</div>
            <div style={{ fontSize: 12, color: "#5F6368", lineHeight: 1.5 }}>{c.outcome}</div>
            {c.verified && <div style={{ fontSize: 10, color: "#9AA0A6", marginTop: 4 }}>Verified &#x2713;</div>}
          </div>
        </div>
      ))}

      {/* Caveat */}
      <div style={{
        marginTop: 16, background: "rgba(239,159,39,.06)", border: "0.5px solid rgba(239,159,39,.2)",
        borderLeft: "3px solid #EF9F27", borderRadius: 4, padding: "10px 14px",
        fontSize: 11, color: "#5F6368", lineHeight: 1.5,
      }}>
        <span style={{ fontWeight: 600, color: "#EF9F27" }}>Note: </span>
        {record.caveat}
      </div>
    </div>
  );
}
