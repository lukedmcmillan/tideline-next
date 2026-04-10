"use client";

import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";

const F = "'DM Sans',system-ui,sans-serif";
const NAVY = "#0a1628";
const TEAL = "#1D9E75";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const WHITE = "#ffffff";
const BD = "#DADCE0";
const MU = "#9AA0A6";
const T1 = "#202124";
const T2 = "#5F6368";

interface TrackerEvent { id: string; event_date: string; title: string; summary: string | null; source_url: string | null; event_type: string }
interface FeedStory { id: string; title: string; source_name: string; published_at: string; short_summary: string | null }

function fdt(iso: string) { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

// ─── Info Tooltip ────────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 4 }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontFamily: F, fontSize: 10, color: MU, cursor: "pointer" }}>{"\u24D8"}</span>
      {show && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: 200, fontFamily: F, fontSize: 11, fontWeight: 400, color: T2, lineHeight: 1.6, textTransform: "none", letterSpacing: "normal", background: WHITE, border: `0.5px solid ${BD}`, borderRadius: 6, padding: "8px 10px", zIndex: 50, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          {text}
        </div>
      )}
    </span>
  );
}

// ─── Metric Cards ────────────────────────────────────────────────────────────

const CARDS = [
  { label: "Ocean Designated", value: "9.9%", color: AMBER, src: "MPAtlas \u00B7 December 2025", tip: "Total ocean area within designated marine protected areas globally. Includes paper parks and multi-use areas where destructive activities like bottom trawling may still occur." },
  { label: "Effectively Protected", value: "3.2%", color: RED, src: "MPAtlas \u00B7 rigorous assessment", tip: "Ocean area in fully or highly protected MPAs with active management \u2014 the ecologically meaningful figure. Excludes paper parks. Source: Marine Conservation Institute MPAtlas assessment of over 90% of global MPA area." },
  { label: "Target", value: "30%", color: MU, src: "GBF Target 3 \u00B7 by 2030", tip: "Kunming-Montreal Global Biodiversity Framework Target 3, adopted at COP15 in 2022. Requires at least 30% of land and sea to be effectively conserved and managed by 2030. Four years remaining." },
  { label: "Years Remaining", value: "4", color: RED, src: "to 2030 deadline", tip: "The 30x30 target must be met by 2030. At the current rate of MPA designation, independent assessments suggest global ocean protection will reach approximately 12\u201314% by 2030 \u2014 less than half the target." },
];

function MetricCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }} className="mpa-metrics">
      {CARDS.map((c) => (
        <div key={c.label} style={{ background: WHITE, border: `0.5px solid ${BD}`, borderTop: `3px solid ${c.color}`, borderRadius: 8, padding: "16px 20px" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 6, display: "flex", alignItems: "center" }}>
            {c.label}<InfoTip text={c.tip} />
          </div>
          <div style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: c.color, letterSpacing: "-0.03em" }}>{c.value}</div>
          <div style={{ fontFamily: F, fontSize: 10, color: MU, marginTop: 4 }}>{c.src}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Paper Parks Callout ─────────────────────────────────────────────────────

function PaperParksCallout() {
  return (
    <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderLeft: `3px solid ${RED}`, borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 8 }}>The Numbers Gap</div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: AMBER }}>9.9%</div>
          <div style={{ fontFamily: F, fontSize: 11, color: MU }}>designated</div>
        </div>
        <div style={{ width: 0, height: 36, borderLeft: `0.5px solid ${BD}` }} />
        <div>
          <div style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: RED }}>3.2%</div>
          <div style={{ fontFamily: F, fontSize: 11, color: MU }}>effectively protected</div>
        </div>
      </div>
      <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 8 }}>
        The gap between these two numbers is the defining challenge of 30x30. Approximately one quarter of existing designated marine protection is not yet implemented, and an additional third allows destructive activities including bottom trawling {"\u2014"} meaning they count toward the target but deliver no conservation benefit. Source: Marine Conservation Institute MPAtlas, 2025.
      </div>
      <div style={{ fontFamily: F, fontSize: 11, color: MU, fontStyle: "italic", lineHeight: 1.6 }}>
        Note: Six nations {"\u2014"} the United Kingdom, United States, Australia, Argentina, France and New Zealand {"\u2014"} include MPAs in overseas territories rather than home waters in their 30x30 reporting. Source: npj Ocean Sustainability, Feb 2026.
      </div>
    </div>
  );
}

// ─── Recent Events ───────────────────────────────────────────────────────────

function RecentEvents({ events }: { events: TrackerEvent[] }) {
  const badge = (type: string) => type === "milestone"
    ? { bg: "rgba(29,158,117,0.08)", color: TEAL, border: "0.5px solid rgba(29,158,117,0.2)" }
    : { bg: "rgba(156,163,175,0.1)", color: MU, border: "0.5px solid rgba(156,163,175,0.2)" };
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".12em", textTransform: "uppercase", color: MU, marginBottom: 10 }}>Recent Events</div>
      {events.length === 0 ? (
        <div style={{ fontFamily: F, fontSize: 12, color: MU, padding: "24px 0" }}>No events recorded yet</div>
      ) : events.map((e) => {
        const b = badge(e.event_type);
        return (
          <div key={e.id} style={{ padding: "14px 0", borderBottom: `0.5px solid ${BD}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: F, fontSize: 11, color: MU }}>{fdt(e.event_date)}</span>
              <span style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em", padding: "1px 7px", borderRadius: 4, background: b.bg, color: b.color, border: b.border }}>{e.event_type}</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4, marginBottom: 4 }}>{e.title}</div>
            {e.summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6 }}>{e.summary}</div>}
            {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 11, color: TEAL, textDecoration: "none", marginTop: 4, display: "inline-block" }}>Source {"\u2197"}</a>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Related Stories ─────────────────────────────────────────────────────────

function RecentStories({ stories }: { stories: FeedStory[] }) {
  return (
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
                <span style={{ fontFamily: F, fontSize: 10, color: MU }}>{new Date(s.published_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
              </div>
              {s.short_summary && <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginTop: 4 }}>{s.short_summary}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ThirtyByThirtyTracker() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => { document.title = "Marine Protected Areas | Tideline"; }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/tracker-events?slug=30x30&limit=8").then(r => r.ok ? r.json() : { events: [] }),
      fetch("/api/stories?limit=5&tracker=30x30").then(r => r.ok ? r.json() : { stories: [] }),
    ]).then(([ev, st]) => {
      setEvents(ev.events || []);
      setStories(st.stories || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: F, color: T1, background: "#f8f9fa", minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .mpa-metrics { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>Live Intelligence Tracker</div>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>Marine Protected Areas</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 640, lineHeight: 1.7 }}>
            Tracking global progress toward protecting 30% of the ocean by 2030 {"\u2014"} the Kunming-Montreal Global Biodiversity Framework Target 3.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="30x30" />
        {loading ? (
          <div style={{ fontFamily: F, textAlign: "center", padding: "60px 20px", fontSize: 13, color: MU }}>Loading tracker data...</div>
        ) : (
          <>
            <MetricCards />
            <PaperParksCallout />
            <RecentEvents events={events} />
            <RecentStories stories={stories} />
          </>
        )}
      </div>
    </div>
  );
}
