"use client";

import { useState, useEffect } from "react";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const TEAL = "#0E7C86";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

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

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .topic-btn { transition: all 0.1s ease; }
    .topic-btn:hover { border-color: ${BLUE} !important; color: ${BLUE} !important; }
    select:focus, input:focus { outline: none; border-color: ${BLUE} !important; box-shadow: 0 0 0 3px rgba(29,111,164,0.12); }
  `;

  return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, fontFamily: SANS }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em" }}>TIDELINE</span>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 40px 100px" }}>
        {checkingSkip ? (
          <div style={{ fontSize: 13, color: MUTED, padding: "40px 0", textAlign: "center" }}>Loading...</div>
        ) : (
        <>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 52 }}>
          {[{ key: "sector", label: "Your sector" }, { key: "topics", label: "Choose topics" }, { key: "timezone", label: "Set timezone" }].map((s, i) => {
            const stepOrder = ["sector", "topics", "timezone"];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const active = step === s.key;
            const done = thisIdx < currentIdx;
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? "#22c55e" : active ? NAVY : BORDER, color: done || active ? WHITE : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {done ? "\u2713" : i + 1}
                </div>
                <span style={{ fontSize: 12, color: active ? NAVY : MUTED, fontWeight: active ? 600 : 400, fontFamily: SANS }}>{s.label}</span>
                {i < 2 && <div style={{ width: 28, height: 1, background: BORDER, marginLeft: 4 }} />}
              </div>
            );
          })}
        </div>

        {/* Step 0: Sector */}
        {step === "sector" && (
          <div>
            <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
              <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color: "#202124", margin: "0 0 8px" }}>
                What best describes your work?
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: "#5F6368", margin: 0 }}>
                This helps Tideline personalise your experience.
              </p>
            </div>

            <div className="sector-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 36 }}>
              {SECTORS.map(s => {
                const sel = sector === s;
                return (
                  <div
                    key={s}
                    onClick={() => setSector(s)}
                    style={{
                      padding: 16, cursor: "pointer",
                      background: sel ? "#E6F4F1" : WHITE,
                      border: sel ? `2px solid ${TEAL}` : `1px solid #E8EAED`,
                      borderRadius: 4,
                      fontFamily: SANS, fontSize: 14, fontWeight: 500,
                      color: sel ? TEAL : "#202124",
                      transition: "all 0.1s",
                    }}
                  >
                    {s}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSectorContinue}
              disabled={!sector || sectorSaving}
              style={{
                padding: "13px 28px",
                background: sector && !sectorSaving ? TEAL : "#94a3b8",
                border: "none", color: WHITE,
                fontSize: 14, fontWeight: 500, fontFamily: SANS,
                cursor: sector && !sectorSaving ? "pointer" : "not-allowed",
                borderRadius: 4,
              }}
            >
              {sectorSaving ? "Saving..." : "Continue"}
            </button>
          </div>
        )}

        {/* Step 1: Topics */}
        {step === "topics" && (
          <div>
            <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Step 1</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                What do you need to track?
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 560, fontFamily: SANS }}>
                Pick at least 3 topics. These shape your live feed. You can change them anytime.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <button onClick={() => setSelectedTopics(new Set(TOPICS.map((t) => t.id)))} style={{ padding: "6px 14px", border: `1px solid ${BORDER}`, background: WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 3 }}>Select all</button>
              <button onClick={() => setSelectedTopics(new Set())} style={{ padding: "6px 14px", border: `1px solid ${BORDER}`, background: WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 3 }}>Clear all</button>
              {selectedTopics.size > 0 && <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, fontFamily: SANS }}>{selectedTopics.size} selected</span>}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
              {TOPICS.map((t) => {
                const sel = selectedTopics.has(t.id);
                return (
                  <button key={t.id} className="topic-btn" onClick={() => toggleTopic(t.id)}
                    style={{ padding: "8px 15px", border: `1.5px solid ${sel ? NAVY : BORDER}`, background: sel ? NAVY : WHITE, color: sel ? WHITE : NAVY, cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, borderRadius: 3, fontFamily: SANS }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("timezone")}
              disabled={selectedTopics.size < 3}
              style={{ padding: "13px 28px", background: selectedTopics.size < 3 ? "#94a3b8" : BLUE, border: "none", color: WHITE, fontSize: 14, fontWeight: 700, cursor: selectedTopics.size < 3 ? "not-allowed" : "pointer", borderRadius: 3, fontFamily: SANS }}
            >
              {selectedTopics.size < 3
                ? `Select at least 3 topics (${selectedTopics.size} selected)`
                : `Continue: ${selectedTopics.size} topic${selectedTopics.size !== 1 ? "s" : ""} selected`}
            </button>
          </div>
        )}

        {/* Step 2: Timezone */}
        {step === "timezone" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Step 2</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                What timezone are you in?
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, fontFamily: SANS }}>
                Tideline uses your timezone for deadline alerts and regulatory calendar sync.
              </p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Your timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, fontSize: 15, fontFamily: SANS, borderRadius: 3, background: WHITE, color: NAVY, appearance: "auto" }}
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

            {/* Summary */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "14px 18px", borderRadius: 3, marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 8, fontFamily: SANS }}>Your dashboard</div>
              <div style={{ fontSize: 13, color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>
                {selectedTopics.size} topic{selectedTopics.size !== 1 ? "s" : ""} selected
              </div>
              <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: BLUE, fontSize: 12, cursor: "pointer", fontFamily: SANS, padding: 0, marginTop: 6 }}>Edit topics →</button>
            </div>

            {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, fontFamily: SANS }}>{error}</p>}

            <button
              onClick={handleFinish}
              disabled={submitting}
              style={{ width: "100%", padding: "14px", background: submitting ? "#94a3b8" : BLUE, border: "none", color: WHITE, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", borderRadius: 3, fontFamily: SANS }}
            >
              {submitting ? "Saving..." : "Open your feed →"}
            </button>

            <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", marginTop: 20, padding: 0, display: "block" }}>{"\u2190"} Back</button>
          </div>
        )}
        {/* Step: Shortcut tip */}
        {step === "shortcut" && (
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 20 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" stroke={TEAL} strokeWidth="1.5"/>
              <path d="M6 12h2M10 12h4M18 12h-2M8 8h2M14 8h2M8 16h8" stroke={TEAL} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color: "#202124", margin: "0 0 8px" }}>
              One shortcut worth knowing
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 400, color: "#5F6368", margin: "0 0 24px" }}>
              Press this anywhere on Tideline to instantly save a thought to your active project.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
              {(typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)
                ? ["Cmd", "Shift", "N"]
                : ["Ctrl", "Shift", "N"]
              ).map((k, i) => (
                <span key={i}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#202124", background: "#F1F3F4", border: "1px solid #E8EAED", padding: "6px 10px", borderRadius: 4 }}>{k}</span>
                  {i < 2 && <span style={{ color: "#9CA3AF", margin: "0 2px" }}>+</span>}
                </span>
              ))}
            </div>
            <p style={{ fontFamily: SANS, fontSize: 13, color: "#80868B", margin: "0 0 28px" }}>
              Works anywhere on the platform. Saves to your active project.
            </p>
            <button
              onClick={() => {
                try { localStorage.setItem("tideline_shortcut_shown", "true"); } catch {}
                window.location.href = "/platform/feed";
              }}
              style={{
                width: "100%", height: 40, background: TEAL, border: "none",
                color: WHITE, fontFamily: SANS, fontSize: 14, fontWeight: 500,
                borderRadius: 4, cursor: "pointer",
              }}
            >
              Got it, take me in
            </button>
          </div>
        )}
        </>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .sector-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
