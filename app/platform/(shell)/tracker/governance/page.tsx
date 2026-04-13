"use client";

import { useState, useEffect } from "react";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const TEAL = "#1D9E75";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const AMBER = "#d97706";
const RED = "#dc2626";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const SIG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#fef2f2", text: RED, border: RED },
  important: { bg: "#fffbeb", text: AMBER, border: AMBER },
  routine: { bg: "#f8fafc", text: MUTED, border: "transparent" },
};

const BODY_COLORS: Record<string, string> = {
  IMO: "#1d4ed8", ISA: "#7c3aed", IWC: "#0891b2", CBD: "#059669",
  OSPAR: "#2563eb", CCAMLR: "#4f46e5", ICCAT: "#ca8a04",
  CITES: "#be185d", UNOC: "#0d9488", "WTO-Fish": "#ea580c",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: any }) {
  const sig = SIG_COLORS[event.significance] || SIG_COLORS.routine;
  const body = event.governance_bodies;
  const bodyColor = BODY_COLORS[body?.abbreviation] || MUTED;

  return (
    <a href={`/tracker/governance/${event.id}`} style={{
      display: "block", padding: "18px 20px", background: WHITE,
      border: `1px solid ${BORDER}`, borderLeft: `3px solid ${sig.border}`,
      marginBottom: 8, textDecoration: "none", cursor: "pointer",
      transition: "box-shadow 0.12s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: `${bodyColor}15`, color: bodyColor, fontFamily: SANS, letterSpacing: "0.04em" }}>
          {body?.abbreviation || "—"}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3, background: sig.bg, color: sig.text, fontFamily: SANS, textTransform: "capitalize" }}>
          {event.significance || "routine"}
        </span>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: SANS, marginLeft: "auto" }}>
          {daysUntil(event.starts_at)}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: NAVY, fontFamily: SERIF, lineHeight: 1.4, marginBottom: 6 }}>
        {event.title}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: MUTED, fontFamily: SANS, flexWrap: "wrap" }}>
        <span>{formatDate(event.starts_at)}{event.ends_at ? ` – ${formatDate(event.ends_at)}` : ""}</span>
        {event.location && <span>{event.is_virtual ? "Virtual" : event.location}</span>}
      </div>
      {event.significance_reason && (
        <div style={{ fontSize: 12, color: sig.text, fontFamily: SANS, marginTop: 8, lineHeight: 1.5 }}>
          {event.significance_reason}
        </div>
      )}
    </a>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: any }) {
  const cards = [
    { label: "Upcoming Events", value: stats.total_upcoming, color: BLUE },
    { label: "Critical", value: stats.critical_count, color: RED },
    { label: "Next Critical", value: stats.next_critical ? formatDate(stats.next_critical_date) : "—", color: AMBER },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }} className="stat-grid-3">
      {cards.map((c) => (
        <div key={c.label} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${c.color}`, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 6, fontFamily: SANS }}>{c.label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: c.color, fontFamily: "'IBM Plex Mono', monospace" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── iCal Subscribe Modal ─────────────────────────────────────────────────────

function ICalButton({ selectedBodies, selectedTopic }: { selectedBodies: string[]; selectedTopic: string }) {
  const [show, setShow] = useState(false);
  const [urls, setUrls] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodies: selectedBodies.length > 0 ? selectedBodies : undefined,
          topics: selectedTopic ? [selectedTopic] : undefined,
        }),
      });
      const data = await res.json();
      if (data.ical_url) setUrls(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => { setShow(true); if (!urls) subscribe(); }}
        style={{ padding: "10px 20px", background: TEAL, color: WHITE, border: "none", fontSize: 13, fontWeight: 700, borderRadius: 3, cursor: "pointer", fontFamily: SANS, display: "flex", alignItems: "center", gap: 8 }}>
        📅 Sync to Calendar
      </button>
      {show && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,22,40,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShow(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, width: "100%", background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid ${TEAL}`, padding: "32px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 8 }}>Add to your calendar</h3>
            <p style={{ fontSize: 13, color: MUTED, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6 }}>
              Ocean governance meetings will sync automatically. Add once, stay updated permanently.
            </p>
            {loading ? (
              <p style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>Generating your calendar...</p>
            ) : urls ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={urls.google_url} target="_blank" rel="noopener" style={{ display: "block", padding: "12px 16px", background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 3, textDecoration: "none", fontSize: 14, fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                  Add to Google Calendar →
                </a>
                <a href={urls.apple_url} style={{ display: "block", padding: "12px 16px", background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 3, textDecoration: "none", fontSize: 14, fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                  Add to Apple Calendar →
                </a>
                <a href={urls.outlook_url} style={{ display: "block", padding: "12px 16px", background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 3, textDecoration: "none", fontSize: 14, fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                  Add to Outlook →
                </a>
                <p style={{ fontSize: 11, color: MUTED, fontFamily: SANS, marginTop: 8, lineHeight: 1.6 }}>
                  Your personal calendar URL. Events update automatically as new meetings are announced.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: RED, fontFamily: SANS }}>Sign in to sync your calendar.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovernanceCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [bodies, setBodies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"timeline" | "body" | "topic">("timeline");
  const [filterBody, setFilterBody] = useState("");
  const [filterTopic, setFilterTopic] = useState("");

  useEffect(() => { document.title = "Ocean Governance | Tideline"; }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterBody) params.set("body", filterBody);
    if (filterTopic) params.set("topic", filterTopic);

    fetch(`/api/governance-events?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setBodies(data.bodies || []);
        setStats(data.stats || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterBody, filterTopic]);

  // Group events by body or topic
  const groupedByBody: Record<string, any[]> = {};
  const groupedByTopic: Record<string, any[]> = {};

  for (const event of events) {
    const abbr = event.governance_bodies?.abbreviation || "Other";
    if (!groupedByBody[abbr]) groupedByBody[abbr] = [];
    groupedByBody[abbr].push(event);

    for (const t of event.topics || []) {
      if (!groupedByTopic[t]) groupedByTopic[t] = [];
      groupedByTopic[t].push(event);
    }
  }

  const topicLabels: Record<string, string> = {
    deep_sea_mining: "Deep-Sea Mining", mining_code: "Mining Code",
    shipping: "Shipping", marine_pollution: "Marine Pollution",
    emissions: "Emissions", maritime_safety: "Maritime Safety",
    whaling: "Whaling", cetacean_conservation: "Cetacean Conservation",
    biodiversity: "Biodiversity", "30x30": "30x30 Target",
    mpa: "Marine Protected Areas", southern_ocean: "Southern Ocean",
    antarctic: "Antarctic", fisheries: "Fisheries", tuna: "Tuna",
    fisheries_subsidies: "Fisheries Subsidies", cites: "CITES",
    ocean_governance: "Ocean Governance", iuu_fishing: "IUU Fishing",
    bbnj: "BBNJ / High Seas", science: "Science",
    north_east_atlantic: "NE Atlantic", sdg14: "SDG 14",
  };

  return (
    <div style={{ fontFamily: SANS, color: NAVY, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) { .stat-grid-3 { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 18, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>Feed</a>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>High Seas Treaty</a>
            <a href="/tracker/governance" style={{ color: WHITE, fontSize: 13, fontFamily: SANS, fontWeight: 600, textDecoration: "none" }}>Ocean Governance</a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, fontFamily: SANS }}>Live Intelligence Tracker</div>
            <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
              Ocean Governance
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontFamily: SANS, maxWidth: 500, lineHeight: 1.7 }}>
              Intergovernmental decisions, treaty developments, and multilateral ocean policy.
            </p>
          </div>
          <ICalButton selectedBodies={filterBody ? [filterBody] : []} selectedTopic={filterTopic} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>Loading governance calendar...</div>
          </div>
        ) : (
          <>
            {stats && <StatCards stats={stats} />}

            {/* Significance legend */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>Meeting classifications</div>
              <div style={{ fontSize: 12, color: MUTED, fontFamily: SANS, lineHeight: 1.5, marginBottom: 14 }}>Based on the formal mandate of each session, not editorial judgement. A meeting is classified by what its rules of procedure empower it to do.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="stat-grid-3">
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ width: 3, background: RED, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: RED, fontFamily: SANS, marginBottom: 2 }}>Critical</div>
                    <div style={{ fontSize: 12, color: MUTED, fontFamily: SANS, lineHeight: 1.5 }}>Session has the mandate to adopt binding decisions: regulations, quotas, treaty amendments, or conservation measures. Commissions, Councils, COPs.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ width: 3, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: AMBER, fontFamily: SANS, marginBottom: 2 }}>Important</div>
                    <div style={{ fontSize: 12, color: MUTED, fontFamily: SANS, lineHeight: 1.5 }}>Session produces recommendations or assessments that inform binding decisions at a higher body. Scientific committees, subsidiary bodies, expert groups.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ width: 3, background: "#d1d5db", borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: MUTED, fontFamily: SANS, marginBottom: 2 }}>Routine</div>
                    <div style={{ fontSize: 12, color: MUTED, fontFamily: SANS, lineHeight: 1.5 }}>Administrative or procedural session with no decision-making mandate. Working group logistics, capacity-building, compliance monitoring.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              {/* View tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {(["timeline", "body", "topic"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    style={{ padding: "7px 16px", border: `1px solid ${view === v ? NAVY : BORDER}`, background: view === v ? NAVY : WHITE, color: view === v ? WHITE : NAVY, fontSize: 12, fontFamily: SANS, borderRadius: 3, cursor: "pointer", fontWeight: view === v ? 600 : 400, textTransform: "capitalize" }}>
                    {v === "body" ? "By Body" : v === "topic" ? "By Topic" : "Timeline"}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 8 }}>
                <select value={filterBody} onChange={(e) => setFilterBody(e.target.value)}
                  style={{ padding: "7px 12px", border: `1px solid ${BORDER}`, fontSize: 12, fontFamily: SANS, borderRadius: 3, background: WHITE, color: NAVY }}>
                  <option value="">All bodies</option>
                  {bodies.map((b: any) => (
                    <option key={b.abbreviation} value={b.abbreviation}>{b.abbreviation}</option>
                  ))}
                </select>
                <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}
                  style={{ padding: "7px 12px", border: `1px solid ${BORDER}`, fontSize: 12, fontFamily: SANS, borderRadius: 3, background: WHITE, color: NAVY }}>
                  <option value="">All topics</option>
                  {Object.entries(topicLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timeline view */}
            {view === "timeline" && (
              events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: MUTED, fontFamily: SANS }}>No upcoming events found. Run the governance scraper to populate data.</div>
              ) : (
                events.map((e: any) => <EventCard key={e.id} event={e} />)
              )
            )}

            {/* By Body view */}
            {view === "body" && (
              Object.entries(groupedByBody).map(([abbr, bodyEvents]) => (
                <div key={abbr} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 3, background: `${BODY_COLORS[abbr] || MUTED}15`, color: BODY_COLORS[abbr] || MUTED, fontFamily: SANS }}>{abbr}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                      {bodies.find((b: any) => b.abbreviation === abbr)?.name || abbr}
                    </span>
                    <span style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>({bodyEvents.length})</span>
                  </div>
                  {bodyEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
                </div>
              ))
            )}

            {/* By Topic view */}
            {view === "topic" && (
              Object.entries(groupedByTopic)
                .sort(([, a], [, b]) => b.length - a.length)
                .map(([topic, topicEvents]) => (
                  <div key={topic} style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: NAVY, fontFamily: SANS }}>
                        {topicLabels[topic] || topic.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>({topicEvents.length})</span>
                    </div>
                    {topicEvents.map((e: any) => <EventCard key={`${topic}-${e.id}`} event={e} />)}
                  </div>
                ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
