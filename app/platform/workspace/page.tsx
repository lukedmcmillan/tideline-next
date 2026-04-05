"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import IntelligenceThread from "@/components/workspace/IntelligenceThread";
import DesktopOnly from "@/components/DesktopOnly";

// ── Design tokens ────────────────────────────────────────────────────────
const BG    = "#F9FAFB";
const WHITE = "#FFFFFF";
const TEAL  = "#0E7C86";
const T1    = "#111827";
const T2    = "#374151";
const T3    = "#6B7280";
const T4    = "#9CA3AF";
const BD    = "#E5E7EB";
const R     = 4;
const F     = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M     = "var(--font-mono), 'DM Mono', monospace";

interface SourceStory { id: string; title: string; source_name: string; published_at: string; short_summary: string | null; source_type?: string }
interface AskResult { answer: string; sources?: { title: string; source_name: string; published_at: string; link: string; source_type: string; similarity: number }[] }

function decodeHtml(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&#8211;/g, "-").replace(/&#8212;/g, "\u2014").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function todayStr() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const TOPIC_MAP: Record<string, string[]> = {
  isa: ["dsm"], mining: ["dsm"], "deep-sea": ["dsm"], seabed: ["dsm"],
  bbnj: ["governance"], treaty: ["governance"], governance: ["governance"], "high seas": ["governance"],
  iuu: ["iuu"], fishing: ["iuu", "fisheries"], enforcement: ["iuu"],
  mpa: ["mpa"], "30x30": ["mpa"], protection: ["mpa"],
  finance: ["bluefinance"], bond: ["bluefinance"], investment: ["bluefinance"],
  shipping: ["shipping"], imo: ["shipping"], vessel: ["shipping"],
  climate: ["climate"],
};

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics = new Set<string>();
  for (const [key, vals] of Object.entries(TOPIC_MAP)) {
    if (lower.includes(key)) vals.forEach(v => topics.add(v));
  }
  return [...topics];
}

function isPrimary(t?: string) { return t === "gov" || t === "reg"; }

const PLACEHOLDERS: Record<string, string[]> = {
  governance: ["What changed in BBNJ ratification this week?", "Summarise the latest ISA Council session"],
  dsm: ["What is the ISA moratorium status?", "Summarise the deep-sea mining debate"],
  iuu: ["What are the latest IUU enforcement actions?", "Summarise China DWF enforcement this month"],
  bluefinance: ["What blue bonds were issued recently?", "Summarise active debt-for-nature swaps"],
};
const DEF_PH = ["What changed in ocean governance this week?", "Summarise the ISA moratorium debate"];

function getPlaceholder(topics: string[]): string {
  for (const t of topics) { if (PLACEHOLDERS[t]) return PLACEHOLDERS[t][Math.floor(Math.random() * 2)]; }
  return DEF_PH[Math.floor(Math.random() * 2)];
}

// ── Button styles ────────────────────────────────────────────────────────
const btnSec = (ov?: React.CSSProperties): React.CSSProperties => ({
  height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "0 12px", fontSize: 13, fontWeight: 500, fontFamily: F,
  border: `1px solid ${BD}`, borderRadius: R, cursor: "pointer",
  background: WHITE, color: T2, ...ov,
});

const btnPri = (ov?: React.CSSProperties): React.CSSProperties => ({
  height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "0 14px", fontSize: 13, fontWeight: 500, fontFamily: F,
  border: "none", borderRadius: R, cursor: "pointer",
  background: TEAL, color: WHITE, ...ov,
});

// ── Field schemas per project type ────────────────────────────────────────
interface FieldDef { key: string; label: string; type: "text" | "textarea" | "date" | "select"; options?: string[]; rows?: number; defaultValue?: string }

const FIELD_SCHEMAS: Record<string, FieldDef[]> = {
  situation_report: [
    { key: "topic", label: "Topic", type: "text" },
    { key: "as_of", label: "As of date", type: "date", defaultValue: new Date().toISOString().split("T")[0] },
  ],
  regulatory_watch: [
    { key: "regulation", label: "Regulation or Treaty", type: "text" },
    { key: "jurisdiction", label: "Jurisdiction", type: "text" },
    { key: "current_status", label: "Current Status", type: "text" },
    { key: "next_deadline", label: "Next Deadline", type: "date" },
  ],
  investigation: [
    { key: "subject", label: "Subject", type: "text" },
    { key: "hypothesis", label: "Hypothesis", type: "textarea", rows: 3 },
    { key: "confidence", label: "Confidence Level", type: "select", options: ["Low", "Building", "Strong"] },
  ],
  briefing_note: [
    { key: "topic", label: "Topic", type: "text" },
    { key: "prepared_for", label: "Prepared for", type: "text" },
    { key: "date", label: "Date", type: "date", defaultValue: new Date().toISOString().split("T")[0] },
    { key: "time_to_read", label: "Time to read", type: "select", options: ["2 minutes", "5 minutes", "10 minutes"] },
  ],
  deal_monitor: [
    { key: "deal_name", label: "Deal or Instrument name", type: "text" },
    { key: "parties", label: "Parties involved", type: "text" },
    { key: "deal_size", label: "Deal size", type: "text" },
    { key: "stage", label: "Current stage", type: "select", options: ["Rumoured", "Announced", "In Progress", "Closed", "Fallen Through"] },
  ],
};

// ── Field input styles ───────────────────────────────────────────────────
const fieldInput: React.CSSProperties = {
  width: "100%", height: 36, border: "none", borderBottom: "2px solid #E0E0E0",
  borderRadius: 0, fontSize: 14, fontFamily: F, color: "#202124",
  padding: "0 0 4px 0", background: "transparent", outline: "none",
};

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: F, fontSize: 12, fontWeight: 500, color: "#202124", marginBottom: 4,
};

// ── Structured fields component ──────────────────────────────────────────
function StructuredFields({ schema, fields, onChange }: {
  schema: FieldDef[];
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      {schema.map(f => (
        <div key={f.key} style={{ marginBottom: 24 }}>
          <label style={fieldLabel}>{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              value={fields[f.key] || ""}
              onChange={e => onChange(f.key, e.target.value)}
              rows={f.rows || 3}
              style={{ ...fieldInput, height: "auto", minHeight: 60, resize: "vertical", lineHeight: 1.6 }}
              onFocus={e => { (e.target as HTMLElement).style.borderBottomColor = TEAL; }}
              onBlur={e => { (e.target as HTMLElement).style.borderBottomColor = "#E0E0E0"; }}
            />
          ) : f.type === "select" ? (
            <select
              value={fields[f.key] || ""}
              onChange={e => onChange(f.key, e.target.value)}
              style={{ ...fieldInput, cursor: "pointer", appearance: "none" }}
              onFocus={e => { (e.target as HTMLElement).style.borderBottomColor = TEAL; }}
              onBlur={e => { (e.target as HTMLElement).style.borderBottomColor = "#E0E0E0"; }}
            >
              <option value="">Select...</option>
              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type === "date" ? "date" : "text"}
              value={fields[f.key] || ""}
              onChange={e => onChange(f.key, e.target.value)}
              style={fieldInput}
              onFocus={e => { (e.target as HTMLElement).style.borderBottomColor = TEAL; }}
              onBlur={e => { (e.target as HTMLElement).style.borderBottomColor = "#E0E0E0"; }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Project types ────────────────────────────────────────────────────────
const PROJECT_TYPES = [
  {
    id: "situation_report", label: "Situation Report", desc: "What is happening with a topic right now",
    icon: <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={TEAL} strokeWidth="1.5"/><line x1="10" y1="5" x2="10" y2="11" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    id: "regulatory_watch", label: "Regulatory Watch", desc: "Track developments affecting a regulation or treaty",
    icon: <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><path d="M10 2L3 7v6c0 3.5 3.5 5.5 7 8 3.5-2.5 7-4.5 7-8V7l-7-5z" stroke={TEAL} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  },
  {
    id: "investigation", label: "Investigation", desc: "Build a case file on a developing story",
    icon: <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5" stroke={TEAL} strokeWidth="1.5"/><line x1="12.5" y1="12.5" x2="17" y2="17" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    id: "briefing_note", label: "Briefing Note", desc: "Prepare to speak or present on a topic",
    icon: <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="1.5" stroke={TEAL} strokeWidth="1.5"/><line x1="7" y1="6" x2="13" y2="6" stroke={TEAL} strokeWidth="1.2"/><line x1="7" y1="9" x2="13" y2="9" stroke={TEAL} strokeWidth="1.2"/><line x1="7" y1="12" x2="11" y2="12" stroke={TEAL} strokeWidth="1.2"/></svg>,
  },
  {
    id: "deal_monitor", label: "Deal Monitor", desc: "Track a transaction or financing instrument",
    icon: <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><polyline points="3,15 7,9 11,12 17,4" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

// ── Project creation panel ───────────────────────────────────────────────
function CreateProjectPanel({ onCreate }: { onCreate: (name: string, type: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = selected && name.trim().length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    onCreate(name.trim(), selected!);
  };

  return (
    <div style={{ background: WHITE, minHeight: "100vh", padding: "32px 0 40px 48px" }}>
      <div style={{ maxWidth: 560 }}>
        {/* Heading */}
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, color: "#202124", letterSpacing: "-0.5px", margin: 0 }}>New project</h1>
        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: "#80868B", margin: "8px 0 20px" }}>Select a type, name your project, and start.</p>

        {/* Card grid — gap-as-border technique */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#E8EAED", marginBottom: 24 }}>
          {PROJECT_TYPES.map((pt, i) => {
            const isSelected = selected === pt.id;
            const isLast = i === PROJECT_TYPES.length - 1;
            return (
              <div
                key={pt.id}
                onClick={() => setSelected(pt.id)}
                style={{
                  gridColumn: isLast ? "1 / -1" : undefined,
                  padding: 14, cursor: "pointer",
                  background: isSelected ? "#E6F4F1" : WHITE,
                  borderTop: isSelected ? `3px solid ${TEAL}` : "3px solid transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#F8F9FA"; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = WHITE; }}
              >
                <div style={{ marginBottom: 8 }}>{pt.icon}</div>
                <div style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: isSelected ? TEAL : "#202124", marginBottom: 4 }}>{pt.label}</div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: "#80868B", lineHeight: 1.4 }}>{pt.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Project name — Material underline input */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontFamily: F, fontSize: 12, fontWeight: 500, color: "#5F6368", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Project name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Name your project"
            style={{
              width: "100%", height: 40, padding: 0, fontSize: 16, fontFamily: F,
              color: "#202124", background: "transparent",
              border: "none", borderBottom: "2px solid #E8EAED",
              borderRadius: 0, outline: "none",
            }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = TEAL; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = "#E8EAED"; }}
            onKeyDown={e => { if (e.key === "Enter" && canCreate) handleCreate(); }}
          />
        </div>

        {/* Action row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 20 }}>
          <span
            onClick={() => { setSelected(null); setName(""); }}
            style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: "#5F6368", cursor: "pointer", marginRight: 24 }}
          >Cancel</span>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              height: 36, padding: "0 24px", fontSize: 14, fontWeight: 500, fontFamily: F,
              color: canCreate ? WHITE : "#BDC1C6",
              background: canCreate ? TEAL : "#F1F3F4",
              border: "none", borderRadius: 4, cursor: canCreate ? "pointer" : "not-allowed",
              boxShadow: canCreate ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Left sidebar ─────────────────────────────────────────────────────────
function WorkspaceSidebar({ projects, activeProject, onSelect, onNewProject }: {
  projects: { name: string; count: number }[];
  activeProject: string;
  onSelect: (name: string) => void;
  onNewProject: () => void;
}) {
  return (
    <aside style={{
      width: 220, background: BG, borderRight: `1px solid ${BD}`,
      minHeight: "100vh", flexShrink: 0, display: "flex", flexDirection: "column", padding: "20px 0",
    }}>
      <div style={{ padding: "0 16px 14px", fontFamily: F, fontSize: 11, fontWeight: 600, color: T4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Projects
      </div>
      {projects.map(p => (
        <button key={p.name} onClick={() => onSelect(p.name)} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "8px 16px", background: "none", border: "none",
          borderLeft: p.name === activeProject ? `3px solid ${TEAL}` : "3px solid transparent",
          cursor: "pointer", textAlign: "left",
        }}>
          <span style={{
            fontFamily: F, fontSize: 14, flex: 1,
            color: p.name === activeProject ? T1 : T3,
            fontWeight: p.name === activeProject ? 500 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{p.name}</span>
          {p.count > 0 && (
            <span style={{ fontFamily: F, fontSize: 10, color: T4, background: WHITE, border: `1px solid ${BD}`, borderRadius: 10, padding: "1px 7px" }}>{p.count}</span>
          )}
        </button>
      ))}
      <button onClick={onNewProject} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontFamily: F, fontSize: 13, fontWeight: 500, color: TEAL, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
        + New project
      </button>

      <div style={{ padding: "20px 16px 10px", borderTop: `1px solid ${BD}`, marginTop: 16 }}>
        <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: T4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Trackers</div>
      </div>
      {[
        { label: "BBNJ Treaty", href: "/tracker/bbnj" },
        { label: "ISA Mining", href: "/tracker/isa" },
        { label: "IUU Fishing", href: "/tracker/iuu" },
        { label: "30x30", href: "/tracker/30x30" },
        { label: "Blue Finance", href: "/tracker/blue-finance" },
      ].map(t => (
        <a key={t.label} href={t.href} style={{ display: "block", padding: "6px 16px", fontFamily: F, fontSize: 13, color: T3, textDecoration: "none" }}>{t.label}</a>
      ))}
    </aside>
  );
}

// ── Research panel ───────────────────────────────────────────────────────
// ── Entry type ────────────────────────────────────────────────────────────
interface AutoEntry {
  id: string;
  story_id: string;
  entry_type: string;
  content: string;
  reviewed: boolean;
  accepted: boolean;
  dismissed: boolean;
  inserted_at: string;
  story_title: string | null;
  story_source: string | null;
  story_date: string | null;
}

const CONF_BADGE: Record<string, { bg: string; color: string }> = {
  STRONG: { bg: "#E6F4F1", color: TEAL },
  MODERATE: { bg: "#F3F4F6", color: "#6B7280" },
  WEAK: { bg: "#F9FAFB", color: "#9CA3AF" },
};

// ── Intelligence panel (right column) ────────────────────────────────────
function IntelligencePanel({ editor, topics, projectId }: {
  editor: ReturnType<typeof useEditor> | null;
  topics: string[];
  projectId: string | null;
}) {
  const [entries, setEntries] = useState<AutoEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [placeholder] = useState(() => getPlaceholder(topics));

  // Fetch entries when projectId changes
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project-entries/${projectId}`)
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(d => setEntries(d.entries || []))
      .catch(() => {});
  }, [projectId]);

  const visible = entries.filter(e => !e.dismissed);
  const unreviewed = visible.filter(e => !e.reviewed);
  const hasEntries = visible.length > 0;

  const patchEntry = (entryId: string, update: Record<string, boolean>) => {
    if (!projectId) return;
    fetch(`/api/project-entries/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId, ...update }),
    }).catch(() => {});
  };

  const markAllReviewed = () => {
    for (const e of unreviewed) {
      patchEntry(e.id, { reviewed: true });
    }
    setEntries(prev => prev.map(e => ({ ...e, reviewed: true })));
  };

  const acceptEntry = (entry: AutoEntry) => {
    if (!editor) return;
    editor.chain().focus("end").insertContent({
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: entry.content },
      ],
    }).insertContent({
      type: "paragraph",
      content: [
        { type: "text", text: `${entry.story_source || "Source"} \u00B7 ${entry.story_date ? fmtDate(entry.story_date) : ""}` },
      ],
    }).run();
    patchEntry(entry.id, { accepted: true });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, accepted: true } : e));
  };

  const dismissEntry = (entryId: string) => {
    patchEntry(entryId, { dismissed: true });
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, dismissed: true } : e));
  };

  const submit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/research/inline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim() }) });
      const d = await r.json();
      if (d.answer) setResult(d);
    } catch {}
    setLoading(false);
  };

  const insertAnswer = () => {
    if (!editor || !result?.answer) return;
    editor.chain().focus().insertContent({
      type: "blockquote",
      content: [
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "italic" }], text: result.answer }] },
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Tideline Research" }, { type: "text", text: ` \u00B7 ${query.trim()}` }] },
      ],
    }).run();
    setResult(null); setQuery("");
  };

  return (
    <div style={{ width: 300, background: "#F8F9FA", borderLeft: "1px solid #E8EAED", flexShrink: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1px" }}>Intelligence</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: hasEntries ? TEAL : "#9CA3AF" }} />
          <span style={{ fontFamily: F, fontSize: 11, color: hasEntries ? TEAL : "#9CA3AF" }}>{hasEntries ? "Live" : "Monitoring"}</span>
        </span>
      </div>

      {/* Scrollable entries area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
        {/* Intelligence Thread narrative */}
        <IntelligenceThread projectId={projectId} />

        {/* New items banner */}
        {unreviewed.length > 0 && (
          <div onClick={markAllReviewed} style={{ background: "#E6F4F1", padding: "8px 12px", marginBottom: 12, cursor: "pointer", borderRadius: R }}>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL }}>{"\u25CF"} {unreviewed.length} new since your last visit</span>
          </div>
        )}

        {/* Entry cards */}
        {visible.map(e => (
          <div key={e.id} style={{ background: WHITE, border: "1px solid #E8EAED", padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F, fontSize: 11, color: "#9CA3AF" }}>
                {e.inserted_at ? fmtDate(e.inserted_at) : ""}
              </span>
              {e.entry_type && (
                <span style={{
                  fontFamily: F, fontSize: 10, fontWeight: 500, padding: "1px 7px", borderRadius: 10,
                  ...(CONF_BADGE[e.entry_type.toUpperCase()] || CONF_BADGE.MODERATE),
                }}>
                  {e.entry_type}
                </span>
              )}
            </div>
            <div style={{
              fontFamily: F, fontSize: 13, color: "#202124", lineHeight: 1.5, marginBottom: 4,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            }}>
              {e.content}
            </div>
            {e.story_source && (
              <div style={{ fontFamily: F, fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>{e.story_source}</div>
            )}
            {!e.accepted && (
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => acceptEntry(e)} style={{ fontFamily: F, fontSize: 11, color: TEAL, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {"\u2713"} Add to notes
                </button>
                <button onClick={() => dismissEntry(e.id)} style={{ fontFamily: F, fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {"\u2715"} Dismiss
                </button>
              </div>
            )}
            {e.accepted && (
              <span style={{ fontFamily: F, fontSize: 11, color: TEAL }}>{"\u2713"} Added</span>
            )}
          </div>
        ))}

        {/* Empty state */}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "#202124", marginBottom: 4 }}>Monitoring this topic</div>
            <div style={{ fontFamily: F, fontSize: 12, color: "#9CA3AF" }}>Intelligence files here automatically overnight.</div>
          </div>
        )}

        {/* Ask result */}
        {result && (
          <div style={{ background: WHITE, border: "1px solid #E8EAED", padding: 12, marginTop: 12 }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "#202124", lineHeight: 1.6, marginBottom: 8 }}>{result.answer}</div>
            <button onClick={insertAnswer} style={{ fontFamily: F, fontSize: 11, color: TEAL, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {"\u2713"} Add to notes
            </button>
          </div>
        )}
      </div>

      {/* Ask input — sticky bottom */}
      <div style={{ borderTop: "1px solid #E8EAED", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} placeholder={placeholder}
            style={{ flex: 1, padding: "8px 12px", fontSize: 13, fontFamily: F, color: "#202124", background: WHITE, border: "1px solid #E8EAED", borderRadius: 0, outline: "none" }} />
          <button onClick={submit} disabled={!query.trim() || loading} style={{
            padding: "8px 16px", fontSize: 12, fontWeight: 500, fontFamily: F,
            color: WHITE, background: query.trim() && !loading ? TEAL : "#9CA3AF",
            border: "none", borderRadius: 0, cursor: query.trim() && !loading ? "pointer" : "default",
          }}>
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
function WorkspaceContent() {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project");

  const [docId, setDocId] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showAsk, setShowAsk] = useState(false);
  const [askInitialQuery, setAskInitialQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);
  const [projects, setProjects] = useState<{ name: string; count: number }[]>([]);
  const [activeProject, setActiveProject] = useState("Workspace");
  const [wordCount, setWordCount] = useState(0);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocal = docId === "local";

  // Boot
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        let projectName = projectParam || "";
        const recentRes = await fetch("/api/projects");
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          const projList = recentData.projects || [];
          setProjects(projList);
          if (!projectName && projList.length > 0) {
            projectName = projList[0].name;
            if (projList[0].project_type) setProjectType(projList[0].project_type);
          }
        }

        // No projects and no param — show creation panel
        if (!projectName) {
          setShowCreatePanel(true);
          setReady(true);
          return;
        }
        setActiveProject(projectName);

        const projRes = await fetch(`/api/projects/${encodeURIComponent(projectName)}`);
        if (projRes.ok) {
          const d = await projRes.json();
          if (d.project_id) setProjectId(d.project_id);
          if (d.project_type) setProjectType(d.project_type);
          const docs = d.documents || [];
          if (!cancelled && docs.length > 0) {
            const docRes = await fetch(`/api/documents/${docs[0].id}`);
            if (docRes.ok) {
              const doc = await docRes.json();
              setDocId(doc.id); setDocContent(doc.content || null);
              if (doc.content?.fields) setFields(doc.content.fields);
              if (doc.title && doc.title !== "Untitled document" && doc.title !== "Project brief") setTitle(doc.title);
              setReady(true); return;
            }
          }
        }
        if (cancelled) return;
        const createRes = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_name: projectName, title: "Untitled document" }) });
        if (createRes.ok) {
          const created = await createRes.json();
          if (created.id) { setDocId(created.id); setDocContent(null); setReady(true); return; }
        }
        setDocId("local"); setDocContent(null); setReady(true);
      } catch {
        if (!cancelled) { setDocId("local"); setDocContent(null); setReady(true); }
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [projectParam]);

  // Auto-save (fields + notes)
  const doSave = useCallback((ed: ReturnType<typeof useEditor>, currentFields?: Record<string, string>) => {
    if (!ed || isLocal || !docId) return;
    setSaveStatus("saving");
    const content = { fields: currentFields || fields, notes: ed.getJSON() };
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, content_text: ed.getText() }) })
      .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
      .catch(() => setSaveStatus("idle"));
  }, [docId, isLocal, fields]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Add notes, evidence, or draft content here..." }), Typography],
    editorProps: {
      attributes: { style: `outline:none;min-height:200px;font-family:${F};font-size:14px;line-height:1.7;color:${T1};` },
      handleKeyDown: (_view, event) => {
        if (event.key === " " && editor) {
          const { $head } = editor.state.selection;
          if ($head.parent.textContent.endsWith("/ask")) {
            editor.chain().deleteRange({ from: $head.pos - 4, to: $head.pos }).run();
            setShowAsk(true);
            return true;
          }
        }
        return false;
      },
    },
    content: docContent?.notes || docContent || undefined,
    autofocus: "end",
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(ed), 2000);
      const text = ed.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    },
  });

  useEffect(() => { return () => { if (saveTimer.current) clearTimeout(saveTimer.current); }; }, []);

  const saveTitle = (val: string) => {
    if (isLocal || !docId) return;
    const t = val.trim() || "Untitled document";
    setDetectedTopics(detectTopics(t));
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t, tags: detectTopics(t) }) }).catch(() => {});
  };

  const handleCreateProject = async (name: string, type: string) => {
    try {
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, project_type: type }),
      });
      if (!projRes.ok) return;
      const projData = await projRes.json();
      const newDocId = projData.document_id;
      if (!newDocId) return;

      // Set defaults from schema
      const schema = FIELD_SCHEMAS[type] || [];
      const defaults: Record<string, string> = {};
      for (const f of schema) { if (f.defaultValue) defaults[f.key] = f.defaultValue; }

      setDocId(newDocId);
      setTitle(name);
      setActiveProject(name);
      setProjectType(type);
      setProjectId(projData.project_id);
      setFields(defaults);
      setProjects(prev => [{ name, count: 0 }, ...prev]);

      // Save initial content
      if (editor) editor.commands.clearContent();
      fetch(`/api/documents/${newDocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { fields: defaults, notes: null }, title: name }),
      }).catch(() => {});

      setShowCreatePanel(false);
    } catch {}
  };

  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...fields, [key]: value };
    setFields(updated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { if (editor) doSave(editor, updated); }, 2000);
  };

  if (!ready) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: WHITE, color: T4, fontSize: 13, fontFamily: F }}>Loading...</div>;
  }

  if (showCreatePanel) {
    return <CreateProjectPanel onCreate={handleCreateProject} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: F }}>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${T4}; pointer-events: none; height: 0; }
        .ProseMirror { outline: none; }
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 20px 0 8px; font-family: ${F}; color: ${T1}; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 24px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
        .ProseMirror blockquote { border-left: 2px solid ${TEAL}; padding: 12px 16px; background: rgba(14,124,134,.04); margin: 12px 0; border-radius: ${R}px; }
        .ProseMirror blockquote p { color: ${T2}; font-size: 13px; line-height: 1.6; }
        .ProseMirror blockquote p:first-child { font-weight: 500; }
        .ws-toolbar { display: none; }
        .ProseMirror:focus-within ~ .ws-toolbar-anchor .ws-toolbar { display: flex; }
      `}</style>

      <WorkspaceSidebar projects={projects} activeProject={activeProject} onSelect={(name) => { window.location.href = `/platform/workspace?project=${encodeURIComponent(name)}`; }} onNewProject={() => setShowCreatePanel(true)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: WHITE }}>
        {/* Toolbar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 16px", gap: 4, borderBottom: `2px solid ${TEAL}`, flexShrink: 0, background: WHITE }}>
          <button onClick={() => { setAskInitialQuery(""); setShowAsk(!showAsk); }} style={btnSec({ color: showAsk ? TEAL : T2, borderColor: showAsk ? TEAL : BD })}>Ask Tideline</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { if (!isLocal && docId) window.open(`/api/documents/${docId}/export`, "_blank"); }} style={btnPri({ height: 28 })}>Export to Word</button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 0 100px" }}>
            {/* Ask overlay */}
            {showAsk && (
              <div style={{ marginBottom: 20, padding: "14px 16px", background: WHITE, border: `1px solid ${BD}`, borderRadius: R }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={askInitialQuery || undefined} onChange={e => setAskInitialQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setShowAsk(false); }} placeholder={getPlaceholder(detectedTopics)}
                    style={{ flex: 1, height: 32, padding: "0 10px", fontSize: 13, fontFamily: M, color: T1, background: BG, border: `1px solid ${BD}`, borderRadius: R, outline: "none" }} />
                  <button onClick={() => setShowAsk(false)} style={btnSec({ height: 32 })}>Close</button>
                </div>
              </div>
            )}

            {/* Title */}
            <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => saveTitle(title)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }} placeholder="Untitled project"
              style={{ width: "100%", fontSize: 28, fontWeight: 600, fontFamily: F, color: title ? "#202124" : T4, border: "none", outline: "none", background: "transparent", padding: 0 }} />
            <div style={{ height: 1, background: "#E0E0E0", margin: "14px 0 28px" }} />

            {/* Structured fields */}
            {projectType && FIELD_SCHEMAS[projectType] && (
              <>
                <StructuredFields schema={FIELD_SCHEMAS[projectType]} fields={fields} onChange={handleFieldChange} />
                <div style={{ height: 1, background: "#E0E0E0", margin: "24px 0" }} />
              </>
            )}

            {/* Notes section label */}
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Notes</div>

            {/* Tiptap notes editor */}
            <EditorContent editor={editor} />

            {/* Selection-only format toolbar */}
            {editor && !editor.state.selection.empty && (
              <div style={{ position: "fixed", top: 100, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 2, padding: "4px 6px", background: "#202124", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
                {[
                  { label: "Bold", cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
                  { label: "Italic", cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
                  { label: "H2", cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
                  { label: "List", cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
                ].map(b => (
                  <button key={b.label} onMouseDown={e => { e.preventDefault(); b.cmd(); }} style={{ height: 28, padding: "0 10px", fontSize: 12, fontWeight: 500, fontFamily: F, color: "#fff", background: b.active ? "rgba(255,255,255,.2)" : "transparent", border: "none", borderRadius: 4, cursor: "pointer" }}>{b.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ height: 32, display: "flex", alignItems: "center", padding: "0 20px", borderTop: "1px solid #E5E7EB", background: BG, flexShrink: 0 }}>
          <span style={{ fontFamily: M, fontSize: 11, color: T4 }}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Draft"}{" \u00B7 "}{wordCount} {wordCount === 1 ? "word" : "words"}{" \u00B7 "}{activeProject}
          </span>
        </div>
      </div>

      <IntelligencePanel editor={editor} topics={detectedTopics} projectId={projectId} />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <DesktopOnly featureName="Workspace">
      <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: WHITE, color: "#9CA3AF", fontSize: 13 }}>Loading workspace...</div>}>
        <WorkspaceContent />
      </Suspense>
    </DesktopOnly>
  );
}
