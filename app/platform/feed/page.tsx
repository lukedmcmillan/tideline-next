"use client";

import { useState } from "react";

const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
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

const STORIES = [
  { id: "s1", cat: "OCEAN GOVERNANCE", time: "06:42", headline: "BBNJ ratification: third deposit confirmed as Pacific bloc signals alignment", summary: "The UN Treaty Collection confirmed a third instrument of ratification from a Pacific island state, bringing the total to 87. Analysts suggest coordinated timing with the July ISA session, accelerating implementation by an estimated two quarters.", src: "IISD Reporting Services", t1: true },
  { id: "s2", cat: "DEEP-SEA MINING", time: "05:18", headline: "ISA Council defers exploitation code vote as sponsoring state pressure mounts", summary: null, src: "ISA / Bloomberg Law", t1: true },
  { id: "s3", cat: "BLUE FINANCE", time: "04:55", headline: "Sovereign blue bond pipeline doubles as IFC publishes revised certification framework", summary: null, src: "IFC / Climate Bonds Initiative", t1: true },
  { id: "s4", cat: "IUU FISHING", time: "03:30", headline: "Pacific coast guard intercepts vessel under falsified flag documentation", summary: "Port state authorities detained vessel pending investigation into registration and catch records.", src: "Maritime Executive", t1: false },
  { id: "s5", cat: "CLIMATE", time: "02:15", headline: "IPCC confirms accelerated Southern Ocean acidification exceeds 2019 projections", summary: "Argo float data shows pH declining 40% faster than the most pessimistic scenario six years ago.", src: "IPCC / Nature Climate Change", t1: true },
  { id: "s6", cat: "30X30", time: "01:44", headline: "Chile announces 740,000km\u00B2 MPA ahead of CBD COP target review", summary: "Covers Nazca-Desventuradas seamount chain. Chile's protected EEZ now at 42%.", src: "IUCN / El Mercurio", t1: false },
];

const COMPACT = [
  { id: "s7", cat: "SHIPPING", hl: "IMO MEPC 83 adopts revised carbon intensity framework for bulk carriers over 25,000 DWT", src: "IMO", t1: true },
  { id: "s8", cat: "GOVERNANCE", hl: "OSPAR opens consultation on revised North-East Atlantic fisheries recovery zones", src: "OSPAR", t1: false },
  { id: "s9", cat: "BLUE FINANCE", hl: "Fiji prices $150m sovereign blue bond with TNFD-aligned reporting covenant", src: "Reuters", t1: true },
  { id: "s10", cat: "IUU FISHING", hl: "INTERPOL Operation Liberterra identifies 136 vessels under investigation across 40 flag states", src: "INTERPOL", t1: true },
  { id: "s11", cat: "DEEP-SEA MINING", hl: "Norway opens second licensing round for seabed mineral extraction in the Norwegian Sea", src: "Offshore Energy", t1: false },
];

function Src({ name, t1 }: { name: string; t1: boolean }) {
  return <span style={{ fontSize: 12, fontWeight: 500, color: t1 ? TEAL : T4, cursor: "pointer" }}>{name} {"\u2197"}</span>;
}

export default function FeedPage() {
  const [filter, setFilter] = useState("All");
  const [read, setRead] = useState(new Set<string>());
  const [unread, setUnread] = useState(9);

  const markRead = (id: string) => {
    if (read.has(id)) return;
    const next = new Set(read);
    next.add(id);
    setRead(next);
    setUnread(Math.max(0, unread - 1));
  };
  const markAll = () => {
    setRead(new Set([...STORIES, ...COMPACT].map(s => s.id)));
    setUnread(0);
  };

  const isRead = (id: string) => read.has(id);
  const filters = ["All", "Governance", "Mining", "Finance", "Climate"];

  return (
    <div style={{ padding: "16px 24px 40px" }}>
      {/* Feed header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: unread === 0 ? TEAL : TEAL, animation: unread > 0 ? "pulse 2.2s ease-in-out infinite" : "none" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T1, letterSpacing: "-.01em" }}>What you&apos;ve missed</span>
          <span style={{ color: BORDER }}>&middot;</span>
          {unread > 0 ? (
            <span style={{ fontSize: 13, color: T4 }}>{unread} unread</span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: TEAL }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
              All caught up
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
          <span onClick={markAll} style={{ fontSize: 12, fontWeight: 500, color: TEAL, cursor: "pointer", opacity: .65 }}>Mark all read</span>
          <div style={{ display: "flex", gap: 6 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, fontWeight: 500, border: `1px solid ${filter === f ? TEAL : BORDER}`, borderRadius: 20, padding: "5px 14px", color: filter === f ? "#fff" : T3, background: filter === f ? TEAL : WHITE, cursor: "pointer" }}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead story card */}
      <div onClick={() => markRead("s1")} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 12, display: "grid", gridTemplateColumns: "3fr 2fr", cursor: "pointer", opacity: isRead("s1") ? 0.55 : 1 }}>
        <div style={{ padding: "26px 30px", borderRight: `1px solid ${BLT}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {!isRead("s1") && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
            {isRead("s1") && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{STORIES[0].cat}</span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.28, letterSpacing: "-.025em", color: T1, marginBottom: 10 }}>{STORIES[0].headline}</div>
          <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 14 }}>{STORIES[0].summary}</div>
          <Src name={STORIES[0].src} t1={STORIES[0].t1} />
        </div>
        <div>
          {STORIES.slice(1, 3).map((s, i) => (
            <div key={s.id} onClick={(e) => { e.stopPropagation(); markRead(s.id); }} style={{ padding: "18px 22px", borderBottom: i === 0 ? `1px solid ${BLT}` : "none", opacity: isRead(s.id) ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
                {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{s.cat}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-.01em", color: T1, marginBottom: 6, marginTop: 3 }}>{s.headline}</div>
              <Src name={s.src} t1={s.t1} />
            </div>
          ))}
        </div>
      </div>

      {/* Three column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        {STORIES.slice(3, 6).map(s => (
          <div key={s.id} onClick={() => markRead(s.id)} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all .15s", opacity: isRead(s.id) ? 0.55 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
              {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{s.cat}</span>
              <span style={{ fontSize: 11, color: s.time < "04:00" ? T4 : TEAL, fontWeight: s.time < "04:00" ? 400 : 600 }}>{s.time}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-.01em", color: T1, marginBottom: 8, marginTop: 4 }}>{s.headline}</div>
            {s.summary && <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.65, color: T3, marginBottom: 9 }}>{s.summary}</div>}
            <Src name={s.src} t1={s.t1} />
          </div>
        ))}
      </div>

      {/* Compact list */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${BLT}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T2 }}>More from Tideline</span>
          <span style={{ fontSize: 12, color: T4 }}>38 stories today</span>
        </div>
        {COMPACT.map(s => (
          <div key={s.id} onClick={() => markRead(s.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 22px", borderBottom: `1px solid ${BLT}`, cursor: "pointer", transition: "background .1s", opacity: isRead(s.id) ? 0.45 : 1 }}>
            {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>New</span>}
            {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>Viewed</span>}
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T4, flexShrink: 0, minWidth: 84 }}>{s.cat}</span>
            <span style={{ fontSize: 13, color: T1, flex: 1, lineHeight: 1.35 }}>{s.hl}</span>
            <Src name={s.src} t1={s.t1} />
          </div>
        ))}
      </div>
    </div>
  );
}
