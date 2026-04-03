"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import LinkedInDraftPanel from "@/components/LinkedInDraftPanel";

// ── Design tokens (match layout.tsx) ─────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const NAVY   = "#0A1628";
const TEAL   = "#1D9E75";
const RED    = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

const SRC_COLORS: Record<string, { bg: string; color: string }> = {
  gov:   { bg: "#dbeafe", color: "#1e40af" },
  reg:   { bg: "#fee2e2", color: "#991b1b" },
  ngo:   { bg: "#dcfce7", color: "#166534" },
  res:   { bg: "#f3e8ff", color: "#6b21a8" },
  media: { bg: "#fef3c7", color: "#78350f" },
  esg:   { bg: "#ccfbf1", color: "#134e4a" },
};

const TOPIC_LABELS: Record<string, string> = {
  governance: "Governance", dsm: "Deep-Sea Mining", bluefinance: "Blue Finance",
  climate: "Climate", iuu: "IUU Fishing", mpa: "30x30", fisheries: "Fisheries",
  science: "Science", acidification: "Climate", technology: "Technology", all: "Ocean",
};

const PROJECTS = ["ISA Deep-Sea Watch", "BBNJ Implementation"];

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

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtRelative(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return fmtDate(iso);
}

// ── Save to library ──────────────────────────────────────────────────────
const btnStyle = {
  display: "inline-flex" as const, alignItems: "center" as const, gap: 6,
  fontSize: 12, fontWeight: 500, fontFamily: F,
  background: WHITE, borderRadius: 8, padding: "6px 12px",
};

function SaveToLibrary({ storyId }: { storyId: string }) {
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (saved) return;
    setSaved(true);
    fetch("/api/stories/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_id: storyId, project_name: "library" }),
    }).catch(() => {});
  };

  return (
    <button onClick={save} style={{
      ...btnStyle,
      color: saved ? TEAL : T3,
      border: `1.5px solid ${saved ? "rgba(29,158,117,.3)" : BORDER}`,
      cursor: saved ? "default" : "pointer",
    }}>
      {saved ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill={TEAL} stroke="none"><path d="M3 2h8v11l-4-2.5L3 13V2z"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2h8v11l-4-2.5L3 13V2z"/></svg>
      )}
      {saved ? "Saved" : "Save to library"}
    </button>
  );
}

// ── Save to project ─────────────────────────────────────────────────────
function SaveToProject({ storyId }: { storyId: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const save = (project: string) => {
    setSaved(true);
    setSavedTo(project);
    setOpen(false);
    fetch("/api/stories/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_id: storyId, project_name: project }),
    }).catch(() => {});
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { if (saved) return; setOpen(!open); }}
        style={{
          ...btnStyle,
          color: saved ? TEAL : T3,
          border: `1.5px solid ${saved ? "rgba(29,158,117,.3)" : BORDER}`,
          cursor: saved ? "default" : "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={saved ? TEAL : "currentColor"} strokeWidth="1.3"><rect x="2" y="2" width="10" height="10" rx="2"/><path d="M5 7h4M7 5v4" strokeLinecap="round"/></svg>
        {saved ? `Saved to ${savedTo}` : "Save to project"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, width: 220,
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 50, overflow: "hidden",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, padding: "10px 14px 6px" }}>Projects</div>
          {PROJECTS.map(p => (
            <button key={p} onClick={() => save(p)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "8px 14px",
              fontSize: 13, color: T1, background: "none", border: "none",
              cursor: "pointer", fontFamily: F,
            }}>
              {p}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${BLT}` }}>
            <button onClick={() => save("New project")} style={{
              display: "flex", alignItems: "center", gap: 6, width: "100%",
              textAlign: "left", padding: "8px 14px", fontSize: 13, color: TEAL,
              background: "none", border: "none", cursor: "pointer", fontFamily: F,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M6 1v10M1 6h10" strokeLinecap="round"/></svg>
              New project...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comment ──────────────────────────────────────────────────────────────
interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_email?: string;
}

function ExpertContext({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/comments?story_id=${storyId}`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments || []))
      .catch(() => {});
  }, [storyId]);

  const submit = () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    fetch("/api/stories/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ story_id: storyId, comment: draft.trim() }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.comment) setComments(prev => [d.comment, ...prev]);
        setDraft("");
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>
        Got context to add?
      </div>
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Got the inside track? Share what this means for the sector — visible to other Tideline subscribers."
          rows={3}
          style={{
            width: "100%", resize: "vertical", border: `1px solid ${BLT}`,
            borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.6,
            color: T1, fontFamily: F, background: BG, outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={submit}
            disabled={!draft.trim() || submitting}
            style={{
              fontSize: 12, fontWeight: 600, fontFamily: F,
              color: "#fff", background: draft.trim() ? TEAL : T4,
              border: "none", borderRadius: 8, padding: "7px 16px",
              cursor: draft.trim() ? "pointer" : "default", opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {comments.map(c => {
            const initial = (c.user_email || "U")[0].toUpperCase();
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: `1px solid ${BLT}` }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: NAVY,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: T1, marginBottom: 4 }}>{c.comment}</div>
                  <div style={{ fontSize: 11, color: T4 }}>{fmtRelative(c.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── LinkedIn draft ───────────────────────────────────────────────────────
function LinkedInDraft({ storyId }: { storyId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postText, setPostText] = useState("");
  const generate = async () => {
    setOpen(true);
    if (postText) return;
    setLoading(true);
    try {
      const r = await fetch("/api/story/linkedin-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId }),
      });
      const d = await r.json();
      if (d.post_text) setPostText(d.post_text);
    } catch {}
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={generate}
        style={{
          ...btnStyle,
          color: open ? TEAL : T3,
          border: `1.5px solid ${open ? "rgba(29,158,117,.3)" : BORDER}`,
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={open ? TEAL : "currentColor"} strokeWidth="1.3">
          <rect x="1.5" y="1.5" width="11" height="11" rx="2" />
          <path d="M4.5 6V9.5M4.5 4.2v.1" strokeLinecap="round" />
          <path d="M6.5 9.5V6.8c0-.7.5-1 1-1s1 .3 1 1V9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Draft LinkedIn post
      </button>

      {open && (
        <LinkedInDraftPanel
          postText={postText}
          onChange={setPostText}
          loading={loading}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [story, setStory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [shortSummary, setShortSummary] = useState<string | null>(null);
  const [fullSummary, setFullSummary] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/stories?id=${id}`)
      .then(r => r.json())
      .then(data => {
        const s = data.story || (data.stories && data.stories[0]);
        if (!s) return;
        setStory(s);
        setLoading(false);
        if (s.short_summary) setShortSummary(s.short_summary);
        if (s.full_summary) setFullSummary(s.full_summary);

        // Related: same topic, exclude current, only summarised
        fetch(`/api/stories?topic=${s.topic}&limit=5`)
          .then(r => r.json())
          .then(d => setRelated(
            (d.stories || [])
              .filter((r: any) => r.id !== id)
              .slice(0, 4)
          ));

        if (!s.short_summary) {
          setGenerating(true);
          fetch("/api/summarise", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId: id }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.short_summary) setShortSummary(d.short_summary);
              if (d.full_summary) setFullSummary(d.full_summary);
            })
            .finally(() => setGenerating(false));
        }
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "16px 24px 40px" }}>
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div style={{ padding: "16px 24px 40px" }}>
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>Story not found.</div>
      </div>
    );
  }

  const sc = SRC_COLORS[story.source_type] || SRC_COLORS.media;
  const topicTag = TOPIC_LABELS[story.topic] || story.topic;
  const isPro = story.is_pro || story.source_type === "gov" || story.source_type === "reg";

  return (
    <div style={{ padding: "16px 24px 40px", maxWidth: 720 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/platform/feed")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 500, color: T4, background: "none",
          border: "none", cursor: "pointer", fontFamily: F,
          padding: 0, marginBottom: 20,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 7H2M2 7l4-4M2 7l4 4" />
        </svg>
        Back to feed
      </button>

      {/* Main card */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "26px 28px", marginBottom: 16 }}>
        {/* Byline row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: sc.bg, color: sc.color, borderRadius: 4 }}>{story.source_name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: T4, background: BG, borderRadius: 4, padding: "2px 8px" }}>{story.source_type}</span>
          {isPro && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: TEAL, background: "rgba(29,158,117,.1)", borderRadius: 4, padding: "2px 7px" }}>Tier 1</span>}
          <span style={{ fontSize: 12, color: T4 }}>{fmtDate(story.published_at)}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <SaveToLibrary storyId={id} />
            <SaveToProject storyId={id} />
            <LinkedInDraft storyId={id} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-.025em", color: T1, marginBottom: 16, margin: 0 }}>
          {decodeHtml(story.title)}
        </h1>

        {/* Tracker tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14, marginBottom: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", border: `1px solid rgba(29,158,117,.22)`, borderRadius: 4, padding: "3px 9px", color: TEAL, background: "rgba(255,255,255,.7)" }}>{topicTag}</span>
          {story.alert_type && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", background: "rgba(217,48,37,.1)", borderRadius: 4, padding: "3px 9px", color: RED }}>{story.alert_type.replace("_", " ")}</span>
          )}
        </div>
      </div>

      {/* Tideline brief */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: TEAL, marginBottom: 10 }}>
          Tideline brief
        </div>
        <div style={{
          background: WHITE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}`,
          borderRadius: 12, padding: "22px 24px",
        }}>
          {generating && !shortSummary ? (
            <div style={{ fontSize: 13, color: T4, lineHeight: 1.6 }}>Generating brief...</div>
          ) : shortSummary ? (
            <>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: T1, fontFamily: F, margin: 0 }}>
                {shortSummary}
              </p>
              {fullSummary && (
                <>
                  {expanded && (
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: T2, fontFamily: F, margin: 0, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${BLT}` }}>
                      {fullSummary}
                    </p>
                  )}
                  <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: TEAL, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, padding: 0, marginTop: 14 }}>
                    {expanded ? "Show less" : "Read full analysis"}
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: T4, lineHeight: 1.6 }}>Summary pending. Check back shortly.</div>
          )}
        </div>
      </div>

      {/* Original source */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 6 }}>Primary source</div>
          <span style={{ fontSize: 13, color: T3 }}>{story.source_name}</span>
        </div>
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", border: `1.5px solid ${BORDER}`, background: WHITE,
            borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 500,
            color: T1, fontFamily: F,
          }}
        >
          View original {"\u2197"}
        </a>
      </div>

      {/* Expert context */}
      <div style={{ marginBottom: 16 }}>
        <ExpertContext storyId={id} />
      </div>

      {/* Related stories */}
      {related.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T4, marginBottom: 12 }}>Related stories</div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            {related.map((r, i) => {
              const rSc = SRC_COLORS[r.source_type] || SRC_COLORS.media;
              return (
                <a
                  key={r.id}
                  href={`/platform/story/${r.id}`}
                  style={{ display: "block", padding: "14px 20px", borderBottom: i < related.length - 1 ? `1px solid ${BLT}` : "none", textDecoration: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", background: rSc.bg, color: rSc.color, borderRadius: 3 }}>{r.source_name}</span>
                    <span style={{ fontSize: 11, color: T4 }}>{fmtDate(r.published_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T1, lineHeight: 1.4 }}>{decodeHtml(r.title)}</div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
