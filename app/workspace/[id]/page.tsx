"use client";

import { useState, useRef } from "react";

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
function Sidebar() {
  const nav: { ic: React.ReactNode; label: string; href: string; active: boolean; badge?: string; badgeColor?: string }[] = [
    { ic: <IcFeed />, label: "Feed", href: "/platform/feed", active: false },
    { ic: <IcCal />, label: "Calendar", href: "/platform/calendar", active: false, badge: "2 due", badgeColor: AMBER },
    { ic: <IcWork />, label: "Workspace", href: "/workspace", active: true },
    { ic: <IcReport />, label: "Reports", href: "/reports", active: false },
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

// ── Sources panel ────────────────────────────────────────────────────────
function SourcesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stories = [
    { title: "OSPAR opens consultation on revised North-East Atlantic fisheries recovery zones", source: "OSPAR", date: "28 Mar", tier: "primary" },
    { title: "ISA Council defers exploitation code vote as sponsoring state pressure mounts", source: "ISA / Bloomberg Law", date: "27 Mar", tier: "primary" },
    { title: "BBNJ ratification: third deposit confirmed as Pacific bloc signals alignment", source: "IISD", date: "26 Mar", tier: "secondary" },
    { title: "Sovereign blue bond pipeline doubles as IFC publishes revised certification", source: "IFC", date: "26 Mar", tier: "primary" },
    { title: "Pacific coast guard intercepts vessel under falsified flag documentation", source: "Maritime Executive", date: "25 Mar", tier: "secondary" },
    { title: "Chile announces 740,000 km\u00B2 MPA ahead of CBD COP target review", source: "IUCN", date: "25 Mar", tier: "secondary" },
    { title: "IMO MEPC 83 adopts revised carbon intensity framework for bulk carriers", source: "IMO", date: "24 Mar", tier: "primary" },
    { title: "IPCC confirms accelerated Southern Ocean acidification exceeds projections", source: "IPCC", date: "24 Mar", tier: "primary" },
  ];

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, width: 340, height: "100vh",
      background: WHITE, boxShadow: open ? "-4px 0 16px rgba(0,0,0,.08)" : "none",
      transform: open ? "translateX(0)" : "translateX(340px)",
      transition: "transform 0.2s ease", zIndex: 200,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BLT}` }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Your sources</div>
          <div style={{ fontSize: 12, color: T4, marginTop: 2 }}>Click + Insert to add a reference to your document</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer", color: T3, fontSize: 14 }}>{"\u00D7"}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {stories.map((s, i) => (
          <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              {s.tier === "primary" && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: TEAL, background: "rgba(29,158,117,.1)", borderRadius: 3, padding: "2px 5px", flexShrink: 0, marginTop: 2 }}>Primary</span>}
              <span style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.35 }}>{s.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T4 }}>{s.source} {"\u00B7"} {s.date}</span>
              <button style={{ height: 28, fontSize: 12, fontWeight: 500, fontFamily: F, color: T2, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "0 10px", cursor: "pointer" }}>+ Insert</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ask panel ────────────────────────────────────────────────────────────
function AskPanel({ onSubmit, onClose }: { onSubmit: (q: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const chips = ["ISA liability 2026", "BBNJ Pacific conditions", "DSM moratorium", "Exploitation code timeline"];

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, boxShadow: "0 2px 6px rgba(60,64,67,.15)", margin: "12px 0 8px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, color: BLUE, background: "#E8F0FE", borderRadius: 2, padding: "1px 5px" }}>Ask</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: T1 }}>Query Tideline primary sources</span>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 2, color: T4, cursor: "pointer", fontSize: 14 }}>{"\u00D7"}</button>
      </div>
      {/* Input */}
      <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Enter" && query.trim()) onSubmit(query.trim()); if (e.key === "Escape") onClose(); }}
          placeholder="What does the ISA exploitation code say about liability?"
          autoFocus
          style={{ flex: 1, height: 36, fontSize: 13, fontFamily: F, border: `1px solid ${focused ? BLUE : BORDER}`, borderRadius: 2, padding: "0 12px", outline: "none", color: T1, boxShadow: focused ? `inset 0 0 0 1px ${BLUE}` : "none" }}
        />
        <button
          onClick={() => { if (query.trim()) onSubmit(query.trim()); }}
          style={{ height: 36, fontSize: 13, fontWeight: 500, fontFamily: F, color: WHITE, background: BLUE, border: "none", borderRadius: 2, padding: "0 16px", cursor: "pointer", opacity: query.trim() ? 1 : 0.5 }}
        >Search</button>
      </div>
      {/* Chips */}
      <div style={{ padding: "0 14px 10px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${ROW_BG}` }}>
        {chips.map(c => (
          <button key={c} onClick={() => { setQuery(c); inputRef.current?.focus(); }} style={{ fontSize: 11, fontFamily: F, color: BLUE, background: "#E8F0FE", border: "none", borderRadius: 2, padding: "3px 9px", cursor: "pointer" }}>{c}</button>
        ))}
      </div>
      {/* Footer */}
      <div style={{ padding: "7px 14px", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontFamily: M, fontSize: 10, color: T3, background: ROW_BG, borderRadius: 2, padding: "1px 5px" }}>/ask</span>
        <span style={{ fontFamily: M, fontSize: 10, color: T4 }}>anywhere in document {"\u00B7"} primary sources only {"\u00B7"} inserts as cited block</span>
      </div>
    </div>
  );
}

// ── /ask types ───────────────────────────────────────────────────────────
interface AskSource {
  issuing_body: string | null;
  document_type: string | null;
  date_issued: string | null;
  source_url: string | null;
}

type AskState = "idle" | "loading" | "result" | "insufficient";

// ── Page ─────────────────────────────────────────────────────────────────
export default function WorkspaceEditor() {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [askPanelOpen, setAskPanelOpen] = useState(false);
  const [askState, setAskState] = useState<AskState>("idle");
  const [askQuery, setAskQuery] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askSources, setAskSources] = useState<AskSource[]>([]);
  const [askMessage, setAskMessage] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const handleAskSubmit = async (query: string) => {
    setAskPanelOpen(false);
    setAskQuery(query);
    setAskState("loading");
    setAskAnswer("");
    setAskSources([]);
    setAskMessage("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.insufficientSources) {
        setAskState("insufficient");
        setAskMessage(data.message || "No primary source documents found.");
      } else if (data.answer) {
        setAskState("result");
        setAskAnswer(data.answer);
        setAskSources(data.sources || []);
      } else {
        setAskState("insufficient");
        setAskMessage(data.error || "Failed to process query.");
      }
    } catch {
      setAskState("insufficient");
      setAskMessage("Failed to reach Tideline. Try again.");
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    const sel = window.getSelection();
    if (!sel || !sel.focusNode) return;
    const node = sel.focusNode.nodeType === Node.TEXT_NODE ? sel.focusNode : sel.focusNode.childNodes[sel.focusOffset - 1];
    if (!node) return;
    const text = (node.textContent || "").trim();
    if (text.startsWith("/ask ") && text.length > 5) {
      e.preventDefault();
      const query = text.slice(5).trim();
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
      if (parent && editorRef.current?.contains(parent)) parent.remove();
      handleAskSubmit(query);
    }
  };

  return (
    <div style={{ display: "flex", fontFamily: F, color: T1, background: BG, height: "100vh", overflow: "hidden" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── TOP TOOLBAR ── */}
        <div style={{ height: 56, background: WHITE, boxShadow: "0 1px 3px rgba(0,0,0,.08)", display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <a href="/workspace" style={{ fontSize: 13, color: T3, textDecoration: "none", whiteSpace: "nowrap" }}>{"\u2190"} Workspace</a>
            <span style={{ color: BLT }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ISA Council July 2026 Response</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: T4, whiteSpace: "nowrap" }}>Saved {"\u2713"}</span>
            <button onClick={() => setSourcesOpen(!sourcesOpen)} style={{
              height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
              fontSize: 14, fontWeight: 500, fontFamily: F, color: T2, background: WHITE,
              border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2h8v11l-4-2.5L3 13V2z"/></svg>
              Sources (8)
            </button>
            <button style={{
              height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
              fontSize: 14, fontWeight: 500, fontFamily: F, color: WHITE, background: NAVY,
              border: "none", borderRadius: 4, cursor: "pointer",
            }}>
              Export to Word {"\u2193"}
            </button>
          </div>
        </div>

        {/* ── NEW STORIES BANNER ── */}
        {bannerVisible && (
          <div style={{ padding: "12px 24px", background: "rgba(29,158,117,.07)", borderBottom: "1px solid rgba(29,158,117,.15)", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: T1, marginBottom: 4 }}>3 new stories on ISA Mining since your last visit</div>
              <a href="#" style={{ display: "block", fontSize: 12, color: TEAL, lineHeight: 1.5, textDecoration: "none" }}>ISA Council defers exploitation code vote as sponsoring state...</a>
              <a href="#" style={{ display: "block", fontSize: 12, color: TEAL, lineHeight: 1.5, textDecoration: "none" }}>Norway opens second licensing round for seabed mineral extra...</a>
              <a href="#" style={{ display: "block", fontSize: 12, color: TEAL, lineHeight: 1.5, textDecoration: "none" }}>Three Pacific states condition ISA vote on BBNJ implementation...</a>
            </div>
            <button onClick={() => setBannerVisible(false)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer", color: T3, fontSize: 14, flexShrink: 0 }}>{"\u00D7"}</button>
          </div>
        )}

        {/* ── EDITOR BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", background: BG, position: "relative" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px", position: "relative" }}>

            {/* Consultation deadline card */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${RED}`, borderRadius: 8, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, color: RED, letterSpacing: "-.03em" }}>8</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>OSPAR Revised North-East Atlantic Fisheries Recovery Zones</div>
                <div style={{ fontSize: 11, color: T4 }}>Consultation closes 3 Apr 2026 {"\u00B7"} OSPAR</div>
              </div>
              <a href="/platform/calendar" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: TEAL, textDecoration: "none", whiteSpace: "nowrap" }}>View in Calendar {"\u2192"}</a>
            </div>

            {/* Document title */}
            <div style={{ fontSize: 32, fontWeight: 500, color: T1, fontFamily: F, marginBottom: 0, outline: "none" }} contentEditable suppressContentEditableWarning>ISA Council July 2026 Response</div>
            <div style={{ height: 1, background: BLT, margin: "16px 0 24px" }} />

            {/* Ask panel (inline) */}
            {askPanelOpen && <AskPanel onSubmit={handleAskSubmit} onClose={() => setAskPanelOpen(false)} />}

            {/* Editor body */}
            <div ref={editorRef} onKeyDown={handleEditorKeyDown} style={{ fontSize: 14, lineHeight: 1.75, color: T1, fontFamily: F, fontWeight: 300 }} contentEditable suppressContentEditableWarning>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: T1, margin: "0 0 12px", fontFamily: F }}>Situation overview</h2>
              <p style={{ margin: "0 0 12px" }}>
                The ISA Council has deferred its vote on the exploitation code following sustained pressure from three sponsoring states that are conditioning their position on the terms of BBNJ treaty implementation. The delay pushes the decision to the 29th Council session in July, with significant implications for the regulatory timeline governing deep-sea mineral extraction in the Area.
              </p>
              <p style={{ margin: "0 0 20px" }}>
                The deferral represents a substantive shift in negotiation dynamics. Previously, the exploitation code was expected to advance independently of the BBNJ process. The linkage between the two instruments now appears entrenched among a critical bloc of member states.
              </p>

              {/* Citation block — teal */}
              <div style={{ borderLeft: `2px solid ${TEAL}`, padding: "12px 16px", background: "rgba(29,158,117,.06)", borderRadius: 6, margin: "0 0 20px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: TEAL, marginBottom: 6 }}>Source</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T1, marginBottom: 4 }}>ISA Council defers exploitation code vote as sponsoring state pressure mounts</div>
                <div style={{ fontSize: 11, color: T4, marginBottom: 8 }}>ISA / Bloomberg Law {"\u00B7"} 27 Mar</div>
                <div style={{ fontSize: 13, fontWeight: 300, color: T2, lineHeight: 1.65 }}>
                  The International Seabed Authority's Council delayed the adoption of regulations for deep-sea mining following objections from three member states that have linked their approval to progress on the BBNJ Agreement.
                </div>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 600, color: T1, margin: "24px 0 12px", fontFamily: F }}>Key developments</h2>
              <ul style={{ paddingLeft: 20, margin: "0 0 20px" }}>
                <li style={{ margin: "0 0 6px" }}>Three sponsoring states formally linked their ISA exploitation code position to BBNJ implementation timelines at the March preparatory session.</li>
                <li style={{ margin: "0 0 6px" }}>Norway's second licensing round for seabed mineral extraction in the Norwegian Sea proceeds independently of ISA deliberations.</li>
                <li style={{ margin: "0 0 6px" }}>The BBNJ Agreement now has 87 ratifications. Pacific bloc coordination has accelerated the timeline by an estimated two quarters.</li>
              </ul>

              {/* Tideline Research — static example */}
              {askState === "idle" && (
                <div style={{ borderLeft: `3px solid ${BLUE}`, background: "#F8FBFF", padding: "10px 12px", margin: "10px 0" }} contentEditable={false}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: BLUE, marginBottom: 3 }}>Tideline Research</div>
                  <div style={{ fontSize: 11, fontStyle: "italic", color: T4, marginBottom: 6 }}>What is the current status of the ISA exploitation code and when is the next decision point?</div>
                  <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.7, color: T2, marginBottom: 6 }}>
                    The ISA exploitation code remains in draft form following the Council's deferral at its March 2026 session. The next decision point is the 29th Council session scheduled for 14 July 2026 in Kingston. Three member states have formally conditioned their vote on satisfactory progress in BBNJ implementation, making the July outcome contingent on the June BBNJ preparatory committee results.
                  </div>
                  <div style={{ fontSize: 10, color: T4, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T4} strokeWidth="1"><path d="M2 1h6v8l-3-2-3 2V1z"/></svg>
                    ISA {"\u00B7"} Council Records {"\u00B7"} March 2026
                  </div>
                </div>
              )}

              {/* Loading */}
              {askState === "loading" && (
                <div style={{ borderLeft: `3px solid ${BLUE}`, background: "#F8FBFF", padding: "10px 12px", margin: "10px 0", display: "flex", alignItems: "center", gap: 10 }} contentEditable={false}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="6" stroke={BLUE} strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: BLUE, marginBottom: 2 }}>Tideline Research</div>
                    <div style={{ fontSize: 12, color: T3 }}>Querying primary sources...</div>
                  </div>
                </div>
              )}

              {/* Insufficient */}
              {askState === "insufficient" && (
                <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${AMBER}`, borderRadius: 8, padding: "14px 18px", margin: "10px 0", display: "flex", alignItems: "center", gap: 12 }} contentEditable={false}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke={AMBER} strokeWidth="1.5"/><path d="M10 6v5M10 13.5v.5" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T1, marginBottom: 2 }}>{askMessage}</div>
                    {askQuery && <div style={{ fontSize: 12, fontStyle: "italic", color: T4 }}>Query: {askQuery}</div>}
                  </div>
                </div>
              )}

              {/* Result */}
              {askState === "result" && (
                <div style={{ borderLeft: `3px solid ${BLUE}`, background: "#F8FBFF", padding: "10px 12px", margin: "10px 0" }} contentEditable={false}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: BLUE, marginBottom: 3 }}>Tideline Research</div>
                  <div style={{ fontSize: 11, fontStyle: "italic", color: T4, marginBottom: 6 }}>{askQuery}</div>
                  <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.7, color: T2 }}>{askAnswer}</div>
                  {askSources.length > 0 && askSources.map((s, i) => (
                    <div key={i} style={{ fontSize: 10, color: T4, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T4} strokeWidth="1"><path d="M2 1h6v8l-3-2-3 2V1z"/></svg>
                      {s.issuing_body || "Unknown body"} {"\u00B7"} {s.document_type || "Document"}{s.date_issued ? ` \u00B7 ${s.date_issued}` : ""}
                    </div>
                  ))}
                </div>
              )}

              <h2 style={{ fontSize: 18, fontWeight: 600, color: T1, margin: "24px 0 12px", fontFamily: F }}>What to watch</h2>
              <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
                <li style={{ margin: "0 0 6px" }}>The BBNJ Preparatory Committee session in June will directly influence the ISA Council vote.</li>
                <li style={{ margin: "0 0 6px" }}>Norway's licensing round results may set a practical precedent regardless of ISA regulatory outcomes.</li>
                <li style={{ margin: "0 0 6px" }}>Monitor whether additional sponsoring states adopt the conditionality position before July.</li>
              </ul>
            </div>

            {/* Process Notes → Generate Report */}
            <div style={{ marginTop: 40 }}>
              <button style={{
                width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: 14, fontWeight: 500, fontFamily: F, color: WHITE, background: NAVY,
                border: "none", borderRadius: 6, cursor: "pointer",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M8 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Process Notes {"\u2192"} Generate Report
              </button>
            </div>
          </div>

          {/* Floating Ask pill */}
          <div style={{ position: "sticky", bottom: 16, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <button onClick={() => setAskPanelOpen(!askPanelOpen)} style={{
              pointerEvents: "auto",
              background: askPanelOpen ? BLUE : WHITE,
              border: `1px solid ${askPanelOpen ? BLUE : BORDER}`,
              borderRadius: 24, padding: "0 14px 0 10px", height: 36,
              boxShadow: "0 1px 4px rgba(60,64,67,.2)",
              display: "flex", alignItems: "center", gap: 6,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: askPanelOpen ? "rgba(255,255,255,.2)" : "#E8F0FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke={askPanelOpen ? "#fff" : BLUE} strokeWidth="1.1"/><path d="M6 3.5v3l1.5 1" stroke={askPanelOpen ? "#fff" : BLUE} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: askPanelOpen ? WHITE : BLUE }}>Ask Tideline</span>
            </button>
          </div>
        </div>
      </div>

      <SourcesPanel open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </div>
  );
}
