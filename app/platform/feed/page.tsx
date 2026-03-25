"use client";
import { useState, useEffect } from "react";

const NAVY      = "#0B1D35";
const TEAL      = "#1D9E75";
const WHITE     = "#ffffff";
const OFF_WHITE = "#F5F4EF";
const INK       = "#111827";
const MUTED     = "#64748b";
const TEXT_TER  = "#94a3b8";
const SANS      = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF     = "'Instrument Serif', Georgia, serif";
const MONO      = "'DM Mono', monospace";

const VERTICALS = [
  { id: "all",         label: "All intelligence" },
  { id: "governance",  label: "Ocean governance" },
  { id: "shipping",    label: "Shipping" },
  { id: "fisheries",   label: "Fisheries" },
  { id: "bluefinance", label: "Blue finance" },
  { id: "dsm",         label: "Deep-sea mining" },
  { id: "climate",     label: "Climate" },
  { id: "pollution",   label: "Pollution" },
  { id: "mpa",         label: "MPAs" },
  { id: "iuu",         label: "IUU fishing" },
];

const SOURCE_COLORS: Record<string, string> = {
  gov: TEAL, reg: "#6366f1", ngo: "#059669", res: "#7c3aed", media: "#d97706", esg: "#0891b2",
};

function ageStr(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
}

function urgency(iso: string): "breaking" | "recent" | "standard" {
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 120) return "breaking";
  if (m < 1440) return "recent";
  return "standard";
}

// ── Story row ─────────────────────────────────────────────────────────────
function StoryRow({ story, isLead }: { story: any; isLead?: boolean }) {
  const [hov, setHov] = useState(false);
  const u = urgency(story.published_at);
  const srcColor = SOURCE_COLORS[story.source_type] || MUTED;

  return (
    <a href={`/platform/story/${story.id}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        padding: isLead ? "20px 24px" : "14px 24px",
        borderBottom: `1px solid ${OFF_WHITE}`,
        background: hov ? "#fafafa" : WHITE,
        borderLeft: u === "breaking" ? `3px solid ${TEAL}` : "3px solid transparent",
        transition: "background 0.1s",
        textDecoration: "none",
        cursor: "pointer",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {u === "breaking" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, animation: "tlpulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: TEAL, fontFamily: MONO, letterSpacing: "0.06em" }}>BREAKING</span>
          </span>
        )}
        {u === "recent" && (
          <span style={{ fontSize: 9, fontWeight: 600, color: TEAL, fontFamily: MONO, letterSpacing: "0.04em" }}>NEW</span>
        )}
        <span style={{ fontSize: 9, fontWeight: 700, color: srcColor, fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>{story.source_type}</span>
        <span style={{ fontSize: 11, color: TEXT_TER, fontFamily: SANS }}>{story.source_name}</span>
        <span style={{ fontSize: 10, color: TEXT_TER, fontFamily: MONO, marginLeft: "auto", flexShrink: 0 }}>{ageStr(story.published_at)}</span>
      </div>
      <div style={{ fontSize: isLead ? 17 : 14, fontWeight: isLead ? 400 : 400, color: INK, fontFamily: SERIF, lineHeight: 1.45, marginBottom: isLead ? 6 : 0 }}>
        {story.title}
      </div>
      {isLead && story.short_summary && (
        <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS, lineHeight: 1.6, marginTop: 4 }}>{story.short_summary}</div>
      )}
    </a>
  );
}

// ── Alert row ─────────────────────────────────────────────────────────────
function AlertRow({ story }: { story: any }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={`/platform/story/${story.id}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "block", padding: "16px 24px",
        borderBottom: `1px solid ${OFF_WHITE}`,
        background: hov ? "#f0fdf4" : "#f7fdf9",
        borderLeft: `3px solid ${TEAL}`,
        transition: "background 0.1s", textDecoration: "none", cursor: "pointer",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: TEAL, padding: "2px 8px", borderRadius: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: WHITE, animation: "tlpulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: WHITE, fontFamily: MONO, letterSpacing: "0.06em" }}>ALERT</span>
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: TEAL, fontFamily: MONO }}>Treaty Monitor</span>
        <span style={{ fontSize: 10, color: TEXT_TER, fontFamily: MONO, marginLeft: "auto" }}>{ageStr(story.published_at)}</span>
      </div>
      <div style={{ fontSize: 15, color: INK, fontFamily: SERIF, lineHeight: 1.45, marginBottom: 4 }}>{story.title}</div>
      {story.short_summary && (
        <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS, lineHeight: 1.6 }}>{story.short_summary}</div>
      )}
    </a>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TidelineFeed() {
  const [vertical, setVertical] = useState("all");
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mobile, setMobile] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const c = () => setMobile(window.innerWidth < 900);
    c();
    window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);

  useEffect(() => {
    fetch("/api/subscription-status")
      .then(r => r.json())
      .then(data => {
        if (data.needsOnboarding) { window.location.href = "/onboarding"; return; }
        setSubStatus(data.status);
        if (data.trialEnd) {
          const days = Math.ceil((new Date(data.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(days);
        }
      })
      .catch(() => {});
  }, []);

  const fetchStories = async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (vertical !== "all") params.set("topic", vertical);
      const res = await fetch(`/api/stories?${params}`);
      const data = await res.json();
      setStories(data.stories || []);
      setLastUpdated(new Date());
    } catch (e) { console.error("Failed to fetch stories:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    setStories([]);
    fetchStories();
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [vertical]);

  const alerts = stories.filter((s: any) => s.alert_type === "treaty_alert");
  const regular = stories.filter((s: any) => s.alert_type !== "treaty_alert");
  const lead = regular[0];
  const rest = regular.slice(1);

  return (
    <div style={{ fontFamily: SANS, color: INK, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes tlpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes tlspin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        a { text-decoration: none; color: inherit; }
      `}</style>

      {/* Nav */}
      <div style={{ background: NAVY, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ display: "flex", flexDirection: "column", textDecoration: "none" }}>
              <span style={{ fontSize: 18, fontWeight: 400, color: WHITE, fontFamily: SERIF, lineHeight: 1 }}>Tideline</span>
              <span style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: MONO, marginTop: 1 }}>OCEAN INTELLIGENCE</span>
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="/platform/feed" style={{ color: WHITE, fontSize: 12, fontFamily: SANS, fontWeight: 600 }}>Feed</a>
            <a href="/tracker/bbnj" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: SANS }}>Trackers</a>
            <a href="/tracker/governance" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: SANS }}>Calendar</a>
          </div>
        </div>
      </div>

      {/* Trial banner */}
      {subStatus === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
        <div style={{ background: "#f0fdf4", borderBottom: `1px solid ${TEAL}30`, padding: "8px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12, fontFamily: SANS }}>
          <span style={{ color: INK }}>Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining.</span>
          <a href="/subscribe" style={{ color: TEAL, fontWeight: 600 }}>Continue with Individual at {"\u00A3"}79/month</a>
        </div>
      )}

      {/* Paywall */}
      {(subStatus === "canceled" || subStatus === "past_due" || subStatus === "none") && subStatus !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(11,29,53,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 440, width: "100%", background: WHITE, borderRadius: 8, borderTop: `4px solid ${TEAL}`, padding: "48px 36px", textAlign: "center" }}>
            <h2 style={{ fontSize: 28, fontWeight: 400, color: NAVY, fontFamily: SERIF, marginBottom: 12 }}>Your trial has ended.</h2>
            <p style={{ fontSize: 14, color: MUTED, fontFamily: SANS, lineHeight: 1.7, marginBottom: 28 }}>
              Subscribe to continue accessing Tideline's intelligence platform.
            </p>
            <a href="/subscribe" style={{ display: "block", padding: "14px", background: TEAL, color: WHITE, fontSize: 14, fontWeight: 600, borderRadius: 4, fontFamily: SANS, marginBottom: 10 }}>Start free trial</a>
            <div style={{ fontSize: 11, color: TEXT_TER, fontFamily: MONO }}>{"\u00A3"}79/month after 14-day trial. No card required.</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", minHeight: "calc(100vh - 52px)" }}>
        {/* Sidebar */}
        {!mobile && (
          <div style={{ width: 200, borderRight: `1px solid #e5e7eb`, background: WHITE, flexShrink: 0, position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto" }}>
            <div style={{ padding: "16px 16px 8px", fontSize: 9, letterSpacing: "0.12em", color: TEXT_TER, fontWeight: 700, fontFamily: MONO, textTransform: "uppercase" }}>Topics</div>
            {VERTICALS.map(v => (
              <button key={v.id} onClick={() => setVertical(v.id)}
                style={{ display: "block", padding: "8px 16px", background: vertical === v.id ? `${TEAL}10` : "transparent", border: "none", borderLeft: vertical === v.id ? `2px solid ${TEAL}` : "2px solid transparent", color: vertical === v.id ? TEAL : MUTED, fontFamily: SANS, fontSize: 13, cursor: "pointer", textAlign: "left", width: "100%", fontWeight: vertical === v.id ? 600 : 400 }}>
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Main feed */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Mobile topic pills */}
          {mobile && (
            <div style={{ overflowX: "auto", display: "flex", gap: 6, padding: "10px 16px", background: WHITE, borderBottom: `1px solid #e5e7eb` }}>
              {VERTICALS.map(v => (
                <button key={v.id} onClick={() => setVertical(v.id)}
                  style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 16, border: `1px solid ${vertical === v.id ? TEAL : "#e5e7eb"}`, background: vertical === v.id ? `${TEAL}10` : WHITE, color: vertical === v.id ? TEAL : MUTED, fontFamily: SANS, fontSize: 11, fontWeight: vertical === v.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Header bar */}
          <div style={{ padding: "10px 24px", borderBottom: `1px solid #e5e7eb`, display: "flex", alignItems: "center", justifyContent: "space-between", background: WHITE }}>
            <span style={{ fontSize: 13, color: INK, fontWeight: 600, fontFamily: SANS }}>
              {VERTICALS.find(v => v.id === vertical)?.label}
            </span>
            <span style={{ fontSize: 10, color: TEXT_TER, fontFamily: MONO }}>
              {loading ? "Loading..." : `${stories.length} stories`}
              {lastUpdated && !loading && ` \u00b7 ${ageStr(lastUpdated.toISOString())} ago`}
            </span>
          </div>

          {/* Stories */}
          <div style={{ flex: 1, background: WHITE }}>
            {loading ? (
              <div style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid #e5e7eb`, borderTopColor: TEAL, animation: "tlspin 0.8s linear infinite" }} />
                <div style={{ fontSize: 12, color: TEXT_TER, fontFamily: MONO }}>Loading intelligence...</div>
              </div>
            ) : stories.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>No stories yet{vertical !== "all" ? " in this topic" : ""}. Feed updates every hour.</div>
              </div>
            ) : (
              <>
                {alerts.map(s => <AlertRow key={s.id} story={s} />)}
                {lead && <StoryRow story={lead} isLead />}
                {rest.map(s => <StoryRow key={s.id} story={s} />)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
