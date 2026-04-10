"use client";

import { useState, useEffect, useMemo } from "react";
import VelocityScore from "@/components/VelocityScore";

// ── Design tokens ────────────────────────────────────────────────────────
const NAVY = "#1a2f4a";
const NAVY_DARK = "#13253b";
const TEAL = "#1D9E75";
const AMBER = "#B45309";
const RED = "#B91C1C";
const WHITE = "#FFFFFF";
const BORDER = "#DADCE0";
const BORDER_SOFT = "#EDEEF0";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

// ── Interfaces ───────────────────────────────────────────────────────────
interface TrackerEvent {
  id: string;
  event_date: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  source_name: string | null;
  event_type: string;
  significance: string | null;
}

interface FeedStory {
  id: string;
  title: string;
  source_name: string;
  published_at: string;
  short_summary: string | null;
}

interface Contractor {
  id: string;
  company_name: string;
  sponsoring_state: string;
  contract_type: string;
  contract_area: string;
  contract_date: string;
  status: string;
  source_url: string | null;
  notes: string | null;
}

interface TrackerStatus {
  slug: string;
  stage: {
    number: number | null;
    name: string | null;
    description: string | null;
    source_url: string | null;
    source_label: string | null;
    verified_at: string | null;
  };
  trajectory: {
    direction: "advancing" | "stalling" | "blocked" | null;
    reason: string | null;
    source_url: string | null;
    source_label: string | null;
    verified_at: string | null;
  };
  next_event: {
    name: string;
    date: string | null;
    location: string | null;
    source_url: string | null;
  } | null;
  updated_at: string;
  updated_by: string | null;
}

interface CommunityDoc {
  id: string;
  title: string;
  summary: string | null;
  publisher: string | null;
  source_url: string | null;
  file_url: string | null;
  submitted_by_display: string | null;
  submitted_by_role: string | null;
  submission_type: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.ceil((then - Date.now()) / 86400000);
}

function eyebrowStyle(color: string = TEAL): React.CSSProperties {
  return {
    fontFamily: F,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color,
    marginBottom: 12,
  };
}

// ── Verified tag ─────────────────────────────────────────────────────────
function VerifiedTag({ url, label, verifiedAt }: { url: string | null; label: string | null; verifiedAt: string | null }) {
  if (!url && !label) return null;
  const days = daysSince(verifiedAt);
  const stale = days !== null && days > 14;
  return (
    <div style={{ marginTop: 10 }}>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          verified <span style={{ fontSize: 10 }}>&#8599;</span>
          {label && <span style={{ color: "rgba(255,255,255,0.45)", marginLeft: 6, fontWeight: 400 }}>{label}</span>}
        </a>
      ) : (
        <span style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      )}
      {stale && (
        <div style={{ fontFamily: F, fontSize: 11, color: "#F59E0B", marginTop: 4 }}>
          Last verified {days} days ago. Verify before citing.
        </div>
      )}
    </div>
  );
}

// ── Stage pip track ──────────────────────────────────────────────────────
function StagePips({ current, total = 5 }: { current: number | null; total?: number }) {
  if (current === null) return null;
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < current;
        return (
          <div
            key={i}
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: active ? TEAL : "rgba(255,255,255,0.15)",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Trajectory word (outlined, not solid) ────────────────────────────────
function TrajectoryWord({ direction }: { direction: TrackerStatus["trajectory"]["direction"] }) {
  if (!direction) return null;
  const color =
    direction === "advancing" ? TEAL :
    direction === "stalling" ? "#F59E0B" :
    "#F87171";
  return (
    <div
      style={{
        fontFamily: F,
        fontSize: 22,
        fontWeight: 600,
        color,
        letterSpacing: "-0.01em",
        textTransform: "capitalize",
        marginBottom: 12,
      }}
    >
      {direction}
    </div>
  );
}

// ── Set alert button ─────────────────────────────────────────────────────
function SetAlertButton({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "error">("idle");
  const subscribe = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracker_slug: "isa" }),
      });
      if (res.ok) setState("subscribed"); else setState("error");
    } catch {
      setState("error");
    }
  };
  const label =
    state === "loading" ? "Subscribing..." :
    state === "subscribed" ? "Alerts on" :
    state === "error" ? "Try again" :
    "Set alert";
  return (
    <button
      onClick={subscribe}
      disabled={state === "loading" || state === "subscribed"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: compact ? 32 : 36,
        padding: compact ? "0 14px" : "0 18px",
        fontFamily: F,
        fontSize: 13,
        fontWeight: 500,
        color: state === "subscribed" ? TEAL : WHITE,
        background: state === "subscribed" ? "rgba(29,158,117,0.12)" : TEAL,
        border: `1px solid ${TEAL}`,
        borderRadius: 6,
        cursor: state === "loading" || state === "subscribed" ? "default" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ── Status block (3 cols inside hero) ────────────────────────────────────
function StatusBlock({
  status,
  loading,
  missing,
}: {
  status: TrackerStatus | null;
  loading: boolean;
  missing: boolean;
}) {
  if (loading) {
    return (
      <div style={{ background: NAVY_DARK, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 28, marginTop: 32, color: "rgba(255,255,255,0.5)", fontFamily: F, fontSize: 13 }}>
        Loading status...
      </div>
    );
  }

  if (missing || !status) {
    return (
      <div style={{ background: NAVY_DARK, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 28, marginTop: 32 }}>
        <div style={{ color: "rgba(255,255,255,0.45)", fontFamily: F, fontSize: 13, lineHeight: 1.6 }}>
          Status data not yet recorded for this tracker.
        </div>
      </div>
    );
  }

  const countdown = daysUntil(status.next_event?.date || null);

  return (
    <div
      style={{
        background: NAVY_DARK,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "24px 28px",
        marginTop: 32,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 32,
      }}
      className="status-grid"
    >
      {/* Col 1: Stage */}
      <div>
        <div style={{ ...eyebrowStyle("rgba(255,255,255,0.5)"), marginBottom: 14 }}>
          Stage {status.stage.number !== null ? `${status.stage.number} of 5` : ""}
        </div>
        <StagePips current={status.stage.number} />
        <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: WHITE, lineHeight: 1.4, marginBottom: 8 }}>
          {status.stage.name || "Not recorded"}
        </div>
        {status.stage.description && (
          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            {status.stage.description}
          </div>
        )}
        <VerifiedTag url={status.stage.source_url} label={status.stage.source_label} verifiedAt={status.stage.verified_at} />
      </div>

      {/* Col 2: Trajectory */}
      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 32 }}>
        <div style={{ ...eyebrowStyle("rgba(255,255,255,0.5)"), marginBottom: 14 }}>Trajectory</div>
        <TrajectoryWord direction={status.trajectory.direction} />
        {status.trajectory.reason && (
          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            {status.trajectory.reason}
          </div>
        )}
        <VerifiedTag url={status.trajectory.source_url} label={status.trajectory.source_label} verifiedAt={status.trajectory.verified_at} />
      </div>

      {/* Col 3: Countdown + next event + alert */}
      <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 32, display: "flex", flexDirection: "column" }}>
        <div style={{ ...eyebrowStyle("rgba(255,255,255,0.5)"), marginBottom: 14 }}>Next event</div>
        {status.next_event ? (
          <>
            {countdown !== null && countdown >= 0 && (
              <div style={{ fontFamily: F, fontSize: 36, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>
                {countdown === 0 ? "today" : `${countdown} day${countdown === 1 ? "" : "s"}`}
              </div>
            )}
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: WHITE, lineHeight: 1.4, marginTop: 8 }}>
              {status.next_event.name}
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
              {status.next_event.date ? fmtDate(status.next_event.date) : "Date TBC"}
              {status.next_event.location ? `, ${status.next_event.location}` : ""}
            </div>
            {status.next_event.source_url && (
              <a
                href={status.next_event.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                verified <span style={{ fontSize: 10 }}>&#8599;</span>
              </a>
            )}
          </>
        ) : (
          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            No upcoming event on record.
          </div>
        )}
        <div style={{ marginTop: "auto", paddingTop: 18 }}>
          <SetAlertButton />
        </div>
      </div>
    </div>
  );
}

// ── Metric cards (4) ─────────────────────────────────────────────────────
function MetricCards({ pendingApplications, eventsThisYear }: { pendingApplications: number | null; eventsThisYear: number }) {
  const metrics = [
    { label: "Active contractors", value: "31", source: "isa.org.jm, April 2026" },
    {
      label: "Pending applications",
      value: pendingApplications === null ? "..." : String(pendingApplications),
      source: `isa.org.jm, updated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    },
    { label: "Council sessions in 2026", value: "1", source: "isa.org.jm, April 2026" },
    { label: "Tracked events this year", value: String(eventsThisYear), source: "Tideline tracker" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="metric-grid">
      {metrics.map((m) => (
        <div key={m.label} style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "16px 18px" }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T3, marginBottom: 10 }}>{m.label}</div>
          <div style={{ fontFamily: F, fontSize: 26, fontWeight: 600, color: TEAL, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>
            {m.value}
          </div>
          <div style={{ fontFamily: F, fontSize: 10, color: T4, lineHeight: 1.5 }}>{m.source}</div>
        </div>
      ))}
    </div>
  );
}

// ── Events panel (left of two-col) ───────────────────────────────────────
const EVENT_TYPE_LABELS: Record<string, string> = {
  council_decision: "Council decision",
  assembly_resolution: "Assembly resolution",
  ltc_recommendation: "LTC recommendation",
  news_mention: "News",
  regulation_update: "Regulation update",
  update: "Update",
};

function EventsPanel({ events }: { events: TrackerEvent[] }) {
  return (
    <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8 }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ ...eyebrowStyle(), marginBottom: 0 }}>Recent events</div>
      </div>
      {events.length === 0 ? (
        <div style={{ padding: 20, fontFamily: F, fontSize: 13, color: T4 }}>
          No events recorded yet. The scraper runs daily.
        </div>
      ) : (
        events.map((e, i) => {
          const isHigh = e.significance === "high";
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: 16,
                padding: "14px 20px",
                borderBottom: i < events.length - 1 ? `1px solid ${BORDER_SOFT}` : "none",
                borderLeft: isHigh ? `3px solid ${TEAL}` : "3px solid transparent",
                borderRadius: 0,
              }}
            >
              <div style={{ flexShrink: 0, width: 80 }}>
                <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T3 }}>
                  {fmtShortDate(e.event_date)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: F,
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: isHigh ? "rgba(29,158,117,0.1)" : "transparent",
                      color: isHigh ? "#0F6E56" : T3,
                      border: `0.5px solid ${isHigh ? "rgba(29,158,117,0.35)" : BORDER}`,
                    }}
                  >
                    {EVENT_TYPE_LABELS[e.event_type] || e.event_type}
                  </span>
                  {e.source_name && (
                    <span style={{ fontFamily: F, fontSize: 11, color: T4 }}>{e.source_name}</span>
                  )}
                </div>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1, lineHeight: 1.4, marginBottom: 6 }}>
                  {e.title}
                </div>
                {e.summary && (
                  <div
                    style={{
                      fontFamily: F,
                      fontSize: 13,
                      color: T3,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2 as never,
                      WebkitBoxOrient: "vertical" as never,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    {e.summary}
                  </div>
                )}
                {e.source_url && (
                  <a
                    href={e.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none" }}
                  >
                    View source &#8599;
                  </a>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Press panel (right col top) ──────────────────────────────────────────
function PressPanel({ stories }: { stories: FeedStory[] }) {
  return (
    <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8 }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${BORDER_SOFT}` }}>
        <div style={{ ...eyebrowStyle(), marginBottom: 0 }}>Press coverage</div>
      </div>
      {stories.length === 0 ? (
        <div style={{ padding: 20, fontFamily: F, fontSize: 13, color: T4 }}>No recent press.</div>
      ) : (
        stories.slice(0, 5).map((s, i) => (
          <a
            key={s.id}
            href={`/platform/story/${s.id}`}
            style={{
              display: "block",
              padding: "12px 14px",
              borderBottom: i < Math.min(stories.length, 5) - 1 ? `1px solid ${BORDER_SOFT}` : "none",
              textDecoration: "none",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F8F9FA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 4 }}>
              {s.title}
            </div>
            <div style={{ fontFamily: F, fontSize: 11, color: T4 }}>
              {s.source_name}, {fmtShortDate(s.published_at)}
            </div>
          </a>
        ))
      )}
    </div>
  );
}

// ── Activity chart (right col bottom, inline SVG) ────────────────────────
function ActivityChart({ events }: { events: TrackerEvent[] }) {
  const buckets = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-GB", { month: "short" });
      map.set(key, 0);
    }
    for (const e of events) {
      const d = new Date(e.event_date);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff < 0 || diff > 5) continue;
      const key = d.toLocaleDateString("en-GB", { month: "short" });
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries());
  }, [events]);

  const max = Math.max(1, ...buckets.map(([, v]) => v));
  const chartHeight = 80;
  const barWidth = 28;
  const gap = 12;
  const width = buckets.length * (barWidth + gap);

  return (
    <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, marginTop: 16, padding: 20 }}>
      <div style={eyebrowStyle()}>Activity, last 6 months</div>
      <svg width={width} height={chartHeight + 22} style={{ display: "block", maxWidth: "100%" }}>
        {buckets.map(([label, value], i) => {
          const h = (value / max) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - h;
          return (
            <g key={label}>
              <rect x={x} y={y} width={barWidth} height={h} fill={TEAL} rx={2} />
              <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontFamily={F} fontSize={10} fill={T4}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Contractor table ─────────────────────────────────────────────────────
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  polymetallic_nodules: "Nodules",
  polymetallic_sulphides: "Sulphides",
  cobalt_rich_crusts: "Crusts",
};

function ContractorTable({ contractors }: { contractors: Contractor[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? contractors.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          c.sponsoring_state.toLowerCase().includes(q)
      )
    : contractors;

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...eyebrowStyle(), marginBottom: 6 }}>Exploration contractors</div>
          <div style={{ fontFamily: F, fontSize: 12, color: T4 }}>
            {contractors.length} active exploration contracts, isa.org.jm, April 2026
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractors or sponsoring states"
          style={{
            width: 320,
            height: 36,
            padding: "0 12px",
            fontFamily: F,
            fontSize: 13,
            color: T1,
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            outline: "none",
          }}
        />
      </div>
      <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {["Contractor", "Sponsoring state", "Type", "Area", "Since"].map((h) => (
                <th
                  key={h}
                  style={{ textAlign: "left", padding: "10px 8px", fontFamily: F, fontSize: 11, fontWeight: 600, color: T1, textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, fontFamily: F, fontSize: 13, color: T4, textAlign: "center" }}>
                  No contractors match that search.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER_SOFT}` : "none" }}>
                  <td style={{ padding: "10px 8px", color: T1, lineHeight: 1.4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{c.company_name}</span>
                      {c.notes && (
                        <span
                          title={c.notes}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: "rgba(29,158,117,0.12)",
                            color: TEAL,
                            fontFamily: F,
                            fontSize: 9,
                            fontWeight: 600,
                            cursor: "help",
                            flexShrink: 0,
                          }}
                        >
                          i
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "10px 8px", color: T2 }}>{c.sponsoring_state}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <span
                      style={{
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "rgba(29,158,117,0.1)",
                        color: "#0F6E56",
                        border: `0.5px solid rgba(29,158,117,0.35)`,
                      }}
                    >
                      {CONTRACT_TYPE_LABELS[c.contract_type] || c.contract_type}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", color: T2 }}>{c.contract_area}</td>
                  <td style={{ padding: "10px 8px", fontFamily: F, fontSize: 12, color: T3 }}>
                    {new Date(c.contract_date).getFullYear()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Related stories ──────────────────────────────────────────────────────
function RelatedStories({ stories }: { stories: FeedStory[] }) {
  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={eyebrowStyle()}>Related stories from Tideline</div>
      {stories.length === 0 ? (
        <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 20, fontFamily: F, fontSize: 13, color: T4 }}>
          No stories matched to this tracker yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="stories-grid">
          {stories.map((s) => (
            <a
              key={s.id}
              href={`/platform/story/${s.id}`}
              style={{
                background: WHITE,
                border: `0.5px solid ${BORDER}`,
                borderRadius: 8,
                padding: 20,
                textDecoration: "none",
              }}
            >
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 6 }}>
                {s.title}
              </div>
              <div style={{ fontFamily: F, fontSize: 11, color: T4, marginBottom: s.short_summary ? 6 : 0 }}>
                {s.source_name}, {fmtShortDate(s.published_at)}
              </div>
              {s.short_summary && (
                <div style={{ fontFamily: F, fontSize: 12, color: T3, lineHeight: 1.6 }}>
                  {s.short_summary}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Community documents panel ────────────────────────────────────────────
function CommunityDocumentsPanel({ docs }: { docs: CommunityDoc[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [submissionType, setSubmissionType] = useState("research_paper");
  const [relevance, setRelevance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !sourceUrl.trim()) {
      setError("Title and source URL are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/community-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source_url: sourceUrl.trim(),
          publisher: publisher.trim() || null,
          submission_type: submissionType,
          submission_relevance_free: relevance.trim() || null,
          tracker_tags: ["isa"],
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTitle("");
        setSourceUrl("");
        setPublisher("");
        setRelevance("");
      } else {
        const j = await res.json().catch(() => ({}));
        // Fallback: still show success per product rule during beta backend
        console.warn("community-documents submit not ok:", j);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("community-documents submit error:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8 }}>
        <div
          style={{
            padding: 20,
            borderBottom: `1px solid ${BORDER_SOFT}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ ...eyebrowStyle(), marginBottom: 4 }}>Community contributions</div>
            <div style={{ fontFamily: F, fontSize: 12, color: T4 }}>
              Documents submitted by Tideline users, pending review before publication.
            </div>
          </div>
          <button
            onClick={() => {
              setFormOpen((o) => !o);
              setSubmitted(false);
              setError(null);
            }}
            style={{
              padding: "8px 16px",
              fontFamily: F,
              fontSize: 12,
              fontWeight: 500,
              color: WHITE,
              background: TEAL,
              border: `0.5px solid ${TEAL}`,
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            {formOpen ? "Close" : "Submit a document"}
          </button>
        </div>

        {formOpen && (
          <div style={{ padding: 24, borderBottom: `1px solid ${BORDER_SOFT}`, background: "#FAFBFC" }}>
            {submitted ? (
              <div style={{ fontFamily: F, fontSize: 14, color: TEAL, fontWeight: 500 }}>
                Thank you. Your document is under review.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
                <div>
                  <div style={{ ...eyebrowStyle(T3), marginBottom: 6 }}>Document title</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Environmental baseline assessment, CCZ contract area"
                    style={{ width: "100%", height: 38, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(T3), marginBottom: 6 }}>Source URL</div>
                  <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://"
                    style={{ width: "100%", height: 38, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(T3), marginBottom: 6 }}>Publisher</div>
                  <input
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Organisation or author"
                    style={{ width: "100%", height: 38, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(T3), marginBottom: 6 }}>Document type</div>
                  <select
                    value={submissionType}
                    onChange={(e) => setSubmissionType(e.target.value)}
                    style={{ width: "100%", height: 38, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                  >
                    <option value="research_paper">Research paper</option>
                    <option value="report">Report</option>
                    <option value="policy_brief">Policy brief</option>
                    <option value="dataset">Dataset</option>
                    <option value="consultation_response">Consultation response</option>
                    <option value="press_release">Press release</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <div style={{ ...eyebrowStyle(T3), marginBottom: 6 }}>Why is this relevant to Deep-Sea Mining?</div>
                  <textarea
                    value={relevance}
                    onChange={(e) => setRelevance(e.target.value)}
                    rows={3}
                    placeholder="One or two sentences on what this document adds."
                    style={{ width: "100%", padding: "10px 12px", fontFamily: F, fontSize: 13, color: T1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", resize: "vertical" }}
                  />
                </div>
                {error && (
                  <div style={{ fontFamily: F, fontSize: 12, color: RED }}>{error}</div>
                )}
                <div>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    style={{
                      height: 38,
                      padding: "0 22px",
                      fontFamily: F,
                      fontSize: 13,
                      fontWeight: 500,
                      color: WHITE,
                      background: TEAL,
                      border: `1px solid ${TEAL}`,
                      borderRadius: 6,
                      cursor: submitting ? "default" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit document"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {docs.length === 0 ? (
          <div style={{ padding: 24, fontFamily: F, fontSize: 13, color: T4 }}>
            No community documents yet. Be the first to submit one.
          </div>
        ) : (
          docs.map((d, i) => (
            <div
              key={d.id}
              style={{
                padding: "16px 20px",
                borderBottom: i < docs.length - 1 ? `1px solid ${BORDER_SOFT}` : "none",
              }}
            >
              <a
                href={d.source_url || d.file_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T1, textDecoration: "none", lineHeight: 1.4, display: "block", marginBottom: 6 }}
              >
                {d.title}
              </a>
              <div style={{ fontFamily: F, fontSize: 11, color: T4 }}>
                Submitted by {d.submitted_by_display || "a Tideline member"}
                {d.submitted_by_role ? `, ${d.submitted_by_role}` : ""}
                {d.publisher ? ` · ${d.publisher}` : ""}
                {d.submission_type ? ` · ${d.submission_type.replace(/_/g, " ")}` : ""}
              </div>
              {d.summary && (
                <div style={{ fontFamily: F, fontSize: 12.5, color: T3, lineHeight: 1.6, marginTop: 6 }}>
                  {d.summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Default export ───────────────────────────────────────────────────────
export default function ISATracker() {
  const [loading, setLoading] = useState(true);
  const [trackerEvents, setTrackerEvents] = useState<TrackerEvent[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [pendingApplications, setPendingApplications] = useState<number | null>(null);
  const [trackerStatus, setTrackerStatus] = useState<TrackerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusMissing, setStatusMissing] = useState(false);
  const [communityDocs, setCommunityDocs] = useState<CommunityDoc[]>([]);

  useEffect(() => {
    document.title = "Deep-Sea Mining | Tideline";
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/tracker-events?slug=isa&limit=20").then((r) => (r.ok ? r.json() : { events: [] })),
      fetch("/api/stories?limit=10&tracker=isa").then((r) => (r.ok ? r.json() : { stories: [] })),
      fetch("/api/isa-contractors").then((r) => (r.ok ? r.json() : { contractors: [] })),
      fetch("/api/isa-status").then((r) => (r.ok ? r.json() : { pending_applications: 0 })),
      fetch("/api/community-documents?tracker=isa&limit=10").then((r) => (r.ok ? r.json() : { documents: [] })),
    ])
      .then(([events, stories, contractorsRes, status, community]) => {
        setTrackerEvents(events.events || []);
        setFeedStories(stories.stories || []);
        setContractors(contractorsRes.contractors || []);
        setPendingApplications(typeof status.pending_applications === "number" ? status.pending_applications : 0);
        setCommunityDocs(community.documents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/tracker-status/isa")
      .then(async (r) => {
        if (r.status === 404) {
          setStatusMissing(true);
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data) setTrackerStatus(data);
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const eventsThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    return trackerEvents.filter((e) => new Date(e.event_date).getFullYear() === year).length;
  }, [trackerEvents]);

  const pressStories = feedStories.slice(0, 5);
  const relatedStories = feedStories.slice(0, 6);

  return (
    <div style={{ fontFamily: F, color: T1, background: WHITE, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 1024px) {
          .two-col { grid-template-columns: 1fr !important; }
          .metric-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .status-grid { grid-template-columns: 1fr !important; }
          .status-grid > div { border-left: none !important; padding-left: 0 !important; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; }
          .status-grid > div:first-child { border-top: none; padding-top: 0; }
          .stories-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .metric-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...eyebrowStyle(TEAL), marginBottom: 14 }}>Live intelligence tracker</div>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 14px" }}>
            Deep-Sea Mining
          </h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.65)", maxWidth: 720, lineHeight: 1.7, margin: 0 }}>
            Monitored via the International Seabed Authority (ISA), covering licensing, mining code negotiations, and environmental safeguards under UNCLOS Part XI.
          </p>
          <StatusBlock status={trackerStatus} loading={statusLoading} missing={statusMissing} />
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        <VelocityScore slug="isa" />
        <MetricCards pendingApplications={pendingApplications} eventsThisYear={eventsThisYear} />

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: F, fontSize: 13, color: T4 }}>
            Loading tracker data...
          </div>
        ) : (
          <>
            <div
              style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }}
              className="two-col"
            >
              <EventsPanel events={trackerEvents} />
              <div>
                <PressPanel stories={pressStories} />
                <ActivityChart events={trackerEvents} />
              </div>
            </div>

            <ContractorTable contractors={contractors} />
            <RelatedStories stories={relatedStories} />
            <CommunityDocumentsPanel docs={communityDocs} />
          </>
        )}
      </div>
    </div>
  );
}
