"use client";

import { useState, useEffect } from "react";

const TEAL = "#1D9E75";
const TEAL_PALE = "#E6F4F1";
const TEAL_HOVER = "#178a65";
const INK = "#202124";
const SECONDARY = "#5F6368";
const TERTIARY = "#9AA0A6";
const BORDER = "#E8EAED";
const SURFACE = "#F8F9FA";
const WHITE = "#ffffff";
const SANS = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

const SECTORS = [
  "NGO & conservation",
  "Policy & regulation",
  "Finance & investment",
  "Legal & compliance",
  "Shipping & maritime",
  "Energy & offshore",
  "ESG & sustainability",
  "Science & research",
  "Government & public sector",
  "Media & journalism",
];

const TOPICS = [
  { id: "coral-reefs", label: "Coral Reefs" },
  { id: "sharks-rays", label: "Sharks & Rays" },
  { id: "whales-dolphins", label: "Whales & Dolphins" },
  { id: "sea-turtles", label: "Sea Turtles" },
  { id: "seabirds", label: "Seabirds" },
  { id: "marine-mammals", label: "Marine Mammals" },
  { id: "polar-oceans", label: "Polar Oceans" },
  { id: "deep-sea", label: "Deep Sea" },
  { id: "fisheries", label: "Fisheries" },
  { id: "aquaculture", label: "Aquaculture" },
  { id: "iuu-fishing", label: "IUU Fishing" },
  { id: "ocean-governance", label: "Ocean Governance" },
  { id: "bbnj-high-seas", label: "BBNJ & High Seas" },
  { id: "mpa", label: "Marine Protected Areas" },
  { id: "climate-ocean", label: "Climate & Ocean" },
  { id: "acidification", label: "Ocean Acidification" },
  { id: "plastic-pollution", label: "Plastic Pollution" },
  { id: "marine-pollution", label: "Marine Pollution" },
  { id: "shipping-decarbonisation", label: "Shipping Decarbonisation" },
  { id: "deep-sea-mining", label: "Deep-Sea Mining" },
  { id: "blue-finance", label: "Blue Finance" },
  { id: "esg-ocean", label: "ESG & Ocean" },
  { id: "ocean-science", label: "Ocean Science" },
  { id: "technology", label: "Technology" },
  { id: "biodiversity", label: "Biodiversity" },
  { id: "arctic", label: "Arctic" },
  { id: "antarctic", label: "Antarctic" },
  { id: "unoc", label: "UN Ocean Conference" },
  { id: "imo-regulation", label: "IMO Regulation" },
  { id: "rfmo", label: "RFMOs" },
  { id: "ocean-investors", label: "Ocean Investors" },
];

const TIMEZONES = [
  {
    region: "Europe",
    zones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris / Berlin / Rome (CET)" },
      { value: "Europe/Athens", label: "Athens / Helsinki (EET)" },
      { value: "Europe/Lisbon", label: "Lisbon (WET)" },
      { value: "Europe/Oslo", label: "Oslo / Stockholm (CET)" },
    ],
  },
  {
    region: "Americas",
    zones: [
      { value: "America/New_York", label: "New York (ET)" },
      { value: "America/Chicago", label: "Chicago (CT)" },
      { value: "America/Denver", label: "Denver (MT)" },
      { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
      { value: "America/Toronto", label: "Toronto (ET)" },
      { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
      { value: "America/Mexico_City", label: "Mexico City (CST)" },
    ],
  },
  {
    region: "Asia-Pacific",
    zones: [
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Shanghai", label: "Shanghai / Beijing (CST)" },
      { value: "Asia/Singapore", label: "Singapore (SGT)" },
      { value: "Asia/Kolkata", label: "Mumbai / Delhi (IST)" },
      { value: "Asia/Dubai", label: "Dubai (GST)" },
      { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
      { value: "Australia/Sydney", label: "Sydney (AEST)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST)" },
    ],
  },
  {
    region: "Africa",
    zones: [
      { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
      { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
      { value: "Africa/Lagos", label: "Lagos (WAT)" },
      { value: "Africa/Cairo", label: "Cairo (EET)" },
      { value: "Africa/Casablanca", label: "Casablanca (WET)" },
    ],
  },
  {
    region: "Middle East",
    zones: [
      { value: "Asia/Riyadh", label: "Riyadh (AST)" },
      { value: "Asia/Tehran", label: "Tehran (IRST)" },
      { value: "Asia/Jerusalem", label: "Jerusalem (IST)" },
      { value: "Asia/Beirut", label: "Beirut (EET)" },
    ],
  },
];

const STEPS = ["sector", "topics", "timezone", "shortcut"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState<"sector" | "topics" | "timezone" | "shortcut">("sector");
  const [sector, setSector] = useState<string | null>(null);
  const [sectorSaving, setSectorSaving] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState(new Set<string>());
  const [timezone, setTimezone] = useState("Europe/London");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkingSkip, setCheckingSkip] = useState(true);

  // Redirect if onboarding already done, skip sector if already set
  useEffect(() => {
    fetch("/api/subscription-status")
      .then(r => r.json())
      .then(d => {
        if (!d.needsOnboarding) {
          window.location.href = "/platform/feed";
          return;
        }
        if (d.sector) {
          setSector(d.sector);
          setStep("topics");
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSkip(false));
  }, []);

  const handleSectorContinue = async () => {
    if (!sector) return;
    setSectorSaving(true);
    try {
      await fetch("/api/user/sector", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector }),
      });
    } catch {}
    setSectorSaving(false);
    setStep("topics");
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFinish = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: Array.from(selectedTopics),
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      // Show shortcut tip if not already shown
      try {
        if (typeof localStorage !== "undefined" && !localStorage.getItem("tideline_shortcut_shown")) {
          setStep("shortcut");
          setSubmitting(false);
          return;
        }
      } catch {}
      window.location.href = "/platform/feed";
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ob-sector-card:hover { border-color: #BDC1C6 !important; }
        .ob-sector-card.selected:hover { border-color: ${TEAL} !important; }
        .ob-topic-chip:hover { border-color: #BDC1C6 !important; }
        .ob-topic-chip.selected:hover { border-color: ${TEAL} !important; }
        .ob-btn:hover:not(:disabled) { background: ${TEAL_HOVER} !important; }
        .ob-select:focus { border-color: ${TEAL} !important; outline: none; }
        @media (max-width: 480px) {
          .ob-card { border: none !important; border-radius: 0 !important; padding: 24px 20px !important; }
          .ob-sector-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 481px) {
          .ob-sector-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div
        className="ob-card"
        style={{
          maxWidth: 480,
          margin: "48px auto 32px",
          background: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: 32,
        }}
      >
        {checkingSkip ? (
          <div style={{ fontSize: 13, color: TERTIARY, padding: "40px 0", textAlign: "center" }}>Loading...</div>
        ) : (
        <>
          {/* Progress dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  width: i <= stepIndex ? 8 : 6,
                  height: i <= stepIndex ? 8 : 6,
                  borderRadius: "50%",
                  background: i <= stepIndex ? TEAL : WHITE,
                  border: i <= stepIndex ? "none" : `1px solid ${BORDER}`,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          {/* Step 1: Sector */}
          {step === "sector" && (
            <div>
              <h1 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: INK, margin: "0 0 6px" }}>
                What best describes your work?
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: SECONDARY, margin: "0 0 24px" }}>
                This helps Tideline personalise your experience.
              </p>

              <div className="ob-sector-grid" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                {SECTORS.map(s => {
                  const sel = sector === s;
                  return (
                    <div
                      key={s}
                      className={`ob-sector-card${sel ? " selected" : ""}`}
                      onClick={() => setSector(s)}
                      style={{
                        padding: "14px 16px",
                        cursor: "pointer",
                        background: sel ? TEAL_PALE : WHITE,
                        border: sel ? `2px solid ${TEAL}` : `1px solid ${BORDER}`,
                        borderRadius: 8,
                        fontFamily: SANS,
                        fontSize: 14,
                        fontWeight: 500,
                        color: sel ? TEAL : INK,
                        transition: "border-color 0.15s",
                      }}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>

              <button
                className="ob-btn"
                onClick={handleSectorContinue}
                disabled={!sector || sectorSaving}
                style={{
                  width: "100%",
                  height: 44,
                  background: sector && !sectorSaving ? TEAL : BORDER,
                  border: "none",
                  color: sector && !sectorSaving ? WHITE : TERTIARY,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: SANS,
                  cursor: sector && !sectorSaving ? "pointer" : "not-allowed",
                  borderRadius: 6,
                }}
              >
                {sectorSaving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step 2: Topics */}
          {step === "topics" && (
            <div>
              <h1 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: INK, margin: "0 0 6px" }}>
                What do you need to track?
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: SECONDARY, margin: "0 0 24px" }}>
                Pick at least 3 topics. These shape your live feed. You can change them anytime.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {TOPICS.map((t) => {
                  const sel = selectedTopics.has(t.id);
                  return (
                    <button
                      key={t.id}
                      className={`ob-topic-chip${sel ? " selected" : ""}`}
                      onClick={() => toggleTopic(t.id)}
                      style={{
                        padding: "6px 14px",
                        border: sel ? `1.5px solid ${TEAL}` : `1px solid ${BORDER}`,
                        background: sel ? TEAL_PALE : WHITE,
                        color: sel ? TEAL : SECONDARY,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: sel ? 500 : 400,
                        borderRadius: 20,
                        fontFamily: SANS,
                        transition: "border-color 0.15s",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontFamily: MONO, fontSize: 11, color: TERTIARY, marginBottom: 24 }}>
                {selectedTopics.size} of {TOPICS.length} selected · minimum 3
              </div>

              <button
                className="ob-btn"
                onClick={() => setStep("timezone")}
                disabled={selectedTopics.size < 3}
                style={{
                  width: "100%",
                  height: 44,
                  background: selectedTopics.size >= 3 ? TEAL : BORDER,
                  border: "none",
                  color: selectedTopics.size >= 3 ? WHITE : TERTIARY,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: selectedTopics.size < 3 ? "not-allowed" : "pointer",
                  borderRadius: 6,
                  fontFamily: SANS,
                }}
              >
                {selectedTopics.size < 3
                  ? `Select at least 3 topics (${selectedTopics.size} selected)`
                  : `Continue: ${selectedTopics.size} topic${selectedTopics.size !== 1 ? "s" : ""} selected`}
              </button>

              <button
                onClick={() => setStep("sector")}
                style={{ background: "none", border: "none", color: TERTIARY, fontSize: 13, cursor: "pointer", fontFamily: SANS, marginTop: 16, padding: 0, display: "block" }}
              >
                {"\u2190"} Back
              </button>
            </div>
          )}

          {/* Step 3: Timezone */}
          {step === "timezone" && (
            <div>
              <h1 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: INK, margin: "0 0 6px" }}>
                What timezone are you in?
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: SECONDARY, margin: "0 0 24px" }}>
                Tideline uses your timezone for deadline alerts and regulatory calendar sync.
              </p>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SECONDARY, marginBottom: 6 }}>
                  Your timezone
                </label>
                <select
                  className="ob-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: SANS,
                    background: WHITE,
                    color: INK,
                    appearance: "auto",
                  }}
                >
                  {TIMEZONES.map((group) => (
                    <optgroup key={group.region} label={group.region}>
                      {group.zones.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, padding: "12px 16px", borderRadius: 6, marginBottom: 24 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: TERTIARY, marginBottom: 6 }}>Your selections</div>
                <div style={{ fontSize: 13, color: INK, fontFamily: SANS, lineHeight: 1.6 }}>
                  {selectedTopics.size} topic{selectedTopics.size !== 1 ? "s" : ""} selected
                </div>
                <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: TEAL, fontSize: 12, cursor: "pointer", fontFamily: SANS, padding: 0, marginTop: 4 }}>Edit topics</button>
              </div>

              {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, fontFamily: SANS }}>{error}</p>}

              <button
                className="ob-btn"
                onClick={handleFinish}
                disabled={submitting}
                style={{
                  width: "100%",
                  height: 44,
                  background: submitting ? BORDER : TEAL,
                  border: "none",
                  color: submitting ? TERTIARY : WHITE,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  borderRadius: 6,
                  fontFamily: SANS,
                }}
              >
                {submitting ? "Saving..." : "Open your feed"}
              </button>

              <button
                onClick={() => setStep("topics")}
                style={{ background: "none", border: "none", color: TERTIARY, fontSize: 13, cursor: "pointer", fontFamily: SANS, marginTop: 16, padding: 0, display: "block" }}
              >
                {"\u2190"} Back
              </button>
            </div>
          )}

          {/* Step 4: Shortcut tip */}
          {step === "shortcut" && (
            <div style={{ textAlign: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" stroke={TEAL} strokeWidth="1.5"/>
                <path d="M6 12h2M10 12h4M18 12h-2M8 8h2M14 8h2M8 16h8" stroke={TEAL} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color: INK, margin: "0 0 8px" }}>
                One shortcut worth knowing
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: SECONDARY, margin: "0 auto 24px", maxWidth: 320 }}>
                Press this anywhere on Tideline to instantly save a thought to your active project.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                {(typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)
                  ? ["Cmd", "Shift", "N"]
                  : ["Ctrl", "Shift", "N"]
                ).map((k, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: INK, background: "#F1F3F4", border: `1px solid ${BORDER}`, padding: "4px 10px", borderRadius: 4 }}>{k}</span>
                    {i < 2 && <span style={{ color: TERTIARY }}>+</span>}
                  </span>
                ))}
              </div>
              <p style={{ fontFamily: SANS, fontSize: 13, color: TERTIARY, margin: "0 0 28px" }}>
                Works anywhere on the platform. Saves to your active project.
              </p>
              <button
                className="ob-btn"
                onClick={() => {
                  try { localStorage.setItem("tideline_shortcut_shown", "true"); } catch {}
                  window.location.href = "/platform/feed";
                }}
                style={{
                  width: "100%",
                  height: 44,
                  background: TEAL,
                  border: "none",
                  color: WHITE,
                  fontFamily: SANS,
                  fontSize: 15,
                  fontWeight: 500,
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Got it, take me in
              </button>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}
