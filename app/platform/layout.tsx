"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const NAVY    = "#0D1B2A";
const WHITE   = "#FFFFFF";
const TEAL    = "#1D9E75";
const AMBER   = "#D97706";
const RED     = "#C0392B";
const RULE    = "#E4E4E4";
const BLACK   = "#0D0D0D";
const SERIF   = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS    = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const MONO    = "var(--font-mono), 'DM Mono', monospace";

// ── SVG icons (inline, no libraries) ──────────────────────────────────────
const IconGrid = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="9" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="9" width="5" height="5" rx="0.5"/><rect x="9" y="9" width="5" height="5" rx="0.5"/></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1.5" x2="5" y2="4.5"/><line x1="11" y1="1.5" x2="11" y2="4.5"/></svg>;
const IconBookmark = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M4 2h8v12l-4-3-4 3V2z"/></svg>;
const IconColumns = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="2" width="4" height="12" rx="0.5"/><rect x="8" y="2" width="6" height="12" rx="0.5"/></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/></svg>;

// ── Tracker tooltip ───────────────────────────────────────────────────────
const TRACKER_TOOLTIPS: Record<string, { status: string; color: string; desc: string }> = {
  "BBNJ Treaty": { status: "Active \u2014 in force", color: TEAL, desc: "87 ratifications. Pacific bloc deposit confirmed 06:42. Implementation accelerating." },
  "ISA Mining": { status: "Developing \u2014 watch", color: AMBER, desc: "Council vote deferred to July. 3 sponsoring states signalled opposition to current text." },
  "IUU Enforcement": { status: "Breaking \u2014 enforcement", color: RED, desc: "Vessel detained under falsified flag documentation. Port state action 03:30." },
  "30x30 Protection": { status: "Active", color: TEAL, desc: "Chile MPA announced. Global ocean protection at 24.3% toward 30% target." },
  "Blue Finance": { status: "Developing", color: AMBER, desc: "IFC revised framework published. 7 new sovereign blue bonds in pipeline." },
};

// ── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname();
  const [hoveredTracker, setHoveredTracker] = useState<string | null>(null);

  const navItems = [
    { icon: <IconGrid />, label: "Feed", href: "/platform", badge: null },
    { icon: <IconCalendar />, label: "Calendar", href: "/platform/calendar", badge: null },
    { icon: <IconBookmark />, label: "Library", href: "/platform/library", badge: "3 saved" },
    { icon: <IconColumns />, label: "Workspace", href: "/platform/workspace", badge: "2 projects" },
    { icon: <IconSearch />, label: "Research", href: "/platform/research", badge: null },
  ];

  const trackers = [
    { name: "BBNJ Treaty", color: TEAL, badge: "3 today", pulse: false },
    { name: "ISA Mining", color: AMBER, badge: "1 today", pulse: false },
    { name: "IUU Enforcement", color: RED, badge: "2 today", pulse: true },
    { name: "30x30 Protection", color: TEAL, badge: null, pulse: false },
    { name: "Blue Finance", color: AMBER, badge: "1 today", pulse: false },
  ];

  const isActive = (href: string) => {
    if (href === "/platform") return pathname === "/platform" || pathname === "/platform/feed";
    return pathname?.startsWith(href);
  };

  return (
    <div style={{ width: 220, background: NAVY, height: "calc(100vh - 52px)", position: "fixed", top: 52, left: 0, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }} className="sidebar-desktop">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        .sidebar-nav-item:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.9) !important; }
      `}</style>

      {/* Nav */}
      <div style={{ padding: "12px 0 0" }}>
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <a key={item.label} href={item.href} className="sidebar-nav-item" style={{
              display: "flex", alignItems: "center", gap: 10, height: 38, padding: "0 16px",
              color: active ? WHITE : "rgba(255,255,255,0.55)",
              background: active ? "rgba(255,255,255,0.10)" : "transparent",
              borderLeft: active ? `2px solid ${TEAL}` : "2px solid transparent",
              fontFamily: SANS, fontSize: 13, textDecoration: "none",
              opacity: active ? 1 : 0.85,
            }}>
              <span style={{ opacity: active ? 0.9 : 0.4 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.10)", padding: "2px 6px", borderRadius: 2, color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)" }}>{item.badge}</span>
              )}
            </a>
          );
        })}
      </div>

      {/* Trackers section */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", padding: "10px 16px 4px" }}>TRACKERS</div>
        {trackers.map(t => (
          <div key={t.name} style={{ position: "relative" }}
            onMouseEnter={() => setHoveredTracker(t.name)}
            onMouseLeave={() => setHoveredTracker(null)}>
            <a href="/tracker/bbnj" className="sidebar-nav-item" style={{
              display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 16px",
              fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.55)", textDecoration: "none",
              borderRight: t.pulse ? `2px solid ${RED}` : "2px solid transparent",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, flexShrink: 0, animation: t.pulse ? "pulse 2.2s ease-in-out infinite" : "none" }} />
              <span>{t.name}</span>
              {t.badge && (
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, background: "rgba(255,255,255,0.10)", padding: "2px 6px", borderRadius: 2, color: "rgba(255,255,255,0.5)" }}>{t.badge}</span>
              )}
            </a>
            {/* Tooltip */}
            {hoveredTracker === t.name && TRACKER_TOOLTIPS[t.name] && (
              <div style={{
                position: "absolute", left: 218, top: 0, zIndex: 300,
                background: NAVY, border: "1px solid rgba(255,255,255,0.14)",
                padding: "10px 14px", width: 240, pointerEvents: "none",
              }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: TRACKER_TOOLTIPS[t.name].color, marginBottom: 6 }}>
                  {"\u25CF"} {TRACKER_TOOLTIPS[t.name].status}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                  {TRACKER_TOOLTIPS[t.name].desc}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workspace section */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", padding: "10px 16px 4px" }}>WORKSPACE</div>
        {[
          { name: "ISA Deep-Sea Watch", color: TEAL, badge: "4 new" },
          { name: "BBNJ Implementation", color: AMBER, badge: "7 items" },
        ].map(p => (
          <a key={p.name} href="/platform/workspace" className="sidebar-nav-item" style={{
            display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 16px",
            fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.55)", textDecoration: "none",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span>{p.name}</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, background: "rgba(255,255,255,0.10)", padding: "2px 6px", borderRadius: 2, color: "rgba(255,255,255,0.5)" }}>{p.badge}</span>
          </a>
        ))}
        <a href="/platform/workspace" style={{ display: "block", padding: "6px 16px", fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>+ New project</a>
      </div>

      {/* Bottom: streak + queries */}
      <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px" }}>
        {/* Streak */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: WHITE }}>12</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", lineHeight: 1.2 }}>day</span>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", lineHeight: 1.2 }}>streak</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
          {[...Array(7)].map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === 6 ? TEAL : i < 6 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
        {/* Query dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[...Array(10)].map((_, i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < 7 ? "rgba(255,255,255,0.45)" : i === 7 ? AMBER : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>8 queries today</span>
        </div>
      </div>
    </div>
  );
}

// ── Right panel ───────────────────────────────────────────────────────────
function RightPanel() {
  return (
    <div style={{ width: 256, borderLeft: `1px solid ${RULE}`, background: WHITE, height: "calc(100vh - 52px)", position: "fixed", top: 52, right: 0, overflowY: "auto" }} className="right-panel-desktop">
      {/* Connections */}
      <div style={{ padding: 16, borderBottom: `1px solid ${RULE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, animation: "pulse 2.2s ease-in-out infinite" }} />
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.35 }}>TIDELINE CONNECTIONS</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: BLACK, opacity: 0.4, marginBottom: 10 }}>Patterns identified across trackers today.</div>
        <div style={{ borderLeft: `2px solid ${TEAL}`, background: "#FAFAF9", padding: "12px 14px" }}>
          <p style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.7, color: BLACK, margin: 0 }}>
            The ISA deferral and accelerating BBNJ ratification are directly linked. Three sponsoring states are conditioning their ISA vote on BBNJ implementation terms.
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {["ISA Mining", "BBNJ Treaty"].map(t => (
              <span key={t} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${TEAL}`, color: TEAL, padding: "4px 9px" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ padding: 16, borderBottom: `1px solid ${RULE}` }}>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.35, marginBottom: 12 }}>REGULATORY CALENDAR</div>
        {[
          { date: "31 Mar", days: "5 days", title: "EU CSRD Ocean Reporting Deadline", color: TEAL },
          { date: "3 Apr", days: "8 days", title: "BBNJ Preparatory Committee", color: AMBER },
          { date: "14 Jul", days: "", title: "ISA Council Session 29", color: "rgba(13,13,13,0.4)" },
        ].map((e, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: e.color }}>{e.date} {e.days && `\u2014 ${e.days}`}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: BLACK }}>{e.title}</div>
          </div>
        ))}
        <a href="/tracker/governance" style={{ fontFamily: SANS, fontSize: 11, color: BLACK, opacity: 0.4, textDecoration: "none" }}>View full calendar &rarr;</a>
      </div>

      {/* Settings link */}
      <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: `1px solid ${RULE}` }}>
        <a href="/platform/settings" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 11, color: BLACK, opacity: 0.35, textDecoration: "none", cursor: "pointer" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.3 2.3l.7.7M9 9l.7.7M9.7 2.3l-.7.7M3 9l-.7.7"/></svg>
          Settings &amp; sources
        </a>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ fontFamily: SANS, color: BLACK, background: WHITE }}>
      <style>{`
        @media (max-width: 1279px) { .right-panel-desktop { display: none !important; } }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ height: 52, background: WHITE, borderBottom: `2px solid ${BLACK}`, position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-mobile-toggle" style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 0, alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={BLACK} strokeWidth="1.5"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>
          </button>
          <a href="/" style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}>
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: BLACK, lineHeight: 1 }}>TIDELINE</span>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em", color: BLACK, opacity: 0.4, marginTop: 1 }}>OCEAN INTELLIGENCE</span>
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, border: "1px solid #E4E4E4", padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.1em", color: BLACK, opacity: 0.5 }}>INDIVIDUAL</span>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E4E4E4" }} />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)" }} onClick={() => setSidebarOpen(false)}>
          <div style={{ width: 260, height: "100%", background: NAVY, paddingTop: 52 }} onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <Sidebar />
      <RightPanel />

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: 220, marginRight: 0, marginTop: 52, minHeight: "calc(100vh - 52px)", background: WHITE, overflowY: "auto" }}>
        <div style={{ marginRight: 256 }} className="main-inner">
          <style>{`@media (max-width: 1279px) { .main-inner { margin-right: 0 !important; } }`}</style>
          {children}
        </div>
      </main>
    </div>
  );
}
