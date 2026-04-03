"use client";

import { useState, useEffect } from "react";

const TEAL = "#0E7C86";
const T1 = "#202124";
const T3 = "#6B7280";
const T4 = "#9CA3AF";
const BD = "#E8EAED";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

interface Props {
  projectId: string | null;
}

export default function IntelligenceThread({ projectId }: Props) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchNarrative = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (res.ok) {
        const d = await res.json();
        setNarrative(d.narrative || null);
        setUpdatedAt(d.updated_at || null);
        setEntryCount(d.entry_count || 0);
      }
    } catch {}
    setLoading(false);
    setLoaded(true);
  };

  // Load existing narrative on mount
  useEffect(() => {
    if (!projectId) return;
    // Just check if there's an existing narrative saved (GET would be ideal,
    // but we reuse POST which also regenerates — on first load we fetch fresh)
    fetchNarrative();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!projectId || (!loaded && !loading)) return null;

  const isRecent =
    updatedAt &&
    Date.now() - new Date(updatedAt).getTime() < 24 * 60 * 60 * 1000;

  const paragraphs = narrative
    ? narrative.split(/\n\n+/).filter((p) => p.trim())
    : [];

  // Empty state: fewer than 3 entries
  if (loaded && !narrative && entryCount < 3) {
    return (
      <div
        style={{
          background: "#F9FAFB",
          border: `1px solid ${BD}`,
          padding: "12px 14px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: M,
              fontSize: 9,
              fontWeight: 500,
              color: T4,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
            }}
          >
            Intelligence Thread
          </span>
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: T4, lineHeight: 1.5 }}>
          Needs at least 3 filed entries to generate a narrative.
          {entryCount > 0 && ` (${entryCount} so far)`}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#F9FAFB",
        border: `1px solid ${BD}`,
        padding: "12px 14px",
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: M,
              fontSize: 9,
              fontWeight: 500,
              color: T4,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
            }}
          >
            Intelligence Thread
          </span>
          {isRecent && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: TEAL,
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <button
          onClick={fetchNarrative}
          disabled={loading}
          style={{
            fontFamily: F,
            fontSize: 11,
            color: loading ? T4 : TEAL,
            background: "none",
            border: "none",
            cursor: loading ? "default" : "pointer",
            padding: 0,
          }}
        >
          {loading ? "Generating..." : "Refresh narrative"}
        </button>
      </div>

      {/* Narrative body */}
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontFamily: F,
            fontSize: 13,
            color: T1,
            lineHeight: 1.6,
            margin: i < paragraphs.length - 1 ? "0 0 8px" : 0,
          }}
        >
          {p}
        </p>
      ))}

      {/* Footer */}
      <div
        style={{
          fontFamily: F,
          fontSize: 11,
          color: T3,
          marginTop: 10,
        }}
      >
        Based on {entryCount} filed intelligence{" "}
        {entryCount === 1 ? "entry" : "entries"}
      </div>
    </div>
  );
}
