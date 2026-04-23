"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG          = "#F7F9FB";
const SURFACE     = "#FFFFFF";
const BORDER      = "#E3E8EF";
const BORDER_STRONG = "#D0D7E2";
const TEXT        = "#0B1628";
const TEXT_MUTED  = "#5B6F8C";
const TEXT_FAINT  = "#8BA0BC";
const TEAL        = "#1D9E75";
const TEAL_SOFT   = "#E6F4EF";
const AMBER       = "#EF9F27";
const AMBER_SOFT  = "#FDF2DF";
const RED         = "#E24B4A";
const RED_SOFT    = "#FCEAEA";
const SANS        = "'DM Sans', -apple-system, sans-serif";
const MONO        = "'DM Mono', ui-monospace, monospace";

// ── Tracker display names ─────────────────────────────────────────────────────
const SLUG_NAMES: Record<string, string> = {
  isa: "ISA",
  bbnj: "BBNJ",
  iuu: "IUU Fishing",
  "30x30": "30x30 MPAs",
  "blue-finance": "Blue Finance",
  plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping",
  "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine",
  "wto-fisheries": "WTO Fisheries",
};

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface VScore {
  tracker_slug: string;
  score: number;
  momentum_direction: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAge(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function fmtSince(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
}

function dotColor(score: number): string {
  if (score >= 7) return TEAL;
  if (score >= 5) return AMBER;
  if (score >= 3) return TEXT_FAINT;
  return RED;
}

function trendChar(dir: string): string {
  if (dir === "accelerating") return "↑";
  if (dir === "decelerating") return "↓";
  return "—";
}

function trendColor(dir: string): string {
  if (dir === "accelerating") return TEAL;
  if (dir === "decelerating") return RED;
  return TEXT_FAINT;
}

function signalPhrase(s: Signal): string {
  const m = s.metadata as Record<string, unknown>;
  switch (s.signal_type) {
    case "band_crossing":
      return `${SLUG_NAMES[s.tracker_slug] ?? s.tracker_slug} crossed into ${String(m.to_band ?? "")}`;
    case "countdown_threshold":
      return s.headline;
    case "high_sig_story":
      return s.headline.split(" ").slice(0, 8).join(" ");
    case "convergence_spike":
      return `${SLUG_NAMES[s.tracker_slug] ?? s.tracker_slug} saw a convergence spike`;
    default:
      return s.headline.split(" ").slice(0, 8).join(" ");
  }
}

function buildSummary(signals: Signal[]): string {
  if (signals.length === 0) return "";
  const phrases = signals.slice(0, 2).map(signalPhrase);
  if (signals.length === 1) return `${phrases[0]}.`;
  if (signals.length === 2) return `${phrases[0]} and ${phrases[1]}.`;
  return `${phrases[0]} and ${phrases[1]}, plus ${signals.length - 2} more.`;
}

function isRising(toBand: unknown): boolean {
  return toBand === "HIGH" || toBand === "ELEVATED";
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ left, right }: { left: string; right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_MUTED }}>
        {left}
      </span>
      {right && (
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: TEXT_FAINT }}>
          {right}
        </span>
      )}
    </div>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────
function SignalCard({ sig, onClick }: { sig: Signal; onClick: () => void }) {
  const m = sig.metadata as Record<string, unknown>;
  const rising = isRising(m.to_band);
  const railColor = sig.signal_type === "high_sig_story" ? AMBER
    : sig.signal_type === "band_crossing" && !rising ? RED
    : TEAL;

  return (
    <div
      onClick={onClick}
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${railColor}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      {/* Row 1: tracker pill + type label + age */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
          color: TEXT_MUTED, border: `1px solid ${BORDER_STRONG}`, borderRadius: 4, padding: "2px 7px",
          flexShrink: 0,
        }}>
          {SLUG_NAMES[sig.tracker_slug] ?? sig.tracker_slug}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_FAINT }}>
          {sig.signal_type.replace(/_/g, " ")}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: TEXT_FAINT, flexShrink: 0 }}>
          {fmtAge(sig.age_hours)}
        </span>
      </div>

      {/* Score delta row — band_crossing only */}
      {sig.signal_type === "band_crossing" && (
        <div style={{
          background: rising ? TEAL_SOFT : RED_SOFT,
          borderRadius: 6,
          padding: "5px 10px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: rising ? TEAL : RED }}>
            {String(m.from_score ?? "")} {"->"} {String(m.to_score ?? "")}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: rising ? TEAL : RED }}>
            {String(m.to_band ?? "")}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: rising ? TEAL : RED, marginLeft: "auto" }}>
            {String(m.momentum ?? "")}
          </span>
        </div>
      )}

      {/* Headline */}
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: TEXT, lineHeight: 1.4, marginBottom: 5 }}>
        {sig.headline}
      </div>

      {/* Body */}
      <div style={{
        fontFamily: SANS, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        marginBottom: 12,
      }}>
        {sig.body}
      </div>

      {/* Footer: action button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
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
  );
}

// ── Hero countdown card ────────────────────────────────────────────────────────
function HeroCard({ sig, onAction }: { sig: Signal; onAction: () => void }) {
  const m = sig.metadata as Record<string, unknown>;
  const daysUntil = typeof m.days_until === "number" ? m.days_until : null;
  const eventName = typeof m.event_name === "string" ? m.event_name : sig.headline;

  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderTop: `3px solid ${AMBER}`,
      borderRadius: 10,
      padding: "18px 20px",
      marginBottom: 10,
    }}>
      {/* Top row: pill + type label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
          color: AMBER, border: `1px solid ${AMBER}`, borderRadius: 4, padding: "2px 7px",
        }}>
          {SLUG_NAMES[sig.tracker_slug] ?? sig.tracker_slug}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER }}>
          Governance Event Approaching
        </span>
      </div>

      {/* Event name headline */}
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: TEXT, lineHeight: 1.2, marginBottom: 12 }}>
        {eventName}
      </div>

      {/* Countdown */}
      {daysUntil !== null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{
            fontFamily: MONO, fontSize: 52, fontWeight: 700, color: AMBER,
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {daysUntil}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT_MUTED }}>
            days away
          </span>
        </div>
      )}

      {/* Body */}
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 16 }}>
        {sig.body}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onAction}
          style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#fff",
            background: TEAL, border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer",
          }}
        >
          Prepare briefing
        </button>
        <button
          onClick={() => {}}
          style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEAL,
            background: "transparent", border: `1px solid ${TEAL}`, borderRadius: 6, padding: "8px 16px", cursor: "pointer",
          }}
        >
          Calendar
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [since, setSince] = useState<string | null>(null);
  const [isQuiet, setIsQuiet] = useState(false);
  const [velocityScores, setVelocityScores] = useState<VScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/signals").then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch("/api/dashboard").then(r => r.ok ? r.json() : { velocityScores: [] }),
    ]).then(([sigData, dashData]) => {
      setSignals(sigData.signals ?? []);
      setSince(sigData.window?.since ?? null);
      setIsQuiet(sigData.is_quiet ?? false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVelocityScores(((dashData as any).velocityScores ?? []) as VScore[]);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });

    fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
  }, []);

  const sinceStr = since ? fmtSince(since) : "7am";
  const heroSignal = signals.find(s => s.signal_type === "countdown_threshold") ?? null;
  const nonCountdown = signals.filter(s => s.signal_type !== "countdown_threshold");
  const visibleSignals = nonCountdown.slice(0, 5);
  const olderSignals = nonCountdown.slice(5);
  const sortedVelocity = [...velocityScores].sort((a, b) => b.score - a.score);

  return (
    <div style={{ background: BG, minHeight: "100%", fontFamily: SANS }}>
      <style>{`
        .dash-inner {
          max-width: 420px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }
        @media (min-width: 768px) {
          .dash-inner {
            max-width: 700px;
            padding: 32px 24px 64px;
          }
        }
      `}</style>

      <div className="dash-inner">

        {/* ── Loading ── */}
        {loading && (
          <div style={{ paddingTop: 60, textAlign: "center", fontFamily: MONO, fontSize: 12, color: TEXT_FAINT }}>
            Loading...
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingTop: 40 }}>
            Could not load signals.
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── 1. Morning greeting ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 8 }}>
                Good morning{" "}
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL }}>
                  · since {sinceStr}
                </span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: TEXT, lineHeight: 1.25, marginBottom: 10 }}>
                {signals.length > 0 ? `${signals.length} things moved overnight` : "Quiet overnight"}
              </div>
              {signals.length > 0 && (
                <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6 }}>
                  {buildSummary(signals)}
                </div>
              )}
            </div>

            {/* ── 2. Priority hero card ── */}
            {heroSignal && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader left="Priority · Event approaching" />
                <HeroCard sig={heroSignal} onAction={() => router.push(heroSignal.action_url)} />
              </div>
            )}

            {/* ── 3. Signals section ── */}
            {visibleSignals.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader
                  left={`Signals · since ${sinceStr}`}
                  right={`${nonCountdown.length}`}
                />
                {visibleSignals.map(sig => (
                  <SignalCard
                    key={sig.id}
                    sig={sig}
                    onClick={() => router.push(sig.action_url)}
                  />
                ))}
              </div>
            )}

            {/* ── 4. Tracker pulse ── */}
            {sortedVelocity.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader
                  left="Your trackers"
                  right={`${sortedVelocity.length} domains`}
                />
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
                  {sortedVelocity.map((v, i) => (
                    <div
                      key={v.tracker_slug}
                      onClick={() => router.push(`/platform/tracker/${v.tracker_slug}`)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "10px 1fr auto auto 16px",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                        borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                        cursor: "pointer",
                      }}
                    >
                      {/* Band dot */}
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor(v.score), display: "inline-block", flexShrink: 0 }} />
                      {/* Tracker name */}
                      <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT, fontWeight: 500 }}>
                        {SLUG_NAMES[v.tracker_slug] ?? v.tracker_slug}
                      </span>
                      {/* Trend */}
                      <span style={{ fontFamily: MONO, fontSize: 12, color: trendColor(v.momentum_direction) }}>
                        {trendChar(v.momentum_direction)}
                      </span>
                      {/* Score */}
                      <span style={{ fontFamily: MONO, fontSize: 12, color: dotColor(v.score), fontWeight: 600 }}>
                        {v.score.toFixed(1)}
                      </span>
                      {/* Chevron */}
                      <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT_FAINT }}>›</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <a
                    href="/platform/trackers"
                    style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEAL, textDecoration: "none" }}
                  >
                    View all {sortedVelocity.length} trackers →
                  </a>
                </div>
              </div>
            )}

            {/* ── 5. Earlier today collapse ── */}
            {olderSignals.length > 0 && (
              <div>
                {/* Divider */}
                <div
                  onClick={() => setExpanded(e => !e)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", marginBottom: expanded ? 14 : 0,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                  <span style={{
                    fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT,
                    flexShrink: 0, userSelect: "none",
                  }}>
                    {expanded ? "▴" : "▾"} Earlier today · {olderSignals.length} signals
                  </span>
                  <div style={{ flex: 1, height: 1, background: BORDER }} />
                </div>

                {expanded && olderSignals.map(sig => (
                  <SignalCard
                    key={sig.id}
                    sig={sig}
                    onClick={() => router.push(sig.action_url)}
                  />
                ))}
              </div>
            )}

            {/* Quiet state: still show trackers, skip signals */}
            {isQuiet && signals.length === 0 && sortedVelocity.length === 0 && (
              <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingTop: 8 }}>
                All quiet.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
