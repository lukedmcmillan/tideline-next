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
const NAVY2  = "#0D1F35";
const TEAL   = "#1D9E75";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

interface NewStory { id: string; title: string; source_name: string; topic: string; published_at: string; short_summary?: string | null }
interface SourceStory { id: string; title: string; source_name: string; published_at: string; short_summary: string | null }

function decodeHtml(str: string): string {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018").replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D").replace(/&#8211;/g, "-").replace(/&#8212;/g, "\u2014").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

// ── Dismissed banners ────────────────────────────────────────────────────
function isDismissed(docId: string): boolean {
  try { const raw = localStorage.getItem("tideline_dismissed_banners"); if (raw) return JSON.parse(raw).includes(docId); } catch {} return false;
}
function dismissBanner(docId: string) {
  try { const raw = localStorage.getItem("tideline_dismissed_banners"); const arr: string[] = raw ? JSON.parse(raw) : []; if (!arr.includes(docId)) arr.push(docId); localStorage.setItem("tideline_dismissed_banners", JSON.stringify(arr.slice(-50))); } catch {}
}

// ── New stories banner ───────────────────────────────────────────────────
function NewStoriesBanner({ docId, topics, since, createdAt }: { docId: string; topics: string[]; since: string; createdAt?: string }) {
  const [stories, setStories] = useState<NewStory[]>([]);
  const [dismissed, setDismissed] = useState(() => isDismissed(docId));
  const isNew = createdAt && since && Math.abs(new Date(since).getTime() - new Date(createdAt).getTime()) < 60000;

  useEffect(() => {
    if (dismissed || isNew || topics.length === 0 || !since) return;
    fetch(`/api/projects/new-stories?topics=${topics.join(",")}&since=${since}`)
      .then(r => r.ok ? r.json() : { stories: [] })
      .then(d => setStories(d.stories || []))
      .catch(() => {});
  }, [topics.join(","), since, dismissed, isNew]);

  if (dismissed || isNew || stories.length === 0) return null;

  return (
    <div style={{ padding: "12px 24px", background: "rgba(29,158,117,.07)", borderBottom: `1px solid rgba(29,158,117,.15)`, display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T1, marginBottom: 4 }}>{stories.length} new {stories.length === 1 ? "story" : "stories"} on {topics[0] || "your topics"} since your last visit</div>
        {stories.map(s => (
          <a key={s.id} href={`/platform/story/${s.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: TEAL, lineHeight: 1.5, textDecoration: "none" }}>
            {decodeHtml(s.title).slice(0, 70)}{decodeHtml(s.title).length > 70 ? "..." : ""}
          </a>
        ))}
      </div>
      <button onClick={() => { setDismissed(true); dismissBanner(docId); }} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T3, fontSize: 14, flexShrink: 0 }}>{"\u00D7"}</button>
    </div>
  );
}

// ── /ask overlay ─────────────────────────────────────────────────────────
function AskOverlay({ editor, onClose }: { editor: ReturnType<typeof useEditor>; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!query.trim() || loading || !editor) return;
    setLoading(true);
    try {
      const r = await fetch("/api/research/inline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim() }) });
      const d = await r.json();
      if (d.answer) {
        editor.chain().focus().insertContent({
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", marks: [{ type: "italic" }], text: d.answer }] },
            { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Tideline Research" }, { type: "text", text: ` \u00B7 ${query.trim()}` }] },
          ],
        }).run();
      }
    } catch {}
    onClose();
  };

  return (
    <div style={{ marginBottom: 16, padding: "12px 16px", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke={TEAL} strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke={TEAL} strokeWidth="1.3" strokeLinecap="round"/></svg>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }} placeholder="Ask Tideline anything about ocean governance..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: F, color: T1, background: "transparent" }} />
        <button onClick={submit} disabled={!query.trim() || loading} style={{ height: 28, fontSize: 12, fontWeight: 500, fontFamily: F, color: "#fff", background: query.trim() && !loading ? NAVY : T4, border: "none", borderRadius: 4, padding: "0 12px", cursor: query.trim() ? "pointer" : "default" }}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

// ── Sources slide-out panel ──────────────────────────────────────────────
function SourcesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sources, setSources] = useState<SourceStory[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/stories?limit=8").then(r => r.ok ? r.json() : { stories: [] }).then(d => setSources(d.stories || [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={panelRef} style={{
      position: "fixed", right: 0, top: 64, width: 320, height: "calc(100vh - 64px)",
      background: WHITE, boxShadow: open ? "-4px 0 16px rgba(0,0,0,.08)" : "none",
      transform: open ? "translateX(0)" : "translateX(320px)",
      transition: "transform 0.2s ease",
      zIndex: 150, display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BLT}` }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Your sources</div>
          <div style={{ fontSize: 12, color: T4, marginTop: 2 }}>Click + Insert to add a reference to your document</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer", color: T3, fontSize: 14, flexShrink: 0 }}>{"\u00D7"}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {sources.map(s => (
          <div key={s.id} style={{ padding: "12px 20px", borderBottom: `1px solid ${BLT}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.35, marginBottom: 4 }}>{decodeHtml(s.title).slice(0, 60)}{decodeHtml(s.title).length > 60 ? "..." : ""}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T4 }}>{s.source_name} {s.published_at ? `\u00B7 ${fmtDate(s.published_at)}` : ""}</span>
              <button onClick={() => window.dispatchEvent(new CustomEvent("tideline:insert-citation", { detail: { title: s.title, source_name: s.source_name, published_at: s.published_at, short_summary: s.short_summary } }))} style={{ height: 28, fontSize: 12, fontWeight: 500, fontFamily: F, color: T2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 10px", cursor: "pointer" }}>+ Insert</button>
            </div>
          </div>
        ))}
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
  const [docUpdatedAt, setDocUpdatedAt] = useState<string | undefined>();
  const [docCreatedAt, setDocCreatedAt] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showSources, setShowSources] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [sourceCount, setSourceCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocal = docId === "local";

  // Boot: load or create document
  useEffect(() => {
    const projectName = projectParam || "Workspace";
    let cancelled = false;
    async function boot() {
      try {
        const projRes = await fetch(`/api/projects/${encodeURIComponent(projectName)}`);
        if (projRes.ok) {
          const d = await projRes.json();
          const docs = d.documents || [];
          if (!cancelled && docs.length > 0) {
            const docRes = await fetch(`/api/documents/${docs[0].id}`);
            if (docRes.ok) {
              const doc = await docRes.json();
              setDocId(doc.id); setDocContent(doc.content || null);
              setDocUpdatedAt(doc.updated_at); setDocCreatedAt(doc.created_at);
              if (doc.title && doc.title !== "Untitled document" && doc.title !== "Project brief") setTitle(doc.title);
              setReady(true); return;
            }
          }
        }
        if (cancelled) return;
        // Create new doc
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

  // Fetch source count
  useEffect(() => {
    fetch("/api/stories?limit=8").then(r => r.ok ? r.json() : { stories: [] }).then(d => setSourceCount((d.stories || []).length)).catch(() => {});
  }, []);

  // Auto-save
  const doSave = useCallback((ed: ReturnType<typeof useEditor>) => {
    if (!ed || isLocal || !docId) return;
    setSaveStatus("saving");
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: ed.getJSON(), content_text: ed.getText() }) })
      .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
      .catch(() => setSaveStatus("idle"));
  }, [docId, isLocal]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your brief, notes, or draft response. Type /ask to query Tideline intelligence." }),
      Typography,
    ],
    editorProps: {
      attributes: { style: `outline:none;min-height:calc(100vh - 200px);font-family:${F};font-size:14px;line-height:1.75;color:${T1};` },
      handleKeyDown: (_view, event) => {
        if (event.key === " " && editor) {
          const { $head } = editor.state.selection;
          const text = $head.parent.textContent;
          if (text.endsWith("/ask")) {
            const from = $head.pos - 4;
            editor.chain().deleteRange({ from, to: $head.pos }).run();
            setShowAsk(true);
            return true;
          }
        }
        return false;
      },
    },
    content: docContent || undefined,
    autofocus: "end",
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(ed), 2000);
    },
  });

  // Citation insert from sources panel
  useEffect(() => {
    const handler = (e: Event) => {
      if (!editor) return;
      const d = (e as CustomEvent).detail;
      if (!d?.title) return;
      const blocks: any[] = [
        { type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: decodeHtml(d.title) }] },
        { type: "paragraph", content: [{ type: "text", text: `${d.source_name || "Source"}${d.published_at ? ` \u00B7 ${fmtDate(d.published_at)}` : ""}` }] },
      ];
      if (d.short_summary) blocks.push({ type: "paragraph", content: [{ type: "text", marks: [{ type: "italic" }], text: d.short_summary }] });
      editor.chain().focus("end").insertContent({ type: "blockquote", content: blocks }).run();
    };
    window.addEventListener("tideline:insert-citation", handler);
    return () => window.removeEventListener("tideline:insert-citation", handler);
  }, [editor]);

  // Cleanup
  useEffect(() => { return () => { if (saveTimer.current) clearTimeout(saveTimer.current); }; }, []);

  const saveTitle = (val: string) => {
    if (isLocal || !docId) return;
    const t = val.trim() || "Untitled document";
    const tags = detectTopics(t);
    setDetectedTopics(tags);
    fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t, tags }) }).catch(() => {});
  };

  if (!ready) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T4, fontSize: 13, fontFamily: F }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: F, position: "relative" }}>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${T4}; pointer-events: none; height: 0; }
        .ProseMirror { outline: none; }
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; font-family: ${F}; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 20px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
        .ProseMirror blockquote { border-left: 2px solid ${TEAL}; padding: 12px 16px; background: rgba(29,158,117,.06); margin: 12px 0; border-radius: 6px; }
        .ProseMirror blockquote p { color: ${T2}; font-size: 13px; line-height: 1.65; }
        .ProseMirror blockquote p:first-child { font-weight: 500; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ height: 56, background: WHITE, boxShadow: "0 1px 3px rgba(0,0,0,.08)", display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0, zIndex: 10 }}>
        {/* Left: breadcrumb + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <a href="/platform/workspace" style={{ fontSize: 13, color: T3, textDecoration: "none", whiteSpace: "nowrap" }}>{"\u2190"} Workspace</a>
          <span style={{ color: BLT }}>/</span>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => { setTitleFocused(false); saveTitle(title); }}
            placeholder="Untitled project"
            style={{ flex: 1, fontSize: 14, fontWeight: 500, color: title ? T1 : T4, fontFamily: F, border: "none", outline: "none", background: "transparent", minWidth: 0 }}
          />
        </div>

        {/* Right: save status + buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: T4, whiteSpace: "nowrap" }}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved \u2713" : ""}
          </span>
          {/* Sources button — outlined */}
          <button onClick={() => setShowSources(!showSources)} style={{
            height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
            fontSize: 14, fontWeight: 500, fontFamily: F, color: T2, background: WHITE,
            border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2h8v11l-4-2.5L3 13V2z"/></svg>
            Sources ({sourceCount})
          </button>
          {/* Export button — primary raised */}
          <button onClick={() => { if (!isLocal && docId) window.open(`/api/documents/${docId}/export`, "_blank"); }} style={{
            height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
            fontSize: 14, fontWeight: 500, fontFamily: F, color: "#fff", background: NAVY,
            border: "none", borderRadius: 4, cursor: "pointer",
          }}>
            Export to Word {"\u2193"}
          </button>
        </div>
      </div>

      {/* ── NEW STORIES BANNER ── */}
      {!isLocal && docId && docUpdatedAt && detectedTopics.length > 0 && (
        <NewStoriesBanner docId={docId} topics={detectedTopics} since={docUpdatedAt} createdAt={docCreatedAt} />
      )}

      {/* ── EDITOR BODY ── */}
      <div style={{ flex: 1, overflowY: "auto", background: BG }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 120px" }}>
          {/* /ask overlay */}
          {showAsk && <AskOverlay editor={editor} onClose={() => setShowAsk(false)} />}

          {/* Document title */}
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => { setTitleFocused(false); saveTitle(title); }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
            placeholder="Untitled project"
            style={{ width: "100%", fontSize: 32, fontWeight: 500, color: title ? T1 : T4, fontFamily: F, border: "none", outline: "none", background: "transparent", padding: 0 }}
          />
          {/* Divider */}
          <div style={{ height: 1, background: BLT, margin: "16px 0 24px" }} />
          {/* Editor */}
          <EditorContent editor={editor} />
          {editor && editor.isEmpty && (
            <div style={{ fontSize: 12, color: T4, marginTop: 8 }}>Type /ask to query Tideline intelligence inline</div>
          )}
        </div>
      </div>

      {/* ── SOURCES PANEL ── */}
      <SourcesPanel open={showSources} onClose={() => setShowSources(false)} />

      {/* ── FLOATING FORMAT BAR ── */}
      {editor && !editor.state.selection.empty && (
        <div style={{ position: "fixed", top: 130, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: 2, padding: "4px 6px", background: NAVY, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
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
