"use client";

import { useState } from "react";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

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
  const [step, setStep] = useState<"topics" | "timezone">("topics");
  const [selectedTopics, setSelectedTopics] = useState(new Set<string>());
  const [timezone, setTimezone] = useState("Europe/London");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 52 }}>
          {[{ key: "topics", label: "Choose topics" }, { key: "timezone", label: "Set timezone" }].map((s, i) => {
            const active = step === s.key;
            const done = step === "timezone" && s.key === "topics";
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? "#22c55e" : active ? NAVY : BORDER, color: done || active ? WHITE : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, color: active ? NAVY : MUTED, fontWeight: active ? 600 : 400, fontFamily: SANS }}>{s.label}</span>
                {i < 1 && <div style={{ width: 28, height: 1, background: BORDER, marginLeft: 4 }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Topics */}
        {step === "topics" && (
          <div>
            <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Step 1</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                What do you need to track?
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 560, fontFamily: SANS }}>
                Pick at least 3 topics. These shape your daily brief and feed. You can change them anytime.
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
                : `Continue — ${selectedTopics.size} topic${selectedTopics.size !== 1 ? "s" : ""} selected →`}
            </button>
          </div>
        )}

        {/* Step 2: Timezone */}
        {step === "timezone" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Step 2</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                When should your brief arrive?
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, fontFamily: SANS }}>
                We deliver your morning brief before 7am in your timezone.
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

            <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", marginTop: 20, padding: 0, display: "block" }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
