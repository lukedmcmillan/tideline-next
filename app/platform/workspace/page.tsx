"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
interface Doc { id: string; title: string; updated_at: string }
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

// ── Editor toolbar ───────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean) => ({
    width: 32, height: 32, display: "inline-flex" as const, alignItems: "center" as const,
    justifyContent: "center" as const, border: "none", borderRadius: 6,
    background: active ? BLT : "transparent", color: active ? T1 : T3,
    cursor: "pointer" as const, fontFamily: F, fontSize: 13, fontWeight: 600 as const,
  });
  return (
    <div style={{ display: "flex", gap: 2, padding: "8px 12px", borderBottom: `1px solid ${BLT}`, background: WHITE }}>
      <button style={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button style={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button style={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button style={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="2" cy="3" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M5 3h8M5 7h8M5 11h8"/></svg>
      </button>
    </div>
  );
}

// ── Brief tab (editor) ───────────────────────────────────────────────────
function BriefTab({ docId }: { docId: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your brief, notes, or draft response. Your work saves automatically." }),
      Typography,
    ],
    editorProps: {
      attributes: { style: "outline:none;min-height:400px;font-family:var(--font-sans),'DM Sans',system-ui,sans-serif;font-size:14px;line-height:1.75;color:#202124;" },
    },
    onUpdate: ({ editor }) => {
      if (!docId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const content = editor.getJSON();
        const content_text = editor.getText();
        fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, content_text }),
        }).catch(() => {});
      }, 30000);
    },
  });

  // Load existing content
  useEffect(() => {
    if (!docId || loaded || !editor) return;
    fetch(`/api/documents/${docId}`)
      .then(r => r.json())
      .then(d => {
        if (d.content && editor) {
          editor.commands.setContent(d.content);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [docId, editor, loaded]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (docId && editor) {
        const content = editor.getJSON();
        const content_text = editor.getText();
        fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, content_text }),
        }).catch(() => {});
      }
    };
  }, [docId, editor]);

  const exportDoc = () => {
    if (!docId) return;
    window.open(`/api/documents/${docId}/export`, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
        <Toolbar editor={editor} />
        <button onClick={exportDoc} style={{
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
          fontWeight: 500, fontFamily: F, color: T3, background: WHITE,
          border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px",
          cursor: "pointer", marginRight: 12,
        }}>
          Export to Word {"\u2193"}
        </button>
      </div>
      <div style={{ background: WHITE, padding: 40, minHeight: 500 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProject = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [library, setLibrary] = useState<SavedStory[]>([]);
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [tab, setTab] = useState<"brief" | "stories" | "intelligence">("brief");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Load projects
  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
    // Load library items
    fetch("/api/stories/save?project_name=library").then(r => r.ok ? r.json() : { stories: [] }).then(d => setLibrary(d.stories || [])).catch(() => {});
  }, []);

  // Load project detail when selected
  useEffect(() => {
    if (!activeProject) { setStories([]); setDocs([]); setConsultations([]); return; }
    fetch(`/api/projects/${encodeURIComponent(activeProject)}`)
      .then(r => r.json())
      .then(d => {
        setStories(d.stories || []);
        setDocs(d.documents || []);
        setConsultations(d.consultations || []);
      })
      .catch(() => {});
  }, [activeProject]);

  const createProject = () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.project) {
          setProjects(prev => [...prev, { name: d.project, count: 0 }]);
          setNewName("");
          router.push(`/platform/workspace?project=${encodeURIComponent(d.project)}`);
        }
      })
      .catch(() => {})
      .finally(() => setCreating(false));
  };

  const docId = docs.length > 0 ? docs[0].id : null;
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
        .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; }
        .ProseMirror p { margin: 0 0 8px; }
        .ProseMirror ul { padding-left: 20px; margin: 0 0 8px; }
        .ProseMirror li { margin: 0 0 4px; }
      `}</style>

      {/* Left panel */}
      <div style={{ width: 280, flexShrink: 0, background: WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em", marginBottom: 16 }}>Workspace</div>
          {/* New project input */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createProject()}
              placeholder="New project name"
              style={{ flex: 1, fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 10px", outline: "none", color: T1 }}
            />
            <button onClick={createProject} disabled={!newName.trim()} style={{
              fontSize: 12, fontWeight: 600, fontFamily: F, color: "#fff",
              background: newName.trim() ? TEAL : T4, border: "none", borderRadius: 8,
              padding: "7px 12px", cursor: newName.trim() ? "pointer" : "default",
            }}>
              Create
            </button>
          </div>
        </div>

        {/* Project list */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 6px" }}>Projects</div>
        {projects.length === 0 && (
          <div style={{ fontSize: 13, color: T4, padding: "8px 20px" }}>No projects yet</div>
        )}
        {projects.map(p => {
          const on = activeProject === p.name;
          return (
            <a
              key={p.name}
              href={`/platform/workspace?project=${encodeURIComponent(p.name)}`}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                fontSize: 13, color: on ? T1 : T3, fontWeight: on ? 600 : 400,
                background: on ? BG : "transparent", textDecoration: "none",
                borderLeft: on ? `3px solid ${TEAL}` : "3px solid transparent",
              }}
            >
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: T4 }}>{p.count}</span>
            </a>
          );
        })}

        {/* Library */}
        <div style={{ borderTop: `1px solid ${BLT}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "0 20px 8px" }}>Library</div>
          {library.length === 0 && (
            <div style={{ fontSize: 13, color: T4, padding: "4px 20px" }}>No saved stories</div>
          )}
          {library.slice(0, 10).map(s => (
            <a key={s.id} href={`/platform/story/${s.id}`} style={{
              display: "block", padding: "8px 20px", fontSize: 12, color: T2,
              textDecoration: "none", lineHeight: 1.4,
            }}>
              {decodeHtml(s.title)}
            </a>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, overflowY: "auto", background: BG }}>
        {!activeProject ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T4, fontSize: 14 }}>
            Select a project or create one
          </div>
        ) : (
          <div>
            {/* Project header + tabs */}
            <div style={{ background: WHITE, borderBottom: `1px solid ${BLT}`, padding: "16px 24px 0" }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em", marginBottom: 12 }}>{activeProject}</div>
              <div style={{ display: "flex", gap: 0 }}>
                {tabs.map(t => {
                  const on = tab === t.key;
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                      fontSize: 13, fontWeight: on ? 600 : 400, color: on ? T1 : T4,
                      background: "none", border: "none", fontFamily: F,
                      borderBottom: on ? `2px solid ${TEAL}` : "2px solid transparent",
                      padding: "8px 18px", cursor: "pointer",
                    }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ padding: tab === "brief" ? 0 : "16px 24px" }}>
              {tab === "brief" && <BriefTab docId={docId} />}

              {tab === "stories" && (
                <div>
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
                <div>
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
        )}
      </div>
    </div>
  );
}
