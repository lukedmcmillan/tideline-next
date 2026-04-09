"use client";

import { useState } from "react";
import "@/styles/landing.css";
import EarlyAccessModal from "@/components/EarlyAccessModal";
import Header from "@/components/Header";

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
  const [activeRole, setActiveRole] = useState("policy");
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);

  const role = roles[activeRole];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", background: "#fff", color: "#202124", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }}>
      {/* Promo bar */}
      <div className="topbar" style={{background:"#0A1628",color:"#fff",padding:"10px 16px",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.12em"}}>
        <p style={{margin:0}}>47 FOUNDING MEMBER SPOTS REMAINING. {"\u00A3"}39/MONTH, LOCKED FOR LIFE. <a href="#pricing" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }} style={{color:"#1D9E75",textDecoration:"none",marginLeft:"8px"}}>CLAIM YOURS {"\u2192"}</a></p>
      </div>

      {/* Nav */}
      <Header
        onLoginClick={() => setShowEarlyAccess(true)}
        onJoinClick={() => setShowEarlyAccess(true)}
      />

      {/* Hero */}
      <section>
        <div className="hero">
          <div className="hero-left">
            <h1 className="hero-h1-new fi d1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"48px",lineHeight:1.08,letterSpacing:"-0.025em",margin:0,marginBottom:"28px"}}>
              <span style={{color:"#0A1628"}}>The ocean sector finally</span><br/>
              <span style={{color:"#1D9E75"}}>has a room of its own.</span>
            </h1>

            <div className="mobile-only" style={{marginTop:"24px"}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:"#202124",lineHeight:1.7,margin:0}}>
                Every professional in the ocean sector is duct-taping together sources that were never designed to talk to each other. <span style={{fontWeight:600}}>Tideline is the one place where the feed, the research, the trackers and the workspace live together.</span> Log on. Do the work.
              </p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:"#202124",lineHeight:1.7,margin:"16px 0 0"}}>
                Tideline is the workspace where your actual work happens. Where you research, write, track, and produce {"\u2014"} with every piece of intelligence you need already inside it, updated in real time, filtered to your sector and your topics. The brief is one feature. The platform is the product.
              </p>
            </div>

            <p className="hero-body hero-deck-new fi d3" style={{fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:"16px",color:"#5F6368",lineHeight:1.7}}>
              Whether you{"\u2019"}re protecting it, investing in it, regulating it, navigating it, or reporting on it, Tideline is where you stay ahead.
            </p>

            <div className="hero-actions fi d3">
              <button className="btn-hero" onClick={() => setShowEarlyAccess(true)}>Start your free 7-day trial</button>
              <a href="/demo" className="btn-outline">See the platform in action</a>
            </div>

            <div className="hero-meta fi d4" style={{display:"flex",gap:"16px",flexWrap:"wrap",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#9AA0A6"}}>
              <span><span style={{color:"#1D9E75",marginRight:"4px"}}>{"\u2713"}</span>No card required</span>
              <span><span style={{color:"#1D9E75",marginRight:"4px"}}>{"\u2713"}</span>Cancel any time</span>
              <span><span style={{color:"#1D9E75",marginRight:"4px"}}>{"\u2713"}</span>Full access from day one</span>
            </div>
          </div>
          <div className="hero-right">
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
          </div>
        </div>
      </section>

      {/* Emotional beat */}
      <div style={{background:"#0A1628",padding:"80px 24px",textAlign:"center"}}>
        <div style={{maxWidth:"640px",margin:"0 auto"}}>
          <p style={{fontWeight:300,fontSize:"20px",color:"#fff",lineHeight:1.7,marginBottom:"24px",marginTop:0}}>
            You know that feeling when someone in the meeting knows something you don{"\u2019"}t. When a client asks about something that happened last week and you weren{"\u2019"}t across it. When you realise you{"\u2019"}ve been behind and nobody told you.
          </p>
          <p style={{fontWeight:700,fontSize:"20px",color:"#fff",margin:0}}>
            That feeling is what Tideline removes. Not occasionally. Every single day.
          </p>
        </div>
      </div>

      {/* Mobile social proof strip */}
      <div className="mobile-only" style={{background:"#FAFAFA",borderBottom:"1px solid #DADCE0",padding:"20px"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#9AA0A6",textAlign:"center",marginBottom:"14px",letterSpacing:"0.12em"}}>TRUSTED BY OCEAN PROFESSIONALS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",textAlign:"center"}}>
          {[{n:"100+",l:"SOURCES MONITORED"},{n:"45 sec",l:"TO A CITED BRIEF"},{n:"24/7",l:"LIVE TRACKING"}].map((s)=>(
            <div key={s.l}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",letterSpacing:"-0.03em"}}>{s.n}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#9AA0A6",marginTop:"2px"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",border:"1px solid #DADCE0",borderRadius:"10px",padding:"14px",marginTop:"14px"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:400,fontStyle:"italic",fontSize:"13px",color:"#333",lineHeight:1.6}}>
            {"\u201C"}I found a regulatory development my client needed in under a minute. That would have been three hours of searching before Tideline.{"\u201D"}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginTop:"10px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#0A1628",display:"grid",placeItems:"center",flexShrink:0,color:"#1D9E75",fontFamily:"'DM Mono',monospace",fontSize:"10px"}}>SR</div>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"12px",color:"#0A1628"}}>S. Reyes</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:"11px",color:"#9AA0A6"}}>Maritime Lawyer, London</div>
            </div>
          </div>
        </div>
      </div>

      <div className="desktop-only">
      {/* Why now */}
      <section className="why">
        <div className="why-inner">
          <span className="section-label">Why now</span>
          <h2 className="section-title" style={{color:"#fff"}}>The ocean is where the next decade gets decided.</h2>
          <p className="section-sub">The ocean now sits at the centre of the energy transition, the climate crisis, the biggest shift in international law in a generation, and a wave of capital looking for somewhere to go. The professionals navigating that shift are currently doing it without the tools the moment requires.</p>

          <div className="why-chips">
            {["Energy","Climate & Carbon","Capital & Finance","Food & Fisheries","Law & Governance","Geopolitics"].map(c=>(
              <span key={c} className="why-chip">{c}</span>
            ))}
          </div>

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
          <div className="feat" style={{borderLeft:"3px solid #1D9E75"}}>
            <span className="feat-num">01 {"\u00B7"} Production</span>
            <div className="feat-title" style={{fontSize:"19px"}}>Workspace &amp; Generate Report</div>
            <div className="feat-body">Save sources, annotate, draft. Notes convert to a structured report in one click. Export to Word or PDF. Your name on it. Tideline invisible.</div>
            <div className="feat-note">The consultation response that takes <strong>three days</strong> takes <strong>three hours.</strong> The client briefing that required a morning of research arrives before your second coffee.</div>
          </div>
          <div className="feat" style={{borderLeft:"3px solid #1D9E75"}}>
            <span className="feat-num">02 {"\u00B7"} Research</span>
            <div className="feat-title" style={{fontSize:"19px"}}>The research library</div>
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

            <div className="thread-row" style={{borderBottom:"none"}}>
              <div className="thread-signal">5 days ago</div>
              <div className="thread-content">
                <div className="thread-title">Shipping ESG disclosures vs what vessel tracking data actually shows</div>
                <div className="thread-body">Whether the emissions disclosures of major shipping companies match what independent vessel tracking shows on route planning, speed, and actual fuel burn.</div>
                <div className="thread-domain-mobile">Shipping {"\u00B7"} ESG</div>
              </div>
              <div className="thread-col-domain thread-domain-label">Shipping {"\u00B7"} ESG</div>
            </div>
          </div>

          <div style={{marginTop:"16px",fontSize:"13px",color:"var(--tertiary)",fontFamily:"'Google Sans Mono',monospace"}}>
            30 threads tracked live. Crosscurrent flags when they intersect.
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
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> Workspace, trackers, library, feed and calendar in one place. No switching.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> /ask finds the primary source answer in seconds. Cited. Traceable.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> Reports generated from your notes in one click. Hours, not days.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> Every deadline in your calendar. Nothing slips.
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--ink)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2713"}</span> One brief. 100+ sources. What happened and what it means.
                </div>
              </div>
            </div>
            <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"28px"}}>
              <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--tertiary)",marginBottom:"20px"}}>What you get back</div>
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"15px",color:"var(--secondary)",lineHeight:1.5}}>
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> One platform instead of six
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
                  <span style={{color:"var(--blue)",flexShrink:0,fontWeight:700,marginTop:"1px"}}>{"\u2191"}</span> The source on your desk before it's in the news
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>{/* end desktop-only */}

      <div className="mobile-summary">
        <div style={{padding:"32px 24px",background:"#fff"}}>
          <div style={{maxWidth:"600px",margin:"0 auto"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#1D9E75",marginBottom:"10px"}}>A DAY IN TIDELINE</div>
            <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",lineHeight:1.2,margin:"0 0 20px"}}>One room. Your entire working day.</h2>
            <div>
              {[
                {time:"8am",bold:"The brief is already there.",rest:" Everything that moved overnight, filed and ready."},
                {time:"9am",bold:"You ask the research library about BBNJ obligations.",rest:" Three primary sources cited in seconds."},
                {time:"11am",bold:"You open your workspace.",rest:" New intelligence from overnight is already filed and waiting."},
                {time:"12pm",bold:"You check the tracker.",rest:" Something moved at the ISA this morning. You are the first in your organisation to know."},
                {time:"4pm",bold:"A lawyer in Singapore comments on the story.",rest:" She has seen something you missed. You reach out."},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:"12px",padding:"12px 0",borderBottom:"1px solid #F0F0F0"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#1D9E75",width:"48px",flexShrink:0}}>{r.time}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#202124",lineHeight:1.5}}>
                    <strong style={{color:"#0A1628",fontWeight:600}}>{r.bold}</strong><span style={{color:"#5F6368"}}>{r.rest}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontStyle:"italic",color:"#5F6368",textAlign:"center",paddingTop:"16px"}}>Most professionals in this sector have six tabs open right now. Tideline is one.</div>
          </div>
        </div>

      </div>

      {/* Mobile product screens + pain section */}
      <div className="mobile-only">
        {/* Live Feed screen */}
        <section style={{padding:"40px 20px",background:"#fff"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} LIVE FEED</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>Know what moved the moment it moves.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#5F6368",lineHeight:1.6,margin:"0 0 20px"}}>100+ sources monitored continuously. Every story tagged, tiered, and one click from the original.</p>
          <div style={{background:"#0F1117",borderRadius:"12px",overflow:"hidden",border:"1px solid #2A2A3A"}}>
            <div style={{background:"#1A1A2A",padding:"8px 12px",display:"flex",alignItems:"center",gap:"6px",borderBottom:"1px solid #2A2A3A"}}>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#FF5F57"}}/>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#FEBC2E"}}/>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#28C840"}}/>
              <div style={{background:"#0F1117",borderRadius:"4px",padding:"3px 10px",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"#5F6368",marginLeft:"8px"}}>thetideline.co/platform/feed</div>
            </div>
            <div style={{padding:"10px"}}>
              {[
                {src:"IMO \u00B7 TIER 1",time:"14 min ago",head:"ISA Council adopts revised draft exploitation regulations, Area B9",tag:"Deep-sea mining",tier:1},
                {src:"OSPAR \u00B7 TIER 1",time:"2 hrs ago",head:"New MPA boundary proposal submitted ahead of June ministerial",tag:"Marine Protected Areas",tier:1},
                {src:"LLOYD\u2019S LIST \u00B7 TIER 2",time:"4 hrs ago",head:"CII compliance gap widens for bulker fleet as EU ETS costs rise",tag:"Shipping emissions",tier:2},
              ].map((it,i)=>(
                <div key={i} style={{background:"#1A1A2A",borderRadius:"8px",padding:"10px 12px",marginBottom:"6px",borderLeft:`2px solid ${it.tier===1?"#1D9E75":"#9AA0A6"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",textTransform:"uppercase",color:"#1D9E75"}}>{it.src}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"#5F6368"}}>{it.time}</span>
                  </div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"11px",color:"#E8EAED",lineHeight:1.4,marginBottom:"6px"}}>{it.head}</div>
                  <span style={{display:"inline-block",fontFamily:"'DM Mono',monospace",fontSize:"8px",background:"rgba(29,158,117,0.15)",color:"#1D9E75",padding:"2px 6px",borderRadius:"3px"}}>{it.tag}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#9AA0A6",textAlign:"center",marginTop:"12px"}}>Live feed {"\u00B7"} Every source tiered {"\u00B7"} One click to original</div>
        </section>

        {/* Research Library screen */}
        <section style={{padding:"20px 20px 40px",background:"#fff"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} RESEARCH LIBRARY</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>Ask a real question. Get a cited answer.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#5F6368",lineHeight:1.6,margin:"0 0 20px"}}>Plain language questions. Answers from primary governing body documents. Every claim traceable.</p>
          <div style={{background:"#0F1117",borderRadius:"12px",overflow:"hidden",border:"1px solid #2A2A3A"}}>
            <div style={{background:"#1A1A2A",padding:"8px 12px",display:"flex",alignItems:"center",gap:"6px",borderBottom:"1px solid #2A2A3A"}}>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#FF5F57"}}/>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#FEBC2E"}}/>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#28C840"}}/>
              <div style={{background:"#0F1117",borderRadius:"4px",padding:"3px 10px",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"#5F6368",marginLeft:"8px"}}>thetideline.co/platform/research</div>
            </div>
            <div style={{padding:"12px"}}>
              <div style={{background:"#1A1A2A",borderRadius:"8px",padding:"10px 12px",marginBottom:"8px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(29,158,117,0.2)",color:"#1D9E75",fontFamily:"'DM Mono',monospace",fontSize:"9px",display:"grid",placeItems:"center",flexShrink:0}}>?</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#E8EAED",lineHeight:1.4}}>What are the current BBNJ treaty obligations for environmental impact assessments in the high seas?</div>
              </div>
              <div style={{background:"#12201A",border:"1px solid rgba(29,158,117,0.25)",borderRadius:"8px",padding:"10px 12px"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",textTransform:"uppercase",color:"#1D9E75",marginBottom:"6px"}}>TIDELINE ANSWER {"\u00B7"} 3 SOURCES CITED</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#9AA0A6",lineHeight:1.55,marginBottom:"8px"}}>Under Article 38 of the BBNJ Agreement, parties must conduct EIAs for planned activities reasonably considered to have more than a minor or transitory effect. The threshold is assessed against cumulative impacts. The Secretariat has yet to publish implementing guidance.</div>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                  {["BBNJ Agreement Art.38","DOALOS/2024/Guide","UNGA Res.77/312"].map(p=>(
                    <span key={p} style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",background:"rgba(255,255,255,0.06)",color:"#9AA0A6",border:"1px solid rgba(255,255,255,0.08)",padding:"2px 7px",borderRadius:"3px"}}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#9AA0A6",textAlign:"center",marginTop:"12px"}}>Research library {"\u00B7"} Primary sources only {"\u00B7"} Full citation trail</div>
        </section>

        {/* Pain / Who it's for */}
        <section style={{padding:"32px 20px",background:"#fff",borderTop:"1px solid #F0F0F0"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>WHO IT{"\u2019"}S FOR</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",lineHeight:1.2,margin:"0 0 16px"}}>Built for professionals who cannot afford to miss it.</h2>
          {[
            {r:"MARITIME LAWYERS",s:"Find a regulatory change in 40 seconds. Not three hours.",x:"Every regulatory development traceable to source. Bill for advice, not research."},
            {r:"ESG ANALYSTS",s:"Never miss a material development before your TNFD disclosure.",x:"Compliance blindness is a liability. Tideline closes the gap before it becomes one."},
            {r:"POLICY PROFESSIONALS",s:"Walk into every meeting already knowing what moved.",x:"Track every consultation, vote, and position shift. Automatically."},
            {r:"CONSERVATION NGOs",s:"The consultation closes in 6 days. Tideline caught it on day one.",x:"Never miss an open window. Every deadline tracked, every development filed."},
            {r:"SHIPPING AND FINANCE",s:"Know before it hits the compliance obligation.",x:"Regulatory horizon tracking for CII, EU ETS, IMO 2030 and everything coming next."},
          ].map((it,i)=>(
            <div key={i} style={{borderBottom:"1px solid #F0F0F0",padding:"16px 0"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"6px"}}>{it.r}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:"15px",color:"#0A1628",lineHeight:1.4,marginBottom:"4px"}}>{it.s}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:"13px",color:"#5F6368",lineHeight:1.5}}>{it.x}</div>
            </div>
          ))}
        </section>
      </div>

      {/* Library */}
      <section className="section" id="library" style={{borderTop:"1px solid var(--border)",scrollMarginTop:"80px"}}>
        <span className="section-label">The library</span>
        <h2 className="section-title">The Tideline Library</h2>
        <p className="section-sub">Citable sources. Fast.</p>
        <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,marginBottom:"20px"}}>
          The most common problem professionals in this sector describe: difficult to find citable sources quickly. Treaty text. ISA publications. IMO circulars. Peer-reviewed science. FAO reports. Search across all of it in plain language. Cite directly. Not summaries of summaries {"\u2014"} the actual documents, the moment you need them.
        </p>
        <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,marginBottom:"48px"}}>
          The library grows every time a Tideline subscriber contributes a document. Every NGO policy brief, every regulatory filing, every scientific paper added by the community makes every other subscriber{"\u2019"}s research faster and more complete. This is the world{"\u2019"}s biggest ocean library. It is being built right now, by the people who use it.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"24px"}} className="replaces-grid">
          {[{n:"2,400+",l:"Documents"},{n:"Growing",l:"Every day"},{n:"Primary",l:"Sources only"}].map((s)=>(
            <div key={s.l} style={{border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"24px",textAlign:"center"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"28px",color:"var(--ink)",letterSpacing:"-0.03em",marginBottom:"4px"}}>{s.n}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",color:"var(--tertiary)",letterSpacing:"0.1em"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:"13px",color:"var(--tertiary)",margin:0}}>
          Have a document to contribute? <a href="/platform/library" style={{color:"var(--blue)",textDecoration:"none"}}>Upload it to the library</a> and help build the resource the sector has always needed.
        </p>
      </section>

      {/* Founder */}
      <section style={{borderTop:"1px solid var(--border)",padding:"80px 24px",background:"#fff"}}>
        <div style={{maxWidth:"620px",margin:"0 auto"}}>
          <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--blue)",marginBottom:"28px"}}>From the founder</div>
          <p style={{fontSize:"22px",fontWeight:600,color:"var(--ink)",lineHeight:1.4,marginBottom:"20px",marginTop:0}}>
            I built Tideline because I needed it.
          </p>
          <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,marginBottom:"20px",marginTop:0}}>
            Sometimes you just need support to be the best version of yourself at work. You do not have time to scour every source. You need to be up to date. You need to be the person in the room who knows what is happening.
          </p>
          <p style={{fontSize:"16px",color:"var(--secondary)",lineHeight:1.75,marginBottom:"32px",marginTop:0}}>
            Tideline is exactly what I was missing from my daily life. So I built it.
          </p>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"var(--ink)",display:"grid",placeItems:"center",flexShrink:0,color:"#fff",fontFamily:"'Google Sans Mono',monospace",fontSize:"12px",letterSpacing:"0.05em"}}>LM</div>
            <div>
              <div style={{fontSize:"14px",fontWeight:500,color:"var(--ink)"}}>Luke McMillan</div>
              <div style={{fontSize:"13px",color:"var(--tertiary)"}}>Founder, Tideline</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing">
        <span className="section-label">Pricing</span>
        <h2 className="section-title">Join as a founding member. Your price is locked for life.</h2>
        <p className="section-sub">The platform is live and growing week by week. Founding members join now at {"\u00A3"}39/month, locked for life. The price increases when Tideline leaves beta. It never increases for you.</p>

        <div className="mobile-only" style={{background:"#FFF8E6",border:"1px solid #F5D87A",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#7A5500"}}>
          47 founding member spots remaining. Price locks at {"\u00A3"}39/month for life. Increases when Tideline leaves beta.
        </div>

        {/* Founding member prominence */}
        <div style={{background:"var(--ink)",borderRadius:"var(--radius-lg)",padding:"20px 24px",marginBottom:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
          <div>
            <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>Founding Member {"\u00B7"} Live now</div>
            <div style={{fontSize:"16px",fontWeight:500,color:"#fff"}}>{"\u00A3"}39/month. Full platform. Locked for life. <span style={{color:"rgba(255,255,255,0.5)",fontWeight:400}}>Not a discount. An identity.</span></div>
            <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",marginTop:"6px"}}>Founding members get the price, the access, and the ear of the person building it.</div>
          </div>
          <button className="p-btn p-btn-filled" style={{whiteSpace:"nowrap",padding:"10px 24px",background:"var(--blue)",borderRadius:"var(--radius-md)"}} onClick={() => setShowEarlyAccess(true)}>Claim a founding spot {"\u2192"}</button>
        </div>

        <div className="pricing-grid">
          <div className="p-card">
            <div className="p-head">
              <span className="p-tier">Free</span>
              <div className="p-price">{"\u00A3"}0<sub>/mo</sub></div>
              <div className="p-per">Explore the platform.</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Daily morning brief</li>
                <li>Live feed (10 stories/day)</li>
                <li>3 trackers</li>
                <li>No workspace</li>
                <li>No library</li>
              </ul>
              <button className="p-btn p-btn-outlined" onClick={() => setShowEarlyAccess(true)}>Start free</button>
            </div>
          </div>

          <div className="p-card">
            <div className="p-head">
              <span className="p-tier">Founding Member</span>
              <div className="p-price">{"\u00A3"}39<sub>/mo</sub></div>
              <div className="p-per">Locked for life. Never increases.</div>
              <div className="p-desc">Full platform access at the price that reflects where Tideline is now. Not a discount. An identity. Founding members get the price, the access, and the ear of the person building it.</div>
              <div className="p-badge">Price locks on joining</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Live feed: 100+ sources, updated continuously</li>
                <li>10 live regulatory trackers</li>
                <li>Workspace with research library</li>
                <li>Generate Report to Word or PDF</li>
                <li>Regulatory deadline calendar</li>
              </ul>
              <button className="p-btn p-btn-tonal" onClick={() => setShowEarlyAccess(true)}>Claim founding member spot</button>
            </div>
          </div>

          <div className="p-card featured">
            <div className="p-head">
              <span className="p-tier">Individual</span>
              <div className="p-price">{"\u00A3"}99<sub>/mo</sub></div>
              <div className="p-per">or {"\u00A3"}990/year two months free</div>
              <div className="p-desc">For the professional who needs to know what moved, produce the work, and stay ahead of everyone else.</div>
            </div>
            <div className="p-body">
              <ul className="p-feats">
                <li>Everything in Founding Member</li>
                <li>Crosscurrent: connections across sources identified automatically</li>
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
              <div className="p-price">{"\u00A3"}699<sub>/mo</sub></div>
              <div className="p-per">10 seats. Intelligence that outlasts anyone.</div>
              <div className="p-desc">10 seats. Built for organisations where ocean intelligence needs to be shared. Fewer seats needed? Get in touch and we will find the right fit.</div>
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
          Need more than 10 seats? <a href="#" onClick={(e) => { e.preventDefault(); setShowEarlyAccess(true); }}>Enterprise pricing</a> &nbsp;{"\u00B7"}&nbsp;
          NGO or grant-funded? Email hello@thetideline.co for flexible annual pricing.
        </p>
      </section>

      {/* Source methodology */}
      <section className="section" id="methodology">
        <span className="section-label">Source methodology</span>
        <h2 className="section-title">Every source is labelled. Every answer is cited.</h2>
        <p className="section-sub">Tideline classifies every source into three tiers. The tier is visible on every story, every research answer, and every Crosscurrent alert. You always know where it came from.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="tier-grid">
          <div style={{background:"#fff",border:"2px solid var(--blue)",borderRadius:"var(--radius-lg)",padding:"24px"}}>
            <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--blue)",marginBottom:"12px"}}>Tier 1 {"\u00B7"} Primary</div>
            <div style={{fontSize:"15px",fontWeight:600,color:"var(--ink)",marginBottom:"8px"}}>Governing body documents</div>
            <div style={{fontSize:"13px",color:"var(--secondary)",lineHeight:1.6}}>Official regulatory publications, treaty text, governing body records, decision documents. Direct from the institution.</div>
            <div style={{fontSize:"12px",color:"var(--tertiary)",marginTop:"12px"}}>Examples: IMO, OSPAR, IWC, FAO, UNEP</div>
          </div>
          <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"24px"}}>
            <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--tertiary)",marginBottom:"12px"}}>Tier 2 {"\u00B7"} Specialist press</div>
            <div style={{fontSize:"15px",fontWeight:600,color:"var(--ink)",marginBottom:"8px"}}>Industry and legal reporting</div>
            <div style={{fontSize:"13px",color:"var(--secondary)",lineHeight:1.6}}>Specialist maritime, legal, and financial publications with editorial standards and domain expertise.</div>
            <div style={{fontSize:"12px",color:"var(--tertiary)",marginTop:"12px"}}>Examples: Lloyd&apos;s List, Bloomberg Law, Reuters, TradeWinds</div>
          </div>
          <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"24px"}}>
            <div style={{fontFamily:"'Google Sans Mono',monospace",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--tertiary)",marginBottom:"12px"}}>Tier 3 {"\u00B7"} Context</div>
            <div style={{fontSize:"15px",fontWeight:600,color:"var(--ink)",marginBottom:"8px"}}>Supporting publications</div>
            <div style={{fontSize:"13px",color:"var(--secondary)",lineHeight:1.6}}>NGO publications, conference proceedings, academic preprints, and general press. Useful for context, not cited as primary evidence.</div>
            <div style={{fontSize:"12px",color:"var(--tertiary)",marginTop:"12px"}}>Examples: NGO reports, academic preprints, conference proceedings</div>
          </div>
        </div>
      </section>

      {/* Mobile final CTA */}
      <div className="mobile-only" style={{background:"#0A1628",padding:"40px 20px",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"24px",color:"#fff",lineHeight:1.2,letterSpacing:"-0.02em",margin:"0 0 12px"}}>The ocean sector finally has a room of its own.</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:400,fontSize:"14px",color:"#9AA0A6",lineHeight:1.6,margin:"0 0 24px"}}>7-day free trial. Full platform access. No card required. Come in.</p>
        <button onClick={() => setShowEarlyAccess(true)} style={{width:"100%",background:"#1D9E75",color:"#fff",border:"none",borderRadius:"8px",padding:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"14px",cursor:"pointer"}}>Start your free trial</button>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#5F6368",marginTop:"10px",textTransform:"uppercase",letterSpacing:"0.1em"}}>{"\u00A3"}39 FOUNDING PRICE {"\u00B7"} 47 SPOTS REMAINING {"\u00B7"} LOCKED FOR LIFE</div>
      </div>

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
