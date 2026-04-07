"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TEAL = "#1D9E75";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const BD = "#DADCE0";
const FUI = "var(--font-ui), 'Plus Jakarta Sans', -apple-system, sans-serif";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

const TYPE_LABELS: Record<string, string> = {
  situation_report: "Situation",
  investigation: "Investigation",
  regulatory_watch: "Reg Watch",
  briefing_note: "Briefing",
  deal_monitor: "Deal",
};

const TYPE_BADGES: Record<string, { background: string; color: string }> = {
  situation_report: { background: "#E8F5E9", color: "#2E7D32" },
  investigation: { background: "#FFF3E0", color: "#E65100" },
  regulatory_watch: { background: "#E8EAF6", color: "#3949AB" },
  briefing_note: { background: "#FCE4EC", color: "#C2185B" },
  deal_monitor: { background: "#E0F7FA", color: "#00838F" },
};

function fmtRelative(iso?: string): string {
  if (!iso) return "just now";
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ProjectCard({ project, onClick, onDelete }: { project: any; onClick: () => void; onDelete: (name: string) => void }) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const typeLabel = TYPE_LABELS[project.project_type] || "Project";
  const typeBadge = TYPE_BADGES[project.project_type] || TYPE_BADGES.situation_report;
  const overnightCount = project.overnight_count || 0;
  const sourceCount = project.source_count || project.count || 0;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: "#FFFFFF",
      border: `1px solid ${hover ? TEAL : BD}`,
      borderLeft: overnightCount > 0 ? `3px solid ${TEAL}` : `1px solid ${hover ? TEAL : BD}`,
      borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
      boxShadow: hover ? "0 4px 16px rgba(29,158,117,0.1)" : "none",
      transform: hover ? "translateY(-1px)" : "none",
      overflow: "visible",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: 10, right: 10, opacity: hover || menuOpen ? 1 : 0, transition: "opacity 0.15s", zIndex: 20 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => setMenuOpen(o => !o)} style={{ width: 26, height: 26, background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer", color: T3, fontSize: 14, lineHeight: 1, padding: 0 }}>{"\u22EF"}</button>
        {menuOpen && (
          <div style={{ position: "absolute", top: 30, right: 0, minWidth: 160, background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "4px 0", zIndex: 100 }}>
            {["Rename", "Share", "Export"].map(a => (
              <div key={a} onClick={() => setMenuOpen(false)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                style={{ padding: "8px 14px", fontFamily: F, fontSize: 12, color: T1, cursor: "pointer", transition: "background 0.1s" }}>{a}</div>
            ))}
            <div style={{ height: 1, background: BD, margin: "4px 0" }} />
            <div onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              style={{ padding: "8px 14px", fontFamily: F, fontSize: 12, color: "#EA4335", cursor: "pointer", transition: "background 0.1s" }}>Delete project</div>
          </div>
        )}
      </div>
      {confirmDelete && (
        <div onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 380, background: "#FFFFFF", borderRadius: 12, padding: 22 }}>
            <div style={{ fontFamily: FUI, fontSize: 16, fontWeight: 700, color: T1, marginBottom: 8 }}>Delete this project?</div>
            <div style={{ fontFamily: F, fontSize: 12.5, color: T3, marginBottom: 18 }}>This will permanently remove "{project.name}" and all its notes. This cannot be undone.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ height: 32, padding: "0 14px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: T2, background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { setConfirmDelete(false); onDelete(project.name); }} style={{ height: 32, padding: "0 14px", fontFamily: FUI, fontSize: 12, fontWeight: 500, color: "#FFFFFF", background: "#EA4335", border: "none", borderRadius: 6, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: M, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T4, marginBottom: 4 }}>{typeLabel}</div>
            <div style={{ fontFamily: FUI, fontSize: 16, fontWeight: 800, color: T1, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</div>
          </div>
          {overnightCount > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 20, fontFamily: M, fontSize: 9, color: TEAL, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, animation: "pulse 2s ease-in-out infinite" }} />
              {overnightCount} new since last visit
            </span>
          )}
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: T3, lineHeight: 1.55, fontWeight: 400, display: "-webkit-box", WebkitLineClamp: 2 as any, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
          {project.topic || project.summary || "Open this project to add notes and sources."}
        </div>
      </div>
      <div style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: M, fontSize: 10, color: T4 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="1" width="7" height="9" rx="1"/><path d="M3.5 4h4M3.5 6h4M3.5 8h2.5"/></svg>
            {sourceCount} sources
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: M, fontSize: 10, color: T4 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="9" height="8" rx="1"/><path d="M3 1v2M8 1v2M1 5h9"/></svg>
            Updated {fmtRelative(project.updated_at || project.created_at)}
          </span>
          <span style={{ fontFamily: M, fontSize: 9, fontWeight: 700, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, ...typeBadge }}>{typeLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {[1, 2, 3].slice(0, project.collaborators?.length || 1).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: TEAL, color: "#FFFFFF", fontFamily: M, fontSize: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #FFFFFF", marginLeft: i === 0 ? 0 : -5 }}>{(project.collaborators?.[i] || "U").slice(0, 1).toUpperCase()}</span>
              ))}
            </div>
            <span style={{ fontFamily: F, fontSize: 11, color: T4 }}>Tracking {sourceCount}</span>
          </div>
          <div style={{ display: "flex", gap: 6, opacity: hover ? 1 : 0, transition: "opacity 0.15s" }}>
            <button onClick={e => e.stopPropagation()} style={{ height: 26, padding: "0 10px", fontFamily: FUI, fontSize: 11, fontWeight: 500, color: "#3C4043", background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer" }}>Share</button>
            <button onClick={onClick} style={{ height: 26, padding: "0 10px", fontFamily: FUI, fontSize: 11, fontWeight: 500, color: "#FFFFFF", background: TEAL, border: "none", borderRadius: 6, cursor: "pointer" }}>{"Open \u203a"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: hover ? "rgba(29,158,117,0.05)" : "transparent",
      border: `1.5px dashed ${hover ? TEAL : BD}`,
      borderRadius: 12, padding: "32px 20px", minHeight: 160,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FFFFFF", border: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={hover ? TEAL : T4} strokeWidth="1.6"><path d="M8 2v12M2 8h12" strokeLinecap="round"/></svg>
      </div>
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T3, marginBottom: 4 }}>New project</div>
      <div style={{ fontFamily: F, fontSize: 11, color: T4 }}>Situation, investigation, reg watch, briefing or deal</div>
    </div>
  );
}

function NewProjectModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string, type: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("situation_report");
  if (!open) return null;
  const canCreate = name.trim().length > 0 && description.trim().length > 0;
  const types = [
    { id: "situation_report", label: "Situation", desc: "What is happening with a topic right now" },
    { id: "investigation", label: "Investigation", desc: "Build a case file on a developing story" },
    { id: "regulatory_watch", label: "Reg Watch", desc: "Track a regulation or treaty" },
    { id: "briefing_note", label: "Briefing", desc: "Prepare to speak or present" },
    { id: "deal_monitor", label: "Deal", desc: "Track a transaction" },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: "#FFFFFF", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div style={{ fontFamily: FUI, fontSize: 17, fontWeight: 800, color: T1, letterSpacing: "-0.3px" }}>New project</div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: "none", border: "none", color: T3, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>x</button>
        </div>
        <div style={{ padding: "16px 24px 20px" }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T4, marginBottom: 8 }}>Project name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name your project" style={{ width: "100%", padding: "10px 14px", fontFamily: FUI, fontSize: 14, fontWeight: 600, color: T1, border: `1px solid ${BD}`, borderRadius: 7, outline: "none", boxSizing: "border-box" }} onFocus={e => { (e.target as HTMLElement).style.borderColor = TEAL; }} onBlur={e => { (e.target as HTMLElement).style.borderColor = BD; }} />
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T4, marginTop: 18, marginBottom: 4 }}>What is this project about? <span style={{ color: "#EA4335" }}>*</span></div>
          <div style={{ fontFamily: F, fontSize: 11, color: T4, marginBottom: 8 }}>One sentence, this becomes the card summary and helps Tideline match the right intelligence.</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project tracking?" rows={2} style={{ width: "100%", padding: "10px 14px", fontFamily: F, fontSize: 13, color: T1, border: `1px solid ${BD}`, borderRadius: 7, outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} onFocus={e => { (e.target as HTMLElement).style.borderColor = TEAL; }} onBlur={e => { (e.target as HTMLElement).style.borderColor = BD; }} />
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T4, marginTop: 18, marginBottom: 8 }}>Project type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {types.map(t => {
              const sel = type === t.id;
              return (
                <div key={t.id} onClick={() => setType(t.id)} style={{ border: `1.5px solid ${sel ? TEAL : BD}`, background: sel ? "rgba(29,158,117,0.08)" : "#FFFFFF", borderRadius: 8, padding: "10px 12px", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: T1, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontFamily: F, fontSize: 10, color: T3, lineHeight: 1.3 }}>{t.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 24px", borderTop: `1px solid ${BD}` }}>
          <button onClick={onClose} style={{ height: 34, padding: "0 16px", fontFamily: FUI, fontSize: 13, fontWeight: 500, color: T3, background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 7, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (canCreate) onCreate(name.trim(), type); }} disabled={!canCreate} style={{ height: 34, padding: "0 16px", fontFamily: FUI, fontSize: 13, fontWeight: 700, color: "#FFFFFF", background: canCreate ? TEAL : "#BDC1C6", border: "none", borderRadius: 7, cursor: canCreate ? "pointer" : "not-allowed" }}>{"Create project \u203a"}</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsIndexPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Last updated");
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => { setProjects(d.projects || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const overnightProjects = projects.filter(p => (p.overnight_count || 0) > 0);
  const totalOvernight = overnightProjects.reduce((sum, p) => sum + (p.overnight_count || 0), 0);

  const filteredProjects = projects.filter(p => {
    if (filter === "All") return true;
    const label = TYPE_LABELS[p.project_type];
    return label === filter;
  });

  const handleCreate = async (name: string, type: string) => {
    try {
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, project_type: type }) });
      if (r.ok) {
        setShowNewModal(false);
        router.push(`/platform/projects/${encodeURIComponent(name)}`);
      }
    } catch {}
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100%", padding: "32px 40px 60px" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>Projects</div>
            <h1 style={{ fontFamily: FUI, fontSize: 28, fontWeight: 800, color: T1, letterSpacing: "-0.5px", margin: 0 }}>Your projects</h1>
            <p style={{ fontFamily: F, fontSize: 13, color: T3, fontWeight: 400, lineHeight: 1.5, maxWidth: 480, margin: "8px 0 0" }}>Each project is a live intelligence workspace. Tideline's agents file new evidence when you are away, open any project to find the work already done.</p>
          </div>
          <button onClick={() => setShowNewModal(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 20px",
            fontFamily: FUI, fontSize: 13, fontWeight: 700, color: "#FFFFFF", background: TEAL,
            border: "none", borderRadius: 7, cursor: "pointer", transition: "all 0.15s",
          }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(29,158,117,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 1v12M1 7h12" strokeLinecap="round"/></svg>
            New project
          </button>
        </div>

        {totalOvernight > 0 && (
          <div style={{ background: "linear-gradient(135deg, rgba(29,158,117,0.06), rgba(29,158,117,0.03))", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 10, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(29,158,117,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={TEAL} strokeWidth="1.4"><path d="M11 9.5A5 5 0 016.5 5a5 5 0 01.5-2.2A5.5 5.5 0 1013.2 9a5 5 0 01-2.2.5z" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: M, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: TEAL }}>New since your last visit</div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1 }}>{totalOvernight} new intelligence entries filed across {overnightProjects.length} projects</div>
              <div style={{ fontFamily: F, fontSize: 11.5, color: T3 }}>{overnightProjects.map(p => `${p.name} (${p.overnight_count})`).join(" \u00b7 ")}</div>
            </div>
            <button style={{ height: 30, padding: "0 14px", fontFamily: F, fontSize: 12, fontWeight: 500, color: "#FFFFFF", background: TEAL, border: "none", borderRadius: 6, cursor: "pointer" }}>Review all</button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontFamily: M, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: T4 }}>Filter</span>
          {["All", "Situation", "Investigation", "Reg Watch", "Briefing", "Deal"].map(f => {
            const active = filter === f;
            return (
              <span key={f} onClick={() => setFilter(f)} style={{
                padding: "4px 11px", fontFamily: F, fontSize: 11.5,
                fontWeight: active ? 600 : 500,
                border: `1px solid ${active ? TEAL : BD}`, borderRadius: 20, cursor: "pointer",
                background: active ? "rgba(29,158,117,0.08)" : "#FFFFFF",
                color: active ? TEAL : T3,
              }}>{f}</span>
            );
          })}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ marginLeft: "auto", fontFamily: M, fontSize: 11, padding: "5px 10px", border: `1px solid ${BD}`, borderRadius: 5, color: "#3C4043", background: "#FFFFFF", outline: "none", cursor: "pointer" }}>
            <option>Last updated</option>
            <option>Most sources</option>
            <option>Alphabetical</option>
            <option>Date created</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredProjects.map(p => <ProjectCard key={p.name} project={p} onClick={() => router.push(`/platform/projects/${encodeURIComponent(p.name)}`)} onDelete={(name) => setProjects(prev => prev.filter(x => x.name !== name))} />)}
          <NewProjectCard onClick={() => setShowNewModal(true)} />
        </div>
      </div>
      <NewProjectModal open={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
    </div>
  );
}
