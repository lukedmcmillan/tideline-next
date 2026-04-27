"use client";

import { useState } from "react";
import "@/styles/landing.css";
import EarlyAccessModal from "@/components/EarlyAccessModal";
import LandingHeader from "@/components/LandingHeader";
import HeroPulseCard from "@/components/HeroPulseCard";

// Social proof data shape — fetched server-side in page.tsx, passed down as props.
// Used by the social proof bar (Phase 3). Ignored by all other sections.
export interface SocialProof {
  entities: number;
  documents: number;
  trackers: number;
  sources: number;
  verifiedDate: string;
  isFallback: boolean;
}

export default function LandingClient({ socialProof }: { socialProof: SocialProof }) {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", background: "#fff", color: "#202124", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }}>
      {/* Promo bar */}
      <div style={{
        background: "#0B1628", color: "rgba(255,255,255,0.85)",
        padding: "9px 0", textAlign: "center",
        fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.04em",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          47 founding member spots remaining{" \u00B7 "}{"\u00A3"}39/month, locked for life{" \u00B7 "}
          <a href="#pricing" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }} style={{ color: "#1D9E75", textDecoration: "none" }}>Claim yours {"\u2192"}</a>
        </div>
      </div>

      {/* Header */}
      <LandingHeader
        onLoginClick={() => setShowEarlyAccess(true)}
        onCtaClick={() => setShowEarlyAccess(true)}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <style>{`
        .lp-hero-link:hover { color: #1D9E75 !important; border-color: #1D9E75 !important; }
        @media (max-width: 900px) {
          .lp-hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .lp-hero { padding: 28px 0 56px !important; }
        }
      `}</style>
      <section className="lp-hero" style={{ padding: "40px 0 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>

            {/* Left: copy */}
            <div>
              {/* Eyebrow */}
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#1D9E75",
                letterSpacing: "0.14em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
              }}>
                <span style={{
                  width: 6, height: 6, background: "#1D9E75", borderRadius: "50%",
                  animation: "lp-pulse 2.5s ease-in-out infinite", display: "inline-block",
                }} />
                Ocean intelligence · Live
              </div>

              {/* H1 */}
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
                fontSize: "clamp(40px,4vw,56px)", lineHeight: 1.05,
                letterSpacing: "-0.025em", color: "#0B1628", marginBottom: 20,
              }}>
                The platform of record for{" "}
                <em style={{ fontStyle: "normal", color: "#1D9E75" }}>ocean governance</em>.
              </h1>

              {/* Sub */}
              <p style={{
                fontSize: 17, lineHeight: 1.5, color: "#3A4A5C",
                maxWidth: "48ch", marginBottom: 24,
              }}>
                Watch entities, read primary sources, score regulatory activity, and receive a personalised brief before 7am.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowEarlyAccess(true)}
                  style={{
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                    background: "#0B1628", color: "white",
                    padding: "13px 22px", fontSize: 15, borderRadius: 8,
                    border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Start your 7-day free trial
                </button>
                <a
                  href="#showcase"
                  className="lp-hero-link"
                  style={{
                    fontSize: 14, color: "#0B1628", fontWeight: 600,
                    borderBottom: "1px solid #0B1628", paddingBottom: 2,
                    textDecoration: "none", transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  See the platform →
                </a>
              </div>

              {/* Trust line */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                fontFamily: "'DM Mono',monospace", fontSize: 11,
                color: "#6B7A8C", letterSpacing: "0.04em",
              }}>
                <span>No card required</span>
                <span style={{ color: "#E5E1D8" }}>·</span>
                <span>7 days full access</span>
                <span style={{ color: "#E5E1D8" }}>·</span>
                <span style={{ color: "#C97A1A", fontWeight: 500 }}>47 founding spots left</span>
              </div>
            </div>

            {/* Right: ISA Pulse card */}
            <HeroPulseCard />

          </div>
        </div>
      </section>

      {/* ── STATS BAND ───────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .lp-stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 24px !important; }
        }
      `}</style>
      <section style={{
        padding: "40px 0",
        borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8",
        background: "#F4F2EC",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-stats-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            gap: 32, maxWidth: 880, margin: "0 auto", textAlign: "center",
          }}>
            {[
              { value: "10,000+",                                    label: "primary source documents in the library" },
              { value: socialProof.entities.toLocaleString("en-GB"), label: "entities you can track"                 },
              { value: String(socialProof.trackers),                 label: "regulatory pulse domains, scored weekly" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontWeight: 500,
                  fontSize: "clamp(36px,4vw,56px)", color: "#0B1628",
                  lineHeight: 1, letterSpacing: "-0.025em", marginBottom: 10,
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 14, color: "#6B7A8C", lineHeight: 1.4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ─────────────────────────────────────────────────────── */}
      <style>{`
        .lp-sc-link { font-size: 14px; color: #0B1628; font-weight: 600; border-bottom: 1px solid #0B1628; padding-bottom: 2px; text-decoration: none; transition: color 0.15s, border-color 0.15s; }
        .lp-sc-link:hover { color: #1D9E75 !important; border-color: #1D9E75 !important; }
        @media (max-width: 900px) {
          .lp-sc-row { grid-template-columns: 1fr !important; gap: 32px !important; margin-bottom: 56px !important; }
          .lp-sc-vis-order { order: 2 !important; }
          .lp-sc-text-order { order: 1 !important; }
        }
      `}</style>
      <section id="showcase" style={{ padding: "80px 0", background: "#FAFAF7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>

          {/* Row 1: Feed */}
          <div className="lp-sc-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", marginBottom: 80 }}>
            <div className="lp-sc-text-order">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>The feed</div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(28px,2.8vw,36px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#0B1628", marginBottom: 14 }}>
                Every signal, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>one inbox</em>.
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#3A4A5C", maxWidth: "44ch", marginBottom: 16 }}>
                Continuous coverage of every story that matters across ocean governance. Tagged to entities and trackers, summarised in the platform, with the source one click away.
              </p>
              <a href="/platform/feed" className="lp-sc-link">See the feed {"\u2192"}</a>
            </div>
            <div className="lp-sc-vis-order">
              <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 12, boxShadow: "0 8px 24px rgba(11,22,40,0.05)", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #E5E1D8", marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1628", letterSpacing: "-0.01em" }}>Live feed</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", letterSpacing: "0.04em" }}>Updated 12 min ago</div>
                </div>
                {[
                  { tracker: "ISA", entity: "Pacific Minerals", time: "2h ago", headline: "ISA council defers vote on mining code amid scientific objections", source: "International Seabed Authority \u00B7 Press release" },
                  { tracker: "BBNJ", entity: "UN Treaty Collection", time: "4h ago", headline: "BBNJ ratification reaches 34 parties as Pacific bloc confirms support", source: "UN Treaty Collection \u00B7 Filing" },
                  { tracker: "IMO MEPC", entity: "ACME Shipping", time: "6h ago", headline: "MEPC 83 opens with revised CII corridor proposals on the table", source: "IMO Documents \u00B7 Working paper" },
                ].map((item, idx, arr) => (
                  <div key={item.tracker} style={{ padding: "14px 0", borderBottom: idx < arr.length - 1 ? "1px solid #EDEAE3" : "none" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "#1D9E75", background: "#E8F4EE" }}>{item.tracker}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "#6B7A8C", border: "1px solid #E5E1D8", background: "#FAFAF7" }}>{item.entity}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", marginLeft: "auto" }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.4, color: "#0B1628", fontWeight: 500, marginBottom: 4 }}>{item.headline}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C" }}>{item.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Pulse (reversed) */}
          <div className="lp-sc-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", marginBottom: 80 }}>
            <div className="lp-sc-vis-order">
              <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 12, boxShadow: "0 8px 24px rgba(11,22,40,0.05)", padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 18, borderBottom: "1px solid #E5E1D8", marginBottom: 22 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" as const }}>Updated Monday</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 19, color: "#0B1628", letterSpacing: "-0.01em" }}>BBNJ High Seas Treaty</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", border: "1px solid #E5E1D8", padding: "4px 9px", borderRadius: 99, letterSpacing: "0.06em", background: "#FAFAF7", whiteSpace: "nowrap" }}>Multilateral \u00B7 0.70x</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 22, alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 68, color: "#1D9E75", lineHeight: 0.95, fontWeight: 500, letterSpacing: "-0.04em" }}>6.4</div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#1D9E75", letterSpacing: "0.14em", marginBottom: 4, textTransform: "uppercase" as const }}>Watch</div>
                    <div style={{ fontSize: 14, color: "#0B1628", marginBottom: 6 }}>Conditions developing</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C" }}>{"\u2191"} <span style={{ color: "#1D9E75" }}>+0.6 vs last week</span></div>
                  </div>
                </div>
                <div style={{ marginBottom: 16, height: 60 }}>
                  <svg viewBox="0 0 400 64" preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
                    <defs>
                      <linearGradient id="lp-spark2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16 L 400 64 L 0 64 Z" fill="url(#lp-spark2)" />
                    <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16" fill="none" stroke="#1D9E75" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={400} cy={16} r={3.5} fill="#1D9E75" />
                  </svg>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, padding: "14px 0", borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8" }}>
                  {[{ l: "Volume", v: "7.4" }, { l: "Recency", v: "8.0" }, { l: "Decision", v: "5.5" }, { l: "Risk", v: "\u00D70.70" }].map(c => (
                    <div key={c.l}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" as const }}>{c.l}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: "#0B1628", fontWeight: 500 }}>{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lp-sc-text-order">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>The pulse</div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(28px,2.8vw,36px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#0B1628", marginBottom: 14 }}>
                Ten domains, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>scored weekly</em>.
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#3A4A5C", maxWidth: "44ch", marginBottom: 16 }}>
                A regulatory activity index calibrated against the historical record. Methodology published openly {"\u2014"} including its failure modes.
              </p>
              <a href="/methodology" className="lp-sc-link">Read the methodology {"\u2192"}</a>
            </div>
          </div>

          {/* Row 3: Workspace */}
          <div className="lp-sc-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div className="lp-sc-text-order">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>The workspace</div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(28px,2.8vw,36px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#0B1628", marginBottom: 14 }}>
                Tag the project, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>the platform builds the file</em>.
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#3A4A5C", maxWidth: "44ch", marginBottom: 16 }}>
                Build situation reports, regulatory watches, briefing notes. Tag a project {"\u2014"} primary documents from the library and stories from the feed attach automatically. Ask Tideline questions of your library, rolling out Q3 2026.
              </p>
              <a href="#" className="lp-sc-link">Tour the workspace {"\u2192"}</a>
            </div>
            <div className="lp-sc-vis-order">
              <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 12, boxShadow: "0 8px 24px rgba(11,22,40,0.05)", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E1D8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#1D9E75", background: "#E8F4EE", padding: "3px 8px", borderRadius: 99, letterSpacing: "0.06em", marginBottom: 4, display: "inline-block", textTransform: "uppercase" as const }}>Regulatory watch</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1628", letterSpacing: "-0.01em" }}>BBNJ Ratification Tracker</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", letterSpacing: "0.04em" }}>12 items {"\u00B7"} 3 new</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 300 }}>
                  <div style={{ padding: "16px 20px", borderRight: "1px solid #E5E1D8" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 10, textTransform: "uppercase" as const }}>Attached</div>
                    {[
                      { tag: "Primary \u00B7 Library", tagColor: "#1D9E75", title: "PIF Communiqu\u00E9 on BBNJ ratification commitments", meta: "PIF Secretariat \u00B7 12 Mar 2026" },
                      { tag: "Primary \u00B7 Library", tagColor: "#1D9E75", title: "UN Treaty Collection: BBNJ signatories deposited", meta: "UN Treaty Collection \u00B7 18 Apr" },
                      { tag: "Secondary \u00B7 Feed", tagColor: "#C97A1A", title: "BBNJ ratification reaches 34 parties", meta: "Reuters \u00B7 4h ago" },
                    ].map((item, i, arr) => (
                      <div key={i} style={{ padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #EDEAE3" : "none" }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" as const, color: item.tagColor }}>{item.tag}</div>
                        <div style={{ color: "#0B1628", fontSize: 12, lineHeight: 1.4, marginBottom: 3 }}>{item.title}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#9AA8B8" }}>{item.meta}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "16px 20px", background: "#FAFAF7", position: "relative" }}>
                    <div style={{ position: "absolute", top: 14, right: 14, fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#C97A1A", border: "1px solid #E8C896", background: "#FBF3E5", padding: "3px 8px", borderRadius: 99, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Q3 2026</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 10, textTransform: "uppercase" as const }}>Ask Tideline</div>
                    <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 8, padding: "10px 12px", margin: "14px 0 12px", fontSize: 12, color: "#0B1628", fontWeight: 500, lineHeight: 1.45 }}>
                      What did Pacific bloc states commit to at PrepCom III?
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: "#3A4A5C" }}>
                      The Pacific Islands Forum bloc collectively committed to depositing instruments before the second BBNJ COP<sup style={{ color: "#1D9E75", fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500 }}>{"\u00B9"}</sup>. Fiji, Palau, and the Marshall Islands have since deposited<sup style={{ color: "#1D9E75", fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500 }}>{"\u00B2"}</sup>. The bloc represents 8 of 34 ratifications.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SPLIT-SCREEN COMPARISON ──────────────────────────────────────── */}
      <style>{`
        .lp-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 980px; margin: 0 auto; }
        @media (max-width: 900px) {
          .lp-compare-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <section style={{ padding: "80px 0", background: "#FAFAF7", borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>

          {/* Head */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(28px,3vw,40px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "#0B1628", marginBottom: 12 }}>
              Two ways to <em style={{ fontStyle: "normal", color: "#1D9E75" }}>spend a week</em>.
            </h2>
            <p style={{ fontSize: 16, color: "#3A4A5C", maxWidth: "50ch", margin: "0 auto" }}>
              The same week, with and without the platform.
            </p>
          </div>

          {/* Grid */}
          <div className="lp-compare-grid">

            {/* Before */}
            <div style={{ borderRadius: 14, padding: "32px 28px", border: "1px solid #E5E1D8", background: "#F4F2EC" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "#B8A89A", marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #E5E1D8" }}>
                Without Tideline
              </div>
              {[
                { time: "Mon 6:47", text: "Coffee. Six tabs from yesterday. Skim three newsletters." },
                { time: "Mon 8:30", text: <>Partner asks about the ISA decision. <em style={{ fontStyle: "italic", color: "#8A7A6E", opacity: 0.8 }}>&ldquo;Let me get back to you on that.&rdquo;</em></> },
                { time: "Wed 11:00", text: "Building the BBNJ briefing note. Open four tabs, copy-paste, hope it's current." },
                { time: "Thu 16:30", text: <>Client asks: <em style={{ fontStyle: "italic", color: "#8A7A6E", opacity: 0.8 }}>&ldquo;what&rsquo;s Pacific Minerals doing?&rdquo;</em> You&rsquo;ll find out and circle back.</> },
                { time: "Fri 09:00", text: "Pulse on ISA crossed into elevated. You won't hear about it until next week." },
              ].map((line, i, arr) => (
                <div key={line.time + "b"} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #EDEAE3" : "none", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#C5B8AC" }}>{line.time}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.5, color: "#8A7A6E" }}>{line.text}</div>
                </div>
              ))}
            </div>

            {/* After */}
            <div style={{ borderRadius: 14, padding: "32px 28px", border: "1px solid #0B1628", background: "#FFFFFF", boxShadow: "0 12px 36px rgba(11,22,40,0.1)" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "#1D9E75", marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #E5E1D8" }}>
                With Tideline
              </div>
              {[
                { time: "Mon 6:47", text: "Brief lands. Four entities moved overnight. Two flagged." },
                { time: "Mon 8:30", text: <>Partner asks about the ISA decision. <em style={{ fontStyle: "italic", color: "#3A4A5C" }}>&ldquo;Council deferred the vote. Here&rsquo;s the citation.&rdquo;</em></> },
                { time: "Wed 11:00", text: "BBNJ project already has 12 documents attached overnight. Write, don't hunt." },
                { time: "Thu 16:30", text: <>Client asks: <em style={{ fontStyle: "italic", color: "#3A4A5C" }}>&ldquo;what&rsquo;s Pacific Minerals doing?&rdquo;</em> You already know — three signal pills.</> },
                { time: "Fri 09:00", text: "Pulse on ISA crossed into elevated. You'll see it Monday morning." },
              ].map((line, i, arr) => (
                <div key={line.time + "a"} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #EDEAE3" : "none", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#1D9E75" }}>{line.time}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.5, color: "#0B1628" }}>{line.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Close line */}
          <div style={{ textAlign: "center", marginTop: 48, maxWidth: "56ch", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "clamp(20px,2.2vw,26px)", color: "#0B1628", lineHeight: 1.35, letterSpacing: "-0.015em" }}>
              Less than <em style={{ fontStyle: "normal", color: "#1D9E75" }}>&pound;25 a week</em>. Less than a single billable hour. The week you actually want.
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#6B7A8C", letterSpacing: "0.06em", marginTop: 12 }}>
              7-day free trial · No card required · 47 founding spots remaining
            </div>
          </div>

        </div>
      </section>

      {/* ── MID-PAGE CTA STRIP ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ background: "#0B1628", padding: "48px 40px", margin: "80px 0", borderRadius: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center", maxWidth: 1120, margin: "0 auto" }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: "clamp(22px,2.2vw,28px)", lineHeight: 1.2, letterSpacing: "-0.015em", color: "white", marginBottom: 6 }}>
                Try it free for 7 days. No card required.
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                Founding member pricing locked at &pound;39/month for life. 47 spots left.
              </div>
            </div>
            <button
              onClick={() => setShowEarlyAccess(true)}
              style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, background: "white", color: "#0B1628", padding: "13px 22px", fontSize: 15, borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Start your 7-day free trial
            </button>
          </div>
        </div>
      </div>

      {/* ── SUPPORTING BAND ──────────────────────────────────────────────── */}
      <style>{`
        .lp-support-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .lp-isnt-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
        .lp-segments { display: grid; grid-template-columns: repeat(5,1fr); gap: 0; border-top: 1px solid #E5E1D8; border-bottom: 1px solid #E5E1D8; }
        @media (max-width: 900px) {
          .lp-support-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .lp-isnt-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .lp-segments { grid-template-columns: 1fr !important; }
          .lp-segment { border-right: none !important; border-bottom: 1px solid #E5E1D8 !important; }
          .lp-segment:last-child { border-bottom: none !important; }
        }
      `}</style>

      {/* Supporting band: Directory + Brief */}
      <section style={{ padding: "60px 0 100px", background: "#FAFAF7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-support-grid">

            {/* Directory card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 8px 24px rgba(11,22,40,0.05)" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 10 }}>The directory</div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22, color: "#0B1628", marginBottom: 8, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                  Every entity, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>in one place</em>.
                </h4>
                <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.55, maxWidth: "38ch" }}>
                  928 entities across companies, regulators, contractors, and financial institutions. Star the ones that matter.
                </p>
              </div>
              <div style={{ flex: 1, minHeight: 280, display: "flex", alignItems: "stretch" }}>
                {/* Directory mini */}
                <div style={{ background: "#FAFAF7", border: "1px solid #E5E1D8", borderRadius: 10, padding: 14, width: "100%" }}>
                  <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#9AA8B8" }}>
                    ⌕  Search 928 entities…
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {/* Card 1: focused + starred */}
                    <div style={{ background: "white", border: "1px solid #1D9E75", borderRadius: 6, padding: 10, position: "relative", boxShadow: "0 0 0 2px rgba(29,158,117,0.12)" }}>
                      <div style={{ position: "absolute", top: 8, right: 8, color: "#1D9E75", fontSize: 11 }}>★</div>
                      <div style={{ fontSize: 11, color: "#0B1628", fontWeight: 600, marginBottom: 4, paddingRight: 14, lineHeight: 1.3 }}>Pacific Minerals Ltd</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#9AA8B8", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" as const }}>Contractor</div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: "#C97A1A", background: "#FBF3E5", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>ISA</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: "#1D9E75", background: "#E8F4EE", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Active</span>
                      </div>
                    </div>
                    {/* Card 2 */}
                    <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 11, color: "#0B1628", fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>ACME Shipping Ltd</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#9AA8B8", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" as const }}>Operator</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: "#1D9E75", background: "#E8F4EE", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>MEPC 83</span>
                      </div>
                    </div>
                    {/* Card 3 */}
                    <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 11, color: "#0B1628", fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>Intl Seabed Authority</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#9AA8B8", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" as const }}>Regulator</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: "#1D9E75", background: "#E8F4EE", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>2 stories</span>
                      </div>
                    </div>
                    {/* Card 4: starred */}
                    <div style={{ background: "white", border: "1px solid #E5E1D8", borderRadius: 6, padding: 10, position: "relative" }}>
                      <div style={{ position: "absolute", top: 8, right: 8, color: "#1D9E75", fontSize: 11 }}>★</div>
                      <div style={{ fontSize: 11, color: "#0B1628", fontWeight: 600, marginBottom: 4, paddingRight: 14, lineHeight: 1.3 }}>BlackRock Blue Bond</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#9AA8B8", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" as const }}>Investor</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 99, color: "#C97A1A", background: "#FBF3E5", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>TNFD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brief card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 8px 24px rgba(11,22,40,0.05)" }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 10 }}>The brief</div>
                <h4 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22, color: "#0B1628", marginBottom: 8, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                  Personalised, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>before 7am</em>.
                </h4>
                <p style={{ fontSize: 14, color: "#3A4A5C", lineHeight: 1.55, maxWidth: "38ch" }}>
                  Every weekday morning, only the entities and domains you track. Sourced from the feed, scored against the trackers, quality-checked before it lands.
                </p>
              </div>
              <div style={{ flex: 1, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* iPhone frame — pixel-faithful: bezels, dynamic island */}
                <div style={{ width: 220, background: "#1d1d1f", borderRadius: 32, padding: 7, boxShadow: "inset 0 0 0 1px #3a3a3d, 0 16px 40px -8px rgba(11,22,40,0.25)" }}>
                  <div style={{ background: "#FAFAF7", borderRadius: 25, overflow: "hidden", aspectRatio: "9/17", position: "relative" }}>
                    {/* Dynamic island */}
                    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 64, height: 18, background: "#000", borderRadius: 12, zIndex: 5 }} />
                    {/* Screen content */}
                    <div style={{ padding: "32px 14px 16px", fontSize: 9 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#0B1628", marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Tideline · 6:47</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 11, color: "#0B1628", lineHeight: 1.25, marginBottom: 10, letterSpacing: "-0.01em" }}>Friday · 4 entities moved overnight</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "#1D9E75", letterSpacing: "0.12em", paddingBottom: 6, borderBottom: "1px solid #E5E1D8", marginBottom: 8, textTransform: "uppercase" as const }}>Friday 25 April</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#0B1628", marginBottom: 2, fontFamily: "'DM Sans',sans-serif" }}>Good morning.</div>
                      <div style={{ fontSize: 8, color: "#3A4A5C", lineHeight: 1.4, marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>All 4 of your tracked entities moved yesterday.</div>
                      {/* The watch */}
                      <div style={{ padding: "8px 0", borderTop: "1px solid #E5E1D8" }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 4, textTransform: "uppercase" as const }}>The watch</div>
                        <div style={{ fontSize: 8, fontWeight: 600, color: "#0B1628", lineHeight: 1.3, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>ISA defers vote on mining code</div>
                        <div style={{ fontSize: 7.5, color: "#3A4A5C", lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>Council postponed following ITLOS objections.</div>
                      </div>
                      {/* Your entities */}
                      <div style={{ padding: "8px 0", borderTop: "1px solid #E5E1D8" }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: "#9AA8B8", letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase" as const }}>Your entities</div>
                        {[
                          { dot: "#1D9E75", name: "ACME Shipping", status: "MEPC 83 papers reference fleet emissions." },
                          { dot: "#C97A1A", name: "Pacific Minerals", status: "Council deferral affects timelines." },
                        ].map(e => (
                          <div key={e.name} style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: e.dot, marginTop: 3, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 7.5, fontWeight: 600, color: "#0B1628", marginBottom: 1, fontFamily: "'DM Sans',sans-serif" }}>{e.name}</div>
                              <div style={{ fontSize: 7, color: "#3A4A5C", lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>{e.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ISN'T STRIP ──────────────────────────────────────────────────────── */}
      <section style={{ background: "#F4F2EC", padding: "40px 0", borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-isnt-grid">
            {[
              { h: "Not Google Alerts.", b: "Volume is not signal. Tideline scores activity, attributes sources, tracks how stories evolve." },
              { h: "Not a chatbot.", b: "Curated by the platform\u2019s tracking systems and verified before it lands in your inbox." },
              { h: "Not an academic database.", b: "For working professionals who need the answer in five minutes, not the literature review in five hours." },
            ].map(item => (
              <div key={item.h} style={{ textAlign: "center" }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, color: "#0B1628", marginBottom: 6, letterSpacing: "-0.015em" }}>{item.h}</h3>
                <p style={{ fontSize: 13, color: "#3A4A5C", lineHeight: 1.5 }}>{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT FOR ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", background: "#FAFAF7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: 14 }}>Built for</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(32px,3.6vw,44px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "#0B1628", marginBottom: 0 }}>
              Five sectors, <em style={{ fontStyle: "normal", color: "#1D9E75" }}>one platform</em>.
            </h2>
          </div>
          <div className="lp-segments">
            {[
              { letter: "E", name: "ESG and blue finance",   track: "Track TNFD, BBNJ, blue bonds, ISA exposure.",        get: "Portfolio intelligence with citable sources." },
              { letter: "L", name: "Marine lawyers",         track: "Track regulatory changes across IMO, ISA, FAO, OSPAR.", get: "Cited regulatory briefs in minutes." },
              { letter: "S", name: "Shipping compliance",    track: "Track IMO MEPC, MARPOL, EU MRV, port state.",        get: "Compliance window awareness early." },
              { letter: "N", name: "Conservation NGOs",      track: "Track 30x30, IUU, MPAs, consultations.",             get: "Replace six tabs and Google Alerts." },
              { letter: "C", name: "Climate finance",        track: "Track ISA, debt-for-nature, sustainable finance.",   get: "Emerging market signal early." },
            ].map((seg, i, arr) => (
              <div key={seg.letter} className="lp-segment" style={{ padding: "28px 22px", borderRight: i < arr.length - 1 ? "1px solid #E5E1D8" : "none" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 24, color: "#1D9E75", marginBottom: 12, lineHeight: 1 }}>{seg.letter}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0B1628", marginBottom: 12, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{seg.name}</div>
                <div style={{ fontSize: 12, color: "#3A4A5C", lineHeight: 1.5, marginBottom: 8 }}>{seg.track}</div>
                <div style={{ fontSize: 12, color: "#6B7A8C", lineHeight: 1.5 }}>{seg.get}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <style>{`
        .lp-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .lp-founder-grid { display: grid; grid-template-columns: 1fr 3fr; gap: 40px; align-items: center; max-width: 880px; margin: 0 auto; }
        @media (max-width: 900px) {
          .lp-pricing-grid { grid-template-columns: 1fr !important; }
          .lp-founder-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
      <section id="pricing" style={{ padding: "80px 0", background: "#F4F2EC" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>

          {/* Head */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: 14 }}>Pricing</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(32px,3.6vw,44px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "#0B1628" }}>
              One platform. <em style={{ fontStyle: "normal", color: "#1D9E75" }}>No tiers</em>.
            </h2>
          </div>

          <div className="lp-pricing-grid">

            {/* Founding Member — featured */}
            <div style={{ background: "#FFFFFF", border: "1px solid #0B1628", borderRadius: 14, padding: "32px 28px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 12px 36px rgba(11,22,40,0.12)" }}>
              {/* Badge */}
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#C97A1A", color: "white", fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 99, textTransform: "uppercase" as const, fontWeight: 500, whiteSpace: "nowrap" }}>
                47 of 50 left
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase" as const }}>Founding member</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#C97A1A", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" as const }}>Locked for life</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 48, color: "#0B1628", lineHeight: 1, marginBottom: 6, letterSpacing: "-0.035em" }}>&pound;39</div>
              <div style={{ fontSize: 13, color: "#6B7A8C", marginBottom: 24 }}>per month, forever</div>
              <div style={{ borderTop: "1px solid #E5E1D8", marginBottom: 18 }} />
              <ul style={{ listStyle: "none", marginBottom: 24, flexGrow: 1, padding: 0 }}>
                {["Full platform access", "Personalised brief", "All trackers", "Workspace and library", "All future features included"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "#3A4A5C", padding: "5px 0", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowEarlyAccess(true)} style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, background: "#0B1628", color: "white", padding: "13px", fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 10 }}>
                Start your 7-day free trial
              </button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", textAlign: "center", letterSpacing: "0.06em" }}>No card required</div>
            </div>

            {/* Individual */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 14, padding: "32px 28px", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase" as const }}>Individual</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 48, color: "#0B1628", lineHeight: 1, marginBottom: 6, letterSpacing: "-0.035em" }}>&pound;99</div>
              <div style={{ fontSize: 13, color: "#6B7A8C", marginBottom: 24 }}>per month</div>
              <div style={{ borderTop: "1px solid #E5E1D8", marginBottom: 18 }} />
              <ul style={{ listStyle: "none", marginBottom: 24, flexGrow: 1, padding: 0 }}>
                {["Full platform access", "Personalised brief", "All trackers", "Workspace and library", "Directory of 928 entities"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "#3A4A5C", padding: "5px 0", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowEarlyAccess(true)} style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, background: "transparent", color: "#0B1628", padding: "12px", fontSize: 14, borderRadius: 8, border: "1px solid #0B1628", cursor: "pointer", marginBottom: 10 }}>
                Start your 7-day free trial
              </button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", textAlign: "center", letterSpacing: "0.06em" }}>No card required</div>
            </div>

            {/* Team */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", borderRadius: 14, padding: "32px 28px", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase" as const }}>Team</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 48, color: "#0B1628", lineHeight: 1, marginBottom: 6, letterSpacing: "-0.035em" }}>&pound;699</div>
              <div style={{ fontSize: 13, color: "#6B7A8C", marginBottom: 24 }}>per month &middot; 10 seats</div>
              <div style={{ borderTop: "1px solid #E5E1D8", marginBottom: 18 }} />
              <ul style={{ listStyle: "none", marginBottom: 24, flexGrow: 1, padding: 0 }}>
                {["All Individual features", "Shared workspace", "Team admin", "Onboarding session", "Priority support"].map(f => (
                  <li key={f} style={{ fontSize: 13, color: "#3A4A5C", padding: "5px 0", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowEarlyAccess(true)} style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, background: "transparent", color: "#0B1628", padding: "12px", fontSize: 14, borderRadius: 8, border: "1px solid #0B1628", cursor: "pointer", marginBottom: 10 }}>
                Start with team plan
              </button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#9AA8B8", textAlign: "center", letterSpacing: "0.06em" }}>We&apos;ll set up your seats</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOUNDER ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 0", background: "#FAFAF7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-founder-grid">

            {/* Photo placeholder — TODO: replace with real <img> when photo is ready */}
            <div style={{ aspectRatio: "1", borderRadius: "100%", background: "radial-gradient(circle at 30% 30%, #D8D4C8, #B8B4A8 70%)", border: "1px solid #E5E1D8", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 12, fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(11,22,40,0.4)", letterSpacing: "0.08em", maxWidth: 160 }}>
              FOUNDER
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6B7A8C", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: 10 }}>Built by</div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22, color: "#0B1628", marginBottom: 12, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                One founder. <em style={{ fontStyle: "normal", color: "#1D9E75" }}>No shortcuts</em>.
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3A4A5C", marginBottom: 12, maxWidth: "56ch" }}>
                Tideline is built by Luke McMillan, a sole founder with a decade in ocean policy. Every line of code, every scraper, every editorial decision passes through one set of hands. The methodology is published openly because the person responsible for it answers for it.
              </p>
              <a href="/methodology" className="lp-sc-link">Read the longer story {"\u2192"}</a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0B1628", padding: "80px 0", textAlign: "center", color: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: "clamp(36px,4vw,56px)", color: "white", lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 16 }}>
            Start <em style={{ fontStyle: "normal", color: "#1D9E75" }}>the trial</em>.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 32, maxWidth: "50ch", marginLeft: "auto", marginRight: "auto" }}>
            Seven days. Full platform access. No card required.
          </p>
          <button
            onClick={() => setShowEarlyAccess(true)}
            style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, background: "white", color: "#0B1628", padding: "14px 28px", fontSize: 15, borderRadius: 8, border: "none", cursor: "pointer" }}
          >
            Start your 7-day free trial
          </button>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginTop: 14 }}>
            Cancel any time. Your data stays yours.
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <style>{`
        .lp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 56px; margin-bottom: 36px; }
        .lp-footer-list { list-style: none; padding: 0; margin: 0; }
        .lp-footer-list li { margin-bottom: 8px; }
        .lp-footer-list a { font-size: 13px; color: #3A4A5C; text-decoration: none; transition: color 0.15s; }
        .lp-footer-list a:hover { color: #0B1628; }
        @media (max-width: 900px) {
          .lp-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
        }
      `}</style>
      <footer style={{ background: "#FAFAF7", borderTop: "1px solid #E5E1D8", padding: "48px 0 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="lp-footer-grid">

            {/* Brand */}
            <div>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 18, color: "#0B1628", letterSpacing: "-0.015em", textDecoration: "none", marginBottom: 14 }}>
                <div style={{ width: 26, height: 26, background: "#0B1628", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>T</div>
                Tideline
              </a>
              <p style={{ fontSize: 13, color: "#3A4A5C", lineHeight: 1.6, maxWidth: "30ch", marginTop: 0 }}>
                Ocean intelligence. The platform of record.
              </p>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 14, textTransform: "uppercase" as const }}>Product</div>
              <ul className="lp-footer-list">
                <li><a href="#showcase">Platform</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="/platform/trackers">Trackers</a></li>
                <li><a href="/platform/directory">Directory</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 14, textTransform: "uppercase" as const }}>Company</div>
              <ul className="lp-footer-list">
                <li><a href="#">About</a></li>
                <li><a href="/methodology">Methodology</a></li>
                <li><a href="/legal/privacy">Privacy</a></li>
                <li><a href="/legal/terms">Terms</a></li>
              </ul>
            </div>

            {/* Stay in touch */}
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#6B7A8C", letterSpacing: "0.14em", marginBottom: 14, textTransform: "uppercase" as const }}>Stay in touch</div>
              <ul className="lp-footer-list">
                <li><a href="https://oceanrising.substack.com" target="_blank" rel="noopener noreferrer">Ocean Rising (Substack)</a></li>
                <li><a href="https://linkedin.com/company/thetideline" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom rule */}
          <div style={{ paddingTop: 20, borderTop: "1px solid #E5E1D8", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#9AA8B8", letterSpacing: "0.04em", textAlign: "center" }}>
            &copy; 2026 Tideline &middot; Built and maintained from the United Kingdom
          </div>
        </div>
      </footer>

      {showEarlyAccess && <EarlyAccessModal onClose={() => setShowEarlyAccess(false)} />}
    </div>
  );
}
