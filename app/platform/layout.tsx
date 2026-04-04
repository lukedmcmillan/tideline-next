"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

// ── Design tokens ─────────────────────────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const NAVY2  = "#0D1F35";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const RED    = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M      = "var(--font-mono), 'DM Mono', monospace";

// ── Icons (inline SVG) ────────────────────────────────────────────────────
const IcFeed = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5"/></svg>;
const IcCal = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="16" height="15" rx="2"/><path d="M6 1v2M12 1v2M1 8h16"/></svg>;
const IcBook = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h12v15l-6-4-6 4V2z"/></svg>;
const IcWork = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="16" height="13" rx="2"/><path d="M6 3V1M12 3V1"/></svg>;
const IcSearch = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M13 13l4 4"/></svg>;
const IcDir = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="3"/><circle cx="12" cy="12" r="3"/><path d="M8.5 8.5l1 1"/><circle cx="12" cy="6" r="3"/><path d="M8.5 7.5l2-1"/></svg>;

// ── Tracker tooltips ──────────────────────────────────────────────────────
const TIPS: Record<string, { st: string; c: string; d: string }> = {
  "BBNJ Treaty": { st: "Active \u2014 in force", c: TEAL, d: "87 ratifications. Pacific bloc deposit confirmed 06:42." },
  "ISA Mining": { st: "Developing \u2014 watch", c: AMBER, d: "Council vote deferred to July. 3 states signalled opposition." },
  "IUU Enforcement": { st: "Enforcement action", c: RED, d: "Vessel detained under falsified flag. Port state action 03:30." },
  "30x30 Protection": { st: "Active", c: TEAL, d: "Chile MPA. Global ocean coverage 24.3% toward 30% target." },
  "Blue Finance": { st: "Developing", c: AMBER, d: "IFC framework published. 7 new blue bonds in pipeline." },
};

// ── Sidebar types ────────────────────────────────────────────────────────
interface TrackerData { name: string; count24: number; count48: number }
interface ProjectData { name: string; count: number }
interface RecentStory { id: string; title: string }

function trackerColor(t: TrackerData): string {
  if (t.count24 > 0) return TEAL;
  if (t.count48 > 0) return AMBER;
  return RED;
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ onNav, urgentCount, trackerData, projectData, recentStories, onShortcuts }: {
  onNav?: () => void;
  urgentCount?: number;
  trackerData?: TrackerData[];
  projectData?: ProjectData[];
  recentStories?: RecentStory[];
  onShortcuts?: () => void;
}) {
  const path = usePathname();
  const [hTip, setHTip] = useState<string | null>(null);

  const nav: { ic: React.ReactNode; label: string; href: string; badge?: string; badgeColor?: string }[] = [
    { ic: <IcFeed />, label: "Feed", href: "/platform/feed" },
    { ic: <IcCal />, label: "Calendar", href: "/platform/calendar", badge: urgentCount && urgentCount > 0 ? String(urgentCount) : undefined, badgeColor: RED },
    { ic: <IcBook />, label: "Library", href: "/platform/library" },
    { ic: <IcWork />, label: "Workspace", href: "/platform/workspace", badge: projectData && projectData.length > 0 ? String(projectData.length) : undefined },
    { ic: <IcSearch />, label: "Research", href: "/platform/research" },
    { ic: <IcDir />, label: "Directory", href: "/platform/directory" },
  ];

  const trackers = (trackerData || []).map(t => ({
    name: t.name,
    color: trackerColor(t),
    badge: t.count24 > 0 ? `${t.count24} today` : null,
    pulse: t.count24 >= 3,
  }));

  const active = (h: string) => {
    if (h === "/platform/feed") return path === "/platform" || path === "/platform/feed";
    return path?.startsWith(h) || false;
  };

  return (
    <div style={{ width: 256, background: NAVY, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Nav */}
      <div style={{ padding: "8px 0 0" }}>
        {nav.map(n => {
          const on = active(n.href);
          return (
            <a key={n.label} href={n.href} onClick={onNav} style={{
              display: "flex", alignItems: "center", height: 48, padding: "0 28px 0 72px",
              fontSize: 14, fontFamily: F, color: on ? "#fff" : "rgba(255,255,255,.6)",
              background: on ? "rgba(29,158,117,.14)" : "transparent",
              fontWeight: on ? 500 : 400, textDecoration: "none", position: "relative",
              transition: "background .12s",
            }}>
              {on && <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: "0 3px 3px 0", background: TEAL }} />}
              <span style={{ position: "absolute", left: 24, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: on ? TEAL : "rgba(255,255,255,.4)" }}>{n.ic}</span>
              {n.label}
              {n.badge && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, background: n.badgeColor || TEAL, color: "#fff", borderRadius: 10, padding: "1px 8px" }}>{n.badge}</span>}
            </a>
          );
        })}
      </div>

      {/* Divider + Trackers */}
      <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "4px 0" }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", padding: "12px 28px 6px" }}>Trackers</div>
      {trackers.map(t => (
        <div key={t.name} style={{ position: "relative" }} onMouseEnter={() => setHTip(t.name)} onMouseLeave={() => setHTip(null)}>
          <a href="/tracker/bbnj" style={{
            display: "flex", alignItems: "center", height: 40, padding: "0 20px 0 28px",
            fontSize: 13, fontFamily: F, color: "rgba(255,255,255,.6)", textDecoration: "none",
            borderRight: t.pulse ? `2px solid ${RED}` : "2px solid transparent",
            transition: "background .12s",
          }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.color, flexShrink: 0, marginRight: 12, animation: t.pulse ? "pulse 1.8s ease-in-out infinite" : "none" }} />
            {t.name}
            {t.badge && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "1px 7px", color: "rgba(255,255,255,.5)" }}>{t.badge}</span>}
          </a>
          {hTip === t.name && TIPS[t.name] && (
            <div style={{ position: "absolute", left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)", background: "#1a1a2e", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 14px", width: 220, zIndex: 500, pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: TIPS[t.name].c, marginBottom: 4 }}>{"\u25CF"} {TIPS[t.name].st}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", lineHeight: 1.5 }}>{TIPS[t.name].d}</div>
            </div>
          )}
        </div>
      ))}

      {/* Workspace */}
      <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "4px 0" }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", padding: "12px 28px 6px" }}>Workspace</div>
      {(projectData || []).length > 0 ? (projectData || []).map(p => (
        <a key={p.name} href={`/platform/workspace?project=${encodeURIComponent(p.name)}`} style={{ display: "flex", alignItems: "center", height: 40, padding: "0 20px 0 28px", fontSize: 13, fontFamily: F, color: "rgba(255,255,255,.6)", textDecoration: "none" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: TEAL, flexShrink: 0, marginRight: 12 }} />
          {p.name}
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "1px 7px", color: "rgba(255,255,255,.5)" }}>{p.count} {p.count === 1 ? "item" : "items"}</span>
        </a>
      )) : (recentStories || []).length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "rgba(255,255,255,.25)", padding: "4px 28px 4px" }}>Recent</div>
          {(recentStories || []).slice(0, 3).map(s => (
            <a key={s.id} href={`/platform/story/${s.id}`} style={{ display: "block", height: 36, lineHeight: "36px", padding: "0 28px", fontSize: 12, fontFamily: F, color: "rgba(255,255,255,.45)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(s.title || "").slice(0, 45)}{(s.title || "").length > 45 ? "..." : ""}
            </a>
          ))}
        </>
      )}
      <a href="/platform/workspace" style={{ display: "flex", alignItems: "center", height: 40, padding: "0 20px 0 28px", fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "none" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.3)", flexShrink: 0, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M3.5 1v5M1 3.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </span>
        New project
      </a>

      {/* Footer: streak + queries */}
      <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,.08)", padding: 16 }}>
        <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 32, fontWeight: 500, color: "#fff", lineHeight: 1, letterSpacing: "-.03em" }}>12</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.5)" }}>day streak</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>Since 14 March</div>
          <div style={{ display: "flex", gap: 5 }}>
            {[...Array(7)].map((_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === 6 ? TEAL : i < 6 ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.12)" }} />)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[...Array(10)].map((_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < 7 ? "rgba(255,255,255,.4)" : i === 7 ? AMBER : "rgba(255,255,255,.12)" }} />)}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>8 queries today</span>
        </div>
        {onShortcuts && (
          <button
            onClick={onShortcuts}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "transparent", border: "1px solid rgba(255,255,255,.15)",
              fontFamily: M, fontSize: 13, color: "rgba(255,255,255,.4)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 8,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = TEAL; (e.currentTarget as HTMLElement).style.color = TEAL; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,.15)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.4)"; }}
          >?</button>
        )}
      </div>
    </div>
  );
}

// ── Calendar widget (shared) ─────────────────────────────────────────────
function CalendarWidget() {
  return (
    <div style={{ padding: 20, borderBottom: `1px solid ${BLT}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Regulatory calendar</div>
      {[
        { date: "31 Mar", days: "1 day", title: "EU CSRD Ocean Reporting Deadline", c: RED },
        { date: "3 Apr", days: "4 days", title: "OSPAR Fisheries Recovery Zones", c: RED },
        { date: "30 Apr", days: "31 days", title: "ISA Environmental Safeguard Review", c: AMBER },
        { date: "16 May", days: "47 days", title: "ISWG-GHG 17", c: AMBER },
      ].map((e, i) => (
        <div key={i} style={{ padding: "11px 0", borderBottom: `1px solid ${BLT}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: e.c, marginBottom: 2 }}>{e.date} {e.days && `\u2014 ${e.days}`}</div>
          <div style={{ fontSize: 13, color: T1, lineHeight: 1.35 }}>{e.title}</div>
        </div>
      ))}
      <a href="/platform/calendar" style={{ fontSize: 12, fontWeight: 500, color: TEAL, marginTop: 12, display: "block", cursor: "pointer", textDecoration: "none" }}>View full calendar &rarr;</a>
    </div>
  );
}

// ── Calendar right panel ─────────────────────────────────────────────────
function CalendarRightPanel() {
  const BODIES = ["OSPAR", "European Commission", "ISA", "IMO", "CBD", "IWC", "CCAMLR", "ICCAT", "CITES", "WTO-Fish"];
  return (
    <div style={{ width: 268, flexShrink: 0, background: WHITE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }} className="rp-desktop">
      {/* Coverage summary */}
      <div style={{ padding: 20, borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>Coverage summary</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, background: BG, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", color: T1, lineHeight: 1 }}>6</div>
            <div style={{ fontSize: 11, color: T4, marginTop: 4 }}>Open items</div>
          </div>
          <div style={{ flex: 1, background: BG, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", color: TEAL, lineHeight: 1 }}>5</div>
            <div style={{ fontSize: 11, color: T4, marginTop: 4 }}>Covered</div>
          </div>
        </div>
      </div>

      {/* Monitored bodies */}
      <div style={{ padding: 20, borderBottom: `1px solid ${BLT}`, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Monitored bodies</div>
        {BODIES.map(b => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T2 }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Suggest missing */}
      <div style={{ padding: 20 }}>
        <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontFamily: F, fontSize: 12, fontWeight: 500, color: T3, cursor: "pointer" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M6.5 1v11M1 6.5h11" strokeLinecap="round" /></svg>
          Suggest a missing consultation
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${BLT}`, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T4} strokeWidth="1.3"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
        <span style={{ fontSize: 13, color: T3 }}>Settings &amp; sources</span>
      </div>
    </div>
  );
}

// ── Right Panel ───────────────────────────────────────────────────────────
// ── Workspace right panel ────────────────────────────────────────────────
function WorkspaceRightPanel() {
  const [saved, setSaved] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/stories?limit=8").then(r => r.ok ? r.json() : { stories: [] }).then(d => setSaved(d.stories || [])).catch(() => {});
  }, []);
  return (
    <div style={{ width: 268, flexShrink: 0, background: WHITE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }} className="rp-desktop">
      <div style={{ padding: 20, borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Your sources</div>
        {saved.slice(0, 8).map((s: any) => (
          <div key={s.id} style={{ padding: "8px 0", borderBottom: `1px solid ${BLT}` }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: T1, lineHeight: 1.35, marginBottom: 3 }}>{(s.title || "").slice(0, 60)}{(s.title || "").length > 60 ? "..." : ""}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T4 }}>{s.source_name} {s.published_at ? `\u00B7 ${new Date(s.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</span>
              <button onClick={() => window.dispatchEvent(new CustomEvent("tideline:insert-citation", { detail: { title: s.title, source_name: s.source_name, published_at: s.published_at, short_summary: s.short_summary } }))} style={{ fontSize: 10, fontWeight: 600, color: TEAL, background: "none", border: "none", cursor: "pointer", fontFamily: F, padding: 0 }}>+ Insert</button>
            </div>
          </div>
        ))}
      </div>
      <CalendarWidget />
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${BLT}`, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T4} strokeWidth="1.3"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
        <span style={{ fontSize: 13, color: T3 }}>Settings &amp; sources</span>
      </div>
    </div>
  );
}

function RightPanel() {
  const path = usePathname();
  const [copied, setCopied] = useState(false);
  const isCalendar = path === "/platform/calendar";
  const isWorkspace = path === "/platform/workspace";

  if (isCalendar) return <CalendarRightPanel />;
  if (isWorkspace) return null;

  const copyInsight = () => {
    navigator.clipboard.writeText("ISA deferral and BBNJ ratification are directly linked. Three sponsoring states conditioning their ISA vote on implementation terms.").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ width: 268, flexShrink: 0, background: WHITE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }} className="rp-desktop">
      {/* Connections */}
      <div style={{ padding: 20, borderBottom: `1px solid ${BLT}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, animation: "pulse 2.5s ease-in-out infinite" }} />
          Tideline connections
        </div>
        <div style={{ fontSize: 12, color: T4, fontStyle: "italic", marginBottom: 14 }}>Patterns across trackers today.</div>
        <div style={{ borderLeft: `3px solid ${TEAL}`, padding: "14px 14px 14px 16px" }}>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: T1, marginBottom: 12 }}>The ISA deferral and accelerating BBNJ ratification are directly linked. Three sponsoring states are conditioning their ISA vote on BBNJ implementation terms.</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {["ISA Mining", "BBNJ Treaty"].map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", border: `1px solid rgba(29,158,117,.22)`, borderRadius: 4, padding: "3px 9px", color: TEAL, background: "rgba(255,255,255,.7)" }}>{t}</span>
            ))}
          </div>
          <button onClick={copyInsight} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: WHITE, border: `1.5px solid rgba(29,158,117,.22)`, borderRadius: 8, padding: "8px 12px", fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL, cursor: "pointer" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4V3a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0112 3v5a1.5 1.5 0 01-1.5 1.5H9" stroke="currentColor" strokeWidth="1.3"/></svg>
            {copied ? "Copied" : "Copy for meeting"}
          </button>
        </div>
      </div>

      {/* Calendar widget — always visible */}
      <CalendarWidget />

      {/* Footer */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${BLT}`, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T4} strokeWidth="1.3"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
        <span style={{ fontSize: 13, color: T3 }}>Settings &amp; sources</span>
      </div>
      <div style={{ padding: "10px 20px", borderTop: `1px solid ${BLT}` }}>
        <a style={{ fontSize: 12, fontWeight: 500, color: TEAL, cursor: "pointer", textDecoration: "none" }}>How Tideline works &rarr;</a>
      </div>
    </div>
  );
}

// ── Search Overlay ────────────────────────────────────────────────────────
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,.55)", backdropFilter: "blur(3px)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 660, background: WHITE, borderRadius: 24, boxShadow: "0 16px 48px rgba(0,0,0,.3)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: `1px solid ${BLT}` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke={T4} strokeWidth="1.5"/><path d="M13 13l4 4" stroke={T4} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input autoFocus placeholder="Ask Tideline anything\u2026" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: F, fontSize: 16, color: T1 }} />
          <span onClick={onClose} style={{ fontSize: 12, background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "2px 9px", color: T4, cursor: "pointer", fontFamily: M }}>Esc</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "10px 22px 2px" }}>What people are asking Tideline today</div>
        <div style={{ fontSize: 12, color: T4, padding: "2px 22px 8px", fontStyle: "italic" }}>Rotating from this week's most-asked queries</div>
        {[
          { q: "What changed in deep-sea mining regulation in the last 30 days?", sub: "Research \u00b7 Tideline Intelligence" },
          { q: "Summarise BBNJ ratification and enforcement implications", sub: "Research \u00b7 Tideline Intelligence" },
          { q: "What does the ISA deferral mean for my uploaded OSPAR report?", sub: "Research \u00b7 Uses your documents" },
        ].map((item, i) => (
          <a key={i} href="/platform/research" style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 22px", cursor: "pointer", textDecoration: "none", color: T1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke={TEAL} strokeWidth="1.4"/><path d="M11 11l3.5 3.5" stroke={TEAL} strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, color: T1 }}>{item.q}</div>
              <div style={{ fontSize: 12, color: T4, marginTop: 2 }}>{item.sub}</div>
            </div>
          </a>
        ))}
        <div style={{ borderTop: `1px solid ${BLT}`, padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: T4 }}>Enter to search &middot; Esc to close</span>
          <a href="/platform/research" style={{ display: "flex", alignItems: "center", gap: 6, background: NAVY, color: "#fff", border: "none", borderRadius: 20, padding: "8px 18px", fontFamily: F, fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Open Research
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Quick Note Panel ─────────────────────────────────────────────────────
function QuickNotePanel({ projects, onClose }: {
  projects: ProjectData[];
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [projectList, setProjectList] = useState<{ id: string; name: string }[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => {
        const list = (d.projects || []).map((p: any) => ({ id: p.id || "", name: p.name }));
        setProjectList(list);
        if (list.length === 1) {
          setSelectedProject(list[0]);
        } else if (list.length === 0) {
          setSelectedProject(null);
        } else {
          setPicking(true);
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!note.trim() || !selectedProject || saving) return;
    setSaving(true);
    try {
      await fetch("/api/workspace/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: selectedProject.id, content: note.trim() }),
      });
    } catch {}
    setSaving(false);
    setToast(`Saved to ${selectedProject.name}`);
    setTimeout(() => { setToast(null); onClose(); }, 2000);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); }
  };

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

  if (toast) {
    return (
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: TEAL, color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 500,
        padding: "10px 16px", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,.12)",
      }}>
        {toast}
      </div>
    );
  }

  return (
    <div onKeyDown={handleKey} style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      width: 320, background: WHITE,
      border: `1px solid ${BLT}`, borderRadius: 4,
      boxShadow: "0 4px 12px rgba(0,0,0,.12)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 8px", gap: 8 }}>
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1 }}>Quick note</span>
        {selectedProject && (
          <span style={{ fontFamily: M, fontSize: 11, color: TEAL }}>{selectedProject.name}</span>
        )}
        <button onClick={onClose} style={{ marginLeft: "auto", fontFamily: F, fontSize: 14, color: "#80868B", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>{"\u2715"}</button>
      </div>

      {/* Project picker */}
      {picking && !selectedProject ? (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ fontFamily: F, fontSize: 12, color: "#80868B", marginBottom: 8 }}>Select a project:</div>
          {projectList.map(p => (
            <button key={p.id} onClick={() => { setSelectedProject(p); setPicking(false); }} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", fontFamily: F, fontSize: 13, color: T1,
              background: "none", border: `1px solid ${BLT}`, borderRadius: 4,
              cursor: "pointer", marginBottom: 4,
            }}>{p.name}</button>
          ))}
        </div>
      ) : (
        <>
          {/* Textarea */}
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note to your project..."
            rows={4}
            style={{
              width: "100%", border: "none", outline: "none", resize: "none",
              padding: 12, fontFamily: F, fontSize: 13, color: T1,
              lineHeight: 1.5, background: "transparent",
            }}
          />

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: `1px solid ${BLT}` }}>
            <span style={{ fontFamily: F, fontSize: 12, color: "#80868B" }}>
              {selectedProject ? `Saved to ${selectedProject.name}` : ""}
            </span>
            <button
              onClick={save}
              disabled={!note.trim() || saving}
              style={{
                height: 28, padding: "0 12px", borderRadius: 4,
                fontFamily: F, fontSize: 12, fontWeight: 500,
                color: note.trim() && !saving ? "#fff" : "#BDC1C6",
                background: note.trim() && !saving ? TEAL : "#F1F3F4",
                border: "none", cursor: note.trim() && !saving ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Saving..." : `Save (${isMac ? "\u2318" : "Ctrl"}\u23CE)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shortcuts Modal ──────────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
  const kbd = (label: string) => (
    <span style={{ fontFamily: M, fontSize: 12, color: T1, background: "#F1F3F4", border: `1px solid ${BLT}`, padding: "4px 8px", borderRadius: 4 }}>{label}</span>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: WHITE, maxWidth: 400, width: "100%", borderRadius: 4, padding: 28, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#80868B", padding: 0, lineHeight: 1 }}>{"\u2715"}</button>
        <div style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T1, marginBottom: 20 }}>Keyboard shortcuts</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F3F4" }}>
            <span style={{ fontFamily: F, fontSize: 13, color: T3 }}>Quick note to active project</span>
            <span style={{ display: "flex", gap: 4 }}>{kbd(isMac ? "Cmd" : "Ctrl")}{kbd("Shift")}{kbd("N")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F3F4" }}>
            <span style={{ fontFamily: F, fontSize: 13, color: T3 }}>Search</span>
            <span style={{ display: "flex", gap: 4 }}>{kbd(isMac ? "Cmd" : "Ctrl")}{kbd("K")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F3F4" }}>
            <span style={{ fontFamily: F, fontSize: 13, color: T3 }}>Close panel</span>
            <span style={{ display: "flex", gap: 4 }}>{kbd("Esc")}</span>
          </div>
        </div>
        <div style={{ fontFamily: F, fontSize: 12, color: "#80868B", marginTop: 16 }}>More shortcuts coming soon.</div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sbOpen, setSbOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const [trackerData, setTrackerData] = useState<TrackerData[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);

  useEffect(() => {
    fetch("/api/sidebar-data")
      .then(r => r.json())
      .then(d => {
        if (d.trackers) setTrackerData(d.trackers);
        if (d.projects) setProjectData(d.projects);
        if (typeof d.urgent_count === "number") setUrgentCount(d.urgent_count);
      })
      .catch(() => {});
    fetch("/api/stories?limit=3&source_types=gov,reg,ngo")
      .then(r => r.ok ? r.json() : { stories: [] })
      .then(d => setRecentStories((d.stories || []).filter((s: any) => s.topic !== "all")))
      .catch(() => {});
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "n" || e.key === "N")) { e.preventDefault(); setQuickNoteOpen(true); }
    if (e.key === "Escape") { setSearchOpen(false); setQuickNoteOpen(false); }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div style={{ fontFamily: F, color: T1, background: BG, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(.65)}}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        a{text-decoration:none;color:inherit}
        .rp-desktop{}
        @media(max-width:1279px){.rp-desktop{display:none!important}}
        @media(max-width:767px){.sb-desktop{display:none!important}.sb-toggle{display:flex!important}.main-ml{margin-left:0!important}}
      `}</style>

      {/* Top bar */}
      <div style={{ height: 64, background: WHITE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: 0, flexShrink: 0, zIndex: 100 }}>
        {/* Burger */}
        <button className="sb-toggle" onClick={() => setSbOpen(!sbOpen)} style={{ display: "none", width: 48, height: 64, alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "none", color: T3 }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 24px 0 16px", minWidth: 220 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10c0-4 3.5-7 7-7s7 3 7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="2.5" fill="white"/></svg>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.025em", color: T1, display: "block", lineHeight: 1.1 }}>Tideline</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: T4, letterSpacing: ".04em", textTransform: "uppercase" }}>Ocean Intelligence</span>
          </div>
        </a>
        {/* Search */}
        <div onClick={() => setSearchOpen(true)} style={{ flex: 1, maxWidth: 560, height: 42, background: BG, border: "1px solid transparent", borderRadius: 24, display: "flex", alignItems: "center", padding: "0 14px 0 16px", gap: 10, cursor: "text", transition: "all .2s" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke={T4} strokeWidth="1.5"/><path d="M11 11l3.5 3.5" stroke={T4} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span style={{ flex: 1, fontSize: 14, color: T4 }}>Search or ask Tideline anything</span>
          <span style={{ fontSize: 11, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1px 6px", color: T4, fontFamily: M }}>{"\u2318"}K</span>
        </div>
        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 16px 0 24px", marginLeft: "auto" }}>
          <span style={{ fontSize: 12, fontWeight: 500, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "4px 12px", color: T2, background: WHITE, marginRight: 4 }}>Individual</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${NAVY},${TEAL})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>LM</div>
        </div>
      </div>

      {/* Body: sidebar + main + right panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Mobile drawer */}
        {sbOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.4)" }} onClick={() => setSbOpen(false)}>
            <div style={{ width: 280, height: "100%", background: NAVY }} onClick={e => e.stopPropagation()}>
              <Sidebar onNav={() => setSbOpen(false)} urgentCount={urgentCount} trackerData={trackerData} projectData={projectData} recentStories={recentStories} onShortcuts={() => setShortcutsOpen(true)} />
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="sb-desktop" style={{ flexShrink: 0 }}>
          <Sidebar urgentCount={urgentCount} trackerData={trackerData} projectData={projectData} recentStories={recentStories} onShortcuts={() => setShortcutsOpen(true)} />
        </div>

        {/* Main */}
        <main className="main-ml" style={{ flex: 1, overflowY: "auto", background: BG }}>
          {children}
        </main>

        {/* Right panel */}
        <RightPanel />
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {quickNoteOpen && <QuickNotePanel projects={projectData} onClose={() => setQuickNoteOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
