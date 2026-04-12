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

const TITLE = "WTO Fisheries Subsidies";
const SLUG = "wto-fisheries";
const DESCRIPTION = "Tracks implementation of the WTO Agreement on Fisheries Subsidies, Fish Two negotiations, compliance deadlines, and subsidy notification requirements.";

const PLACEHOLDER_EVENTS: TrackerEvent[] = [
  { id:"e1", event_date:"2026-09-15", title:"WTO Agreement on Fisheries Subsidies \u2014 compliance deadline", summary:"Members must notify subsidy programmes. Non-compliant states face dispute settlement proceedings.", source_url:null, event_type:"milestone" },
  { id:"e2", event_date:"2026-02-01", title:"Fish Two Geneva session \u2014 implementation review", summary:"Negotiators assess second pillar progress on overcapacity and overfishing subsidies.", source_url:null, event_type:"update" },
  { id:"e3", event_date:"2025-11-01", title:"Agreement enters into force \u2014 ratification threshold met", summary:"Two-thirds acceptance threshold reached. Prohibitions on IUU and overfished stock subsidies now binding.", source_url:null, event_type:"milestone" },
];

const STATUS_BLOCKS = [
  { label: "Agreement on Fisheries Subsidies", value: "In force \u2014 15 Sep 2025", detail: "Entered into force after two-thirds of WTO membership ratified. First multilateral agreement targeting a sector\u2019s environmental impact directly.", source: "WTO", url: "https://www.wto.org/english/tratop_e/fish_e" },
  { label: "Fish Two (Phase 2)", value: "Stalled \u2014 no chair", detail: "Phase 2 negotiations covering capacity-building subsidies and special and differential treatment have no chair and no agreed timeline. Four-year sunset clause on Phase 1 provisions is running.", source: "WTO Fisheries Committee", url: "https://www.wto.org" },
  { label: "Domestic Compliance", value: "15 Sep 2026 \u2014 156 days", detail: "Members must bring domestic subsidy regimes into compliance. No formal enforcement mechanism exists \u2014 compliance is self-reported.", source: "WTO Agreement text", url: "https://www.wto.org/english/tratop_e/fish_e" },
];

const METRIC_CARDS = [
  { big: "$35bn", sub: "annual (pre-agreement)", label: "Global fisheries subsidies" },
  { big: "91", sub: "of 166 members", label: "WTO members bound" },
  { big: "4 years", sub: "from entry into force", label: "Fish Two sunset clause" },
  { big: "156", sub: "days remaining", label: "Compliance deadline" },
];

const KEY_ACTORS = [
  { name: "WTO Fisheries Committee", role: "Oversees implementation" },
  { name: "EU", role: "Largest fishing subsidy reformer, compliance model" },
  { name: "China", role: "Largest distant water fishing fleet, compliance scrutiny" },
  { name: "Pacific Island Forum", role: "Small island developing states, special treatment provisions" },
  { name: "Pew Charitable Trusts", role: "Primary civil society monitor" },
];

export default function WTOFisheriesTracker() {
  const [events, setEvents] = useState<TrackerEvent[]>(PLACEHOLDER_EVENTS);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    document.title = "WTO Fisheries Subsidies | Tideline";
    fetch(`/api/tracker-events?slug=${SLUG}&limit=8`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.events?.length) setEvents(d.events); })
      .catch(() => {});
    fetch(`/api/stories?limit=5&tracker=${SLUG}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stories?.length) setStories(d.stories); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: F, color: T1, background: "#f8f9fa", minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
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
        <VelocityScore slug="wto-fisheries" />
        <TrackerMethodology slug="wto-fisheries" />

        {/* Status Blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {STATUS_BLOCKS.map((s) => (
            <div key={s.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 8 }}>{s.detail}</div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 10, color: TEAL, textDecoration: "none" }}>{s.source} {"\u2197"}</a>
            </div>
          ))}
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {METRIC_CARDS.map((c) => (
            <div key={c.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderTop: `3px solid ${TEAL}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: TEAL, letterSpacing: "-0.03em" }}>{c.big}</div>
              <div style={{ fontFamily: F, fontSize: 10, color: MU, marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Key Actors */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Key Actors</div>
          <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
            {KEY_ACTORS.map((a, i) => (
              <div key={a.name} style={{ padding: "12px 16px", borderBottom: i < KEY_ACTORS.length - 1 ? `0.5px solid ${BD}` : "none", display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1 }}>{a.name}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: T2 }}>{a.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What to Watch */}
        <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8, padding: "16px 20px", marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 8 }}>What to Watch</div>
          <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.7 }}>
            Fish Two negotiations have no chair and no timeline. The four-year sunset clause on Phase 1 provisions means that if Phase 2 fails, the entire agreement framework risks unravelling by 2029. The 15 September 2026 domestic compliance deadline has no enforcement mechanism {"\u2014"} watch for whether major fishing nations submit compliance notifications or quietly ignore the deadline. China{"\u2019"}s position is the critical variable. The EU{"\u2019"}s compliance approach will set the template other developed members follow.
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
              {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, color: TEAL, textDecoration: "none", marginTop: 4, display: "inline-block" }}>Source {"\u2197"}</a>}
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
