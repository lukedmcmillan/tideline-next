"use client";

import { useState, useEffect } from "react";

const F = "'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const NAVY = "#0B1628";
const TEAL = "#1D9E75";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const T1 = "#202124";
const T2 = "#5F6368";
const T3 = "#9AA0A6";
const BORDER = "#DADCE0";
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  gov: { bg: "#dbeafe", color: "#1e40af" },
  reg: { bg: "#fee2e2", color: "#991b1b" },
  ngo: { bg: "#dcfce7", color: "#166534" },
  res: { bg: "#f3e8ff", color: "#6b21a8" },
  media: { bg: "#fef3c7", color: "#78350f" },
  esg: { bg: "#ccfbf1", color: "#134e4a" },
};

function scoreColor(s: number) {
  if (s >= 8) return RED;
  if (s >= 5) return AMBER;
  return TEAL;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Divergence {
  id: string;
  tracker_tag: string;
  score: number;
  source_a_name: string;
  source_a_type: string;
  source_a_claim: string;
  source_b_name: string;
  source_b_type: string;
  source_b_claim: string;
  why_it_matters: string;
  detected_at: string;
  dismissed_at: string | null;
}

export default function ConflictsPage() {
  const [items, setItems] = useState<Divergence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conflicts")
      .then(r => r.ok ? r.json() : { divergences: [] })
      .then(d => setItems(d.divergences || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function dismiss(id: string) {
    setDismissing(id);
    await fetch(`/api/conflicts/${id}/dismiss`, { method: "PATCH" });
    setItems(prev => prev.filter(d => d.id !== id));
    setDismissing(null);
  }

  return (
    <div style={{ background: BG, minHeight: "100%", fontFamily: F }}>
      {/* Top bar */}
      <div style={{ height: 38, background: WHITE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>Source Conflicts</span>
        <span style={{ width: 1, height: 16, background: BORDER, margin: "0 14px" }} />
        <span style={{ fontSize: 11, color: T3 }}>{items.length} active divergences</span>
      </div>

      {/* Explainer */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: T3, marginBottom: 6 }}>What this page shows</div>
          <p style={{ fontSize: 13, color: T2, lineHeight: 1.6, margin: 0 }}>
            When two credible sources make contradictory claims about the same governance event, Tideline flags the divergence here. Each conflict is scored by potential impact. Dismiss once resolved or no longer relevant.
          </p>
        </div>
      </div>

      {/* Conflicts list */}
      <div style={{ padding: "0 20px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: T3 }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 6 }}>No active conflicts</div>
            <div style={{ fontSize: 13, color: T3 }}>All source divergences have been resolved or dismissed.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map(d => {
              const sc = scoreColor(d.score);
              const scA = SOURCE_COLORS[d.source_a_type] || SOURCE_COLORS.media;
              const scB = SOURCE_COLORS[d.source_b_type] || SOURCE_COLORS.media;

              return (
                <div key={d.id} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `0.5px solid ${BORDER}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: M, fontSize: 18, fontWeight: 700, color: sc }}>{d.score}</span>
                      <span style={{ fontSize: 10, color: T3 }}>/10 severity</span>
                      <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: sc, background: sc + "14", padding: "2px 8px", borderRadius: 3 }}>
                        {d.tracker_tag.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, color: T3 }}>{timeAgo(d.detected_at)}</span>
                      <button
                        onClick={() => dismiss(d.id)}
                        disabled={dismissing === d.id}
                        style={{
                          fontSize: 10, fontWeight: 500, color: T3, background: WHITE,
                          border: `0.5px solid ${BORDER}`, borderRadius: 4,
                          padding: "4px 10px", cursor: "pointer",
                        }}
                      >
                        {dismissing === d.id ? "..." : "Dismiss"}
                      </button>
                    </div>
                  </div>

                  {/* Claims */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                    {/* Source A */}
                    <div style={{ padding: "14px 18px", borderRight: `0.5px solid ${BORDER}` }}>
                      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: scA.color, background: scA.bg, padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 8 }}>
                        {d.source_a_name}
                      </span>
                      <p style={{ fontSize: 12, color: T1, lineHeight: 1.55, margin: 0 }}>{d.source_a_claim}</p>
                    </div>

                    {/* Source B */}
                    <div style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: scB.color, background: scB.bg, padding: "2px 7px", borderRadius: 3, display: "inline-block", marginBottom: 8 }}>
                        {d.source_b_name}
                      </span>
                      <p style={{ fontSize: 12, color: T1, lineHeight: 1.55, margin: 0 }}>{d.source_b_claim}</p>
                    </div>
                  </div>

                  {/* Why it matters */}
                  <div style={{ padding: "10px 18px", borderTop: `0.5px solid ${BORDER}`, background: BG }}>
                    <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", color: T3, marginRight: 6 }}>Why it matters:</span>
                    <span style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>{d.why_it_matters}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
