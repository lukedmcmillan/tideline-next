"use client";

import { useState } from "react";
import "@/styles/landing.css";
import EarlyAccessModal from "@/components/EarlyAccessModal";

const roles: Record<string, { q: string; body: string; feats: { icon: string; title: string; body: string }[] }> = {
  policy: {
    q: '"The consultation closes Friday. I haven\'t started the response."',
    body: 'The workspace opens on your consultation response. Sources saved from the brief in one click. /ask queries the primary document. Generate Report converts your notes to a structured submission draft. Three days of work in three hours.',
    feats: [
      { icon: '\u{1F4CB}', title: 'Deadline tracker', body: 'Every open consultation flagged with days remaining. Syncs with Google Calendar and iOS. Never miss a response window.' },
      { icon: '\u{1F50D}', title: 'Research agent', body: '/ask queries official treaty text and governing body documents. Cited answers in seconds. Primary sources only.' },
      { icon: '\u{1F4C4}', title: 'Generate Report', body: 'Notes to structured consultation response in one click. Export to Word. Your name on it.' },
    ]
  },
  finance: {
    q: '"The fund needs an ocean risk assessment by Monday."',
    body: 'Regulatory decisions, treaty developments, enforcement actions each has a material implication for blue economy positions. Tideline surfaces the movements that reprice assets before the market catches up.',
    feats: [
      { icon: '\u{1F4E1}', title: 'Live trackers', body: '10 trackers across deep-sea mining, fisheries, shipping emissions, protected areas, and blue finance. When something moves, you know.' },
      { icon: '\u{1F517}', title: 'Crosscurrent', body: 'Tideline reads across all sources and surfaces connections between them. A governance ruling that affects your investment thesis, flagged before anyone reports on it.' },
      { icon: '\u{1F3E2}', title: 'Entity directory', body: 'Every organisation, vessel, and instrument tracked across all sources. Due diligence that took weeks takes an afternoon.' },
    ]
  },
  legal: {
    q: '"The client wants a briefing on the new high seas framework by end of week."',
    body: 'The legal architecture governing ocean operations is being rewritten. Practitioners who interpret early build durable practices. Those who wait for case law lose mandates.',
    feats: [
      { icon: '\u{1F4DA}', title: 'Primary source research', body: '/ask queries only treaty text, official regulatory publications, and governing body records. Cited. Unbroken provenance.' },
      { icon: '\u2696\uFE0F', title: 'Compliance lens', body: 'Every major regulatory adoption surfaced with its compliance implications noted. Know what it means before your client asks.' },
      { icon: '\u{1F4C4}', title: 'Client-ready output', body: 'Briefings drafted from your notes. Structured. Cited. Export to Word. Billed time, not research time.' },
    ]
  },
  science: {
    q: '"A major governance decision lands at 6am. I need to understand it before the 9am meeting."',
    body: 'Research funding follows policy priorities. Research impact depends on translating findings into the rooms where decisions are made. Tideline is where science meets the room.',
    feats: [
      { icon: '\u{1F52C}', title: 'Policy intelligence, daily', body: 'Ocean governance, climate regulation, blue finance every development affecting your funding environment and research relevance.' },
      { icon: '\u{1F4CA}', title: 'Trend recognition', body: 'Patterns across trackers that surface emerging policy directions before they become settled positions.' },
      { icon: '\u{1F4B8}', title: 'Academic discount', body: '50% off Individual plan. Apply with institutional email.' },
    ]
  },
  corporate: {
    q: '"What do the new shipping emissions targets mean for our 2027 fleet and existing charters?"',
    body: 'Shipping operators, aquaculture firms, offshore energy developers. Every one watching regulations tighten. Tideline tells you what\'s coming before it\'s enacted and what it costs if you miss it.',
    feats: [
      { icon: '\u{1F6A8}', title: 'Regulatory horizon', body: 'Shipping emissions targets, fisheries reform, marine protected area designations tracked before they become compliance obligations.' },
      { icon: '\u{1F465}', title: 'Team plan', body: '10 seats. Shared projects. Institutional memory that stays when people leave.' },
      { icon: '\u{1F5C3}\uFE0F', title: 'Entity directory', body: 'Enforcement patterns, vessel records, and regulatory instruments tracked across all sources since launch.' },
    ]
  }
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"brief" | "workspace">("brief");
  const [activeRole, setActiveRole] = useState("policy");
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);

  const role = roles[activeRole];

  return (
    <div style={{ fontFamily: "'Google Sans', sans-serif", background: "#fff", color: "#202124", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }}>
      {/* Top bar */}
      <div className="topbar">
        <p>Founding member pricing closes <strong>30 April 2026</strong> {"\u00A3"}29/month, locked for life. <a href="#pricing" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }}>Claim a spot {"\u2192"}</a></p>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-mark">
              <svg viewBox="0 0 18 18" fill="none">
                <path d="M2 11 Q5.5 7 9 11 Q12.5 15 16 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 7.5 Q5.5 3.5 9 7.5 Q12.5 11.5 16 7.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="nav-logo-name">Tideline</span>
          </a>
          <div className="nav-links">
            <a href="#platform" className="nav-link">Platform</a>
            <a href="#who" className="nav-link">Who it&apos;s for</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#" className="nav-link">Methodology</a>
          </div>
          <div className="nav-actions">
            <button className="btn-text" onClick={() => setShowEarlyAccess(true)}>Log in</button>
            <button className="btn-contained" onClick={() => setShowEarlyAccess(true)}>Join early access</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section>
        <div className="hero">
          <div className="hero-left">
            <h1 className="hero-h1 fi d1">
              The platform built<br/>for the <span>ocean sector.</span>
            </h1>

            <div className="wheel-wrap fi d2">
              <div className="wheel-track">
                <div className="wheel-item">
                  <span className="w-tag wt-policy">NGO</span>
                  <span className="w-text"><strong>{"\u201C"}Consultation closes in 6 days.</strong> I haven&apos;t started.{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag wt-finance">Finance</span>
                  <span className="w-text"><strong>{"\u201C"}What are competitors investing in</strong> before the mining decision lands?{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag wt-legal">Law</span>
                  <span className="w-text"><strong>{"\u201C"}Client needs the latest position</strong> on high seas protection. Today.{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag wt-energy">Energy</span>
                  <span className="w-text"><strong>{"\u201C"}The extraction licence just moved.</strong> What does it mean for us?{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag" style={{background:"#f0fdf4",color:"#166534"}}>ESG</span>
                  <span className="w-text"><strong>{"\u201C"}We need to prove our supply chain is clean.</strong> Where do we stand?{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag" style={{background:"#fdf4ff",color:"#7e22ce"}}>Science</span>
                  <span className="w-text"><strong>{"\u201C"}When is the next IWC session</strong> and what&apos;s on the agenda?{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag" style={{background:"#fff7ed",color:"#c2410c"}}>Shipping</span>
                  <span className="w-text"><strong>{"\u201C"}New emissions rules are in force.</strong> Are we compliant?{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag" style={{background:"#eff6ff",color:"#1d4ed8"}}>Research</span>
                  <span className="w-text"><strong>{"\u201C"}Something moved in the Pacific fisheries case.</strong> I need the document.{"\u201D"}</span>
                </div>
                <div className="wheel-item">
                  <span className="w-tag wt-policy">NGO</span>
                  <span className="w-text"><strong>{"\u201C"}Consultation closes in 6 days.</strong> I haven&apos;t started.{"\u201D"}</span>
                </div>
              </div>
            </div>

            <p className="hero-body fi d3">
              The ocean sector runs across too many platforms, too many sources, and still misses things. Tideline is one destination where the live feed, the research library, the workspace, and the calendar all live together. Log on. Do the work.
            </p>

            <div className="hero-actions fi d3">
              <button className="btn-hero" onClick={() => setShowEarlyAccess(true)}>Join early access</button>
              <button className="btn-outline" onClick={() => setShowEarlyAccess(true)}>See how it works</button>
            </div>

            <div className="hero-meta fi d4">
              <span>14-day free trial</span>
              <span>Cancel any time</span>
              <span>Founding price: {"\u00A3"}29/month</span>
            </div>
          </div>

          {/* Brief card */}
          <div className="brief-card fi d3" id="platform">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-header-logo">
                  <svg viewBox="0 0 14 14" fill="none">
                    <path d="M1 8.5 Q3.5 5.5 7 8.5 Q10.5 11.5 13 8.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M1 5.5 Q3.5 2.5 7 5.5 Q10.5 8.5 13 5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="card-header-name">Tideline</span>
                <span style={{color:"rgba(255,255,255,0.2)",fontSize:"12px"}}>{"\u00B7"}</span>
                <span className="card-header-section">Live Feed</span>
              </div>
              <div className="card-header-right">
                <div className="live-sm" style={{background:"var(--green)"}}></div>
                <span className="card-header-time">06:47 BST {"\u00B7"} 1 Apr</span>
              </div>
            </div>

            <div className="tab-row">
              <div
                className={`tab${activeTab === "brief" ? " active" : ""}`}
                onClick={() => setActiveTab("brief")}
              >Live Feed</div>
              <div
                className={`tab${activeTab === "workspace" ? " active" : ""}`}
                onClick={() => setActiveTab("workspace")}
              >Workspace</div>
            </div>

            {/* Brief */}
            <div id="tab-brief" style={{ display: activeTab === "brief" ? "block" : "none" }}>
              <div className="brief-date-row">
                <span className="brief-date-label">Wednesday, 1 April 2026</span>
                <span className="brief-live"><div className="live-sm"></div>Live</span>
              </div>

              <div className="story">
                <div className="story-row1">
                  <span className="chip c-isa">Deep-sea</span>
                  <span className="story-time">05:12</span>
                </div>
                <div className="story-title">International Seabed Authority defers exploitation regulations third postponement since 2023</div>
                <div className="story-interp"><strong>What this means:</strong> Extends the legal vacuum deep-sea mining investors have been pricing in. Contractor timelines will need revising.</div>
              </div>

              <div className="story">
                <div className="story-row1">
                  <span className="chip c-bbnj">High Seas</span>
                  <span className="story-time">04:30</span>
                </div>
                <div className="story-title">High Seas Treaty PrepCom 2 advances protected area framework six articles agreed ahead of schedule</div>
                <div className="story-interp"><strong>What this means:</strong> Faster than most delegations expected. NGOs with pending area-based proposals should review against the new criteria now.</div>
              </div>

              <div className="story">
                <div className="story-row1">
                  <span className="chip c-imo">IMO</span>
                  <span className="story-time">03:55</span>
                </div>
                <div className="story-title">IMO MEPC 82 adopts 2030 GHG intensity targets stricter than the proposed CII amendment</div>
                <div className="story-interp"><strong>What this means:</strong> Fleet planning for 2027{"\u2013"}2030 faces material compliance cost revision. Legal exposure for existing charters is now live.</div>
              </div>

              <div className="story">
                <div className="story-row1">
                  <span className="chip c-ospar">OSPAR</span>
                  <span className="story-time">02:18</span>
                </div>
                <div className="story-title">OSPAR MPA network consultation closes 15 April 8 working days remaining</div>
                <div className="story-interp"><strong>What this means:</strong> Draft criteria would affect 34 offshore energy licence areas in UK and Norwegian waters.</div>
              </div>

              <div className="brief-foot">
                <span className="brief-foot-stat"><strong>100+</strong> sources {"\u00B7"} <strong>14</strong> stories today</span>
                <span className="brief-foot-link">Open full brief {"\u2192"}</span>
              </div>
            </div>

            {/* Workspace */}
            <div id="tab-workspace" className={`ws-panel${activeTab === "workspace" ? " show" : ""}`}>
              <div className="ws-layout">
                <div className="ws-editor">
                  <div className="ws-title">OSPAR Consultation Response NE Atlantic MPA Network</div>
                  <div className="ws-body">The proposed network designates 34 areas across UK and Norwegian waters. Current draft criteria would affect existing offshore energy licences in...</div>
                  <div className="ws-ask">
                    <span className="ws-cmd">Search</span>
                    <span className="ws-q">What does OSPAR Annex V say about energy infrastructure exemptions?</span>
                  </div>
                  <div className="ws-answer">
                    Annex V, Article 4(2) provides that existing licensed activities may continue subject to a compatibility review within 18 months of designation. States retain discretion over enforcement timing within that window.
                    <cite className="ws-cite">Source: OSPAR Convention Annex V (1992, amended 2021) {"\u00B7"} Tier 1 verified</cite>
                  </div>
                </div>
                <div className="ws-sidebar">
                  <div className="ws-sidebar-label">Saved sources</div>
                  <div className="ws-source">
                    <div className="ws-src-tag">OSPAR</div>
                    <div className="ws-src-title">NE Atlantic MPA draft consultation criteria</div>
                  </div>
                  <div className="ws-source">
                    <div className="ws-src-tag">IMO</div>
                    <div className="ws-src-title">MEPC 82 GHG intensity decision text</div>
                  </div>
                  <div className="ws-source">
                    <div className="ws-src-tag">High Seas</div>
                    <div className="ws-src-title">Protected area framework draft text</div>
                  </div>
                </div>
              </div>
              <div className="ws-generate">
                <span className="ws-gen-label">3 sources {"\u00B7"} 4 notes {"\u00B7"} deadline in 8 days</span>
                <button className="ws-gen-btn">Generate Report {"\u2192"}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why now */}
      <section className="why">
        <div className="why-inner">
          <span className="section-label">Why now</span>
          <h2 className="section-title" style={{color:"#fff"}}>The ocean is where the next decade gets decided.</h2>
          <p className="section-sub">The ocean now sits at the centre of the energy transition, the climate crisis, the biggest shift in international law in a generation, and a wave of capital looking for somewhere to go. The professionals navigating that shift are currently doing it without the tools the moment requires.</p>

          <div className="why-grid">
            <div className="why-card">
              <span className="wc-sector">Energy</span>
              <div className="wc-title">Offshore wind, tidal, and deep-sea minerals</div>
              <div className="wc-body">More clean energy investment is flowing into the ocean than any other single domain. The licensing, the legal disputes, the environmental reviews, and the geopolitical arguments about who owns what are all happening at once.</div>
              <div className="wc-tags">
                <span className="wc-tag">Offshore wind</span>
                <span className="wc-tag">Deep-sea mining</span>
                <span className="wc-tag">Tidal</span>
              </div>
            </div>
            <div className="why-card">
              <span className="wc-sector">Climate &amp; Carbon</span>
              <div className="wc-title">Blue carbon and the ocean&apos;s role in net zero</div>
              <div className="wc-body">The ocean absorbs 90% of excess heat. Blue carbon, marine CDR, and ocean-based ecosystem protection are now central to every serious net-zero strategy.</div>
              <div className="wc-tags">
                <span className="wc-tag">Blue carbon</span>
                <span className="wc-tag">30x30</span>
                <span className="wc-tag">Marine CDR</span>
              </div>
            </div>
            <div className="why-card">
              <span className="wc-sector">Capital &amp; Finance</span>
              <div className="wc-title">Blue economy investment at scale</div>
              <div className="wc-body">Sovereign wealth funds, development finance, and ESG frameworks are converging on the ocean. The assets are material. The intelligence infrastructure wasn&apos;t. Until now.</div>
              <div className="wc-tags">
                <span className="wc-tag">Blue bonds</span>
                <span className="wc-tag">Ocean risk</span>
                <span className="wc-tag">Nature finance</span>
              </div>
            </div>
            <div className="why-card">
              <span className="wc-sector">Food &amp; Fisheries</span>
              <div className="wc-title">Who controls the global protein supply</div>
              <div className="wc-body">Fisheries supply protein for 3 billion people. Subsidy reform, IUU enforcement, and aquaculture regulation are reshaping who controls that supply chain.</div>
              <div className="wc-tags">
                <span className="wc-tag">IUU fishing</span>
                <span className="wc-tag">Subsidy reform</span>
                <span className="wc-tag">Aquaculture</span>
              </div>
            </div>
            <div className="why-card">
              <span className="wc-sector">Law &amp; Governance</span>
              <div className="wc-title">A legal architecture being built in real time</div>
              <div className="wc-body">New international frameworks are creating enforceable rights and obligations over ocean space for the first time. For lawyers, consultants, and policy teams, this is the most consequential shift in international law in a generation.</div>
              <div className="wc-tags">
                <span className="wc-tag">Treaty law</span>
                <span className="wc-tag">Marine governance</span>
                <span className="wc-tag">Shipping regulation</span>
              </div>
            </div>
            <div className="why-card">
              <span className="wc-sector">Geopolitics</span>
              <div className="wc-title">The ocean as contested territory</div>
              <div className="wc-body">Arctic access, undersea cable security, deep-sea resource rights, contested maritime boundaries. The ocean is no longer background. It&apos;s the stage.</div>
              <div className="wc-tags">
                <span className="wc-tag">Arctic</span>
                <span className="wc-tag">Cable security</span>
                <span className="wc-tag">Boundaries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="section" id="platform-features">
        <span className="section-label">The platform</span>
        <h2 className="section-title">Everything you need. One place. All day.</h2>
        <p className="section-sub">The workspace is where the work happens. The research library finds the answer. The live feed keeps you across everything. The calendar keeps you on time. And Crosscurrent, only on Tideline, surfaces connections across 100+ sources before anyone else sees them.</p>

        {/* Interpretation callout */}
        <div style={{background:"var(--blue-pale)",borderLeft:"3px solid var(--blue)",borderRadius:"0 var(--radius-md) var(--radius-md) 0",padding:"20px 24px",marginBottom:"40px",display:"flex",gap:"20px",alignItems:"flex-start"}}>
          <div style={{flexShrink:0,marginTop:"2px"}}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#1D9E75" strokeWidth="1.5"/><path d="M9 8v5M9 6v.01" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{fontSize:"14px",fontWeight:600,color:"var(--blue)",marginBottom:"6px",fontFamily:"'Google Sans',sans-serif"}}>What this means: Tideline&apos;s defining feature</div>
            <div style={{fontSize:"15px",color:"var(--ink)",lineHeight:1.7}}>Most intelligence tools make you read everything to find out what matters. Tideline&apos;s feed is designed so you don&apos;t have to. Each story carries enough context to triage in seconds. Relevant to your work right now, or not. The ones that are, you follow through to the source. <strong>100+ sources. Continuously updated. Five minutes to know what moved.</strong></div>
          </div>
        </div>

        <div className="features-grid">
          <div className="feat">
            <span className="feat-num">01 {"\u00B7"} Production</span>
            <div className="feat-title">Workspace &amp; Generate Report</div>
            <div className="feat-body">Save sources, annotate, draft. Notes convert to a structured report in one click. Export to Word or PDF. Your name on it. Tideline invisible.</div>
            <div className="feat-note">The consultation response that takes <strong>three days</strong> takes <strong>three hours.</strong> The client briefing that required a morning of research arrives before your second coffee.</div>
          </div>
          <div className="feat">
            <span className="feat-num">02 {"\u00B7"} Research</span>
            <div className="feat-title">The research library</div>
            <div className="feat-body">Every primary governing body document: treaty text, official publications, regulatory records, in one searchable library. Ask real questions in plain language and get direct answers with full source attribution.</div>
            <div className="feat-note"><strong>Sources identified as primary or secondary</strong> on every answer, so you can follow the chain yourself. No guessing where it came from. No dead ends.</div>
          </div>
          <div className="feat">
            <span className="feat-num">03 {"\u00B7"} Intelligence</span>
            <div className="feat-title">The live feed</div>
            <div className="feat-body">100+ sources monitored continuously. When something moves: a regulatory decision, a governance development, an enforcement action, it appears. Summarised clearly enough to know in seconds whether it&apos;s relevant to your work. One click to the original source if it is.</div>
            <div className="feat-note"><strong>Not a news feed.</strong> Every story carries enough context to triage instantly. The ones that matter, you follow. The ones that don&apos;t, you skip.</div>
          </div>
          <div className="feat">
            <span className="feat-num">04 {"\u00B7"} Calendar</span>
            <div className="feat-title">Regulatory calendar</div>
            <div className="feat-body">Every consultation deadline, treaty meeting, and regulatory decision date in one calendar. Syncs with Google Calendar and iOS. Deadlines visible before they bite.</div>
            <div className="feat-note"><strong>Sync with your own calendar.</strong> Deadlines appear alongside your existing commitments. Nothing slips.</div>
          </div>
          <div className="feat">
            <span className="feat-num">05 {"\u00B7"} Monitoring</span>
            <div className="feat-title">Live trackers</div>
            <div className="feat-body">10 trackers across ocean governance, blue finance, shipping, fisheries enforcement, and conservation. Built from primary sources. When something moves, you know immediately.</div>
            <div className="feat-note"><strong>Deadline calendar included.</strong> Every consultation close, treaty session, and regulatory decision date visible in one place. Syncs with Google Calendar and iOS.</div>
          </div>
          <div className="feat" style={{border:"2px solid var(--blue)",position:"relative"}}>
            <div style={{position:"absolute",top:"-1px",right:"16px",background:"var(--blue)",color:"#fff",fontFamily:"'Google Sans Mono',monospace",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",padding:"3px 8px",borderRadius:"0 0 4px 4px"}}>Only on Tideline</div>
            <span className="feat-num">06 {"\u00B7"} Intelligence</span>
            <div className="feat-title">Crosscurrent</div>
            <div className="feat-body">Tideline reads across 100+ sources simultaneously and surfaces connections that no individual source would make. A shipping enforcement action that connects to a blue finance disclosure that connects to a governance ruling, flagged before anyone reports on it.</div>
            <div className="feat-note"><strong>Not tracker-to-tracker.</strong> Source-to-source, across the entire library. The pattern beneath the surface, visible the moment it forms.</div>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="who" id="who">
        <div className="section">
          <span className="section-label">Who it&apos;s for</span>
          <h2 className="section-title">Same platform. Different problem. Different output.</h2>

          <div className="role-tabs">
            {[
              { key: "policy", label: "NGO & Policy" },
              { key: "finance", label: "Investment & Finance" },
              { key: "legal", label: "Law & Compliance" },
              { key: "science", label: "Science & Research" },
              { key: "corporate", label: "Corporate & Industry" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`role-tab${activeRole === key ? " active" : ""}`}
                onClick={() => setActiveRole(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="role-grid">
            <div className="role-scene">
              <span className="role-scene-label">The situation</span>
              <div className="role-scene-q">{role.q}</div>
              <div className="role-scene-body">{role.body}</div>
            </div>
            <div className="role-feats">
              {role.feats.map((f, i) => (
                <div className="role-feat" key={i}>
                  <div className="rf-icon">{f.icon}</div>
                  <div>
                    <div className="rf-title">{f.title}</div>
                    <div className="rf-body">{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof */}
      <div className="proof">
        <div className="proof-inner">
          <span className="proof-label">Read by professionals at</span>
          <div className="proof-sep"></div>
          <div className="proof-pills">
            <span className="proof-pill">Ocean conservation NGOs</span>
            <span className="proof-pill">Blue economy funds</span>
            <span className="proof-pill">Maritime law firms</span>
            <span className="proof-pill">Government advisory bodies</span>
            <span className="proof-pill">Offshore energy operators</span>
            <span className="proof-pill">ESG research teams</span>
            <span className="proof-pill">Shipping companies</span>
            <span className="proof-pill">Marine research institutes</span>
          </div>
        </div>
      </div>

      {/* Live threads */}
      <section style={{borderTop:"1px solid var(--border)",padding:"80px 24px",background:"#fff"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <span className="section-label">What Tideline is watching</span>
          <h2 className="section-title" style={{marginBottom:"12px"}}>Some stories take months to resolve.</h2>
          <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,maxWidth:"580px",marginBottom:"48px"}}>Tideline tracks long-running threads across governance, finance, science, and enforcement. When one thread moves another, it flags the connection. These are a few of what it is watching right now.</p>

          <div style={{border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",overflow:"hidden"}}>
            <div className="thread-header">
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--tertiary)"}}>Last signal</div>
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--tertiary)"}}>Thread</div>
              <div className="thread-col-domain" style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--tertiary)"}}>Domain</div>
            </div>

            <div className="thread-row">
              <div className="thread-signal">2 days ago</div>
              <div className="thread-content">
                <div className="thread-title">Seabed mining code: contractor pipeline vs moratorium coalition</div>
                <div className="thread-body">Whether the International Seabed Authority finalises a mining code before the next Council session, or whether the Pacific states coalition stalls it again. Three sponsored contractors in the queue.</div>
                <div className="thread-domain-mobile">Governance {"\u00B7"} Finance</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Governance {"\u00B7"} Finance</div>
            </div>

            <div className="thread-row">
              <div className="thread-signal">4 days ago</div>
              <div className="thread-content">
                <div className="thread-title">Blue bond credibility: which issuers are declining independent audits</div>
                <div className="thread-body">Whether blue bonds issued by sovereigns and corporations are financing activities that can be independently verified as ocean-positive, or whether certification frameworks are insufficiently rigorous.</div>
                <div className="thread-domain-mobile">Finance {"\u00B7"} ESG</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Finance {"\u00B7"} ESG</div>
            </div>

            <div className="thread-row">
              <div className="thread-signal">5 days ago</div>
              <div className="thread-content">
                <div className="thread-title">Shipping ESG disclosures vs what vessel tracking data actually shows</div>
                <div className="thread-body">Whether the emissions disclosures of major shipping companies match what independent vessel tracking shows on route planning, speed, and actual fuel burn.</div>
                <div className="thread-domain-mobile">Shipping {"\u00B7"} ESG</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Shipping {"\u00B7"} ESG</div>
            </div>

            <div className="thread-row">
              <div className="thread-signal">1 week ago</div>
              <div className="thread-content">
                <div className="thread-title">Illegally caught fish entering certified supply chains through weak port inspection</div>
                <div className="thread-body">Whether the Port State Measures Agreement is being meaningfully enforced in major transhipment ports, or whether illegally caught fish is reaching certified supply chains.</div>
                <div className="thread-domain-mobile">Fisheries {"\u00B7"} Trade</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Fisheries {"\u00B7"} Trade</div>
            </div>

            <div className="thread-row">
              <div className="thread-signal">1 week ago</div>
              <div className="thread-content">
                <div className="thread-title">30x30 marine targets: genuine protection or paper parks</div>
                <div className="thread-body">Whether states are designating marine protected areas with genuine ecological coverage, or hitting the number by designating areas of low commercial value that constrain nothing.</div>
                <div className="thread-domain-mobile">Governance {"\u00B7"} Science</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Governance {"\u00B7"} Science</div>
            </div>

            <div className="thread-row" style={{borderBottom:"none"}}>
              <div className="thread-signal">9 days ago</div>
              <div className="thread-content">
                <div className="thread-title">Nature risk reporting: whether ocean is being systematically excluded from TNFD disclosures</div>
                <div className="thread-body">Whether financial institutions aligning to TNFD are including material ocean dependencies, or whether ocean risk is treated as outside the scope of nature finance.</div>
                <div className="thread-domain-mobile">Finance {"\u00B7"} ESG</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Finance {"\u00B7"} ESG</div>
            </div>
          </div>

          <div style={{marginTop:"16px",fontSize:"13px",color:"var(--tertiary)",fontFamily:"'Google Sans Mono',monospace"}}>
            30 active threads tracked. Crosscurrent alerts subscribers when threads intersect across sources.
          </div>
        </div>
      </section>

      {/* What it replaces */}
      <div style={{borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",background:"var(--surface)",padding:"48px 24px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <span className="section-label">What it replaces</span>
          <h2 className="section-title" style={{marginBottom:"12px"}}>No more 40 tabs. One destination. Log on. Do the work.</h2>
          <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,maxWidth:"600px",marginBottom:"40px"}}>Before Tideline, working in the ocean sector meant your day scattered across platforms that didn&apos;t talk to each other newsletters, search, document databases, spreadsheets, email threads. Tideline is where all of it lives instead.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="replaces-grid">
            <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"28px"}}>
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--tertiary)",marginBottom:"20px"}}>Before</div>
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--red)",flexShrink:0,marginTop:"1px"}}>{"\u2717"}</span> Overlapping newsletters, none telling you what it means
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--red)",flexShrink:0,marginTop:"1px"}}>{"\u2717"}</span> Manual searches through primary documents 45 minutes per query
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--red)",flexShrink:0,marginTop:"1px"}}>{"\u2717"}</span> Reports and responses drafted from scratch every time
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--red)",flexShrink:0,marginTop:"1px"}}>{"\u2717"}</span> Deadlines missed. Connections between developments missed.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--red)",flexShrink:0,marginTop:"1px"}}>{"\u2717"}</span> Work scattered across platforms that don&apos;t talk to each other
                </div>
              </div>
            </div>
            <div style={{background:"#fff",border:"2px solid var(--blue)",borderRadius:"var(--radius-lg)",padding:"28px"}}>
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--blue)",marginBottom:"20px"}}>With Tideline</div>
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> One brief. 100+ sources. What happened and what it matters.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> /ask finds the primary source answer in seconds.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> Reports generated from your notes. Hours, not days.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> Every deadline in your calendar. Nothing slips.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> One destination. Log on. Do the work.
                </div>
              </div>
            </div>
            <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"28px"}}>
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--tertiary)",marginBottom:"20px"}}>What you get back</div>
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> 3{"\u2013"}4 hours per week
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> Confidence you haven&apos;t missed something
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> Output quality cited, structured, primary-sourced
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> Institutional memory that outlasts any one person
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> The ability to respond first
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Founder quote */}
      <div style={{borderTop:"1px solid var(--border)",padding:"64px 24px",background:"#fff"}}>
        <div style={{maxWidth:"720px",margin:"0 auto",textAlign:"center"}}>
          <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--blue)",marginBottom:"28px"}}>From the founder</div>
          <blockquote style={{fontFamily:"'Google Sans Display','Google Sans',sans-serif",fontSize:"clamp(20px,2.5vw,26px)",fontWeight:400,color:"var(--ink)",lineHeight:1.55,letterSpacing:"-0.01em",marginBottom:"32px",fontStyle:"normal"}}>
            {"\u201C"}I built Tideline because it didn&apos;t exist. Every day working in the ocean sector meant too many tabs, too many sources, work scattered across platforms that didn&apos;t talk to each other. I needed one place to read, research, draft, track, and produce.
            <br/><br/>
            This is that place.{"\u201D"}
          </blockquote>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"var(--ink)",display:"grid",placeItems:"center",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 11 Q5.5 7 9 11 Q12.5 15 16 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M2 7.5 Q5.5 3.5 9 7.5 Q12.5 11.5 16 7.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:"14px",fontWeight:500,color:"var(--ink)"}}>Luke McMillan</div>
              <div style={{fontSize:"13px",color:"var(--tertiary)"}}>Founder, Tideline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <section className="section" id="pricing">
        <span className="section-label">Pricing</span>
        <h2 className="section-title">14 days free. No card. No commitment.</h2>
        <p className="section-sub">Start with a full trial. Cancel any time. If you&apos;re reading this before 30 April 2026, founding member pricing {"\u00A3"}29/month, locked for life is still available.</p>

        {/* Founding member prominence */}
        <div style={{background:"var(--ink)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
          <div>
            <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>Founding Member closes 30 April 2026</div>
            <div style={{fontSize:"16px",fontWeight:500,color:"#fff"}}>{"\u00A3"}29/month. Full platform. Locked for life. <span style={{color:"rgba(255,255,255,0.5)",fontWeight:400}}>Not a discount an identity.</span></div>
          </div>
          <button className="p-btn p-btn-filled" style={{whiteSpace:"nowrap",padding:"10px 24px",background:"var(--blue)",borderRadius:"var(--radius-md)"}} onClick={() => setShowEarlyAccess(true)}>Claim a founding spot {"\u2192"}</button>
        </div>

        <div className="pricing-grid">
          <div className="p-card">
            <div className="p-head">
              <span className="p-tier">Founding Member</span>
              <div className="p-price">{"\u00A3"}29<sub>/mo</sub></div>
              <div className="p-per">Locked for life. Never increases.</div>
              <div className="p-desc">Full platform access at the price that reflects where Tideline is now. Not a discount. An identity.</div>
              <div className="p-badge">Closes 30 Apr 2026</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Live feed: 100+ sources, updated continuously</li>
                <li>10 live regulatory trackers</li>
                <li>Workspace with /ask: primary sources only</li>
                <li>Generate Report to Word or PDF</li>
                <li>Entity directory</li>
              </ul>
              <button className="p-btn p-btn-tonal" onClick={() => setShowEarlyAccess(true)}>Claim founding member spot</button>
            </div>
          </div>

          <div className="p-card featured">
            <div className="p-head">
              <span className="p-tier">Individual</span>
              <div className="p-price">{"\u00A3"}79<sub>/mo</sub></div>
              <div className="p-per">or {"\u00A3"}790/year two months free</div>
              <div className="p-desc">For the professional who needs to know, stay ahead, and produce before the working day starts.</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Everything in Founding Member</li>
                <li>Cross-tracker connections automatic</li>
                <li>Regulatory deadline calendar</li>
                <li>Unlimited /ask queries</li>
                <li>Priority support</li>
              </ul>
              <button className="p-btn p-btn-filled" onClick={() => setShowEarlyAccess(true)}>Join early access</button>
            </div>
          </div>

          <div className="p-card">
            <div className="p-head">
              <span className="p-tier">Team</span>
              <div className="p-price">{"\u00A3"}399<sub>/mo</sub></div>
              <div className="p-per">10 seats. Intelligence that outlasts anyone.</div>
              <div className="p-desc">For organisations where ocean intelligence needs to be shared and built into institutional memory.</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Everything in Individual</li>
                <li>10 seats with shared workspace</li>
                <li>Institutional memory stays when people leave</li>
                <li>Reports with full provenance trail</li>
                <li>Priority support</li>
              </ul>
              <button className="p-btn p-btn-outlined" onClick={() => setShowEarlyAccess(true)}>Talk to us</button>
            </div>
          </div>
        </div>

        <p className="p-note">
          NGO or academic? <a href="#" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }}>50% off apply here</a> &nbsp;{"\u00B7"}&nbsp;
          Need more than 10 seats? <a href="#" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }}>Enterprise pricing</a>
        </p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">Tideline</div>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Source methodology</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          <span className="footer-copy">{"\u00A9"} 2026 Tideline</span>
        </div>
      </footer>

      {showEarlyAccess && <EarlyAccessModal onClose={() => setShowEarlyAccess(false)} />}
    </div>
  );
}
