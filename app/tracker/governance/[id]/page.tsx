"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

const SIG_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#fef2f2", text: RED },
  important: { bg: "#fffbeb", text: AMBER },
  routine: { bg: "#f8fafc", text: MUTED },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function EventDetail() {
  const params = useParams();
  const [event, setEvent] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/governance-events?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEvent(data.event || null);
        setDecisions(data.decisions || []);
        setRelated(data.related || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <p style={{ color: MUTED }}>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <p style={{ color: MUTED }}>Event not found.</p>
      </div>
    );
  }

  const body = event.governance_bodies;
  const sig = SIG_COLORS[event.significance] || SIG_COLORS.routine;

  return (
    <div style={{ fontFamily: SANS, color: NAVY, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
          <a href="/tracker/governance" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>← Back to calendar</a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {body && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 3, background: `${BLUE}15`, color: BLUE, fontFamily: SANS }}>
              {body.abbreviation}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 3, background: sig.bg, color: sig.text, fontFamily: SANS, textTransform: "capitalize" }}>
            {event.significance || "routine"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 3, background: "#f1f5f9", color: MUTED, fontFamily: SANS, textTransform: "capitalize" }}>
            {event.event_type}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 700, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 24 }}>
          {event.title}
        </h1>

        {/* Meta */}
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>Date</div>
              <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS }}>
                {formatDate(event.starts_at)}
                {event.ends_at && ` – ${formatDate(event.ends_at)}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>Location</div>
              <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS }}>{event.is_virtual ? "Virtual" : event.location || "TBC"}</div>
            </div>
            {body && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>Body</div>
                <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS }}>{body.name}</div>
              </div>
            )}
            {event.topics?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 4, fontFamily: SANS }}>Topics</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {event.topics.map((t: string) => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#f1f5f9", borderRadius: 3, color: MUTED, fontFamily: SANS }}>
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Significance */}
        {event.significance_reason && (
          <div style={{ background: sig.bg, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${sig.text}`, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: sig.text, marginBottom: 4, fontFamily: SANS }}>
              Why this matters
            </div>
            <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>{event.significance_reason}</div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 8, fontFamily: SANS }}>Description</div>
            <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS, lineHeight: 1.7 }}>{event.description}</div>
          </div>
        )}

        {/* Documents */}
        {(event.agenda_url || event.outcome_url) && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 12, fontFamily: SANS }}>Documents</div>
            {event.agenda_url && (
              <a href={event.agenda_url} target="_blank" rel="noopener" style={{ display: "block", fontSize: 14, color: BLUE, fontWeight: 600, fontFamily: SANS, marginBottom: 8, textDecoration: "none" }}>
                Agenda document →
              </a>
            )}
            {event.outcome_url && (
              <a href={event.outcome_url} target="_blank" rel="noopener" style={{ display: "block", fontSize: 14, color: BLUE, fontWeight: 600, fontFamily: SANS, textDecoration: "none" }}>
                Outcome document →
              </a>
            )}
          </div>
        )}

        {/* Expected Decisions */}
        {decisions.length > 0 && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 12, fontFamily: SANS }}>Expected Decisions</div>
            {decisions.map((d: any, i: number) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < decisions.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS, fontWeight: 500, marginBottom: 4 }}>{d.decision_description}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: "#f1f5f9", borderRadius: 3, color: MUTED, fontFamily: SANS }}>{d.decision_type}</span>
                  {d.expected_outcome && (
                    <span style={{ fontSize: 11, padding: "2px 8px", background: d.expected_outcome === "contested" ? "#fef3c7" : "#f1f5f9", borderRadius: 3, color: d.expected_outcome === "contested" ? AMBER : MUTED, fontFamily: SANS }}>
                      {d.expected_outcome.replace(/_/g, " ")}
                    </span>
                  )}
                  {d.resolved && (
                    <span style={{ fontSize: 11, padding: "2px 8px", background: `${TEAL}15`, borderRadius: 3, color: TEAL, fontFamily: SANS, fontWeight: 600 }}>
                      Resolved: {d.actual_outcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Related Events */}
        {related.length > 0 && (
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginBottom: 12, fontFamily: SANS }}>
              Related Events from {body?.abbreviation}
            </div>
            {related.map((r: any) => (
              <a key={r.id} href={`/tracker/governance/${r.id}`} style={{ display: "block", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
                <div style={{ fontSize: 14, color: NAVY, fontFamily: SANS, fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: MUTED, fontFamily: SANS, marginTop: 2 }}>
                  {new Date(r.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {r.significance && ` · ${r.significance}`}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
