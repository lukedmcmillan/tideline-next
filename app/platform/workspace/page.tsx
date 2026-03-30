"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";

// ── Design tokens ────────────────────────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const TEAL   = "#1D9E75";
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

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "-").replace(/&#8212;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Toolbar ──────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean) => ({
    width: 32, height: 32, display: "inline-flex" as const, alignItems: "center" as const,
    justifyContent: "center" as const, border: "none", borderRadius: 6,
    background: active ? BLT : "transparent", color: active ? T1 : T3,
    cursor: "pointer" as const, fontFamily: F, fontSize: 13, fontWeight: 600 as const,
  });
  return (
    <div style={{ display: "flex", gap: 2 }}>
      <button style={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button style={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button style={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button style={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="2" cy="3" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M5 3h8M5 7h8M5 11h8"/></svg>
      </button>
    </div>
  );
}

// ── Editor area ──────────────────────────────────────────────────────────
function EditorArea({ docId, initialContent }: { docId: string; initialContent: any }) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleLoaded = useRef(false);

  const doSave = (editor: ReturnType<typeof useEditor>) => {
    if (!editor) return;
    setSaveStatus("saving");
    const content = editor.getJSON();
    const content_text = editor.getText();
    fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, content_text }),
    })
      .then(() => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); })
      .catch(() => setSaveStatus("idle"));
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing. Notes, a draft response, your brief. Saves automatically." }),
      Typography,
    ],
    editorProps: {
      attributes: { style: `outline:none;min-height:400px;font-family:${F};font-size:14px;line-height:1.75;color:${T1};` },
    },
    content: initialContent || undefined,
    autofocus: "end",
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(editor), 2000);
    },
  });

  // Load title
  useEffect(() => {
    if (titleLoaded.current) return;
    titleLoaded.current = true;
    fetch(`/api/documents/${docId}`)
      .then(r => r.json())
      .then(d => { if (d.title) setTitle(d.title === "Untitled document" || d.title === "Project brief" ? "" : d.title); })
      .catch(() => {});
  }, [docId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (editor) doSave(editor);
    };
  }, [editor, docId]);

  const saveTitle = (val: string) => {
    const t = val.trim() || "Untitled document";
    fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    }).catch(() => {});
  };

  const exportDoc = () => window.open(`/api/documents/${docId}/export`, "_blank");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${BLT}`, background: WHITE, flexShrink: 0 }}>
        <Toolbar editor={editor} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveStatus !== "idle" && (
            <span style={{ fontSize: 12, color: T4 }}>
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          )}
          <button onClick={exportDoc} style={{
            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
            fontWeight: 500, fontFamily: F, color: T3, background: WHITE,
            border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer",
          }}>
            Export to Word {"\u2193"}
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div style={{ flex: 1, overflowY: "auto", background: WHITE }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 40px 80px" }}>
          {/* Editable title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => { setTitleFocused(false); saveTitle(title); }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
            placeholder="Untitled project"
            style={{
              width: "100%", fontSize: 28, fontWeight: 600, letterSpacing: "-.025em",
              color: title ? T1 : T4, fontFamily: F, border: "none", outline: "none",
              background: titleFocused ? BG : "transparent", borderRadius: 6,
              padding: "4px 0", marginBottom: 24, transition: "background .15s",
            }}
          />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const activeProject = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [library, setLibrary] = useState<SavedStory[]>([]);
  const [allDocs, setAllDocs] = useState<DocMeta[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocContent, setActiveDocContent] = useState<any>(null);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [tab, setTab] = useState<"brief" | "stories" | "intelligence">("brief");
  const [ready, setReady] = useState(false);

  // Boot: load projects + ensure a document exists
  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
    fetch("/api/stories/save?project_name=library").then(r => r.ok ? r.json() : { stories: [] }).then(d => setLibrary(d.stories || [])).catch(() => {});
  }, []);

  // Load or create active document
  useEffect(() => {
    const projectName = activeProject || "Workspace";
    // Try to load existing docs for this project
    fetch(`/api/projects/${encodeURIComponent(projectName)}`)
      .then(r => r.json())
      .then(async (d) => {
        const docs: DocMeta[] = d.documents || [];
        setAllDocs(docs);
        setStories(d.stories || []);
        setConsultations(d.consultations || []);

        if (docs.length > 0) {
          // Open most recent
          await loadDoc(docs[0].id);
        } else {
          // Create one
          const res = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_name: projectName, title: "Untitled document" }),
          });
          const created = await res.json();
          if (created.id) {
            setAllDocs([{ id: created.id, title: created.title, updated_at: new Date().toISOString(), project_name: projectName }]);
            setActiveDocId(created.id);
            setActiveDocContent(null);
            setReady(true);
          }
        }
      })
      .catch(() => setReady(true));
  }, [activeProject]);

  async function loadDoc(id: string) {
    const r = await fetch(`/api/documents/${id}`);
    const d = await r.json();
    setActiveDocId(d.id || id);
    setActiveDocContent(d.content || null);
    setReady(true);
  }

  async function createNewDoc() {
    const projectName = activeProject || "Workspace";
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_name: projectName, title: "Untitled document" }),
    });
    const created = await res.json();
    if (created.id) {
      const newDoc = { id: created.id, title: created.title, updated_at: new Date().toISOString(), project_name: projectName };
      setAllDocs(prev => [newDoc, ...prev]);
      setActiveDocId(created.id);
      setActiveDocContent(null);
      setReady(true);
      setTab("brief");
    }
  }

  const tabs: { key: "brief" | "stories" | "intelligence"; label: string }[] = [
    { key: "brief", label: "Brief" },
    { key: "stories", label: `Saved stories (${stories.length})` },
    { key: "intelligence", label: "Intelligence" },
  ];

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: F }}>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${T4};
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { outline: none; }
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; font-family: ${F}; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 20px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
      `}</style>

      {/* Left panel */}
      <div style={{ width: 280, flexShrink: 0, background: WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em" }}>Workspace</div>
          </div>
          <button onClick={createNewDoc} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 13, fontWeight: 500, fontFamily: F, color: "#fff", background: TEAL,
            border: "none", borderRadius: 8, padding: "9px 0", cursor: "pointer", marginBottom: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v10M1 6h10" strokeLinecap="round"/></svg>
            New document
          </button>
        </div>

        {/* Documents in current project */}
        {allDocs.length > 1 && (
          <div style={{ padding: "0 0 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 6px" }}>Documents</div>
            {allDocs.map(d => {
              const on = d.id === activeDocId;
              return (
                <button key={d.id} onClick={() => loadDoc(d.id)} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "8px 20px",
                  fontSize: 13, color: on ? T1 : T3, fontWeight: on ? 600 : 400,
                  background: on ? BG : "transparent", border: "none", fontFamily: F,
                  borderLeft: on ? `3px solid ${TEAL}` : "3px solid transparent", cursor: "pointer",
                }}>
                  {d.title === "Untitled document" || d.title === "Project brief" ? "Untitled" : d.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Project list */}
        <div style={{ borderTop: `1px solid ${BLT}`, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 6px" }}>Projects</div>
          {projects.length === 0 && (
            <div style={{ fontSize: 13, color: T4, padding: "4px 20px" }}>No projects yet</div>
          )}
          {projects.map(p => {
            const on = activeProject === p.name;
            return (
              <a key={p.name} href={`/platform/workspace?project=${encodeURIComponent(p.name)}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 20px",
                fontSize: 13, color: on ? T1 : T3, fontWeight: on ? 600 : 400,
                background: on ? BG : "transparent", textDecoration: "none",
                borderLeft: on ? `3px solid ${TEAL}` : "3px solid transparent",
              }}>
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: T4 }}>{p.count}</span>
              </a>
            );
          })}
        </div>

        {/* Library */}
        <div style={{ borderTop: `1px solid ${BLT}`, marginTop: 8, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 8px" }}>Library</div>
          {library.length === 0 && (
            <div style={{ fontSize: 13, color: T4, padding: "4px 20px" }}>No saved stories</div>
          )}
          {library.slice(0, 10).map(s => (
            <a key={s.id} href={`/platform/story/${s.id}`} style={{
              display: "block", padding: "6px 20px", fontSize: 12, color: T2,
              textDecoration: "none", lineHeight: 1.4,
            }}>
              {decodeHtml(s.title)}
            </a>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: BG, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ background: WHITE, borderBottom: `1px solid ${BLT}`, padding: "0 24px", display: "flex", gap: 0, flexShrink: 0 }}>
          {tabs.map(t => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontSize: 13, fontWeight: on ? 600 : 400, color: on ? T1 : T4,
                background: "none", border: "none", fontFamily: F,
                borderBottom: on ? `2px solid ${TEAL}` : "2px solid transparent",
                padding: "12px 18px", cursor: "pointer",
              }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "brief" && ready && activeDocId && (
          <EditorArea key={activeDocId} docId={activeDocId} initialContent={activeDocContent} />
        )}

        {tab === "brief" && !ready && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T4, fontSize: 13 }}>Loading...</div>
        )}

        {tab === "stories" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {stories.length === 0 && (
              <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>
                No saved stories in this project. Save stories from the feed or story page.
              </div>
            )}
            {stories.map(s => (
              <a key={s.id} href={`/platform/story/${s.id}`} style={{
                display: "block", background: WHITE, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: "16px 20px", marginBottom: 8, textDecoration: "none",
              }}>
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
            {consultations.length === 0 && (
              <div style={{ fontSize: 13, color: T4, padding: "20px 0" }}>No consultations linked to this project's topics.</div>
            )}
            {consultations.map(c => {
              const days = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <div key={c.id} style={{
                  background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
                  padding: "14px 20px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T4, textTransform: "uppercase" }}>{c.organisation}</span>
                    <span style={{ fontSize: 11, color: days <= 14 ? "#D93025" : T4 }}>{days} days</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4 }}>{c.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
