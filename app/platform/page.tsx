"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "./dashboard.css";

// Helpers
function relTime(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function decodeHtml(html: string): string {
  return html.replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDate(): string {
  const d = new Date();
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${hh}:${mm}`;
}

interface Story { id: string; title: string; source_name: string; topic: string; source_type?: string; published_at: string; short_summary: string | null; is_pro?: boolean; }
interface TrackerData { name: string; slug?: string; score?: number; trend?: string; color?: string; }
interface Project { name: string; count: number; project_type?: string; }

const TRACKER_COLORS: Record<string, string> = {
  bbnj: "#1D9E75", iuu: "#1D9E75", isa: "#EF9F27", dsm: "#EF9F27",
  "deep-sea-mining": "#EF9F27", plastics: "#5F6368", "30x30": "#E24B4A",
  "blue-finance": "#1D9E75",
};

function trackerColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(TRACKER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#1D9E75";
}

function scoreColor(score: number): string {
  if (score >= 7) return "#1D9E75";
  if (score >= 4) return "#EF9F27";
  return "#E24B4A";
}

function trendArrow(trend?: string): { char: string; color: string } {
  if (trend === "accelerating" || trend === "up") return { char: "\u2191", color: "#1D9E75" };
  if (trend === "decelerating" || trend === "down") return { char: "\u2193", color: "#E24B4A" };
  return { char: "\u2192", color: "#9AA0A6" };
}

const NAME_TO_SLUG: Record<string, string> = {
  "high seas treaty": "bbnj",
  "deep-sea mining": "isa",
  "illegal fishing": "iuu",
  "marine protected areas": "30x30",
  "ocean finance": "blue-finance",
};

function trackerSlug(name: string): string {
  return NAME_TO_SLUG[name.toLowerCase()] || name.toLowerCase().replace(/\s+/g, "-");
}

function topicTagClass(topic: string): string {
  const t = topic?.toLowerCase() || "";
  if (t.includes("iuu") || t.includes("fishing")) return "amber";
  if (t.includes("breaking")) return "breaking";
  return "teal";
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [streakDays, setStreakDays] = useState(1);
  const [stories, setStories] = useState<Story[]>([]);
  const [trackers, setTrackers] = useState<TrackerData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [sinceVisible, setSinceVisible] = useState(true);
  const [signal, setSignal] = useState<{ signal_text: string; meaning_text: string; meeting_note?: string | null; authored_by: string; signal_date: string } | null>(null);
  const [velocityScores, setVelocityScores] = useState<{ tracker_slug: string; score: number; momentum_direction: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [liveSecs, setLiveSecs] = useState(0);
  const liveRef = useRef(0);

  // Live counter
  useEffect(() => {
    const id = setInterval(() => {
      liveRef.current += 1;
      setLiveSecs(liveRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch("/api/subscription-status").then(r => r.ok ? r.json() : {}),
      fetch("/api/stories?limit=8").then(r => r.ok ? r.json() : { stories: [] }),
      fetch("/api/sidebar-data").then(r => r.ok ? r.json() : {}),
      fetch("/api/projects").then(r => r.ok ? r.json() : { projects: [] }),
      fetch("/api/dashboard").then(r => r.ok ? r.json() : {}),
    ]).then(([status, storiesData, sidebar, projData, dashData]: [any, any, any, any, any]) => {
      const em = status.email || "";
      setEmail(em);
      const derived = em.split("@")[0]?.split(".")[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) || "";
      setFirstName(derived || "Luke");
      setStreakDays(status.streak_days || 1);
      setStories(storiesData.stories || []);
      if (sidebar.trackers) setTrackers(sidebar.trackers);
      if (typeof sidebar.urgent_count === "number") setFeedCount(sidebar.urgent_count);
      setProjects(projData.projects || []);
      if (dashData.signal) setSignal(dashData.signal);
      if (dashData.velocityScores) setVelocityScores(dashData.velocityScores);
      setLoaded(true);
    }).catch(() => setLoaded(true));

    // Update last seen
    fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
  }, []);

  const tickerStories = stories.slice(0, 8);
  const sinceStories = stories.slice(0, 3);
  const latestStories = stories.slice(0, 3);

  const liveText = liveSecs < 60
    ? `Updated ${liveSecs}s ago`
    : `Updated ${Math.floor(liveSecs / 60)}m ${liveSecs % 60}s ago`;

  return (
    <div className="dash-shell">
      {/* ── SIDEBAR ── */}
      <nav className="dash-sb">
        {/* Logo */}
        <div className="dash-sb-logo">
          <div className="dash-sb-mark">
            <svg viewBox="0 0 18 18" width="18" height="18"><path d="M2 9c0-3.5 3-6.5 7-6.5s7 3 7 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="9" cy="13" r="2.5" fill="white"/></svg>
          </div>
          <div>
            <div className="dash-sb-name">Tideline</div>
            <div className="dash-sb-tag">Ocean Intelligence</div>
          </div>
        </div>

        {/* Streak */}
        <div className="dash-streak">
          <div className="dash-streak-label">You{"\u2019"}ve been here</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="dash-streak-num">{streakDays}</span>
            <span className="dash-streak-unit">consecutive days</span>
          </div>
          <div className="dash-streak-dots">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`dash-streak-dot ${i === 6 ? "today" : i >= 7 - streakDays ? "active" : ""}`} />
            ))}
          </div>
        </div>

        {/* Nav */}
        <div className="dash-nav">
          <a className="dash-nav-item active" href="/platform">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
            Overview
          </a>
          <a className="dash-nav-item" href="/tracker/bbnj">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>
            Trackers
            {trackers.length > 0 && <span className="dash-nav-badge teal">{trackers.length}</span>}
          </a>
          <a className="dash-nav-item" href="/platform/feed">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M2 3h12v10H2z" strokeLinejoin="round"/><path d="M2 6h12"/></svg>
            Feed
            {feedCount > 0 && <span className="dash-nav-badge red">{feedCount}</span>}
          </a>
          <a className="dash-nav-item" href="/platform/workspace">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2h10v13H3z" strokeLinejoin="round"/><path d="M6 5h4M6 8h4M6 11h2"/></svg>
            Workspace
          </a>
          <a className="dash-nav-item" href="/platform/library">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M2 2h4l2 2h6v10H2z" strokeLinejoin="round"/></svg>
            Library
            {docCount > 0 && <span className="dash-nav-badge teal">{docCount}</span>}
          </a>
        </div>

        {/* Trackers */}
        <div className="dash-trackers">
          <div className="dash-trackers-label">Trackers</div>
          {trackers.map(t => {
            const c = trackerColor(t.name);
            const slug = trackerSlug(t.name);
            const vs = velocityScores.find(v => v.tracker_slug === slug);
            const score = vs?.score ?? 0;
            const arrow = trendArrow(vs?.momentum_direction);
            return (
              <a key={t.name} className="dash-tracker-row" href={`/tracker/${slug}`}>
                <span className="dash-tracker-dot" style={{ background: c }} />
                <span className="dash-tracker-name">{t.name}</span>
                <span className="dash-tracker-score">{score.toFixed(1)} {arrow.char}</span>
              </a>
            );
          })}
        </div>

        {/* User */}
        <div className="dash-user">
          <div className="dash-user-avatar">{(firstName || "T")[0]}</div>
          <div className="dash-user-email">{email}</div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="dash-main">
        {/* Topbar */}
        <div className="dash-topbar">
          <span className="dash-topbar-title">{greeting()}, {firstName || "there"}.</span>
          <span className="dash-topbar-date">{fmtDate()}</span>
          <div className="dash-topbar-live">
            <span className="dash-topbar-pulse" />
            <span className="dash-topbar-live-text">{liveText}</span>
          </div>
          <button className="dash-topbar-btn" onClick={() => router.push("/platform/workspace")}>+ New workspace</button>
        </div>

        {/* Ticker */}
        <div className="dash-ticker">
          <div className="dash-ticker-label">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D9E75", animation: "pulse 2s ease infinite" }} />
            LIVE
          </div>
          <div className="dash-ticker-track">
            <div className="dash-ticker-inner">
              {tickerStories.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && <span className="dash-ticker-sep"> · </span>}
                  <span className="dash-ticker-item">{decodeHtml(s.title)} · {relTime(s.published_at)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dash-content">
          {!loaded ? (
            <>
              <div className="dash-skel animate-1" style={{ height: 100 }} />
              <div className="dash-skel animate-2" style={{ height: 80 }} />
              <div className="dash-grid-3 animate-3">
                <div className="dash-skel" style={{ height: 280 }} />
                <div className="dash-skel" style={{ height: 280 }} />
                <div className="dash-skel" style={{ height: 280 }} />
              </div>
            </>
          ) : (
            <>
              {/* Top row: Since Last Visit + Signal of the Day */}
              <div className="dash-top-row animate-1">
                {sinceVisible && sinceStories.length > 0 && (
                  <div className="dash-since">
                    <div className="dash-since-label">Since your last visit · {sinceStories[0] ? relTime(sinceStories[0].published_at) : ""}</div>
                    <button className="dash-since-dismiss" onClick={() => { setSinceVisible(false); fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {}); }}>Mark read ×</button>
                    <div className="dash-since-items">
                      {sinceStories.map(s => (
                        <div key={s.id} className="dash-since-item">
                          <span className="dash-since-bullet" />
                          <div>
                            <div className="dash-since-text">{decodeHtml(s.title)}</div>
                            <div className="dash-since-time">{relTime(s.published_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {signal && (
                  <div className="dash-signal">
                    <div className="dash-signal-header">
                      <span className="dash-signal-badge">Signal of the day</span>
                      <span className="dash-signal-meta">{signal.authored_by} {"\u00B7"} {signal.signal_date}</span>
                    </div>
                    <div className="dash-signal-text">{signal.signal_text}</div>
                    <div className="dash-signal-meaning"><strong style={{ fontWeight: 500, color: "#3C4043" }}>What this means: </strong>{signal.meaning_text}</div>
                  </div>
                )}
              </div>

              {/* Meeting note */}
              {signal?.meeting_note && (
                <div className="dash-meeting animate-3">
                  <div className="dash-meeting-label">If you{"\u2019"}re in a meeting today</div>
                  <div className="dash-meeting-body">{signal.meeting_note}</div>
                </div>
              )}

              {/* 3-column grid */}
              <div className="dash-grid-3 animate-3">
                {/* Card A — Tracker Velocity */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Tracker Velocity</span>
                    <a className="dash-card-link" href="/tracker/bbnj">All trackers →</a>
                  </div>
                  <div className="dash-card-body">
                    {trackers.map((t, i) => {
                      const c = trackerColor(t.name);
                      const slug = trackerSlug(t.name);
                      const vs = velocityScores.find(v => v.tracker_slug === slug);
                      const score = vs?.score ?? 0;
                      const arrow = trendArrow(vs?.momentum_direction);
                      return (
                        <div key={t.name} className="dash-vrow">
                          <span className="dash-vrow-dot" style={{ background: c }} />
                          <span className="dash-vrow-name">{t.name}</span>
                          <div className="dash-vrow-bar">
                            <div className="dash-vrow-fill" style={{ "--w": `${score * 10}%`, background: c, animationDelay: `${i * 0.1}s` } as React.CSSProperties} />
                          </div>
                          <span className="dash-vrow-score" style={{ color: scoreColor(score) }}>{score.toFixed(1)}</span>
                          <span className="dash-vrow-arrow" style={{ color: arrow.color }}>{arrow.char}</span>
                        </div>
                      );
                    })}
                    <div className="dash-card-footer">Updated Mon 07:00 · Next update Mon 07:00</div>
                  </div>
                </div>

                {/* Card B — Next 72 Hours */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Next 72 Hours</span>
                    <a className="dash-card-link" href="/platform/calendar">Calendar →</a>
                  </div>
                  <div className="dash-card-body">
                    <div className="dash-prep">
                      <div className="dash-prep-label">Meeting prep</div>
                      <div className="dash-prep-text">No upcoming governance events in the next 72 hours.</div>
                      <div className="dash-prep-meta">Check the calendar for the full schedule.</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#5F6368", textAlign: "center", padding: "12px 0" }}>
                      Events will appear here when governance meetings are within 72 hours.
                    </div>
                  </div>
                </div>

                {/* Card C — Most Watched */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Most Watched This Week</span>
                  </div>
                  <div className="dash-card-body">
                    <div className="dash-watched-intro">What other Tideline subscribers are tracking right now</div>
                    {trackers.slice(0, 4).map((t, i) => (
                      <div key={t.name} className="dash-watched-row">
                        <span className="dash-watched-rank">{String(i + 1).padStart(2, "0")}</span>
                        <span className="dash-watched-name">{t.name}</span>
                        <div className="dash-watched-bar">
                          <div className="dash-watched-fill" style={{ width: `${100 - i * 20}%` }} />
                        </div>
                        <span className="dash-watched-count">{Math.floor(Math.random() * 80 + 20)}</span>
                      </div>
                    ))}
                    <div className="dash-stat-grid">
                      <div className="dash-stat-box">
                        <div className="dash-stat-num">{stories.length > 0 ? stories.length * 12 : 0}</div>
                        <div className="dash-stat-label">Stories 7d</div>
                      </div>
                      <div className="dash-stat-box">
                        <div className="dash-stat-num">82%</div>
                        <div className="dash-stat-label">Brief opens</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-column grid */}
              <div className="dash-grid-2 animate-5">
                {/* Latest Stories */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <span className="dash-card-title">Latest Stories</span>
                    <a className="dash-card-link" href="/platform/feed">All stories →</a>
                  </div>
                  <div className="dash-card-body">
                    {latestStories.map(s => (
                      <div key={s.id} className="dash-story">
                        <div className="dash-story-meta">
                          <span className={`dash-story-tag ${topicTagClass(s.topic)}`}>{s.topic}</span>
                          <span className="dash-story-time">{relTime(s.published_at)}</span>
                        </div>
                        <a className="dash-story-title" href={`/platform/story/${s.id}`}>{decodeHtml(s.title)}</a>
                        {s.short_summary && (
                          <div className="dash-story-meaning">
                            <strong style={{ fontWeight: 500, color: "#3C4043" }}>What this means: </strong>
                            {s.short_summary}
                          </div>
                        )}
                        <div className="dash-story-source">{s.source_name}</div>
                      </div>
                    ))}
                    {latestStories.length === 0 && (
                      <div style={{ fontSize: 12, color: "#9AA0A6", textAlign: "center", padding: 20 }}>No stories yet today.</div>
                    )}
                  </div>
                </div>

                {/* Right column: Workspace + Library */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Workspace */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <span className="dash-card-title">Workspace</span>
                      <a className="dash-card-link" href="/platform/workspace">Open →</a>
                    </div>
                    <div className="dash-card-body">
                      {projects.slice(0, 3).map((p, i) => (
                        <a key={p.name} className="dash-ws-item" href={`/platform/projects/${encodeURIComponent(p.name)}`}>
                          <div className="dash-ws-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={i === 0 ? "#1D9E75" : "#9AA0A6"} strokeWidth="1.3"><path d="M3 2h8v11H3z" strokeLinejoin="round"/><path d="M5 5h4M5 7h4M5 9h2"/></svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="dash-ws-title">{p.name}</div>
                            <div className="dash-ws-meta">{p.count} sources</div>
                          </div>
                          <span className={`dash-ws-status ${i === 0 ? "active" : "draft"}`}>{i === 0 ? "Active" : "Draft"}</span>
                        </a>
                      ))}
                      {projects.length === 0 && (
                        <div style={{ fontSize: 12, color: "#9AA0A6", textAlign: "center", padding: 16 }}>No projects yet. Create one from the workspace.</div>
                      )}
                    </div>
                  </div>

                  {/* Library */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <span className="dash-card-title">Library</span>
                      <a className="dash-card-link" href="/platform/library">Browse →</a>
                    </div>
                    <div className="dash-card-body">
                      <div className="dash-lib-inner">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#1D9E75" strokeWidth="1.5"><path d="M3 2h12v15l-6-4-6 4V2z"/></svg>
                        <div>
                          <div className="dash-lib-count">2,400+ primary source documents</div>
                          <div className="dash-lib-orgs">ISA · IMO · BBNJ · FAO · OSPAR</div>
                        </div>
                      </div>
                      <div className="dash-lib-body">Search treaty text, regulatory publications, and governing body records in plain language. Every answer cited. Every source traceable.</div>
                      <div className="dash-lib-footer">
                        <a className="dash-lib-link" href="/platform/library">Search library →</a>
                        <a className="dash-lib-upload" href="/platform/library">Upload PDF</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
