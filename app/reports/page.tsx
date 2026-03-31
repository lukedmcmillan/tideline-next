"use client";

import { useState } from "react";

// ── Design tokens ────────────────────────────────────────────────────────
const NAVY    = "#0A1628";
const TEAL    = "#1D9E75";
const AMBER   = "#F9AB00";
const RED     = "#D93025";
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
function Sidebar() {
  const nav: { ic: React.ReactNode; label: string; href: string; active: boolean; badge?: string; badgeColor?: string }[] = [
    { ic: <IcFeed />, label: "Feed", href: "/platform/feed", active: false },
    { ic: <IcCal />, label: "Calendar", href: "/platform/calendar", active: false, badge: "2 due", badgeColor: AMBER },
    { ic: <IcWork />, label: "Workspace", href: "/workspace", active: false },
    { ic: <IcReport />, label: "Reports", href: "/reports", active: true },
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
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: WHITE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10c0-4 3.5-7 7-7s7 3 7 7" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round"/><circle cx="10" cy="14" r="2.5" fill={NAVY}/></svg>
        </div>
        <div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em", color: WHITE, display: "block", lineHeight: 1.1 }}>Tideline</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,.4)", letterSpacing: ".05em", textTransform: "uppercase", fontFamily: M }}>Ocean Intelligence</span>
        </div>
      </div>
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
interface ReportVersion {
  version: string;
  date: string;
  sources: number;
  latest: boolean;
}

interface ReportGroup {
  title: string;
  workspace: string;
  tracker: string;
  versions: ReportVersion[];
}

const REPORT_GROUPS: ReportGroup[] = [
  {
    title: "ISA Council July 2026 \u2014 Situation Report",
    workspace: "ISA Council July 2026 \u2014 Situation Report",
    tracker: "ISA Deep-Sea Watch",
    versions: [
      { version: "v2", date: "31 Mar 2026", sources: 8, latest: true },
      { version: "v1", date: "24 Mar 2026", sources: 5, latest: false },
    ],
  },
  {
    title: "OSPAR Article 9 Consultation Response",
    workspace: "OSPAR Article 9 Consultation Response",
    tracker: "OSPAR Commission",
    versions: [
      { version: "v1", date: "28 Mar 2026", sources: 6, latest: true },
    ],
  },
  {
    title: "IUU Enforcement Pacific \u2014 Entity Watch",
    workspace: "IUU Enforcement Pacific \u2014 Entity Watch",
    tracker: "IUU Enforcement",
    versions: [
      { version: "v3", date: "26 Mar 2026", sources: 12, latest: true },
      { version: "v2", date: "18 Mar 2026", sources: 9, latest: false },
      { version: "v1", date: "4 Mar 2026", sources: 6, latest: false },
    ],
  },
];

const TRACKER_CHIPS = [...new Set(REPORT_GROUPS.map(g => g.tracker))];

// ── Email modal ──────────────────────────────────────────────────────────
function EmailModal({ report, onClose }: { report: { title: string; tracker: string; date: string }; onClose: () => void }) {
  const [to, setTo] = useState("");
  const subject = `${report.title} (Tideline)`;
  const body = `Please find attached the latest version of the ${report.title}, covering developments tracked under ${report.tracker} as of ${report.date}.\n\nAll findings are sourced from primary governing body documents. Sources are cited throughout.`;
  const filename = report.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase() + ".docx";

  const sendMailto = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: WHITE, borderRadius: 12, padding: "28px 32px", width: 480, boxShadow: "0 16px 48px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T1, marginBottom: 4 }}>Email this report</div>
        <div style={{ fontSize: 13, color: T3, marginBottom: 20 }}>Tideline has drafted a covering message. Review before sending.</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: T2, display: "block", marginBottom: 4 }}>To</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "9px 12px", outline: "none", color: T1 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: T2, display: "block", marginBottom: 4 }}>Subject</label>
          <input value={subject} readOnly style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "9px 12px", outline: "none", color: T1, background: BG }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: T2, display: "block", marginBottom: 4 }}>Message</label>
          <textarea defaultValue={body} rows={5} style={{ width: "100%", fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "9px 12px", outline: "none", color: T1, resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: BG, borderRadius: 6, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={T4} strokeWidth="1.3"><path d="M7 1v8M4 6l3 3 3-3M2 11h10v2H2z"/></svg>
          <span style={{ fontSize: 12, color: T2 }}>{filename}</span>
        </div>

        <div style={{ fontSize: 11, color: T4, marginBottom: 16, lineHeight: 1.5 }}>Review before sending. Do not send generated text without checking it.</div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 36, fontSize: 14, fontWeight: 500, fontFamily: F, color: T2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 16px", cursor: "pointer" }}>Cancel</button>
          <button onClick={sendMailto} style={{ height: 36, fontSize: 14, fontWeight: 500, fontFamily: F, color: WHITE, background: NAVY, border: "none", borderRadius: 4, padding: "0 16px", cursor: "pointer" }}>Send via mail client</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
type FilterChip = "all" | string;

export default function ReportsPage() {
  const [filter, setFilter] = useState<FilterChip>("all");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [emailReport, setEmailReport] = useState<{ title: string; tracker: string; date: string } | null>(null);

  const filteredGroups = REPORT_GROUPS.filter(g => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "all" && g.tracker !== filter) return false;
    return true;
  });

  const totalReports = filteredGroups.reduce((n, g) => n + g.versions.length, 0);

  const colHeader = (label: string, width?: number) => (
    <th style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${BLT}`, width: width || "auto", whiteSpace: "nowrap" }}>{label}</th>
  );

  return (
    <div style={{ display: "flex", fontFamily: F, color: T1, background: BG, height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ height: 56, background: WHITE, boxShadow: "0 1px 3px rgba(0,0,0,.08)", display: "flex", alignItems: "center", padding: "0 24px", flexShrink: 0, zIndex: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: T1, letterSpacing: "-.02em" }}>Reports</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 10, top: 9 }}><circle cx="6" cy="6" r="4.5" stroke={T4} strokeWidth="1.2"/><path d="M9.5 9.5l3 3" stroke={T4} strokeWidth="1.2" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ width: 220, height: 36, fontSize: 13, fontFamily: F, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 12px 0 32px", outline: "none", color: T1, background: WHITE }} />
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", background: WHITE, borderBottom: `1px solid ${BLT}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setFilter("all")} style={{
              height: 32, fontSize: 13, fontWeight: filter === "all" ? 500 : 400, fontFamily: F,
              color: filter === "all" ? WHITE : T3, background: filter === "all" ? TEAL : WHITE,
              border: `1px solid ${filter === "all" ? TEAL : "transparent"}`, borderRadius: 16,
              padding: "0 14px", cursor: "pointer",
            }}>All reports</button>
            {TRACKER_CHIPS.map(t => {
              const on = filter === t;
              return (
                <button key={t} onClick={() => setFilter(t)} style={{
                  height: 32, fontSize: 13, fontWeight: on ? 500 : 400, fontFamily: F,
                  color: on ? WHITE : T3, background: on ? TEAL : WHITE,
                  border: `1px solid ${on ? TEAL : "transparent"}`, borderRadius: 16,
                  padding: "0 14px", cursor: "pointer",
                }}>{t}</button>
              );
            })}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T4 }}>{totalReports} {totalReports === 1 ? "report" : "reports"}</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <thead>
              <tr>
                {colHeader("Report")}
                {colHeader("Tracker", 160)}
                {colHeader("Generated", 120)}
                {colHeader("Sources", 80)}
                <th style={{ width: 36, borderBottom: `1px solid ${BLT}` }} />
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, gi) => (
                <>
                  {/* Group divider */}
                  {gi > 0 && (
                    <tr key={`div-${gi}`}><td colSpan={5} style={{ height: 8, background: BG, border: "none" }} /></tr>
                  )}

                  {group.versions.map((v, vi) => {
                    const rowKey = `${gi}-${vi}`;
                    const isLatest = v.latest;
                    const isOlder = !isLatest;

                    return (
                      <tr
                        key={rowKey}
                        onMouseEnter={() => setHoveredRow(rowKey)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ background: hoveredRow === rowKey ? BG : WHITE }}
                      >
                        <td style={{ padding: isOlder ? "0 12px 0 32px" : "0 12px", height: 56, borderBottom: `1px solid ${ROW_BG}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isLatest && (
                              <>
                                <span style={{ fontSize: 13, fontWeight: 500, color: T1 }}>{group.title}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: M, color: T4, background: BG, borderRadius: 3, padding: "1px 5px" }}>{v.version}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: TEAL, background: "rgba(29,158,117,.1)", borderRadius: 3, padding: "1px 5px" }}>Latest</span>
                              </>
                            )}
                            {isOlder && (
                              <span style={{ fontSize: 12, color: T4 }}>{v.version}</span>
                            )}
                          </div>
                          {isLatest && (
                            <div style={{ fontSize: 11, color: T4, marginTop: 2 }}>From workspace: {group.workspace}</div>
                          )}
                        </td>
                        <td style={{ padding: "0 12px", height: 56, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4 }}>
                          {isLatest ? group.tracker : ""}
                        </td>
                        <td style={{ padding: "0 12px", height: 56, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4 }}>
                          {v.date}
                        </td>
                        <td style={{ padding: "0 12px", height: 56, borderBottom: `1px solid ${ROW_BG}`, fontSize: 12, color: T4, textAlign: "right" }}>
                          {v.sources}
                        </td>
                        <td style={{ padding: "0 8px", height: 56, borderBottom: `1px solid ${ROW_BG}` }}>
                          <div style={{ display: "flex", gap: 4, opacity: hoveredRow === rowKey ? 1 : 0, transition: "opacity .15s" }}>
                            {isLatest && (
                              <button onClick={() => setEmailReport({ title: group.title, tracker: group.tracker, date: v.date })} style={{
                                height: 28, display: "flex", alignItems: "center", gap: 4, padding: "0 8px",
                                fontSize: 11, fontWeight: 500, fontFamily: F, color: TEAL,
                                background: WHITE, border: `1px solid rgba(29,158,117,.3)`, borderRadius: 4, cursor: "pointer",
                              }}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={TEAL} strokeWidth="1.2"><rect x="1" y="2.5" width="10" height="7" rx="1"/><path d="M1 3.5l5 3 5-3"/></svg>
                                Email
                              </button>
                            )}
                            <button style={{
                              height: 28, display: "flex", alignItems: "center", gap: 4, padding: "0 8px",
                              fontSize: 11, fontWeight: 500, fontFamily: F, color: T3,
                              background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer",
                            }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M2 10h8"/></svg>
                              .docx
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {emailReport && <EmailModal report={emailReport} onClose={() => setEmailReport(null)} />}
    </div>
  );
}
