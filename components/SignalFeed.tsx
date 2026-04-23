"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── Design tokens ────────────────────────────────────────────────────────────
const BG2 = "#0D1E35";
const BORDER = "#1A2A44";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const TEAL = "#1D9E75";
const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

// ── Types ────────────────────────────────────────────────────────────────────
interface Signal {
  id: string;
  signal_type: "band_crossing" | "countdown_threshold" | "convergence_spike" | "high_sig_story";
  tracker_slug: string;
  headline: string;
  body: string;
  importance: number;
  age_hours: number;
  display_score: number;
  action_label: string;
  action_url: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface SignalsResponse {
  signals: Signal[];
  window: number;
  counts: Record<string, number>;
  is_quiet: boolean;
  next_scrape: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtAge(ageHours: number): string {
  if (ageHours < 1) {
    const mins = Math.max(1, Math.round(ageHours * 60));
    return `${mins}m ago`;
  }
  if (ageHours < 24) {
    return `${Math.round(ageHours)}h ago`;
  }
  return `${Math.round(ageHours / 24)}d ago`;
}

function fmtSignalType(type: string): string {
  return type.replace(/_/g, " ").toUpperCase();
}

function fmtNextScrape(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SignalFeed() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isQuiet, setIsQuiet] = useState(false);
  const [nextScrape, setNextScrape] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/signals")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<SignalsResponse>;
      })
      .then((data) => {
        setSignals(data.signals ?? []);
        setIsQuiet(data.is_quiet ?? false);
        setNextScrape(data.next_scrape ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 10 }}>
          Signals
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: 16, marginBottom: 10, opacity: 0.5,
          }}>
            <div style={{ height: 10, width: "40%", background: BORDER, borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 13, width: "85%", background: BORDER, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: "70%", background: BORDER, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 10 }}>
          Signals
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, padding: "14px 0" }}>
          Could not load signals. Pull to refresh.
        </div>
      </div>
    );
  }

  // ── Quiet state ──
  if (isQuiet && signals.length === 0) {
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 10 }}>
          Signals
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, padding: "14px 0" }}>
          All quiet. Next scrape at {fmtNextScrape(nextScrape)}.
        </div>
      </div>
    );
  }

  // ── Signal cards ──
  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 10 }}>
        Signals
      </div>

      {signals.map((sig) => (
        <div
          key={sig.id}
          onClick={() => router.push(sig.action_url)}
          style={{
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          {/* Row 1: tracker pill + signal type */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2px 7px",
            }}>
              {sig.tracker_slug}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED }}>
              {fmtSignalType(sig.signal_type)}
            </span>
          </div>

          {/* Row 2: headline */}
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: TEXT, lineHeight: 1.4, marginBottom: 6 }}>
            {sig.headline}
          </div>

          {/* Row 3: body */}
          <div style={{
            fontFamily: SANS, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            marginBottom: 12,
          }}>
            {sig.body}
          </div>

          {/* Footer: age + action button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM }}>
              {fmtAge(sig.age_hours)}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); router.push(sig.action_url); }}
              style={{
                fontFamily: SANS, fontSize: 12, fontWeight: 500, color: TEAL,
                background: "transparent", border: `1px solid ${TEAL}`,
                borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              }}
            >
              {sig.action_label}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
