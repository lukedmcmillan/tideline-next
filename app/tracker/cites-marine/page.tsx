"use client";
import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";
import TrackerMethodology, { TrackerDisclosure } from "@/components/TrackerMethodology";

const F = "'DM Sans',system-ui,sans-serif";
const NAVY = "#1a2f4a";
const TEAL = "#1D9E75";
const WHITE = "#ffffff";
const BD = "#DADCE0";
const MU = "#9AA0A6";
const T1 = "#202124";
const T2 = "#5F6368";

interface TrackerEvent { id: string; event_date: string; title: string; summary: string | null; source_url: string | null; event_type: string }
interface FeedStory { id: string; title: string; source_name: string; published_at: string; short_summary: string | null }

function fdt(iso: string) { return new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }

const SLUG = "cites-marine";
const TITLE = "CITES Marine Species Trade";
const DESCRIPTION = "Tracks CITES listings, trade permit enforcement, and implementation of Appendix II protections for commercially traded marine species including sharks, rays, and guitarfish.";

const PLACEHOLDER_EVENTS: TrackerEvent[] = [
  { id:"e1", event_date:"2025-11-14", title:"CITES CoP20 — shark and ray listing proposals tabled", summary:"Requiem shark and hammerhead proposals tabled for plenary vote. Implementation begins 90 days after adoption.", source_url:null, event_type:"milestone" },
  { id:"e2", event_date:"2026-03-01", title:"Blue shark Appendix II listing — trade controls begin", summary:"Parties required to issue CITES permits for blue shark fin trade. Compliance audits scheduled.", source_url:null, event_type:"update" },
  { id:"e3", event_date:"2026-06-01", title:"CITES trade database annual review — marine species report", summary:"Secretariat assesses party compliance with trade reporting obligations for listed marine species.", source_url:null, event_type:"update" },
];

export default function CITESMarineTracker() {
  const [events, setEvents] = useState<TrackerEvent[]>(PLACEHOLDER_EVENTS);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    document.title = "CITES Marine Species | Tideline";
    fetch(`/api/tracker-events?slug=${SLUG}&limit=8`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.events?.length) setEvents(d.events); })
      .catch(() => {});
    fetch(`/api/stories?limit=5&tracker=${SLUG}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stories?.length) setStories(d.stories); })
      .catch(() => {});
  }, []);

  const sectionLabel = { fontFamily: F, fontSize: 9, fontWeight: 500 as const, letterSpacing: ".12em", textTransform: "uppercase" as const, color: MU, marginBottom: 10 };

  return (
    <div style={{ fontFamily: F, color: T1, background: "#f8f9fa", minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .metric-card:hover .mc-arrow { opacity: 1 !important; } .metric-card:hover { box-shadow: 0 1px 4px rgba(0,0,0,0.06); }`}</style>
      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>Live Intelligence Tracker</div>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>{TITLE}</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 640, lineHeight: 1.7 }}>{DESCRIPTION}</p>
        </div>
      </div>
      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="cites-marine" />
        <TrackerMethodology slug="cites-marine" />

        {/* Status Blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { label: "CITES CoP20 Outcomes", value: "Listings adopted \u2014 Nov 2025", detail: "Blue shark, shortfin mako, and additional ray species listed under Appendix II. Trade in these species now requires CITES permits. Implementation deadline varies by jurisdiction.", source: "CITES Secretariat", url: "https://cites.org/eng/cop" },
            { label: "Blue Shark Appendix II", value: "Controls active \u2014 Mar 2026", detail: "Estimated 20 million blue sharks traded annually before listing. Hong Kong, Japan, and Spain are primary trade hubs. Permit requirements now apply to all commercial trade.", source: "CITES trade database", url: "https://trade.cites.org" },
            { label: "Jurisdiction Compliance", value: "Variable \u2014 monitoring underway", detail: "CITES Secretariat monitoring implementation across key trade jurisdictions. TRAFFIC reporting early compliance gaps in Asian markets. Annual trade data review due June 2026.", source: "TRAFFIC", url: "https://www.traffic.org" },
          ].map((b) => (
            <div key={b.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", fontFamily: F, fontWeight: 500, letterSpacing: ".1em", color: MU, marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 6 }}>{b.value}</div>
              <div style={{ fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 8 }}>{b.detail}</div>
              <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: TEAL, textDecoration: "none" }}>{b.source}</a>
            </div>
          ))}
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { value: "~20M", unit: "individuals pre-listing", label: "Blue shark annual trade", note: "Blue shark listed Appendix II at CoP20 Nov 2025 \u2014 permits now required for all trade", url: "https://trade.cites.org" },
            { value: "14", unit: "marine species", label: "Species newly listed at CoP20", note: "Includes blue shark, shortfin mako, and 12 ray species \u2014 largest marine listing in CITES history", url: "https://cites.org/eng/cop" },
            { value: "183", unit: "member states", label: "CITES Appendix II parties", note: "All parties must implement permit requirements for newly listed species", url: "https://cites.org/eng/disc/parties" },
            { value: "2028", unit: "CoP21 date TBC", label: "Next CoP", note: "CoP21 \u2014 implementation compliance review for CoP20 listings expected on agenda", url: "https://cites.org/eng/cop" },
          ].map((c) => (
            <div key={c.label} className="metric-card" onClick={() => window.open(c.url, "_blank")} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderTop: `3px solid ${TEAL}`, borderRadius: 8, padding: "16px 20px", cursor: "pointer", position: "relative", transition: "box-shadow 0.15s" }}>
              <span className="mc-arrow" style={{ position: "absolute", top: 8, right: 8, fontSize: 9, color: MU, opacity: 0, transition: "opacity 0.15s", pointerEvents: "none" }}>{"\u2197"}</span>
              <div style={{ fontSize: 9, textTransform: "uppercase", fontFamily: F, fontWeight: 500, letterSpacing: ".1em", color: MU, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.03em" }}>{c.value}</div>
              <div style={{ fontSize: 10, color: MU, marginTop: 2 }}>{c.unit}</div>
              <div style={{ fontSize: 10, color: T2, marginTop: 4, lineHeight: 1.4 }}>{c.note}</div>
              <div style={{ fontSize: 9, color: TEAL, marginTop: 4 }}>Source {"\u2197"}</div>
            </div>
          ))}
        </div>

        {/* Key Actors */}
        <div style={{ marginBottom: 32 }}>
          <div style={sectionLabel}>Key Actors</div>
          {[
            { name: "CITES Secretariat", role: "Geneva, oversees implementation" },
            { name: "TRAFFIC", role: "Primary wildlife trade monitoring body" },
            { name: "Hong Kong authorities", role: "Largest shark fin trade hub" },
            { name: "Shark Trust", role: "Led blue shark listing campaign" },
            { name: "EU", role: "Submitted blue shark listing proposal at CoP20" },
          ].map((a) => (
            <div key={a.name} style={{ padding: "10px 0", borderBottom: `0.5px solid ${BD}`, display: "flex", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: T1 }}>{a.name}</span>
              <span style={{ fontSize: 12, color: T2 }}>{a.role}</span>
            </div>
          ))}
        </div>

        {/* What to Watch */}
        <div style={{ marginBottom: 32 }}>
          <div style={sectionLabel}>What to Watch</div>
          <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: T2, lineHeight: 1.7 }}>
              Blue shark implementation is the live compliance question. The listing is adopted but permit systems in key trade jurisdictions — particularly Hong Kong and mainland China — are not yet fully operational. TRAFFIC's monitoring will determine whether CoP20 listings produce real trade reduction or paper compliance. The June 2026 CITES trade database annual review is the first formal check on whether permits are being issued correctly. Watch also for shortfin mako — the Atlantic population is critically endangered and the Appendix II listing is the last regulatory tool available before a trade ban proposal becomes inevitable.
            </div>
          </div>
        </div>

        {/* Events */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Recent Events</div>
          {events.map((e) => (
            <div key={e.id} style={{ padding: "14px 0", borderBottom: `0.5px solid ${BD}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: F, fontSize: 11, color: MU }}>{fdt(e.event_date)}</span>
                <span style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em", padding: "1px 7px", borderRadius: 4, background: e.event_type==="milestone" ? "rgba(29,158,117,0.08)" : "rgba(156,163,175,0.1)", color: e.event_type==="milestone" ? TEAL : MU, border: e.event_type==="milestone" ? "0.5px solid rgba(29,158,117,0.2)" : "0.5px solid rgba(156,163,175,0.2)" }}>{e.event_type}</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 4 }}>{e.title}</div>
              {e.summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6 }}>{e.summary}</div>}
              {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, color: TEAL, textDecoration: "none", marginTop: 4, display: "inline-block" }}>Source ↗</a>}
            </div>
          ))}
        </div>
        {/* Stories */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Related Stories</div>
          {stories.length === 0 ? (
            <div style={{ fontFamily: F, fontSize: 12, color: MU, padding: "24px 0" }}>No stories matched to this tracker yet</div>
          ) : (
            <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
              {stories.map((s) => (
                <a key={s.id} href={`/platform/story/${s.id}`} style={{ textDecoration: "none", display: "block", padding: "14px 16px", borderBottom: `0.5px solid ${BD}` }}>
                  <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: F, fontSize: 10, color: MU }}>{s.source_name}</span>
                  </div>
                  {s.short_summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginTop: 4 }}>{s.short_summary}</div>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <TrackerDisclosure />
    </div>
  );
}
