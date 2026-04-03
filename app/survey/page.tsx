"use client";

import { useState } from "react";

const TEAL = "#0E7C86";
const TEXT = "#202124";
const SECONDARY = "#5F6368";
const MUTED = "#80868B";
const BORDER = "#E8EAED";
const SURFACE = "#F8F9FA";
const F = "'DM Sans', sans-serif";

interface QuestionDef {
  id: string;
  type: string;
  question: string;
  options?: string[];
  helper?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  sectionId: string;
}

const SECTIONS = [
  { id: "about_you", label: "About you", questions: [
    { id: "role", type: "single_with_other", question: "What\u2019s your role?", options: ["Marine / ocean researcher","Policy & regulation","NGO / conservation","Shipping & maritime","Aquaculture","Finance & investment","Consulting","Media & journalism","Other"] },
    { id: "procurement", type: "single", question: "If you used a platform like this, how would you pay for it?", options: ["Personal subscription \u2014 my own money","Expense it through work","Procure it for my team or organisation","Not sure yet"] },
    { id: "time_spent", type: "single", question: "How much time per week do you spend tracking ocean news, policy, and research?", options: ["Under 1 hour","1\u20133 hours","3\u20135 hours","5+ hours"] },
  ]},
  { id: "the_problem", label: "The problem", questions: [
    { id: "current_sources", type: "multi", helper: "Select all that apply", question: "How do you currently stay on top of ocean developments?", options: ["Google alerts","Industry newsletters","Academic journals","LinkedIn","Word of mouth","Manually checking multiple sites","I don\u2019t \u2014 it\u2019s a real problem"] },
    { id: "hardest_to_track", type: "multi", helper: "Select all that apply", question: "What\u2019s hardest to keep on top of?", options: ["Regulatory & policy changes","Treaty negotiations and ratifications","New research and science","Industry news and deals","IUU fishing and enforcement actions","Blue finance and investment activity","Who said what and when"] },
    { id: "biggest_pain", type: "single", question: "What\u2019s the single biggest information gap in your working week?", options: ["Finding out about things too late","Spending too long searching across too many sources","No single place that covers everything I need","Hard to track how a story or regulation evolves over time","Difficult to find citable sources quickly"] },
  ]},
  { id: "core_platform", label: "The core platform", questions: [
    { id: "feed_value", type: "scale", question: "A live feed aggregating press, policy documents, regulatory filings, and research papers \u2014 all in one place, updated in real time. How useful?", min: "Not useful", max: "Extremely useful" },
    { id: "brief_value", type: "scale", question: "A daily curated brief drawn from that feed \u2014 summarised, prioritised, delivered before 7am. How valuable?", min: "Not valuable", max: "Extremely valuable" },
    { id: "tracker_value", type: "scale", question: "Live trackers for specific issues \u2014 BBNJ Treaty ratification, ISA deep-sea mining decisions, 30x30 targets, IUU enforcement, Blue Finance flows. How useful?", min: "Not useful", max: "Extremely useful" },
  ]},
  { id: "intelligence_tools", label: "Intelligence tools", questions: [
    { id: "workspace_value", type: "scale", question: "A research workspace where you ask questions across policy documents, treaty text, and regulatory records \u2014 and get cited answers. How valuable?", min: "Not valuable", max: "Extremely valuable" },
    { id: "meeting_prep_value", type: "scale", question: "Meeting prep in 30 seconds \u2014 type who you\u2019re meeting, get a brief on their recent activity, regulatory context, and three questions to ask. How useful?", min: "Not useful", max: "Extremely useful" },
    { id: "entity_alerts_value", type: "scale", question: "Departure alerts \u2014 the moment an organisation or individual you\u2019re tracking appears in new coverage, you\u2019re notified and it\u2019s filed to your project automatically. How useful?", min: "Not useful", max: "Extremely useful" },
    { id: "contradiction_value", type: "single", question: "When two sources report conflicting information on the same development, Tideline flags it: \u2018Sources diverge on this.\u2019 Would you find that useful?", options: ["Yes \u2014 this would be very valuable","Possibly","No, I don\u2019t need that level of detail"] },
  ]},
  { id: "workflow_tools", label: "Workflow & output", questions: [
    { id: "report_value", type: "single", question: "Generating a structured briefing note or compliance report from your research \u2014 exportable as Word or PDF. Would you use this?", options: ["Yes, regularly","Occasionally","Probably not"] },
    { id: "linkedin_value", type: "single", question: "One-click LinkedIn post drafted from any story \u2014 professional tone, no hashtags, grounded in the source. Would you use this?", options: ["Yes, regularly","Occasionally","Probably not"] },
    { id: "calendar_value", type: "single", question: "A public ocean governance calendar \u2014 IMO MEPC, BBNJ sessions, ISA meetings, CBD COP dates \u2014 embeddable on any website. Useful?", options: ["Yes, I\u2019d use it personally","Yes, I\u2019d embed it on our site","Not really relevant to me"] },
    { id: "alerts_value", type: "single", question: "Keyword alerts \u2014 immediate notification when a topic you\u2019re tracking appears in the feed. Would you want this?", options: ["Yes, this would be very useful","Possibly","No, I don\u2019t need that level of detail"] },
  ]},
  { id: "pricing", label: "Pricing", questions: [
    { id: "price", type: "single", question: "If a platform covered all of this \u2014 live feed, daily brief, trackers, research workspace, meeting prep, alerts, departure alerts, report generation \u2014 what would feel like a fair monthly price?", options: ["\u00A350\u2013100","\u00A3100\u2013150","\u00A3150\u2013250","\u00A3250+","I wouldn\u2019t pay for this"] },
    { id: "missing", type: "text", question: "What would make this genuinely indispensable for your work \u2014 something you can\u2019t find anywhere right now?", placeholder: "Your answer" },
  ]},
];

const ALL_QUESTIONS: QuestionDef[] = SECTIONS.flatMap((s) => s.questions.map((q) => ({ ...q, sectionId: s.id })));
const TOTAL = ALL_QUESTIONS.length;

const MOBILE_CSS = `
@media (max-width: 480px) {
  .survey-body { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-intro { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-nav { flex-direction: column-reverse !important; gap: 12px !important; }
  .survey-nav button { width: 100% !important; }
  .survey-header { padding-left: 16px !important; padding-right: 16px !important; }
  .survey-intro-footer { flex-direction: column !important; align-items: flex-start !important; }
  .survey-intro-footer button { width: 100% !important; }
}
`;

// ── Intro screen ─────────────────────────────────────────────────────────
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');${MOBILE_CSS}`}</style>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
        <span style={{ color: TEXT, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px" }}>Tideline</span>
        <span style={{ color: BORDER, fontSize: 14, margin: "0 2px" }}>{"\u00B7"}</span>
        <span style={{ color: MUTED, fontSize: 13 }}>Ocean Intelligence</span>
      </div>
      <div className="survey-intro" style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px 80px" }}>
        <div style={{ borderLeft: `3px solid ${TEAL}`, paddingLeft: 20, marginBottom: 40 }}>
          <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.75, marginBottom: 12 }}>
            The ISA decision landed at 6am. The BBNJ ratification passed on a Tuesday. The enforcement action was buried in a port authority bulletin.
          </p>
          <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.75 }}>
            You found out three days later.
          </p>
        </div>
        <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.4px", marginBottom: 16, wordBreak: "break-word" as const }}>
          Tideline is being built so that never happens again.
        </h1>
        <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>
          A live feed. A daily brief before 7am. Trackers for the issues that matter. A research workspace with cited answers. Meeting prep in 30 seconds. Departure alerts when your entities move. One-click briefing reports.
        </p>
        <p style={{ color: SECONDARY, fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
          Five minutes of your time will shape what it becomes.
        </p>
        <div style={{ borderTop: `1px solid ${BORDER}`, marginBottom: 32 }} />

        <div style={{ marginBottom: 40 }}>
          <p style={{ color: MUTED, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>What we'll cover</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>{i + 1}</span>
                </div>
                <span style={{ color: SECONDARY, fontSize: 14 }}>{s.label} <span style={{ color: MUTED, fontSize: 12 }}>{"\u00B7"} {s.questions.length} questions</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="survey-intro-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 24 }}>
            {[`${TOTAL} questions`, "~6 minutes", "Anonymous"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL }} />
                <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={onStart} style={{ background: TEAL, border: "none", borderRadius: 4, padding: "0 28px", height: 40, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
            Start survey
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main survey ──────────────────────────────────────────────────────────
export default function SurveyPage() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!started) return <Intro onStart={() => setStarted(true)} />;

  const q = ALL_QUESTIONS[current];
  const progress = (current / TOTAL) * 100;
  const currentSection = SECTIONS.find((s) => s.id === q.sectionId);
  const sectionIndex = SECTIONS.findIndex((s) => s.id === q.sectionId);

  function handleSingle(id: string, val: string) { setAnswers((a) => ({ ...a, [id]: val })); }
  function handleMulti(id: string, val: string) {
    setAnswers((a) => {
      const prev = a[id] || [];
      return { ...a, [id]: prev.includes(val) ? prev.filter((v: string) => v !== val) : [...prev, val] };
    });
  }
  function handleScale(id: string, val: number) { setAnswers((a) => ({ ...a, [id]: val })); }
  function handleText(id: string, val: string) { setAnswers((a) => ({ ...a, [id]: val })); }

  function canAdvance() {
    if (q.type === "text") return true;
    const ans = answers[q.id];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    if (q.type === "single_with_other") {
      if (!ans.value) return false;
      if (ans.value === "Other") return ans.other?.trim().length > 0;
      return true;
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
    } catch {}
    setSubmitted(true);
  }

  // ── Thank you ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');${MOBILE_CSS}`}</style>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p style={{ color: SECONDARY, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Response recorded</p>
          <h2 style={{ color: TEXT, fontSize: 22, fontWeight: 500, marginBottom: 12, letterSpacing: "-0.3px" }}>Thank you for your time.</h2>
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, marginBottom: 32 }}>Your input genuinely shapes Tideline. I'll be in touch as the platform develops.</p>
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "16px 20px", textAlign: "left", marginBottom: 32 }}>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Want early access?</p>
            <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>Reply to the message that brought you here and I'll add you to the list.</p>
          </div>
          <div style={{ paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
            <p style={{ color: MUTED, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tideline {"\u00B7"} Ocean Intelligence</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');${MOBILE_CSS}`}</style>

      {/* Progress bar */}
      <div style={{ height: 3, background: BORDER, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: TEAL, transition: "width 0.35s ease" }} />
      </div>

      {/* Header */}
      <div className="survey-header" style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 600, letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>Tideline</span>
          <span style={{ color: BORDER, fontSize: 14, margin: "0 2px" }}>{"\u00B7"}</span>
          <span style={{ color: MUTED, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentSection?.label}</span>
        </div>
        <span style={{ color: MUTED, fontSize: 13, flexShrink: 0 }}>{current + 1} / {TOTAL}</span>
      </div>

      {/* Body */}
      <div className="survey-body" style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Section pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 12px", marginBottom: 20 }}>
          <span style={{ color: TEAL, fontSize: 11, fontWeight: 600 }}>{sectionIndex + 1}</span>
          <span style={{ color: MUTED, fontSize: 11 }}>/</span>
          <span style={{ color: MUTED, fontSize: 11 }}>{SECTIONS.length}</span>
          <span style={{ color: SECONDARY, fontSize: 11, fontWeight: 500 }}>{currentSection?.label}</span>
        </div>

        <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 500, lineHeight: 1.4, marginBottom: q.helper ? 6 : 28, letterSpacing: "-0.3px" }}>
          {q.question}
        </h2>
        {q.helper && <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>{q.helper}</p>}

        {/* Single with Other */}
        {q.type === "single_with_other" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const selected = answers[q.id]?.value === opt;
              return (
                <div key={opt}>
                  <div onClick={() => setAnswers((a) => ({ ...a, [q.id]: { value: opt, other: "" } }))}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: selected ? "#E6F4F1" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                    onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? TEAL : "#BDC1C6"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />}
                    </span>
                    <span style={{ color: selected ? TEXT : SECONDARY, fontSize: 14, fontWeight: selected ? 500 : 400 }}>{opt}</span>
                  </div>
                  {selected && opt === "Other" && (
                    <div style={{ paddingLeft: 48, paddingRight: 16, paddingBottom: 8 }}>
                      <input autoFocus placeholder="Please describe your role"
                        value={answers[q.id]?.other || ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { value: "Other", other: e.target.value } }))}
                        style={{ width: "100%", border: "none", borderBottom: `2px solid ${TEAL}`, borderRadius: 0, padding: "4px 0", color: TEXT, fontSize: 16, fontFamily: F, outline: "none", background: "transparent" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Single */}
        {q.type === "single" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const selected = answers[q.id] === opt;
              return (
                <div key={opt} onClick={() => handleSingle(q.id, opt)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: selected ? "#E6F4F1" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                  onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? TEAL : "#BDC1C6"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />}
                  </span>
                  <span style={{ color: selected ? TEXT : SECONDARY, fontSize: 14, fontWeight: selected ? 500 : 400 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Multi */}
        {q.type === "multi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(q.options || []).map((opt) => {
              const selected = (answers[q.id] || []).includes(opt);
              return (
                <div key={opt} onClick={() => handleMulti(q.id, opt)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 4, minHeight: 44, background: selected ? "#E6F4F1" : "transparent", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = SURFACE; }}
                  onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${selected ? TEAL : "#BDC1C6"}`, background: selected ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.1s" }}>
                    {selected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span style={{ color: selected ? TEXT : SECONDARY, fontSize: 14, fontWeight: selected ? 500 : 400 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Scale */}
        {q.type === "scale" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = answers[q.id] === n;
                return (
                  <button key={n} onClick={() => handleScale(q.id, n)}
                    style={{ flex: 1, height: 48, minWidth: 44, background: selected ? TEAL : "#fff", border: `1px solid ${selected ? TEAL : BORDER}`, borderRadius: 4, color: selected ? "#fff" : SECONDARY, fontSize: 16, fontWeight: 500, cursor: "pointer", fontFamily: F, transition: "all 0.1s", boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.15)" : "none" }}>
                    {n}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{q.min}</span>
              <span style={{ color: MUTED, fontSize: 12 }}>{q.max}</span>
            </div>
          </div>
        )}

        {/* Text */}
        {q.type === "text" && (
          <textarea placeholder={q.placeholder} value={answers[q.id] || ""} onChange={(e) => handleText(q.id, e.target.value)} rows={4}
            style={{ width: "100%", border: "none", borderBottom: `2px solid ${BORDER}`, borderRadius: 0, padding: "8px 0", color: TEXT, fontSize: 16, fontFamily: F, resize: "none", outline: "none", background: "transparent", lineHeight: 1.6, boxSizing: "border-box" as const, maxWidth: "100%" }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderBottomColor = TEAL; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderBottomColor = BORDER; }}
          />
        )}

        {/* Navigation */}
        <div className="survey-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          {current > 0 ? (
            <button onClick={() => setCurrent((c) => c - 1)}
              style={{ background: "none", border: "none", color: SECONDARY, fontSize: 14, cursor: "pointer", fontFamily: F, padding: "8px 0" }}>
              Back
            </button>
          ) : <span />}

          {current < TOTAL - 1 ? (
            <button onClick={() => { if (canAdvance()) setCurrent((c) => c + 1); }}
              style={{ background: canAdvance() ? TEAL : "#F1F3F4", border: "none", borderRadius: 4, padding: "0 24px", height: 36, color: canAdvance() ? "#fff" : "#BDC1C6", fontSize: 14, fontWeight: 500, cursor: canAdvance() ? "pointer" : "default", fontFamily: F, transition: "background 0.15s", boxShadow: canAdvance() ? "0 1px 2px rgba(0,0,0,0.2)" : "none" }}>
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ background: submitting ? "#F1F3F4" : TEAL, border: "none", borderRadius: 4, padding: "0 24px", height: 36, color: submitting ? "#BDC1C6" : "#fff", fontSize: 14, fontWeight: 500, cursor: submitting ? "default" : "pointer", fontFamily: F, boxShadow: !submitting ? "0 1px 2px rgba(0,0,0,0.2)" : "none" }}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
