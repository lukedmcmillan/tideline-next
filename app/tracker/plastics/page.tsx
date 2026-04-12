"use client";

import { useState, useEffect } from "react";
import VelocityScore from "@/components/VelocityScore";
import TrackerMethodology, { TrackerDisclosure } from "@/components/TrackerMethodology";

const F = "'DM Sans',system-ui,sans-serif";
const HERO_BG = "#1a2f4a";
const TEAL = "#1D9E75";
const TEAL_LIGHT = "#5DCAA5";
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

// ─── Status Block ────────────────────────────────────────────────────────────

function StatusBlock() {
  const pips = [1, 2, 3, 4, 5];
  const done = 4;
  return (
    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "20px 24px", marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }} className="status-cols">
      {/* Negotiation Stage */}
      <div>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEAL_LIGHT, marginBottom: 10 }}>Negotiation Stage</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {pips.map(p => (
            <div key={p} style={{ width: 24, height: 4, borderRadius: 2, background: p <= done ? TEAL : p === done + 1 ? AMBER : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
        <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: WHITE, marginBottom: 6 }}>Post INC-5.3 {"\u2014"} awaiting INC-6</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 8 }}>New chair elected Feb 2026. No date set for next substantive session. Treaty text unresolved.</div>
        <a href="https://www.unep.org/inc-plastic-pollution" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 10, color: TEAL_LIGHT, textDecoration: "none" }}>UNEP {"\u00B7"} 7 Feb 2026 verified {"\u2197"}</a>
      </div>
      {/* Trajectory */}
      <div style={{ borderLeft: "0.5px solid rgba(255,255,255,0.1)", paddingLeft: 24 }}>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEAL_LIGHT, marginBottom: 10 }}>Trajectory</div>
        <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: RED, marginBottom: 6 }}>Stalled</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 8 }}>INC-5.2 collapsed Aug 2025. Chair resigned. New chair elected but no negotiating session scheduled. US opposes production caps.</div>
        <a href="https://www.unep.org/inc-plastic-pollution" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 10, color: TEAL_LIGHT, textDecoration: "none" }}>UNEP {"\u00B7"} Aug 2025 verified {"\u2197"}</a>
      </div>
      {/* Next Decision Point */}
      <div style={{ borderLeft: "0.5px solid rgba(255,255,255,0.1)", paddingLeft: 24 }}>
        <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: TEAL_LIGHT, marginBottom: 10 }}>Next Decision Point</div>
        <div style={{ fontFamily: F, fontSize: 30, fontWeight: 700, color: WHITE, marginBottom: 4 }}>TBD</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>No date set for INC-6</div>
        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>New chair must set roadmap and convene next session</div>
        <a href="https://www.unep.org/inc-plastic-pollution" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F, fontSize: 10, color: TEAL_LIGHT, textDecoration: "none", marginBottom: 10, display: "inline-block" }}>UNEP {"\u00B7"} Feb 2026 verified {"\u2197"}</a>
        <div><button style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL_LIGHT, background: "transparent", border: `1px solid ${TEAL_LIGHT}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>+ Alert me</button></div>
      </div>
    </div>
  );
}

// ─── Metric Cards ────────────────────────────────────────────────────────────

const CARDS = [
  { label: "INC Sessions Held", value: "5", color: TEAL, src: "INC-1 through INC-5.3 \u00B7 2022\u20132026", tip: "Five sessions of the Intergovernmental Negotiating Committee have been held since November 2022. None has produced a final treaty text. The original target was completion by end of 2024." },
  { label: "Countries Supporting", value: "145+", color: TEAL, src: "UNEP \u00B7 INC-1 Nov 2022", tip: "More than 145 countries publicly supported establishing strong global rules to stop plastic pollution at INC-1 in November 2022. Source: UNEP." },
  { label: "Treaty Status", value: "Stalled", color: RED, src: "INC-5.2 collapse \u00B7 Aug 2025", tip: "Treaty talks collapsed at INC-5.2 in Geneva in August 2025 after failing to agree on whether to cap virgin plastic production. The previous chair resigned. A new chair was elected at INC-5.3 on 7 February 2026 but no substantive negotiations were held." },
  { label: "Next Session", value: "TBD", color: AMBER, src: "No date announced \u00B7 Apr 2026", tip: "No date has been set for the next substantive negotiating session as of April 2026. The new chair must establish a roadmap. The original ambition was to complete the treaty by end of 2024." },
];

function MetricCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }} className="plastics-metrics">
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

// ─── Core Deadlock Callout ───────────────────────────────────────────────────

function CoreDeadlock() {
  return (
    <div style={{ background: WHITE, border: `0.5px solid ${BD}`, borderLeft: `3px solid ${AMBER}`, borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: MU, marginBottom: 8 }}>The Core Deadlock</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL, marginBottom: 2 }}>High Ambition Coalition</div>
          <div style={{ fontFamily: F, fontSize: 11, color: MU, marginBottom: 2 }}>130+ countries</div>
          <div style={{ fontFamily: F, fontSize: 11, color: T2 }}>Mandatory caps on virgin plastic production</div>
        </div>
        <div style={{ width: 0, minHeight: 40, borderLeft: `0.5px solid ${BD}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: RED, marginBottom: 2 }}>Blocking states</div>
          <div style={{ fontFamily: F, fontSize: 11, color: MU, marginBottom: 2 }}>Inc. US, oil-producing nations</div>
          <div style={{ fontFamily: F, fontSize: 11, color: T2 }}>Voluntary measures only, no production limits</div>
        </div>
      </div>
      <div style={{ fontFamily: F, fontSize: 12, color: T2, lineHeight: 1.6, marginBottom: 8 }}>
        The treaty{"\u2019"}s central unresolved question is whether it will cap the production of virgin plastics at source, or focus only on waste management. The High Ambition Coalition of 130+ countries supports binding production cuts. The United States under the Trump administration and several oil-producing nations oppose mandatory caps, preferring voluntary national measures. This divide caused the collapse of INC-5.1 in Busan and INC-5.2 in Geneva.
      </div>
      <div style={{ fontFamily: F, fontSize: 10, color: MU, fontStyle: "italic" }}>
        Sources: UNEP, Resource Recycling Feb 2026, Business Coalition for a Global Plastics Treaty
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

export default function PlasticsTreatyTracker() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [stories, setStories] = useState<FeedStory[]>([]);

  useEffect(() => { document.title = "Global Plastics Treaty | Tideline"; }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/tracker-events?slug=plastics&limit=8").then(r => r.ok ? r.json() : { events: [] }),
      fetch("/api/stories?limit=5&tracker=plastics").then(r => r.ok ? r.json() : { stories: [] }),
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
          .plastics-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .status-cols { grid-template-columns: 1fr !important; }
          .status-cols > div { border-left: none !important; padding-left: 0 !important; border-top: 0.5px solid rgba(255,255,255,0.1); padding-top: 16px; }
          .status-cols > div:first-child { border-top: none; padding-top: 0; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: HERO_BG, padding: "48px 20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: TEAL_LIGHT, marginBottom: 14 }}>Live Intelligence Tracker</div>
          <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 600, color: WHITE, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>Global Plastics Treaty</h1>
          <p style={{ fontFamily: F, fontSize: 13, color: "#a8bfd4", maxWidth: 640, lineHeight: 1.7 }}>
            Tracking negotiations toward an international legally binding instrument on plastic pollution, including in the marine environment {"\u2014"} the most active multilateral environmental process of 2026.
          </p>
          <StatusBlock />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        <VelocityScore slug="plastics" />
        <TrackerMethodology slug="plastics" />
        {loading ? (
          <div style={{ fontFamily: F, textAlign: "center", padding: "60px 20px", fontSize: 13, color: MU }}>Loading tracker data...</div>
        ) : (
          <>
            <MetricCards />
            <CoreDeadlock />
            <RecentEvents events={events} />
            <RecentStories stories={stories} />
          </>
        )}
      </div>
      <TrackerDisclosure />
    </div>
  );
}
