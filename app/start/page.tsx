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

const TIERS = [
  { id: "governance", label: "Regulation & Governance", topics: [
    { id: "bbnj", name: "High Seas Treaty & BBNJ" },
    { id: "unclos", name: "UNCLOS & International Disputes" },
    { id: "wcpfc", name: "Regional Fisheries Bodies — Pacific" },
    { id: "iccat", name: "Regional Fisheries Bodies — Atlantic" },
    { id: "ccamlr", name: "Southern Ocean (CCAMLR)" },
    { id: "cites", name: "CITES Marine Listings" },
    { id: "mpa", name: "Marine Protected Areas & 30x30" },
    { id: "arctic_gov", name: "Arctic Council & Polar Governance" },
  ]},
  { id: "regional", label: "Regional Intelligence", topics: [
    { id: "indopacific", name: "Indo-Pacific & South China Sea" },
    { id: "westafrica", name: "West Africa & Atlantic Fisheries" },
    { id: "med", name: "Mediterranean & Black Sea" },
    { id: "uk_reg", name: "UK Marine Regulation" },
    { id: "eu_reg", name: "EU Ocean & Nature Policy" },
    { id: "southern", name: "Antarctic & Southern Ocean" },
  ]},
  { id: "species", label: "Species & Ecosystems", topics: [
    { id: "cetaceans", name: "Cetacean Policy & Welfare" },
    { id: "sharks", name: "Shark & Ray Conservation" },
    { id: "coral", name: "Coral Reef Systems" },
    { id: "deepsea", name: "Deep Sea Ecosystems" },
    { id: "seagrass", name: "Seagrass & Kelp Forests" },
  ]},
  { id: "fishing", label: "Commercial Fishing", topics: [
    { id: "iuu", name: "IUU Fishing & Enforcement" },
    { id: "china_fleet", name: "China's Distant Water Fleet" },
    { id: "quotas", name: "Fisheries Management & Quotas" },
    { id: "aquaculture", name: "Sustainable Aquaculture" },
    { id: "supply_chain", name: "Seafood Supply Chains & Labour" },
  ]},
  { id: "crime", label: "Ocean Crime & Incidents", topics: [
    { id: "spills", name: "Pollution Incidents & Spills" },
    { id: "forced_labour", name: "Forced Labour at Sea" },
    { id: "litigation", name: "Environmental Litigation" },
    { id: "sanctions", name: "Sanctions & Vessel Blacklisting" },
  ]},
  { id: "science", label: "Climate & Science", topics: [
    { id: "climate", name: "Ocean & Climate Systems" },
    { id: "acidification", name: "Ocean Acidification" },
    { id: "polar_ice", name: "Polar Ice & Sea Level Rise" },
    { id: "bluecarbon", name: "Blue Carbon & Carbon Credits" },
    { id: "dsm", name: "Seabed Mining & ISA" },
  ]},
  { id: "finance", label: "Finance & ESG", topics: [
    { id: "blue_bonds", name: "Blue Bonds & Sovereign Issuance" },
    { id: "tnfd", name: "TNFD & Ocean Disclosure" },
    { id: "shipping_decarb", name: "Shipping Decarbonisation" },
    { id: "renewables", name: "Offshore Renewables" },
    { id: "biodiversity_mkts", name: "Nature & Biodiversity Markets" },
  ]},
  { id: "policy", label: "Policy & Advocacy", topics: [
    { id: "captivity", name: "Captivity & Welfare Law" },
    { id: "whaling", name: "Whaling & Hunting Policy" },
    { id: "indigenous", name: "Coastal & Indigenous Rights" },
    { id: "debt_nature", name: "Debt-for-Nature Swaps" },
  ]},
];

const ALL_TOPICS = TIERS.flatMap(t => t.topics);

const FREE_EMAIL_DOMAINS = ["gmail", "hotmail", "yahoo", "outlook", "icloud", "aol", "protonmail", "live", "msn"];

function isProfessionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.split(".")[0]?.toLowerCase();
  return !FREE_EMAIL_DOMAINS.includes(domain || "");
}

function selectedTopicSummary(topics: Set<string>): string {
  if (topics.size === 0) return "All intelligence areas";
  const names = ALL_TOPICS.filter(t => topics.has(t.id)).map(t => t.name);
  if (names.length <= 3) return names.join(" · ");
  return `${names.slice(0, 3).join(" · ")} · +${names.length - 3} more`;
}

export default function StartPage() {
  const [step, setStep] = useState<"topics" | "email" | "success">("topics");
  const [selTopics, setSelTopics] = useState(new Set<string>());
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleTopic = (id: string) => {
    setSelTopics(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!isProfessionalEmail(email)) {
      setEmailError("Please use a professional email address. Tideline is a professional tool.");
      return;
    }
    setEmailError("");
    setSubmitting(true);

    try {
      await fetch("/api/trial-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          topics: Array.from(selTopics),
        }),
      });
    } catch {
      // fail silently
    }

    setSubmitting(false);
    setStep("success");
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    .topic-btn{transition:all 0.1s ease;}
    .topic-btn:hover{border-color:${BLUE}!important;color:${BLUE}!important;}
    input:focus{outline:none;border-color:${BLUE}!important;box-shadow:0 0 0 3px rgba(29,111,164,0.12);}
  `;

  if (step === "success") return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: SANS }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 520, width: "100%", background: WHITE, border: `1px solid ${BORDER}`, borderTop: `4px solid #22c55e`, padding: "48px 44px", textAlign: "center" as const }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>✓</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 14, letterSpacing: "-0.02em", lineHeight: 1.25 }}>You're in.</h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 10, fontFamily: SANS }}>
          We've sent a confirmation to <strong style={{ color: NAVY }}>{email}</strong>.
        </p>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 32, fontFamily: SANS }}>
          Your dashboard is configured. Your first morning brief arrives tomorrow before 7am.
        </p>
        <div style={{ background: "#f8fafc", border: `1px solid ${BORDER}`, padding: "14px 18px", borderRadius: 4, marginBottom: 32, textAlign: "left" as const }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 8, fontFamily: SANS }}>Your intelligence areas</div>
          <div style={{ fontSize: 13, color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>{selectedTopicSummary(selTopics)}</div>
        </div>
        <a href="/platform/feed" style={{ display: "block", padding: "14px", background: BLUE, color: WHITE, fontSize: 15, fontWeight: 700, borderRadius: 3, textDecoration: "none", fontFamily: SANS, letterSpacing: "-0.01em" }}>
          Open your feed →
        </a>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 20, fontFamily: SANS, lineHeight: 1.6 }}>
          If Tideline doesn't change how you start your day, unsubscribe. No questions, no friction.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, fontFamily: SANS }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "52px 40px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 52 }}>
          {[{ key: "topics", label: "Configure dashboard" }, { key: "email", label: "Start trial" }].map((s, i) => {
            const active = step === s.key;
            const done = (step === "email" && s.key === "topics");
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

        {step === "topics" && (
          <div>
            <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: BLUE, marginBottom: 12, fontFamily: SANS }}>Configure your dashboard</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                Choose the intelligence areas<br />that matter to your work.
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 560, fontFamily: SANS }}>
                Your feed, your morning brief, and your trackers will all be filtered to exactly what you select. You can change this at any time.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
              <button onClick={() => setSelTopics(new Set(ALL_TOPICS.map(t => t.id)))} style={{ padding: "6px 14px", border: `1px solid ${BORDER}`, background: WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 3 }}>Select all</button>
              <button onClick={() => setSelTopics(new Set())} style={{ padding: "6px 14px", border: `1px solid ${BORDER}`, background: WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 3 }}>Clear all</button>
              {selTopics.size > 0 && <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, fontFamily: SANS }}>{selTopics.size} selected</span>}
            </div>
            {TIERS.map(t => (
              <div key={t.id} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 14, fontFamily: SANS }}>{t.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                  {t.topics.map(tp => {
                    const sel = selTopics.has(tp.id);
                    return (
                      <button key={tp.id} className="topic-btn" onClick={() => toggleTopic(tp.id)}
                        style={{ padding: "8px 15px", border: `1.5px solid ${sel ? NAVY : BORDER}`, background: sel ? NAVY : WHITE, color: sel ? WHITE : NAVY, cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, borderRadius: 3, fontFamily: SANS }}>
                        {tp.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 8 }}>
              <button onClick={() => setStep("email")} style={{ padding: "13px 28px", background: BLUE, border: "none", color: WHITE, fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 3, fontFamily: SANS }}>
                {selTopics.size === 0 ? "Continue with full brief →" : `Continue — ${selTopics.size} topic${selTopics.size !== 1 ? "s" : ""} selected →`}
              </button>
              <button onClick={() => setStep("email")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: SANS, textDecoration: "underline" }}>Skip — show me everything</button>
            </div>
          </div>
        )}

        {step === "email" && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: BLUE, marginBottom: 12, fontFamily: SANS }}>Your brief starts here</div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                Where should we<br />send it?
              </h1>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, fontFamily: SANS }}>
                Every morning before 7am, the ocean sector's most important developments — summarised, contextualised, and waiting for you.
              </p>
            </div>
            {selTopics.size > 0 && (
              <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "14px 18px", borderRadius: 3, marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 6, fontFamily: SANS }}>Your dashboard</div>
                <div style={{ fontSize: 13, color: NAVY, fontFamily: SANS, lineHeight: 1.6 }}>{selectedTopicSummary(selTopics)}</div>
                <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: BLUE, fontSize: 12, cursor: "pointer", fontFamily: SANS, padding: 0, marginTop: 6 }}>Edit →</button>
              </div>
            )}
            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Professional email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@organisation.com"
                  style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${emailError ? "#ef4444" : BORDER}`, fontSize: 15, fontFamily: SANS, borderRadius: 3, background: WHITE }} />
                {emailError
                  ? <p style={{ fontSize: 12, color: "#ef4444", marginTop: 7, fontFamily: SANS }}>{emailError}</p>
                  : <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 7, fontFamily: SANS }}>We don't accept Gmail, Hotmail or Yahoo addresses. Tideline is a professional tool.</p>
                }
              </div>
              <button type="submit" disabled={submitting}
                style={{ width: "100%", padding: "14px", background: submitting ? "#94a3b8" : BLUE, border: "none", color: WHITE, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", borderRadius: 3, fontFamily: SANS }}>
                {submitting ? "Setting up your dashboard..." : "Start my free trial →"}
              </button>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, fontFamily: SANS, lineHeight: 1.6 }}>
                10 days free. No card required. If Tideline doesn't change how you start your day, unsubscribe. No questions, no friction.
              </p>
            </form>
            <button onClick={() => setStep("topics")} style={{ background: "none", border: "none", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", marginTop: 20, padding: 0 }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
