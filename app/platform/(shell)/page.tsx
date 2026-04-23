"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

// ── Desktop-only tokens ───────────────────────────────────────────────────────
const NAVY_SHELL   = "#0B1628";
const CANVAS       = "#F7F9FC";
const CARD         = "#FFFFFF";
const BORDER_D     = "#E4E9F2";
const PURPLE       = "#7C3AED";
const PURPLE_SOFT  = "#EDE9FE";

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

interface NewStoriesData {
  count: number;
  since: string;
  sparkline: number[];
  projects: { id: string; name: string; new_count: number }[];
}

interface EntityItem {
  id: string;
  name: string;
  entity_type: string;
  activity_30d: number;
  material_7d: number;
  daily_counts: number[];
}

// ── Shared helpers ────────────────────────────────────────────────────────────
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

// ── Desktop helpers ───────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function fmtLastChecked(sinceIso: string | null): string {
  if (!sinceIso) return "a while";
  const h = (Date.now() - new Date(sinceIso).getTime()) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function entityTrend(counts: number[]): { char: string; color: string } {
  const recent = counts.slice(4, 7).reduce((a, b) => a + b, 0);
  const older  = counts.slice(1, 4).reduce((a, b) => a + b, 0);
  if (recent > older) return { char: "\u2191", color: TEAL };
  if (recent < older) return { char: "\u2193", color: RED };
  return { char: "\u2192", color: TEXT_FAINT };
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

// ── Desktop sub-components ────────────────────────────────────────────────────

function KpiBar({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(12, Math.round((v / max) * 100))}%`,
          background: i === data.length - 1 ? TEAL : BORDER_D,
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

function EntityAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: PURPLE, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: SANS,
    }}>
      {initials}
    </div>
  );
}

function EntityBar({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 20, width: 56 }}>
      {counts.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(10, Math.round((v / max) * 100))}%`,
          background: i === counts.length - 1 ? PURPLE : BORDER_D,
          borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

function FeedIcon({ type }: { type: Signal["signal_type"] }) {
  const bg =
    type === "countdown_threshold" ? AMBER_SOFT :
    type === "high_sig_story" ? PURPLE_SOFT :
    TEAL_SOFT;
  const fg =
    type === "countdown_threshold" ? AMBER :
    type === "high_sig_story" ? PURPLE :
    TEAL;
  const char =
    type === "countdown_threshold" ? "⏱" :
    type === "band_crossing" ? "↑" :
    type === "convergence_spike" ? "⚡" :
    "●";
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700,
    }}>
      {char}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "there";

  const [signals, setSignals]             = useState<Signal[]>([]);
  const [since, setSince]                 = useState<string | null>(null);
  const [isQuiet, setIsQuiet]             = useState(false);
  const [velocityScores, setVelocityScores] = useState<VScore[]>([]);
  const [proofOfWork, setProofOfWork]     = useState<ProofOfWorkData | null>(null);
  const [newStories, setNewStories]       = useState<NewStoriesData | null>(null);
  const [entities, setEntities]           = useState<{ entities: EntityItem[] } | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [expanded, setExpanded]           = useState(false);

  useEffect(() => {
    // Wait for session to resolve before firing auth-gated requests
    if (status === "loading") return;

    const slugs = Object.keys(SLUG_NAMES);
    Promise.all([
      // Option A: graceful degradation — signals 401/500 returns empty instead of throwing
      fetch("/api/dashboard/signals").then(r => r.ok ? r.json() : { signals: [], is_quiet: true, window: null }),
      fetch("/api/dashboard").then(r => r.ok ? r.json() : { velocityScores: [] }),
      fetch("/api/dashboard/proof-of-work").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/dashboard/new-stories").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/entities/dashboard?scope=tracked").then(r => r.ok ? r.json() : null).catch(() => null),
      ...slugs.map(slug =>
        fetch(`/api/velocity/${slug}`).then(r => r.ok ? r.json() : null).catch(() => null)
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([sigData, dashData, pow, newStoriesData, entitiesData, ...velocityResponses]: any[]) => {
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
      setNewStories(newStoriesData);
      setEntities(entitiesData);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });

    if (status === "authenticated") {
      fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
    }
  }, [status]);

  // Derived — desktop
  const sorted        = [...velocityScores].sort((a, b) => b.score - a.score);
  const totalTrackers = velocityScores.length || 10;
  const activeCount   = velocityScores.filter(v => v.score >= 4).length;
  const lowCount      = velocityScores.filter(v => v.score > 0 && v.score < 4).length;
  const inactiveCount = Math.max(0, totalTrackers - activeCount - lowCount);

  const sodSignal = signals.find(s => s.signal_type === "countdown_threshold")
    ?? signals.find(s => s.signal_type === "band_crossing")
    ?? signals[0]
    ?? null;

  const topEntities = (entities?.entities ?? []).slice(0, 4);
  const topProjects = (newStories?.projects ?? []).slice(0, 3);

  const projectBorderColors = [TEAL, AMBER, TEXT_FAINT];

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
          DESKTOP — Google-console command deck
          Navy shell 10px padding, canvas inset
          ════════════════════════════════════════ */}
      <div
        className="dash-desktop"
        style={{ background: NAVY_SHELL, minHeight: "100vh", padding: 10 }}
      >
        <div style={{
          background: CANVAS,
          borderRadius: 8,
          minHeight: "calc(100vh - 20px)",
          overflow: "auto",
          padding: "20px 24px 28px",
          fontFamily: SANS,
        }}>

          {/* ── 1. Page header ───────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 18,
          }}>
            <div>
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 4, letterSpacing: "0.04em" }}>
                {fmtDate()} · you last checked {fmtLastChecked(since)} ago
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, lineHeight: 1.25 }}>
                Good {greeting()}, {firstName}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 4 }}>
              <button
                onClick={() => router.push("/platform/brief")}
                style={{
                  fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  color: TEXT_MUTED, background: "transparent",
                  border: `1px solid ${BORDER_D}`, borderRadius: 6,
                  padding: "7px 14px", cursor: "pointer",
                }}
              >
                Build brief
              </button>
              <button
                onClick={() => router.push("/platform/projects/new")}
                style={{
                  fontFamily: SANS, fontSize: 13, fontWeight: 600,
                  color: "#fff", background: TEAL,
                  border: "none", borderRadius: 6,
                  padding: "7px 14px", cursor: "pointer",
                }}
              >
                + New project
              </button>
            </div>
          </div>

          {/* ── 2. KPI strip ─────────────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 10, marginBottom: 10,
          }}>

            {/* KPI 1: Tracker status */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
                Tracker status
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
                  {activeCount}
                </span>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>
                  of {totalTrackers} live
                </span>
              </div>
              {/* 3-segment bar */}
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 1, marginBottom: 8 }}>
                <div style={{ flex: activeCount, background: AMBER, minWidth: activeCount > 0 ? 4 : 0 }} />
                <div style={{ flex: lowCount, background: RED, minWidth: lowCount > 0 ? 4 : 0 }} />
                <div style={{ flex: Math.max(inactiveCount, 1), background: BORDER_D, minWidth: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: TEXT_FAINT }}>
                {activeCount} watch · {lowCount} low · {inactiveCount} quiet
              </div>
            </div>

            {/* KPI 2: New stories */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
                New stories
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
                  {newStories?.count ?? 0}
                </span>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>
                  since {newStories?.since ? fmtSince(newStories.since) : "..."}
                </span>
              </div>
              {newStories?.sparkline && newStories.sparkline.length > 0 && (
                <KpiBar data={newStories.sparkline} />
              )}
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginTop: 6 }}>
                on your trackers
              </div>
            </div>

            {/* KPI 3: New in projects */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
                New in your projects
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
                  {topProjects.reduce((s, p) => s + p.new_count, 0)}
                </span>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>new items</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {topProjects.filter(p => p.new_count > 0).map(p => (
                  <span key={p.id} style={{
                    fontSize: 11, fontWeight: 500,
                    color: TEAL, border: `1px solid ${TEAL}`,
                    borderRadius: 6, padding: "2px 8px",
                  }}>
                    {p.name.split(" ")[0]} +{p.new_count}
                  </span>
                ))}
                {topProjects.length === 0 && (
                  <span style={{ fontSize: 11, color: TEXT_FAINT }}>No projects yet</span>
                )}
              </div>
            </div>

            {/* KPI 4: Readiness */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              borderRight: `3px solid ${AMBER}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
                Readiness
              </div>
              {sodSignal?.signal_type === "countdown_threshold" ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: AMBER, lineHeight: 1 }}>
                      {typeof sodSignal.metadata.days_until === "number" ? sodSignal.metadata.days_until : "?"}
                    </span>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>days</span>
                  </div>
                  {/* Progress bar */}
                  {typeof sodSignal.metadata.days_until === "number" && (
                    <div style={{ height: 4, background: BORDER_D, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.max(5, Math.min(100, 100 - ((sodSignal.metadata.days_until as number) / 90) * 100))}%`,
                        background: AMBER, borderRadius: 2,
                      }} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: TEXT_FAINT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {typeof sodSignal.metadata.event_name === "string"
                      ? sodSignal.metadata.event_name
                      : sodSignal.headline}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: TEXT_FAINT, paddingTop: 4 }}>
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Middle row ─────────────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.6fr 1fr",
            gap: 10, marginBottom: 10,
          }}>

            {/* Tracker pulse */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 14,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Tracker pulse · 30D
                </span>
                <a href="/platform/trackers" style={{ fontSize: 12, color: TEAL, fontWeight: 500, textDecoration: "none" }}>
                  All trackers →
                </a>
              </div>

              {sorted.slice(0, 6).map((v, i) => {
                const sc  = scoreColor(v.score);
                const bl  = bandLabel(v.score);
                const arr = arrowChar(
                  v.momentum_direction === "accelerating" ? 1
                    : v.momentum_direction === "decelerating" ? -1
                    : 0
                );
                return (
                  <div
                    key={v.tracker_slug}
                    onClick={() => router.push(`/platform/tracker/${v.tracker_slug}`)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "88px 1fr 44px 80px",
                      alignItems: "center", gap: 12,
                      padding: "10px 0",
                      borderTop: i > 0 ? `0.5px solid ${BORDER_D}` : "none",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {SLUG_NAMES[v.tracker_slug] ?? v.tracker_slug}
                    </div>
                    <div style={{ height: 26, display: "flex", alignItems: "center" }}>
                      {v.history && v.history.length >= 2
                        ? <Sparkline history={v.history} score={v.score} />
                        : <div style={{ flex: 1, height: 1, background: BORDER_D }} />}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", color: sc, fontVariantNumeric: "tabular-nums" }}>
                      {v.score.toFixed(1)} {arr.char}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                        color: bl.color, border: `1px solid ${bl.color}`,
                        borderRadius: 4, padding: "2px 7px",
                      }}>
                        {bl.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Footer legend */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                marginTop: 14, paddingTop: 12,
                borderTop: `0.5px solid ${BORDER_D}`,
              }}>
                {[
                  { color: TEAL, label: "Elevated" },
                  { color: AMBER, label: "Watch" },
                  { color: RED, label: "Low" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ fontSize: 11, color: TEXT_FAINT }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                Since you last checked
              </div>

              {signals.slice(0, 5).map((sig, i) => (
                <div
                  key={sig.id}
                  onClick={() => router.push(sig.action_url)}
                  style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    padding: "10px 0",
                    borderTop: i > 0 ? `0.5px solid ${BORDER_D}` : "none",
                    cursor: "pointer",
                  }}
                >
                  <FeedIcon type={sig.signal_type} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: TEXT,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      marginBottom: 2,
                    }}>
                      {sig.headline}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_FAINT }}>
                      {SLUG_NAMES[sig.tracker_slug] ?? sig.tracker_slug} · {fmtAge(sig.age_hours)}
                    </div>
                  </div>
                </div>
              ))}

              {signals.length === 0 && !loading && (
                <div style={{ fontSize: 13, color: TEXT_FAINT, paddingTop: 8 }}>
                  All quiet since your last visit.
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Bottom row ─────────────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr",
            gap: 10,
          }}>

            {/* Signal of the day */}
            <div style={{
              background: "linear-gradient(135deg, #0B1628 0%, #162544 100%)",
              borderRadius: 8,
              padding: "20px 22px",
              display: "flex", flexDirection: "column", minHeight: 200,
            }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 4, padding: "2px 8px",
                }}>
                  SIGNAL
                </span>
              </div>

              {sodSignal ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 10 }}>
                    {sodSignal.signal_type === "countdown_threshold" && typeof sodSignal.metadata.event_name === "string"
                      ? sodSignal.metadata.event_name
                      : sodSignal.headline}
                  </div>

                  {sodSignal.signal_type === "countdown_threshold" && typeof sodSignal.metadata.days_until === "number" && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 52, fontWeight: 700, color: AMBER, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                        {sodSignal.metadata.days_until as number}
                      </span>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>days</span>
                    </div>
                  )}

                  <div style={{
                    fontSize: 12.5, color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.55, marginBottom: 18, flex: 1,
                  }}>
                    {sodSignal.body}
                  </div>

                  <button
                    onClick={() => router.push(sodSignal.action_url)}
                    style={{
                      fontFamily: SANS, fontSize: 13, fontWeight: 600,
                      color: "#fff", background: TEAL,
                      border: "none", borderRadius: 6,
                      padding: "8px 16px", cursor: "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    {sodSignal.action_label}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", paddingTop: 8 }}>
                  No priority signals right now.
                </div>
              )}
            </div>

            {/* Most active entities */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                Most active this week
              </div>

              {topEntities.length > 0 ? topEntities.map((e, i) => {
                const trend = entityTrend(e.daily_counts);
                return (
                  <div
                    key={e.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 0",
                      borderTop: i > 0 ? `0.5px solid ${BORDER_D}` : "none",
                    }}
                  >
                    <EntityAvatar name={e.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.name}
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_FAINT }}>
                        {e.activity_30d} mentions
                      </div>
                    </div>
                    <EntityBar counts={e.daily_counts} />
                    <span style={{ fontSize: 14, color: trend.color, fontWeight: 700, width: 14, textAlign: "center", flexShrink: 0 }}>
                      {trend.char}
                    </span>
                  </div>
                );
              }) : (
                <div style={{ fontSize: 13, color: TEXT_FAINT, paddingTop: 8 }}>
                  No tracked entities yet.
                </div>
              )}
            </div>

            {/* Your projects */}
            <div style={{
              background: CARD, borderRadius: 8,
              border: `0.5px solid ${BORDER_D}`,
              padding: "16px 20px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 14,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Your projects
                </span>
                <Link href="/platform/projects" style={{ fontSize: 12, color: TEAL, fontWeight: 500, textDecoration: "none" }}>
                  All →
                </Link>
              </div>

              {topProjects.length > 0 ? topProjects.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/platform/projects/${p.id}`)}
                  style={{
                    padding: "10px 10px 10px 12px",
                    marginBottom: i < topProjects.length - 1 ? 8 : 0,
                    borderLeft: `3px solid ${projectBorderColors[i]}`,
                    borderRadius: "0 6px 6px 0",
                    background: "#FAFBFC",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                      {p.name}
                    </div>
                    {p.new_count > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: projectBorderColors[i],
                        border: `1px solid ${projectBorderColors[i]}`,
                        borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                      }}>
                        +{p.new_count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_FAINT }}>
                    {p.new_count} new stories
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 13, color: TEXT_FAINT, paddingTop: 8 }}>
                  No projects yet.{" "}
                  <Link
                    href="/platform/projects/new"
                    style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}
                  >
                    Create one
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Proof of work footer ─────────────────────────────────────────── */}
          {proofOfWork && (
            <div style={{
              marginTop: 10,
              padding: "12px 20px",
              background: CARD,
              border: `0.5px solid ${BORDER_D}`,
              borderTop: `2px solid ${TEAL_SOFT}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 11,
              color: TEXT_FAINT,
              letterSpacing: "0.03em",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block" }} />
                <span>Last ingestion</span>
                <span style={{ color: TEXT, fontWeight: 600 }}>{proofOfWork.last_ingestion_minutes_ago} MIN AGO</span>
              </div>
              <span style={{ color: BORDER_D }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Today</span>
                <span style={{ color: TEXT, fontWeight: 600 }}>{proofOfWork.docs_today} DOCS</span>
                <span>processed</span>
              </div>
              <span style={{ color: BORDER_D }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TEXT, fontWeight: 600 }}>{proofOfWork.sources_monitored} SOURCES</span>
                <span>monitored</span>
              </div>
              <span style={{ color: BORDER_D }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TEXT, fontWeight: 600 }}>{proofOfWork.active_trackers} TRACKERS</span>
                <span>active</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                Next scan: {proofOfWork.next_scan_utc} UTC
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: 60, color: TEXT_FAINT, fontSize: 13 }}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
