"use client";

import { useEffect, useState, useCallback } from "react";

const TEAL = "#1D9E75";
const TEAL_SOFT = "rgba(29,158,117,.1)";
const TEAL_BORDER = "rgba(29,158,117,.22)";
const NAVY = "#0A1628";
const NAVY_DEEP = "#061020";
const WHITE = "#FFFFFF";
const OFF = "#F8F9FA";
const BORDER = "#DADCE0";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

type Relationship = "portfolio_company" | "competitor" | "regulator" | "partner";

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "portfolio_company", label: "Portfolio company" },
  { value: "competitor", label: "Competitor" },
  { value: "regulator", label: "Regulator" },
  { value: "partner", label: "Partner" },
];

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  mention_count: number;
}

interface PortfolioEntry {
  id: string;
  fund_name: string;
  entity_id: string;
  relationship: Relationship;
  notes: string | null;
  active: boolean;
  briefing_type: string | null;
  entities: Entity | null;
}

interface BriefingSummary {
  fund_name: string;
  generated_at: string;
  summary: {
    total_mentions: number;
    entities_tracked: number;
    stories_covered: number;
  };
  entities: Array<{
    entity_name: string;
    entity_type: string;
    relationship: string;
    total_mentions: number;
    stories: Array<{ title: string; source_name: string; published_at: string }>;
  }>;
}

interface PlatformStats {
  entities: number;
  sources: number;
  stories: number;
}

// ── Icons ────────────────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10 21v-3h4v3" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

// ── Step card ────────────────────────────────────────────────────────

function StepCard({
  step, title, body, icon, state,
}: {
  step: number;
  title: string;
  body: string;
  icon: React.ReactNode;
  state: "active" | "done" | "locked";
}) {
  const isActive = state === "active";
  const isDone = state === "done";
  const isLocked = state === "locked";

  return (
    <div style={{
      flex: 1,
      background: WHITE,
      border: `0.5px solid ${isActive ? TEAL : BORDER}`,
      borderRadius: 10,
      padding: "18px 20px",
      opacity: isLocked ? 0.5 : 1,
      transition: "all .2s ease",
      boxShadow: isActive ? "0 1px 3px rgba(29,158,117,.14)" : "none",
      position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: isDone ? TEAL : isActive ? TEAL_SOFT : "#F1F3F4",
          color: isDone ? WHITE : isActive ? TEAL : T4,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: isActive ? `0.5px solid ${TEAL_BORDER}` : "none",
        }}>
          {isDone ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : icon}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: ".1em", color: isActive ? TEAL : T4,
        }}>
          Step {step}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T1, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: T3, lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function LpBriefingPage() {
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState<"checking" | "ok" | "locked">("checking");
  const [fundName, setFundName] = useState("");
  const [fundInput, setFundInput] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingRel, setPendingRel] = useState<Relationship>("portfolio_company");
  const [briefing, setBriefing] = useState<BriefingSummary | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const loadPortfolio = useCallback(async (fund: string) => {
    if (!fund) return;
    const res = await fetch(`/api/lp-portfolios?fund_name=${encodeURIComponent(fund)}`);
    if (res.status === 403) { setGated("locked"); return; }
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data = await res.json();
    if (res.ok) setPortfolio(data.portfolio || []);
    setGated("ok");
  }, []);

  useEffect(() => {
    fetch("/api/lp-briefing/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPlatformStats(d))
      .catch(() => {});

    const stored = localStorage.getItem("tideline_lp_fund") || "";
    setFundName(stored);
    setFundInput(stored);
    if (stored) {
      loadPortfolio(stored).finally(() => setLoading(false));
    } else {
      fetch("/api/lp-portfolios?fund_name=__probe__").then((r) => {
        if (r.status === 403) setGated("locked");
        else if (r.status === 401) window.location.href = "/login";
        else setGated("ok");
        setLoading(false);
      });
    }
  }, [loadPortfolio]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearching(true);
    setSearchError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/entities/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchError(data.error || `Search failed (${res.status})`);
          setSearchResults([]);
        } else {
          setSearchResults(data.entities || []);
        }
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const saveFund = () => {
    const f = fundInput.trim();
    if (!f) return;
    localStorage.setItem("tideline_lp_fund", f);
    setFundName(f);
    loadPortfolio(f);
  };

  const addEntity = async (entity: Entity) => {
    if (!fundName) { setError("Set a fund name first"); return; }
    setError(null);
    const res = await fetch("/api/lp-portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fund_name: fundName, entity_id: entity.id, relationship: pendingRel }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add entity");
      return;
    }
    setSearch("");
    setSearchResults([]);
    loadPortfolio(fundName);
  };

  const removeEntity = async (id: string) => {
    const res = await fetch(`/api/lp-portfolios?id=${id}`, { method: "DELETE" });
    if (res.ok) loadPortfolio(fundName);
  };

  const generateBriefing = async () => {
    if (!fundName) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/lp-briefing?fund_name=${encodeURIComponent(fundName)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate briefing");
        return;
      }
      setBriefing(await res.json());
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!fundName) return;
    window.open(`/api/lp-briefing/pdf?fund_name=${encodeURIComponent(fundName)}`, "_blank");
  };

  // Step states
  const hasFund = !!fundName;
  const hasEntities = portfolio.length > 0;
  const stepState = (idx: 1 | 2 | 3): "active" | "done" | "locked" => {
    if (idx === 1) return hasFund ? "done" : "active";
    if (idx === 2) return !hasFund ? "locked" : hasEntities ? "done" : "active";
    return !hasEntities ? "locked" : "active";
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading || gated === "checking") {
    return (
      <div style={{ fontFamily: F, background: OFF, minHeight: "100vh", padding: 48, color: T4 }}>
        Loading...
      </div>
    );
  }

  // ── Locked (non-corporate) ────────────────────────────────────────
  if (gated === "locked") {
    return (
      <div style={{ fontFamily: F, background: OFF, minHeight: "100vh" }}>
        <div style={{ background: NAVY, padding: "48px 24px 56px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>
              Tideline Corporate
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: WHITE, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
              Portfolio Intelligence
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)", lineHeight: 1.6, maxWidth: 560 }}>
              Track portfolio companies and key entities across Tideline&apos;s ocean intelligence sources. Generate a branded quarterly briefing for your investors.
            </p>
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 8 }}>
              This feature requires a Corporate subscription
            </div>
            <div style={{ fontSize: 13, color: T3, lineHeight: 1.6, marginBottom: 24 }}>
              Portfolio Intelligence is available on the Tideline Corporate tier, designed for funds, family offices and institutional investors tracking ocean-related portfolio exposure.
            </div>
            <button
              onClick={async () => {
                const res = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tier: "corporate" }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              style={{
                display: "inline-block", background: TEAL, color: WHITE, padding: "10px 22px",
                borderRadius: 6, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
              }}
            >
              Subscribe to Corporate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F, background: OFF, minHeight: "100vh", color: T1 }}>
      <style>{`
        @keyframes tl-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .55; transform: scale(1.25); }
        }
        .tl-pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: ${TEAL};
          box-shadow: 0 0 0 0 rgba(29,158,117,.7);
          animation: tl-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
        padding: "44px 24px 48px",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
        }}>
          {/* Left */}
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: ".14em",
              textTransform: "uppercase", color: TEAL, marginBottom: 14,
            }}>
              Tideline Corporate
            </div>
            <h1 style={{
              fontSize: 36, fontWeight: 700, color: WHITE,
              margin: "0 0 8px", letterSpacing: "-0.6px", lineHeight: 1.1,
            }}>
              Portfolio Intelligence
            </h1>
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,.62)", lineHeight: 1.6,
              maxWidth: 560, margin: "0 0 22px",
            }}>
              Track portfolio companies, regulators and key partners across Tideline&apos;s ocean intelligence sources. Generate a branded quarterly briefing for your investors.
            </p>
            {/* Stat pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { v: platformStats?.entities ?? "153", label: "entities monitored" },
                { v: platformStats?.sources ?? "89", label: "sources" },
                { v: "Daily", label: "updates" },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "0.5px solid rgba(255,255,255,.12)",
                  fontSize: 12, color: "rgba(255,255,255,.88)",
                }}>
                  <span style={{ fontWeight: 600, color: WHITE }}>{s.v}</span>
                  <span style={{ color: "rgba(255,255,255,.58)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px", borderRadius: 999,
            background: "rgba(29,158,117,.1)",
            border: "0.5px solid rgba(29,158,117,.28)",
            flexShrink: 0, alignSelf: "flex-start",
          }}>
            <div className="tl-pulse-dot" />
            <span style={{ fontSize: 12, color: "#A8E6C9", fontWeight: 500 }}>
              Live monitoring active
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Steps ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <StepCard
            step={1}
            state={stepState(1)}
            icon={<IconBuilding />}
            title="Add your fund"
            body="Name your fund or organisation. This appears on your briefing cover."
          />
          <StepCard
            step={2}
            state={stepState(2)}
            icon={<IconTarget />}
            title="Track entities"
            body="Add portfolio companies, regulators and partners you want to monitor."
          />
          <StepCard
            step={3}
            state={stepState(3)}
            icon={<IconDoc />}
            title="Generate briefing"
            body="Download a branded PDF briefing for your investors, on demand."
          />
        </div>

        {/* ── Empty state (no fund) ─────────────────────────── */}
        {!fundName && (
          <section style={{
            background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
            padding: "36px 32px", textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 52, height: 52, borderRadius: 12, background: TEAL_SOFT,
              color: TEAL, marginBottom: 16,
              border: `0.5px solid ${TEAL_BORDER}`,
            }}>
              <IconBuilding />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: T1, marginBottom: 6 }}>
              Name your fund to get started
            </div>
            <div style={{ fontSize: 13, color: T3, marginBottom: 22, maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.6 }}>
              This is how your briefing will be addressed, e.g. Ocean 14 Capital or WWF Ocean Programme.
            </div>
            <div style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto" }}>
              <input
                value={fundInput}
                onChange={(e) => setFundInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveFund()}
                placeholder="e.g. Ocean 14 Capital"
                autoFocus
                style={{
                  flex: 1, padding: "12px 14px", fontSize: 14, fontFamily: F, color: T1,
                  border: `0.5px solid ${BORDER}`, borderRadius: 8, outline: "none", background: WHITE,
                }}
              />
              <button onClick={saveFund} style={{
                background: TEAL, color: WHITE, border: "none", borderRadius: 8,
                padding: "12px 22px", fontSize: 14, fontWeight: 600, fontFamily: F, cursor: "pointer",
              }}>
                Continue →
              </button>
            </div>
          </section>
        )}

        {/* ── Fund bar (when set) ─────────────────────────── */}
        {fundName && (
          <section style={{
            background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
            padding: "16px 20px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: TEAL_SOFT,
                color: TEAL, display: "flex", alignItems: "center", justifyContent: "center",
                border: `0.5px solid ${TEAL_BORDER}`,
              }}>
                <IconBuilding />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T4, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 500 }}>
                  Fund
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T1 }}>
                  {fundName}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={fundInput}
                onChange={(e) => setFundInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveFund()}
                placeholder="Rename fund"
                style={{
                  padding: "8px 12px", fontSize: 12, fontFamily: F, color: T2,
                  border: `0.5px solid ${BORDER}`, borderRadius: 6, outline: "none", background: WHITE,
                  width: 220,
                }}
              />
              <button onClick={saveFund} style={{
                background: "transparent", color: T3, border: `0.5px solid ${BORDER}`, borderRadius: 6,
                padding: "8px 14px", fontSize: 12, fontWeight: 500, fontFamily: F, cursor: "pointer",
              }}>
                Update
              </button>
            </div>
          </section>
        )}

        {/* ── Entity search ───────────────────────────────── */}
        {fundName && (
          <section style={{
            background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
            padding: 22, marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 4 }}>
              Who do you want to track?
            </div>
            <div style={{ fontSize: 12, color: T3, marginBottom: 14, lineHeight: 1.5 }}>
              Search for organisations, companies, treaty bodies or individuals already in Tideline&apos;s database.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities..."
                style={{
                  flex: 1, padding: "11px 14px", fontSize: 13, fontFamily: F, color: T1,
                  border: `0.5px solid ${BORDER}`, borderRadius: 8, outline: "none",
                }}
              />
              <select
                value={pendingRel}
                onChange={(e) => setPendingRel(e.target.value as Relationship)}
                style={{
                  padding: "11px 14px", fontSize: 13, fontFamily: F, color: T1,
                  border: `0.5px solid ${BORDER}`, borderRadius: 8, background: WHITE, cursor: "pointer",
                }}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {searching && <div style={{ fontSize: 11, color: T4, padding: "6px 2px" }}>Searching...</div>}
            {searchError && (
              <div style={{
                fontSize: 12, color: "#A32D2D",
                background: "rgba(226,75,74,.08)",
                border: "0.5px solid rgba(226,75,74,.2)",
                borderRadius: 6, padding: "8px 12px", marginBottom: 8,
              }}>
                {searchError}
              </div>
            )}
            {!searching && !searchError && search.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{ fontSize: 12, color: T3, padding: "10px 12px", border: `0.5px dashed ${BORDER}`, borderRadius: 8 }}>
                No entities match &ldquo;{search}&rdquo;. Try a different search term.
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                {searchResults.map((ent) => (
                  <div
                    key={ent.id}
                    onClick={() => addEntity(ent)}
                    style={{
                      padding: "11px 14px", borderBottom: `0.5px solid ${BORDER}`,
                      cursor: "pointer", display: "flex", justifyContent: "space-between",
                      alignItems: "center", fontSize: 13, background: WHITE,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = OFF; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = WHITE; }}
                  >
                    <div>
                      <div style={{ color: T1, fontWeight: 500 }}>{ent.name}</div>
                      <div style={{ color: T4, fontSize: 11 }}>{ent.entity_type} · {ent.mention_count} mentions</div>
                    </div>
                    <div style={{ fontSize: 11, color: TEAL, fontWeight: 500 }}>
                      + Add as {RELATIONSHIPS.find((r) => r.value === pendingRel)?.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {error && (
          <div style={{
            background: "rgba(226,75,74,.08)", color: "#A32D2D",
            border: "0.5px solid rgba(226,75,74,.2)", borderRadius: 6,
            padding: "10px 14px", fontSize: 12, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* ── Tracked entity cards ───────────────────────── */}
        {fundName && (
          <section style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T1 }}>
                Tracked entities
                <span style={{ color: T4, fontWeight: 400, marginLeft: 8 }}>{portfolio.length}</span>
              </div>
            </div>

            {portfolio.length === 0 ? (
              <div style={{
                background: WHITE, border: `0.5px dashed ${BORDER}`, borderRadius: 10,
                padding: "32px 24px", textAlign: "center",
                fontSize: 13, color: T3, lineHeight: 1.6,
              }}>
                Add the organisations and companies you want to monitor. Tideline will track every mention across news, regulation and research.
              </div>
            ) : (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10,
              }}>
                {portfolio.map((p) => {
                  const ent = p.entities;
                  return (
                    <div key={p.id} style={{
                      background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
                      padding: "16px 18px", position: "relative",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 600, color: T1, lineHeight: 1.3,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {ent?.name || "Unknown entity"}
                          </div>
                          <div style={{
                            display: "inline-block", marginTop: 6,
                            padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500,
                            background: TEAL_SOFT, color: "#0F6E56",
                            border: `0.5px solid ${TEAL_BORDER}`,
                          }}>
                            {RELATIONSHIPS.find((r) => r.value === p.relationship)?.label || p.relationship}
                          </div>
                        </div>
                        <button
                          onClick={() => removeEntity(p.id)}
                          title="Remove"
                          style={{
                            background: "transparent", border: `0.5px solid ${BORDER}`,
                            color: T4, borderRadius: 6, padding: "4px 8px",
                            fontSize: 10, fontFamily: F, cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "baseline", gap: 6,
                        borderTop: `0.5px solid ${BORDER}`, paddingTop: 10, marginTop: 4,
                      }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: TEAL, lineHeight: 1 }}>
                          {ent?.mention_count ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: T3 }}>mentions</div>
                      </div>
                      <div style={{ fontSize: 10, color: T4, marginTop: 6 }}>
                        {ent?.entity_type}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Generate actions ─────────────────────────── */}
        {fundName && portfolio.length > 0 && (
          <section style={{
            background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
            padding: 20, marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T1 }}>
                Ready to generate
              </div>
              <div style={{ fontSize: 11, color: T3 }}>
                Preview the latest mentions, then download a branded PDF for {fundName}.
              </div>
            </div>
            <button
              onClick={generateBriefing}
              disabled={generating}
              style={{
                background: TEAL, color: WHITE, border: "none", borderRadius: 8,
                padding: "11px 22px", fontSize: 13, fontWeight: 600, fontFamily: F,
                cursor: generating ? "default" : "pointer", opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "Generating..." : "Generate briefing"}
            </button>
            <button
              onClick={downloadPdf}
              style={{
                background: WHITE, color: NAVY, border: `0.5px solid ${BORDER}`, borderRadius: 8,
                padding: "11px 22px", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
              }}
            >
              Download PDF
            </button>
          </section>
        )}

        {/* ── Briefing preview dashboard ──────────────────── */}
        {briefing && (
          <section style={{
            background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 10,
            borderLeft: `3px solid ${TEAL}`, padding: "22px 24px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: TEAL, marginBottom: 4 }}>
              Preview
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T1, marginBottom: 18 }}>
              Intelligence Preview
            </div>

            {/* KPI cards */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22,
            }}>
              {[
                { label: "Entities tracked", value: briefing.summary.entities_tracked },
                { label: "Stories covered", value: briefing.summary.stories_covered },
                { label: "Total mentions", value: briefing.summary.total_mentions },
              ].map((s) => (
                <div key={s.label} style={{
                  border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px",
                  background: OFF,
                }}>
                  <div style={{
                    fontSize: 10, color: T3, textTransform: "uppercase",
                    letterSpacing: ".08em", fontWeight: 500, marginBottom: 8,
                  }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 700, color: TEAL, lineHeight: 1,
                    letterSpacing: "-0.5px",
                  }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Compact table */}
            {briefing.entities.length > 0 && (
              <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: OFF }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T4, fontWeight: 600 }}>Entity</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T4, fontWeight: 600 }}>Mentions</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T4, fontWeight: 600 }}>Latest story</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T4, fontWeight: 600 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {briefing.entities.map((ent, i) => {
                      const latest = ent.stories[0];
                      return (
                        <tr key={i} style={{ borderTop: `0.5px solid ${BORDER}` }}>
                          <td style={{ padding: "11px 14px", color: T1, fontWeight: 500 }}>{ent.entity_name}</td>
                          <td style={{ padding: "11px 14px", color: TEAL, fontWeight: 600 }}>{ent.total_mentions}</td>
                          <td style={{
                            padding: "11px 14px", color: T2,
                            maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {latest?.title || "No stories yet"}
                          </td>
                          <td style={{ padding: "11px 14px", color: T4, fontSize: 11 }}>
                            {latest?.published_at ? new Date(latest.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
