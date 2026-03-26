"use client";

import { useState, useEffect } from "react";

const BLACK   = "#0D0D0D";
const WHITE   = "#FFFFFF";
const TEAL    = "#1D9E75";
const AMBER   = "#D97706";
const RED     = "#C0392B";
const SLATE   = "#64748B";
const RULE    = "#E4E4E4";
const SERIF   = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS    = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const MONO    = "var(--font-mono), 'DM Mono', monospace";

function timeColor(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 6) return TEAL;
  if (h < 24) return `${BLACK}59`; // 0.35 opacity
  return `${BLACK}40`; // 0.25 opacity
}

function timeStr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function SourceLink({ name, tier }: { name: string; tier: 1 | 2 }) {
  if (tier === 1) {
    return (
      <a href="#" target="_blank" rel="noopener" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: BLACK, textDecoration: "underline", textDecorationColor: TEAL, textUnderlineOffset: "2px", cursor: "pointer" }} title="Tier 1 \u2014 primary regulatory source. Click to view original document.">
        {name} {"\u2197"}
      </a>
    );
  }
  return (
    <a href="#" target="_blank" rel="noopener" style={{ fontFamily: SANS, fontSize: 11, color: BLACK, opacity: 0.4, cursor: "pointer", textDecoration: "none" }}>
      {name} {"\u2197"}
    </a>
  );
}

// ── Sample data ───────────────────────────────────────────────────────────
const STORIES = [
  { id: "1", breaking: true, cat: "OCEAN GOVERNANCE", time: "2026-03-26T06:42:00Z", tier: 1 as const, source: "IISD Reporting Services", headline: "BBNJ ratification tracker: third instrument deposit confirmed as Pacific bloc signals alignment", summary: "The UN Treaty Collection confirmed a third instrument of ratification from a Pacific island state late yesterday, bringing the total to 87 \u2014 past the 60 required for entry into force. Legal analysts suggest coordinated timing with the July ISA session. The development accelerates the implementation timeline by an estimated two quarters." },
  { id: "2", breaking: false, cat: "DEEP-SEA MINING", time: "2026-03-26T05:18:00Z", tier: 1 as const, source: "ISA / Bloomberg Law", headline: "ISA Council defers exploitation code vote as sponsoring state pressure mounts ahead of July session", summary: null },
  { id: "3", breaking: false, cat: "BLUE FINANCE", time: "2026-03-26T04:55:00Z", tier: 1 as const, source: "IFC / Climate Bonds Initiative", headline: "Sovereign blue bond pipeline doubles in 12 months as IFC publishes revised certification framework", summary: null },
  { id: "4", breaking: false, cat: "IUU FISHING", time: "2026-03-26T03:30:00Z", tier: 2 as const, source: "Maritime Executive", headline: "Pacific coast guard intercepts vessel under falsified flag documentation", summary: "Port state authorities detained vessel pending investigation into flag registration and catch records." },
  { id: "5", breaking: false, cat: "CLIMATE", time: "2026-03-26T02:15:00Z", tier: 1 as const, source: "IPCC / Nature Climate Change", headline: "IPCC confirms accelerated Southern Ocean acidification exceeds 2019 projections", summary: "Argo float data shows pH declining 40% faster than the most pessimistic scenario published six years ago." },
  { id: "6", breaking: false, cat: "30X30", time: "2026-03-26T01:44:00Z", tier: 2 as const, source: "IUCN / El Mercurio", headline: "Chile announces 740,000km\u00B2 MPA ahead of CBD COP target review", summary: "Covers Nazca-Desventuradas seamount chain. Chile's protected EEZ now at 42%." },
];

const COMPACT = [
  { cat: "SHIPPING", headline: "IMO MEPC 83 adopts revised carbon intensity framework for bulk carriers over 25,000 DWT", source: "IMO", tier: 1 as const },
  { cat: "GOVERNANCE", headline: "OSPAR opens consultation on revised North-East Atlantic fisheries recovery zones", source: "OSPAR", tier: 2 as const },
  { cat: "BLUE FINANCE", headline: "Fiji prices $150m sovereign blue bond with TNFD-aligned reporting covenant", source: "Reuters", tier: 2 as const },
];

// ── Main page ─────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [filter, setFilter] = useState("All");
  const [signalRead, setSignalRead] = useState(false);
  const [chipsClicked, setChipsClicked] = useState(new Set<number>());

  const filters = ["All", "Governance", "Mining", "Finance", "Climate"];

  const handleChipClick = (idx: number) => {
    const next = new Set(chipsClicked);
    next.add(idx);
    setChipsClicked(next);
    if (next.size >= 2) setSignalRead(true);
  };

  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
      `}</style>

      {/* 1. SEARCH HERO */}
      <div style={{ padding: "24px 28px 18px", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ position: "relative" }}>
          <input type="text" placeholder="Ask Tideline anything." style={{ width: "100%", height: 48, border: `1.5px solid ${BLACK}`, borderRadius: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 15, padding: "0 54px 0 18px", background: WHITE, color: BLACK }} />
          <button style={{ position: "absolute", right: 0, top: 0, width: 48, height: 48, background: BLACK, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={WHITE} strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="5"/><line x1="11" y1="11" x2="16" y2="16"/></svg>
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {[
            "What changed in deep-sea mining regulation in the last 30 days? \u2192",
            "Summarise BBNJ ratification status and what it means for enforcement. \u2192",
            "What does the ISA deferral mean for my uploaded OSPAR report? \u2192",
          ].map((chip, i) => (
            <span key={i} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.05em", border: `1px solid ${RULE}`, padding: "6px 12px", color: BLACK, opacity: 0.5, cursor: "pointer" }}>{chip}</span>
          ))}
        </div>
      </div>

      {/* 2. SIGNIFICANCE BAROMETER */}
      <div style={{ background: "#FAFAF9", borderBottom: `1px solid ${RULE}`, padding: "9px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: BLACK, opacity: 0.35, flexShrink: 0 }}>THIS WEEK</span>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          {[8, 12, 16, 20, 10].map((h, i) => (
            <span key={i} style={{ width: 4, height: h, borderRadius: 1, background: i < 4 ? RED : RULE }} />
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: RED }}>CONSEQUENTIAL</span>
        <span style={{ fontFamily: SANS, fontSize: 11, color: BLACK, opacity: 0.55, marginLeft: 4 }}>Three consequential events across BBNJ, ISA and IUU trackers this week.</span>
      </div>

      {/* 3. MORNING SIGNAL */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${RULE}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: BLACK, opacity: 0.35, flexShrink: 0, paddingTop: 3 }}>YOUR SIGNAL</span>
        <div>
          {signalRead ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
              <span style={{ fontFamily: SANS, fontSize: 13, color: BLACK, opacity: 0.4, fontStyle: "italic" }}>You are up to date on your morning signal.</span>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: SERIF, fontSize: 14, lineHeight: 1.55, color: BLACK, margin: 0 }}>
                2 stories this morning directly relevant to your ESG and Blue Finance topics.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {["IFC Blue Finance Framework", "BBNJ Ratification"].map((c, i) => (
                  <span key={i} onClick={() => handleChipClick(i)} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${TEAL}`, color: TEAL, padding: "3px 9px", cursor: "pointer", opacity: chipsClicked.has(i) ? 0.4 : 1 }}>{c} {"\u2192"}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. FEED HEADER */}
      <div style={{ padding: "10px 28px", borderBottom: `1px solid ${RULE}`, display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, background: WHITE, zIndex: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, animation: "pulse 2.2s ease-in-out infinite", flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase" }}>What moved overnight</span>
        <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.35, marginLeft: 8 }}>06:42</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: MONO, fontSize: 9, padding: "4px 10px", border: `1px solid ${filter === f ? BLACK : RULE}`, background: filter === f ? BLACK : "transparent", color: filter === f ? WHITE : BLACK, opacity: filter === f ? 1 : 0.5, cursor: "pointer" }}>{f}</button>
          ))}
        </div>
      </div>

      {/* 5. NEWSPAPER GRID */}
      <div style={{ padding: "0 28px" }}>
        {/* Row 1: Lead + 2 secondary */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", borderBottom: `1px solid ${RULE}`, padding: "20px 0" }}>
          {/* Lead */}
          <div style={{ borderRight: `1px solid ${RULE}`, paddingRight: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {STORIES[0].breaking && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: RED, animation: "pulse 2.2s ease-in-out infinite" }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, color: RED }}>BREAKING</span>
                </span>
              )}
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4 }}>{STORIES[0].cat}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: timeColor(STORIES[0].time), fontWeight: 500 }}>{timeStr(STORIES[0].time)}</span>
            </div>
            <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, lineHeight: 1.22, margin: "0 0 8px" }}>{STORIES[0].headline}</h3>
            <p style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.65, opacity: 0.7, margin: "0 0 10px" }}>{STORIES[0].summary}</p>
            <SourceLink name={STORIES[0].source} tier={STORIES[0].tier} />
          </div>
          {/* Secondary */}
          <div style={{ paddingLeft: 24 }}>
            {STORIES.slice(1, 3).map((s, i) => (
              <div key={s.id} style={{ paddingBottom: i === 0 ? 14 : 0, marginBottom: i === 0 ? 14 : 0, borderBottom: i === 0 ? `1px solid ${RULE}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4 }}>{s.cat}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: timeColor(s.time), fontWeight: 500 }}>{timeStr(s.time)}</span>
                </div>
                <h4 style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, lineHeight: 1.35, margin: "0 0 6px" }}>{s.headline}</h4>
                <SourceLink name={s.source} tier={s.tier} />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Three columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${RULE}` }}>
          {STORIES.slice(3, 6).map((s, i) => (
            <div key={s.id} style={{ padding: "16px 0", paddingLeft: i > 0 ? 20 : 0, paddingRight: i < 2 ? 20 : 0, borderRight: i < 2 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4 }}>{s.cat}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: timeColor(s.time) }}>{timeStr(s.time)}</span>
              </div>
              <h4 style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, lineHeight: 1.35, margin: "0 0 6px" }}>{s.headline}</h4>
              {s.summary && <p style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.65, opacity: 0.6, margin: "0 0 8px" }}>{s.summary}</p>}
              <SourceLink name={s.source} tier={s.tier} />
            </div>
          ))}
        </div>

        {/* Row 3: Compact list */}
        <div style={{ paddingTop: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.35, marginBottom: 10 }}>More from Tideline</div>
          {COMPACT.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.4, minWidth: 88, flexShrink: 0 }}>{s.cat}</span>
              <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, lineHeight: 1.35, flex: 1 }}>{s.headline}</span>
              <SourceLink name={s.source} tier={s.tier} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
