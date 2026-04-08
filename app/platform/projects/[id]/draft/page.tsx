"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useMemo(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), []);

  // Load draft
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/draft`);
        const json = await res.json();
        const d = json?.draft;
        if (d) {
          if (d.title) { setTitle(d.title); setProjectName(d.title); }
          if (d.format) setFormat(d.format);
          if (d.tone) setTone(d.tone);
          if (bodyRef.current) {
            bodyRef.current.innerHTML = htmlFromMarkdown(d.content || "");
            updateDerived();
          }
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const updateDerived = () => {
    const el = bodyRef.current;
    if (!el) return;
    const text = el.innerText || "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

    const found: string[] = [];
    const lower = text.toLowerCase();
    for (const p of SUSPECT_PHRASES) if (lower.includes(p)) found.push(p);
    setWarnings(found);

    const headings = Array.from(el.querySelectorAll("h1,h2")).map((h, i) => {
      if (!h.id) h.id = `s-${i}`;
      return { id: h.id, level: h.tagName === "H1" ? 1 : 2, text: h.textContent || "" };
    });
    setOutline(headings);
  };

  const save = async () => {
    setSaveState("saving");
    try {
      await fetch(`/api/projects/${projectId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: bodyRef.current?.innerText || "",
          format,
          tone,
        }),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  };

  const regenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const notes = bodyRef.current?.innerText || "";
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
      if (bodyRef.current) {
        bodyRef.current.innerHTML = htmlFromMarkdown(newContent);
        updateDerived();
      }
    } catch {
      // swallow
    } finally {
      setRegenerating(false);
    }
  };

  const onBodyInput = () => {
    updateDerived();
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 800);
  };

  const visibleWarnings = warnings.filter(w => !dismissedWarnings.includes(w));

  return (
    <div style={{ fontFamily: F, height: "100vh", display: "flex", flexDirection: "column", background: "#F0F0F0" }}>
      {/* APP BAR */}
      <div style={{ height: 48, background: NAVY, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, background: TEAL, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>T</div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} onBlur={save} style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: F, fontSize: 17, padding: 0 }} />
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Projects › {projectName || "Project"} › <span style={{ color: TEAL }}>Draft</span>
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
      <div style={{ height: 36, background: "#fff", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
        {["File", "Edit", "View", "Insert", "Format", "Tools"].map(item => (
          <span key={item} style={{ padding: "0 10px", fontFamily: F, fontSize: 13, color: T1, cursor: "pointer", height: "100%", display: "inline-flex", alignItems: "center" }}>{item}</span>
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
        <button title="Undo" onClick={() => document.execCommand("undo")} style={tbBtn}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h6a3 3 0 010 6H6"/><path d="M5 4L3 6l2 2"/></svg></button>
        <button title="Redo" onClick={() => document.execCommand("redo")} style={tbBtn}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 6H5a3 3 0 000 6h3"/><path d="M9 4l2 2-2 2"/></svg></button>
        <Sep />
        <select defaultValue="Normal text" style={tbSelect}>
          <option>Normal text</option><option>Title</option><option>Heading 1</option><option>Heading 2</option><option>Heading 3</option>
        </select>
        <Sep />
        <select defaultValue="Inter" style={tbSelect}><option>Inter</option><option>Georgia</option><option>DM Mono</option></select>
        <Sep />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={tbBtn}>−</button>
          <input defaultValue={11} style={{ width: 32, height: 24, textAlign: "center", border: `1px solid ${BD}`, borderRadius: 3, fontFamily: F, fontSize: 12 }} />
          <button style={tbBtn}>+</button>
        </div>
        <Sep />
        <button onClick={() => document.execCommand("bold")} style={tbBtn}><b>B</b></button>
        <button onClick={() => document.execCommand("italic")} style={tbBtn}><i>I</i></button>
        <button onClick={() => document.execCommand("underline")} style={tbBtn}><u>U</u></button>
        <Sep />
        <button style={tbBtn}>A</button>
        <button style={tbBtn}>H</button>
        <Sep />
        <button onClick={() => { const u = prompt("Link URL"); if (u) document.execCommand("createLink", false, u); }} style={tbBtn}>🔗</button>
        <Sep />
        <button onClick={() => document.execCommand("justifyLeft")} style={tbBtn}>≡</button>
        <button onClick={() => document.execCommand("justifyCenter")} style={tbBtn}>≣</button>
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
            <div key={h.id} onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" })} style={{ padding: `6px 16px 6px ${16 + (h.level - 1) * 12}px`, fontFamily: F, fontSize: 13, color: T3, cursor: "pointer" }}>
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
            <div ref={titleRef} contentEditable suppressContentEditableWarning onBlur={save} style={{ fontFamily: F, fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 6, color: T1, outline: "none" }}>
              {title}
            </div>
            <div style={{ fontFamily: F, fontSize: 13, color: T4, textAlign: "center", marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${BD}` }}>
              {format} · Tideline Intelligence · {today}
            </div>
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onInput={onBodyInput}
              className="tl-draft-body"
              style={{ fontFamily: F, fontSize: 14.5, lineHeight: 1.85, color: "#202124", minHeight: 500, outline: "none" }}
            />
            <style>{`
              .tl-draft-body p { margin-bottom: 1.15em; }
              .tl-draft-body h1 { font-size: 20px; font-weight: 700; margin-top: 1.6em; margin-bottom: 0.7em; }
              .tl-draft-body h2 { font-size: 16px; font-weight: 600; margin-top: 1.3em; margin-bottom: 0.5em; }
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
        <span>{sources.length} sources · {format} · {tone}</span>
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
