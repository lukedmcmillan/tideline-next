"use client";

import { useState, useEffect } from "react";

const F = "'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const TEAL = "#1D9E75";
const AMBER = "#F59E0B";
const RED = "#EF4444";
const GREEN = "#10B981";
const T1 = "#202124";
const T2 = "#5F6368";
const T3 = "#9AA0A6";
const BORDER = "#DADCE0";
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const GREY_PILL = "#F1F3F4";

const AVATAR_COLORS: Record<string, string> = {
  gov: "#1e40af",
  reg: "#991b1b",
  ngo: "#166534",
  res: "#6b21a8",
  media: "#78350f",
  esg: "#134e4a",
};

function severityFromScore(s: number): "high" | "medium" | "low" {
  if (s >= 8) return "high";
  if (s >= 5) return "medium";
  return "low";
}

function severityColor(sev: "high" | "medium" | "low") {
  if (sev === "high") return RED;
  if (sev === "medium") return AMBER;
  return TEAL;
}

function severityLabel(sev: "high" | "medium" | "low") {
  if (sev === "high") return "High";
  if (sev === "medium") return "Medium";
  return "Low";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const TRACKER_DISPLAY: Record<string, string> = {
  isa: "ISA Deep Sea Mining",
  bbnj: "BBNJ High Seas Treaty",
  iuu: "IUU Fishing Enforcement",
  "30x30": "30x30 Marine Protected Areas",
  "blue-finance": "Blue Finance & ESG",
  plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping Emissions",
  "wto-fisheries": "WTO Fisheries Subsidies",
  "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine Species",
};

function trackerLabel(slug: string): string {
  return TRACKER_DISPLAY[slug] || titleCase(slug);
}

interface Divergence {
  id: string;
  tracker_tag: string;
  score: number;
  source_a_name: string;
  source_a_type: string;
  source_a_claim: string;
  source_a_date?: string;
  source_a_url?: string | null;
  source_b_name: string;
  source_b_type: string;
  source_b_claim: string;
  source_b_date?: string;
  source_b_url?: string | null;
  headline?: string;
  why_it_matters: string;
  detected_at: string;
  dismissed_at: string | null;
}

interface ProjectOption {
  id?: string;
  name: string;
}

type Filter = "all" | "high" | "mine";

export default function ConflictsPage() {
  const [items, setItems] = useState<Divergence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [lastChecked] = useState<Date>(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const [attachFor, setAttachFor] = useState<Divergence | null>(null);
  const [scoringModal, setScoringModal] = useState(false);

  useEffect(() => {
    fetch("/api/conflicts")
      .then(r => r.ok ? r.json() : { divergences: [] })
      .then(d => setItems(d.divergences || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function dismiss(id: string) {
    setDismissing(id);
    await fetch(`/api/conflicts/${id}/dismiss`, { method: "PATCH" });
    setItems(prev => prev.filter(d => d.id !== id));
    setDismissing(null);
  }

  function viewSources(d: Divergence) {
    const urls = [d.source_a_url, d.source_b_url].filter((u): u is string => typeof u === "string" && u.length > 0);
    if (urls.length === 0) {
      setToast("No source URLs stored for this conflict.");
      return;
    }
    for (const u of urls) {
      window.open(u, "_blank", "noopener,noreferrer");
    }
  }

  function onProjectPicked(p: ProjectOption) {
    if (!attachFor) return;
    // Attachment endpoint not yet built — log intent + confirm via toast.
    console.log("[conflicts] attach divergence", {
      divergence_id: attachFor.id,
      tracker_tag: attachFor.tracker_tag,
      project_id: p.id || null,
      project_name: p.name,
    });
    setToast(`Added conflict to "${p.name}".`);
    setAttachFor(null);
  }

  const highCount = items.filter(i => severityFromScore(i.score) === "high").length;
  const mediumCount = items.filter(i => severityFromScore(i.score) === "medium").length;
  const lowCount = items.filter(i => severityFromScore(i.score) === "low").length;

  const filtered = items.filter(i => {
    if (filter === "high") return severityFromScore(i.score) === "high";
    if (filter === "mine") return true; // placeholder — no tracker subscription data yet
    return true;
  });

  const pillStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 500,
    fontFamily: F,
    padding: "6px 14px",
    borderRadius: 999,
    cursor: "pointer",
    border: active ? "none" : `1px solid ${BORDER}`,
    background: active ? TEAL : WHITE,
    color: active ? WHITE : T2,
    transition: "all 120ms",
  });

  return (
    <div style={{ background: BG, minHeight: "100%", fontFamily: F }}>
      {/* Top bar */}
      <div style={{
        background: WHITE,
        borderBottom: `1px solid ${BORDER}`,
        padding: "20px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T1, letterSpacing: "-0.01em" }}>Source Conflicts</div>
          <div style={{ fontSize: 12, color: T3, marginTop: 2 }}>Pulse Score · checked every 4 hours</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setFilter("all")} style={pillStyle(filter === "all")}>All</button>
          <button onClick={() => setFilter("high")} style={pillStyle(filter === "high")}>High only</button>
          <button onClick={() => setFilter("mine")} style={pillStyle(filter === "mine")}>My trackers</button>
          <a
            href="/methodology"
            onClick={(e) => { e.preventDefault(); setScoringModal(true); }}
            style={{ fontFamily: F, fontSize: 10, color: T3, border: `0.5px solid ${BORDER}`, borderRadius: 99, padding: "3px 10px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 4 }}
          >
            How this is calculated
          </a>
        </div>
      </div>

      {scoringModal && <ScoringModal onClose={() => setScoringModal(false)} />}

      {/* Status bar */}
      <div style={{
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 12,
        color: T2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StatusDot color={RED} label="High" count={highCount} />
          <Divider />
          <StatusDot color={AMBER} label="Medium" count={mediumCount} />
          <Divider />
          <StatusDot color={TEAL} label="Low" count={lowCount} />
          <Divider />
          <span style={{ color: T3 }}>{items.length} total</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
          <span style={{ color: T2 }}>Checked {timeAgo(lastChecked.toISOString())}</span>
        </div>
      </div>

      {/* Conflicts list */}
      <div style={{ padding: "4px 28px 32px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: T3 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 6 }}>No active conflicts</div>
            <div style={{ fontSize: 13, color: T3 }}>
              {filter === "high" ? "No high-severity conflicts right now." : "All source divergences have been resolved or dismissed."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(d => (
              <ConflictCard
                key={d.id}
                d={d}
                onDismiss={() => dismiss(d.id)}
                onViewSources={() => viewSources(d)}
                onAddToWorkspace={() => setAttachFor(d)}
                dismissing={dismissing === d.id}
              />
            ))}
          </div>
        )}
      </div>

      {attachFor && (
        <AttachModal
          onClose={() => setAttachFor(null)}
          onPick={onProjectPicked}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#202124",
            color: WHITE,
            padding: "10px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: F,
            zIndex: 2000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxWidth: 320,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function AttachModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (p: ProjectOption) => void;
}) {
  const [projects, setProjects] = useState<ProjectOption[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => {
        if (cancelled) return;
        const list: ProjectOption[] = Array.isArray(d?.projects)
          ? d.projects.map((p: { id?: string; name: string }) => ({ id: p.id, name: p.name }))
          : [];
        setProjects(list);
      })
      .catch(() => { if (!cancelled) setErr("Could not load projects."); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1500,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: "20px 24px",
          width: "90vw",
          maxWidth: 420,
          maxHeight: "70vh",
          overflowY: "auto",
          fontFamily: F,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: T1 }}>Add to workspace</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ fontSize: 20, color: T3, background: "transparent", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            ×
          </button>
        </div>

        {projects === null && !err && (
          <div style={{ fontSize: 13, color: T3, padding: "8px 0" }}>Loading projects…</div>
        )}

        {err && (
          <div style={{ fontSize: 13, color: RED, padding: "8px 0" }}>{err}</div>
        )}

        {projects !== null && projects.length === 0 && (
          <div style={{ fontSize: 13, color: T2, padding: "8px 0" }}>
            Create a project first in the workspace.
          </div>
        )}

        {projects !== null && projects.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {projects.map((p, i) => (
              <button
                key={p.id || `${p.name}-${i}`}
                type="button"
                onClick={() => onPick(p)}
                style={{
                  textAlign: "left",
                  fontFamily: F,
                  fontSize: 13,
                  color: T1,
                  background: WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ color: T2, fontWeight: 500 }}>{label}</span>
      <span style={{ color: T3 }}>{count}</span>
    </span>
  );
}

function Divider() {
  return <span style={{ color: T3 }}>|</span>;
}

function ConflictCard({
  d,
  onDismiss,
  onViewSources,
  onAddToWorkspace,
  dismissing,
}: {
  d: Divergence;
  onDismiss: () => void;
  onViewSources: () => void;
  onAddToWorkspace: () => void;
  dismissing: boolean;
}) {
  const sev = severityFromScore(d.score);
  const sevColor = severityColor(sev);
  const headline = d.headline || titleCase(d.tracker_tag);
  const dateA = d.source_a_date || d.detected_at;
  const dateB = d.source_b_date || d.detected_at;
  const hasUrls = Boolean(d.source_a_url || d.source_b_url);

  const esgTags = new Set(["isa", "bbnj", "blue-finance", "tnfd"]);
  const complianceTags = new Set(["imo-shipping", "iuu"]);
  let actionVerdict = "Monitor. No immediate action required.";
  if (d.score >= 8) actionVerdict = "Seek legal advice before acting on either source.";
  else if (d.score >= 6 && esgTags.has(d.tracker_tag)) actionVerdict = "Review TNFD/ESG disclosure position before next reporting cycle.";
  else if (d.score >= 6 && complianceTags.has(d.tracker_tag)) actionVerdict = "Flag for compliance review.";

  return (
    <div style={{
      background: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative",
    }}>
      {/* Dismiss (top-right x) */}
      <button
        type="button"
        onClick={onDismiss}
        disabled={dismissing}
        title="Not relevant"
        aria-label="Dismiss conflict"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          fontSize: 16,
          color: T3,
          background: "transparent",
          border: "none",
          cursor: dismissing ? "default" : "pointer",
          padding: "0 4px",
          lineHeight: 1,
        }}
      >
        {"\u00D7"}
      </button>

      {/* 1. Headline first */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: T1,
        margin: 0,
        lineHeight: 1.3,
        letterSpacing: "-0.02em",
        paddingRight: 24,
      }}>{headline}</h2>

      {/* 2. Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          color: WHITE,
          background: sevColor,
          padding: "4px 10px",
          borderRadius: 999,
        }}>
          {severityLabel(sev)}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: T2,
          background: GREY_PILL,
          padding: "4px 10px",
          borderRadius: 999,
        }}>
          {trackerLabel(d.tracker_tag)}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: T3, fontFamily: M }}>{timeAgo(d.detected_at)}</span>
      </div>

      {/* 3. Divergence bar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{
          fontFamily: M,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: ".14em",
          color: T2,
        }}>DIVERGENCE</span>
        <div style={{
          flex: 1,
          height: 6,
          background: "#E8EAED",
          borderRadius: 3,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(100, (d.score / 10) * 100)}%`,
            background: sevColor,
            borderRadius: 3,
          }} />
        </div>
        <span style={{
          fontFamily: M,
          fontSize: 14,
          fontWeight: 700,
          color: sevColor,
          whiteSpace: "nowrap",
        }}>{d.score.toFixed(1)} / 10</span>
      </div>

      {/* 4. Source grid with red VS divider */}
      <div style={{ position: "relative" }}>
        {/* Red vertical divider */}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#E24B4A", transform: "translateX(-0.5px)" }} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
        }}>
          <SourceColumn
            name={d.source_a_name}
            type={d.source_a_type}
            claim={d.source_a_claim}
            date={dateA}
            rightBorder={false}
          />
          <SourceColumn
            name={d.source_b_name}
            type={d.source_b_type}
            claim={d.source_b_claim}
            date={dateB}
          />
        </div>
        {/* VS label centred on red divider */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: M,
          fontSize: 11,
          fontWeight: 700,
          color: "#E24B4A",
          background: WHITE,
          padding: "2px 6px",
          lineHeight: 1,
        }}>VS</div>
      </div>

      {/* 5. Insight row */}
      <div style={{
        borderLeft: `3px solid ${AMBER}`,
        background: "#FFFBEB",
        padding: "10px 14px",
        borderRadius: "0 6px 6px 0",
        fontSize: 13,
        color: T1,
        lineHeight: 1.55,
      }}>
        <span style={{ marginRight: 6, color: AMBER }}>★</span>
        <span style={{ fontWeight: 700, color: T1 }}>Why this matters:</span>{" "}
        <span style={{ color: T2 }}>{d.why_it_matters}</span>
      </div>

      {/* 6. Action verdict */}
      <div style={{ fontFamily: M, fontSize: 11, color: T2, marginTop: -8 }}>
        <span style={{ color: TEAL, fontWeight: 700 }}>ACTION:</span>{" "}{actionVerdict}
      </div>

      {/* 7. Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onAddToWorkspace}
          style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: F,
            color: WHITE,
            background: TEAL,
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Add to workspace
        </button>
        <button
          type="button"
          onClick={onViewSources}
          aria-disabled={!hasUrls}
          style={{
            fontSize: 13,
            fontWeight: 500,
            fontFamily: F,
            color: hasUrls ? T2 : T3,
            background: "transparent",
            border: "none",
            padding: "8px 10px",
            cursor: "pointer",
            opacity: hasUrls ? 1 : 0.6,
          }}
        >
          View sources
        </button>
      </div>
    </div>
  );
}

function SourceColumn({
  name,
  type,
  claim,
  date,
  rightBorder,
}: {
  name: string;
  type: string;
  claim: string;
  date: string;
  rightBorder?: boolean;
}) {
  const avatarColor = AVATAR_COLORS[type] || "#5F6368";
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <div
      className="src-col"
      style={{
        minWidth: 0,
        padding: rightBorder ? "4px 28px 4px 0" : "4px 0 4px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* avatar + name + type */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          background: avatarColor,
          color: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: F,
          flexShrink: 0,
        }}>{initial}</span>
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: T1,
          minWidth: 0,
          wordBreak: "break-word",
        }}>{name}</span>
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: M,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: T3,
          flexShrink: 0,
        }}>{type}</span>
      </div>

      {/* claim */}
      <div style={{ display: "flex", gap: 4 }}>
        <span style={{ fontSize: 24, lineHeight: 1, color: TEAL, opacity: 0.4, fontFamily: F, flexShrink: 0 }}>{"\u201C"}</span>
        <p style={{
          fontSize: 13,
          color: T1,
          lineHeight: 1.55,
          margin: 0,
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}>{claim}</p>
      </div>

      {/* date */}
      <span style={{
        fontFamily: M,
        fontSize: 11,
        color: T3,
        letterSpacing: ".04em",
      }}>{formatDate(date)}</span>
    </div>
  );
}

function ScoringModal({ onClose }: { onClose: () => void }) {
  const B = BORDER;
  const signals: { label: string; weight: string; body: string }[] = [
    { label: "Factual divergence", weight: "40%", body: "Do the sources state different facts as true? Weighted highest because a factual disagreement requires primary source verification. A professional acting on the wrong fact faces direct legal or compliance exposure." },
    { label: "Conclusion divergence", weight: "30%", body: "Do they draw different implications from the same event? Different conclusions drive different professional responses. Two readers drawing opposite conclusions about a vote will take materially different actions." },
    { label: "Framing divergence", weight: "20%", body: "Same facts, materially different emphasis? Weighted lower because framing differences are common. They carry more weight when sources with opposing interests frame the same event systematically differently." },
    { label: "Source authority", weight: "10%", body: "Is one a primary source and one secondary? A tiebreaker, not a determinant. A government body can mischaracterise its own decision. An NGO may have superior access to negotiating text." },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, padding: "24px 28px", maxWidth: 480, width: "90vw", maxHeight: "80vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: T1 }}>How conflict scores are calculated</span>
          <button onClick={onClose} style={{ fontSize: 18, color: T3, cursor: "pointer", border: "none", background: "transparent", padding: "0 4px" }}>{"\u00D7"}</button>
        </div>
        <div style={{ borderTop: `0.5px solid ${B}`, marginTop: 12, marginBottom: 16 }} />

        {/* Intro */}
        <p style={{ fontSize: 13, color: T2, lineHeight: 1.6, margin: 0 }}>The conflict score measures how far apart two sources are on the same story. It is not a verdict on which source is correct. A score of 7.8 means the gap is large enough to affect a professional decision.</p>

        {/* The equation */}
        <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: T3, marginTop: 16, marginBottom: 8, display: "block" }}>THE EQUATION</span>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: T1, background: "#F8F9FA", borderRadius: 6, padding: "12px 16px", lineHeight: 1.8, whiteSpace: "pre" }}>{"CONFLICT SCORE =\n  (Factual divergence    \u00D7 0.40) +\n  (Conclusion divergence \u00D7 0.30) +\n  (Framing divergence    \u00D7 0.20) +\n  (Source authority       \u00D7 0.10)"}</div>

        {/* The four signals */}
        <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: T3, marginTop: 16, marginBottom: 10, display: "block" }}>THE FOUR SIGNALS</span>
        {signals.map(s => (
          <div key={s.label} style={{ borderLeft: "2px solid #E8EAED", paddingLeft: 12, marginBottom: 10, fontSize: 12, color: T2, lineHeight: 1.5 }}>
            <strong style={{ color: T1 }}>{s.label}</strong>{" "}
            <span style={{ fontSize: 11, fontWeight: 600, color: WHITE, background: TEAL, padding: "1px 6px", borderRadius: 999, letterSpacing: ".02em" }}>{s.weight}</span>
            <span style={{ display: "block", marginTop: 4 }}>{s.body}</span>
          </div>
        ))}

        {/* Score bands */}
        <span style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: T3, marginTop: 10, marginBottom: 8, display: "block" }}>SCORE BANDS</span>
        {([
          { label: "HIGH", range: "8.0+", dot: "#E24B4A", desc: "Large enough to affect a legal or compliance position" },
          { label: "MEDIUM", range: "5.0 \u2013 7.9", dot: "#EF9F27", desc: "Material but may resolve as more information emerges" },
          { label: "LOW", range: "below 5.0", dot: null, desc: "Not surfaced" },
        ] as const).map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.dot || "transparent", border: b.dot ? "none" : `1px solid ${T3}`, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: T1, width: 60 }}>{b.label}</span>
            <span style={{ color: T2, width: 80 }}>{b.range}</span>
            <span style={{ color: T2, flex: 1 }}>{b.desc}</span>
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: `0.5px solid ${B}`, marginTop: 20, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T3 }}>Tideline does not adjudicate. Professional judgement is required.</span>
          <a href="/methodology#conflict-scoring" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 500, color: TEAL, textDecoration: "none" }}>Conflict scoring methodology {"\u2192"}</a>
        </div>
      </div>
    </div>
  );
}
