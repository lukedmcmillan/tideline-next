"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardReveal from "@/components/DashboardReveal";
import HeroSignal from "@/components/HeroSignal";
import Sparkline from "@/components/Sparkline";
import type { ProofOfWorkData } from "@/app/lib/types/dashboard";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG           = "#F7F9FB";
const SURFACE      = "#FFFFFF";
const BORDER       = "#E3E8EF";
const BORDER_STRONG = "#D0D7E2";
const TEXT         = "#0B1628";
const TEXT_MUTED   = "#5B6F8C";
const TEXT_FAINT   = "#8BA0BC";
const TEAL         = "#1D9E75";
const TEAL_SOFT    = "#E6F4EF";
const AMBER        = "#EF9F27";
const AMBER_SOFT   = "#FDF2DF";
const RED          = "#E24B4A";
const RED_SOFT     = "#FCEAEA";
const SANS         = "'DM Sans', -apple-system, sans-serif";
const MONO         = "'DM Mono', ui-monospace, monospace";

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
  history?: number[];
}

interface VScore {
  tracker_slug: string;
  score: number;
  momentum_direction: string;
  history?: number[];
}

// ── Desktop helpers ───────────────────────────────────────────────────────────
function fmtDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();
}

function scoreColor(s: number): string {
  if (s >= 7) return TEAL;
  if (s >= 4) return AMBER;
  if (s > 0) return RED;
  return TEXT_FAINT;
}

function bandLabel(s: number): { label: string; color: string } {
  if (s >= 7) return { label: "ELEVATED", color: TEAL };
  if (s >= 4) return { label: "WATCH", color: AMBER };
  return { label: "LOW", color: RED };
}

function arrowChar(delta: number): { char: string; color: string } {
  if (delta > 0) return { char: "\u25B2", color: TEAL };
  if (delta < 0) return { char: "\u25BC", color: RED };
  return { char: "\u2192", color: TEXT_FAINT };
}

// ── Mobile helpers ────────────────────────────────────────────────────────────
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
  if (dir === "accelerating") return "\u2191";
  if (dir === "decelerating") return "\u2193";
  return "=";
}

function trendColor(dir: string): string {
  if (dir === "accelerating") return TEAL;
  if (dir === "decelerating") return RED;
  return TEXT_FAINT;
}

function isRising(metadata: Record<string, unknown>): boolean {
  return Number(metadata.to_score ?? 0) > Number(metadata.from_score ?? 0);
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

// ── Mobile sub-components ─────────────────────────────────────────────────────

function MiniBar({ scores, rising }: { scores: number[]; rising: boolean }) {
  const TARGET = 8;
  const padCount = Math.max(0, TARGET - scores.length);
  const padded = [...Array(padCount).fill(0), ...scores].slice(-TARGET);
  const accent = rising ? TEAL : RED;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22, marginTop: 10, marginLeft: 4 }}>
      {padded.map((score, i) => {
        const isLast = i === TARGET - 1;
        const pct = score <= 0 ? 15 : Math.max(15, Math.round((score / 10) * 100));
        return (
          <div key={i} style={{ flex: 1, height: `${pct}%`, background: isLast ? accent : BORDER, borderRadius: 2 }} />
        );
      })}
    </div>
  );
}

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

function SignalCard({ sig, onClick }: { sig: Signal; onClick: () => void }) {
  const m = sig.metadata as Record<string, unknown>;
  const rising = isRising(m);
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
          color: TEXT_MUTED, border: `1px solid ${BORDER_STRONG}`, borderRadius: 4, padding: "2px 7px", flexShrink: 0,
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

      {sig.signal_type === "band_crossing" && (
        <div style={{
          background: rising ? TEAL_SOFT : RED_SOFT,
          borderRadius: 6, padding: "5px 10px", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 10,
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

      {sig.signal_type === "band_crossing" && sig.history && sig.history.length > 0 && (
        <MiniBar scores={sig.history} rising={rising} />
      )}

      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: TEXT, lineHeight: 1.4, marginBottom: 5 }}>
        {sig.headline}
      </div>
      <div style={{
        fontFamily: SANS, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        marginBottom: 12,
      }}>
        {sig.body}
      </div>
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
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: TEXT, lineHeight: 1.2, marginBottom: 12 }}>
        {eventName}
      </div>
      {daysUntil !== null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 52, fontWeight: 700, color: AMBER, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {daysUntil}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT_MUTED }}>days away</span>
        </div>
      )}
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 16 }}>
        {sig.body}
      </div>
      <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />
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
  const [signals, setSignals]             = useState<Signal[]>([]);
  const [since, setSince]                 = useState<string | null>(null);
  const [isQuiet, setIsQuiet]             = useState(false);
  const [velocityScores, setVelocityScores] = useState<VScore[]>([]);
  const [proofOfWork, setProofOfWork]     = useState<ProofOfWorkData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [expanded, setExpanded]           = useState(false);

  useEffect(() => {
    const slugs = Object.keys(SLUG_NAMES);
    Promise.all([
      fetch("/api/dashboard/signals").then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch("/api/dashboard").then(r => r.ok ? r.json() : { velocityScores: [] }),
      fetch("/api/dashboard/proof-of-work").then(r => r.ok ? r.json() : null).catch(() => null),
      ...slugs.map(slug =>
        fetch(`/api/velocity/${slug}`).then(r => r.ok ? r.json() : null).catch(() => null)
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([sigData, dashData, pow, ...velocityResponses]: any[]) => {
      setSignals(sigData.signals ?? []);
      setSince(sigData.window?.since ?? null);
      setIsQuiet(sigData.is_quiet ?? false);
      const scores = (dashData.velocityScores ?? []) as VScore[];
      const enriched = scores.map((s: VScore) => {
        const idx = slugs.indexOf(s.tracker_slug);
        const resp = idx >= 0 ? velocityResponses[idx] : null;
        const history = resp?.history?.map((h: { score: number }) => h.score) || [];
        return { ...s, history };
      });
      setVelocityScores(enriched);
      setProofOfWork(pow);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });

    fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
  }, []);

  // Derived — desktop
  const sorted     = [...velocityScores].sort((a, b) => b.score - a.score);
  const watchCount = velocityScores.filter(v => v.score >= 4).length;

  // Derived — mobile
  const sinceStr       = since ? fmtSince(since) : "7am";
  const heroSignal     = signals.find(s => s.signal_type === "countdown_threshold") ?? null;
  const nonCountdown   = signals.filter(s => s.signal_type !== "countdown_threshold");
  const visibleSignals = nonCountdown.slice(0, 5);
  const olderSignals   = nonCountdown.slice(5);
  const sortedVelocity = [...velocityScores].sort((a, b) => b.score - a.score);

  return (
    <div style={{ background: BG, minHeight: "100%", fontFamily: SANS }}>
      <style>{`
        .dash-mobile  { display: block; }
        .dash-desktop { display: none;  }
        @media (min-width: 769px) {
          .dash-mobile  { display: none;  }
          .dash-desktop { display: block; }
        }
      `}</style>

      {/* ════════════════════════════════════════
          MOBILE — single-column light layout
          Preserved exactly from commit 350185f
          ════════════════════════════════════════ */}
      <div className="dash-mobile">
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 16px 48px" }}>

          {loading && (
            <div style={{ paddingTop: 60, textAlign: "center", fontFamily: MONO, fontSize: 12, color: TEXT_FAINT }}>
              Loading...
            </div>
          )}

          {!loading && error && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingTop: 40 }}>
              Could not load signals.
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 1. Morning greeting */}
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

              {/* 2. Priority hero card */}
              {heroSignal && (
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader left="Priority · Event approaching" />
                  <HeroCard sig={heroSignal} onAction={() => router.push(heroSignal.action_url)} />
                </div>
              )}

              {/* 3. Signals */}
              {visibleSignals.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    left={`Signals · since ${sinceStr}`}
                    right={`${nonCountdown.length}`}
                  />
                  {visibleSignals.map(sig => (
                    <SignalCard key={sig.id} sig={sig} onClick={() => router.push(sig.action_url)} />
                  ))}
                </div>
              )}

              {/* 4. Tracker pulse */}
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
                          display: "grid", gridTemplateColumns: "10px 1fr auto auto 16px",
                          alignItems: "center", gap: 10, padding: "12px 16px",
                          borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor(v.score), display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT, fontWeight: 500 }}>
                          {SLUG_NAMES[v.tracker_slug] ?? v.tracker_slug}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: trendColor(v.momentum_direction) }}>
                          {trendChar(v.momentum_direction)}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: dotColor(v.score), fontWeight: 600 }}>
                          {v.score.toFixed(1)}
                        </span>
                        <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT_FAINT }}>›</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <a href="/platform/trackers" style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEAL, textDecoration: "none" }}>
                      View all {sortedVelocity.length} trackers →
                    </a>
                  </div>
                </div>
              )}

              {/* 5. Earlier today */}
              {olderSignals.length > 0 && (
                <div>
                  <div
                    onClick={() => setExpanded(e => !e)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: expanded ? 14 : 0 }}
                  >
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, flexShrink: 0, userSelect: "none" }}>
                      {expanded ? "\u25B4" : "\u25BE"} Earlier today · {olderSignals.length} signals
                    </span>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                  </div>
                  {expanded && olderSignals.map(sig => (
                    <SignalCard key={sig.id} sig={sig} onClick={() => router.push(sig.action_url)} />
                  ))}
                </div>
              )}

              {isQuiet && signals.length === 0 && sortedVelocity.length === 0 && (
                <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingTop: 8 }}>
                  All quiet.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP — multi-column grid, light tokens
          Layout restored from commit 7dc1fe2
          ════════════════════════════════════════ */}
      <div className="dash-desktop">

        {/* Overnight Reveal strip */}
        <DashboardReveal />

        {/* Page header */}
        <div style={{ padding: "24px 32px 18px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: TEXT_MUTED, letterSpacing: "0.02em" }}>
            {fmtDate()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>
            <span style={{ width: 6, height: 6, background: TEAL, borderRadius: "50%", display: "inline-block" }} />
            Live
          </div>
        </div>

        {/* 3-column grid */}
        <div style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 20 }}>

          {/* Col 1, rows 1-2: HeroSignal (positions itself via gridRow/gridColumn in component) */}
          <HeroSignal />

          {/* Col 2, row 1: Tracker Velocity + Sparklines */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>
                Tracker velocity · 30d
              </span>
              <a href="/platform/trackers" style={{ fontSize: 11.5, color: TEAL, fontWeight: 500, textDecoration: "none" }}>
                All trackers →
              </a>
            </div>
            {sorted.slice(0, 6).map(v => {
              const sc = scoreColor(v.score);
              const a = arrowChar(
                v.momentum_direction === "accelerating" ? 1
                : v.momentum_direction === "decelerating" ? -1
                : 0
              );
              return (
                <div key={v.tracker_slug} style={{
                  display: "grid", gridTemplateColumns: "90px 1fr 36px 22px",
                  alignItems: "center", gap: 12, padding: "10px 0",
                  borderTop: `1px solid ${BORDER}`,
                }}>
                  <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {SLUG_NAMES[v.tracker_slug] || v.tracker_slug}
                  </div>
                  <div style={{ height: 26, display: "flex", alignItems: "center" }}>
                    {v.history && v.history.length >= 2
                      ? <Sparkline history={v.history} score={v.score} />
                      : <div style={{ flex: 1, height: 1, background: BORDER }} />}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, textAlign: "right", color: sc }}>
                    {v.score.toFixed(1)}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12, textAlign: "center", color: a.color }}>
                    {a.char}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Col 3, row 1: Your Exposure Today */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 14 }}>
              Your exposure today
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, lineHeight: 1, letterSpacing: "-0.03em", color: AMBER }}>
                {watchCount}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT_MUTED }}>
                of {velocityScores.length}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginBottom: 18 }}>
              domains in WATCH or above
            </div>
            <div style={{ marginTop: 2 }}>
              {sorted.slice(0, 6).map(v => {
                const band = bandLabel(v.score);
                const pct = Math.min(100, (v.score / 10) * 100);
                return (
                  <div key={v.tracker_slug} style={{ display: "grid", gridTemplateColumns: "1fr 80px 56px", alignItems: "center", gap: 10, padding: "7px 0", fontSize: 12 }}>
                    <div style={{ color: TEXT }}>{SLUG_NAMES[v.tracker_slug] || v.tracker_slug}</div>
                    <div style={{ height: 4, background: BG, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: band.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", textAlign: "right", fontWeight: 500, color: band.color }}>
                      {band.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 2, row 2: Score Summary */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>
                Score summary
              </span>
              <a href="/platform/trackers" style={{ fontSize: 11.5, color: TEAL, fontWeight: 500, textDecoration: "none" }}>
                All trackers →
              </a>
            </div>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: TEAL }}>{watchCount}</span>
              <span style={{ display: "block", fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                trackers at WATCH or above
              </span>
            </div>
          </div>

          {/* Col 3, row 2: Most Watched */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 14 }}>
              Most watched · this week
            </div>
            {sorted.slice(0, 5).map((v, i) => (
              <div key={v.tracker_slug} style={{
                display: "grid", gridTemplateColumns: "18px 1fr 50px",
                alignItems: "center", gap: 10, padding: "9px 0",
                borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                fontSize: 12.5,
              }}>
                <div style={{ fontFamily: MONO, color: TEXT_FAINT, fontSize: 11 }}>{i + 1}</div>
                <div style={{ color: TEXT }}>{SLUG_NAMES[v.tracker_slug] || v.tracker_slug}</div>
                <div style={{ fontFamily: MONO, fontSize: 11.5, color: TEXT_MUTED, textAlign: "right" }}>
                  {Math.round(v.score * 14)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proof of Work footer */}
        {proofOfWork && (
          <div style={{
            margin: "0 32px",
            padding: "14px 20px",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderTop: `1px solid ${TEAL_SOFT}`,
            borderRadius: "10px 10px 0 0",
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontFamily: MONO,
            fontSize: 11,
            color: TEXT_MUTED,
            letterSpacing: "0.04em",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block" }} />
              <span>Last ingestion</span>
              <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.last_ingestion_minutes_ago} MIN AGO</span>
            </div>
            <span style={{ color: BORDER_STRONG }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Today</span>
              <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.docs_today} DOCS</span>
              <span>processed</span>
            </div>
            <span style={{ color: BORDER_STRONG }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.sources_monitored} SOURCES</span>
              <span>monitored</span>
            </div>
            <span style={{ color: BORDER_STRONG }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: TEXT, fontWeight: 500 }}>{proofOfWork.active_trackers} TRACKERS</span>
              <span>active</span>
            </div>
            <div style={{ marginLeft: "auto", color: TEXT_FAINT }}>
              Next scan: {proofOfWork.next_scan_utc} UTC
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: TEXT_FAINT, fontFamily: MONO, fontSize: 13 }}>
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
