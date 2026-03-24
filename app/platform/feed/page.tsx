"use client";
import { useState, useEffect } from "react";

const VERTICALS = [
  { id: "all",         label: "All intelligence",   count: 147 },
  { id: "governance",  label: "Ocean governance",    count: 34  },
  { id: "shipping",    label: "Shipping & IMO",      count: 22  },
  { id: "fisheries",   label: "Fisheries",           count: 19  },
  { id: "bluefinance", label: "Blue finance",        count: 18  },
  { id: "dsm",         label: "Deep-sea mining",     count: 11  },
  { id: "climate",     label: "Climate science",     count: 21  },
  { id: "pollution",   label: "Pollution",           count: 9   },
  { id: "mpa",         label: "MPAs & 30x30",        count: 7   },
  { id: "iuu",         label: "Illegal fishing",     count: 6   },
];

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  gov:   { bg: "#dbeafe", text: "#1e40af" },
  reg:   { bg: "#fee2e2", text: "#991b1b" },
  ngo:   { bg: "#dcfce7", text: "#166534" },
  res:   { bg: "#f3e8ff", text: "#6b21a8" },
  media: { bg: "#fef3c7", text: "#78350f" },
  esg:   { bg: "#ccfbf1", text: "#134e4a" },
};

const SOURCE_LABELS: Record<string, string> = {
  gov: "Gov", reg: "Reg", ngo: "NGO", res: "Research", media: "Media", esg: "ESG"
};

function ageStr(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function sig(iso: string): string {
  const m = (Date.now() - new Date(iso).getTime()) / 60000;
  if (m < 120) return "breaking";
  if (m < 1440) return "new";
  return "standard";
}

function Badge({ type, small }: { type: string; small?: boolean }) {
  const c = SOURCE_COLORS[type] || SOURCE_COLORS.media;
  return (
    <span style={{ fontSize: small ? 10 : 11, fontFamily: "system-ui,-apple-system,sans-serif", fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: c.bg, color: c.text, flexShrink: 0, lineHeight: 1.6 }}>
      {SOURCE_LABELS[type] || "—"}
    </span>
  );
}

function SigLabel({ type }: { type: string }) {
  if (type === "breaking") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "0.04em", color: "#b91c1c", flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "tlpulse 1.5s ease-in-out infinite" }} />Breaking
    </span>
  );
  if (type === "new") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "0.03em", color: "#15803d", flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />New
    </span>
  );
  return null;
}

function StoryRow({ story, isTop }: { story: any; isTop?: boolean }) {
  const [hov, setHov] = useState(false);
  const s = sig(story.published_at);

  return (
    <a href={`/platform/story/${story.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        padding: isTop ? "22px 24px 18px" : "14px 20px",
        borderBottom: "1px solid #e8e4dc",
        background: hov ? "#f0ebe0" : "#faf8f4",
        borderLeft: isTop
          ? (s === "breaking" ? "3px solid #ef4444" : "3px solid #c8b89a")
          : (s === "breaking" ? "3px solid #fca5a5" : "3px solid transparent"),
        transition: "background 0.12s ease",
        textDecoration: "none",
        cursor: "pointer",
      }}>
      {isTop && (
        <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "0.1em", color: "#a8a29e", textTransform: "uppercase" as const, marginBottom: 10 }}>
          Top story
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, flexWrap: "wrap" as const }}>
        {s !== "standard" && <SigLabel type={s} />}
        <Badge type={story.source_type} small={!isTop} />
        <span style={{ fontSize: 11, fontFamily: "system-ui,-apple-system,sans-serif", color: "#78716c", fontWeight: 500 }}>{story.source_name}</span>
        <span style={{ fontSize: 11, fontFamily: "system-ui,-apple-system,sans-serif", color: "#a8a29e", marginLeft: "auto", flexShrink: 0 }}>{ageStr(story.published_at)}</span>
      </div>
      <div style={{
        fontFamily: "'Libre Baskerville',Georgia,serif",
        fontSize: isTop ? 18 : 14,
        lineHeight: 1.5,
        color: "#1c1917",
        fontWeight: isTop ? 700 : 400,
        marginBottom: 6,
      }}>
        {story.title}
      </div>
      <div style={{ fontSize: 11, fontFamily: "system-ui,-apple-system,sans-serif", fontWeight: 600, color: "#1d4ed8" }}>
        Intelligence brief →
      </div>
    </a>
  );
}

function AlertRow({ story }: { story: any }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={`/platform/story/${story.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        padding: "18px 24px",
        borderBottom: "1px solid #e8e4dc",
        background: hov ? "#fef2f2" : "#fff5f5",
        borderLeft: "3px solid #ef4444",
        transition: "background 0.12s ease",
        textDecoration: "none",
        cursor: "pointer",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, fontFamily: "system-ui,-apple-system,sans-serif", letterSpacing: "0.06em", color: "#ffffff", background: "#dc2626", padding: "2px 8px", borderRadius: 3, textTransform: "uppercase" as const }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff", display: "inline-block", animation: "tlpulse 1.5s ease-in-out infinite" }} />
          ALERT
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "system-ui,-apple-system,sans-serif", color: "#991b1b", letterSpacing: "0.04em" }}>Treaty Monitor</span>
        <span style={{ fontSize: 11, fontFamily: "system-ui,-apple-system,sans-serif", color: "#a8a29e", marginLeft: "auto", flexShrink: 0 }}>{ageStr(story.published_at)}</span>
      </div>
      <div style={{
        fontFamily: "'Libre Baskerville',Georgia,serif",
        fontSize: 16,
        lineHeight: 1.5,
        color: "#1c1917",
        fontWeight: 700,
        marginBottom: 4,
      }}>
        {story.title}
      </div>
      {story.short_summary && (
        <div style={{ fontSize: 13, fontFamily: "system-ui,-apple-system,sans-serif", color: "#57534e", lineHeight: 1.6, marginBottom: 6 }}>
          {story.short_summary}
        </div>
      )}
      <div style={{ fontSize: 11, fontFamily: "system-ui,-apple-system,sans-serif", fontWeight: 600, color: "#dc2626" }}>
        View intelligence →
      </div>
    </a>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #e8e4dc", borderTopColor: "#1d4ed8", animation: "tlspin 0.8s linear infinite" }} />
      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 12, color: "#a8a29e" }}>Loading intelligence...</div>
    </div>
  );
}

function EmptyState({ vertical }: { vertical: string }) {
  return (
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 28, color: "#d6d3d1" }}>◈</div>
      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 12, color: "#a8a29e", textAlign: "center" as const }}>
        No stories yet{vertical !== "all" ? " in this area" : ""}.<br />Feed updates every hour.
      </div>
    </div>
  );
}

export default function TidelineFeed() {
  const [vertical, setVertical] = useState("all");
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mobile, setMobile] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const c = () => setMobile(window.innerWidth < 768);
    c();
    window.addEventListener("resize", c);
    return () => window.removeEventListener("resize", c);
  }, []);

  useEffect(() => {
    fetch("/api/subscription-status")
      .then(r => r.json())
      .then(data => {
        if (data.needsOnboarding) {
          window.location.href = "/onboarding";
          return;
        }
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
    } catch (e) {
      console.error("Failed to fetch stories:", e);
    } finally {
      setLoading(false);
    }
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
  const top = regular[0];
  const rest = regular.slice(1);

  const updatedLabel = lastUpdated
    ? `Live · Updated ${ageStr(lastUpdated.toISOString())}`
    : "Live";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    @keyframes tlpulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5);}50%{box-shadow:0 0 0 4px rgba(239,68,68,0);}}
    @keyframes tlspin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    ::-webkit-scrollbar{width:4px;height:3px;}
    ::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:2px;}
    a{text-decoration:none;}
  `;

  return (
    <>
      <style>{CSS}</style>
      {/* Trial expiring banner (soft) */}
      {subStatus === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft > 0 && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 13 }}>
          <span style={{ color: "#92400e" }}>Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}.</span>
          <a href="/subscribe" style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "underline" }}>Subscribe to keep access →</a>
        </div>
      )}

      {/* Paywall (hard gate) */}
      {(subStatus === "canceled" || subStatus === "past_due" || subStatus === "none") && subStatus !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,22,40,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 480, width: "100%", background: "#ffffff", border: "1px solid #e2e8f0", borderTop: "4px solid #1d6fa4", padding: "48px 40px", textAlign: "center" as const }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#1d6fa4", marginBottom: 16, fontFamily: "system-ui,-apple-system,sans-serif" }}>Tideline Professional</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0a1628", fontFamily: "Georgia,serif", marginBottom: 14, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
              {subStatus === "past_due" ? "Your payment failed." : "Your trial has ended."}
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 8, fontFamily: "system-ui,-apple-system,sans-serif" }}>
              Subscribe to unlock full access to Tideline's ocean intelligence platform.
            </p>
            <ul style={{ textAlign: "left" as const, fontSize: 14, color: "#0a1628", lineHeight: 1.8, margin: "20px auto 28px", maxWidth: 320, fontFamily: "system-ui,-apple-system,sans-serif", listStyle: "none", padding: 0 }}>
              {["All 55 intelligence topics", "Daily morning brief before 7am", "Live regulatory trackers", "AI-powered article summaries", "Breaking incident alerts"].map(f => (
                <li key={f} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  <span style={{ color: "#1d6fa4", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="/subscribe" style={{ display: "block", padding: "14px", background: "#1d6fa4", color: "#ffffff", fontSize: 15, fontWeight: 700, borderRadius: 3, fontFamily: "system-ui,-apple-system,sans-serif", textDecoration: "none", marginBottom: 12 }}>
              {subStatus === "past_due" ? "Update payment — £25/month" : "Subscribe now — £25/month"}
            </a>
            <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "system-ui,-apple-system,sans-serif", lineHeight: 1.6 }}>
              {subStatus === "past_due" ? "Update your card to restore access instantly." : "14-day free trial. Cancel anytime."}
            </p>
          </div>
        </div>
      )}

      <div style={{ width: "100%", minHeight: "100vh", background: "#f2ede4", display: "flex" }}>

        {/* Left sidebar */}
        {!mobile && (
          <div style={{ width: 210, borderRight: "1px solid #e0d9ce", background: "#faf8f4", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
            <div style={{ padding: "18px 18px 8px", fontSize: 10, letterSpacing: "0.12em", color: "#a8a29e", fontWeight: 600, fontFamily: "system-ui,-apple-system,sans-serif", textTransform: "uppercase" as const }}>Intelligence areas</div>
            {VERTICALS.map(v => (
              <button key={v.id} onClick={() => setVertical(v.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 18px", background: vertical === v.id ? "#eff6ff" : "transparent", border: "none", borderLeft: vertical === v.id ? "3px solid #1d4ed8" : "3px solid transparent", color: vertical === v.id ? "#1d4ed8" : "#57534e", fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 13, cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.1s ease", fontWeight: vertical === v.id ? 600 : 400 }}
                onMouseEnter={e => { if (vertical !== v.id) (e.currentTarget as HTMLButtonElement).style.background = "#f0ebe0"; }}
                onMouseLeave={e => { if (vertical !== v.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <span>{v.label}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: vertical === v.id ? "#93c5fd" : "#d6d3d1" }}>
                  {vertical === v.id ? stories.length : v.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main feed */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {mobile && (
            <div style={{ overflowX: "auto", display: "flex", gap: 6, padding: "10px 16px", background: "#faf8f4", borderBottom: "1px solid #e8e4dc" }}>
              {VERTICALS.map(v => (
                <button key={v.id} onClick={() => setVertical(v.id)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20, border: vertical === v.id ? "1.5px solid #1d4ed8" : "1.5px solid #d6d3d1", background: vertical === v.id ? "#eff6ff" : "#faf8f4", color: vertical === v.id ? "#1d4ed8" : "#57534e", fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 11, fontWeight: vertical === v.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                  {v.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: "12px 20px", borderBottom: "1px solid #e8e4dc", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#faf8f4", flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: "#1c1917", fontWeight: 600, fontFamily: "system-ui,-apple-system,sans-serif" }}>
              {VERTICALS.find(v => v.id === vertical)?.label}
            </div>
            <div style={{ fontSize: 11, color: "#a8a29e", fontFamily: "system-ui,-apple-system,sans-serif" }}>
              {loading ? "Loading..." : `${stories.length} stories · ${updatedLabel}`}
            </div>
          </div>

          <div style={{ flex: 1, background: "#faf8f4" }}>
            {loading ? <LoadingState /> : stories.length === 0 ? <EmptyState vertical={vertical} /> : (
              <>
                {alerts.map(s => <AlertRow key={s.id} story={s} />)}
                {top && <StoryRow story={top} isTop />}
                {rest.map(s => <StoryRow key={s.id} story={s} />)}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
