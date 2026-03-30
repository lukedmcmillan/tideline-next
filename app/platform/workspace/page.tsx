"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";

// ── Design tokens ────────────────────────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const TEAL   = "#1D9E75";
const RED    = "#D93025";
const AMBER  = "#F9AB00";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

interface Project { name: string; count: number }
interface SavedStory { id: string; title: string; source_name: string; topic: string; published_at: string; short_summary: string | null }
interface DocMeta { id: string; title: string; updated_at: string; project_name: string }
interface Consultation { id: string; organisation: string; title: string; deadline: string; type: string }
interface NewStory { id: string; title: string; source_name: string; topic: string; published_at: string }

function decodeHtml(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&#8211;/g, "-").replace(/&#8212;/g, "\u2014").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Topic detection ──────────────────────────────────────────────────────
const TOPIC_MAP: Record<string, string[]> = {
  isa: ["dsm"], mining: ["dsm"], "deep-sea": ["dsm"],
  bbnj: ["governance"], treaty: ["governance"], governance: ["governance"],
  iuu: ["iuu"], fishing: ["iuu", "fisheries"],
  mpa: ["mpa"], "30x30": ["mpa"],
  finance: ["bluefinance"], bond: ["bluefinance"],
  shipping: ["shipping"], imo: ["shipping"],
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

// ── 1. Project Memory strip ──────────────────────────────────────────────
function NewStoriesStrip({ topics, since }: { topics: string[]; since: string }) {
  const [stories, setStories] = useState<NewStory[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (topics.length === 0 || !since) return;
    fetch(`/api/projects/new-stories?topics=${topics.join(",")}&since=${since}`)
      .then(r => r.ok ? r.json() : { stories: [] })
      .then(d => setStories(d.stories || []))
      .catch(() => {});
  }, [topics.join(","), since]);

  if (dismissed || stories.length === 0) return null;

  return (
    <div style={{ margin: "0 40px 16px", padding: "14px 18px", background: "rgba(29,158,117,.05)", borderLeft: `3px solid ${TEAL}`, borderRadius: 8, position: "relative" }}>
      <button onClick={() => setDismissed(true)} style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", color: T4, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{"\u00D7"}</button>
      <div style={{ fontSize: 12, fontWeight: 600, color: TEAL, marginBottom: 8 }}>{stories.length} new {stories.length === 1 ? "story" : "stories"} since your last visit</div>
      {stories.map(s => (
        <a key={s.id} href={`/platform/story/${s.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: T2, lineHeight: 1.5, textDecoration: "none", marginBottom: 2 }}>
          {decodeHtml(s.title)} <span style={{ color: T4 }}>({s.source_name})</span>
        </a>
      ))}
    </div>
  );
}

// ── 2. /ask inline research ──────────────────────────────────────────────
function AskOverlay({ editor, onClose }: { editor: ReturnType<typeof useEditor>; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!query.trim() || loading || !editor) return;
    setLoading(true);
    try {
      const r = await fetch("/api/research/inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const d = await r.json();
      if (d.answer) {
        editor.chain().focus()
          .insertContent(`<blockquote><p><em>${d.answer}</em></p><p style="font-size:11px;color:#1D9E75"><strong>Tideline Research</strong> · ${query.trim()}</p></blockquote>`)
          .run();
      }
    } catch {}
    onClose();
  };

  return (
    <div style={{ margin: "0 40px 12px", padding: "10px 14px", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, display: "flex", gap: 8, alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke={TEAL} strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke={TEAL} strokeWidth="1.3" strokeLinecap="round"/></svg>
      <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }} placeholder="Ask Tideline..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: F, color: T1, background: "transparent" }} />
      {loading && <span style={{ fontSize: 11, color: T4 }}>Thinking...</span>}
    </div>
  );
}

// ── 4. Auto-brief modal ──────────────────────────────────────────────────
function GenerateBriefModal({ docId, onClose, onGenerated }: { docId: string; onClose: () => void; onGenerated: (content: any) => void }) {
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const r = await fetch("/api/documents/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId, topic_keywords: keywords.split(",").map(k => k.trim()).filter(Boolean) }),
      });
      const d = await r.json();
      if (d.content) onGenerated(d.content);
    } catch {}
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: WHITE, borderRadius: 14, padding: "28px 32px", width: 400, boxShadow: "0 16px 48px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 8 }}>Generate a starting brief?</div>
        <div style={{ fontSize: 13, color: T3, marginBottom: 16 }}>Tideline will create a situation report from recent stories on your topic.</div>
        <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Topic keywords (e.g. ISA, mining, BBNJ)" style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 12px", outline: "none", color: T1, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, fontFamily: F, color: T3, background: "none", border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
          <button onClick={generate} disabled={generating} style={{ fontSize: 13, fontWeight: 600, fontFamily: F, color: "#fff", background: TEAL, border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", opacity: generating ? 0.6 : 1 }}>{generating ? "Generating..." : "Generate brief"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Editor area ──────────────────────────────────────────────────────────
function EditorArea({ docId, initialContent, updatedAt }: { docId: string; initialContent: any; updatedAt?: string }) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleLoaded = useRef(false);
  const isLocal = docId === "local";
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);

  const doSave = useCallback((editor: ReturnType<typeof useEditor>) => {
    if (!editor || isLocal) return;
    setSaveStatus("saving");
    const content = editor.getJSON();
    const content_text = editor.getText();
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, content_text }) })
      .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
      .catch(() => setSaveStatus("idle"));
  }, [docId, isLocal]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing. Notes, a draft response, your brief. Saves automatically." }),
      Typography,
    ],
    editorProps: {
      attributes: { style: `outline:none;min-height:400px;font-family:${F};font-size:14px;line-height:1.75;color:${T1};` },
      handleKeyDown: (_view, event) => {
        // Detect /ask command
        if (event.key === " " && editor) {
          const { $head } = editor.state.selection;
          const text = $head.parent.textContent;
          if (text.endsWith("/ask")) {
            // Remove /ask from the editor
            const from = $head.pos - 4;
            editor.chain().deleteRange({ from, to: $head.pos }).run();
            setShowAsk(true);
            return true;
          }
        }
        return false;
      },
    },
    content: initialContent || undefined,
    autofocus: "end",
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(editor), 2000);
    },
  });

  useEffect(() => {
    if (titleLoaded.current || isLocal) return;
    titleLoaded.current = true;
    fetch(`/api/documents/${docId}`)
      .then(r => { if (!r.ok) throw new Error("not ok"); return r.json(); })
      .then(d => { if (d.title && d.title !== "Untitled document" && d.title !== "Project brief") setTitle(d.title); })
      .catch(() => {});
  }, [docId, isLocal]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const saveTitle = (val: string) => {
    if (isLocal) return;
    const t = val.trim() || "Untitled document";
    const tags = detectTopics(t);
    setDetectedTopics(tags);
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t, tags }) }).catch(() => {});
  };

  const exportDoc = () => { if (!isLocal) window.open(`/api/documents/${docId}/export`, "_blank"); };

  const reloadContent = (content: any) => {
    if (editor && content) editor.commands.setContent(content);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Top bar: export only */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 16px", borderBottom: `1px solid ${BLT}`, background: WHITE, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={exportDoc} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, fontFamily: F, color: T3, background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>Export to Word {"\u2193"}</button>
        </div>
      </div>

      {/* Floating toolbar on text select */}
      {editor && !editor.state.selection.empty && (
        <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: 2, padding: "4px 6px", background: NAVY, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
          {[
            { label: "B", cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
            { label: "I", cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
            { label: "H2", cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
            { label: "\u2022", cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
          ].map(b => (
            <button key={b.label} onMouseDown={e => { e.preventDefault(); b.cmd(); }} style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 4, background: b.active ? "rgba(255,255,255,.2)" : "transparent", color: "#fff", cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 600 }}>{b.label}</button>
          ))}
        </div>
      )}

      {/* Editor content */}
      <div style={{ flex: 1, overflowY: "auto", background: WHITE }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 40px 80px" }}>
          {/* Project memory strip */}
          {!isLocal && updatedAt && detectedTopics.length > 0 && (
            <NewStoriesStrip topics={detectedTopics} since={updatedAt} />
          )}

          {/* /ask overlay */}
          {showAsk && <AskOverlay editor={editor} onClose={() => setShowAsk(false)} />}

          {/* Editable title */}
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => { setTitleFocused(false); saveTitle(title); }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
            placeholder="Untitled project"
            style={{ width: "100%", fontSize: 28, fontWeight: 600, letterSpacing: "-.025em", color: title ? T1 : T4, fontFamily: F, border: "none", outline: "none", background: titleFocused ? BG : "transparent", borderRadius: 6, padding: "4px 0", marginBottom: 24, transition: "background .15s" }}
          />
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Save indicator bottom-right */}
      {saveStatus !== "idle" && (
        <div style={{ position: "absolute", bottom: 16, right: 20, fontSize: 12, color: T4 }}>
          {saveStatus === "saving" ? "Saving..." : "Saved"}
        </div>
      )}
    </div>
  );
}

// ── 5. Consultation deadline widget ──────────────────────────────────────
function DeadlineWidget({ consultations }: { consultations: Consultation[] }) {
  const upcoming = consultations.slice(0, 3);
  if (upcoming.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 10 }}>Deadlines</div>
      {upcoming.map(c => {
        const days = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const dayColor = days <= 14 ? RED : days <= 60 ? AMBER : T4;
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BLT}` }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: dayColor, minWidth: 32, letterSpacing: "-.02em" }}>{days}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: T4 }}>{c.organisation}</div>
            </div>
          </div>
        );
      })}
      <a href="/platform/calendar" style={{ fontSize: 12, fontWeight: 500, color: TEAL, marginTop: 8, display: "block", textDecoration: "none" }}>View all in Calendar {"\u2192"}</a>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
function WorkspaceContent() {
  const searchParams = useSearchParams();
  const activeProject = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [library, setLibrary] = useState<SavedStory[]>([]);
  const [suggestedStories, setSuggestedStories] = useState<SavedStory[]>([]);
  const [allDocs, setAllDocs] = useState<DocMeta[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocContent, setActiveDocContent] = useState<any>(null);
  const [activeDocUpdatedAt, setActiveDocUpdatedAt] = useState<string | undefined>();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [tab, setTab] = useState<"brief" | "stories" | "intelligence">("brief");
  const [ready, setReady] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
    fetch("/api/stories/save?project_name=library").then(r => r.ok ? r.json() : { stories: [] }).then(d => setLibrary(d.stories || [])).catch(() => {});
    // Load suggested reading for empty projects state
    fetch("/api/stories?limit=5").then(r => r.ok ? r.json() : { stories: [] }).then(d => setSuggestedStories(d.stories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const projectName = activeProject || "Workspace";
    let cancelled = false;
    async function boot() {
      try {
        const projRes = await fetch(`/api/projects/${encodeURIComponent(projectName)}`);
        let docs: DocMeta[] = [];
        if (projRes.ok) {
          const d = await projRes.json();
          docs = d.documents || [];
          if (!cancelled) { setAllDocs(docs); setStories(d.stories || []); setConsultations(d.consultations || []); }
        }
        if (cancelled) return;
        if (docs.length > 0) { await loadDoc(docs[0].id); return; }
        const createRes = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_name: projectName, title: "Untitled document" }) });
        if (cancelled) return;
        if (createRes.ok) {
          const created = await createRes.json();
          if (created.id) { setAllDocs([{ id: created.id, title: created.title, updated_at: new Date().toISOString(), project_name: projectName }]); setActiveDocId(created.id); setActiveDocContent(null); setActiveDocUpdatedAt(undefined); setReady(true); return; }
        }
        setActiveDocId("local"); setActiveDocContent(null); setReady(true);
      } catch (err) {
        console.error("Workspace boot error:", err);
        if (!cancelled) { setActiveDocId("local"); setActiveDocContent(null); setReady(true); }
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [activeProject]);

  async function loadDoc(id: string) {
    try {
      const r = await fetch(`/api/documents/${id}`);
      if (r.ok) {
        const d = await r.json();
        setActiveDocId(d.id || id);
        setActiveDocContent(d.content || null);
        setActiveDocUpdatedAt(d.updated_at || undefined);
      } else { setActiveDocId(id); setActiveDocContent(null); }
    } catch { setActiveDocId(id); setActiveDocContent(null); }
    setReady(true);
  }

  async function createNewDoc() {
    const projectName = activeProject || "Workspace";
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_name: projectName, title: "Untitled document" }) });
      if (!res.ok) return;
      const created = await res.json();
      if (created.id) {
        const newDoc = { id: created.id, title: created.title, updated_at: new Date().toISOString(), project_name: projectName };
        setAllDocs(prev => [newDoc, ...prev]);
        setActiveDocId(created.id); setActiveDocContent(null); setActiveDocUpdatedAt(undefined);
        setReady(true); setTab("brief"); setEditorKey(k => k + 1);
        setShowBriefModal(true);
      }
    } catch {}
  }

  const tabs: { key: "brief" | "stories" | "intelligence"; label: string }[] = [
    { key: "brief", label: "Brief" },
    { key: "stories", label: `Saved stories (${stories.length})` },
    { key: "intelligence", label: "Intelligence" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: F }}>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${T4}; pointer-events: none; height: 0; }
        .ProseMirror { outline: none; }
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; font-family: ${F}; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 20px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
        .ProseMirror blockquote { border-left: 2px solid ${TEAL}; padding: 12px 16px; background: rgba(29,158,117,.05); margin: 12px 0; border-radius: 4px; }
        .ProseMirror blockquote p { font-style: italic; color: ${T2}; }
      `}</style>

      {/* Left panel */}
      <div style={{ width: 280, flexShrink: 0, background: WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em", marginBottom: 16 }}>Workspace</div>
          <button onClick={createNewDoc} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 500, fontFamily: F, color: "#fff", background: TEAL, border: "none", borderRadius: 8, padding: "9px 0", cursor: "pointer", marginBottom: 8 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v10M1 6h10" strokeLinecap="round"/></svg>
            New document
          </button>
        </div>

        {allDocs.length > 1 && (
          <div style={{ padding: "0 0 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 6px" }}>Documents</div>
            {allDocs.map(d => {
              const on = d.id === activeDocId;
              return (
                <button key={d.id} onClick={() => { loadDoc(d.id); setEditorKey(k => k + 1); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 20px", fontSize: 13, color: on ? T1 : T3, fontWeight: on ? 600 : 400, background: on ? BG : "transparent", border: "none", fontFamily: F, borderLeft: on ? `3px solid ${TEAL}` : "3px solid transparent", cursor: "pointer" }}>
                  {d.title === "Untitled document" || d.title === "Project brief" ? "Untitled" : d.title}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${BLT}`, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 6px" }}>Projects</div>
          {projects.length === 0 ? (
            <div style={{ padding: "0 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginTop: 12, marginBottom: 6 }}>Suggested reading</div>
              {suggestedStories.slice(0, 5).map(s => (
                <a key={s.id} href={`/platform/story/${s.id}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", fontSize: 12, color: T2, textDecoration: "none", lineHeight: 1.35 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, background: "rgba(29,158,117,.1)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>New</span>
                  <span>{decodeHtml(s.title).slice(0, 50)}</span>
                </a>
              ))}
            </div>
          ) : projects.map(p => {
            const on = activeProject === p.name;
            return (
              <a key={p.name} href={`/platform/workspace?project=${encodeURIComponent(p.name)}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", fontSize: 13, color: on ? T1 : T3, fontWeight: on ? 600 : 400, background: on ? BG : "transparent", textDecoration: "none", borderLeft: on ? `3px solid ${TEAL}` : "3px solid transparent" }}>
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: T4 }}>{p.count}</span>
              </a>
            );
          })}
        </div>

        <div style={{ borderTop: `1px solid ${BLT}`, marginTop: 8, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 8px" }}>Library</div>
          {library.length === 0 ? (
            <div style={{ fontSize: 13, color: T4, padding: "4px 20px" }}>No saved stories</div>
          ) : library.slice(0, 10).map(s => (
            <a key={s.id} href={`/platform/story/${s.id}`} style={{ display: "block", padding: "6px 20px", fontSize: 12, color: T2, textDecoration: "none", lineHeight: 1.4 }}>{decodeHtml(s.title)}</a>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: BG, overflow: "hidden" }}>
        <div style={{ background: WHITE, borderBottom: `1px solid ${BLT}`, padding: "0 24px", display: "flex", gap: 0, flexShrink: 0 }}>
          {tabs.map(t => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ fontSize: 13, fontWeight: on ? 600 : 400, color: on ? T1 : T4, background: "none", border: "none", fontFamily: F, borderBottom: on ? `2px solid ${TEAL}` : "2px solid transparent", padding: "12px 18px", cursor: "pointer" }}>{t.label}</button>
            );
          })}
        </div>

        {tab === "brief" && ready && activeDocId && (
          <EditorArea key={`${activeDocId}-${editorKey}`} docId={activeDocId} initialContent={activeDocContent} updatedAt={activeDocUpdatedAt} />
        )}
        {tab === "brief" && !ready && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T4, fontSize: 13 }}>Loading...</div>
        )}

        {tab === "stories" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            <DeadlineWidget consultations={consultations} />
            {stories.length === 0 && <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>No saved stories in this project. Save stories from the feed or story page.</div>}
            {stories.map(s => (
              <a key={s.id} href={`/platform/story/${s.id}`} style={{ display: "block", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", marginBottom: 8, textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T4, textTransform: "uppercase" }}>{s.source_name}</span>
                  <span style={{ fontSize: 11, color: T4 }}>{fmtDate(s.published_at)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 6 }}>{decodeHtml(s.title)}</div>
                {s.short_summary && <div style={{ fontSize: 13, color: T3, lineHeight: 1.55 }}>{s.short_summary.slice(0, 150)}...</div>}
              </a>
            ))}
          </div>
        )}

        {tab === "intelligence" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Upcoming consultations</div>
            {consultations.length === 0 && <div style={{ fontSize: 13, color: T4, padding: "20px 0" }}>No consultations linked to this project's topics.</div>}
            {consultations.map(c => {
              const days = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={c.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 20px", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T4, textTransform: "uppercase" }}>{c.organisation}</span>
                    <span style={{ fontSize: 11, color: days <= 14 ? RED : T4 }}>{days} days</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4 }}>{c.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBriefModal && activeDocId && activeDocId !== "local" && (
        <GenerateBriefModal docId={activeDocId} onClose={() => setShowBriefModal(false)} onGenerated={(content) => { setActiveDocContent(content); setEditorKey(k => k + 1); }} />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#9AA0A6", fontSize: 13 }}>Loading workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
