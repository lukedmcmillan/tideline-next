"use client";

import { useState } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = "#0B1628";
const SURFACE   = "#112236";
const BORDER    = "rgba(255,255,255,0.08)";
const TEXT      = "#F5F7FA";
const SECONDARY = "rgba(255,255,255,0.65)";
const MUTED     = "rgba(255,255,255,0.35)";
const TEAL      = "#1D9E75";
const SEL_BG    = "rgba(29,158,117,0.14)";
const F         = "'DM Sans', sans-serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RatingItem { id: string; label: string; }

interface QuestionDef {
  id: string;
  type: "single" | "single_with_other" | "multi" | "multi_with_other"
      | "rating_matrix" | "single_plus_text" | "text" | "early_access";
  question: string;
  options?: string[];
  items?: RatingItem[];
  helper?: string;
  placeholder?: string;
  followUpLabel?: string;
  followUpPlaceholder?: string;
}

// ── Questions ─────────────────────────────────────────────────────────────────
const QUESTIONS: QuestionDef[] = [
  {
    id: "role",
    type: "single_with_other",
    question: "What is your primary role?",
    options: [
      "Finance & investment",
      "ESG / sustainability",
      "Shipping & maritime compliance",
      "Policy & regulation",
      "NGO / conservation",
      "Marine / ocean researcher",
      "Media & journalism",
      "Consulting",
      "Other",
    ],
  },
  {
    id: "procurement",
    type: "single",
    question: "If you used Tideline, how would you most likely pay for it?",
    options: [
      "Personal subscription (my own money)",
      "Expense it through work",
      "Procure it for my team or organisation",
      "Not sure yet",
    ],
  },
  {
    id: "time_spent",
    type: "single",
    question: "How much time per week do you spend tracking ocean regulatory and blue finance developments?",
    options: ["Under 1 hour", "1\u20133 hours", "3\u20135 hours", "5+ hours"],
  },
  {
    id: "current_sources",
    type: "multi",
    question: "How do you currently stay on top of ocean developments?",
    helper: "Select all that apply",
    options: [
      "Google Alerts",
      "Industry newsletters",
      "LinkedIn",
      "Academic journals",
      "Word of mouth",
      "Manually checking multiple sites",
      "Specialist intelligence platforms (RepRisk, Bloomberg, Refinitiv etc)",
      "I don\u2019t have a good system: it\u2019s a real problem",
    ],
  },
  {
    id: "hardest_to_track",
    type: "multi",
    question: "What is hardest to keep on top of?",
    helper: "Select all that apply",
    options: [
      "Regulatory & policy changes",
      "Treaty negotiations and ratifications",
      "New research and science",
      "Blue finance and investment activity",
      "IUU fishing and enforcement actions",
      "Industry news and deals",
      "Who said what and when: actor positions and statements",
      "Deep sea mining developments",
      "Offshore wind regulatory changes",
    ],
  },
  {
    id: "biggest_pain",
    type: "single",
    question: "What is the single biggest information gap in your working week?",
    options: [
      "Hard to track how a story or regulation evolves over time",
      "Difficult to find citable sources quickly",
      "Spending too long searching across too many sources",
      "No single place that covers everything I need",
      "Finding out about things too late",
      "Can\u2019t track what specific entities have committed to vs what they\u2019re actually doing",
    ],
  },
  {
    id: "q7_ratings",
    type: "rating_matrix",
    question: "How valuable would each of these be to your work?",
    helper: "Rate from 1 (not valuable) to 5 (extremely valuable). Skip any that don\u2019t apply.",
    items: [
      { id: "val_daily_brief",        label: "Daily curated ocean intelligence brief" },
      { id: "val_live_feed",          label: "Live news feed with AI summaries" },
      { id: "val_regulatory_tracker", label: "Regulatory tracker with momentum scores" },
      { id: "val_workspace",          label: "Workspace to save and organise research" },
      { id: "val_meeting_prep",       label: "Meeting prep tool with citable sources" },
      { id: "val_entity_alerts",      label: "Entity alerts: track specific organisations, governments, or individuals" },
      { id: "val_contradiction",      label: "Contradiction detection: when two authoritative sources say different things about the same event" },
      { id: "val_commitment_tracker", label: "Commitment tracker: what an entity promised vs what the regulatory environment shows" },
      { id: "val_risk_reports",       label: "Exportable risk assessment reports" },
      { id: "val_embed_widget",       label: "Embeddable intelligence widget for your organisation\u2019s platform" },
      { id: "val_ai_drafting",        label: "AI-drafted briefing documents and LinkedIn posts" },
    ],
  },
  {
    id: "entity_tracking_value",
    type: "single_plus_text",
    question: "How valuable would it be to track specific entities and receive alerts when they appear in new stories, change their stated positions, or make new commitments?",
    options: [
      "Very valuable: I would use this daily",
      "Useful: I would check it regularly",
      "Possibly useful",
      "Not relevant to my work",
    ],
    followUpLabel: "Which specific entities would you most want to track?",
    followUpPlaceholder: "e.g. ISA, specific flag states, blue bond issuers, TNFD, named investment funds",
  },
  {
    id: "output_format",
    type: "single",
    question: "Which output format would be most useful to your day-to-day work?",
    options: [
      "Daily brief in my inbox",
      "Weekly digest: less frequent, more substantial",
      "Structured risk assessment per entity or topic",
      "Exportable report I can drop into my own documents",
      "Embeddable feed on my organisation\u2019s platform",
      "Real-time alerts only: no digest",
    ],
  },
  {
    id: "existing_tools",
    type: "multi_with_other",
    question: "What tools do you currently use to track ocean regulatory or blue finance developments?",
    helper: "Select all that apply",
    options: [
      "RepRisk",
      "Bloomberg ESG",
      "Refinitiv / LSEG",
      "MSCI ESG",
      "Sustainalytics",
      "Google Alerts",
      "Newsletters and RSS feeds",
      "Nothing formal",
      "Other",
    ],
  },
  {
    id: "contact_directory_value",
    type: "single",
    question: "How valuable would access to direct contact details for key regulatory actors be to your work?",
    helper: "Treaty body delegates, flag state officials, ISA Council members, compliance officers",
    options: [
      "Very valuable: I regularly need to contact these people",
      "Useful: I occasionally need to find the right person",
      "Possibly useful",
      "Not relevant to my work",
    ],
  },
  {
    id: "team_size",
    type: "single",
    question: "How many people in your organisation would benefit from this intelligence?",
    options: ["Just me", "2\u20135 people", "6\u201315 people", "16\u201350 people", "50+ people"],
  },
  {
    id: "willingness_to_pay",
    type: "single",
    question: "If Tideline delivered exactly the intelligence you needed, what would you be willing to pay?",
    options: [
      "I wouldn\u2019t pay for this",
      "\u00A320\u201350 per month",
      "\u00A350\u2013100 per month",
      "\u00A3100\u2013150 per month",
      "\u00A3150\u2013250 per month",
      "\u00A3250+ per month",
      "Our organisation would pay for a team licence: pricing depends on seats",
    ],
  },
  {
    id: "missing_coverage",
    type: "text",
    question: "What would you want Tideline to cover that you currently cannot find anywhere?",
    placeholder: "Anything goes: the more specific the better",
  },
  {
    id: "early_access",
    type: "early_access",
    question: "Want to be part of what comes next?",
  },
];

const TOTAL = QUESTIONS.length; // 15

// ── Responsive CSS ────────────────────────────────────────────────────────────
const MOBILE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
@media (max-width: 520px) {
  .survey-body { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-header { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-intro { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-nav { flex-direction: column-reverse !important; gap: 12px !important; }
  .survey-nav button { width: 100% !important; }
  .survey-intro-footer { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
  .survey-intro-footer button { width: 100% !important; }
  .rating-row { flex-wrap: wrap !important; }
  .rating-label { width: 100% !important; }
}
`;

// ── Intro screen ──────────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F }}>
      <style>{MOBILE_CSS}</style>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
        <span style={{ color: TEXT, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>Tideline</span>
        <span style={{ color: BORDER, fontSize: 14, margin: "0 4px" }}>&middot;</span>
        <span style={{ color: MUTED, fontSize: 13 }}>Ocean Intelligence</span>
      </div>
      <div className="survey-intro" style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px 80px" }}>
        <p style={{ color: MUTED, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
          Market research survey
        </p>
        <h1 style={{ color: TEXT, fontSize: 28, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.5px", marginBottom: 24 }}>
          Tideline: Ocean Intelligence
        </h1>
        <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.75, marginBottom: 40 }}>
          Tideline tracks ocean regulatory developments, treaty negotiations, blue finance activity, and enforcement actions for professionals in ESG, sustainable finance, shipping, and ocean policy. This survey helps us understand what intelligence professionals in this space need most. Takes 4 minutes.
        </p>
        <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: 32 }} />
        <div className="survey-intro-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const }}>
            {["15 questions", "4 minutes", "Anonymous"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL }} />
                <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={onStart} style={{ background: TEAL, border: "none", borderRadius: 4, padding: "0 28px", height: 40, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: F, flexShrink: 0 }}>
            Start survey
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SurveyPage() {
  const [started, setStarted]       = useState(false);
  const [answers, setAnswers]       = useState<Record<string, any>>({});
  const [current, setCurrent]       = useState(0);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!started) return <Intro onStart={() => setStarted(true)} />;

  const q        = QUESTIONS[current];
  const progress = ((current + 1) / TOTAL) * 100;

  function handleSingle(id: string, val: string) {
    setAnswers((a) => ({ ...a, [id]: val }));
  }
  function handleMulti(id: string, val: string) {
    setAnswers((a) => {
      const prev: string[] = a[id] || [];
      return { ...a, [id]: prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val] };
    });
  }

  function canAdvance(): boolean {
    if (q.type === "text" || q.type === "rating_matrix" || q.type === "early_access") return true;
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === "multi" || q.type === "multi_with_other") {
      return Array.isArray(ans) && ans.length > 0;
    }
    if (q.type === "single_with_other") {
      if (!ans.value) return false;
      if (ans.value === "Other") return (ans.other || "").trim().length > 0;
      return true;
    }
    return true; // single, single_plus_text
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/survey-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
    } catch {}
    setSubmitted(true);
  }

  // ── Thank you ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
        <style>{MOBILE_CSS}</style>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ color: MUTED, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Response recorded</p>
          <h2 style={{ color: TEXT, fontSize: 22, fontWeight: 500, marginBottom: 12, letterSpacing: "-0.3px" }}>Thank you for your time.</h2>
          <p style={{ color: SECONDARY, fontSize: 14, lineHeight: 1.65 }}>Your input shapes what Tideline becomes. We will be in touch as the platform develops.</p>
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
            <p style={{ color: MUTED, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tideline &middot; Ocean Intelligence</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F }}>
      <style>{MOBILE_CSS}</style>

      {/* Progress bar */}
      <div style={{ height: 3, background: BORDER, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: TEAL, transition: "width 0.35s ease" }} />
      </div>

      {/* Header */}
      <div className="survey-header" style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>Tideline</span>
          <span style={{ color: BORDER, fontSize: 14, margin: "0 4px" }}>&middot;</span>
          <span style={{ color: MUTED, fontSize: 13 }}>Ocean Intelligence</span>
        </div>
        <span style={{ color: MUTED, fontSize: 13, flexShrink: 0 }}>{current + 1} / {TOTAL}</span>
      </div>

      {/* Body */}
      <div className="survey-body" style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>

        <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 500, lineHeight: 1.4, marginBottom: q.helper ? 8 : 28, letterSpacing: "-0.3px" }}>
          {q.question}
        </h2>
        {q.helper && <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>{q.helper}</p>}

        {/* single_with_other */}
        {q.type === "single_with_other" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const sel = answers[q.id]?.value === opt;
              return (
                <div key={opt}>
                  <div
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: { value: opt, other: "" } }))}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: sel ? SEL_BG : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                    onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? TEAL : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />}
                    </span>
                    <span style={{ color: sel ? TEXT : SECONDARY, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{opt}</span>
                  </div>
                  {sel && opt === "Other" && (
                    <div style={{ paddingLeft: 48, paddingRight: 16, paddingBottom: 8 }}>
                      <input autoFocus placeholder="Please describe your role"
                        value={answers[q.id]?.other || ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { value: "Other", other: e.target.value } }))}
                        style={{ width: "100%", border: "none", borderBottom: `2px solid ${TEAL}`, padding: "4px 0", color: TEXT, fontSize: 15, fontFamily: F, outline: "none", background: "transparent" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* single */}
        {q.type === "single" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const sel = answers[q.id] === opt;
              return (
                <div key={opt}
                  onClick={() => handleSingle(q.id, opt)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: sel ? SEL_BG : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? TEAL : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />}
                  </span>
                  <span style={{ color: sel ? TEXT : SECONDARY, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* multi */}
        {q.type === "multi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const sel = (answers[q.id] || []).includes(opt);
              return (
                <div key={opt}
                  onClick={() => handleMulti(q.id, opt)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: sel ? SEL_BG : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${sel ? TEAL : BORDER}`, background: sel ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s" }}>
                    {sel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span style={{ color: sel ? TEXT : SECONDARY, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* multi_with_other */}
        {q.type === "multi_with_other" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const sel = (answers[q.id] || []).includes(opt);
              return (
                <div key={opt}>
                  <div
                    onClick={() => handleMulti(q.id, opt)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: sel ? SEL_BG : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                    onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${sel ? TEAL : BORDER}`, background: sel ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s" }}>
                      {sel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <span style={{ color: sel ? TEXT : SECONDARY, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{opt}</span>
                  </div>
                  {sel && opt === "Other" && (
                    <div style={{ paddingLeft: 48, paddingRight: 16, paddingBottom: 8 }}>
                      <input autoFocus placeholder="Please describe"
                        value={answers.existing_tools_other || ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, existing_tools_other: e.target.value }))}
                        style={{ width: "100%", border: "none", borderBottom: `2px solid ${TEAL}`, padding: "4px 0", color: TEXT, fontSize: 15, fontFamily: F, outline: "none", background: "transparent" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* rating_matrix */}
        {q.type === "rating_matrix" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ width: 32, textAlign: "center", color: MUTED, fontSize: 11, fontWeight: 600 }}>{n}</span>
                ))}
              </div>
            </div>
            {(q.items || []).map((item) => {
              const sel = answers[item.id];
              return (
                <div key={item.id} className="rating-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${BORDER}`, gap: 12 }}>
                  <span className="rating-label" style={{ color: SECONDARY, fontSize: 14, lineHeight: 1.4, flex: 1 }}>{item.label}</span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = sel === n;
                      return (
                        <button key={n}
                          onClick={() => setAnswers((a) => ({ ...a, [item.id]: n }))}
                          style={{ width: 32, height: 32, background: active ? TEAL : "transparent", border: `1px solid ${active ? TEAL : BORDER}`, borderRadius: 4, color: active ? "#fff" : MUTED, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all 0.1s" }}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: `1px solid ${BORDER}` }} />
          </div>
        )}

        {/* single_plus_text */}
        {q.type === "single_plus_text" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 28 }}>
              {(q.options || []).map((opt) => {
                const sel = answers[q.id] === opt;
                return (
                  <div key={opt}
                    onClick={() => handleSingle(q.id, opt)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: sel ? SEL_BG : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                    onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? TEAL : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />}
                    </span>
                    <span style={{ color: sel ? TEXT : SECONDARY, fontSize: 14, fontWeight: sel ? 500 : 400 }}>{opt}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 500, marginBottom: 10 }}>{q.followUpLabel}</p>
              <textarea
                placeholder={q.followUpPlaceholder}
                value={answers.entity_tracking_open || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, entity_tracking_open: e.target.value }))}
                rows={3}
                style={{ width: "100%", border: "none", borderBottom: `2px solid ${BORDER}`, background: "transparent", color: TEXT, fontSize: 15, fontFamily: F, resize: "none", outline: "none", padding: "8px 0", lineHeight: 1.6, boxSizing: "border-box" as const }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderBottomColor = TEAL; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderBottomColor = BORDER; }}
              />
            </div>
          </div>
        )}

        {/* text */}
        {q.type === "text" && (
          <textarea
            placeholder={q.placeholder}
            value={answers[q.id] || ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            rows={4}
            style={{ width: "100%", border: "none", borderBottom: `2px solid ${BORDER}`, background: "transparent", color: TEXT, fontSize: 15, fontFamily: F, resize: "none", outline: "none", padding: "8px 0", lineHeight: 1.6, boxSizing: "border-box" as const }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderBottomColor = TEAL; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderBottomColor = BORDER; }}
          />
        )}

        {/* early_access */}
        {q.type === "early_access" && (
          <div>
            <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
              If you would like early access to Tideline or want to be considered for a founding member rate when we launch, leave your email below. Founding members get lifetime access at a locked-in rate. No spam. We will only reach out when it matters.
            </p>
            <div style={{ marginBottom: 28 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={answers.email_provided || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, email_provided: e.target.value }))}
                style={{ width: "100%", border: "none", borderBottom: `2px solid ${BORDER}`, background: "transparent", color: TEXT, fontSize: 16, fontFamily: F, padding: "8px 0", outline: "none", boxSizing: "border-box" as const }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = TEAL; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = BORDER; }}
              />
              <p style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>Optional</p>
            </div>
            {[
              { key: "wants_early_access",    label: "I would like to be part of a small group of early testers" },
              { key: "wants_founding_member", label: "I am interested in a founding member rate when Tideline launches" },
              { key: "wants_updates",         label: "Keep me updated on progress" },
            ].map(({ key, label }) => {
              const checked = answers[key] === true;
              return (
                <div key={key}
                  onClick={() => setAnswers((a) => ({ ...a, [key]: !a[key] }))}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${checked ? TEAL : BORDER}`, background: checked ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s" }}>
                    {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span style={{ color: SECONDARY, fontSize: 14 }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="survey-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          {current > 0 ? (
            <button
              onClick={() => setCurrent((c) => c - 1)}
              style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 4, color: SECONDARY, fontSize: 14, cursor: "pointer", fontFamily: F, padding: "0 20px", height: 36 }}
            >
              Back
            </button>
          ) : <span />}

          {current < TOTAL - 1 ? (
            <button
              onClick={() => { if (canAdvance()) setCurrent((c) => c + 1); }}
              style={{ background: canAdvance() ? TEAL : SURFACE, border: `1px solid ${canAdvance() ? TEAL : BORDER}`, borderRadius: 4, padding: "0 24px", height: 36, color: canAdvance() ? "#fff" : MUTED, fontSize: 14, fontWeight: 500, cursor: canAdvance() ? "pointer" : "default", fontFamily: F, transition: "all 0.15s" }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: submitting ? SURFACE : TEAL, border: `1px solid ${submitting ? BORDER : TEAL}`, borderRadius: 4, padding: "0 24px", height: 36, color: submitting ? MUTED : "#fff", fontSize: 14, fontWeight: 500, cursor: submitting ? "default" : "pointer", fontFamily: F }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
