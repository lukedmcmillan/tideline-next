"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG      = "#F8F9FA";
const WHITE   = "#FFFFFF";
const NAVY    = "#0A1628";
const TEAL    = "#1D9E75";
const AMBER   = "#EF9F27";
const RED     = "#E24B4A";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const MINT_BG = "#F4FBF7";
const F       = "'DM Sans', system-ui, sans-serif";
const M       = "'DM Mono', monospace";

// ── Types ─────────────────────────────────────────────────────────────────────
interface EntityItem {
  id: string;
  name: string;
  entity_type: string;
  tracker_tag: string | null;
  activity_30d: number;
  material_7d: number;
  last_seen: string | null;
  daily_counts: number[];
  daily_material: boolean[];
  is_tracked: boolean;
  tracked_since: string | null;
  latest_snippet: string | null;
}

interface EntityDetail {
  breakdown: { regulatory: number; developing: number; enforcement: number };
  recent: Array<{
    date_label: string;
    category_label: string;
    band: "regulatory" | "developing" | "enforcement";
    summary: string;
    source_name: string;
    link: string;
  }>;
}

type Scope = "tracked" | "all";
type SignalState = "HIGH" | "WATCH" | "QUIET" | "DORMANT";

// ── Helpers ───────────────────────────────────────────────────────────────────
function signalState(e: EntityItem): SignalState {
  if (e.material_7d >= 3) return "HIGH";
  if (e.material_7d >= 1) return "WATCH";
  if (e.activity_30d > 0) return "QUIET";
  return "DORMANT";
}

function signalStyle(s: SignalState): { bg: string; color: string; dot: string } {
  switch (s) {
    case "HIGH":    return { bg: "#E6F5EE", color: "#0F7452", dot: "#1D9E75" };
    case "WATCH":   return { bg: "#FDF4E4", color: "#8F5E10", dot: "#EF9F27" };
    case "QUIET":   return { bg: "#EEF2F7", color: "#5A7290", dot: "#8BA0BC" };
    case "DORMANT": return { bg: "#F4F6F9", color: "#8BA0BC", dot: "#C2CBD6" };
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "< 1h";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 32);
  }
}

const TYPE_LABELS: Record<string, string> = {
  country: "Country", organization: "Org", company: "Company",
  treaty: "Treaty", person: "Person", body: "Body",
  fund: "Fund", vessel: "Vessel",
};
function typeLabel(t: string): string {
  return TYPE_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);
}

const TRACKER_LABELS: Record<string, string> = {
  "isa": "ISA", "bbnj": "BBNJ", "iuu": "IUU", "30x30": "30x30",
  "blue-finance": "Blue Finance", "imo-shipping": "IMO",
  "offshore-wind": "Offshore Wind", "cites-marine": "CITES",
  "wto-fisheries": "WTO", "plastics": "Plastics", "governance": "Governance",
};

// ── Signal Pill (FIX 2) ───────────────────────────────────────────────────────
function SignalPill({ signal }: { signal: SignalState }) {
  const { bg, color, dot } = signalStyle(signal);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color,
      borderRadius: 10,
      padding: "3px 7px 3px 5px",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", fontFamily: M,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {signal}
    </span>
  );
}

// ── Star Icon (FIX 3 — 18px) ──────────────────────────────────────────────────
function StarButton({ filled, onClick }: { filled: boolean; onClick: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      {filled ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="#EF9F27">
          <path d="M9 1.5l2.1 4.8 5.1.5-3.8 3.5 1.2 5L9 12.6 4.4 15.3l1.2-5L1.8 6.8l5.1-.5L9 1.5z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={hovered ? "#8BA0BC" : "#C2CBD6"} strokeWidth="1.3">
          <path d="M9 1.5l2.1 4.8 5.1.5-3.8 3.5 1.2 5L9 12.6 4.4 15.3l1.2-5L1.8 6.8l5.1-.5L9 1.5z"/>
        </svg>
      )}
    </button>
  );
}

// ── Summary Strip (scope=tracked only) ───────────────────────────────────────
function SummaryStrip({ entities }: { entities: EntityItem[] }) {
  const material = entities.filter(e => e.material_7d >= 1).length;
  const quiet    = entities.filter(e => e.material_7d === 0 && e.activity_30d > 0).length;
  const dormant  = entities.filter(e => e.activity_30d === 0).length;
  const n        = entities.length;
  return (
    <div style={{
      background: MINT_BG, borderBottom: `1px solid #D4EDDF`,
      padding: "8px 16px", fontSize: 12, color: "#3D6A55",
    }}>
      <span style={{ fontWeight: 600 }}>Tracking {n} {n === 1 ? "entity" : "entities"}.</span>
      {" "}{material} moved this week, {quiet} quiet, {dormant} dormant.
    </div>
  );
}

// ── Type Pill (FIX 8 — 9px, outline only, border-radius 10px) ────────────────
function TypePill({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
      color: T4, border: `1px solid #D4DDE8`,
      borderRadius: 10, padding: "2px 7px", fontFamily: M,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ── Entity List Card (FIX 1, 3, 8) ───────────────────────────────────────────
function EntityCard({
  entity,
  selected,
  onSelect,
  onToggleTrack,
}: {
  entity: EntityItem;
  selected: boolean;
  onSelect: () => void;
  onToggleTrack: (e: React.MouseEvent) => void;
}) {
  const sig     = entity.is_tracked ? signalState(entity) : null;
  const tracker = entity.tracker_tag ? (TRACKER_LABELS[entity.tracker_tag] ?? entity.tracker_tag) : null;

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${BLT}`,
        cursor: "pointer",
        background: selected ? "rgba(29,158,117,0.06)" : WHITE,
        borderLeft: selected ? `3px solid ${TEAL}` : "3px solid transparent",
        transition: "background .1s",
      }}
    >
      {/* Top row: name + signal pill + star */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: selected ? 600 : 500, color: T1, lineHeight: 1.35, flex: 1 }}>
          {entity.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {sig && <SignalPill signal={sig} />}
          <StarButton filled={entity.is_tracked} onClick={onToggleTrack} />
        </div>
      </div>

      {/* Meta row: type pill + tracker + time ago — all inline (FIX 8) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: entity.latest_snippet ? 5 : 0, flexWrap: "wrap" }}>
        <TypePill label={typeLabel(entity.entity_type)} />
        {tracker && (
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: TEAL, border: `1px solid rgba(29,158,117,0.25)`,
            borderRadius: 10, padding: "2px 7px", fontFamily: M, whiteSpace: "nowrap",
          }}>
            {tracker}
          </span>
        )}
        {entity.last_seen && (
          <span style={{ fontSize: 11, color: T4, marginLeft: "auto" }}>
            {timeAgo(entity.last_seen)}
          </span>
        )}
      </div>

      {/* Preview snippet (FIX 1) */}
      {entity.latest_snippet && (
        <div style={{
          fontSize: 12, color: "#5A7290", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {entity.latest_snippet}
        </div>
      )}
    </div>
  );
}

// ── Skeleton cards ─────────────────────────────────────────────────────────────
function SkeletonCard({ i }: { i: number }) {
  return (
    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BLT}` }}>
      <div style={{ height: 14, background: BLT, borderRadius: 3, marginBottom: 8, width: `${70 + (i % 3) * 10}%`, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ height: 9, background: BLT, borderRadius: 3, width: "40%", marginBottom: 6, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ height: 10, background: BLT, borderRadius: 3, width: "85%", animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
    </div>
  );
}

// ── Your Tracking Card (FIX 4 — icon box with teal star) ─────────────────────
function TrackingCard({ entity, onUntrack }: { entity: EntityItem; onUntrack: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const tracker = entity.tracker_tag ? (TRACKER_LABELS[entity.tracker_tag] ?? entity.tracker_tag) : null;

  return (
    <div style={{
      background: WHITE, border: `1px solid #E8EDF4`, borderRadius: 12,
      padding: "16px 18px", marginBottom: 20,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      {/* Icon box (FIX 4) */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: MINT_BG,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill={TEAL}>
          <path d="M9 1.5l2.1 4.8 5.1.5-3.8 3.5 1.2 5L9 12.6 4.4 15.3l1.2-5L1.8 6.8l5.1-.5L9 1.5z"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: 3 }}>
          YOUR TRACKING
        </div>
        <div style={{ fontSize: 13, color: T2 }}>
          {entity.tracked_since
            ? `Tracking since ${formatDate(entity.tracked_since)}.`
            : "Now tracking."}{" "}
          {tracker ? `Mapped to ${tracker} tracker.` : "No tracker mapped."}
        </div>
      </div>

      {/* Untrack button */}
      {confirming ? (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => { onUntrack(); setConfirming(false); }} style={{ fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 4, border: "1px solid #D93025", color: "#D93025", background: "none", cursor: "pointer" }}>
            Confirm
          </button>
          <button onClick={() => setConfirming(false)} style={{ fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 4, border: `1px solid ${BORDER}`, color: T3, background: "none", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} style={{ fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 4, border: `1px solid #D4DDE8`, color: "#5A7290", background: "none", cursor: "pointer", flexShrink: 0 }}>
          Untrack
        </button>
      )}
    </div>
  );
}

// ── Track CTA Card ────────────────────────────────────────────────────────────
function TrackCtaCard({ onTrack }: { onTrack: () => void }) {
  return (
    <div style={{
      background: MINT_BG, border: `1px solid #C5E8D6`, borderRadius: 12,
      padding: "16px 18px", marginBottom: 20,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ flex: 1, fontSize: 13, color: T2 }}>
        Track this entity to see it in your morning brief and dashboard.
      </div>
      <button onClick={onTrack} style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 4, border: "none", background: TEAL, color: WHITE, cursor: "pointer", flexShrink: 0 }}>
        Track
      </button>
    </div>
  );
}

// ── Category pill for recent mentions ────────────────────────────────────────
function CategoryPill({ label, band }: { label: string; band: "regulatory" | "developing" | "enforcement" }) {
  const styles = {
    regulatory:  { color: T4,   bg: BG,                      border: `1px solid ${BORDER}` },
    developing:  { color: "#8F5E10", bg: "#FDF4E4",           border: "1px solid rgba(239,159,39,0.25)" },
    enforcement: { color: "#C0392B", bg: "rgba(226,75,74,.07)", border: "1px solid rgba(226,75,74,.2)" },
  };
  const s = styles[band];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
      color: s.color, background: s.bg, border: s.border, borderRadius: 4, padding: "1px 7px",
      fontFamily: M,
    }}>
      {label}
    </span>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  entity,
  detail,
  detailLoading,
  onTrack,
  onUntrack,
}: {
  entity: EntityItem;
  detail: EntityDetail | null;
  detailLoading: boolean;
  onTrack: () => void;
  onUntrack: () => void;
}) {
  const tracker = entity.tracker_tag ? (TRACKER_LABELS[entity.tracker_tag] ?? entity.tracker_tag) : null;

  // Sparkline bars — FIX 7: 20% minimum baseline
  const counts   = entity.daily_counts.length === 7 ? entity.daily_counts : Array(7).fill(0);
  const material = entity.daily_material.length === 7 ? entity.daily_material : Array(7).fill(false);
  const maxCount = Math.max(...counts, 1);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 28, background: BG }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, marginBottom: 6 }}>
              {typeLabel(entity.entity_type)}{tracker ? ` · ${tracker}` : ""}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.02em", color: T1, marginBottom: 6, lineHeight: 1.2 }}>
              {entity.name}
            </div>
            <div style={{ fontSize: 13, color: T3 }}>
              {entity.activity_30d} mentions in last 30 days
              {entity.last_seen ? ` · Last seen ${timeAgo(entity.last_seen)}` : ""}
            </div>
          </div>
          <a href="/platform/research" style={{
            display: "flex", alignItems: "center", gap: 7,
            background: NAVY, color: WHITE, border: "none",
            borderRadius: 8, padding: "10px 16px",
            fontFamily: F, fontSize: 13, fontWeight: 500,
            cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.3"/>
              <path d="M9.5 9.5l3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Ask about this entity
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
          <div style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, color: TEAL, borderBottom: `2px solid ${TEAL}`, cursor: "pointer" }}>Overview</div>
          <div style={{ padding: "10px 20px", fontSize: 13, color: T3, cursor: "pointer" }}>Timeline</div>
          <div style={{ padding: "10px 20px", fontSize: 13, color: T3, cursor: "pointer" }}>Stories</div>
        </div>

        {/* Tracking card */}
        {entity.is_tracked
          ? <TrackingCard entity={entity} onUntrack={onUntrack} />
          : <TrackCtaCard onTrack={onTrack} />
        }

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Mention frequency — FIX 7: baseline bars */}
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>
              Mention frequency
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
              {counts.map((h, i) => {
                const pct = Math.max((h / maxCount) * 100, 20); // FIX 7: min 20% baseline
                const isActive = h > 0;
                const isMat    = material[i];
                const color = isMat ? AMBER : isActive ? TEAL : "#C5E8D6";
                return (
                  <div key={i} style={{
                    flex: 1, height: `${pct}%`,
                    background: color,
                    borderRadius: "3px 3px 0 0",
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T4, fontFamily: M }}>
              <span>6d ago</span><span>Today</span>
            </div>
          </div>

          {/* Context breakdown — FIX 5 */}
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>
              Context breakdown
            </div>
            {detailLoading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: BLT }} />
                  <div style={{ flex: 1, height: 13, background: BLT, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
                  <div style={{ width: 20, height: 13, background: BLT, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
                </div>
              ))
            ) : detail ? (
              [
                { label: "Regulatory", count: detail.breakdown.regulatory, dot: TEAL },
                { label: "Developing", count: detail.breakdown.developing, dot: AMBER },
                { label: "Enforcement", count: detail.breakdown.enforcement, dot: RED },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T2, flex: 1 }}>{r.label}</span>
                  <span style={{ fontFamily: M, fontSize: 13, color: T3 }}>{r.count}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: T4 }}>No data available.</div>
            )}
          </div>
        </div>

        {/* Recent mentions — FIX 6 */}
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}`, fontSize: 13, fontWeight: 600, color: T2 }}>
            Recent mentions
          </div>
          {detailLoading ? (
            [0, 1, 2].map(i => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${BLT}` }}>
                <div style={{ height: 10, background: BLT, borderRadius: 3, width: "30%", marginBottom: 8, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
                <div style={{ height: 13, background: BLT, borderRadius: 3, marginBottom: 4, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
                <div style={{ height: 13, background: BLT, borderRadius: 3, width: "70%", animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
              </div>
            ))
          ) : detail && detail.recent.length > 0 ? (
            detail.recent.map((m, i) => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: i < detail.recent.length - 1 ? `1px solid ${BLT}` : "none" }}>
                {/* Timestamp + category pill */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: M, fontSize: 10, color: T4 }}>{m.date_label}</span>
                  <CategoryPill label={m.category_label} band={m.band} />
                </div>
                {/* Summary */}
                <div style={{ fontSize: 13, color: T1, lineHeight: 1.55, marginBottom: 6 }}>
                  {m.summary || <span style={{ color: T4 }}>No summary available.</span>}
                </div>
                {/* Source */}
                {m.source_name && (
                  <a href={m.link || "#"} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none" }}>
                    {m.source_name}{m.link ? ` / ${truncateUrl(m.link)}` : ""} ↗
                  </a>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: "32px 20px", textAlign: "center", color: T4, fontSize: 13 }}>
              No recent mentions found in the last 90 days.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Empty / No-selection states ───────────────────────────────────────────────
function EmptyState({ scope, onSwitchToAll }: { scope: Scope; onSwitchToAll: () => void }) {
  if (scope === "tracked") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 4l4.5 10.3H36l-9 6.5 3.5 10.5L20 24.2l-10.5 7.1 3.5-10.5-9-6.5H15.5L20 4z" stroke={BORDER} strokeWidth="1.5"/>
        </svg>
        <div style={{ fontSize: 15, fontWeight: 500, color: T3, textAlign: "center" }}>
          You are not tracking any entities yet.
        </div>
        <button onClick={onSwitchToAll} style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: TEAL, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: 4, padding: "7px 18px", background: "none", cursor: "pointer" }}>
          Browse all entities
        </button>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: T3 }}>No entities match this filter.</div>
    </div>
  );
}

function NoSelection() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: T4, background: BG }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="34" cy="34" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="34" cy="18" r="10" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <div style={{ fontSize: 15, fontWeight: 500, color: T3 }}>Select an entity to see its profile</div>
      <div style={{ fontSize: 13, color: T4, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        Organisations, vessels, and people tracked across all Tideline sources.
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: NAVY, color: WHITE, borderRadius: 4, padding: "12px 16px",
      fontFamily: F, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    }}>
      {message}
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────
function DirectoryPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const scope: Scope = searchParams.get("scope") === "all" ? "all" : "tracked";

  const [entities,         setEntities]         = useState<EntityItem[]>([]);
  const [totalEntityCount, setTotalEntityCount] = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [detail,           setDetail]           = useState<EntityDetail | null>(null);
  const [detailLoading,    setDetailLoading]    = useState(false);
  const [typeFilter,       setTypeFilter]       = useState<string[]>([]);
  const [search,           setSearch]           = useState("");
  const [searchDebounced,  setSearchDebounced]  = useState("");
  const [toast,            setToast]            = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadEntities = useCallback((s: Scope) => {
    setLoading(true);
    fetch(`/api/entities/dashboard?scope=${s}`)
      .then(r => r.ok ? r.json() : { entities: [], total_entity_count: 0 })
      .then(d => {
        const list: EntityItem[] = d.entities ?? [];
        setEntities(list);
        setTotalEntityCount(d.total_entity_count ?? 0);
        setLoading(false);
        if (list.length > 0) {
          setSelectedId(prev => (prev && list.find(e => e.id === prev)) ? prev : list[0].id);
        } else {
          setSelectedId(null);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntities(scope);
    setSearch("");
    setSearchDebounced("");
    setTypeFilter([]);
  }, [scope, loadEntities]);

  // Fetch detail when selection changes
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/entities/detail?entity_id=${selectedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [selectedId]);

  const handleScopeChange = (s: Scope) => router.replace(`/platform/directory?scope=${s}`);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchDebounced(val), 300);
  }, []);

  const toggleType = (t: string) =>
    setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleToggleTrack = async (entityId: string, currentlyTracked: boolean) => {
    setEntities(prev => prev.map(e => e.id === entityId ? { ...e, is_tracked: !currentlyTracked } : e));
    try {
      const res = await fetch("/api/entities/track", {
        method: currentlyTracked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: entityId }),
      });
      if (!res.ok) throw new Error();
      showToast(currentlyTracked ? "Removed from tracked entities" : "Now tracking this entity");
    } catch {
      setEntities(prev => prev.map(e => e.id === entityId ? { ...e, is_tracked: currentlyTracked } : e));
      showToast("Failed to update tracking. Try again.");
    }
  };

  const uniqueTypes = [...new Set(entities.map(e => e.entity_type))].filter(Boolean).sort();

  const filtered = entities
    .filter(e => typeFilter.length === 0 || typeFilter.includes(e.entity_type))
    .filter(e => !searchDebounced || e.name.toLowerCase().includes(searchDebounced.toLowerCase()));

  const selectedEntity = selectedId ? (entities.find(e => e.id === selectedId) ?? null) : null;
  const trackedCount   = scope === "tracked" ? entities.length : entities.filter(e => e.is_tracked).length;

  return (
    <>
      <style>{`
        @keyframes skpulse { 0%,100% { opacity:.5 } 50% { opacity:.2 } }
      `}</style>
      <div style={{ display: "flex", height: "100%", overflow: "hidden", background: WHITE }}>

        {/* ── Left: entity list ──────────────────────────────────────────── */}
        <div style={{
          width: 380, flexShrink: 0, background: WHITE,
          borderRight: `1px solid ${BORDER}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 16px 0", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.02em", color: T1, marginBottom: 12 }}>
              Directory
            </div>

            {/* Scope toggle */}
            <div style={{ display: "flex", background: "#EAECEF", borderRadius: 8, padding: 3, marginBottom: 12 }}>
              {(["tracked", "all"] as Scope[]).map(s => {
                const label = s === "tracked"
                  ? `My tracked (${trackedCount})`
                  : `All entities (${totalEntityCount})`;
                const active = scope === s;
                return (
                  <button key={s} onClick={() => handleScopeChange(s)} style={{
                    flex: 1, padding: "6px 10px", fontSize: 12, fontFamily: F,
                    fontWeight: active ? 600 : 400,
                    color: active ? T1 : T3,
                    background: active ? WHITE : "transparent",
                    border: "none", borderRadius: 6, cursor: "pointer",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                    transition: "all .15s",
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Type filter pills */}
            {uniqueTypes.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                {uniqueTypes.map(t => {
                  const on = typeFilter.includes(t);
                  return (
                    <button key={t} onClick={() => toggleType(t)} style={{
                      fontSize: 10, fontFamily: M, fontWeight: 600, letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: on ? WHITE : T3,
                      background: on ? TEAL : WHITE,
                      border: `1px solid ${on ? TEAL : BORDER}`,
                      borderRadius: 20, padding: "2px 9px", cursor: "pointer",
                    }}>
                      {typeLabel(t)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px", marginBottom: 12 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke={T4} strokeWidth="1.3"/>
                <path d="M9.5 9.5l2.5 2.5" stroke={T4} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={scope === "tracked" ? "Search your tracked entities..." : "Search organisations, vessels, people..."}
                style={{ border: "none", outline: "none", background: "transparent", fontFamily: F, fontSize: 12, color: T1, flex: 1 }}
              />
            </div>
          </div>

          {/* Summary strip */}
          {!loading && scope === "tracked" && entities.length > 0 && (
            <SummaryStrip entities={entities} />
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              [0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} i={i} />)
            ) : filtered.length === 0 ? (
              <EmptyState scope={scope} onSwitchToAll={() => handleScopeChange("all")} />
            ) : (
              filtered.map(e => (
                <EntityCard
                  key={e.id}
                  entity={e}
                  selected={e.id === selectedId}
                  onSelect={() => setSelectedId(e.id)}
                  onToggleTrack={ev => { ev.stopPropagation(); handleToggleTrack(e.id, e.is_tracked); }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: detail panel ────────────────────────────────────────── */}
        {selectedEntity ? (
          <DetailPanel
            key={selectedEntity.id}
            entity={selectedEntity}
            detail={detail}
            detailLoading={detailLoading}
            onTrack={() => handleToggleTrack(selectedEntity.id, false)}
            onUntrack={() => handleToggleTrack(selectedEntity.id, true)}
          />
        ) : (
          !loading && <NoSelection />
        )}
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function DirectoryPage() {
  return (
    <Suspense>
      <DirectoryPageInner />
    </Suspense>
  );
}
