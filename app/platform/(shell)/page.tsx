"use client";

import { useState, useEffect } from "react";

const F = "'DM Sans', system-ui, sans-serif";
const M = "'DM Mono', monospace";
const TEAL = "#1D9E75";
const AMBER = "#EF9F27";
const T1 = "#202124";
const T2 = "#5F6368";
const T3 = "#9AA0A6";
const BORDER = "#DADCE0";
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";

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

function fmtDate(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function scoreColor(s: number): string {
  if (s >= 7) return TEAL;
  if (s >= 4) return AMBER;
  return T3;
}

function bandLabel(s: number): { label: string; bg: string; color: string } {
  if (s >= 7) return { label: "ELEVATED", bg: "#E8F7F2", color: TEAL };
  if (s >= 4) return { label: "WATCH", bg: "#FEF3E2", color: AMBER };
  return { label: "LOW", bg: BG, color: T3 };
}

function trendArrow(dir: string): { char: string; color: string } {
  if (dir === "accelerating") return { char: "\u2191", color: TEAL };
  if (dir === "decelerating") return { char: "\u2193", color: "#E24B4A" };
  return { char: "\u2192", color: T3 };
}

const SLUG_NAMES: Record<string, string> = {
  isa: "ISA Deep Sea Mining", bbnj: "BBNJ High Seas Treaty", iuu: "IUU Fishing",
  "30x30": "30x30 MPAs", "blue-finance": "Blue Finance", plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping", "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine", "wto-fisheries": "WTO Fisheries",
};

function slugName(s: string): string { return SLUG_NAMES[s] || s; }

function actionVerdict(score: number, tag: string): string {
  if (score >= 8) return "Seek legal advice";
  const esg = new Set(["isa", "bbnj", "blue-finance", "tnfd"]);
  const comp = new Set(["imo-shipping", "iuu"]);
  if (score >= 6 && esg.has(tag)) return "Review TNFD position";
  if (score >= 6 && comp.has(tag)) return "Flag for compliance review";
  return "Monitor";
}

interface VScore { tracker_slug: string; score: number; momentum_direction: string }
interface Story { id: string; title: string; source_name: string; topic: string; published_at: string; short_summary: string | null }
interface Divergence { id: string; tracker_tag: string; score: number; headline?: string; why_it_matters: string; detected_at: string }
interface Signal { signal_text: string; meaning_text: string; signal_date: string }

const LBL: React.CSSProperties = { fontFamily: M, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: T3, marginBottom: 8 };
const CARD: React.CSSProperties = { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column", overflow: "hidden" };

export default function DashboardPage() {
  const [velocityScores, setVelocityScores] = useState<VScore[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.ok ? r.json() : {}),
      fetch("/api/stories?limit=3").then(r => r.ok ? r.json() : { stories: [] }),
      fetch("/api/conflicts").then(r => r.ok ? r.json() : { divergences: [] }),
    ]).then(([dash, storiesData, conflictsData]: [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]) => {
      setVelocityScores((dash.velocityScores as VScore[]) || []);
      setSignal((dash.signal as Signal) || null);
      setStories(((storiesData.stories as Story[]) || []).slice(0, 3));
      setDivergences(((conflictsData.divergences as Divergence[]) || []).slice(0, 3));
      setLoaded(true);
    }).catch(() => setLoaded(true));

    fetch("/api/user/update-last-seen", { method: "POST" }).catch(() => {});
  }, []);

  const sorted = [...velocityScores].sort((a, b) => b.score - a.score);
  const top = sorted[0] || null;
  const watchCount = velocityScores.filter(v => v.score >= 4).length;

  if (!loaded) {
    return (
      <div style={{ background: BG, minHeight: "100%", fontFamily: F, padding: "12px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...CARD, height: 220, animation: "dashPulse 1.2s ease-in-out infinite" }}>
              <style>{`@keyframes dashPulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100%", fontFamily: F }}>
      {/* Topbar */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: T1 }}>Dashboard</div>
          <div style={{ fontSize: 11, color: T3, marginTop: 1 }}>{fmtDate()}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: M, fontSize: 10, fontWeight: 600, color: TEAL, letterSpacing: ".08em" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block" }} />
          LIVE
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "12px 20px", display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 10 }}>

        {/* Card 1: Highest Pulse Score */}
        <div style={{ ...CARD, borderTop: `3px solid ${TEAL}` }}>
          <div style={LBL}>HIGHEST PULSE SCORE NOW</div>
          {top ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: M, fontSize: 42, fontWeight: 700, color: TEAL, lineHeight: 1 }}>{top.score.toFixed(1)}</span>
                <span style={{ fontFamily: M, fontSize: 14, color: T3 }}>/10</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginTop: 6 }}>{slugName(top.tracker_slug)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {(() => { const a = trendArrow(top.momentum_direction); return <span style={{ fontFamily: M, fontSize: 12, color: a.color }}>{a.char} {top.momentum_direction}</span>; })()}
              </div>
            </>
          ) : <Empty />}
        </div>

        {/* Card 2: Your Exposure Today */}
        <div style={CARD}>
          <div style={LBL}>YOUR EXPOSURE TODAY</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
            <span style={{ fontFamily: M, fontSize: 32, fontWeight: 700, color: TEAL, lineHeight: 1 }}>{watchCount}</span>
            <span style={{ fontFamily: M, fontSize: 14, color: T3 }}>of {velocityScores.length}</span>
          </div>
          <div style={{ fontSize: 11, color: T2, marginBottom: 10 }}>domains in WATCH or above</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, overflow: "hidden" }}>
            {sorted.slice(0, 6).map(v => {
              const b = bandLabel(v.score);
              return (
                <div key={v.tracker_slug} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: F, fontSize: 11, color: T2, width: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{slugName(v.tracker_slug)}</span>
                  <div style={{ flex: 1, height: 4, background: "#E8EAED", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${(v.score / 10) * 100}%`, background: b.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: M, fontSize: 9, fontWeight: 600, color: b.color, background: b.bg, padding: "1px 5px", borderRadius: 999, flexShrink: 0 }}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Since Your Last Visit */}
        <div style={CARD}>
          <div style={LBL}>SINCE YOUR LAST VISIT <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>{"\u00B7"} today</span></div>
          {stories.length > 0 ? stories.map(s => {
            const dotColor = ["isa", "30x30", "mpa"].some(t => s.topic?.includes(t)) ? TEAL : AMBER;
            return (
              <div key={s.id} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <a href={`/platform/story/${s.id}`} style={{ fontFamily: F, fontSize: 12.5, fontWeight: 500, color: T1, textDecoration: "none", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{s.title}</a>
                  <div style={{ fontFamily: M, fontSize: 10, color: T3, marginTop: 2 }}>{relTime(s.published_at)} {"\u00B7"} {s.topic}</div>
                </div>
              </div>
            );
          }) : <Empty />}
        </div>

        {/* Card 4: Tracker Velocity */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={LBL as Record<string, unknown>}>TRACKER VELOCITY</div>
            <a href="/platform/trackers" style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none" }}>All trackers {"\u2192"}</a>
          </div>
          {sorted.length > 0 ? sorted.slice(0, 5).map(v => {
            const a = trendArrow(v.momentum_direction);
            return (
              <div key={v.tracker_slug} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: F, fontSize: 12, color: T1, width: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{slugName(v.tracker_slug)}</span>
                <div style={{ width: 60, height: 4, background: "#E8EAED", borderRadius: 2, flexShrink: 0 }}>
                  <div style={{ height: 4, width: `${(v.score / 10) * 100}%`, background: scoreColor(v.score), borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: scoreColor(v.score), width: 28, textAlign: "right", flexShrink: 0 }}>{v.score.toFixed(1)}</span>
                <span style={{ fontFamily: M, fontSize: 11, color: a.color, flexShrink: 0 }}>{a.char}</span>
              </div>
            );
          }) : <Empty />}
        </div>

        {/* Card 5: Active Conflicts */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={LBL as Record<string, unknown>}>ACTIVE CONFLICTS</div>
            <a href="/platform/conflicts" style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: TEAL, textDecoration: "none" }}>All {"\u2192"}</a>
          </div>
          {divergences.length > 0 ? divergences.slice(0, 3).map(d => {
            const av = actionVerdict(d.score, d.tracker_tag);
            return (
              <div key={d.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontFamily: M, fontSize: 13, fontWeight: 700, color: d.score >= 6 ? AMBER : T3, flexShrink: 0, marginTop: 1 }}>{d.score.toFixed(1)}</span>
                  <span style={{ fontFamily: F, fontSize: 12.5, color: T1, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{d.headline || d.tracker_tag}</span>
                </div>
                <span style={{ fontFamily: M, fontSize: 9, fontWeight: 600, color: "#0F6E56", background: "#E1F5EE", padding: "2px 6px", borderRadius: 999, marginTop: 4, display: "inline-block" }}>{av}</span>
              </div>
            );
          }) : <Empty />}
        </div>

        {/* Card 6: Most Watched + Signal */}
        <div style={CARD}>
          {/* Top: Most Watched */}
          <div style={LBL}>MOST WATCHED</div>
          {/* TODO: wire to real tracking data — subscriber counts are placeholders */}
          {sorted.slice(0, 4).map((v, i) => {
            const counts = [94, 49, 44, 24];
            return (
              <div key={v.tracker_slug} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: M, fontSize: 10, color: T3, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: F, fontSize: 12, color: T1, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slugName(v.tracker_slug)}</span>
                <span style={{ fontFamily: M, fontSize: 10, color: T3, flexShrink: 0 }}>{counts[i] ?? 0}</span>
              </div>
            );
          })}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${BORDER}`, margin: "10px 0 8px" }} />

          {/* Bottom: Signal of the Day */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={LBL as Record<string, unknown>}>SIGNAL OF THE DAY</div>
            <span style={{ fontFamily: M, fontSize: 9, color: T3 }}>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </div>
          {/* TODO: wire to signals table when it exists */}
          {signal?.signal_text ? (
            <div style={{ borderLeft: `2px solid ${TEAL}`, paddingLeft: 10 }}>
              <div style={{ fontFamily: F, fontSize: 12, color: T1, lineHeight: 1.5 }}>{signal.signal_text}</div>
              {signal.meaning_text && (
                <div style={{ fontFamily: F, fontSize: 11, color: T2, lineHeight: 1.5, marginTop: 4 }}>{signal.meaning_text}</div>
              )}
            </div>
          ) : (
            <div style={{ fontFamily: F, fontSize: 12, color: T3 }}>No signal for today yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: "#9AA0A6", padding: "8px 0" }}>No data yet</div>;
}
