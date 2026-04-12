"use client";
import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";

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

const TITLE = "IMO Shipping Emissions";
const SLUG = "imo-shipping";
const DESCRIPTION = "Tracks regulatory momentum across IMO MEPC sessions, CII rating enforcement, EU ETS shipping compliance, FuelEU Maritime implementation, and the net-zero shipping transition.";

const PLACEHOLDER_EVENTS: TrackerEvent[] = [
  { id:"e1", event_date:"2026-04-27", title:"MEPC 84 convenes in London \u2014 net-zero framework vote", summary:"Committee to decide on binding 2030 GHG intensity checkpoints. Fleet-wide CII enforcement on the agenda.", source_url:null, event_type:"milestone" },
  { id:"e2", event_date:"2026-01-01", title:"FuelEU Maritime regulation enters into force", summary:"Mandatory greenhouse gas intensity limits for energy used on board ships in EU waters.", source_url:null, event_type:"milestone" },
  { id:"e3", event_date:"2025-03-01", title:"EU ETS shipping compliance \u2014 first reporting period closes", summary:"Shipping companies must surrender allowances for 2024 emissions. Non-compliance penalties apply.", source_url:null, event_type:"update" },
];

export default function IMOShippingTracker() {
  const [events, setEvents] = useState<TrackerEvent[]>(PLACEHOLDER_EVENTS);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    document.title = "IMO Shipping Emissions | Tideline";
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
        <VelocityScore slug="imo-shipping" />
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
    </div>
  );
}
