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

const BREAKING = [
  { id: "b1", title: "MV Wakashio II grounding — oil spreading toward Mauritius marine reserve", time: "47 min ago", severity: "critical" },
  { id: "b2", title: "Norwegian chemical tanker collision — North Sea, 12,000 tonnes cargo", time: "2 hrs ago", severity: "major" },
];

export const BRIEFS = [
  { id: 1, topicId: "dsm", source: "ISA", sourceUrl: "https://www.isa.org.jm", sourceType: "reg", title: "ISA Council defers nodule mining code vote amid scientific uncertainty", date: "Today", pro: false },
  { id: 2, topicId: "whaling", source: "Norwegian Fisheries Directorate", sourceUrl: "https://www.fiskeridir.no", sourceType: "gov", title: "Norway increases minke quota by 12% for 2026 season", date: "Today", pro: false },
  { id: 3, topicId: "coral", source: "AIMS Research", sourceUrl: "https://www.aims.gov.au", sourceType: "res", title: "New mass bleaching event confirmed across Great Barrier Reef as temperatures hit record", date: "Today", pro: false },
  { id: 4, topicId: "iuu", source: "IUCN Red List", sourceUrl: "https://www.iucnredlist.org", sourceType: "ngo", title: "IUCN Red List 2025-2: 44% of reef-building coral species now at risk of extinction", date: "Today", pro: false },
  { id: 5, topicId: "iuu", source: "Interpol / UNODC", sourceUrl: "https://www.interpol.int", sourceType: "reg", title: "Operation Neptuna: 47 vessels detained across Pacific for illegal fishing and forced labour violations", date: "Today", pro: false },
  { id: 6, topicId: "ghost_gear", source: "Ghost Fishing Foundation", sourceUrl: "https://www.ghostfishing.org", sourceType: "ngo", title: "New satellite tracking reveals 640,000 tonnes of ghost gear enters oceans annually — triple previous estimates", date: "Today", pro: false },
  { id: 7, topicId: "captivity", source: "European Parliament", sourceUrl: "https://www.europarl.europa.eu", sourceType: "gov", title: "EU Animal Welfare Regulation extended — cetacean captivity standards now cover all facilities receiving public subsidy", date: "Yesterday", pro: false },
  { id: 8, topicId: "destructive", source: "Nature Ecology & Evolution", sourceUrl: "https://www.nature.com/natecolevol", sourceType: "res", title: "Bottom trawling releases more carbon annually than all commercial aviation combined, landmark study finds", date: "Yesterday", pro: true },
  { id: 9, topicId: "climate", source: "Nature Climate Change", sourceUrl: "https://www.nature.com/nclimate", sourceType: "res", title: "New study links Atlantic circulation slowdown to cetacean migration disruption", date: "Yesterday", pro: true },
  { id: 10, topicId: "bbnj", source: "United Nations", sourceUrl: "https://www.un.org/bbnj", sourceType: "gov", title: "High Seas Treaty reaches 60 ratifications — enters force January 2026", date: "Yesterday", pro: false },
  { id: 11, topicId: "captivity", source: "WDC", sourceUrl: "https://uk.whales.org", sourceType: "ngo", title: "SeaWorld Orlando announces final orca performance date after two decades of pressure", date: "Yesterday", pro: false },
  { id: 12, topicId: "mpa", source: "DEFRA", sourceUrl: "https://www.gov.uk/defra", sourceType: "gov", title: "UK Government opens consultation on Marine Protected Area enforcement powers", date: "Yesterday", pro: true },
  { id: 13, topicId: "litigation", source: "ClientEarth", sourceUrl: "https://www.clientearth.org", sourceType: "ngo", title: "ClientEarth legal challenge forces suspension of deep-sea trawling permits in three UK MPAs", date: "2 days ago", pro: false },
  { id: 14, topicId: "china_fleet", source: "Global Fishing Watch", sourceUrl: "https://globalfishingwatch.org", sourceType: "res", title: "AIS dark vessel analysis: 12% of global fishing fleet goes dark in protected zones monthly", date: "2 days ago", pro: true },
  { id: 15, topicId: "artisanal", source: "FAO", sourceUrl: "https://www.fao.org", sourceType: "gov", title: "Small-scale fisheries feed 1 billion people — but receive less than 2% of subsidy support, FAO report finds", date: "2 days ago", pro: false },
  { id: 16, topicId: "spills", source: "Nature", sourceUrl: "https://www.nature.com", sourceType: "res", title: "Microplastic concentrations in deep-sea sediment now exceed surface water levels by 3x", date: "2 days ago", pro: false },
  { id: 17, topicId: "blue_bonds", source: "UN Ocean Conference", sourceUrl: "https://oceanconference.un.org", sourceType: "esg", title: "Ocean Investment Protocol launched — $1.2bn mobilised for marine protection", date: "3 days ago", pro: true },
  { id: 18, topicId: "sharks", source: "CITES Secretariat", sourceUrl: "https://cites.org", sourceType: "reg", title: "CITES Appendix II listing takes effect for 54 shark and ray species", date: "3 days ago", pro: false },
  { id: 19, topicId: "polar_ice", source: "NSIDC", sourceUrl: "https://nsidc.org", sourceType: "res", title: "Antarctic sea ice hits fifth record low — five of eight lowest years since 2016", date: "3 days ago", pro: true },
  { id: 20, topicId: "quotas", source: "WTO", sourceUrl: "https://www.wto.org", sourceType: "gov", title: "WTO members agree legal framework prohibiting subsidies for illegal fishing", date: "3 days ago", pro: false },
  { id: 21, topicId: "turtles", source: "IUCN", sourceUrl: "https://www.iucn.org", sourceType: "ngo", title: "Green sea turtle upgraded from Endangered to Least Concern in landmark reassessment", date: "3 days ago", pro: false },
  { id: 22, topicId: "shipping_decarb", source: "IMO", sourceUrl: "https://www.imo.org", sourceType: "reg", title: "IMO adopts revised underwater noise guidelines for commercial vessels", date: "4 days ago", pro: true },
  { id: 23, topicId: "bluecarbon", source: "Science Advances", sourceUrl: "https://www.science.org/journal/sciadv", sourceType: "res", title: "Mangrove carbon sequestration underestimated by 40%, new satellite study finds", date: "4 days ago", pro: true },
  { id: 24, topicId: "whaling", source: "Sea Shepherd", sourceUrl: "https://seashepherd.org", sourceType: "ngo", title: "Faroe Islands pilot whale drive kills 412 animals — largest single hunt in five years", date: "4 days ago", pro: false },
  { id: 25, topicId: "ghost_gear", source: "UNEP", sourceUrl: "https://www.unep.org", sourceType: "ngo", title: "Mediterranean ghost gear removal project recovers 180 tonnes in pilot year", date: "5 days ago", pro: false },
  { id: 26, topicId: "forced_labour", source: "Business & Human Rights Resource Centre", sourceUrl: "https://www.business-humanrights.org", sourceType: "esg", title: "14 major seafood brands named in Modern Slavery Act investigation over Pacific fleet labour abuses", date: "5 days ago", pro: true },
];

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
};

// ── CATEGORY FILTER ───────────────────────────────────────────────────────────
function CategoryFilter({
  selTopics, toggleTopic, clearTopics
}: {
  selTopics: Set<string>;
  toggleTopic: (id: string) => void;
  clearTopics: () => void;
}) {
  const [openTier, setOpenTier] = useState<string | null>(null);

  return (
    <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${BORDER_LIGHT}` }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button
          onClick={clearTopics}
          style={{
            padding: "5px 14px", border: `1.5px solid ${selTopics.size === 0 ? NAVY : BORDER_LIGHT}`,
            background: selTopics.size === 0 ? NAVY : WHITE,
            color: selTopics.size === 0 ? WHITE : MUTED,
            cursor: "pointer", fontSize: 12, fontWeight: selTopics.size === 0 ? 600 : 400,
            borderRadius: 2, fontFamily: SANS
          }}>All topics</button>
        {TIERS.map(t => {
          const activeTier = t.topics.some(tp => selTopics.has(tp.id));
          const isOpen = openTier === t.id;
          return (
            <button key={t.id}
              onClick={() => setOpenTier(isOpen ? null : t.id)}
              style={{
                padding: "5px 14px",
                border: `1.5px solid ${activeTier ? BLUE : BORDER_LIGHT}`,
                background: activeTier ? BLUE_LIGHT : WHITE,
                color: activeTier ? "#004080" : MUTED,
                cursor: "pointer", fontSize: 12, fontWeight: activeTier ? 600 : 400,
                borderRadius: 2, fontFamily: SANS, display: "flex", alignItems: "center", gap: 5
              }}>
              {t.label}
              <span style={{ fontSize: 9, opacity: 0.6 }}>{isOpen ? "▲" : "▼"}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded topic pills for open tier */}
      {openTier && (
        <div style={{
          background: OFF_WHITE, border: `1px solid ${BORDER_LIGHT}`,
          padding: "14px 16px", borderRadius: 2, marginTop: 6
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TIERS.find(t => t.id === openTier)?.topics.map(tp => {
              const sel = selTopics.has(tp.id);
              return (
                <button key={tp.id} onClick={() => toggleTopic(tp.id)} style={{
                  padding: "5px 12px",
                  border: `1.5px solid ${sel ? NAVY : BORDER_LIGHT}`,
                  background: sel ? NAVY : WHITE,
                  color: sel ? WHITE : NAVY,
                  cursor: "pointer", fontSize: 12, fontWeight: sel ? 600 : 400,
                  borderRadius: 2, fontFamily: SANS
                }}>{tp.name}</button>
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

// ── STORY CARD ────────────────────────────────────────────────────────────────
function StoryCard({ item, tier, onUpgrade }: {
  item: typeof BRIEFS[0];
  tier: string;
  onUpgrade: () => void;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const topic = ALL_TOPICS.find(t => t.id === item.topicId);
  const sc = SRC[item.sourceType] || SRC.res;
  const isLocked = item.pro && tier === "free";

  useEffect(() => {
    if (isLocked) return;
    setLoading(true);
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title, topic: topic?.name, source: item.source })
    })
      .then(r => r.json())
      .then(d => setSummary(d.text || null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [item.id, isLocked]);

  return (
    <div style={{
      borderBottom: `1px solid ${BORDER_LIGHT}`,
      padding: "28px 0",
      opacity: isLocked ? 0.5 : 1
    }}>
      {/* Meta row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, padding: "2px 8px", background: sc.bg, color: sc.color, fontWeight: 600, borderRadius: 2, fontFamily: SANS }}>{item.source}</span>
        {topic && <span style={{ fontSize: 11, color: BLUE, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: SANS }}>{topic.name}</span>}
        {item.pro && <span style={{ fontSize: 10, color: WHITE, background: BLUE, padding: "1px 7px", borderRadius: 2, fontWeight: 700, letterSpacing: "0.08em", fontFamily: SANS }}>PRO</span>}
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto", fontFamily: MONO }}>{item.date}</span>
      </div>

      {/* Headline */}
      <h3 style={{
        fontSize: 20, fontWeight: 700, color: NAVY,
        lineHeight: 1.4, margin: "0 0 14px",
        fontFamily: SERIF, letterSpacing: "-0.01em"
      }}>
        {item.title}
      </h3>

      {/* Summary — always visible */}
      {isLocked ? (
        <div style={{ fontSize: 14, color: "#ccc", fontFamily: SANS, lineHeight: 1.7, marginBottom: 16 }}>
          Intelligence summary available to Pro subscribers.{" "}
          <button onClick={onUpgrade} style={{ background: "none", border: "none", color: BLUE, cursor: "pointer", fontSize: 14, fontFamily: SANS, textDecoration: "underline", padding: 0 }}>Upgrade →</button>
        </div>
      ) : loading ? (
        <div style={{ fontSize: 14, color: "#aaa", fontFamily: SANS, fontStyle: "italic", marginBottom: 16 }}>Loading intelligence summary…</div>
      ) : summary ? (
        <p style={{ fontSize: 15, color: "#333", lineHeight: 1.8, margin: "0 0 16px", fontFamily: SANS }}>{summary}</p>
      ) : null}

      {/* Deeper intelligence link */}
      {!isLocked && (
        <Link href={`/platform/story/${item.id}`} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: BLUE,
          fontFamily: SANS, letterSpacing: "0.04em",
          textTransform: "uppercase", textDecoration: "none",
          borderBottom: `1px solid ${BLUE}`, paddingBottom: 1
        }}>
          Deeper intelligence →
        </Link>
      )}
    </div>
  );
}

// ── PLATFORM ─────────────────────────────────────────────────────────────────
export default function Platform() {
  const [view, setView] = useState("brief");
  const [selTopics, setSelTopics] = useState(new Set<string>());
  const [tier, setTier] = useState("free");
  const [searchQ, setSearchQ] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [onboarding, setOnboarding] = useState(true);
  const [breakingExpanded, setBreakingExpanded] = useState(false);

  const toggleTopic = (id: string) => setSelTopics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredBriefs = BRIEFS.filter(b => selTopics.size === 0 || selTopics.has(b.topicId));
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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

  // ── ONBOARDING ──────────────────────────────────────────────────────────────
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
                  <button key={tp.id} onClick={() => toggleTopic(tp.id)} style={{
                    padding: "7px 14px", border: `1.5px solid ${sel ? NAVY : BORDER_LIGHT}`,
                    background: sel ? NAVY : WHITE, color: sel ? WHITE : NAVY,
                    cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400,
                    borderRadius: 2, fontFamily: SANS
                  }}>{tp.name}</button>
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

  // ── MAIN PLATFORM ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: SANS, color: "#111" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* MASTHEAD — always on top */}
      <div style={{ borderBottom: `3px solid ${BLUE}`, background: NAVY, position: "sticky", top: 0, zIndex: 100 }}>
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
                  <button key={t} onClick={() => { setTier(t); setShowUpgrade(false); }} style={{
                    padding: "3px 10px", border: `1px solid ${tier === t ? WHITE : "rgba(255,255,255,0.25)"}`,
                    background: tier === t ? WHITE : "transparent", color: tier === t ? BLUE : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 10, fontWeight: 600, borderRadius: 2, fontFamily: SANS, textTransform: "uppercase" as const
                  }}>{t}</button>
                ))}
              </div>
              <button onClick={() => setView("pricing")} style={{ padding: "7px 18px", background: BLUE, border: "none", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS }}>Try Pro free →</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
            {[["brief", "Intelligence Brief"], ["search", "Search"], ["trackers", "Trackers"], ["pricing", "Pricing"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "9px 18px", border: "none",
                borderBottom: view === v ? `3px solid ${BLUE}` : "3px solid transparent",
                background: "transparent", color: view === v ? WHITE : "rgba(255,255,255,0.45)",
                cursor: "pointer", fontSize: 12, fontWeight: view === v ? 700 : 400,
                fontFamily: SANS, marginBottom: -3, letterSpacing: "0.02em"
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* BREAKING — below masthead */}
      <div style={{ background: RED }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", cursor: "pointer" }} onClick={() => setBreakingExpanded(p => !p)}>
            <span style={{ fontSize: 10, fontWeight: 700, color: WHITE, letterSpacing: "0.12em", textTransform: "uppercase" as const, background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 2, flexShrink: 0, fontFamily: SANS }}>Incident Alert</span>
            <span style={{ fontSize: 13, color: WHITE, fontWeight: 600, fontFamily: SERIF }}>{BREAKING[0].title}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginLeft: "auto", flexShrink: 0, fontFamily: MONO }}>{BREAKING[0].time} · {BREAKING.length} alerts {breakingExpanded ? "▲" : "▼"}</span>
          </div>
          {breakingExpanded && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingBottom: 10 }}>
              {BREAKING.map(b => (
                <div key={b.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", minWidth: 80, flexShrink: 0, fontFamily: MONO }}>{b.time}</span>
                  <span style={{ fontSize: 13, color: WHITE, fontFamily: SERIF }}>{b.title}</span>
                  <span style={{ fontSize: 10, background: "rgba(0,0,0,0.25)", color: WHITE, padding: "1px 8px", borderRadius: 2, marginLeft: "auto", flexShrink: 0, fontWeight: 700, letterSpacing: "0.08em", fontFamily: SANS }}>{b.severity.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUpgrade && (
        <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FFD54F", padding: "10px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#5D4037", fontFamily: SANS }}><strong>Pro subscribers only.</strong> Upgrade for intelligence summaries across all 55 topics.</span>
          <button onClick={() => { setTier("pro"); setShowUpgrade(false); setView("pricing"); }} style={{ padding: "5px 16px", background: BLUE, border: "none", color: WHITE, borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: SANS }}>See pricing</button>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>

        {/* ── BRIEF ── */}
        {view === "brief" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, paddingTop: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${NAVY}` }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0, fontFamily: SERIF }}>Intelligence Brief</h2>
                <span style={{ fontSize: 12, color: MUTED, fontFamily: MONO }}>{filteredBriefs.length} items</span>
              </div>

              <CategoryFilter
                selTopics={selTopics}
                toggleTopic={toggleTopic}
                clearTopics={() => setSelTopics(new Set())}
              />

              {filteredBriefs.map(item => (
                <StoryCard
                  key={item.id}
                  item={item}
                  tier={tier}
                  onUpgrade={() => setShowUpgrade(true)}
                />
              ))}
            </div>

            {/* SIDEBAR */}
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

        {/* ── SEARCH ── */}
        {view === "search" && (
          <div style={{ maxWidth: 800, paddingTop: 40, paddingBottom: 60 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 0 8px", fontFamily: SERIF }}>Search all ocean sources</h2>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 28, lineHeight: 1.65, fontFamily: SANS }}>News, research papers, regulatory filings, NGO reports — synthesised into clear intelligence.</p>
            <div style={{ display: "flex", marginBottom: 28 }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="e.g. China distant water fleet, AMOC slowdown, ISA mining code…" style={{ flex: 1, padding: "12px 14px", border: `1.5px solid ${BORDER_LIGHT}`, borderRight: "none", fontSize: 13, borderRadius: "2px 0 0 2px", fontFamily: SANS, outline: "none" }} />
              <button onClick={handleSearch} style={{ padding: "12px 24px", background: BLUE, border: `1.5px solid ${BLUE}`, color: WHITE, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: "0 2px 2px 0", fontFamily: SANS }}>{searchLoading ? "Searching…" : "Search"}</button>
            </div>
            {!searchResult && !searchLoading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {["China distant water fleet", "AMOC slowdown", "Norway whaling", "Great Barrier Reef bleaching", "bottom trawling carbon", "ISA deep-sea mining", "blue bonds Indonesia", "TNFD ocean disclosure"].map(q => (
                  <button key={q} onClick={() => { setSearchQ(q); setTimeout(handleSearch, 50); }} style={{ padding: "5px 12px", background: OFF_WHITE, border: `1px solid ${BORDER_LIGHT}`, color: "#444", cursor: "pointer", fontSize: 12, borderRadius: 2, fontFamily: SANS }}>{q}</button>
                ))}
              </div>
            )}
            {searchLoading && <div style={{ padding: "28px 0", color: MUTED, fontSize: 13, fontFamily: SANS, fontStyle: "italic" }}>Searching intelligence database…</div>}
            {searchResult && (
              <div style={{ border: `1px solid ${BORDER_LIGHT}`, borderTop: `3px solid ${BLUE}`, padding: "24px" }}>
                <div style={{ fontSize: 14, lineHeight: 1.85, color: "#333", whiteSpace: "pre-wrap", fontFamily: SANS }}>{searchResult}</div>
                <button onClick={() => { setSearchResult(null); setSearchQ(""); }} style={{ marginTop: 20, background: "none", border: "none", color: MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: SANS, textDecoration: "underline", padding: 0 }}>New search</button>
              </div>
            )}
          </div>
        )}

        {/* ── TRACKERS ── */}
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
            <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, paddingTop: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#aaa", marginBottom: 16, fontFamily: SANS }}>Upcoming dates</div>
              {[
                { date: "24 Mar 2026", event: "IWC Scientific Committee annual meeting opens, Cambridge" },
                { date: "01 Apr 2026", event: "ISA — nodule contractor annual reports submission deadline" },
                { date: "07 Jul 2026", event: "ISA Council session — mining code vote rescheduled" },
                { date: "Sep 2026", event: "CITES COP20 — shark and ray trade enforcement review" },
                { date: "Nov 2026", event: "COP31 — ocean commitments progress report due" },
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 28, padding: "12px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, minWidth: 100, flexShrink: 0, fontFamily: MONO }}>{d.date}</span>
                  <span style={{ fontSize: 13, color: "#444", fontFamily: SANS }}>{d.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRICING ── */}
        {view === "pricing" && (
          <div style={{ paddingTop: 40, paddingBottom: 60 }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: SERIF }}>Intelligence that pays for itself</h2>
              <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.65, fontFamily: SANS }}>One policy development caught early. One spill flagged before your comms team found it.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, maxWidth: 960, margin: "0 auto 40px" }}>
              {[
                { name: "Standard", price: "£0", freq: "free", features: ["Breaking incident alerts", "3 intelligence areas", "5 stories per day", "Basic search"], cta: "Continue with Standard", featured: false },
                { name: "Professional", price: "£25", freq: "/month", features: ["All 55 intelligence topics", "Daily personalised brief", "Unlimited intelligence summaries", "Deeper intelligence on every story", "Full search across all sources", "Live regulatory indicators", "14-day trial"], cta: "Begin 14-day trial", featured: true },
                { name: "Institutional", price: "£199", freq: "/month", features: ["Everything in Professional", "Up to 5 team seats", "Slack & email integration", "Priority incident alerts", "Monthly briefing with Luke McMillan", "API access"], cta: "Contact us", featured: false },
              ].map(plan => (
                <div key={plan.name} style={{ border: (plan as typeof plan & {featured:boolean}).featured ? `2px solid ${BLUE}` : `1px solid ${BORDER_LIGHT}`, borderTop: `4px solid ${BLUE}`, padding: "28px 24px", position: "relative" as const, background: (plan as typeof plan & {featured:boolean}).featured ? NAVY : WHITE }}>
                  {(plan as typeof plan & {featured:boolean}).featured && <div style={{ position: "absolute" as const, top: -1, right: 0, background: BLUE, color: WHITE, fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: "0.1em", fontFamily: SANS }}>RECOMMENDED</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: (plan as typeof plan & {featured:boolean}).featured ? "rgba(255,255,255,0.4)" : MUTED, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: SANS }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
                    <span style={{ fontSize: 38, fontWeight: 700, color: (plan as typeof plan & {featured:boolean}).featured ? WHITE : NAVY, letterSpacing: "-0.03em", fontFamily: MONO }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: (plan as typeof plan & {featured:boolean}).featured ? "rgba(255,255,255,0.4)" : MUTED, fontFamily: SANS }}>{plan.freq}</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${(plan as typeof plan & {featured:boolean}).featured ? "rgba(255,255,255,0.1)" : BORDER_LIGHT}`, paddingTop: 16, marginBottom: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 13, color: (plan as typeof plan & {featured:boolean}).featured ? "rgba(255,255,255,0.75)" : "#444", marginBottom: 10, lineHeight: 1.7, display: "flex", gap: 8, fontFamily: SANS }}>
                        <span style={{ color: BLUE, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <a href={plan.cta === "Contact us" ? "mailto:luke@tideline.io" : "#"} onClick={plan.cta !== "Contact us" ? (e) => { e.preventDefault(); setView("brief"); } : undefined}
                    style={{ display: "block", padding: "11px", background: (plan as typeof plan & {featured:boolean}).featured ? BLUE : "transparent", border: `1.5px solid ${(plan as typeof plan & {featured:boolean}).featured ? BLUE : BORDER_LIGHT}`, color: (plan as typeof plan & {featured:boolean}).featured ? WHITE : NAVY, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 2, fontFamily: SANS, textDecoration: "none", textAlign: "center" as const }}>
                    {plan.cta}
                  </a>
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