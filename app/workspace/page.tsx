"use client";

import { useState } from "react";

// ── Design tokens ────────────────────────────────────────────────────────
const NAVY    = "#0A1628";
const TEAL    = "#1D9E75";
const AMBER   = "#F9AB00";
const RED     = "#D93025";
const BLUE    = "#185FA5";
const WHITE   = "#FFFFFF";
const BG      = "#F8F9FA";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const ROW_BG  = "#F1F3F4";
const F       = "'DM Sans', system-ui, sans-serif";
const M       = "'DM Mono', monospace";

// ── Icons ────────────────────────────────────────────────────────────────
const IcFeed = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5"/></svg>;
const IcCal = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="16" height="15" rx="2"/><path d="M6 1v2M12 1v2M1 8h16"/></svg>;
const IcWork = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2h10v14H4z" rx="1.5"/><path d="M7 5h4M7 8h4M7 11h2"/></svg>;
const IcReport = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h12v15l-6-4-6 4V2z"/></svg>;
const IcSearch = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M13 13l4 4"/></svg>;
const IcDir = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="3"/><circle cx="12" cy="12" r="3"/><path d="M8.5 8.5l1 1"/><circle cx="12" cy="6" r="3"/><path d="M8.5 7.5l2-1"/></svg>;

// ── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ activePage }: { activePage: "workspace" | "reports" }) {
  const nav: { ic: React.ReactNode; label: string; href: string; active: boolean; badge?: string; badgeColor?: string }[] = [
    { ic: <IcFeed />, label: "Feed", href: "/platform/feed", active: false },
    { ic: <IcCal />, label: "Calendar", href: "/platform/calendar", active: false, badge: "2 due", badgeColor: AMBER },
    { ic: <IcWork />, label: "Workspace", href: "/workspace", active: activePage === "workspace" },
    { ic: <IcReport />, label: "Reports", href: "/reports", active: activePage === "reports" },
    { ic: <IcSearch />, label: "Research", href: "/platform/research", active: false },
    { ic: <IcDir />, label: "Directory", href: "/platform/directory", active: false },
  ];

  const trackers = [
    { name: "BBNJ Treaty", color: TEAL, badge: "3 today" },
    { name: "ISA Mining", color: AMBER, badge: "1 today" },
    { name: "IUU Enforcement", color: RED, badge: "2 today" },
    { name: "30x30 Protection", color: TEAL, badge: null },
    { name: "Blue Finance", color: AMBER, badge: "1 today" },
  ];

  return (
    <div style={{ width: 248, background: NAVY, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10c0-4 3.5-7 7-7s7 3 7 7" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round"/><circle cx="10" cy="14" r="2.5" fill={NAVY}/></svg>
        </div>
        <div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: WHITE, display: "block", lineHeight: 1.1 }}>Tideline</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,.4)", letterSpacing: ".05em", textTransform: "uppercase", fontFamily: M }}>Ocean Intelligence</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px 0 0" }}>
        {nav.map(n => (
          <a key={n.label} href={n.href} style={{
            display: "flex", alignItems: "center", height: 44, padding: "0 20px 0 52px",
            fontSize: 14, fontFamily: F, fontWeight: n.active ? 500 : 400,
            color: n.active ? WHITE : "rgba(255,255,255,.55)",
            background: n.active ? "rgba(29,158,117,.14)" : "transparent",
            textDecoration: "none", position: "relative",
          }}>
            {n.active && <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: "0 3px 3px 0", background: TEAL }} />}
            <span style={{ position: "absolute", left: 18, width: 20, display: "flex", alignItems: "center", justifyContent: "center", color: n.active ? TEAL : "rgba(255,255,255,.35)" }}>{n.ic}</span>
            {n.label}
            {n.badge && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, background: n.badgeColor || TEAL, color: "#fff", borderRadius: 8, padding: "1px 7px" }}>{n.badge}</span>}
          </a>
        ))}
      </div>

      {/* Trackers */}
      <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.28)", padding: "10px 20px 4px" }}>Trackers</div>
      {trackers.map(t => (
        <a key={t.name} href="#" style={{ display: "flex", alignItems: "center", height: 36, padding: "0 16px 0 20px", fontSize: 13, fontFamily: F, color: "rgba(255,255,255,.55)", textDecoration: "none" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0, marginRight: 10 }} />
          {t.name}
          {t.badge && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "1px 7px", color: "rgba(255,255,255,.4)" }}>{t.badge}</span>}
        </a>
      ))}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────
type ReportStatus = "not_generated" | "generated" | "needs_update";

interface ProjectRow {
  id: string;
  name: string;
  tracker: string;
  lastEdited: string;
  report: ReportStatus;
  reportDate?: string;
  sources: number;
}

const PROJECTS: ProjectRow[] = [
  { id: "1", name: "ISA Council July 2026 \u2014 Situation Report", tracker: "ISA Deep-Sea Watch", lastEdited: "2 hours ago", report: "needs_update", sources: 8 },
  { id: "2", name: "OSPAR Article 9 Consultation Response", tracker: "OSPAR Commission", lastEdited: "3 days ago", report: "generated", reportDate: "28 Mar", sources: 6 },
  { id: "3", name: "BBNJ Implementation \u2014 Q2 Briefing", tracker: "BBNJ Implementation", lastEdited: "Yesterday", report: "not_generated", sources: 4 },
  { id: "4", name: "IUU Enforcement Pacific \u2014 Entity Watch", tracker: "IUU Enforcement", lastEdited: "5 days ago", report: "generated", reportDate: "26 Mar", sources: 12 },
  { id: "5", name: "Blue Finance \u2014 IFC Certification Analysis", tracker: "Blue Finance", lastEdited: "6 days ago", report: "not_generated", sources: 3 },
];

const TRACKERS = ["ISA Deep-Sea Watch", "BBNJ Implementation", "OSPAR Commission", "IUU Enforcement", "Blue Finance", "30x30 Protection", "IMO Shipping"];

function statusDot(report: ReportStatus) {
  if (report === "generated") return TEAL;
  if (report === "needs_update") return AMBER;
  return T4;
}

function ReportBadge({ report, date }: { report: ReportStatus; date?: string }) {
  if (report === "generated") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: TEAL }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke={TEAL} strokeWidth="1.2"/><path d="M3.5 6l2 2 3-3.5" stroke={TEAL} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Generated {date}
    </span>
  );
  if (report === "needs_update") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: AMBER }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke={AMBER} strokeWidth="1.2"/><path d="M6 3.5v3M6 8.5v.01" stroke={AMBER} strokeWidth="1.2" strokeLinecap="round"/></svg>
      Needs update
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: T4 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke={T4} strokeWidth="1.2"/><path d="M6 3.5v3l2 1" stroke={T4} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Not generated
    </span>
  );
}

// ── New project modal ────────────────────────────────────────────────────
function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [tracker, setTracker] = useState(TRACKERS[0]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: WHITE, borderRadius: 12, padding: "28px 32px", width: 420, boxShadow: "0 16px 48px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 4 }}>New project</div>
        <div style={{ fontSize: 13, color: T3, marginBottom: 20 }}>Create a workspace project to organise intelligence and draft responses.</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: T2, display: "block", marginBottom: 4 }}>Project name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ISA Council July 2026 Response" style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "9px 12px", outline: "none", color: T1 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: T2, display: "block", marginBottom: 4 }}>Tracker</label>
          <select value={tracker} onChange={e => setTracker(e.target.value)} style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "9px 12px", outline: "none", color: T1, background: WHITE }}>
            {TRACKERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 36, fontSize: 14, fontWeight: 500, fontFamily: F, color: T2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 16px", cursor: "pointer" }}>Cancel</button>
          <button style={{ height: 36, fontSize: 14, fontWeight: 500, fontFamily: F, color: WHITE, background: NAVY, border: "none", borderRadius: 4, padding: "0 16px", cursor: "pointer", opacity: name.trim() ? 1 : 0.5 }}>Create project</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
type FilterChip = "all" | "in_progress" | "generated" | "needs_update";

export default function WorkspaceIndex() {
  const [filter, setFilter] = useState<FilterChip>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = PROJECTS.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "in_progress") return p.report === "not_generated" || p.report === "needs_update";
    if (filter === "generated") return p.report === "generated";
    if (filter === "needs_update") return p.report === "needs_update";
    return true;
  });

  const chips: { key: FilterChip; label: string }[] = [
    { key: "all", label: "All projects" },
    { key: "in_progress", label: "In progress" },
    { key: "generated", label: "Report generated" },
    { key: "needs_update", label: "Needs update" },
  ];

  const colHeader = (label: string, width?: number) => (
    <th style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${BLT}`, width: width || "auto", whiteSpace: "nowrap" }}>{label}</th>
  );

  return (
    <div style={{ display: "flex", fontFamily: F, color: T1, background: BG, height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage="workspace" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ height: 56, background: WHITE, boxShadow: "0 1px 3px rgba(0,0,0,.08)", display: "flex", alignItems: "center", padding: "0 24px", flexShrink: 0, zIndex: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em" }}>Workspace</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 10, top: 9 }}><circle cx="6" cy="6" r="4.5" stroke={T4} strokeWidth="1.2"/><path d="M9.5 9.5l3 3" stroke={T4} strokeWidth="1.2" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter projects" style={{ width: 220, height: 36, fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 12px 0 32px", outline: "none", color: T1, background: WHITE }} />
            </div>
            <button onClick={() => setShowModal(true)} style={{ height: 34, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", fontSize: 14, fontWeight: 500, fontFamily: F, color: WHITE, background: NAVY, border: "none", borderRadius: 4, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v10M1 6h10" strokeLinecap="round"/></svg>
              New project
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", background: WHITE, borderBottom: `1px solid ${BLT}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            {chips.map(c => {
              const on = filter === c.key;
              return (
                <button key={c.key} onClick={() => setFilter(c.key)} style={{
                  height: 32, fontSize: 13, fontWeight: on ? 500 : 400, fontFamily: F,
                  color: on ? WHITE : T3, background: on ? TEAL : WHITE,
                  border: `1px solid ${on ? TEAL : "transparent"}`, borderRadius: 16,
                  padding: "0 14px", cursor: "pointer",
                }}>
                  {c.label}
                </button>
              );
            })}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T4 }}>{filtered.length} {filtered.length === 1 ? "project" : "projects"}</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <thead>
              <tr>
                {colHeader("Project name")}
                {colHeader("Tracker", 160)}
                {colHeader("Last edited", 120)}
                {colHeader("Report", 160)}
                {colHeader("Sources", 80)}
                <th style={{ width: 36, borderBottom: `1px solid ${BLT}` }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => window.location.href = `/workspace/${p.id}`}
                  style={{ cursor: "pointer", background: hoveredRow === p.id ? BG : WHITE }}
                >
                  <td style={{ padding: "0 12px", height: 52, borderBottom: `1px solid ${ROW_BG}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusDot(p.report), flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0 12px", height: 52, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4 }}>{p.tracker}</td>
                  <td style={{ padding: "0 12px", height: 52, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4 }}>{p.lastEdited}</td>
                  <td style={{ padding: "0 12px", height: 52, borderBottom: `1px solid ${ROW_BG}` }}><ReportBadge report={p.report} date={p.reportDate} /></td>
                  <td style={{ padding: "0 12px", height: 52, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4, textAlign: "right" }}>{p.sources}</td>
                  <td style={{ padding: "0 4px", height: 52, borderBottom: `1px solid ${ROW_BG}` }}>
                    <button onClick={e => e.stopPropagation()} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 4, cursor: "pointer", color: T4, opacity: hoveredRow === p.id ? 1 : 0, transition: "opacity .15s" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="3" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="7" cy="11" r="1.2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* New project row */}
          <div
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", height: 48, padding: "0 12px", cursor: "pointer", borderBottom: `1px solid ${ROW_BG}` }}
            onMouseEnter={e => (e.currentTarget.style.background = BG)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={TEAL} strokeWidth="1.5" style={{ marginRight: 10 }}><path d="M7 2v10M2 7h10" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: TEAL }}>New project</span>
          </div>
        </div>
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
