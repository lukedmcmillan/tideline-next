"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const RED    = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M      = "var(--font-mono), 'DM Mono', monospace";

// ── Types ────────────────────────────────────────────────────────────────
interface Story {
  id: string;
  title: string;
  link: string;
  source_name: string;
  topic: string;
  source_type: string;
  published_at: string;
  short_summary: string | null;
  full_summary: string | null;
  is_pro: boolean;
  alert_type: string | null;
}

// ── Topic mapping ────────────────────────────────────────────────────────
const TOPIC_LABELS: Record<string, string> = {
  governance: "GOVERNANCE",
  dsm: "DEEP-SEA MINING",
  bluefinance: "BLUE FINANCE",
  climate: "CLIMATE",
  iuu: "IUU FISHING",
  mpa: "30X30",
  fisheries: "FISHERIES",
  science: "SCIENCE",
  acidification: "CLIMATE",
  technology: "TECHNOLOGY",
  all: "OCEAN",
};

const LS_KEY = "tideline_read_stories";
const SAVED_KEY = "tideline_saved_stories";

function loadReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveReadSet(s: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...s]));
  } catch {}
}

function loadSavedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveSavedSet(s: Set<string>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...s]));
  } catch {}
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function topicLabel(topic: string) {
  return TOPIC_LABELS[topic] || topic.toUpperCase();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtTimeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isPro(s: Story) {
  return s.is_pro || s.source_type === "gov" || s.source_type === "reg";
}

function Src({ name, t1, link }: { name: string; t1: boolean; link?: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: t1 ? TEAL : T4 }}>{name}</span>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 500, color: T4, textDecoration: "none" }}>View original {"\u2197"}</a>
      )}
    </span>
  );
}

// ── Mobile story card ────────────────────────────────────────────────────
function MobileStoryCard({ s, isRead, isSaved, onTap, onSave }: {
  s: Story;
  isRead: boolean;
  isSaved: boolean;
  onTap: () => void;
  onSave: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        background: WHITE,
        borderBottom: "1px solid #F1F3F4",
        padding: "16px 20px",
        cursor: "pointer",
        opacity: isRead ? 0.6 : 1,
      }}
    >
      {/* Top row: category + source */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontFamily: M, fontSize: 10, fontWeight: 500,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: WHITE, background: TEAL,
          padding: "2px 8px", borderRadius: 3,
        }}>
          {topicLabel(s.topic)}
        </span>
        <span style={{ fontFamily: M, fontSize: 11, color: T4, marginLeft: "auto" }}>
          {s.source_name}
        </span>
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: F, fontSize: 17, fontWeight: 600,
        color: T1, lineHeight: 1.4,
        margin: "0 0 6px",
      }}>
        {decodeHtml(s.title)}
      </div>

      {/* Summary, max 2 lines */}
      {s.short_summary && (
        <div style={{
          fontFamily: F, fontSize: 14, fontWeight: 400,
          color: T3, lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: 8,
        }}>
          {s.short_summary}
        </div>
      )}

      {/* Bottom row: time, save, view original */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: M, fontSize: 11, color: T4 }}>
          {fmtTimeAgo(s.published_at)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 0, display: "flex", alignItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill={isSaved ? TEAL : "none"} stroke={isSaved ? TEAL : T4} strokeWidth="1.5">
            <path d="M4 3h12v15l-6-4-6 4V3z" />
          </svg>
        </button>
        <a
          href={s.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: F, fontSize: 13, color: TEAL,
            textDecoration: "none", marginLeft: "auto",
          }}
        >
          View original
        </a>
      </div>
    </div>
  );
}

function UpgradeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();

  // Refresh JWT after successful Stripe checkout so the paywall and trial banner
  // pick up the new subscription_status without waiting for session expiry.
  useEffect(() => {
    if (searchParams?.get("upgraded") === "true") {
      update();
      router.replace("/platform/feed", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function FeedPage() {
  const router = useRouter();

  const [read, setRead] = useState<Set<string>>(() => loadReadSet());
  const [saved, setSaved] = useState<Set<string>>(() => loadSavedSet());
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/stories?limit=50")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((d) => {
        setStories(d.stories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const LEAD = stories.slice(0, 6);
  const COMPACT = stories.slice(6);
  const totalCount = stories.length;

  const unread = stories.filter((s) => !read.has(s.id)).length;

  const markRead = (id: string) => {
    if (read.has(id)) return;
    const next = new Set(read).add(id);
    setRead(next);
    saveReadSet(next);
  };
  const markAll = () => {
    const next = new Set([...read, ...stories.map((s) => s.id)]);
    setRead(next);
    saveReadSet(next);
  };

  const toggleSave = (id: string) => {
    const next = new Set(saved);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSaved(next);
    saveSavedSet(next);
  };

  const isRead = (id: string) => read.has(id);

  if (loading) {
    return (
      <div style={{ padding: "16px 24px 40px" }}>
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>Loading feed...</div>
      </div>
    );
  }

  const lead = LEAD[0];

  return (
    <>
      <Suspense fallback={null}>
        <UpgradeHandler />
      </Suspense>
      <style>{`
        .feed-mobile { display: none; }
        .feed-card:hover { border-color: #B0B8C1 !important; background: #FAFBFC !important; }
        .feed-row:hover { background: #FAFBFC !important; }
        @media (max-width: 768px) {
          .feed-desktop { display: none !important; }
          .feed-mobile { display: block !important; }
        }
      `}</style>

      {/* ── Desktop feed (unchanged) ── */}
      <div className="feed-desktop" style={{ padding: "16px 24px 40px" }}>
        {/* Feed header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, animation: unread > 0 ? "pulse 2.2s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T1, letterSpacing: "-.01em" }}>What you&apos;ve missed</span>
            <span style={{ color: BORDER }}>&middot;</span>
            {unread > 0 ? (
              <span style={{ fontSize: 13, color: T4 }}>{unread} unread</span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: TEAL }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
                All caught up
              </span>
            )}
          </div>
          <span onClick={markAll} style={{ fontSize: 12, fontWeight: 500, color: TEAL, cursor: "pointer", opacity: .65, marginLeft: "auto" }}>Mark all read</span>
        </div>

        {/* Lead story card */}
        {lead && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 12, display: "grid", gridTemplateColumns: "3fr 2fr" }}>
            <div onClick={() => { markRead(lead.id); router.push(`/platform/story/${lead.id}`); }} style={{ padding: "26px 30px", borderRight: `1px solid ${BLT}`, cursor: "pointer", opacity: isRead(lead.id) ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {!isRead(lead.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
                {isRead(lead.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{topicLabel(lead.topic)}</span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.28, letterSpacing: "-.025em", color: T1, marginBottom: 10 }}>{decodeHtml(lead.title)}</div>
              {lead.short_summary && <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 14 }}>{lead.short_summary}</div>}
              <Src name={lead.source_name} t1={isPro(lead)} link={lead.link} />
            </div>
            <div>
              {LEAD.slice(1, 3).map((s, i) => (
                <div className="feed-row" key={s.id} onClick={(e) => { e.stopPropagation(); markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ padding: "18px 22px", borderBottom: i === 0 ? `1px solid ${BLT}` : "none", cursor: "pointer", opacity: isRead(s.id) ? 0.55 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
                    {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{topicLabel(s.topic)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-.01em", color: T1, marginBottom: 6, marginTop: 3 }}>{decodeHtml(s.title)}</div>
                  <Src name={s.source_name} t1={isPro(s)} link={s.link} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Three column grid */}
        {LEAD.length > 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {LEAD.slice(3, 6).map(s => (
              <div className="feed-card" key={s.id} onClick={() => { markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all .15s", opacity: isRead(s.id) ? 0.55 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
                  {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{topicLabel(s.topic)}</span>
                  <span style={{ fontSize: 11, color: T4, fontWeight: 400 }}>{fmtTimeAgo(s.published_at)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-.01em", color: T1, marginBottom: 8, marginTop: 4 }}>{decodeHtml(s.title)}</div>
                {s.short_summary && <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.65, color: T3, marginBottom: 9 }}>{s.short_summary}</div>}
                <Src name={s.source_name} t1={isPro(s)} link={s.link} />
              </div>
            ))}
          </div>
        )}

        {/* Compact list */}
        {COMPACT.length > 0 && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 22px", borderBottom: `1px solid ${BLT}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T2 }}>More from Tideline</span>
              <span style={{ fontSize: 12, color: T4 }}>{totalCount} stories</span>
            </div>
            {COMPACT.map(s => (
              <div className="feed-row" key={s.id} onClick={() => { markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 22px", borderBottom: `1px solid ${BLT}`, cursor: "pointer", transition: "background .1s", opacity: isRead(s.id) ? 0.45 : 1 }}>
                {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>New</span>}
                {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>Viewed</span>}
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T4, flexShrink: 0, minWidth: 84 }}>{topicLabel(s.topic)}</span>
                <span style={{ fontSize: 13, color: T1, flex: 1, lineHeight: 1.35 }}>{decodeHtml(s.title)}</span>
                <Src name={s.source_name} t1={isPro(s)} link={s.link} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile feed ── */}
      <div className="feed-mobile" style={{ background: WHITE, paddingBottom: 120 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, flexShrink: 0, animation: unread > 0 ? "pulse 2.2s ease-in-out infinite" : "none" }} />
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T1 }}>What you&apos;ve missed</span>
          {unread > 0 && (
            <span style={{ fontFamily: F, fontSize: 13, color: T4, marginLeft: 4 }}>{unread} unread</span>
          )}
          <span onClick={markAll} style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: TEAL, cursor: "pointer", opacity: .65, marginLeft: "auto" }}>Mark all read</span>
        </div>

        {/* All stories as mobile cards */}
        {stories.map(s => (
          <MobileStoryCard
            key={s.id}
            s={s}
            isRead={read.has(s.id)}
            isSaved={saved.has(s.id)}
            onTap={() => { markRead(s.id); router.push(`/platform/story/${s.id}`); }}
            onSave={() => toggleSave(s.id)}
          />
        ))}
      </div>
    </>
  );
}
