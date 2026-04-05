"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesktopOnly from "@/components/DesktopOnly";

// ── Design tokens ────────────────────────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M      = "var(--font-mono), 'DM Mono', monospace";

const ADMIN_EMAIL = "lukedmcmillan@hotmail.com";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE:     { bg: "#E6F7F1", text: TEAL },
  OPEN:       { bg: "#F1F3F4", text: T3 },
  WATCH:      { bg: "#FFF3E0", text: "#E65100" },
  DORMANT:    { bg: "#E8EAED", text: T3 },
  STRUCTURAL: { bg: "#E8EDF3", text: NAVY },
};

const HORIZON_COLORS: Record<string, { bg: string; text: string }> = {
  SHORT:      { bg: "#FDECEA", text: "#D93025" },
  MEDIUM:     { bg: "#FFF3E0", text: "#E65100" },
  LONG:       { bg: "#E6F7F1", text: "#1B7D5A" },
  STRUCTURAL: { bg: "#E8EDF3", text: NAVY },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  STRONG:   TEAL,
  MODERATE: "#E65100",
  WEAK:     T4,
};

const CATEGORIES = ["GOVERNANCE", "ESG", "FISHERIES", "CLIMATE", "CETACEANS", "REGULATORY"];

// ── Types ────────────────────────────────────────────────────────────────
interface Evidence {
  id: string;
  evidence_note: string;
  confidence: string;
  added_at: string;
  reviewed: boolean;
}

interface Thread {
  id: number;
  thread_number: number;
  title: string;
  category: string;
  status: string;
  horizon: string;
  hypothesis: string;
  evidence_count: number;
  evidence: Evidence[];
}

// ── Badge component ──────────────────────────────────────────────────────
function Badge({ label, colors }: { label: string; colors: { bg: string; text: string } }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: M,
      letterSpacing: "0.04em",
      background: colors.bg,
      color: colors.text,
    }}>
      {label}
    </span>
  );
}

// ── Thread card component ────────────────────────────────────────────────
function ThreadCard({ thread }: { thread: Thread }) {
  const [open, setOpen] = useState(false);
  const flagged = thread.evidence.filter(e => !e.reviewed).length;

  return (
    <div style={{
      background: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: 8,
      padding: "16px 20px",
      marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: M, fontSize: 12, color: T4, fontWeight: 600 }}>
          #{thread.thread_number}
        </span>
        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T1, flex: 1 }}>
          {thread.title}
        </span>
        <Badge label={thread.status} colors={STATUS_COLORS[thread.status] || STATUS_COLORS.OPEN} />
        <Badge label={thread.horizon} colors={HORIZON_COLORS[thread.horizon] || HORIZON_COLORS.MEDIUM} />
      </div>

      {/* Hypothesis */}
      <p style={{ fontFamily: F, fontSize: 13, color: T2, lineHeight: 1.55, margin: "0 0 10px" }}>
        {thread.hypothesis}
      </p>

      {/* Evidence count + expand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: M, fontSize: 12, color: T4 }}>
          {thread.evidence_count} evidence {thread.evidence_count === 1 ? "entry" : "entries"}
        </span>
        {flagged > 0 && (
          <span style={{
            fontFamily: M, fontSize: 11, fontWeight: 600,
            color: "#7A5D00", background: "#FFF8E1", padding: "2px 8px", borderRadius: 4,
          }}>
            {flagged} flagged
          </span>
        )}
        {thread.evidence_count > 0 && (
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: M, fontSize: 12, color: TEAL, padding: 0,
            }}
          >
            {open ? "Hide evidence" : "Show evidence"}
          </button>
        )}
      </div>

      {/* Collapsible evidence list */}
      {open && thread.evidence.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
          {thread.evidence.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "10px 12px",
                marginBottom: 6,
                borderRadius: 6,
                background: e.reviewed ? BG : "#FFF8E1",
                border: e.reviewed ? `1px solid ${BORDER}` : `1px solid ${AMBER}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: M, fontSize: 11, fontWeight: 600,
                  color: CONFIDENCE_COLORS[e.confidence] || T4,
                }}>
                  {e.confidence}
                </span>
                <span style={{ fontFamily: M, fontSize: 11, color: T4 }}>
                  {new Date(e.added_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {!e.reviewed && (
                  <span style={{
                    fontFamily: M, fontSize: 10, fontWeight: 600,
                    color: "#7A5D00", background: "#FFE082", padding: "1px 6px", borderRadius: 3,
                  }}>
                    NEEDS REVIEW
                  </span>
                )}
              </div>
              <p style={{ fontFamily: F, fontSize: 13, color: T2, margin: 0, lineHeight: 1.5 }}>
                {e.evidence_note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
export default function ThreadsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth gate: when middleware auth is re-enabled, this will enforce admin-only access.
    // While auth is bypassed, the page loads for anyone who knows the URL.
    fetch("/api/threads/me")
      .then(r => r.json())
      .then(data => {
        // If auth is active and user is not admin, redirect
        if (data?.email && data.email !== ADMIN_EMAIL) {
          router.replace("/platform/feed");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        // If the check fails, still allow access (auth may be bypassed)
        setAuthorized(true);
      });

    fetch("/api/threads")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setThreads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (!authorized || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: BG }}>
        <span style={{ fontFamily: M, fontSize: 13, color: T4 }}>Loading...</span>
      </div>
    );
  }

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    threads: threads.filter(t => t.category === cat),
  }));

  const totalEvidence = threads.reduce((sum, t) => sum + t.evidence_count, 0);
  const totalFlagged = threads.reduce((sum, t) => sum + t.evidence.filter(e => !e.reviewed).length, 0);

  return (
    <DesktopOnly featureName="Crosscurrent">
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F }}>
      {/* Header */}
      <div style={{ background: NAVY, padding: "32px 40px 28px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, color: WHITE, margin: 0 }}>
          Thread Intelligence
        </h1>
        <p style={{ fontFamily: M, fontSize: 12, color: T4, margin: "6px 0 0", letterSpacing: "0.06em" }}>
          Internal — not subscriber facing
        </p>
        <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
          <span style={{ fontFamily: M, fontSize: 12, color: T4 }}>
            {threads.length} threads
          </span>
          <span style={{ fontFamily: M, fontSize: 12, color: T4 }}>
            {totalEvidence} evidence entries
          </span>
          {totalFlagged > 0 && (
            <span style={{ fontFamily: M, fontSize: 12, color: AMBER }}>
              {totalFlagged} flagged for review
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {grouped.map(g => (
          <div key={g.category} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: M, fontSize: 13, fontWeight: 600, color: TEAL,
              letterSpacing: "0.08em", margin: "0 0 16px",
              paddingBottom: 8, borderBottom: `2px solid ${TEAL}`,
            }}>
              {g.category}
              <span style={{ fontWeight: 400, color: T4, marginLeft: 8 }}>
                {g.threads.length} {g.threads.length === 1 ? "thread" : "threads"}
              </span>
            </h2>
            {g.threads.length === 0 ? (
              <p style={{ fontFamily: F, fontSize: 13, color: T4, fontStyle: "italic" }}>
                No threads in this category.
              </p>
            ) : (
              g.threads.map(t => <ThreadCard key={t.id} thread={t} />)
            )}
          </div>
        ))}
      </div>
    </div>
    </DesktopOnly>
  );
}
