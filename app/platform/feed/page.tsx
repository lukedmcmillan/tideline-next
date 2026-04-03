"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LinkedInDraftPanel from "@/components/LinkedInDraftPanel";

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
    .replace(/&#8212;/g, "\u2014")
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

function DraftPostBtn({ storyId, onDraft }: { storyId: string; onDraft: (storyId: string) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onDraft(storyId); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 12, fontFamily: F, fontWeight: 400,
        color: T3, background: "none", border: "none",
        cursor: "pointer", padding: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0E7C86"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T3; }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="1.5" y="1.5" width="11" height="11" rx="2" />
        <path d="M4.5 6V9.5M4.5 4.2v.1" strokeLinecap="round" />
        <path d="M6.5 9.5V6.8c0-.7.5-1 1-1s1 .3 1 1V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Draft post
    </button>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [read, setRead] = useState<Set<string>>(() => loadReadSet());
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const handleDraft = async (storyId: string) => {
    setDraftOpen(true);
    setDraftText("");
    setDraftError(null);
    setDraftLoading(true);
    try {
      const r = await fetch("/api/story/linkedin-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId }),
      });
      const d = await r.json();
      if (d.post_text) setDraftText(d.post_text);
      else setDraftError("Could not generate post. Try again.");
    } catch {
      setDraftError("Could not generate post. Try again.");
    }
    setDraftLoading(false);
  };

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
    <div style={{ padding: "16px 24px 40px" }}>
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
        <div onClick={() => { markRead(lead.id); router.push(`/platform/story/${lead.id}`); }} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 12, display: "grid", gridTemplateColumns: "3fr 2fr", cursor: "pointer", opacity: isRead(lead.id) ? 0.55 : 1 }}>
          <div style={{ padding: "26px 30px", borderRight: `1px solid ${BLT}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {!isRead(lead.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
              {isRead(lead.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{topicLabel(lead.topic)}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.28, letterSpacing: "-.025em", color: T1, marginBottom: 10 }}>{decodeHtml(lead.title)}</div>
            {lead.short_summary && <div style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.75, color: T3, marginBottom: 14 }}>{lead.short_summary}</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Src name={lead.source_name} t1={isPro(lead)} link={lead.link} />
              <DraftPostBtn storyId={lead.id} onDraft={handleDraft} />
            </div>
          </div>
          <div>
            {LEAD.slice(1, 3).map((s, i) => (
              <div key={s.id} onClick={(e) => { e.stopPropagation(); markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ padding: "18px 22px", borderBottom: i === 0 ? `1px solid ${BLT}` : "none", opacity: isRead(s.id) ? 0.55 : 1 }}>
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
            <div key={s.id} onClick={() => { markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all .15s", opacity: isRead(s.id) ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px" }}>New</span>}
                {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px" }}>Viewed</span>}
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4 }}>{topicLabel(s.topic)}</span>
                <span style={{ fontSize: 11, color: TEAL, fontWeight: 600 }}>{fmtTime(s.published_at)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-.01em", color: T1, marginBottom: 8, marginTop: 4 }}>{decodeHtml(s.title)}</div>
              {s.short_summary && <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.65, color: T3, marginBottom: 9 }}>{s.short_summary}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Src name={s.source_name} t1={isPro(s)} link={s.link} />
                <DraftPostBtn storyId={s.id} onDraft={handleDraft} />
              </div>
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
            <div key={s.id} onClick={() => { markRead(s.id); router.push(`/platform/story/${s.id}`); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 22px", borderBottom: `1px solid ${BLT}`, cursor: "pointer", transition: "background .1s", opacity: isRead(s.id) ? 0.45 : 1 }}>
              {!isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#fff", background: TEAL, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>New</span>}
              {isRead(s.id) && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", color: T4, background: BLT, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>Viewed</span>}
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T4, flexShrink: 0, minWidth: 84 }}>{topicLabel(s.topic)}</span>
              <span style={{ fontSize: 13, color: T1, flex: 1, lineHeight: 1.35 }}>{decodeHtml(s.title)}</span>
              <Src name={s.source_name} t1={isPro(s)} link={s.link} />
            </div>
          ))}
        </div>
      )}

      {draftOpen && (
        <LinkedInDraftPanel
          postText={draftText}
          onChange={setDraftText}
          loading={draftLoading}
          onClose={() => setDraftOpen(false)}
          error={draftError}
        />
      )}
    </div>
  );
}
