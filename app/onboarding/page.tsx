"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { entityTypeLabel } from "@/app/lib/entity-type-label";

/* ── Design tokens (light platform theme — matches /platform/welcome) ─ */
const BG       = "#FAF8F4";
const SURFACE  = "#FFFFFF";
const SURFACE_HI = "#F8F9FA";
const BORDER   = "#DADCE0";
const BORDER2  = "#B0BEC5";
const TEXT0    = "#0A1628";
const TEXT1    = "#5F6368";
const TEXT2    = "#9AA0A6";
const TEAL     = "#1D9E75";
const TEAL_DIM = "rgba(29,158,117,0.06)";
const TEAL_HOVER = "#178a65";
const RED      = "#E24B4A";
const F = "'DM Sans', system-ui, sans-serif";
const DISPLAY  = "'DM Sans', system-ui, sans-serif";
const M = "'DM Sans', sans-serif";

const JOB_TYPES = [
  { value: "marine_lawyer", label: "Marine Lawyer" },
  { value: "esg_analyst", label: "ESG Analyst" },
  { value: "blue_finance", label: "Blue Finance" },
  { value: "shipping_compliance", label: "Shipping Compliance" },
  { value: "ngo_campaigner", label: "NGO Campaigner" },
  { value: "generalist", label: "Generalist" },
] as const;

const BRIEF_TIMES = [
  "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00",
];

interface StarterEntity {
  id: string;
  name: string;
  entity_type: string;
  mention_count: number;
  tracker_tags: string[];
  display_order: number;
}

interface FuzzyMatch {
  id: string;
  name: string;
  entity_type: string;
  similarity: number;
}

type Step = "job_type" | "entities" | "brief_time" | "confirm";
const STEPS: Step[] = ["job_type", "entities", "brief_time", "confirm"];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("job_type");
  const [jobType, setJobType] = useState<string | null>(null);
  const [checkingSkip, setCheckingSkip] = useState(true);

  // Step 2: entities
  const [starterEntities, setStarterEntities] = useState<StarterEntity[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState(new Set<string>());
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Custom entity input
  const [customInput, setCustomInput] = useState("");
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [fuzzyLoading, setFuzzyLoading] = useState(false);
  const [customEntityIds, setCustomEntityIds] = useState(new Set<string>());
  const [customEntityNames, setCustomEntityNames] = useState<Map<string, string>>(new Map());
  const fuzzyTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Step 3: brief time
  const [briefTime, setBriefTime] = useState("07:00");
  const [timezone, setTimezone] = useState("Europe/London");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Used to refresh JWT after onboarding DB write (fixes middleware staleness loop)
  const { update } = useSession();

  // Detect timezone on mount, check if onboarding already done.
  // CRITICAL: the form must NEVER render for an already-onboarded user.
  // Completing onboarding writes job_type, topics, timezone to users —
  // showing the form to a returning user risks overwriting their preferences.
  // On error: redirect to /platform (safe — middleware will re-check),
  // never fall through to the form.
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {}

    fetch("/api/subscription-status")
      .then((r) => {
        if (!r.ok) throw new Error(`Status check failed: ${r.status}`);
        return r.json();
      })
      .then(async (d) => {
        if (!d.needsOnboarding) {
          // JWT is stale (middleware bounced us here). Refresh before navigating.
          try {
            await Promise.race([
              update({}),
              new Promise((_, reject) => setTimeout(() => reject(), 5000)),
            ]);
          } catch {}
          window.location.href = "/platform";
        } else {
          // Genuinely needs onboarding — show the form
          setCheckingSkip(false);
        }
      })
      .catch(() => {
        // API error: redirect to /platform rather than risk showing the form
        // to an already-onboarded user. Middleware will re-evaluate on arrival.
        window.location.href = "/platform";
      });
  }, []);

  // Load starter entities when job type is selected
  useEffect(() => {
    if (!jobType) return;
    setLoadingEntities(true);
    fetch(`/api/onboarding/starter-set?job_type=${jobType}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.entities) {
          setStarterEntities(d.entities);
          // Pre-select all
          setSelectedEntityIds(new Set(d.entities.map((e: StarterEntity) => e.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEntities(false));
  }, [jobType]);

  // Fuzzy search debounce
  useEffect(() => {
    if (fuzzyTimeout.current) clearTimeout(fuzzyTimeout.current);
    if (customInput.trim().length < 2) {
      setFuzzyMatches([]);
      return;
    }
    setFuzzyLoading(true);
    fuzzyTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/onboarding/entity-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: customInput.trim() }),
        });
        const data = await res.json();
        setFuzzyMatches(data.matches || []);
      } catch {
        setFuzzyMatches([]);
      }
      setFuzzyLoading(false);
    }, 400);
    return () => { if (fuzzyTimeout.current) clearTimeout(fuzzyTimeout.current); };
  }, [customInput]);

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addFuzzyMatch = (match: FuzzyMatch) => {
    setCustomEntityIds((prev) => new Set(prev).add(match.id));
    setCustomEntityNames((prev) => new Map(prev).set(match.id, match.name));
    setCustomInput("");
    setFuzzyMatches([]);
  };

  const removeCustomEntity = (id: string) => {
    setCustomEntityIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCustomEntityNames((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const totalSelected = selectedEntityIds.size + customEntityIds.size;

  const handleFinish = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_type: jobType,
          entity_ids: Array.from(selectedEntityIds),
          custom_entity_ids: Array.from(customEntityIds),
          brief_time: briefTime,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      // DB write committed. Refresh JWT so middleware sees onboarded_at set.
      // trigger='update' → jwt callback → DB re-read → cookie updated.
      // 3s timeout: if update() hangs, we navigate anyway and let the mount
      // skip check handle the JWT refresh on any middleware bounce.
      try {
        await Promise.race([
          update({}),
          new Promise((_, reject) => setTimeout(() => reject(), 3000)),
        ]);
      } catch {}
      window.location.href = "/platform/welcome";
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);


  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ob2-job:hover { border-color: ${BORDER2} !important; }
        .ob2-job.selected:hover { border-color: ${TEAL} !important; }
        .ob2-entity:hover { border-color: ${BORDER2} !important; }
        .ob2-entity.selected:hover { border-color: ${TEAL} !important; }
        .ob2-btn:hover:not(:disabled) { background: ${TEAL_HOVER} !important; }
        .ob2-fuzzy:hover { background: ${SURFACE_HI} !important; }
        .ob2-back:hover { color: ${TEXT0} !important; }
        .ob2-time:hover { border-color: ${BORDER2} !important; }
        .ob2-time.selected:hover { border-color: ${TEAL} !important; }
        .ob2-remove:hover { color: ${RED} !important; }
        @media (max-width: 560px) {
          .ob2-panel { margin: 0 !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; min-height: 100vh; }
          .ob2-job-grid { grid-template-columns: 1fr !important; }
          .ob2-entity-grid { grid-template-columns: 1fr !important; }
          .ob2-time-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* Header bar */}
      <div style={{ padding: "12px 32px", background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: TEXT0, letterSpacing: "-0.02em" }}>Tideline</span>
        <span style={{ fontFamily: M, fontSize: 10, fontWeight: 500, color: TEAL, letterSpacing: "0.18em", textTransform: "uppercase", marginLeft: 10 }}>OCEAN INTELLIGENCE</span>
      </div>

      <div
        className="ob2-panel"
        style={{
          maxWidth: 560,
          margin: "16px auto",
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: "24px 28px",
        }}
      >
        {checkingSkip ? (
          <div style={{ fontSize: 13, color: TEXT2, padding: "60px 0", textAlign: "center" }}>Checking your account...</div>
        ) : (
          <>
            {/* Progress dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  style={{
                    width: i <= stepIndex ? 10 : 8,
                    height: i <= stepIndex ? 10 : 8,
                    borderRadius: "50%",
                    background: i <= stepIndex ? TEAL : BORDER,
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </div>

            {/* ── Step 1: Job type ──────────────────────────── */}
            {step === "job_type" && (
              <div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT0, margin: "0 0 6px" }}>
                  What best describes your work?
                </h1>
                <p style={{ fontFamily: F, fontSize: 13, color: TEXT1, margin: "0 0 16px" }}>
                  Tideline uses this to recommend entities you should track.
                </p>

                <div className="ob2-job-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {JOB_TYPES.map((jt) => {
                    const sel = jobType === jt.value;
                    return (
                      <div
                        key={jt.value}
                        className={`ob2-job${sel ? " selected" : ""}`}
                        onClick={() => setJobType(jt.value)}
                        style={{
                          padding: "12px 14px",
                          cursor: "pointer",
                          background: sel ? TEAL_DIM : SURFACE,
                          border: `1px solid ${sel ? TEAL : BORDER}`,
                          borderRadius: 8,
                          fontFamily: F,
                          fontSize: 13,
                          fontWeight: 500,
                          color: sel ? TEAL : TEXT0,
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        {jt.label}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="ob2-btn"
                  onClick={() => setStep("entities")}
                  disabled={!jobType}
                  style={{
                    width: "100%",
                    height: 40,
                    background: jobType ? TEAL : BORDER,
                    border: "none",
                    color: jobType ? "#fff" : TEXT2,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: F,
                    cursor: jobType ? "pointer" : "not-allowed",
                    borderRadius: 6,
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {/* ── Step 2: Entity selection ──────────────────── */}
            {step === "entities" && (
              <div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT0, margin: "0 0 6px" }}>
                  What do you need to track?
                </h1>
                <p style={{ fontFamily: F, fontSize: 13, color: TEXT1, margin: "0 0 12px" }}>
                  Recommended for your role. Untick anything you do not need. Minimum 3.
                </p>

                {loadingEntities ? (
                  <div style={{ fontSize: 13, color: TEXT2, padding: "20px 0", textAlign: "center" }}>Loading entities...</div>
                ) : (
                  <div className="ob2-entity-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                    {starterEntities.map((e) => {
                      const sel = selectedEntityIds.has(e.id);
                      return (
                        <div
                          key={e.id}
                          className={`ob2-entity${sel ? " selected" : ""}`}
                          onClick={() => toggleEntity(e.id)}
                          style={{
                            padding: "8px 10px",
                            cursor: "pointer",
                            background: sel ? TEAL_DIM : SURFACE,
                            border: `1px solid ${sel ? TEAL : BORDER}`,
                            borderRadius: 6,
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: sel ? TEAL : TEXT0, lineHeight: 1.3 }}>
                            {e.name}
                          </div>
                          <div style={{ fontFamily: M, fontSize: 9, color: TEXT2, marginTop: 2 }}>
                            {entityTypeLabel(e.entity_type)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom entities added */}
                {customEntityIds.size > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Added by you</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Array.from(customEntityNames.entries()).map(([id, name]) => (
                        <span
                          key={id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 10px",
                            border: `1px solid ${TEAL}`,
                            borderRadius: 6,
                            fontFamily: F,
                            fontSize: 12,
                            color: TEAL,
                            background: TEAL_DIM,
                          }}
                        >
                          {name}
                          <span
                            className="ob2-remove"
                            onClick={() => removeCustomEntity(id)}
                            style={{ cursor: "pointer", color: TEXT2, fontSize: 14, lineHeight: 1 }}
                          >
                            x
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom entity input */}
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Search for an entity to add..."
                    style={{
                      width: "100%",
                      height: 36,
                      padding: "0 12px",
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 6,
                      fontFamily: F,
                      fontSize: 13,
                      color: TEXT0,
                      outline: "none",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = TEAL; }}
                    onBlur={(e) => { e.target.style.borderColor = BORDER; }}
                  />

                  {/* Fuzzy match dropdown */}
                  {(fuzzyMatches.length > 0 || (fuzzyLoading && customInput.trim().length >= 2)) && (
                    <div style={{
                      position: "absolute",
                      top: 44,
                      left: 0,
                      right: 0,
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      zIndex: 10,
                    }}>
                      {fuzzyLoading && <div style={{ padding: "10px 14px", fontSize: 12, color: TEXT2 }}>Searching...</div>}
                      {fuzzyMatches.map((m) => (
                        <div
                          key={m.id}
                          className="ob2-fuzzy"
                          onClick={() => addFuzzyMatch(m)}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          <div style={{ fontFamily: F, fontSize: 13, color: TEXT0 }}>{m.name}</div>
                          <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginTop: 2 }}>
                            {entityTypeLabel(m.entity_type)} · {Math.round(m.similarity * 100)}% match
                          </div>
                        </div>
                      ))}
                      {fuzzyMatches.length > 0 && customInput.trim().length >= 2 && (
                        <div
                          className="ob2-fuzzy"
                          style={{ padding: "10px 14px", cursor: "default", fontSize: 12, color: TEXT2, fontFamily: F }}
                        >
                          Not what you are looking for? Refine your search or continue without it.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: M, fontSize: 11, color: TEXT2, marginBottom: 10 }}>
                  {totalSelected} selected · minimum 3
                </div>

                <button
                  className="ob2-btn"
                  onClick={() => setStep("brief_time")}
                  disabled={totalSelected < 3}
                  style={{
                    width: "100%",
                    height: 40,
                    background: totalSelected >= 3 ? TEAL : BORDER,
                    border: "none",
                    color: totalSelected >= 3 ? "#fff" : TEXT2,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: F,
                    cursor: totalSelected < 3 ? "not-allowed" : "pointer",
                    borderRadius: 6,
                  }}
                >
                  {totalSelected < 3
                    ? `Select at least 3 (${totalSelected} selected)`
                    : `Continue with ${totalSelected} entities`}
                </button>

                <button
                  className="ob2-back"
                  onClick={() => setStep("job_type")}
                  style={{ background: "none", border: "none", color: TEXT2, fontSize: 13, cursor: "pointer", fontFamily: F, marginTop: 16, padding: 0 }}
                >
                  Back
                </button>
              </div>
            )}

            {/* ── Step 3: Brief delivery time ──────────────── */}
            {step === "brief_time" && (
              <div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT0, margin: "0 0 6px" }}>
                  When should your brief arrive?
                </h1>
                <p style={{ fontFamily: F, fontSize: 13, color: TEXT1, margin: "0 0 16px" }}>
                  Tideline delivers a morning intelligence brief to your inbox.
                </p>

                <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Delivery time
                </div>
                <div className="ob2-time-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
                  {BRIEF_TIMES.map((t) => {
                    const sel = briefTime === t;
                    return (
                      <div
                        key={t}
                        className={`ob2-time${sel ? " selected" : ""}`}
                        onClick={() => setBriefTime(t)}
                        style={{
                          padding: "8px 0",
                          textAlign: "center",
                          cursor: "pointer",
                          background: sel ? TEAL_DIM : SURFACE,
                          border: `1px solid ${sel ? TEAL : BORDER}`,
                          borderRadius: 6,
                          fontFamily: M,
                          fontSize: 13,
                          color: sel ? TEAL : TEXT1,
                          transition: "border-color 0.15s",
                        }}
                      >
                        {t}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Your timezone
                </div>
                <div style={{
                  padding: "10px 14px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  marginBottom: 16,
                  fontFamily: F,
                  fontSize: 13,
                  color: TEXT0,
                  background: SURFACE,
                }}>
                  {timezone.replace(/_/g, " ")}
                  <span style={{ fontFamily: M, fontSize: 11, color: TEXT2, marginLeft: 8 }}>
                    (auto-detected)
                  </span>
                </div>

                <button
                  className="ob2-btn"
                  onClick={() => setStep("confirm")}
                  style={{
                    width: "100%",
                    height: 40,
                    background: TEAL,
                    border: "none",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: F,
                    cursor: "pointer",
                    borderRadius: 6,
                  }}
                >
                  Continue
                </button>

                <button
                  className="ob2-back"
                  onClick={() => setStep("entities")}
                  style={{ background: "none", border: "none", color: TEXT2, fontSize: 13, cursor: "pointer", fontFamily: F, marginTop: 16, padding: 0 }}
                >
                  Back
                </button>
              </div>
            )}

            {/* ── Step 4: Confirm ───────────────────────────── */}
            {step === "confirm" && (
              <div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT0, margin: "0 0 6px" }}>
                  Confirm your setup
                </h1>
                <p style={{ fontFamily: F, fontSize: 14, color: TEXT1, margin: "0 0 16px" }}>
                  Your first brief arrives tomorrow at {briefTime} ({timezone.replace(/_/g, " ")}).
                </p>

                {/* Summary cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {/* Job type */}
                  <div style={{ padding: "12px 14px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                    <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</div>
                    <div style={{ fontFamily: F, fontSize: 14, color: TEXT0 }}>
                      {JOB_TYPES.find((j) => j.value === jobType)?.label}
                    </div>
                    <button
                      className="ob2-back"
                      onClick={() => setStep("job_type")}
                      style={{ background: "none", border: "none", color: TEAL, fontSize: 12, cursor: "pointer", fontFamily: F, padding: 0, marginTop: 6 }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Entities */}
                  <div style={{ padding: "12px 14px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                    <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tracking</div>
                    <div style={{ fontFamily: F, fontSize: 14, color: TEXT0 }}>
                      {totalSelected} {totalSelected === 1 ? "entity" : "entities"}
                    </div>
                    <div style={{ fontFamily: F, fontSize: 12, color: TEXT2, marginTop: 4, lineHeight: 1.5 }}>
                      {starterEntities
                        .filter((e) => selectedEntityIds.has(e.id))
                        .slice(0, 5)
                        .map((e) => e.name)
                        .join(", ")}
                      {totalSelected > 5 && ` +${totalSelected - 5} more`}
                    </div>
                    <button
                      className="ob2-back"
                      onClick={() => setStep("entities")}
                      style={{ background: "none", border: "none", color: TEAL, fontSize: 12, cursor: "pointer", fontFamily: F, padding: 0, marginTop: 6 }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Brief time */}
                  <div style={{ padding: "12px 14px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                    <div style={{ fontFamily: M, fontSize: 10, color: TEXT2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Morning brief</div>
                    <div style={{ fontFamily: F, fontSize: 14, color: TEXT0 }}>
                      {briefTime} · {timezone.replace(/_/g, " ")}
                    </div>
                    <button
                      className="ob2-back"
                      onClick={() => setStep("brief_time")}
                      style={{ background: "none", border: "none", color: TEAL, fontSize: 12, cursor: "pointer", fontFamily: F, padding: 0, marginTop: 6 }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {error && <p style={{ fontSize: 13, color: RED, marginBottom: 16, fontFamily: F }}>{error}</p>}

                <button
                  className="ob2-btn"
                  onClick={handleFinish}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    height: 40,
                    background: submitting ? BORDER : TEAL,
                    border: "none",
                    color: submitting ? TEXT2 : "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: F,
                    cursor: submitting ? "not-allowed" : "pointer",
                    borderRadius: 6,
                  }}
                >
                  {submitting ? "Setting up..." : "Schedule my first brief"}
                </button>

                <button
                  className="ob2-back"
                  onClick={() => setStep("brief_time")}
                  style={{ background: "none", border: "none", color: TEXT2, fontSize: 13, cursor: "pointer", fontFamily: F, marginTop: 16, padding: 0 }}
                >
                  Back
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
