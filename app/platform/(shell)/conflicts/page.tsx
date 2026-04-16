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
  const [scoringExpanded, setScoringExpanded] = useState(false);

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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setFilter("all")} style={pillStyle(filter === "all")}>All</button>
          <button onClick={() => setFilter("high")} style={pillStyle(filter === "high")}>High only</button>
          <button onClick={() => setFilter("mine")} style={pillStyle(filter === "mine")}>My trackers</button>
        </div>
      </div>

      {/* How scores work */}
      <ScoringExplainer expanded={scoringExpanded} onToggle={() => setScoringExpanded(v => !v)} />

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

  return (
    <div style={{
      background: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: 10,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* 1. Meta row */}
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
          {titleCase(d.tracker_tag)}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: T3, fontFamily: M }}>{timeAgo(d.detected_at)}</span>
      </div>

      {/* 2. Divergence bar row */}
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

      {/* 3. Headline */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: T1,
        margin: 0,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
      }}>{headline}</h2>

      {/* 4. Source grid with vs pip */}
      <div style={{ position: "relative" }}>
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
            rightBorder
          />
          <SourceColumn
            name={d.source_b_name}
            type={d.source_b_type}
            claim={d.source_b_claim}
            date={dateB}
          />
        </div>
        {/* vs pip centred on divider */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: WHITE,
          border: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          color: T2,
          fontFamily: F,
        }}>vs</div>
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

      {/* 6. Footer */}
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
        <span style={{ flex: 1 }} />
        <button
          onClick={onDismiss}
          disabled={dismissing}
          style={{
            fontSize: 13,
            fontWeight: 500,
            fontFamily: F,
            color: T3,
            background: "transparent",
            border: "none",
            padding: "8px 4px",
            cursor: dismissing ? "default" : "pointer",
          }}
        >
          {dismissing ? "Dismissing…" : "Dismiss"}
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
        borderRight: rightBorder ? `1px solid ${BORDER}` : "none",
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
      <p style={{
        fontSize: 13,
        color: T1,
        lineHeight: 1.55,
        margin: 0,
        wordBreak: "break-word",
        whiteSpace: "normal",
      }}>{claim}</p>

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

const SCORE_ROWS: { label: string; weight: string; desc: string }[] = [
  { label: "Factual divergence", weight: "40%", desc: "Do the sources state different facts as true?" },
  { label: "Conclusion divergence", weight: "30%", desc: "Do they draw different implications from the same event?" },
  { label: "Framing divergence", weight: "20%", desc: "Same facts, materially different emphasis?" },
  { label: "Source authority", weight: "10%", desc: "Is one a primary source and one a secondary?" },
];

const BAND_ROWS: { label: string; range: string; dotColor: string | null; desc: string }[] = [
  { label: "HIGH", range: "8.0 – 10", dotColor: "#E24B4A", desc: "Large enough to affect a legal or compliance position" },
  { label: "MEDIUM", range: "5.0 – 7.9", dotColor: "#EF9F27", desc: "Material but may resolve as more information emerges" },
  { label: "LOW", range: "below 5.0", dotColor: null, desc: "Noise filtered before reaching you" },
];

const CASES: { label: string; headline: string; body: string; tags: string[] }[] = [
  {
    label: "ISA · 2019",
    headline: "Who controls the exploitation timeline?",
    body: "The ISA Secretariat indicated draft exploitation regulations were on track for 2020 adoption. A coalition of sponsoring states and the Deep Sea Conservation Coalition disputed both the timeline and the legal sufficiency of the draft. The gap persisted for four years. Contractors who treated the Secretariat position as settled overstated regulatory readiness in investor disclosures.",
    tags: ["Blue finance", "ESG reporting", "Maritime law"],
  },
  {
    label: "BBNJ · 2023",
    headline: "Was the High Seas Treaty actually agreed?",
    body: "On 4 March 2023, multiple press outlets reported the BBNJ agreement as finalised. The actual text remained in legal scrub for five months before formal adoption in June. ESG analysts citing the March date as a trigger for high-seas area-based management obligations were premature by one reporting cycle.",
    tags: ["Shipping compliance", "Blue bonds", "Conservation NGOs"],
  },
  {
    label: "IUU · 2022",
    headline: "Port state measures: headline improvement, regional deterioration",
    body: "FAO global IUU statistics showed a 15% reduction in flagged vessels. Simultaneously, three regional fisheries bodies reported increases in West African and Southeast Asian waters attributable to flag-of-convenience reclassification. Supply chain ESG assessments using only the FAO headline figure understated sourcing risk in affected regions by a material margin.",
    tags: ["Seafood supply chain", "ESG due diligence", "Port state control"],
  },
];

function ScoringExplainer({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{
      background: WHITE,
      borderBottom: `1px solid ${BORDER}`,
      fontFamily: F,
    }}>
      <style>{`
        @media (max-width: 900px) {
          .scoring-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "12px 28px",
          fontFamily: F,
          fontSize: 13,
          fontWeight: 500,
          color: T2,
        }}
      >
        <span>How are conflicts scored?</span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            transition: "transform 200ms ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: 11,
            lineHeight: 1,
            color: T3,
          }}
        >
          ▾
        </span>
      </button>

      <div
        style={{
          maxHeight: expanded ? 2000 : 0,
          overflow: "hidden",
          transition: "max-height 400ms ease",
        }}
      >
        <div
          className="scoring-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            padding: "4px 28px 24px",
          }}
        >
          {/* LEFT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T1, fontFamily: F, letterSpacing: "-0.01em" }}>
              The scoring model
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SCORE_ROWS.map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: T1, fontFamily: F }}>{r.label}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: F,
                      color: WHITE,
                      background: TEAL,
                      padding: "2px 8px",
                      borderRadius: 999,
                      letterSpacing: ".02em",
                    }}>
                      {r.weight}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: T2, fontFamily: F, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              ))}
            </div>

            <div style={{
              paddingTop: 14,
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              {BAND_ROWS.map(b => (
                <div
                  key={b.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: F,
                    fontSize: 12,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: b.dotColor || "transparent",
                      border: b.dotColor ? "none" : `1px solid ${T3}`,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 700, color: T1, width: 70, flexShrink: 0 }}>{b.label}</span>
                  <span style={{ color: T2, width: 86, flexShrink: 0 }}>{b.range}</span>
                  {b.label === "LOW" ? (
                    <span style={{
                      color: T3,
                      fontSize: 11,
                      fontWeight: 500,
                      width: 92,
                      flexShrink: 0,
                      textTransform: "lowercase",
                      letterSpacing: ".02em",
                    }}>
                      not surfaced
                    </span>
                  ) : (
                    <span style={{ width: 92, flexShrink: 0 }} />
                  )}
                  <span style={{ color: T2, flex: 1 }}>{b.desc}</span>
                </div>
              ))}
            </div>

            <div style={{
              fontFamily: M,
              fontSize: 11,
              color: T3,
              lineHeight: 1.55,
            }}>
              The score measures distance between sources, not which source is correct. Tideline does not adjudicate. Professional judgement is required.
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T1, fontFamily: F, letterSpacing: "-0.01em" }}>
              Why source conflict matters: three historical cases
            </div>

            {CASES.map(c => (
              <div
                key={c.label}
                style={{
                  background: "#0D1E35",
                  borderLeft: `3px solid ${TEAL}`,
                  padding: "14px 16px",
                  borderRadius: "0 6px 6px 0",
                  fontFamily: F,
                }}
              >
                <div style={{
                  fontFamily: M,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  color: TEAL,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}>
                  {c.label}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: WHITE,
                  lineHeight: 1.35,
                  marginBottom: 8,
                  fontFamily: F,
                }}>
                  &ldquo;{c.headline}&rdquo;
                </div>
                <div style={{
                  fontSize: 12.5,
                  color: "#B8C2CC",
                  lineHeight: 1.6,
                  marginBottom: 10,
                  fontFamily: F,
                }}>
                  {c.body}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.tags.map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 500,
                        color: "#B8C2CC",
                        border: `1px solid rgba(184, 194, 204, 0.35)`,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontFamily: F,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
