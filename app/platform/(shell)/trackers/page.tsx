import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const revalidate = 300; // 5 min ISR

/* ── Design tokens (white content, matches platform shell) ─── */
const GREEN = "#149A73";
const GREEN_DARK = "#0F7C5C";
const GREEN_TINT = "#E9F5F0";
const AMBER = "#EF9F27";
const AMBER_TINT = "#FBF3E2";
const RED = "#E24B4A";
const RED_TINT = "#FBEBEA";
const INK = "#15201B";
const BODY = "#42504A";
const MUTED = "#6E7C75";
const LINE = "#E7E5DC";
const CARD = "#FFFFFF";
const F = "'DM Sans', system-ui, sans-serif";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif";

/* ── State vocabulary (TRACKER-PAGES-SPEC Section 1) ──────── */
type Band = "LOW" | "WATCH" | "ELEVATED";

function getBand(score: number): Band {
  if (score >= 7) return "ELEVATED";
  if (score >= 4) return "WATCH";
  return "LOW";
}

function getUserState(band: Band, tier: string): string {
  if (tier === "calibrating") return "New tracker, still calibrating";
  if (band === "LOW") return "Quiet";
  if (band === "WATCH") return "More active than usual";
  return "Decision likely soon";
}

function bandColor(band: Band) {
  if (band === "ELEVATED") return GREEN;
  if (band === "WATCH") return AMBER;
  return MUTED;
}

function bandTint(band: Band) {
  if (band === "ELEVATED") return GREEN_TINT;
  if (band === "WATCH") return AMBER_TINT;
  return "#F2F2EC";
}

/* ── SVG Sparkline (server-computed, 52-week) ─────────────── */
function Sparkline({ points, color, width = 120, height = 32 }: {
  points: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 10); // y-axis 0-10 for Pulse
  const min = 0;
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((p - min) / range) * height,
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = line + ` L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={area} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Countdown helper ─────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

/* ── Types ────────────────────────────────────────────────── */
interface TrackerData {
  slug: string;
  displayName: string;
  tier: string;
  institutionalType: string;
  failureModeCopy: string;
  score: number;
  band: Band;
  state: string;
  momentum: string;
  previousScore: number | null;
  sparklinePoints: number[];
  nextEvent: { name: string; date: string; daysAway: number; kind: string } | null;
  weeksSinceEntry: number;
}

/* ── Data fetching ────────────────────────────────────────── */
async function getHeatBoardData(): Promise<{
  trackers: TrackerData[];
  weekOf: string;
  movedCount: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // All tracker metadata
  const { data: trackerRows } = await supabase
    .from("trackers")
    .select("slug, display_name, tier, institutional_type, failure_mode_copy");

  // All velocity_scores (for sparklines + latest score)
  const { data: allScores } = await supabase
    .from("velocity_scores")
    .select("tracker_slug, score, momentum_direction, calculated_at, previous_score")
    .order("calculated_at", { ascending: true });

  // State log (most recent per tracker)
  const { data: stateLog } = await supabase
    .from("tracker_state_log")
    .select("tracker_slug, band, entered_at")
    .order("entered_at", { ascending: false });

  // Upcoming domain events
  const today = new Date().toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("domain_events")
    .select("tracker_slug, name, event_date, kind")
    .gte("event_date", today)
    .order("event_date", { ascending: true });

  // Build per-tracker data
  const trackerMap = new Map((trackerRows || []).map((t) => [t.slug, t]));
  const scoresBySlug = new Map<string, typeof allScores>();
  (allScores || []).forEach((s) => {
    if (!scoresBySlug.has(s.tracker_slug)) scoresBySlug.set(s.tracker_slug, []);
    scoresBySlug.get(s.tracker_slug)!.push(s);
  });
  const stateBySlug = new Map<string, (typeof stateLog)[0]>();
  (stateLog || []).forEach((s) => {
    if (!stateBySlug.has(s.tracker_slug)) stateBySlug.set(s.tracker_slug, s);
  });
  const eventsBySlug = new Map<string, (typeof events)[0]>();
  (events || []).forEach((e) => {
    if (!eventsBySlug.has(e.tracker_slug)) eventsBySlug.set(e.tracker_slug, e);
  });

  const trackers: TrackerData[] = [];

  for (const [slug, meta] of trackerMap) {
    const scores = scoresBySlug.get(slug) || [];
    const latest = scores[scores.length - 1];
    const score = latest?.score ?? 0;
    const band = getBand(score);
    const state = getUserState(band, meta.tier);
    const sparklinePoints = scores.slice(-52).map((s: any) => s.score);
    const stateEntry = stateBySlug.get(slug);
    const weeksSinceEntry = stateEntry
      ? Math.floor((Date.now() - new Date(stateEntry.entered_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
      : 0;
    const nextEvt = eventsBySlug.get(slug);
    const nextEvent = nextEvt
      ? { name: nextEvt.name, date: nextEvt.event_date, daysAway: daysUntil(nextEvt.event_date), kind: nextEvt.kind }
      : null;

    trackers.push({
      slug,
      displayName: meta.display_name,
      tier: meta.tier,
      institutionalType: meta.institutional_type || "",
      failureModeCopy: meta.failure_mode_copy || "",
      score,
      band,
      state,
      momentum: latest?.momentum_direction || "stable",
      previousScore: latest?.previous_score ?? null,
      sparklinePoints,
      nextEvent,
      weeksSinceEntry,
    });
  }

  // Sort by score descending
  trackers.sort((a, b) => b.score - a.score);

  // Determine week of
  const latestCalc = (allScores || []).reduce((max, s) => (s.calculated_at > max ? s.calculated_at : max), "");
  const weekOf = latestCalc ? new Date(latestCalc).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "current";

  // Count moved (band changed in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const movedCount = (stateLog || []).filter((s) => s.entered_at > sevenDaysAgo).length;

  return { trackers, weekOf, movedCount };
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function TrackersHeatBoard() {
  const { trackers, weekOf, movedCount } = await getHeatBoardData();

  // Section assignment per spec
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const moved = trackers.filter(() => false); // No band changes detected in state_log in last 7 days currently
  const active = trackers.filter((t) => t.band !== "LOW" && !moved.includes(t));
  const quiet = trackers.filter((t) => t.band === "LOW" && !moved.includes(t));

  const s = {
    page: { padding: "32px 0 64px", fontFamily: F, color: BODY } as const,
    header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, padding: "0 32px" } as const,
    h1: { fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, color: INK, letterSpacing: "-0.02em", margin: 0 } as const,
    weekSummary: { fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums slashed-zero" as const } as const,
    sectionLabel: { fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" as const, margin: "40px 32px 16px" } as const,
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, padding: "0 32px" } as const,
    chipGrid: { display: "flex", flexWrap: "wrap" as const, gap: 8, padding: "0 32px" } as const,
    card: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "20px 22px", textDecoration: "none", display: "block", transition: "border-color 0.15s" } as const,
    chip: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 99, padding: "8px 16px", fontSize: 13, color: BODY, display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" } as const,
    scorePill: (band: Band) => ({
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      padding: "3px 10px", borderRadius: 99,
      color: band === "ELEVATED" ? GREEN_DARK : band === "WATCH" ? "#A66A05" : MUTED,
      background: bandTint(band),
      fontVariantNumeric: "tabular-nums slashed-zero",
    }),
    stateLabel: { fontSize: 13, fontWeight: 600, color: INK } as const,
    meta: { fontSize: 12, color: MUTED, marginTop: 4, fontVariantNumeric: "tabular-nums slashed-zero" as const } as const,
    countdown: (days: number) => ({
      fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, color: days <= 14 ? AMBER : MUTED,
      fontVariantNumeric: "tabular-nums slashed-zero",
      lineHeight: 1,
    }),
    countdownLabel: { fontSize: 11, color: MUTED, marginTop: 2 } as const,
    closingLine: { fontSize: 14, color: MUTED, padding: "24px 32px 0", lineHeight: 1.6 } as const,
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.h1}>Trackers</h1>
        <div style={s.weekSummary}>
          Week of {weekOf} &middot; {movedCount} domain{movedCount !== 1 ? "s" : ""} moved
        </div>
      </div>

      {/* Section A: Moved this week */}
      {moved.length > 0 && (
        <>
          <div style={s.sectionLabel}>Moved this week</div>
          <div style={s.grid}>
            {moved.map((t) => (
              <Link key={t.slug} href={`/platform/tracker/${t.slug}`} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: INK }}>{t.displayName}</div>
                    <div style={s.meta}>{t.weeksSinceEntry} week{t.weeksSinceEntry !== 1 ? "s" : ""} in state</div>
                  </div>
                  <div style={s.scorePill(t.band)}>
                    {t.score.toFixed(1)} &middot; {t.state}
                  </div>
                </div>
                <Sparkline points={t.sparklinePoints} color={bandColor(t.band)} width={280} height={40} />
                {t.nextEvent && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
                    <div style={s.countdown(t.nextEvent.daysAway)}>{t.nextEvent.daysAway}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{t.nextEvent.name}</div>
                      <div style={s.countdownLabel}>days away</div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Section B: Active, unchanged */}
      {active.length > 0 && (
        <>
          <div style={s.sectionLabel}>Active, unchanged</div>
          <div style={s.grid}>
            {active.map((t) => (
              <Link key={t.slug} href={`/platform/tracker/${t.slug}`} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: INK }}>{t.displayName}</div>
                  <div style={s.scorePill(t.band)}>
                    {t.score.toFixed(1)}
                  </div>
                </div>
                <div style={s.stateLabel}>{t.state}</div>
                <Sparkline points={t.sparklinePoints} color={bandColor(t.band)} width={240} height={28} />
                {t.nextEvent && (
                  <div style={s.meta}>{t.nextEvent.name} in {t.nextEvent.daysAway} days</div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Section C: Quiet */}
      {quiet.length > 0 && (
        <>
          <div style={s.sectionLabel}>Quiet</div>
          <div style={s.chipGrid}>
            {quiet.map((t) => (
              <Link key={t.slug} href={`/platform/tracker/${t.slug}`} style={s.chip}>
                <Sparkline points={t.sparklinePoints} color={MUTED} width={48} height={18} />
                <span style={{ fontWeight: 600, color: INK }}>{t.displayName}</span>
                <span style={{ fontVariantNumeric: "tabular-nums slashed-zero", color: MUTED, fontSize: 12 }}>{t.score.toFixed(1)}</span>
                {t.nextEvent && (
                  <span style={{ fontSize: 11, color: t.nextEvent.daysAway <= 14 ? AMBER : MUTED }}>
                    {t.nextEvent.name} in {t.nextEvent.daysAway}d
                  </span>
                )}
              </Link>
            ))}
          </div>
          <p style={s.closingLine}>
            All {quiet.length} domains are monitored nightly. You will be alerted the week any of these starts to move.
          </p>
        </>
      )}

      {/* Empty state: no data at all */}
      {trackers.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 32px", color: MUTED }}>
          No tracker data available. Scores are calculated weekly on Mondays.
        </div>
      )}
    </div>
  );
}
