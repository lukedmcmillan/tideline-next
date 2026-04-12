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

const SLUG = "offshore-wind";
const TITLE = "Offshore Wind & Marine Spatial Planning";
const DESCRIPTION = "Tracks leasing rounds, planning consents, marine spatial plan adoptions, and regulatory decisions affecting offshore wind development globally.";

const PLACEHOLDER_EVENTS: TrackerEvent[] = [
  { id:"e1", event_date:"2026-01-01", title:"US appellate court ruling on offshore wind lease suspension", summary:"Federal court to decide whether BOEM lease suspensions are lawful. Outcome affects 5 Atlantic projects.", source_url:null, event_type:"milestone" },
  { id:"e2", event_date:"2025-11-01", title:"Crown Estate Round 5 \u2014 seabed lease awards confirmed", summary:"Celtic Sea leasing round completes. Six projects awarded totalling 4.5GW capacity.", source_url:null, event_type:"milestone" },
  { id:"e3", event_date:"2025-06-01", title:"EU MSP Directive \u2014 member state plan submission deadline", summary:"Coastal states required to submit maritime spatial plans. Commission to review compliance.", source_url:null, event_type:"update" },
];

export default function OffshoreWindTracker() {
  const [events, setEvents] = useState<TrackerEvent[]>(PLACEHOLDER_EVENTS);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => {
    document.title = "Offshore Wind | Tideline";
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
        <VelocityScore slug="offshore-wind" />
        <TrackerMethodology slug="offshore-wind" />

        {/* Status Blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { label: "US Offshore Wind Leasing", value: "Suspended \u2014 appellate review", detail: "Federal leasing suspended pending appellate court ruling on executive order challenged by developers. Outcome determines Atlantic wind buildout timeline.", source: "BOEM", url: "https://www.boem.gov/renewable-energy" },
            { label: "Crown Estate Round 5", value: "Awards confirmed \u2014 Nov 2025", detail: "Largest UK leasing round confirmed. Projects now in planning and consenting phase. First power expected 2031-2033.", source: "The Crown Estate", url: "https://www.thecrownestate.co.uk" },
            { label: "EU Maritime Spatial Plans", value: "Submission deadline passed", detail: "Member state maritime spatial plans submitted June 2025. Commission reviewing compliance. Cross-border coherence is primary concern.", source: "European Commission", url: "https://maritime-spatial-planning.ec.europa.eu" },
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
            { value: "280GW", unit: "installed by 2030 target", label: "Global offshore wind capacity" },
            { value: "\u00A31bn+", unit: "annual seabed rent", label: "Crown Estate Round 5" },
            { value: "12+", unit: "projects affected", label: "US projects stalled" },
            { value: "21", unit: "of 23 member states", label: "EU MSP plans submitted" },
          ].map((c) => (
            <div key={c.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderTop: `3px solid ${TEAL}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", fontFamily: F, fontWeight: 500, letterSpacing: ".1em", color: MU, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.03em" }}>{c.value}</div>
              <div style={{ fontSize: 10, color: MU, marginTop: 2 }}>{c.unit}</div>
            </div>
          ))}
        </div>

        {/* Key Actors */}
        <div style={{ marginBottom: 32 }}>
          <div style={sectionLabel}>Key Actors</div>
          {[
            { name: "BOEM", role: "US federal leasing authority" },
            { name: "The Crown Estate", role: "UK seabed leasing" },
            { name: "\u00D8rsted / Vattenfall / RWE", role: "Major European developers" },
            { name: "US appellate courts", role: "Ruling on lease suspension" },
            { name: "EU Commission DG MARE", role: "MSP directive compliance" },
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
              The US appellate court ruling is the single most consequential near-term event. A ruling upholding the lease suspension effectively ends the current Atlantic wind development pipeline. Developers with billions committed are watching this case daily. In the UK, Round 5 projects are now in the planning phase {"\u2014"} grid connection and consenting timelines are the bottleneck, not leasing. The EU MSP compliance review will determine whether cross-border offshore wind projects in the North Sea can proceed without bilateral negotiation for each installation.
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
