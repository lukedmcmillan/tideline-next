"use client";

import { useEffect, useState, useCallback } from "react";

const TEAL = "#1D9E75";
const NAVY = "#0A1628";
const WHITE = "#FFFFFF";
const OFF = "#F8F9FA";
const BORDER = "#DADCE0";
const T1 = "#202124";
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
    const stored = localStorage.getItem("tideline_lp_fund") || "";
    setFundName(stored);
    setFundInput(stored);
    if (stored) loadPortfolio(stored).finally(() => setLoading(false));
    else {
      // Probe gate with empty fund query so we can show locked state if tier is wrong
      fetch("/api/lp-portfolios?fund_name=__probe__").then(r => {
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
      body: JSON.stringify({
        fund_name: fundName,
        entity_id: entity.id,
        relationship: pendingRel,
      }),
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

  if (loading || gated === "checking") {
    return (
      <div style={{ fontFamily: F, background: OFF, minHeight: "100vh", padding: 48, color: T4 }}>
        Loading...
      </div>
    );
  }

  if (gated === "locked") {
    return (
      <div style={{ fontFamily: F, background: OFF, minHeight: "100vh" }}>
        <div style={{ background: NAVY, padding: "48px 24px 56px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14 }}>
              Tideline Corporate
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: WHITE, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
              Portfolio Intelligence Briefing
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 560 }}>
              Track your portfolio companies and key entities across Tideline&apos;s ocean intelligence sources. Generate a branded quarterly briefing for your investors.
            </p>
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 24px" }}>
          <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 8 }}>
              This feature requires a Corporate subscription
            </div>
            <div style={{ fontSize: 13, color: T3, lineHeight: 1.6, marginBottom: 24 }}>
              LP briefings are available on the Tideline Corporate tier, designed for funds, LPs and institutional investors tracking ocean-related portfolio exposure.
            </div>
            <a href="/upgrade" style={{
              display: "inline-block", background: TEAL, color: WHITE, padding: "10px 20px",
              borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}>
              Contact us about Corporate
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F, background: OFF, minHeight: "100vh", color: T1 }}>
      <div style={{ background: NAVY, padding: "40px 24px 44px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 12 }}>
            Tideline Corporate
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: WHITE, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
            Portfolio Intelligence Briefing
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
            Track your portfolio companies and key entities across Tideline&apos;s ocean intelligence sources. Generate a branded quarterly briefing for your investors.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "32px auto", padding: "0 24px 80px" }}>
        {/* Fund name */}
        <section style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginBottom: 4 }}>
            Your organisation or fund name
          </div>
          <div style={{ fontSize: 12, color: T3, marginBottom: 12, lineHeight: 1.5 }}>
            This is how your briefing will be addressed, e.g. Ocean 14 Capital, WWF Ocean Programme.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={fundInput}
              onChange={(e) => setFundInput(e.target.value)}
              placeholder="e.g. Ocean 14 Capital"
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13, fontFamily: F, color: T1,
                border: `0.5px solid ${BORDER}`, borderRadius: 6, outline: "none", background: WHITE,
              }}
            />
            <button onClick={saveFund} style={{
              background: TEAL, color: WHITE, border: "none", borderRadius: 6,
              padding: "10px 18px", fontSize: 13, fontWeight: 500, fontFamily: F, cursor: "pointer",
            }}>
              {fundName ? "Update" : "Save"}
            </button>
          </div>
          {fundName && (
            <div style={{ fontSize: 11, color: T4, marginTop: 8 }}>
              Tracking <strong style={{ color: T1 }}>{fundName}</strong>
            </div>
          )}
        </section>

        {/* Entity search + add */}
        {fundName && (
          <section style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginBottom: 4 }}>
              Who do you want to track?
            </div>
            <div style={{ fontSize: 12, color: T3, marginBottom: 12, lineHeight: 1.5 }}>
              Search for organisations, companies, treaty bodies or individuals already in Tideline&apos;s database.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities..."
                style={{
                  flex: 1, padding: "10px 12px", fontSize: 13, fontFamily: F, color: T1,
                  border: `0.5px solid ${BORDER}`, borderRadius: 6, outline: "none",
                }}
              />
              <select
                value={pendingRel}
                onChange={(e) => setPendingRel(e.target.value as Relationship)}
                style={{
                  padding: "10px 12px", fontSize: 13, fontFamily: F, color: T1,
                  border: `0.5px solid ${BORDER}`, borderRadius: 6, background: WHITE, cursor: "pointer",
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
              <div style={{ fontSize: 12, color: T3, padding: "10px 12px", border: `0.5px dashed ${BORDER}`, borderRadius: 6 }}>
                No entities match &ldquo;{search}&rdquo;. Try a different search term.
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
                {searchResults.map((ent) => (
                  <div
                    key={ent.id}
                    onClick={() => addEntity(ent)}
                    style={{
                      padding: "10px 14px", borderBottom: `0.5px solid ${BORDER}`,
                      cursor: "pointer", display: "flex", justifyContent: "space-between",
                      alignItems: "center", fontSize: 13,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = OFF; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = WHITE; }}
                  >
                    <div>
                      <div style={{ color: T1, fontWeight: 500 }}>{ent.name}</div>
                      <div style={{ color: T4, fontSize: 11 }}>{ent.entity_type} · {ent.mention_count} mentions</div>
                    </div>
                    <div style={{ fontSize: 11, color: TEAL, fontWeight: 500 }}>+ Add as {RELATIONSHIPS.find(r => r.value === pendingRel)?.label}</div>
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

        {/* Tracked entities */}
        {fundName && (
          <section style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `0.5px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T1 }}>
                Tracked entities
              </div>
              <div style={{ fontSize: 11, color: T4 }}>{portfolio.length} active</div>
            </div>
            {portfolio.length === 0 ? (
              <div style={{ padding: "28px 24px", fontSize: 13, color: T3, textAlign: "center", lineHeight: 1.6 }}>
                Add the organisations and companies you want to monitor. Tideline will track every mention across news, regulation and research.
              </div>
            ) : (
              portfolio.map((p) => (
                <div key={p.id} style={{
                  padding: "12px 20px", borderBottom: `0.5px solid ${BORDER}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>
                      {p.entities?.name || "Unknown entity"}
                    </div>
                    <div style={{ fontSize: 11, color: T4, marginTop: 2 }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 6,
                        background: "rgba(29,158,117,.1)", color: "#0F6E56",
                        border: "0.5px solid rgba(29,158,117,.2)", fontSize: 10, fontWeight: 500,
                        marginRight: 6,
                      }}>
                        {RELATIONSHIPS.find(r => r.value === p.relationship)?.label || p.relationship}
                      </span>
                      {p.entities?.entity_type}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntity(p.id)}
                    style={{
                      background: "transparent", border: `0.5px solid ${BORDER}`,
                      color: T3, borderRadius: 6, padding: "6px 12px",
                      fontSize: 11, fontFamily: F, cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {/* Generate actions */}
        {fundName && portfolio.length > 0 && (
          <section style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={generateBriefing}
                disabled={generating}
                style={{
                  background: TEAL, color: WHITE, border: "none", borderRadius: 6,
                  padding: "10px 18px", fontSize: 13, fontWeight: 500, fontFamily: F,
                  cursor: generating ? "default" : "pointer", opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? "Generating..." : "Generate briefing"}
              </button>
              <button
                onClick={downloadPdf}
                style={{
                  background: WHITE, color: NAVY, border: `0.5px solid ${BORDER}`, borderRadius: 6,
                  padding: "10px 18px", fontSize: 13, fontWeight: 500, fontFamily: F, cursor: "pointer",
                }}
              >
                Download PDF
              </button>
            </div>
          </section>
        )}

        {/* Briefing preview */}
        {briefing && (
          <section style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: TEAL, marginBottom: 14 }}>
              Preview
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
              {[
                { label: "Entities", value: briefing.summary.entities_tracked },
                { label: "Stories", value: briefing.summary.stories_covered },
                { label: "Mentions", value: briefing.summary.total_mentions },
              ].map((s) => (
                <div key={s.label} style={{ border: `0.5px solid ${BORDER}`, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: T3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, color: TEAL, fontWeight: 600 }}>{s.value}</div>
                </div>
              ))}
            </div>
            {briefing.entities.slice(0, 5).map((ent, i) => (
              <div key={i} style={{ borderTop: `0.5px solid ${BORDER}`, padding: "12px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T1 }}>{ent.entity_name}</div>
                <div style={{ fontSize: 11, color: T4, marginBottom: 6 }}>{ent.total_mentions} mentions · {ent.relationship.replace(/_/g, " ")}</div>
                {ent.stories.slice(0, 3).map((st, j) => (
                  <div key={j} style={{ fontSize: 12, color: T3, lineHeight: 1.5 }}>
                    · {st.title} <span style={{ color: T4 }}>({st.source_name})</span>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
