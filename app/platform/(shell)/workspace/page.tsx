"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import DesktopOnly from "@/components/DesktopOnly";

// -- Design tokens ---------------------------------------------------------------
const BG    = "#F8F9FA";
const WHITE = "#FFFFFF";
const NAVY  = "#0F1117";
const TEAL  = "#1D9E75";
const T1    = "#202124";
const T2    = "#3C4043";
const T3    = "#5F6368";
const T4    = "#9AA0A6";
const BD    = "#DADCE0";
const BLT   = "#E8EAED";
const TEAL_LIGHT = "rgba(29,158,117,0.08)";
const RED   = "#EF4444";
const R     = 6;
const FUI   = "var(--font-ui), 'Plus Jakarta Sans', -apple-system, sans-serif";
const F     = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M     = "var(--font-sans), 'DM Sans', sans-serif";

interface SourceStory { id: string; title: string; source_name: string; published_at: string; short_summary: string | null; source_type?: string }
interface AskSource { document_id: string | null; title: string; source_organisation: string | null; published_date: string | null; file_url: string | null }
interface AskResult { answer: string; sources?: AskSource[] }

function decodeHtml(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&#8211;/g, "-").replace(/&#8212;/g, ", ").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)));
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
  for (const t of topics) { if (PLACEHOLDERS[t]) return PLACEHOLDERS[t][0]; }
  return DEF_PH[0];
}

// -- Button styles ---------------------------------------------------------------
const btnSec = (ov?: React.CSSProperties): React.CSSProperties => ({
  height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "0 12px", fontSize: 13, fontWeight: 500, fontFamily: FUI,
  border: `1px solid ${BD}`, borderRadius: R, cursor: "pointer",
  background: WHITE, color: T2, ...ov,
});

const btnPri = (ov?: React.CSSProperties): React.CSSProperties => ({
  height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "0 14px", fontSize: 13, fontWeight: 500, fontFamily: FUI,
  border: "none", borderRadius: R, cursor: "pointer",
  background: TEAL, color: WHITE, ...ov,
});

// -- Field schemas per project type -----------------------------------------------
interface FieldDef { key: string; label: string; type: "text" | "textarea" | "date" | "select"; options?: string[]; rows?: number; defaultValue?: string; required?: boolean; placeholder?: string }

const FIELD_SCHEMAS: Record<string, FieldDef[]> = {
  situation_report: [
    { key: "summary", label: "Summary", type: "textarea", rows: 2, required: true, placeholder: "One sentence describing what this project is tracking." },
    { key: "topic", label: "Topic", type: "text" },
    { key: "due_by", label: "Due by", type: "date" },
    { key: "tags", label: "Tags", type: "text" },
  ],
  regulatory_watch: [
    { key: "summary", label: "Summary", type: "textarea", rows: 2, required: true, placeholder: "One sentence describing what this project is tracking." },
    { key: "topic", label: "Topic", type: "text" },
    { key: "due_by", label: "Due by", type: "date" },
    { key: "tags", label: "Tags", type: "text" },
  ],
  investigation: [
    { key: "summary", label: "Summary", type: "textarea", rows: 2, required: true, placeholder: "One sentence describing what this project is tracking." },
    { key: "topic", label: "Topic", type: "text" },
    { key: "due_by", label: "Due by", type: "date" },
    { key: "tags", label: "Tags", type: "text" },
  ],
  briefing_note: [
    { key: "summary", label: "Summary", type: "textarea", rows: 2, required: true, placeholder: "One sentence describing what this project is tracking." },
    { key: "topic", label: "Topic", type: "text" },
    { key: "due_by", label: "Due by", type: "date" },
    { key: "tags", label: "Tags", type: "text" },
  ],
  deal_monitor: [
    { key: "summary", label: "Summary", type: "textarea", rows: 2, required: true, placeholder: "One sentence describing what this project is tracking." },
    { key: "topic", label: "Topic", type: "text" },
    { key: "due_by", label: "Due by", type: "date" },
    { key: "tags", label: "Tags", type: "text" },
  ],
};

// -- Field input styles -----------------------------------------------------------
const fieldInput: React.CSSProperties = {
  width: "100%", height: 36, border: "none", borderBottom: "2px solid #E0E0E0",
  borderRadius: 0, fontSize: 14, fontFamily: F, color: T1,
  padding: "0 0 4px 0", background: "transparent", outline: "none",
};

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: T1, marginBottom: 4,
};

function CalendarAddLink() {
  const [added, setAdded] = useState(false);
  return (
    <span onClick={() => setAdded(true)} style={{ fontFamily: F, fontSize: 11, color: TEAL, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
      {added ? "\u2713 Added" : "+ Add to calendar"}
    </span>
  );
}

// -- Structured fields component --------------------------------------------------
function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];

  const setTags = (next: string[]) => onChange(next.join(", "));

  const addTag = () => {
    const t = draft.trim();
    if (!t) return;
    if (tags.includes(t)) { setDraft(""); return; }
    setTags([...tags, t]);
    setDraft("");
  };

  const removeTag = (i: number) => {
    setTags(tags.filter((_, idx) => idx !== i));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const showHint = focused || tags.length === 0;

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", fontFamily: F, fontSize: 11, color: T2, background: "#F9FAFB", border: `1px solid ${BD}`, borderRadius: 20 }}>
            {t}
            <button onClick={() => removeTag(i)} style={{ background: "none", border: "none", color: T4, fontSize: 11, cursor: "pointer", padding: 0, lineHeight: 1 }}>x</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={tags.length === 0 ? "Add a tag..." : ""}
          style={{ flex: 1, minWidth: 80, border: "none", background: "transparent", outline: "none", fontFamily: F, fontSize: 13, color: T1, padding: 0 }}
        />
      </div>
      {showHint && (
        <div style={{ fontFamily: F, fontSize: 11, color: T4, marginTop: 4 }}>Type a tag and press Enter to add</div>
      )}
    </div>
  );
}

function StructuredFields({ schema, fields, onChange }: {
  schema: FieldDef[];
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const rowInput: React.CSSProperties = {
    width: "100%", border: "none", background: "transparent", outline: "none",
    fontFamily: F, fontSize: 13, color: T1, padding: 0,
  };
  return (
    <div>
      {schema.map((f, i) => {
        const value = fields[f.key] || "";
        return (
        <div key={f.key} style={{ borderTop: i === 0 ? `1px solid ${BD}` : "none", borderBottom: `1px solid ${BD}`, padding: "10px 0", display: "flex", alignItems: f.key === "tags" ? "flex-start" : "center", gap: 12 }}>
          <label style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, width: 120, flexShrink: 0, paddingTop: f.key === "tags" ? 4 : 0 }}>
            {f.label}{f.required && <span style={{ color: "#EA4335", marginLeft: 2 }}>*</span>}
          </label>
          <div style={{ flex: 1, display: "flex", alignItems: f.key === "tags" ? "flex-start" : "center", gap: 10 }}>
            {f.key === "tags" ? (
              <TagInput value={value} onChange={v => onChange(f.key, v)} />
            ) : f.type === "textarea" ? (
              <textarea
                value={value}
                onChange={e => onChange(f.key, e.target.value)}
                rows={f.rows || 2}
                placeholder={f.placeholder}
                style={{ ...rowInput, resize: "vertical", lineHeight: 1.6 }}
              />
            ) : f.type === "select" ? (
              <select
                value={value}
                onChange={e => onChange(f.key, e.target.value)}
                style={{ ...rowInput, cursor: "pointer", appearance: "none" }}
              >
                <option value="">Select...</option>
                {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={f.type === "date" ? "date" : "text"}
                value={value}
                onChange={e => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={rowInput}
              />
            )}
            {f.key === "due_by" && value && (
              <CalendarAddLink />
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// -- Project types ----------------------------------------------------------------
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

// -- Project creation panel -------------------------------------------------------
function CreateProjectPanel({ onCreate }: { onCreate: (name: string, type: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreate = selected && name.trim().length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), selected!);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div style={{ background: WHITE, minHeight: "100vh", padding: "32px 0 40px 48px" }}>
      <div style={{ maxWidth: 560 }}>
        {/* Heading */}
        <h1 style={{ fontFamily: FUI, fontSize: 28, fontWeight: 800, color: T1, letterSpacing: "-0.4px", margin: 0 }}>New project</h1>
        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: T4, margin: "8px 0 20px" }}>Select a type, name your project, and start.</p>

        {/* Card grid, gap-as-border technique */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: BLT, marginBottom: 24 }}>
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
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = BG; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = WHITE; }}
              >
                <div style={{ marginBottom: 8 }}>{pt.icon}</div>
                <div style={{ fontFamily: FUI, fontSize: 15, fontWeight: 500, color: isSelected ? TEAL : T1, marginBottom: 4 }}>{pt.label}</div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: T4, lineHeight: 1.4 }}>{pt.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Project name, Material underline input */}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontFamily: F, fontSize: 11, fontWeight: 500, color: T3, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Project name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Name your project"
            style={{
              width: "100%", height: 40, padding: 0, fontSize: 16, fontFamily: F,
              color: T1, background: "transparent",
              border: "none", borderBottom: `2px solid ${BLT}`,
              borderRadius: 0, outline: "none",
            }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = TEAL; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = BLT; }}
            onKeyDown={e => { if (e.key === "Enter" && canCreate) handleCreate(); }}
          />
        </div>

        {/* Action row */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 20 }}>
          <span
            onClick={() => { setSelected(null); setName(""); }}
            style={{ fontFamily: FUI, fontSize: 14, fontWeight: 400, color: T3, cursor: "pointer", marginRight: 24 }}
          >Cancel</span>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              height: 36, padding: "0 24px", fontSize: 14, fontWeight: 500, fontFamily: FUI,
              color: canCreate ? WHITE : "#BDC1C6",
              background: canCreate ? TEAL : "#F1F3F4",
              border: "none", borderRadius: R, cursor: canCreate ? "pointer" : "not-allowed",
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

// -- Entry type -------------------------------------------------------------------
interface AutoEntry {
  id: string;
  story_id: string;
  entry_type: string;
  content: string | null;
  matched_entity_id: string | null;
  matched_entity_name: string | null;
  reviewed: boolean;
  accepted: boolean;
  dismissed: boolean;
  inserted_at: string;
  story_title: string | null;
  story_source: string | null;
  story_date: string | null;
}

// -- Upload modal -----------------------------------------------------------------
function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: (dest: "private" | "network") => void }) {
  const [dest, setDest] = useState<"private" | "network">("private");
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, background: WHITE, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FUI, fontSize: 18, fontWeight: 800, color: T1 }}>Upload a file</div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: "none", border: "none", color: T3, fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>x</button>
        </div>
        <div style={{ padding: "16px 20px 0" }}>
          {/* Drop zone */}
          <div style={{ border: `1.5px dashed ${BD}`, borderRadius: 10, padding: 28, textAlign: "center", background: "#F9FAFB" }}>
            <div style={{ width: 44, height: 44, background: WHITE, border: `1px solid ${BD}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={T3} strokeWidth="1.5"><path d="M10 14V4M10 4l-4 4M10 4l4 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 13v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ fontFamily: FUI, fontSize: 13, fontWeight: 500, color: T1, marginBottom: 4 }}>Drop your file here</div>
            <div style={{ fontFamily: F, fontSize: 11.5, color: T3 }}>PDF, Word, or any document up to 50MB</div>
            <button style={{ height: 32, padding: "0 14px", marginTop: 12, fontFamily: FUI, fontSize: 12, fontWeight: 500, color: T2, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Browse files</button>
          </div>
        </div>
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontFamily: FUI, fontSize: 12, fontWeight: 500, color: T1, marginBottom: 10 }}>Where should this be saved?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <label onClick={() => setDest("private")} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: dest === "private" ? `1.5px solid ${TEAL}` : `1px solid ${BD}`, borderRadius: 8, cursor: "pointer", background: dest === "private" ? "rgba(29,158,117,0.05)" : WHITE }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={dest === "private" ? TEAL : T3} strokeWidth="1.4" style={{ marginTop: 2, flexShrink: 0 }}><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
              <div>
                <div style={{ fontFamily: FUI, fontSize: 13, fontWeight: 600, color: T1 }}>Private cabinet</div>
                <div style={{ fontFamily: F, fontSize: 12, color: T3 }}>Only you can see this file.</div>
              </div>
            </label>
            <label onClick={() => setDest("network")} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: dest === "network" ? `1.5px solid ${TEAL}` : `1px solid ${BD}`, borderRadius: 8, cursor: "pointer", background: dest === "network" ? "rgba(29,158,117,0.05)" : WHITE }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={dest === "network" ? TEAL : T3} strokeWidth="1.4" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>
              <div>
                <div style={{ fontFamily: FUI, fontSize: 13, fontWeight: 600, color: T1 }}>Add to Tideline Network</div>
                <div style={{ fontFamily: F, fontSize: 12, color: T3 }}>Shared with the ocean journalism community. Your name stays on it as contributor.</div>
              </div>
            </label>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: `1px solid ${BD}` }}>
          <span style={{ fontFamily: F, fontSize: 10, color: T4 }}>File will also be attached to this workspace</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ height: 32, padding: "0 14px", fontFamily: FUI, fontSize: 13, fontWeight: 500, color: T2, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onUploaded(dest); onClose(); }} style={{ height: 32, padding: "0 14px", fontFamily: FUI, fontSize: 13, fontWeight: 500, color: WHITE, background: TEAL, border: "none", borderRadius: 6, cursor: "pointer" }}>Upload</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Export modal ------------------------------------------------------------------
function ExportModal({ open, onClose, docId, isLocal }: { open: boolean; onClose: () => void; docId: string | null; isLocal: boolean }) {
  if (!open) return null;
  const tiles = [
    { label: "Word (.docx)", desc: "Editable document", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={TEAL} strokeWidth="1.3"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 10h6M7 14h4"/></svg> },
    { label: "PDF report", desc: "Branded, print-ready", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={TEAL} strokeWidth="1.3"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 8h6M7 12h4"/></svg> },
    { label: "Shareable link", desc: "Live read-only view", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={TEAL} strokeWidth="1.3"><path d="M8 12l4-4"/><circle cx="6" cy="14" r="2"/><circle cx="14" cy="6" r="2"/></svg> },
    { label: "Citations (.bib)", desc: "For reference managers", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={TEAL} strokeWidth="1.3"><path d="M4 4h12v12H4z" rx="1.5"/><path d="M8 8h4M8 11h2"/></svg> },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, background: WHITE, borderRadius: 12, padding: 24 }}>
        <div style={{ fontFamily: FUI, fontSize: 20, fontWeight: 800, color: T1, marginBottom: 20 }}>Export report</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {tiles.map(t => (
            <button key={t.label} onClick={() => { if (t.label === "Word (.docx)" && !isLocal && docId) window.open(`/api/documents/${docId}/export`, "_blank"); onClose(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 16, border: `1px solid ${BD}`, borderRadius: 8, background: WHITE, cursor: "pointer", textAlign: "center" }}>
              {t.icon}
              <div style={{ fontFamily: FUI, fontSize: 13, fontWeight: 600, color: T1 }}>{t.label}</div>
              <div style={{ fontFamily: F, fontSize: 11, color: T3 }}>{t.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ fontFamily: F, fontSize: 10, color: T4, textAlign: "center", letterSpacing: "0.05em" }}>Exported documents include full source citations and Tideline branding</div>
      </div>
    </div>
  );
}

// -- Ask Tideline panel (collapsible) ---------------------------------------------
function AskTidelinePanel({ onPasteToNotes, onSourcesFound }: { onPasteToNotes: (text: string) => void; onSourcesFound?: (sources: AskSource[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AskSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    try {
      const r = await fetch("/api/workspace/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: query.trim() }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Request failed"); return; }
      if (d.answer) setAnswer(d.answer);
      if (d.sources) { setSources(d.sources); onSourcesFound?.(d.sources); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 16, border: `1px solid ${BD}`, borderRadius: 8, padding: 14 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(29,158,117,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={TEAL} strokeWidth="1.4"><path d="M2 3h10v7H5l-3 2V3z" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FUI, fontSize: 12.5, fontWeight: 500, color: T1 }}>Ask Tideline</div>
          <div style={{ fontFamily: F, fontSize: 11, color: T3 }}>Ask a question, then paste the answer straight into your notes</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={T4} strokeWidth="1.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: answer || error ? 14 : 0 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Type your question..." style={{ flex: 1, height: 36, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, border: `1px solid ${BD}`, borderRadius: 7, outline: "none", background: WHITE }} onFocus={e => { (e.target as HTMLElement).style.borderColor = TEAL; }} onBlur={e => { (e.target as HTMLElement).style.borderColor = BD; }} />
            <button onClick={ask} disabled={!query.trim() || loading} style={{ height: 36, padding: "0 16px", fontFamily: FUI, fontSize: 13, fontWeight: 500, color: WHITE, background: query.trim() && !loading ? TEAL : "#BDC1C6", border: "none", borderRadius: 6, cursor: query.trim() && !loading ? "pointer" : "default" }}>{loading ? "Searching..." : "Ask"}</button>
          </div>
          {loading && <div style={{ fontFamily: F, fontSize: 12, color: T4, marginBottom: 8 }}>Searching library and primary sources...</div>}
          {error && <div style={{ fontFamily: F, fontSize: 12, color: "#D93025", marginBottom: 8 }}>{error}</div>}
          {answer && (
            <>
              <button onClick={() => onPasteToNotes(`Q: ${query}\n\n${answer}`)} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: TEAL, background: WHITE, border: `1px solid ${TEAL}`, borderRadius: 6, cursor: "pointer", marginBottom: 10 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2" width="6" height="8" rx="1"/><path d="M5 1h2"/></svg>
                Paste into notes
              </button>
              <div style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 16, fontFamily: F, fontWeight: 400, lineHeight: 1.75, color: T1, fontSize: 13, marginBottom: 12, whiteSpace: "pre-wrap" }}>{answer}</div>
              {sources.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: FUI, fontSize: 10, fontWeight: 600, color: T4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Sources ({sources.length})</div>
                  {sources.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: F, fontSize: 11.5, color: T3, lineHeight: 1.5, marginBottom: 3 }}>
                      <span style={{ color: TEAL, flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
                      <span>
                        {s.document_id ? <a href="#" onClick={async (e) => { e.preventDefault(); const res = await fetch(`/api/library/signed-url?id=${s.document_id}`); const d = await res.json(); if (d.url) window.open(d.url, "_blank"); }} style={{ color: TEAL, textDecoration: "none", cursor: "pointer" }}>{s.title}</a> : s.title}
                        {s.source_organisation && <span style={{ color: T4 }}> {"\u2014"} {s.source_organisation}</span>}
                        {s.published_date && <span style={{ color: T4 }}> ({s.published_date})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => onPasteToNotes(`Q: ${query}\n\n${answer}`)} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: TEAL, background: WHITE, border: `1px solid ${TEAL}`, borderRadius: 6, cursor: "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2" width="6" height="8" rx="1"/><path d="M5 1h2"/></svg>
                  Paste into notes
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// -- Writing assistant ------------------------------------------------------------
function WritingAssistant({ sourceCount, onCopyToNotes }: { sourceCount: number; onCopyToNotes: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("Situation report");
  const [tone, setTone] = useState("Journalistic");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");

  const formats = ["Situation report", "Executive briefing", "Investigation memo", "Newsletter draft", "Timeline"];
  const tones = ["Journalistic", "Analytical", "Formal", "Plain English"];

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    display: "inline-block", padding: "5px 12px", fontFamily: FUI, fontSize: 12,
    fontWeight: selected ? 500 : 400,
    border: `1px solid ${selected ? TEAL : BD}`, borderRadius: 20, cursor: "pointer",
    background: selected ? "rgba(29,158,117,0.08)" : WHITE,
    color: selected ? TEAL : "#6B7280",
  });

  const stepNum = (n: number) => (
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(29,158,117,0.1)", color: TEAL, fontFamily: F, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
  );

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setDraft(`This is a ${tone.toLowerCase()} ${format.toLowerCase()} drafted from your notes and ${sourceCount} attached sources. Edit freely from here.`);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ marginBottom: 16, border: `1px solid ${BD}`, borderRadius: 8, padding: 14 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B5CF6" strokeWidth="1.4"><path d="M9 2l3 3-7 7H2v-3l7-7z" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FUI, fontSize: 12.5, fontWeight: 500, color: T1 }}>Writing assistant</div>
          <div style={{ fontFamily: F, fontSize: 11, color: T3 }}>Turn your notes and sources into a coherent report</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={T4} strokeWidth="1.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BD}` }}>
            {stepNum(1)}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FUI, fontSize: 12, fontWeight: 600, color: T1, marginBottom: 7 }}>What do you want to write?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {formats.map(f => <span key={f} onClick={() => setFormat(f)} style={pillStyle(format === f)}>{f}</span>)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BD}` }}>
            {stepNum(2)}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FUI, fontSize: 12, fontWeight: 600, color: T1, marginBottom: 7 }}>Tone</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tones.map(t => <span key={t} onClick={() => setTone(t)} style={pillStyle(tone === t)}>{t}</span>)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0" }}>
            {stepNum(3)}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FUI, fontSize: 12, fontWeight: 600, color: T1, marginBottom: 4 }}>Using your notes + {sourceCount} attached sources</div>
              <div style={{ fontFamily: F, fontSize: 11, color: T3, marginBottom: 10 }}>Tideline will draft from your evidence, you edit from there.</div>
              <button onClick={generate} disabled={generating} style={{ width: "100%", height: 38, fontFamily: FUI, fontSize: 13, fontWeight: 600, color: WHITE, background: TEAL, border: "none", borderRadius: 7, cursor: generating ? "default" : "pointer" }}>
                {generating ? "Writing..." : "Generate draft"}
              </button>
              {generating && <div style={{ fontFamily: F, fontSize: 11, color: T3, marginTop: 8 }}>Drafting from {sourceCount} sources and your notes...</div>}
            </div>
          </div>
          {draft && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: T4 }}>Your draft, edit freely</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={generate} style={{ height: 28, padding: "0 12px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: T2, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Regenerate</button>
                  <button onClick={() => onCopyToNotes(draft)} style={{ height: 28, padding: "0 12px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: WHITE, background: "#202124", border: "none", borderRadius: 6, cursor: "pointer" }}>Copy to notes</button>
                </div>
              </div>
              <div contentEditable suppressContentEditableWarning style={{ border: `1px solid ${BD}`, borderRadius: 7, padding: 14, fontFamily: F, fontSize: 13.5, lineHeight: 1.75, color: T1, outline: "none", minHeight: 120 }}>{draft}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -- New since last visit banner --------------------------------------------------
function NewSinceLastVisitBanner({ updates = [] }: { updates?: { text: string; tier: string; time: string }[] }) {
  const [open, setOpen] = useState(true);
  const count = updates.length;
  if (count === 0) return null;
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(29,158,117,0.06), rgba(29,158,117,0.03))", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 10, marginBottom: 16 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, cursor: "pointer" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(29,158,117,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={TEAL} strokeWidth="1.4"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: TEAL, marginBottom: 2 }}>New since your last visit</div>
          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1 }}>{count} new intelligence entries since you were last here.</div>
          <div style={{ fontFamily: F, fontSize: 11, color: T3, marginTop: 2 }}>Tideline's agents have been working, review and accept below</div>
        </div>
        <span style={{ fontFamily: F, fontSize: 11, background: "rgba(29,158,117,0.12)", color: TEAL, border: "1px solid rgba(29,158,117,0.25)", borderRadius: 12, padding: "3px 10px", flexShrink: 0 }}>{count} updates</span>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid rgba(29,158,117,0.15)", padding: 12 }}>
          {updates.map((u, i) => {
            const tierC = u.tier === "Wire" ? { c: "#1D4ED8", b: "#DBEAFE", bd: "#93C5FD" } : u.tier === "Official" ? { c: "#7C3AED", b: "#F5F3FF", bd: "#EDE9FE" } : { c: "#15803D", b: "#DCFCE7", bd: "#86EFAC" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: F, fontSize: 11.5, color: T1 }}>{u.text}</span>
                <span style={{ fontFamily: M, fontSize: 8.5, fontWeight: 500, textTransform: "uppercase", padding: "1px 5px", borderRadius: 3, color: tierC.c, background: tierC.b, border: `1px solid ${tierC.bd}` }}>{u.tier}</span>
                <span style={{ fontFamily: F, fontSize: 10, color: "#6B7280" }}>{u.time}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ height: 26, padding: "0 12px", fontFamily: F, fontSize: 11, fontWeight: 500, color: WHITE, background: TEAL, border: "none", borderRadius: 6, cursor: "pointer" }}>Add all {count} to this project</button>
            <button style={{ height: 26, padding: "0 12px", fontFamily: F, fontSize: 11, fontWeight: 500, color: T2, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Review individually</button>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Right sidebar tabs -----------------------------------------------------------
// Source type badge mapping for workspace
const SOURCE_TYPE_TIER: Record<string, string> = { gov: "Official", reg: "Official", ngo: "Wire", res: "Original", media: "Wire", esg: "Wire" };
const AMBER = "#EF9F27";

interface ProjectEntity {
  id: string;
  entity_id: string;
  entities: { id: string; name: string; entity_type: string } | null;
}
interface EntitySearchResult { id: string; name: string; entity_type: string; mention_count: number }

function SourcesTabContent({
  stories, docs, autoEntries, newCount, prevViewedAt, projectEntities, entityError,
  onAddEntity, onRemoveEntity, onStoryOpen,
}: {
  stories: SourceStory[];
  docs: { id: string; title: string; updated_at: string }[];
  autoEntries: AutoEntry[];
  newCount: number;
  prevViewedAt: string | null;
  projectEntities: ProjectEntity[];
  entityError: string | null;
  onAddEntity: (entityId: string) => Promise<void>;
  onRemoveEntity: (entityId: string) => Promise<void>;
  onStoryOpen: (storyId: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCount = stories.length + docs.length;
  const prevTime = prevViewedAt ? new Date(prevViewedAt).getTime() : 0;

  const tierColors: Record<string, { bg: string; color: string; border: string }> = {
    Original: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
    Wire: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
    Official: { bg: "#F5F3FF", color: "#7C3AED", border: "#EDE9FE" },
  };
  const typeColors: Record<string, { bg: string; color: string }> = {
    PDF: { bg: "#FEF2F2", color: "#EF4444" },
    URL: { bg: "#DBEAFE", color: "#1D4ED8" },
    Doc: { bg: "#F0FDF4", color: "#22C55E" },
  };

  const runSearch = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const r = await fetch(`/api/entities/search?q=${encodeURIComponent(q)}`);
      if (r.ok) { const d = await r.json(); setSearchResults(d.entities || []); }
    } catch {}
    setSearchLoading(false);
  };

  const handleAddEntity = async (entityId: string) => {
    setAdding(entityId);
    await onAddEntity(entityId);
    setAdding(null);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div>
      {/* ── Explainer header (always visible) ───────────────────── */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BD}` }}>
        <p style={{ fontFamily: F, fontSize: 13, color: T2, lineHeight: 1.65, margin: "0 0 8px" }}>
          Pick the people, companies, and bodies you want to follow.
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: T2, lineHeight: 1.65, margin: 0 }}>
          Tideline attaches relevant stories as they arrive.
        </p>
      </div>

      {/* ── Entity chips panel ──────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${BD}`, padding: "10px 12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {projectEntities.map(pe => (
            <span key={pe.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 11, color: T1, border: `1px solid ${BD}`, borderRadius: 999, padding: "3px 8px 3px 10px", background: WHITE }}>
              {pe.entities?.name ?? "Unknown"}
              <button onClick={() => onRemoveEntity(pe.entity_id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: T4, fontSize: 13, display: "flex", alignItems: "center" }} title="Remove">{"\u00D7"}</button>
            </span>
          ))}
          <button onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); setSearchResults([]); }} style={{ fontFamily: F, fontSize: 11, color: TEAL, border: `1px solid ${TEAL}`, borderRadius: 999, padding: "3px 10px", background: WHITE, cursor: "pointer" }}>
            {searchOpen ? "Cancel" : "+ Add entity"}
          </button>
        </div>
        {searchOpen && (
          <div style={{ marginTop: 8 }}>
            <input
              autoFocus value={searchQuery}
              onChange={e => {
                const v = e.target.value;
                setSearchQuery(v);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => runSearch(v), 300);
              }}
              placeholder="Search entities..."
              style={{ width: "100%", padding: "6px 10px", fontFamily: F, fontSize: 12, border: `1px solid ${BD}`, borderRadius: 4, outline: "none", boxSizing: "border-box" }}
            />
            {searchLoading && <div style={{ fontFamily: F, fontSize: 11, color: T4, padding: "6px 2px" }}>Searching...</div>}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 4, border: `1px solid ${BD}`, borderRadius: 4, overflow: "hidden" }}>
                {searchResults.map(e => (
                  <button key={e.id} onClick={() => handleAddEntity(e.id)} disabled={adding === e.id}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", fontFamily: F, fontSize: 12, color: T1, background: adding === e.id ? BG : WHITE, border: "none", borderBottom: `1px solid ${BD}`, cursor: "pointer" }}>
                    {e.name}<span style={{ fontFamily: F, fontSize: 10, color: T4, marginLeft: 6 }}>{e.entity_type}</span>
                  </button>
                ))}
              </div>
            )}
            {entityError && <div style={{ fontFamily: F, fontSize: 13, color: "#E24B4A", marginTop: 5 }}>{entityError}</div>}
          </div>
        )}
      </div>

      {/* ── 'N new since your last visit' badge ─────────────────── */}
      {newCount > 0 && (
        <div style={{ borderLeft: `3px solid ${AMBER}`, margin: "10px 12px 0", padding: "7px 10px" }}>
          <span style={{ fontFamily: F, fontSize: 12, color: T2, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{newCount}</span>{" "}
            {newCount === 1 ? "new since your last visit" : "new since your last visit"}
          </span>
        </div>
      )}

      {/* ── Attached stories stream ──────────────────────────────── */}
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Auto-attached entity_match entries -- amber border if new */}
        {autoEntries.map(e => {
          const isNew = prevViewedAt !== null && new Date(e.inserted_at).getTime() > prevTime;
          // Abbreviate entity name to fit the 20x20 badge: use up to 4 chars uppercase.
          // Most ocean governance entities have 2-4 char acronyms (ISA, IMO, BBNJ, OSPAR).
          const entityBadge = e.matched_entity_name
            ? e.matched_entity_name.replace(/[^A-Z]/g, "").slice(0, 4) ||
              e.matched_entity_name.slice(0, 4).toUpperCase()
            : "AUTO";
          return (
            <div key={e.id} onClick={() => onStoryOpen(e.story_id)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 8, border: `1px solid ${BD}`, borderLeft: isNew ? `3px solid ${AMBER}` : `1px solid ${BD}`, borderRadius: 7, background: WHITE, cursor: "pointer" }}>
              <span style={{ width: 20, height: 20, borderRadius: 3, background: "rgba(239,159,39,0.10)", color: AMBER, fontFamily: F, fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: "0.04em" }}>{entityBadge}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FUI, fontSize: 11.5, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.story_title ?? "Untitled"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  {e.story_source && <span style={{ fontFamily: F, fontSize: 9.5, color: T4 }}>{e.story_source}</span>}
                  {e.story_date && <span style={{ fontFamily: F, fontSize: 9.5, color: T4 }}>{fmtDate(e.story_date)}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Manually attached stories */}
        {stories.map(s => {
          const tierLabel = SOURCE_TYPE_TIER[s.source_type || ""] || "Wire";
          const tier = tierColors[tierLabel] || tierColors.Wire;
          const tc = typeColors.URL;
          return (
            <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 8, border: `1px solid ${BD}`, borderRadius: 7, background: WHITE, position: "relative" }}>
              <span style={{ width: 20, height: 20, borderRadius: 3, background: tc.bg, color: tc.color, fontFamily: F, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>URL</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FUI, fontSize: 11.5, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                {s.short_summary && <div style={{ fontFamily: F, fontSize: 10.5, color: T3, lineHeight: 1.45, marginTop: 2 }}>{s.short_summary}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5, marginTop: 6 }}>
                  <span style={{ fontFamily: F, fontSize: 9.5, color: T4 }}>{s.source_name}</span>
                  <span style={{ fontFamily: M, fontSize: 8.5, fontWeight: 500, textTransform: "uppercase", padding: "1px 5px", borderRadius: 3, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>{tierLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
        {docs.map(d => {
          const tc = typeColors.Doc;
          return (
            <div key={d.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 8, border: `1px solid ${BD}`, borderRadius: 7, background: WHITE }}>
              <span style={{ width: 20, height: 20, borderRadius: 3, background: tc.bg, color: tc.color, fontFamily: F, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>Doc</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FUI, fontSize: 11.5, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontFamily: F, fontSize: 9.5, color: T4, marginTop: 4 }}>Updated {fmtDate(d.updated_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RightSidebar({ stories, docs, projectId, onStoryOpen }: { stories: SourceStory[]; docs: { id: string; title: string; updated_at: string }[]; projectId: string | null; onStoryOpen: (storyId: string) => void }) {
  const [autoEntries, setAutoEntries] = useState<AutoEntry[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [prevViewedAt, setPrevViewedAt] = useState<string | null>(null);
  const [projectEntities, setProjectEntities] = useState<ProjectEntity[]>([]);
  const [entityError, setEntityError] = useState<string | null>(null);

  // Fetch auto-entries + project entities whenever the active project changes
  useEffect(() => {
    if (!projectId) {
      setAutoEntries([]); setNewCount(0); setPrevViewedAt(null); setProjectEntities([]);
      return;
    }
    // Entries (also atomically updates last_viewed_at via touch_project_viewed)
    fetch(`/api/project-entries/${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const entityRows = (d.entries || []).filter((e: AutoEntry) => e.entry_type === "entity_match");
        setAutoEntries(entityRows);
        setNewCount(d.new_count ?? 0);
        setPrevViewedAt(d.prev_viewed_at ?? null);
      })
      .catch(() => {});

    // Tracked entities (for chips panel)
    fetch(`/api/project-entities?project_id=${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProjectEntities(d.project_entities || []); })
      .catch(() => {});
  }, [projectId]);

  const addEntity = async (entityId: string) => {
    setEntityError(null);
    if (!projectId) return;
    const r = await fetch("/api/project-entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, entity_id: entityId }),
    });
    if (r.status === 422) { setEntityError("Max 10 entities per workspace"); return; }
    if (r.status === 409) { setEntityError("Already tracking this entity"); return; }
    if (!r.ok) { setEntityError("Failed to add entity"); return; }
    // Refresh chips
    fetch(`/api/project-entities?project_id=${projectId}`)
      .then(r2 => r2.ok ? r2.json() : null)
      .then(d => { if (d) setProjectEntities(d.project_entities || []); })
      .catch(() => {});
  };

  const removeEntity = async (entityId: string) => {
    setEntityError(null);
    if (!projectId) return;
    await fetch("/api/project-entities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, entity_id: entityId }),
    });
    setProjectEntities(prev => prev.filter(pe => pe.entity_id !== entityId));
  };

  return (
    <div style={{ width: 320, background: WHITE, borderLeft: `1px solid ${BD}`, flexShrink: 0, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Section header */}
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: "0.12em" }}>Sources</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <SourcesTabContent
          stories={stories} docs={docs}
          autoEntries={autoEntries} newCount={newCount} prevViewedAt={prevViewedAt}
          projectEntities={projectEntities} entityError={entityError}
          onAddEntity={addEntity} onRemoveEntity={removeEntity}
          onStoryOpen={onStoryOpen}
        />
      </div>
    </div>
  );
}

// -- Floating dock + slide-up panels ----------------------------------------------
function FloatingDock({ onUpload, onAsk, onDraft }: { onUpload: () => void; onAsk: () => void; onDraft: () => void }) {
  return (
    <>
    <style>{`
      .floating-dock { position: fixed; bottom: 24px; right: 336px; display: flex; align-items: center; gap: 8px; z-index: 60; }
      @media (max-width: 1023px) {
        .floating-dock { bottom: 72px !important; right: 16px !important; z-index: 100 !important; }
      }
    `}</style>
    <div className="floating-dock">
      <button onClick={onUpload} style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px",
        fontFamily: F, fontSize: 12, fontWeight: 500, color: T3,
        background: WHITE, border: `1px solid ${BD}`, borderRadius: 20, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "all 0.15s",
      }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6.5 9V2M6.5 2L4 4.5M6.5 2L9 4.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 8v2a1 1 0 01-1 1H3a1 1 0 01-1-1V8" strokeLinecap="round"/></svg>
        Upload
      </button>
      <button onClick={onAsk} style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px",
        fontFamily: F, fontSize: 12, fontWeight: 500, color: T1,
        background: WHITE, border: `1px solid ${BD}`, borderRadius: 20, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "all 0.15s",
      }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6.5" cy="6.5" r="5"/><path d="M5 5a1.5 1.5 0 113 0c0 1-1.5 1-1.5 2M6.5 9.5v0.5"/></svg>
        Ask Tideline
      </button>
      <button onClick={onDraft} style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px",
        fontFamily: F, fontSize: 12, fontWeight: 500, color: WHITE,
        background: TEAL, border: `1px solid ${TEAL}`, borderRadius: 20, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(29,158,117,0.2)", transition: "all 0.15s",
      }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#17906A"; (e.currentTarget as HTMLElement).style.borderColor = "#17906A"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(29,158,117,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = TEAL; (e.currentTarget as HTMLElement).style.borderColor = TEAL; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(29,158,117,0.2)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 2l2 2-7 7H2v-2l7-7z" strokeLinejoin="round"/></svg>
        Draft from notes
      </button>
    </div>
    </>
  );
}

function FloatingAskPanel({ onClose, insertIntoNotes, onSourcesFound }: { onClose: () => void; insertIntoNotes: (text: string) => void; onSourcesFound?: (sources: AskSource[]) => void }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AskSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", onClick), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", onClick); };
  }, [onClose]);

  const ask = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    try {
      const r = await fetch("/api/workspace/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: query.trim() }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Request failed"); return; }
      if (d.answer) setAnswer(d.answer);
      if (d.sources) { setSources(d.sources); onSourcesFound?.(d.sources); }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div ref={ref} style={{
      position: "fixed", bottom: 70, right: 360, width: 440, maxHeight: "72vh", overflowY: "auto",
      background: WHITE, border: `1px solid ${BD}`, borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 60, padding: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T1 }}>Ask Tideline</div>
        <button onClick={onClose} style={{ width: 24, height: 24, background: "none", border: "none", color: T3, fontSize: 14, cursor: "pointer", lineHeight: 1 }}>x</button>
      </div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: T3, marginBottom: 12 }}>Ask a question, paste the answer straight into your notes.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Type your question..." autoFocus style={{ flex: 1, height: 36, padding: "0 12px", fontFamily: F, fontSize: 13, color: T1, border: `1px solid ${BD}`, borderRadius: 7, outline: "none" }} />
        <button onClick={ask} disabled={!query.trim() || loading} style={{ height: 36, padding: "0 16px", fontFamily: F, fontSize: 13, fontWeight: 600, color: WHITE, background: query.trim() && !loading ? TEAL : "#BDC1C6", border: "none", borderRadius: 7, cursor: query.trim() && !loading ? "pointer" : "default" }}>{loading ? "Searching..." : "Ask"}</button>
      </div>
      {loading && <div style={{ marginTop: 10, fontFamily: F, fontSize: 12, color: T4 }}>Searching library and primary sources...</div>}
      {error && <div style={{ marginTop: 10, fontFamily: F, fontSize: 12, color: "#D93025" }}>{error}</div>}
      {answer && (
        <>
          <button onClick={() => { insertIntoNotes(`Q: ${query}\n\n${answer}`); onClose(); }} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL, background: WHITE, border: `1px solid ${TEAL}`, borderRadius: 6, cursor: "pointer", marginBottom: 10 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2" width="6" height="8" rx="1"/><path d="M5 1h2"/></svg>
            Paste into notes
          </button>
          <div style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 14, fontFamily: F, fontSize: 13, color: T1, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer}</div>
          {sources.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: T4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Sources ({sources.length})</div>
              {sources.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: F, fontSize: 11, color: T3, lineHeight: 1.5, marginBottom: 2 }}>
                  <span style={{ color: TEAL, flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
                  <span>
                    {s.document_id ? <a href="#" onClick={async (e) => { e.preventDefault(); const res = await fetch(`/api/library/signed-url?id=${s.document_id}`); const d = await res.json(); if (d.url) window.open(d.url, "_blank"); }} style={{ color: TEAL, textDecoration: "none", cursor: "pointer" }}>{s.title}</a> : s.title}
                    {s.source_organisation && <span style={{ color: T4 }}> {"\u2014"} {s.source_organisation}</span>}
                    {s.published_date && <span style={{ color: T4 }}> ({s.published_date})</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { insertIntoNotes(`Q: ${query}\n\n${answer}`); onClose(); }} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL, background: WHITE, border: `1px solid ${TEAL}`, borderRadius: 6, cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="2" width="6" height="8" rx="1"/><path d="M5 1h2"/></svg>
            Paste into notes
          </button>
        </>
      )}
    </div>
  );
}

function FloatingDraftPanel({ onClose, sourceCount, insertIntoNotes, projectId, projectName, notesText, sources, onToast }: { onClose: () => void; sourceCount: number; insertIntoNotes: (text: string) => void; projectId?: string | null; projectName?: string; notesText?: string; sources: { name: string; summary?: string }[]; onToast: (msg: string) => void }) {
  const router = useRouter();
  const [format, setFormat] = useState("Situation report");
  const [tone, setTone] = useState("Journalistic");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", onClick), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", onClick); };
  }, [onClose]);

  const formats = ["Situation report", "Executive briefing", "Investigation memo", "Newsletter", "Timeline"];
  const tones = ["Journalistic", "Analytical", "Formal", "Plain English"];

  const pillStyle = (selected: boolean): React.CSSProperties => ({
    display: "inline-block", padding: "4px 11px", fontFamily: F, fontSize: 11.5,
    fontWeight: selected ? 600 : 500,
    border: `1px solid ${selected ? TEAL : BD}`, borderRadius: 20, cursor: "pointer",
    background: selected ? "rgba(29,158,117,0.08)" : WHITE,
    color: selected ? TEAL : T3,
  });

  const compile = async () => {
    if (!projectId) {
      onToast("Save this project first before drafting.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/draft/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesText || "",
          sources: sources.map(s => ({ name: s.name, summary: s.summary })),
          format,
          tone,
          projectName: projectName || "",
        }),
      });
      if (!res.ok) throw new Error("compile failed");
      router.push(`/platform/projects/${projectId}/draft`);
    } catch {
      onToast("Draft failed \u2014 please try again");
      setLoading(false);
    }
  };

  return (
    <div ref={ref} style={{
      position: "fixed", bottom: 70, right: 360, width: 440, maxHeight: "72vh", overflowY: "auto",
      background: WHITE, border: `1px solid ${BD}`, borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 60, padding: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T1 }}>Draft from notes</div>
        <button onClick={onClose} style={{ width: 24, height: 24, background: "none", border: "none", color: T3, fontSize: 14, cursor: "pointer", lineHeight: 1 }}>x</button>
      </div>
      <div style={{ fontFamily: F, fontSize: 11.5, color: T3, marginBottom: 14 }}>Tideline compiles your notes and {sourceCount} attached sources into a structured draft, you write the final version.</div>
      <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 500, color: T3, marginBottom: 7 }}>Format</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {formats.map(f => <span key={f} onClick={() => setFormat(f)} style={pillStyle(format === f)}>{f}</span>)}
      </div>
      <div style={{ fontFamily: F, fontSize: 10.5, fontWeight: 500, color: T3, marginBottom: 7 }}>Tone</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {tones.map(t => <span key={t} onClick={() => setTone(t)} style={pillStyle(tone === t)}>{t}</span>)}
      </div>
      <button onClick={compile} disabled={loading} style={{ width: "100%", height: 38, fontFamily: F, fontSize: 13, fontWeight: 600, color: WHITE, background: TEAL, border: "none", borderRadius: 7, cursor: loading ? "default" : "pointer" }}>{loading ? "Compiling..." : "Compile my notes"}</button>
      {loading && <div style={{ fontFamily: F, fontSize: 11, color: T3, marginTop: 8 }}>Compiling your notes and sources...</div>}
      {draft && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: F, fontSize: 10.5, fontWeight: 500, color: T4 }}>Your draft, edit freely</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={compile} style={{ height: 26, padding: "0 10px", fontFamily: F, fontSize: 11, fontWeight: 500, color: T2, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Regenerate</button>
              <button onClick={() => { insertIntoNotes(draft); onClose(); }} style={{ height: 26, padding: "0 10px", fontFamily: F, fontSize: 11, fontWeight: 500, color: WHITE, background: "#202124", border: "none", borderRadius: 6, cursor: "pointer" }}>Copy to notes</button>
            </div>
          </div>
          <div contentEditable suppressContentEditableWarning style={{ border: `1px solid ${BD}`, borderRadius: 7, padding: 14, fontFamily: F, fontSize: 13, lineHeight: 1.75, color: T1, outline: "none", minHeight: 100 }}>{draft}</div>
        </div>
      )}
    </div>
  );
}

// -- Citation block builder (shared by in-drawer cite and paste handler) ---------
function buildCitationBlock(text: string, sourceName: string, sourceUrl: string, sourceDate?: string | null) {
  const dateStr = sourceDate
    ? `, ${new Date(sourceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  const attribution = `\u2014 ${sourceName}${dateStr} \u00B7 `;
  return {
    type: "blockquote",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", marks: [{ type: "italic" }], text }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: attribution },
          { type: "text", marks: [{ type: "link", attrs: { href: sourceUrl, target: "_blank", rel: "noopener noreferrer", class: null } }], text: "Read source" },
        ],
      },
    ],
  };
}

// -- Story reading drawer ---------------------------------------------------------
function StoryDrawer({
  storyId,
  onClose,
  onCite,
}: {
  storyId: string | null;
  onClose: () => void;
  onCite: (text: string, sourceName: string, sourceUrl: string, sourceDate?: string | null) => void;
}) {
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citeButtonPos, setCiteButtonPos] = useState<{ x: number; y: number; text: string } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !drawerRef.current) { setCiteButtonPos(null); return; }
    if (!drawerRef.current.contains(sel.anchorNode)) { setCiteButtonPos(null); return; }
    const text = sel.toString().trim();
    if (!text) { setCiteButtonPos(null); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setCiteButtonPos({ x: rect.left + rect.width / 2, y: rect.top, text });
  };

  useEffect(() => {
    if (!storyId) { setStory(null); setError(""); return; }
    setLoading(true);
    setError("");
    setStory(null);
    fetch(`/api/stories?id=${storyId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const s = d.story || (d.stories && d.stories[0]);
        if (!s) throw new Error("not found");
        setStory(s);
      })
      .catch(() => setError("Could not load story."))
      .finally(() => setLoading(false));
  }, [storyId]);

  if (!storyId) return null;

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 400,
      background: WHITE, borderLeft: `1px solid ${BD}`, zIndex: 200,
      overflowY: "auto", boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
    }}>
      {/* Header row with close button */}
      <div style={{
        position: "sticky", top: 0, background: WHITE,
        borderBottom: `1px solid ${BD}`, padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 1,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, background: "none", border: "none",
            cursor: "pointer", color: T3, fontSize: 20, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          aria-label="Close"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Floating Cite button — appears above text selection */}
      {citeButtonPos && story && (
        <button
          onMouseDown={e => {
            e.preventDefault(); // don't lose selection before we read it
            onCite(citeButtonPos.text, story.source_name, story.link, story.published_at);
            setCiteButtonPos(null);
            window.getSelection()?.removeAllRanges();
          }}
          style={{
            position: "fixed",
            left: citeButtonPos.x,
            top: citeButtonPos.y - 40,
            transform: "translateX(-50%)",
            zIndex: 300,
            background: NAVY, color: WHITE,
            fontFamily: F, fontSize: 12, fontWeight: 600,
            padding: "5px 12px", border: "none", borderRadius: 6,
            cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          Cite
        </button>
      )}

      {/* Scrollable content — drawerRef lives here for selection check */}
      <div ref={drawerRef} onMouseUp={handleMouseUp} style={{ padding: "20px 24px 40px" }}>
        {loading && (
          <div style={{ fontFamily: F, fontSize: 13, color: T4, paddingTop: 40, textAlign: "center" }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{ fontFamily: F, fontSize: 13, color: "#D93025", paddingTop: 40, textAlign: "center" }}>
            {error}
          </div>
        )}
        {story && (
          <>
            {/* Source badge */}
            <div style={{
              fontFamily: M, fontSize: 10, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: T4, marginBottom: 10,
            }}>
              {story.source_name}
            </div>

            {/* Title — DM Sans 700, matches story/[id] page */}
            <h2 style={{
              fontFamily: F, fontSize: 22, fontWeight: 700, lineHeight: 1.3,
              color: T1, margin: "0 0 10px", letterSpacing: "-0.02em",
            }}>
              {story.title}
            </h2>

            {/* Date */}
            <div style={{ fontFamily: M, fontSize: 11, color: T4, marginBottom: 20 }}>
              {story.published_at
                ? new Date(story.published_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : ""}
            </div>

            {/* Tideline brief block — teal-bordered, matches story/[id] page pattern */}
            {(story.short_summary || story.full_summary) ? (
              <div style={{
                background: WHITE, border: `1px solid ${BD}`,
                borderLeft: `3px solid ${TEAL}`, borderRadius: 10,
                padding: "18px 20px", marginBottom: 20,
              }}>
                <p style={{ fontFamily: F, fontSize: 14, lineHeight: 1.7, color: T1, margin: 0 }}>
                  {story.short_summary || story.full_summary}
                </p>
                {story.short_summary && story.full_summary && (
                  <p style={{
                    fontFamily: F, fontSize: 14, lineHeight: 1.7, color: T2,
                    margin: "14px 0 0", paddingTop: 14, borderTop: `1px solid ${BD}`,
                  }}>
                    {story.full_summary}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ fontFamily: F, fontSize: 14, color: T4, marginBottom: 20 }}>
                Summary pending.
              </div>
            )}

            {/* Actions row — View original + Quote from this story */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <a
                href={story.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: F, fontSize: 13, fontWeight: 500, color: T2,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", border: `1px solid ${BD}`, borderRadius: R,
                  background: WHITE,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T3; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BD; }}
              >
                View original {"\u2197"}
              </a>
              <button
                onClick={() => onCite("", story.source_name, story.link, story.published_at)}
                style={{
                  fontFamily: F, fontSize: 13, fontWeight: 500, color: TEAL,
                  background: "none", border: `1px solid rgba(29,158,117,0.35)`,
                  borderRadius: R, padding: "6px 14px", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = TEAL_LIGHT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                Quote from this story
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// -- Main page --------------------------------------------------------------------
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [dockPanel, setDockPanel] = useState<"none" | "ask" | "draft">("none");
  const [drawerStoryId, setDrawerStoryId] = useState<string | null>(null);
  const [pendingCitation, setPendingCitation] = useState<{ text: string; sourceName: string; sourceUrl: string; sourceDate?: string | null } | null>(null);
  const pendingCitationRef = useRef(pendingCitation);
  useEffect(() => { pendingCitationRef.current = pendingCitation; }, [pendingCitation]);
  // Unmount cleanup — prevent stale pending-cite state surviving navigation
  useEffect(() => () => { setPendingCitation(null); }, []);
  const [askLibrarySources, setAskLibrarySources] = useState<AskSource[]>([]);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [projectStories, setProjectStories] = useState<SourceStory[]>([]);
  const [projectDocs, setProjectDocs] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [slashMenu, setSlashMenu] = useState<{ open: boolean; x: number; y: number; query: string; selected: number }>({ open: false, x: 0, y: 0, query: "", selected: 0 });
  const slashMenuRef = useRef(slashMenu);
  useEffect(() => { slashMenuRef.current = slashMenu; }, [slashMenu]);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const insertIntoNotes = (text: string) => {
    editor?.chain().focus("end").insertContent(`\n\n${text}`).run();
  };

  const handleCite = (text: string, sourceName: string, sourceUrl: string, sourceDate?: string | null) => {
    if (text.trim()) {
      // Text already selected in drawer — insert immediately
      editor?.chain().focus("end").insertContent(buildCitationBlock(text, sourceName, sourceUrl, sourceDate)).run();
    } else {
      // No selection — user will paste a passage; show banner and wait for paste
      setPendingCitation({ text: "", sourceName, sourceUrl, sourceDate });
    }
  };

  const handleUploaded = (dest: "private" | "network") => {
    setToast(dest === "private"
      ? "Added to your private library, encrypted and secure"
      : "Uploaded to the Tideline Network, thank you for growing our knowledge base");
  };

  const PROJECT_TYPE_TABS = [
    { id: "situation_report", label: "Situation" },
    { id: "investigation", label: "Investigation" },
    { id: "regulatory_watch", label: "Reg Watch" },
    { id: "briefing_note", label: "Briefing" },
    { id: "deal_monitor", label: "Deal" },
  ];

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocal = docId === "local";

  // Slash command definitions. Note: spec showed em dashes, replaced with commas per CLAUDE_RULES.md (no em dashes).
  const SLASH_COMMANDS = [
    { name: "Heading", desc: "Large section title", icon: "H", insert: "## " },
    { name: "Source", desc: "Link to an attached source", icon: "S", insert: "[[Source: ]]" },
    { name: "Quote", desc: "Block quote with attribution", icon: "\u201C", insert: "\"\", " },
    { name: "To-do", desc: "Action item to follow up", icon: "\u2610", insert: "[ ] " },
    { name: "Date", desc: "Insert today's date", icon: "D", insert: "__DATE__" },
    { name: "Divider", desc: "Horizontal rule", icon: "\u2015", insert: "\n---\n" },
  ];

  const sourceCount = projectStories.length + projectDocs.length;

  // Fetch draft indicator status (Feature 5)
  useEffect(() => {
    if (!projectId) { setDraftExists(false); setDraftUpdatedAt(null); return; }
    let cancelled = false;
    fetch(`/api/projects/${encodeURIComponent(projectId)}/draft`)
      .then(r => r.ok ? r.json() : { draft: null })
      .then(d => {
        if (cancelled) return;
        if (d?.draft) { setDraftExists(true); setDraftUpdatedAt(d.draft.updated_at || null); }
        else { setDraftExists(false); setDraftUpdatedAt(null); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  // Global keyboard shortcuts (Feature 3)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "u") {
        e.preventDefault();
        setUploadOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        setDockPanel(p => p === "ask" ? "none" : "ask");
      } else if (k === "d") {
        e.preventDefault();
        setDockPanel(p => p === "draft" ? "none" : "draft");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function applySlashCommand(cmd: typeof SLASH_COMMANDS[number]) {
    if (!editor) return;
    const { $head } = editor.state.selection;
    const lineStart = $head.pos - $head.parentOffset;
    let insertText = cmd.insert;
    if (cmd.name === "Date") {
      const d = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      insertText = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, `;
    }
    editor.chain().focus().deleteRange({ from: lineStart, to: $head.pos }).insertContent(insertText).run();
    setSlashMenu({ open: false, x: 0, y: 0, query: "", selected: 0 });
  }

  // Boot
  useEffect(() => {
    let cancelled = false;
    // Reset project-specific state before loading new project
    setProjectStories([]);
    setProjectDocs([]);
    setProjectId(null);
    setProjectType(null);
    setDetectedTopics([]);
    setFields({});
    setTitle("");
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

        // No projects and no param. Show creation panel
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
          if (d.stories) setProjectStories(d.stories);
          if (d.topics) setDetectedTopics(d.topics);
          const docs = d.documents || [];
          setProjectDocs(docs);
          if (!cancelled && docs.length > 0) {
            const docRes = await fetch(`/api/documents/${docs[0].id}`);
            if (docRes.ok) {
              const doc = await docRes.json();
              setDocId(doc.id); setDocContent(doc.content || null);
              if (doc.content?.fields) setFields(doc.content.fields);
              if (doc.title && doc.title !== "Untitled document" && doc.title !== "Project brief") setTitle(doc.title);
              else setTitle(projectName);
              setReady(true); return;
            }
          }
        }
        if (cancelled) return;
        setTitle(projectName);
        const createRes = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_name: projectName, title: "Untitled document" }) });
        console.log("[workspace] Document creation response status:", createRes.status);
        const createData = await createRes.json();
        console.log("[workspace] Document creation response:", JSON.stringify(createData));
        if (!createRes.ok) {
          console.error("[workspace] Document creation failed:", createData);
          setDocId("local"); setDocContent(null); setReady(true); return;
        }
        if (createData.id) { setDocId(createData.id); setDocContent(null); setReady(true); return; }
        setDocId("local"); setDocContent(null); setReady(true);
      } catch (err) {
        console.error("[workspace] Document creation error:", err);
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
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Placeholder.configure({ placeholder: "Add notes, evidence, or draft content here..." }), Typography],
    editorProps: {
      attributes: { style: `outline:none;min-height:200px;font-family:${F};font-size:14px;line-height:1.7;color:${T1};` },
      handleKeyDown: (_view, event) => {
        // Slash menu navigation
        if (slashMenuRef.current.open) {
          const filteredLen = SLASH_COMMANDS.filter(c => c.name.toLowerCase().startsWith(slashMenuRef.current.query.toLowerCase())).length || 1;
          if (event.key === "Escape") {
            setSlashMenu(prev => ({ ...prev, open: false }));
            return true;
          }
          if (event.key === "ArrowDown") {
            setSlashMenu(prev => ({ ...prev, selected: (prev.selected + 1) % filteredLen }));
            return true;
          }
          if (event.key === "ArrowUp") {
            setSlashMenu(prev => ({ ...prev, selected: (prev.selected - 1 + filteredLen) % filteredLen }));
            return true;
          }
          if (event.key === "Enter") {
            const q = slashMenuRef.current.query.toLowerCase();
            const filtered = SLASH_COMMANDS.filter(c => c.name.toLowerCase().startsWith(q));
            const pick = (filtered[slashMenuRef.current.selected] || filtered[0]);
            if (pick) { applySlashCommand(pick); return true; }
          }
        }
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
      // Slash menu detection (Feature 2)
      try {
        const { $head } = ed.state.selection;
        const lineText = $head.parent.textContent;
        const atEnd = $head.parentOffset === lineText.length;
        if (atEnd && lineText.startsWith("/") && !lineText.includes(" ")) {
          const coords = ed.view.coordsAtPos($head.pos);
          const query = lineText.slice(1);
          setSlashMenu(prev => ({
            open: true,
            x: coords.left,
            y: coords.bottom + 4,
            query,
            selected: prev.open ? prev.selected : 0,
          }));
        } else if (slashMenuRef.current.open) {
          setSlashMenu(prev => ({ ...prev, open: false }));
        }
      } catch {}
    },
  });

  useEffect(() => { return () => { if (saveTimer.current) clearTimeout(saveTimer.current); }; }, []);

  useEffect(() => {
    if (!editor || !docContent) return;
    const notes = (docContent as { notes?: unknown }).notes || docContent;
    if (notes && typeof notes === "object") {
      editor.commands.setContent(notes as Parameters<typeof editor.commands.setContent>[0]);
    }
  }, [docContent, editor]);

  // C4 — paste handler: intercepts when pending-cite banner is active
  useEffect(() => {
    const el = editor?.view?.dom;
    if (!el) return;
    const onPaste = (e: ClipboardEvent) => {
      const pending = pendingCitationRef.current;
      if (!pending) return;
      const text = (e.clipboardData?.getData("text/plain") ?? "").trim();
      if (!text) return; // clipboard guard — empty clipboard → fall through, keep banner open
      e.preventDefault();
      e.stopPropagation();
      editor?.chain().focus("end").insertContent(
        buildCitationBlock(text, pending.sourceName, pending.sourceUrl, pending.sourceDate)
      ).run();
      setPendingCitation(null);
    };
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [editor]);

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
      if (!projRes.ok) {
        const err = await projRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create project");
      }
      const projData = await projRes.json();
      const newDocId = projData.document_id;
      if (!newDocId) throw new Error("No document created");

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
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 20px 0 8px; font-family: ${FUI}; color: ${T1}; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 24px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
        .ProseMirror blockquote { border-left: 3px solid ${TEAL}; padding: 0 0 0 16px; background: transparent; margin: 12px 0; border-radius: 0; }
        .ProseMirror blockquote p { color: ${T2}; font-size: 13px; line-height: 1.6; }
        .ProseMirror blockquote p:first-child { font-weight: 500; }
        .ws-toolbar { display: none; }
        .ProseMirror:focus-within ~ .ws-toolbar-anchor .ws-toolbar { display: flex; }
      `}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: WHITE }}>
        {/* Toolbar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 36px", borderBottom: `1px solid ${BD}`, flexShrink: 0, background: WHITE }}>
          <div style={{ flex: 1 }} />
          <button onClick={() => setExportOpen(true)} style={{ height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 14px", fontSize: 13, fontWeight: 500, fontFamily: FUI, border: "none", borderRadius: 6, cursor: "pointer", background: "#202124", color: WHITE }}>Export report</button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 36px 100px" }}>
            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onBlur={() => saveTitle(title)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }} placeholder="Untitled project"
                style={{ flex: 1, minWidth: 0, fontSize: 28, fontWeight: 800, fontFamily: FUI, color: title ? T1 : T4, border: "none", outline: "none", background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
              {draftExists && (
                <span onClick={() => router.push(`/platform/projects/${encodeURIComponent(activeProject)}/draft`)} style={{ fontFamily: FUI, fontSize: 11, fontWeight: 500, color: "#1D9E75", background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 5, padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>Draft in progress {"\u2192"}</span>
              )}
            </div>

            {/* Header row: project type pill tabs + meta */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 3, borderRadius: 8 }}>
                {PROJECT_TYPE_TABS.map(t => {
                  const active = projectType === t.id;
                  return (
                    <span key={t.id} onClick={() => setProjectType(t.id)} style={{
                      padding: "6px 14px", fontFamily: FUI, fontSize: 12, borderRadius: 6, cursor: "pointer",
                      background: active ? WHITE : "transparent",
                      color: active ? T1 : "#6B7280",
                      fontWeight: active ? 500 : 400,
                      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    }}>{t.label}</span>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} />
                  <span style={{ fontFamily: F, fontSize: 10, color: T4 }}>Updated 2h ago</span>
                </span>
                <div style={{ display: "flex" }}>
                  {["LM", "EM", "JS"].map((init, i) => (
                    <span key={init} style={{ width: 24, height: 24, borderRadius: "50%", background: TEAL, color: WHITE, fontFamily: F, fontSize: 9, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `2px solid ${WHITE}`, marginLeft: i === 0 ? 0 : -6 }}>{init}</span>
                  ))}
                </div>
                <span style={{ fontFamily: F, fontSize: 10, color: T4 }}>Tracking {sourceCount} source{sourceCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Ask overlay (legacy slash command) */}
            {showAsk && (
              <div style={{ marginBottom: 20, padding: "14px 16px", background: WHITE, border: `1px solid ${BD}`, borderRadius: R }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={askInitialQuery || undefined} onChange={e => setAskInitialQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setShowAsk(false); }} placeholder={getPlaceholder(detectedTopics)}
                    style={{ flex: 1, height: 32, padding: "0 10px", fontSize: 13, fontFamily: F, color: T1, background: BG, border: `1px solid ${BD}`, borderRadius: R, outline: "none" }} />
                  <button onClick={() => setShowAsk(false)} style={btnSec({ height: 32 })}>Close</button>
                </div>
              </div>
            )}

            <NewSinceLastVisitBanner />

            {/* Structured fields */}
            {projectType && FIELD_SCHEMAS[projectType] && (
              <>
                <StructuredFields schema={FIELD_SCHEMAS[projectType]} fields={fields} onChange={handleFieldChange} />
                <div style={{ height: 16 }} />
              </>
            )}

            {/* Notes section label (Feature 1: word count) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: T4, textTransform: "uppercase", letterSpacing: "0.14em" }}>Notes &amp; evidence</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FUI, fontSize: 10, color: "#9AA0A6" }}>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                {wordCount >= 300 && <span style={{ fontFamily: FUI, fontSize: 10, color: "#1D9E75" }}>Ready to draft</span>}
              </div>
            </div>

            {/* Pending-cite banner */}
            {pendingCitation && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "rgba(29,158,117,0.06)", border: `1px solid rgba(29,158,117,0.25)`, borderRadius: 7, marginBottom: 10 }}>
                <span style={{ fontFamily: F, fontSize: 12, color: T2 }}>
                  Copy a passage from <strong>{pendingCitation.sourceName}</strong>, then paste here to cite it
                </span>
                <button onClick={() => setPendingCitation(null)} style={{ fontFamily: F, fontSize: 11, color: T4, background: "none", border: "none", cursor: "pointer", padding: "0 0 0 12px", flexShrink: 0 }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Tiptap notes editor */}
            <EditorContent editor={editor} />

            {/* Collapsible sources from Ask Tideline */}
            {askLibrarySources.length > 0 && (
              <div style={{ marginTop: 16, borderTop: "1px solid #E8EAED", paddingTop: 12 }}>
                <button
                  onClick={() => setSourcesExpanded(!sourcesExpanded)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F }}
                >
                  <span style={{ background: TEAL, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontFamily: M, fontWeight: 600 }}>
                    {askLibrarySources.length} {askLibrarySources.length === 1 ? "source" : "sources"}
                  </span>
                  <span style={{ fontSize: 12, color: T3, fontFamily: M }}>
                    {sourcesExpanded ? "\u25B2 hide" : "\u25BC show"}
                  </span>
                </button>
                {sourcesExpanded && (
                  <ol style={{ marginTop: 10, paddingLeft: 18, fontSize: 12, color: T2, fontFamily: F, lineHeight: 1.8 }}>
                    {askLibrarySources.map((s, i) => (
                      <li key={i}>
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            if (s.document_id) {
                              const res = await fetch(`/api/library/signed-url?id=${s.document_id}`);
                              const d = await res.json();
                              if (d.url) window.open(d.url, "_blank");
                            }
                          }}
                          style={{ color: TEAL, textDecoration: "none", cursor: s.document_id ? "pointer" : "default" }}
                        >
                          {s.title}
                        </a>
                        {s.source_organisation && (
                          <span style={{ color: T4 }}>{" "}&mdash; {s.source_organisation}</span>
                        )}
                        {s.published_date && (
                          <span style={{ color: T4 }}>{" "}({s.published_date.slice(0, 4)})</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Keyboard shortcuts hint bar (Feature 3) */}
            <div style={{ marginTop: 16, padding: "8px 0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderTop: "1px solid #F3F4F6" }}>
              {[
                { k: "\u2318K", label: "Search" },
                { k: "\u2318U", label: "Upload" },
                { k: "\u2318/", label: "Ask Tideline" },
                { k: "\u2318D", label: "Draft" },
                { k: "/", label: "Commands" },
              ].map(item => (
                <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <kbd style={{ fontFamily: FUI, fontSize: 9, background: "#F8F9FA", border: "1px solid #E5E7EB", borderRadius: 3, padding: "1px 6px" }}>{item.k}</kbd>
                  <span style={{ fontFamily: FUI, fontSize: 11, color: "#9AA0A6" }}>{item.label}</span>
                </span>
              ))}
            </div>

            {/* Intelligence timeline */}
            <div style={{ margin: "16px 0", border: "1px solid #F3F4F6", borderRadius: 10 }}>
              <div onClick={() => setTimelineOpen(o => !o)} style={{ padding: "10px 14px", background: "#F8F9FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#1D9E75" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 3.5v3l2 1.5" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: FUI, fontSize: 12, fontWeight: 500, color: "#202124" }}>Project intelligence timeline</span>
                  <span style={{ fontFamily: FUI, fontSize: 10, color: "#1D9E75", background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 10, padding: "1px 8px" }}>{sourceCount} sources</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9AA0A6" strokeWidth="1.5" style={{ transform: timelineOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {timelineOpen && (
                <div style={{ borderTop: "1px solid #F3F4F6", padding: 16 }}>
                  {sourceCount > 0 ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: F, fontSize: 11 }}>
                        <span style={{ color: "#5F6368" }}>Attached sources</span>
                        <span style={{ color: "#1D9E75", fontWeight: 500 }}>{projectStories.length} stories, {projectDocs.length} documents</span>
                      </div>
                      {projectStories.slice(0, 5).map(s => (
                        <div key={s.id} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", flexShrink: 0, marginTop: 4 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: FUI, fontSize: 11, fontWeight: 500, color: "#5F6368" }}>{fmtDate(s.published_at)}</div>
                            <div style={{ fontFamily: F, fontSize: 12, color: "#202124", lineHeight: 1.5, marginTop: 2 }}>{s.title}</div>
                            <div style={{ fontFamily: FUI, fontSize: 10, color: "#9AA0A6", marginTop: 3 }}>{s.source_name}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ fontFamily: F, fontSize: 12, color: T4, textAlign: "center", padding: "12px 0" }}>Save stories from the feed to start building your timeline.</div>
                  )}
                </div>
              )}
            </div>

            {/* Slash command menu (Feature 2) */}
            {slashMenu.open && (() => {
              const q = slashMenu.query.toLowerCase();
              const filtered = SLASH_COMMANDS.filter(c => c.name.toLowerCase().startsWith(q));
              if (filtered.length === 0) return null;
              return (
                <div style={{ position: "fixed", left: slashMenu.x, top: slashMenu.y, zIndex: 1000, width: 240, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                  <div style={{ padding: "6px 10px", fontFamily: FUI, fontSize: 10, color: "#9AA0A6", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>Commands</div>
                  {filtered.map((cmd, i) => {
                    const sel = i === slashMenu.selected;
                    return (
                      <div key={cmd.name} onMouseDown={e => { e.preventDefault(); applySlashCommand(cmd); }} onMouseEnter={() => setSlashMenu(prev => ({ ...prev, selected: i }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: sel ? "rgba(29,158,117,0.07)" : "transparent", cursor: "pointer" }}>
                        <div style={{ width: 28, height: 28, background: "#F8F9FA", border: "1px solid #F3F4F6", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FUI, fontSize: 13, color: "#5F6368" }}>{cmd.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: FUI, fontSize: 12.5, fontWeight: 500, color: "#202124" }}>{cmd.name}</div>
                          <div style={{ fontFamily: FUI, fontSize: 11, color: "#9AA0A6" }}>{cmd.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Selection-only format toolbar */}
            {editor && !editor.state.selection.empty && (
              <div style={{ position: "fixed", top: 100, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 2, padding: "4px 6px", background: "#202124", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
                {[
                  { label: "Bold", cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
                  { label: "Italic", cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
                  { label: "H2", cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
                  { label: "List", cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
                ].map(b => (
                  <button key={b.label} onMouseDown={e => { e.preventDefault(); b.cmd(); }} style={{ height: 28, padding: "0 10px", fontSize: 12, fontWeight: 500, fontFamily: FUI, color: "#fff", background: b.active ? "rgba(255,255,255,.2)" : "transparent", border: "none", borderRadius: 4, cursor: "pointer" }}>{b.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ height: 32, display: "flex", alignItems: "center", padding: "0 20px", borderTop: `1px solid ${BD}`, background: BG, flexShrink: 0 }}>
          <span style={{ fontFamily: F, fontSize: 11, color: T4 }}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Draft"}{" \u00B7 "}{wordCount} {wordCount === 1 ? "word" : "words"}{" \u00B7 "}{activeProject}
          </span>
        </div>
      </div>

      <RightSidebar stories={projectStories} docs={projectDocs} projectId={projectId} onStoryOpen={setDrawerStoryId} />

      <StoryDrawer
        storyId={drawerStoryId}
        onClose={() => setDrawerStoryId(null)}
        onCite={handleCite}
      />

      <FloatingDock onUpload={() => setUploadOpen(true)} onAsk={() => setDockPanel(p => p === "ask" ? "none" : "ask")} onDraft={() => setDockPanel(p => p === "draft" ? "none" : "draft")} />
      {dockPanel === "ask" && <FloatingAskPanel onClose={() => setDockPanel("none")} insertIntoNotes={insertIntoNotes} onSourcesFound={(src) => { const unique = src.filter((s, i, arr) => arr.findIndex(x => x.document_id === s.document_id) === i); setAskLibrarySources(unique); }} />}
      {dockPanel === "draft" && <FloatingDraftPanel onClose={() => setDockPanel("none")} sourceCount={sourceCount + askLibrarySources.length} insertIntoNotes={insertIntoNotes} projectId={projectId} projectName={activeProject} notesText={editor?.getText() || ""} sources={[...projectStories.map(s => ({ name: s.title, summary: s.short_summary || undefined })), ...askLibrarySources.map(s => ({ name: s.title, summary: `${s.source_organisation || ""} (${s.published_date || "n/d"})` }))]} onToast={setToast} />}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} docId={docId} isLocal={isLocal} />

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 32, transform: "translateX(-50%)", background: "#111827", color: WHITE, borderRadius: 7, fontFamily: F, fontSize: 12.5, fontWeight: 500, padding: "10px 18px", zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <DesktopOnly featureName="Workspace">
      <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: WHITE, color: T4, fontSize: 13 }}>Loading workspace...</div>}>
        <WorkspaceContent />
      </Suspense>
    </DesktopOnly>
  );
}
