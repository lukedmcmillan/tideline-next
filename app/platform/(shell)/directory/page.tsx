"use client";

import { useState } from "react";
import DesktopOnly from "@/components/DesktopOnly";

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

const ENTITIES = [
  { name: "International Seabed Authority", type: "Org", typeColor: TEAL, mentions: 47, last: "today", snippet: "Council vote on exploitation code deferred to July 2026 session..." },
  { name: "BBNJ Agreement", type: "Treaty", typeColor: T4, mentions: 38, last: "today", snippet: "87 ratifications confirmed, entry into force threshold crossed..." },
  { name: "IFC: Blue Finance Framework", type: "Org", typeColor: T4, mentions: 22, last: "today", snippet: "Revised certification framework triggers blue bond pipeline expansion..." },
  { name: "MV Poseidon Star", type: "Vessel", typeColor: RED, mentions: 8, last: "03:30", snippet: "Detained under falsified flag documentation, port state action confirmed..." },
  { name: "Michael Lodge", type: "Person", typeColor: T4, mentions: 19, last: "05:18", snippet: "ISA Secretary-General, presided over Council session deferral vote..." },
];

export default function DirectoryPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Organisations", "Vessels", "People"];

  return (
    <DesktopOnly featureName="Directory">
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Entity list */}
      <div style={{ width: 320, flexShrink: 0, background: WHITE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.02em", color: T1, marginBottom: 12 }}>Directory</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke={T4} strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke={T4} strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input placeholder="Search organisations, vessels, people..." style={{ border: "none", outline: "none", background: "transparent", fontFamily: F, fontSize: 13, color: T1, flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {filters.map(f => (
              <span key={f} onClick={() => setFilter(f)} style={{ fontSize: 11, fontWeight: filter === f ? 600 : 500, background: filter === f ? TEAL : WHITE, color: filter === f ? "#fff" : T3, borderRadius: 20, padding: "3px 10px", cursor: "pointer", border: filter === f ? "none" : `1px solid ${BORDER}` }}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {ENTITIES.map((e, i) => (
            <div key={i} onClick={() => setSelected(i)} style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}`, cursor: "pointer", background: selected === i ? "rgba(29,158,117,.07)" : "transparent", borderLeft: selected === i ? `3px solid ${TEAL}` : "3px solid transparent", transition: "background .12s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ fontSize: 14, fontWeight: selected === i ? 600 : 500, color: T1 }}>{e.name}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: e.typeColor, background: e.typeColor === RED ? "rgba(217,48,37,.07)" : e.typeColor === TEAL ? "rgba(29,158,117,.07)" : BG, border: `1px solid ${e.typeColor === RED ? "rgba(217,48,37,.2)" : e.typeColor === TEAL ? "rgba(29,158,117,.22)" : BORDER}`, borderRadius: 4, padding: "2px 7px" }}>{e.type}</div>
              </div>
              <div style={{ fontSize: 12, color: T3, marginBottom: 6 }}>{e.mentions} mentions &middot; Last seen {e.last}</div>
              <div style={{ fontSize: 12, color: T2, lineHeight: 1.4 }}>{e.snippet}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile */}
      {selected !== null ? (
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <div style={{ maxWidth: 760 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T4, marginBottom: 6 }}>{ENTITIES[selected].type} &middot; Intergovernmental</div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.03em", color: T1, marginBottom: 6 }}>{ENTITIES[selected].name}</div>
                <div style={{ fontSize: 13, color: T3 }}>{ENTITIES[selected].mentions} mentions in Tideline &middot; First seen 14 Jan 2025</div>
              </div>
              <a href="/platform/research" style={{ display: "flex", alignItems: "center", gap: 7, background: "#0A1628", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontFamily: F, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Ask about this entity
              </a>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
              <div style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, color: TEAL, borderBottom: `2px solid ${TEAL}`, cursor: "pointer" }}>Overview</div>
              <div style={{ padding: "10px 20px", fontSize: 13, color: T3, cursor: "pointer" }}>Timeline</div>
              <div style={{ padding: "10px 20px", fontSize: 13, color: T3, cursor: "pointer" }}>Related entities</div>
              <div style={{ padding: "10px 20px", fontSize: 13, color: T3, cursor: "pointer" }}>Stories</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>Mention frequency</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
                  {[100, 35, 55, 40, 65, 50, 80, 70, 60, 90, 85, 100].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? TEAL : "rgba(29,158,117,.07)", borderRadius: "3px 3px 0 0" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T4, fontFamily: M }}><span>Apr 25</span><span>Mar 26</span></div>
              </div>
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 14 }}>Context breakdown</div>
                {[
                  { label: "Regulatory", c: TEAL, n: 31 },
                  { label: "Developing", c: AMBER, n: 12 },
                  { label: "Enforcement", c: RED, n: 4 },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T2, flex: 1 }}>{r.label}</span>
                    <span style={{ fontFamily: M, fontSize: 12, color: T3 }}>{r.n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent mentions */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BLT}`, fontSize: 13, fontWeight: 600, color: T2 }}>Recent mentions</div>
              {[
                { date: "TODAY 05:18", tag: "Developing", tagC: AMBER, text: "ISA Council voted to defer the adoption of exploitation regulations to its July session following sustained pressure from a coalition of sponsoring states.", src: "ISA / Bloomberg Law" },
                { date: "14 MAR 06:15", tag: "Regulatory", tagC: T4, text: "ISA published revised draft environmental safeguard provisions for consultation, extending the review period by 90 days at the request of three Pacific delegations.", src: "ISA Official Publications" },
                { date: "28 FEB 07:02", tag: "Regulatory", tagC: T4, text: "ISA Council session concluded with agreement to establish a technical working group on benefit sharing mechanisms under the proposed exploitation code.", src: "IISD Reporting Services" },
              ].map((m, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${BLT}`, opacity: i === 0 ? 1 : i === 1 ? 0.75 : 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: M, fontSize: 10, color: T4 }}>{m.date}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: m.tagC, background: m.tagC === AMBER ? "rgba(249,171,0,.1)" : BG, border: `1px solid ${m.tagC === AMBER ? "rgba(249,171,0,.25)" : BORDER}`, borderRadius: 4, padding: "1px 7px" }}>{m.tag}</span>
                  </div>
                  <div style={{ fontSize: 13, color: T1, lineHeight: 1.55, marginBottom: 6 }}>{m.text}</div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: TEAL }}>{m.src} {"\u2197"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T4 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="1.5"/><circle cx="34" cy="34" r="10" stroke="currentColor" strokeWidth="1.5"/><circle cx="34" cy="18" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M25.5 26l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div style={{ fontSize: 15, fontWeight: 500, color: T3 }}>Select an entity to see its profile</div>
          <div style={{ fontSize: 13, color: T4, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>Organisations, vessels, and people tracked across all Tideline sources. Every mention, every connection, over time.</div>
        </div>
      )}
    </div>
    </DesktopOnly>
  );
}
