"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const TEAL = "#1D9E75";
const NAVY = "#0F1117";
const F = "var(--font-ui), 'Inter', -apple-system, sans-serif";
const BD = "#E8EAED";
const T1 = "#202124";
const T3 = "#5F6368";
const T4 = "#9AA0A6";

const SUSPECT_PHRASES = [
  "it is worth noting",
  "however, it",
  "on the other hand",
  "some experts argue",
  "it has been suggested",
  "there are concerns",
  "various stakeholders",
  "it should be noted",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

type SaveState = "idle" | "saving" | "saved";

function htmlFromMarkdown(md: string): string {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${para.join(" ")}</p>`);
      para = [];
    }
  };
  for (const line of lines) {
    if (/^#\s+/.test(line)) { flush(); out.push(`<h1>${line.replace(/^#\s+/, "")}</h1>`); }
    else if (/^##\s+/.test(line)) { flush(); out.push(`<h2>${line.replace(/^##\s+/, "")}</h2>`); }
    else if (line.trim() === "") { flush(); }
    else { para.push(line); }
  }
  flush();
  return out.join("");
}

export default function DraftEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = decodeURIComponent(params.id as string);

  const [title, setTitle] = useState("Untitled draft");
  const [projectName, setProjectName] = useState("");
  const [format, setFormat] = useState("Briefing");
  const [tone, setTone] = useState("Journalistic");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);
  const [outline, setOutline] = useState<{ id: string; level: number; text: string }[]>([]);
  const [sources, setSources] = useState<{ name: string; type: string }[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [fontSize, setFontSize] = useState(11);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [colorOpen, setColorOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentLoaded = useRef(false);
  const today = useMemo(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), []);

  const updateDerived = useCallback((editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;
    const text = editorInstance.getText();
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

    const found: string[] = [];
    const lower = text.toLowerCase();
    for (const p of SUSPECT_PHRASES) if (lower.includes(p)) found.push(p);
    setWarnings(found);

    const json = editorInstance.getJSON();
    const headings: { id: string; level: number; text: string }[] = [];
    let idx = 0;
    function walk(node: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }) {
      if (node.type === "heading") {
        const level = (node.attrs?.level as number) || 1;
        const textContent = (node.content || [])
          .map((c: unknown) => {
            const n = c as { text?: string };
            return n.text || "";
          })
          .join("");
        headings.push({ id: `s-${idx++}`, level, text: textContent });
      }
      if (node.content) {
        for (const child of node.content) walk(child as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] });
      }
    }
    walk(json as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] });
    setOutline(headings);
  }, []);

  const saveContent = useCallback(async (editorInstance: ReturnType<typeof useEditor>) => {
    if (!editorInstance) return;
    setSaveState("saving");
    try {
      await fetch(`/api/projects/${projectId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: editorInstance.getText(),
          format,
          tone,
        }),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }, [projectId, title, format, tone]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editorProps: {
      attributes: {
        class: "tl-draft-body",
        style: `font-family: ${F}; font-size: 14.5px; line-height: 1.85; color: #202124; min-height: 500px; outline: none;`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!contentLoaded.current) return;
      updateDerived(ed);
      setSaveState("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveContent(ed), 800);
    },
  });

  // Load draft
  useEffect(() => {
    if (!editor) return;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/draft`);
        const json = await res.json();
        const d = json?.draft;
        if (d) {
          if (d.title) { setTitle(d.title); setProjectName(d.title); }
          if (d.format) setFormat(d.format);
          if (d.tone) setTone(d.tone);
          const html = htmlFromMarkdown(d.content || "");
          editor.commands.setContent(html);
          contentLoaded.current = true;
          updateDerived(editor);
        } else {
          contentLoaded.current = true;
        }
      } catch {
        contentLoaded.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, projectId]);

  const saveTitleAndContent = useCallback(() => {
    if (editor) saveContent(editor);
  }, [editor, saveContent]);

  const regenerate = async () => {
    if (regenerating || !editor) return;
    setRegenerating(true);
    try {
      const notes = editor.getText();
      const res = await fetch(`/api/projects/${projectId}/draft/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          sources: [],
          format,
          tone,
          projectName: projectName || title,
        }),
      });
      if (!res.ok) throw new Error("compile failed");
      const json = await res.json();
      const newContent: string = json?.draft?.content || "";
      editor.commands.setContent(htmlFromMarkdown(newContent));
      updateDerived(editor);
    } catch {
      // swallow
    } finally {
      setRegenerating(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setOpenMenu(null); setColorOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const visibleWarnings = warnings.filter(w => !dismissedWarnings.includes(w));

  // Current heading level for paragraph style selector
  const currentHeading = editor?.isActive("heading", { level: 1 }) ? "Heading 1"
    : editor?.isActive("heading", { level: 2 }) ? "Heading 2"
    : editor?.isActive("heading", { level: 3 }) ? "Heading 3"
    : "Normal text";

  const currentFont = (editor?.getAttributes("textStyle")?.fontFamily as string) || "Inter";

  // Active button style helper
  const tbBtnActive = (active: boolean): React.CSSProperties => ({
    ...tbBtn,
    background: active ? "#E8F0FE" : "transparent",
    color: active ? "#1A73E8" : T1,
  });

  // Menu dropdown items
  const menus: Record<string, { label: string; action: () => void; shortcut?: string }[]> = {
    File: [
      { label: "New document", action: () => { if (editor) { editor.commands.clearContent(); setTitle("Untitled draft"); } } },
      { label: "Save", action: saveTitleAndContent, shortcut: "Ctrl+S" },
      { label: "Export", action: () => setExportOpen(true) },
    ],
    Edit: [
      { label: "Undo", action: () => editor?.chain().focus().undo().run(), shortcut: "Ctrl+Z" },
      { label: "Redo", action: () => editor?.chain().focus().redo().run(), shortcut: "Ctrl+Y" },
      { label: "Select all", action: () => editor?.chain().focus().selectAll().run(), shortcut: "Ctrl+A" },
    ],
    View: [
      { label: "Focus mode", action: () => {} },
    ],
    Insert: [
      { label: "Link", action: () => { const u = prompt("Link URL"); if (u && editor) editor.chain().focus().setLink({ href: u }).run(); } },
      { label: "Table (3x3)", action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: "Horizontal rule", action: () => editor?.chain().focus().setHorizontalRule().run() },
    ],
    Format: [
      { label: "Clear formatting", action: () => editor?.chain().focus().clearNodes().unsetAllMarks().run() },
    ],
    Tools: [
      { label: "Word count", action: () => alert(`${wordCount} words`) },
    ],
  };

  const TEXT_COLORS = ["#000000", "#434343", "#666666", "#999999", "#D93025", "#E37400", "#F9AB00", "#188038", "#1A73E8", "#8430CE"];

  return (
    <div style={{ fontFamily: F, height: "100vh", display: "flex", flexDirection: "column", background: "#F0F0F0" }}>
      {/* APP BAR */}
      <div style={{ height: 48, background: NAVY, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, background: TEAL, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>T</div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitleAndContent} style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: F, fontSize: 17, padding: 0 }} />
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Projects &rsaquo; {projectName || "Project"} &rsaquo; <span style={{ color: TEAL }}>Draft</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {saveState === "saving" ? "Saving..." : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={TEAL} strokeWidth="1.8"><path d="M2 6.5l2.5 2.5L10 3.5"/></svg>
                Saved just now
              </>
            )}
          </span>
          <button onClick={() => router.push(`/platform/projects/${projectId}`)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "6px 12px", fontFamily: F, fontSize: 12, borderRadius: 4, cursor: "pointer" }}>Back to notes</button>
          <button onClick={regenerate} disabled={regenerating} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "6px 12px", fontFamily: F, fontSize: 12, borderRadius: 4, cursor: regenerating ? "default" : "pointer", opacity: regenerating ? 0.6 : 1 }}>{regenerating ? "Regenerating..." : "Regenerate"}</button>
          <button onClick={() => setExportOpen(true)} style={{ background: TEAL, border: "none", color: "#fff", padding: "6px 14px", fontFamily: F, fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: "pointer" }}>Export</button>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 12, fontWeight: 600 }}>L</div>
        </div>
      </div>

      {/* MENU BAR */}
      <div style={{ height: 36, background: "#fff", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0, position: "relative" }}>
        {["File", "Edit", "View", "Insert", "Format", "Tools"].map(item => (
          <div key={item} style={{ position: "relative" }}>
            <span
              onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === item ? null : item); }}
              style={{ padding: "0 10px", fontFamily: F, fontSize: 13, color: T1, cursor: "pointer", height: 36, display: "inline-flex", alignItems: "center", background: openMenu === item ? "#E8EAED" : "transparent", borderRadius: 2 }}
            >
              {item}
            </span>
            {openMenu === item && menus[item] && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 34, left: 0, background: "#fff", border: `1px solid ${BD}`, borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,.15)", minWidth: 200, zIndex: 100, padding: "4px 0" }}>
                {menus[item].map(m => (
                  <div
                    key={m.label}
                    onClick={() => { m.action(); setOpenMenu(null); }}
                    style={{ padding: "8px 16px", fontFamily: F, fontSize: 13, color: T1, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F1F3F4")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{m.label}</span>
                    {m.shortcut && <span style={{ fontSize: 11, color: T4, marginLeft: 24 }}>{m.shortcut}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {visibleWarnings.length > 0 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginRight: 8 }}>
            {visibleWarnings.slice(0, 1).map(w => (
              <div key={w} style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 4, padding: "3px 10px", fontFamily: F, fontSize: 11.5, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
                <span>&quot;{w}&quot; may not be from your notes, check before submitting</span>
                <span onClick={() => setDismissedWarnings(d => [...d, w])} style={{ color: TEAL, cursor: "pointer", fontWeight: 500 }}>Dismiss</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORMATTING TOOLBAR */}
      <div style={{ height: 40, background: "#fff", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0 }}>
        {/* Undo / Redo */}
        <button title="Undo" onClick={() => editor?.chain().focus().undo().run()} style={tbBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6a3 3 0 010 6H6"/><path d="M5 4L3 6l2 2"/></svg>
        </button>
        <button title="Redo" onClick={() => editor?.chain().focus().redo().run()} style={tbBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 6H5a3 3 0 000 6h3"/><path d="M9 4l2 2-2 2"/></svg>
        </button>
        <Sep />

        {/* Paragraph style */}
        <select
          value={currentHeading}
          onChange={e => {
            const val = e.target.value;
            if (val === "Normal text") editor?.chain().focus().setParagraph().run();
            else if (val === "Heading 1") editor?.chain().focus().toggleHeading({ level: 1 }).run();
            else if (val === "Heading 2") editor?.chain().focus().toggleHeading({ level: 2 }).run();
            else if (val === "Heading 3") editor?.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          style={tbSelect}
        >
          <option>Normal text</option>
          <option>Heading 1</option>
          <option>Heading 2</option>
          <option>Heading 3</option>
        </select>
        <Sep />

        {/* Font family */}
        <select
          value={currentFont}
          onChange={e => editor?.chain().focus().setFontFamily(e.target.value).run()}
          style={tbSelect}
        >
          <option value="Inter">Inter</option>
          <option value="Georgia">Georgia</option>
          <option value="DM Mono">DM Mono</option>
        </select>
        <Sep />

        {/* Font size */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              const next = FONT_SIZES[Math.max(0, idx - 1)] || FONT_SIZES[0];
              setFontSize(next);
              editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
            }}
            style={tbBtn}
          >
            &minus;
          </button>
          <select
            value={fontSize}
            onChange={e => {
              const s = parseInt(e.target.value);
              setFontSize(s);
              editor?.chain().focus().setMark("textStyle", { fontSize: `${s}px` }).run();
            }}
            style={{ width: 44, height: 24, textAlign: "center", border: `1px solid ${BD}`, borderRadius: 3, fontFamily: F, fontSize: 12 }}
          >
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => {
              const idx = FONT_SIZES.indexOf(fontSize);
              const next = FONT_SIZES[Math.min(FONT_SIZES.length - 1, idx + 1)] || FONT_SIZES[FONT_SIZES.length - 1];
              setFontSize(next);
              editor?.chain().focus().setMark("textStyle", { fontSize: `${next}px` }).run();
            }}
            style={tbBtn}
          >
            +
          </button>
        </div>
        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <button onClick={() => editor?.chain().focus().toggleBold().run()} style={tbBtnActive(editor?.isActive("bold") || false)}><b>B</b></button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} style={tbBtnActive(editor?.isActive("italic") || false)}><i>I</i></button>
        <button onClick={() => editor?.chain().focus().toggleUnderline().run()} style={tbBtnActive(editor?.isActive("underline") || false)}><u>U</u></button>
        <button onClick={() => editor?.chain().focus().toggleStrike().run()} style={tbBtnActive(editor?.isActive("strike") || false)}><s>S</s></button>
        <Sep />

        {/* Text colour */}
        <div style={{ position: "relative" }}>
          <button onClick={e => { e.stopPropagation(); setColorOpen(!colorOpen); }} style={tbBtn}>
            <span style={{ borderBottom: `3px solid ${(editor?.getAttributes("textStyle")?.color as string) || "#000"}` }}>A</span>
          </button>
          {colorOpen && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 32, left: 0, background: "#fff", border: `1px solid ${BD}`, borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,.15)", padding: 8, zIndex: 100, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {TEXT_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => { editor?.chain().focus().setColor(c).run(); setColorOpen(false); }}
                  style={{ width: 22, height: 22, background: c, borderRadius: 3, cursor: "pointer", border: "1px solid rgba(0,0,0,0.1)" }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <button onClick={() => editor?.chain().focus().toggleHighlight({ color: "#FBBC04" }).run()} style={tbBtnActive(editor?.isActive("highlight") || false)}>
          <span style={{ background: editor?.isActive("highlight") ? "#FBBC04" : "#FBBC04", padding: "0 2px", borderRadius: 2 }}>H</span>
        </button>
        <Sep />

        {/* Link */}
        <button
          onClick={() => {
            if (editor?.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const u = prompt("Link URL");
              if (u) editor?.chain().focus().setLink({ href: u }).run();
            }
          }}
          style={tbBtnActive(editor?.isActive("link") || false)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8l2-2"/><path d="M4.5 9.5a2.12 2.12 0 010-3l2-2a2.12 2.12 0 013 3"/><path d="M9.5 4.5a2.12 2.12 0 010 3l-2 2a2.12 2.12 0 01-3-3"/></svg>
        </button>
        <Sep />

        {/* Alignment */}
        <button onClick={() => editor?.chain().focus().setTextAlign("left").run()} style={tbBtnActive(editor?.isActive({ textAlign: "left" }) || false)} title="Align left">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h10M2 6h6M2 9h8M2 12h4"/></svg>
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign("center").run()} style={tbBtnActive(editor?.isActive({ textAlign: "center" }) || false)} title="Align center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h10M4 6h6M3 9h8M5 12h4"/></svg>
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign("right").run()} style={tbBtnActive(editor?.isActive({ textAlign: "right" }) || false)} title="Align right">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h10M8 6h4M6 9h6M10 12h2"/></svg>
        </button>
        <Sep />

        {/* Lists */}
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={tbBtnActive(editor?.isActive("bulletList") || false)} title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="3" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M6 4h6M6 7h6M6 10h6"/></svg>
        </button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={tbBtnActive(editor?.isActive("orderedList") || false)} title="Numbered list">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><text x="2" y="5" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="2" y="8" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="2" y="11" fontSize="5" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text><path d="M6 4h6M6 7h6M6 10h6"/></svg>
        </button>
      </div>

      {/* RULER */}
      <div style={{ height: 24, background: "#F8F8F8", borderBottom: "1px solid #E0E0E0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 816, position: "relative", height: "100%" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i / 8) * 100}%`, top: 8, bottom: 0, width: 1, background: "#C0C0C0" }} />
          ))}
        </div>
      </div>

      {/* BODY SPLIT */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT PANEL */}
        <div style={{ width: 240, background: "#fff", borderRight: `1px solid ${BD}`, overflowY: "auto", paddingTop: 16 }}>
          <div style={{ padding: "0 16px 12px", fontFamily: F, fontSize: 13, fontWeight: 500, color: T1 }}>Document outline</div>
          <div style={{ margin: "0 16px 12px", background: "rgba(29,158,117,0.06)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, marginBottom: 6 }}>Draft integrity</div>
            <div style={integrityRow}><span>Notes used</span><span style={{ color: TEAL }}>94%</span></div>
            <div style={integrityRow}><span>Sources</span><span>{sources.length} files</span></div>
            <div style={integrityRow}><span>Added by Tideline</span><span style={{ color: TEAL }}>None</span></div>
          </div>
          <div style={{ height: 1, background: "#F0F0F0" }} />
          {outline.length === 0 ? (
            <div style={{ padding: "10px 16px", fontFamily: F, fontSize: 12, color: T4 }}>No headings yet</div>
          ) : outline.map(h => (
            <div key={h.id} style={{ padding: `6px 16px 6px ${16 + (h.level - 1) * 12}px`, fontFamily: F, fontSize: 13, color: T3, cursor: "pointer" }}>
              {h.text}
            </div>
          ))}
          <div style={{ height: 1, background: "#F0F0F0", margin: "8px 0" }} />
          <div style={{ padding: "0 16px 8px", fontFamily: F, fontSize: 11, textTransform: "uppercase", color: T4 }}>Sources cited</div>
          {sources.length === 0 ? (
            <div style={{ padding: "0 16px 16px", fontFamily: F, fontSize: 12, color: T4 }}>No sources attached</div>
          ) : sources.map((s, i) => (
            <div key={i} style={{ padding: "6px 16px", fontFamily: F, fontSize: 12, color: T3, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#F1F3F4", color: T3 }}>{s.type}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            </div>
          ))}
        </div>

        {/* SCROLL AREA */}
        <div style={{ flex: 1, overflowY: "auto", background: "#F0F0F0", padding: "24px 0 80px" }}>
          <div style={{ background: "#fff", width: 816, margin: "0 auto", boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)", padding: "96px 96px 96px", minHeight: 1056 }}>
            <div style={{ fontFamily: F, fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 6, color: T1 }}>
              {title}
            </div>
            <div style={{ fontFamily: F, fontSize: 13, color: T4, textAlign: "center", marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${BD}` }}>
              {format} &middot; Tideline Intelligence &middot; {today}
            </div>
            <EditorContent editor={editor} />
            <style>{`
              .tl-draft-body p { margin-bottom: 1.15em; }
              .tl-draft-body h1 { font-size: 20px; font-weight: 700; margin-top: 1.6em; margin-bottom: 0.7em; }
              .tl-draft-body h2 { font-size: 16px; font-weight: 600; margin-top: 1.3em; margin-bottom: 0.5em; }
              .tl-draft-body h3 { font-size: 14px; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.4em; }
              .tl-draft-body ul, .tl-draft-body ol { padding-left: 24px; margin-bottom: 1em; }
              .tl-draft-body li { margin-bottom: 0.3em; }
              .tl-draft-body a { color: #1A73E8; text-decoration: underline; }
              .tl-draft-body table { border-collapse: collapse; margin: 1em 0; width: 100%; }
              .tl-draft-body th, .tl-draft-body td { border: 1px solid ${BD}; padding: 8px 12px; text-align: left; font-size: 13px; }
              .tl-draft-body th { background: #F8F9FA; font-weight: 600; }
              .tl-draft-body mark { background: #FBBC04; padding: 0 2px; border-radius: 2px; }
              .tl-draft-body hr { border: none; border-top: 1px solid ${BD}; margin: 1.5em 0; }
              .tiptap:focus { outline: none; }
              .tiptap { min-height: 500px; }
            `}</style>
            <div style={{ marginTop: 64, paddingTop: 16, borderTop: `1px solid ${BD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 13, height: 13, background: TEAL, borderRadius: 2 }} />
                <span style={{ fontFamily: F, fontSize: 11, color: T4 }}>Drafted from your notes only. No content added by Tideline.</span>
              </div>
              <span style={{ fontFamily: F, fontSize: 11, color: T4 }}>{wordCount} words</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: 28, background: "#fff", borderTop: "1px solid #E0E0E0", display: "flex", alignItems: "center", padding: "0 16px", fontFamily: F, fontSize: 11, color: T3, gap: 16 }}>
        <span>{wordCount} words</span>
        <span>{saveState === "saving" ? "Saving..." : "Saved just now"}</span>
        <span>{sources.length} sources &middot; {format} &middot; {tone}</span>
      </div>

      {/* EXPORT MODAL */}
      {exportOpen && (
        <div onClick={() => setExportOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 8, width: 420, padding: 24, fontFamily: F }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 14 }}>Export draft</div>
            {[
              { label: "Word (.docx)", action: "download" },
              { label: "PDF", action: "download" },
              { label: "Shareable link", action: "copy to clipboard" },
              { label: "Citations (.bib)", action: "download" },
            ].map(o => (
              <button key={o.label} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 6, border: `1px solid ${BD}`, borderRadius: 4, background: "#fff", fontFamily: F, fontSize: 13, color: T1, cursor: "pointer" }}>
                {o.label}
                <span style={{ float: "right", color: T4, fontSize: 11 }}>{o.action}</span>
              </button>
            ))}
            <div style={{ marginTop: 14, fontSize: 11, color: T4 }}>Your draft saves automatically and stays here. Export does not close this editor.</div>
          </div>
        </div>
      )}
    </div>
  );
}

const tbBtn: React.CSSProperties = { width: 28, height: 28, border: "none", background: "transparent", borderRadius: 3, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: T1, fontFamily: F, fontSize: 13 };
const tbSelect: React.CSSProperties = { height: 26, border: `1px solid ${BD}`, borderRadius: 3, padding: "0 6px", fontFamily: F, fontSize: 12, color: T1, background: "#fff" };
const integrityRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 11.5, color: T3, padding: "2px 0" };

function Sep() {
  return <div style={{ width: 1, height: 20, background: BD, margin: "0 4px" }} />;
}
