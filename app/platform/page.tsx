
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const BLUE_LIGHT = "#e8f2f9";
const RED = "#d32f2f";
const GREEN = "#2e7d32";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER_LIGHT = "#e8e8e8";
const MUTED = "#666";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

const TIERS = [
  { id: "governance", label: "Regulation & Governance", topics: [
    { id: "bbnj", name: "High Seas Treaty & BBNJ" },
    { id: "unclos", name: "UNCLOS & International Disputes" },
    { id: "wcpfc", name: "Regional Fisheries Bodies — Pacific (WCPFC, FFA)" },
    { id: "iccat", name: "Regional Fisheries Bodies — Atlantic & Mediterranean" },
    { id: "ccamlr", name: "Regional Fisheries Bodies — Southern Ocean (CCAMLR)" },
    { id: "iotc", name: "Regional Fisheries Bodies — Indian Ocean (IOTC)" },
    { id: "cites", name: "CITES Marine Listings" },
    { id: "mpa", name: "Marine Protected Areas & 30x30" },
    { id: "pacific_policy", name: "Pacific Island Ocean Policy" },
    { id: "arctic_gov", name: "Arctic Council & Polar Governance" },
  ]},
  { id: "regional", label: "Regional Intelligence", topics: [
    { id: "indopacific", name: "Indo-Pacific & South China Sea" },
    { id: "westafrica", name: "West Africa & Atlantic Fisheries" },
    { id: "latam", name: "Latin America & Caribbean" },
    { id: "med", name: "Mediterranean & Black Sea" },
    { id: "uk_reg", name: "UK Marine Regulation" },
    { id: "eu_reg", name: "EU Ocean & Nature Policy" },
    { id: "northam", name: "North America & Pacific Coast" },
    { id: "southern", name: "Antarctic & Southern Ocean" },
  ]},
  { id: "species", label: "Species & Ecosystems", topics: [
    { id: "cetaceans", name: "Cetacean Policy & Welfare" },
    { id: "sharks", name: "Shark & Ray Conservation" },
    { id: "turtles", name: "Sea Turtle & Marine Reptiles" },
    { id: "coral", name: "Coral Reef Systems" },
    { id: "deepsea", name: "Deep Sea Ecosystems" },
    { id: "polar_eco", name: "Polar & Arctic Ecosystems" },
    { id: "coastal_hab", name: "Coastal Wetlands — Mangroves & Saltmarsh" },
    { id: "seagrass", name: "Seagrass & Kelp Forests" },
    { id: "invasive", name: "Invasive Marine Species" },
  ]},
  { id: "fishing", label: "Commercial Fishing", topics: [
    { id: "iuu", name: "IUU Fishing & Enforcement" },
    { id: "china_fleet", name: "China's Distant Water Fleet" },
    { id: "destructive", name: "Destructive Fishing Practices" },
    { id: "ghost_gear", name: "Ghost Gear & Abandoned Equipment" },
    { id: "quotas", name: "Fisheries Management & Quotas" },
    { id: "aquaculture", name: "Sustainable Aquaculture" },
    { id: "supply_chain", name: "Seafood Supply Chains & Labour" },
    { id: "artisanal", name: "Small-Scale & Artisanal Fisheries" },
  ]},
  { id: "crime", label: "Ocean Crime & Incidents", topics: [
    { id: "maritime_crime", name: "Maritime Crime & Trafficking" },
    { id: "forced_labour", name: "Forced Labour at Sea" },
    { id: "spills", name: "Pollution Incidents & Spills" },
    { id: "wildlife_trade", name: "Illegal Wildlife Trade — Marine" },
    { id: "litigation", name: "Environmental Litigation" },
    { id: "sanctions", name: "Sanctions & Vessel Blacklisting" },
  ]},
  { id: "science", label: "Climate & Science", topics: [
    { id: "climate", name: "Ocean & Climate Systems" },
    { id: "amoc", name: "AMOC & Ocean Circulation" },
    { id: "acidification", name: "Ocean Acidification & Chemistry" },
    { id: "polar_ice", name: "Polar Ice & Sea Level Rise" },
    { id: "bluecarbon", name: "Blue Carbon & Carbon Credits" },
    { id: "modelling", name: "Ocean Modelling & Forecasting" },
    { id: "genomics", name: "Marine Genomics & Biotechnology" },
    { id: "indicators", name: "Ocean Health Indicators" },
    { id: "dsm", name: "Seabed Mining & ISA" },
  ]},
  { id: "finance", label: "Finance & ESG", topics: [
    { id: "blue_bonds", name: "Blue Bonds & Sovereign Issuance" },
    { id: "corp_finance", name: "Corporate Blue Finance" },
    { id: "tnfd", name: "TNFD & Ocean Disclosure" },
    { id: "carbon_markets", name: "Ocean Carbon Markets" },
    { id: "shipping_decarb", name: "Shipping Decarbonisation" },
    { id: "renewables", name: "Offshore Renewables" },
    { id: "insurance", name: "Ocean Insurance & Risk" },
    { id: "biodiversity_mkts", name: "Nature & Biodiversity Markets" },
  ]},
  { id: "policy", label: "Policy & Advocacy", topics: [
    { id: "ngo_legal", name: "NGO Campaigns & Litigation" },
    { id: "captivity", name: "Captivity & Welfare Law" },
    { id: "whaling", name: "Whaling & Hunting Policy" },
    { id: "indigenous", name: "Coastal & Indigenous Rights" },
    { id: "sentience", name: "Animal Sentience & Marine Law" },
    { id: "debt_nature", name: "Debt-for-Nature Swaps" },
  ]},
];

const ALL_TOPICS = TIERS.flatMap(t => t.topics.map(tp => ({ ...tp, tier: t.id })));

const TRACKERS = [
  { label: "ISA mining code", value: "Deferred", change: "Next council: Jul 2026", dir: "neutral" },
  { label: "Norway minke quota 2026", value: "1,277", change: "+12% vs 2025", dir: "down" },
  { label: "Captive orcas worldwide", value: "54", change: "−3 since Jan 2025", dir: "up" },
  { label: "Ocean MPAs — global", value: "9.61%", change: "Target: 30% by 2030", dir: "neutral" },
  { label: "High Seas Treaty", value: "In force", change: "Since Jan 17, 2026", dir: "up" },
  { label: "Coral species threatened", value: "44%", change: "IUCN 2025-2", dir: "down" },
  { label: "Ghost gear — annual", value: "640k t", change: "3x prev. estimates", dir: "down" },
  { label: "IUU fishing — global", value: "$23bn", change: "Annual, UNODC", dir: "down" },
];

const SRC: Record<string, { bg: string; color: string }> = {
  reg: { bg: "#e8f2f9", color: "#1d6fa4" },
  res: { bg: "#eaf3de", color: "#2D6A0A" },
  ngo: { bg: "#f0eef9", color: "#4A3F8C" },
  gov: { bg: "#fff3e0", color: "#7A4500" },
  esg: { bg: "#fde8e8", color: "#8C1A1A" },
  media: { bg: "#f5f5f5", color: "#444" },
};

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
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function CategoryFilter({ selTopics, toggleTopic, clearTopics }: {
  selTopics: Set<string>;
  toggleTopic: (id: string) => void;
  clearTopics: () => void;
}) {
  const [openTier, setOpenTier] = useState<string | null>(null);
  return (
    <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${BORDER_LIGHT}` }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 8 }}>
        <button onClick={clearTopics} style={{ padding: "5px 14px", border: `1.5px solid ${selTopics.size === 0 ? NAVY : BORDER_LIGHT}`, background: selTopics.size === 0 ? NAVY : WHITE, color: selTopics.size === 0 ? WHITE : MUTED, cursor: "pointer", fontSize: 12, fontWeight: selTopics.size === 0 ? 600 : 400, borderRadius: 2, fontFamily: SANS }}>All topics</button>
        {TIERS.map(t => {
          const activeTier = t.topics.some(tp => selTopics.has(tp.id));
          const isOpen = openTier === t.id;
          return (
            <button key={t.id} onClick={() => setOpenTier(isOpen ? null : t.id)} style={{ padding: "5px 14px", border: `1.5px solid ${activeTier ? BLUE : BORDER_LIGHT}`, background: activeTier ? BLUE_LIGHT : WHITE, color: activeTier ? "#004080" : MUTED, cursor: "pointer", fontSize: 12, fontWeight: activeTier ? 600 : 400, borderRadius: 2, fontFamily: SANS, display: "flex", alignItems: "center", gap: 5 }}>
              {t.label} <span style={{ fontSize: 9, opacity: 0.6 }}>{isOpen ? "▲" : "▼"}</span>
            </button>
          );
        })}
      </div>
      {openTier && (
        <div style={{ background: OFF_WHITE, border: `1px solid ${BORDER_LIGHT}`, padding: "14px 16px", borderRadius: 2, marginTop: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
            {TIERS.find(t => t.id === openTier)?.topics.map(tp => {
              const sel = selTopics.has(tp.id);
              return (
                <button key={tp.id} onClick={() => toggleTopic(tp.id)} style={{ padding: "5px 12px", border: `1.5px solid ${sel ? NAVY : BORDER_LIGHT}`, background: sel ? NAVY : WHITE, color: sel ? WHITE : NAVY, cursor: "pointer", fontSize: 12, fontWeight: sel ? 600 : 400, borderRadius: 2, fontFamily: SANS }}>{tp.name}</button>
              );
            })}
          </div>
          {selTopics.size > 0 && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: BLUE, fontFamily: SANS }}>{selTopics.size} topic{selTopics.size !== 1 ? "s" : ""} selected</span>
              <button onClick={clearTopics} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: 2 }}>Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StoryCard({ item, tier, onUpgrade }: { item: Story; tier: string; onUpgrade: () => void }) {
  const sc = SRC[item.source_type] || SRC.res;
  const isLocked = item.is_pro && tier === "free";
  const topicLabel = ALL_TOPICS.find(t => t.id === item.topic)?.name || item.topic;

  return (
    <div style={{ borderBottom: `1px solid ${BORDER_LIGHT}`, padding: "28px 0", opacity: isLocked ? 0.55 : 1 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" as const }}>
        <span style={{ fontSize: 11, padding: "2px 8px", background: sc.bg, color: sc.color, fontWeight: 600, borderRadius: 2, fontFamily: SANS }}>{item.source_name}</span>
        <span style={{ fontSize: 11, color: BLUE, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, fontFamily: SANS }}>{topicLabel}</span>
        {item.is_pro && <span style={{ fontSize: 10, color: WHITE, background: BLUE, padding: "1px 7px", borderRadius: 2, fontWeight: 700, letterSpacing: "0.08em", fontFamily: SANS }}>PRO</span>}
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto", fontFamily: MONO }}>{formatDate(item.published_at)}</span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1.4, margin: "0 0 12px", fontFamily: SERIF, letterSpacing: "-0.01em" }}>
        {item.title}
      </h3>
      {item.short_summary && (
        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.75, margin: "0 0 14px", fontFamily: SANS }}>{item.short_summary}</p>
      )}
      {isLocked ? (
        <div style={{ fontSize: 13, color: "#bbb", fontFamily: SANS }}>
          Intelligence summary available to Pro subscribers.{" "}
          <button onClick={onUpgrade} style={{ background: "none", border: "none", color: BLUE, cursor: "pointer", fontSize: 13, fontFamily: SANS, textDecoration: "underline", padding: 0 }}>Upgrade →</button>
        </div>
      ) : (
        <Link href={`/platform/story/${item.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: BLUE, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" as const, textDecoration: "none", borderBottom: `1px solid ${BLUE}`, paddingBottom: 1 }}>
          Deeper intelligence →
        </Link>
      )}
    </div>
  );
}

export default function Platform() {
  const [view, setView] = useState("brief");
  const [selTopics, setSelTopics] = useState(new Set<string>());
  const [tier, setTier] = useState("free");
  const [searchQ, setSearchQ] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [onboarding, setOnboarding] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [breakingExpanded, setBreakingExpanded] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const toggleTopic = (id: string) => setSelTopics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Fetch real stories from Supabase
  useEffect(() => {
    setStoriesLoading(true);
    fetch("/api/stories?limit=100")
      .then(r => r.json())
      .then(data => setStories(data.stories || []))
      .catch(() => {})
      .finally(() => setStoriesLoading(false));
  }, []);

  const filteredStories = stories.filter(s => selTopics.size === 0 || selTopics.has(s.topic));

  const handleSearch = async () => {
    const q = searchQ.trim(); if (!q) return;
    setSearchLoading(true); setSearchResult(null);
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setSearchResult(data.text || "No results.");
    } catch { setSearchResult("Search failed."); }
    setSearchLoading(false);
  };

  // ONBOARDING
  if (onboarding) return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, color: NAVY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ borderBottom: `3px solid ${BLUE}`, background: NAVY, padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: SERIF, textDecoration: "none", letterSpacing: "-0.02em" }}>TIDELINE</a>
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Ocean Intelligence</span>
        </div>
        <button onClick={() => setOnboarding(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: 3 }}>Skip to brief →</button>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 48px 80px" }}>
        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER_LIGHT}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: BLUE, marginBottom: 12, fontFamily: SANS }}>Configure your brief</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Choose the intelligence areas<br />relevant to your work.
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 20px", maxWidth: 560, fontFamily: SANS }}>
            Your daily brief will be filtered to exactly what you select. Adjust at any time.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setSelTopics(new Set(ALL_TOPICS.map(t => t.id)))} style={{ padding: "6px 14px", border: `1px solid ${BORDER_LIGHT}`, background: OFF_WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 2 }}>Select all</button>
            <button onClick={() => setSelTopics(new Set())} style={{ padding: "6px 14px", border: `1px solid ${BORDER_LIGHT}`, background: OFF_WHITE, color: NAVY, cursor: "pointer", fontSize: 12, fontFamily: SANS, borderRadius: 2 }}>Clear all</button>
            {selTopics.size > 0 && <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, fontFamily: SANS }}>{selTopics.size} selected</span>}
          </div>
        </div>
        {TIERS.map(t => (
          <div key={t.id} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${BORDER_LIGHT}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#999", marginBottom: 14, fontFamily: SANS }}>{t.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
              {t.topics.map(tp => {
                const sel = selTopics.has(tp.id);
                return (
                  <button key={tp.id} onClick={() => toggleTopic(tp.id)} style={{ padding: "7px 14px", border: `1.5px solid ${sel ? NAVY : BORDER_LIGHT}`, background: sel ? NAVY : WHITE, color: sel ? WHITE : NAVY, cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, borderRadius: 2, fontFamily: SANS }}>{tp.name}</button>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 8 }}>
          <button onClick={() => setOnboarding(false)} style={{ padding: "13px 32px", background: BLUE, border: `1px solid ${BLUE}`, color: WHITE, fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS }}>
            {selTopics.size === 0 ? "Open full brief →" : `Open brief — ${selTopics.size} topic${selTopics.size !== 1 ? "s" : ""} selected →`}
          </button>
          <button onClick={() => setOnboarding(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", textUnderlineOffset: 3 }}>Skip</button>
        </div>
      </div>
    </div>
  );

  // MAIN PLATFORM
  return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ borderBottom: `3px solid ${BLUE}`, background: NAVY, position: "sticky" as const, top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <a href="/" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: WHITE, fontFamily: SERIF, textDecoration: "none" }}>TIDELINE</a>
              <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.2)", display: "inline-block", marginBottom: 2 }} />
              <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", fontFamily: SANS }}>Ocean Intelligence</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: MONO }}>{today}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {["free", "pro"].map(t => (
                  <button key={t} onClick={() => { setTier(t); setShowUpgrade(false); }} style={{ padding: "3px 10px", border: `1px solid ${tier === t ? WHITE : "rgba(255,255,255,0.25)"}`, background: tier === t ? WHITE : "transparent", color: tier === t ? BLUE : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 10, fontWeight: 600, borderRadius: 2, fontFamily: SANS, textTransform: "uppercase" as const }}>{t}</button>
                ))}
              </div>
              <button onClick={() => setView("pricing")} style={{ padding: "7px 18px", background: BLUE, border: "none", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS }}>Try Pro free →</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
            {[["brief", "Intelligence Brief"], ["search", "Search"], ["trackers", "Trackers"], ["pricing", "Pricing"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "9px 18px", border: "none", borderBottom: view === v ? `3px solid ${BLUE}` : "3px solid transparent", background: "transparent", color: view === v ? WHITE : "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 12, fontWeight: view === v ? 700 : 400, fontFamily: SANS, marginBottom: -3, letterSpacing: "0.02em" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {showUpgrade && (
        <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FFD54F", padding: "10px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#5D4037", fontFamily: SANS }}><strong>Pro subscribers only.</strong> Upgrade for intelligence summaries across all topics.</span>
          <button onClick={() => { setTier("pro"); setShowUpgrade(false); setView("pricing"); }} style={{ padding: "5px 16px", background: BLUE, border: "none", color: WHITE, borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>See pricing</button>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>

        {view === "brief" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, paddingTop: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${NAVY}` }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0, fontFamily: SERIF }}>Intelligence Brief</h2>
                <span style={{ fontSize: 12, color: MUTED, fontFamily: MONO }}>{filteredStories.length} items</span>
              </div>
              <CategoryFilter selTopics={selTopics} toggleTopic={toggleTopic} clearTopics={() => setSelTopics(new Set())} />
              {storiesLoading ? (
                <div style={{ padding: "40px 0", color: MUTED, fontSize: 13, fontFamily: SANS, fontStyle: "italic" }}>Loading intelligence brief…</div>
              ) : filteredStories.length === 0 ? (
                <div style={{ padding: "40px 0", color: MUTED, fontSize: 13, fontFamily: SANS }}>No stories found for selected topics.</div>
              ) : (
                filteredStories.map(item => (
                  <StoryCard key={item.id} item={item} tier={tier} onUpgrade={() => setShowUpgrade(true)} />
                ))
              )}
            </div>

            <div style={{ paddingTop: 0 }}>
              <div style={{ background: OFF_WHITE, border: `1px solid ${BORDER_LIGHT}`, padding: "14px", marginBottom: 20, borderRadius: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10, fontFamily: SANS }}>Search</div>
                <div style={{ display: "flex" }}>
                  <input placeholder="Search intelligence…" value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setView("search"); handleSearch(); } }} style={{ flex: 1, padding: "8px 10px", border: `1px solid ${BORDER_LIGHT}`, borderRight: "none", fontSize: 12, borderRadius: "2px 0 0 2px", fontFamily: SANS, outline: "none" }} />
                  <button onClick={() => { setView("search"); handleSearch(); }} style={{ padding: "8px 14px", background: BLUE, border: "none", color: WHITE, borderRadius: "0 2px 2px 0", cursor: "pointer", fontSize: 13, fontFamily: MONO }}>→</button>
                </div>
              </div>
              <div style={{ border: `1px solid ${BORDER_LIGHT}`, background: WHITE, marginBottom: 20 }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER_LIGHT}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MUTED, fontFamily: SANS }}>Key indicators</span>
                  <button onClick={() => setView("trackers")} style={{ background: "none", border: "none", color: BLUE, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>All →</button>
                </div>
                {TRACKERS.slice(0, 5).map((t, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderBottom: i < 4 ? `1px solid ${BORDER_LIGHT}` : "none" }}>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 3, fontFamily: SANS }}>{t.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: MONO }}>{t.value}</span>
                      <span style={{ fontSize: 11, color: t.dir === "up" ? GREEN : t.dir === "down" ? RED : MUTED, fontWeight: 600, fontFamily: SANS }}>{t.dir === "up" ? "↑" : t.dir === "down" ? "↓" : ""} {t.change}</span>
                    </div>
                  </div>
                ))}
              </div>
              {tier === "free" && (
                <div style={{ background: NAVY, padding: "18px", borderRadius: 2 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: WHITE, marginBottom: 8, fontFamily: SERIF }}>Upgrade to Pro</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 16, fontFamily: SANS }}>All 55 topics. Unlimited intelligence summaries. Breaking alerts. Full search.</div>
                  <button onClick={() => setView("pricing")} style={{ width: "100%", padding: "10px", background: BLUE, border: "none", color: WHITE, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS }}>£25/month — begin trial</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "search" && (
          <div style={{ maxWidth: 800, paddingTop: 40, paddingBottom: 60 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 8px", fontFamily: SERIF }}>Search all ocean sources</h2>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 28, lineHeight: 1.65, fontFamily: SANS }}>News, research papers, regulatory filings, NGO reports — synthesised into clear intelligence.</p>
            <div style={{ display: "flex", marginBottom: 28 }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="e.g. China distant water fleet, AMOC slowdown, ISA mining code…" style={{ flex: 1, padding: "12px 14px", border: `1.5px solid ${BORDER_LIGHT}`, borderRight: "none", fontSize: 13, borderRadius: "2px 0 0 2px", fontFamily: SANS, outline: "none" }} />
              <button onClick={handleSearch} style={{ padding: "12px 24px", background: BLUE, border: `1.5px solid ${BLUE}`, color: WHITE, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: "0 2px 2px 0", fontFamily: SANS }}>{searchLoading ? "Searching…" : "Search"}</button>
            </div>
            {searchResult && (
              <div style={{ border: `1px solid ${BORDER_LIGHT}`, borderTop: `3px solid ${BLUE}`, padding: "24px" }}>
                <div style={{ fontSize: 14, lineHeight: 1.85, color: "#333", whiteSpace: "pre-wrap" as const, fontFamily: SANS }}>{searchResult}</div>
                <button onClick={() => { setSearchResult(null); setSearchQ(""); }} style={{ marginTop: 20, background: "none", border: "none", color: MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", padding: 0 }}>New search</button>
              </div>
            )}
          </div>
        )}

        {view === "trackers" && (
          <div style={{ paddingTop: 40, paddingBottom: 60 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 6px", fontFamily: SERIF }}>Numbers that matter</h2>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, fontFamily: SANS }}>The metrics every ocean professional tracks, updated as events develop.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 48 }}>
              {TRACKERS.map((t, i) => (
                <div key={i} style={{ border: `1px solid ${BORDER_LIGHT}`, borderTop: `3px solid ${t.dir === "down" ? RED : t.dir === "up" ? GREEN : BLUE}`, padding: "18px 20px" }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: SANS }}>{t.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 6, fontFamily: MONO, lineHeight: 1 }}>{t.value}</div>
                  <div style={{ fontSize: 11, color: t.dir === "up" ? GREEN : t.dir === "down" ? RED : MUTED, fontWeight: 600, fontFamily: SANS }}>{t.dir === "up" ? "↑ " : t.dir === "down" ? "↓ " : ""}{t.change}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "pricing" && (
          <div style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: SERIF }}>Intelligence that pays for itself</h2>
              <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.65, fontFamily: SANS }}>One policy development caught early. One spill flagged before your comms team found it.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, maxWidth: 960, margin: "0 auto" }}>
              {[
                { name: "Standard", price: "£0", freq: "free", features: ["Breaking incident alerts", "3 intelligence areas", "5 stories per day", "Basic search"], cta: "Continue", featured: false },
                { name: "Professional", price: "£25", freq: "/month", features: ["All 55 intelligence topics", "Daily personalised brief", "Unlimited intelligence summaries", "Deeper intelligence on every story", "Full search", "Live regulatory indicators", "14-day trial"], cta: "Begin 14-day trial", featured: true },
                { name: "Institutional", price: "£199", freq: "/month", features: ["Everything in Professional", "Up to 5 team seats", "Slack & email integration", "Priority incident alerts", "Monthly briefing with Luke McMillan", "API access"], cta: "Contact us", featured: false },
              ].map(plan => (
                <div key={plan.name} style={{ border: plan.featured ? `2px solid ${BLUE}` : `1px solid ${BORDER_LIGHT}`, borderTop: `4px solid ${BLUE}`, padding: "28px 24px", position: "relative" as const, background: plan.featured ? NAVY : WHITE }}>
                  {plan.featured && <div style={{ position: "absolute" as const, top: -1, right: 0, background: BLUE, color: WHITE, fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.1em", fontFamily: SANS }}>RECOMMENDED</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: plan.featured ? "rgba(255,255,255,0.4)" : MUTED, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: SANS }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
                    <span style={{ fontSize: 38, fontWeight: 700, color: plan.featured ? WHITE : NAVY, letterSpacing: "-0.03em", fontFamily: MONO }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.featured ? "rgba(255,255,255,0.4)" : MUTED, fontFamily: SANS }}>{plan.freq}</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${plan.featured ? "rgba(255,255,255,0.1)" : BORDER_LIGHT}`, paddingTop: 16, marginBottom: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 13, color: plan.featured ? "rgba(255,255,255,0.75)" : "#444", marginBottom: 10, lineHeight: 1.7, display: "flex", gap: 8, fontFamily: SANS }}>
                        <span style={{ color: BLUE, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <a href={plan.cta === "Contact us" ? "mailto:luke@tideline.io" : "#"} onClick={plan.cta !== "Contact us" ? (e) => { e.preventDefault(); setView("brief"); } : undefined} style={{ display: "block", padding: "11px", background: plan.featured ? BLUE : "transparent", border: `1.5px solid ${plan.featured ? BLUE : BORDER_LIGHT}`, color: plan.featured ? WHITE : NAVY, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS, textDecoration: "none", textAlign: "center" as const }}>{plan.cta}</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, background: OFF_WHITE, padding: "18px 40px", marginTop: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: SERIF, textDecoration: "none" }}>TIDELINE</a>
          <span style={{ fontSize: 11, color: "#aaa", fontFamily: MONO }}>© {new Date().getFullYear()} · tideline.io</span>
        </div>
      </div>
    </div>
  );
}
