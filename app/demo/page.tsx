"use client";

import { useState } from "react";
import "@/styles/landing.css";
import Header from "@/components/Header";
import EarlyAccessModal from "@/components/EarlyAccessModal";

export default function DemoPage() {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", background: "#fff", color: "#202124", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }}>
      <Header
        onLoginClick={() => setShowEarlyAccess(true)}
        onJoinClick={() => setShowEarlyAccess(true)}
      />

      {/* Page header */}
      <div style={{padding:"80px 24px 48px",background:"#fff"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"48px",lineHeight:1.08,letterSpacing:"-0.025em",color:"#0A1628",margin:0,marginBottom:"16px"}}>
            See Tideline in action.
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"18px",color:"#5F6368",lineHeight:1.7,margin:0}}>
            No signup required. This is the real product.
          </p>
        </div>
      </div>

      {/* Section 1 — Live Feed */}
      <section style={{padding:"64px 24px",background:"#fff"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} LIVE FEED</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"28px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>Know what moved the moment it moves.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"#5F6368",lineHeight:1.6,margin:"0 0 32px",maxWidth:"620px"}}>100+ sources monitored continuously. Every story tagged, tiered, and one click from the original.</p>
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
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:"13px",color:"#E8EAED",lineHeight:1.4,marginBottom:"6px"}}>{it.head}</div>
                  <span style={{display:"inline-block",fontFamily:"'DM Mono',monospace",fontSize:"8px",background:"rgba(29,158,117,0.15)",color:"#1D9E75",padding:"2px 6px",borderRadius:"3px"}}>{it.tag}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#9AA0A6",textAlign:"center",marginTop:"12px"}}>Live feed {"\u00B7"} Every source tiered {"\u00B7"} One click to original</div>
        </div>
      </section>

      {/* Section 2 — Brief Generator */}
      <section style={{padding:"64px 24px",background:"#FAFAFA",borderTop:"1px solid #E5E7EB"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} BRIEF GENERATOR</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"28px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>A cited brief in 45 seconds.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"#5F6368",lineHeight:1.6,margin:"0 0 32px",maxWidth:"620px"}}>Type a topic. Get a professional brief drawn from primary treaty text and official publications.</p>

          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"20px",display:"flex",gap:"12px",alignItems:"center",borderBottom:showBrief?"1px solid #E5E7EB":"none"}}>
              <div style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#9AA0A6",background:"#FAFAFA",borderRadius:"8px",padding:"10px 14px"}}>Latest BBNJ ratification developments</div>
              <button
                onClick={() => setShowBrief(!showBrief)}
                style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,color:"#fff",background:"#1D9E75",border:"none",borderRadius:"8px",padding:"10px 20px",cursor:"pointer",whiteSpace:"nowrap"}}
              >{showBrief ? "Clear" : "Generate brief"}</button>
            </div>
            <div style={{padding:showBrief?"24px":"0",maxHeight:showBrief?"600px":"0",overflow:"hidden",transition:"max-height 0.3s ease, padding 0.3s ease"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"16px"}}>TIDELINE BRIEF {"\u00B7"} 3 SOURCES CITED</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#202124",lineHeight:1.7,marginTop:0,marginBottom:"12px"}}>
                Under Article 38 of the BBNJ Agreement, parties must conduct environmental impact assessments for planned activities in areas beyond national jurisdiction. The threshold is assessed against cumulative impacts on marine biodiversity.
              </p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#202124",lineHeight:1.7,marginTop:0,marginBottom:"12px"}}>
                As of April 2026, 45 states have ratified the Agreement, with the 60-state threshold for entry into force expected by late 2027. The Secretariat has yet to publish implementing guidance for the EIA provisions.
              </p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#202124",lineHeight:1.7,marginTop:0,marginBottom:"20px"}}>
                The most recent ratification was recorded on 28 March 2026. Twelve states have signed but not yet ratified, with domestic legislative processes cited as the primary delay.
              </p>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {["BBNJ Agreement Art.38","DOALOS/2024/Guide","UNGA Res.77/312"].map(p=>(
                  <span key={p} style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",background:"#F3F4F6",color:"#5F6368",border:"1px solid #E5E7EB",padding:"4px 10px",borderRadius:"4px"}}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Workspace */}
      <section style={{padding:"64px 24px",background:"#fff",borderTop:"1px solid #E5E7EB"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} WORKSPACE</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"28px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>Where the work happens.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"#5F6368",lineHeight:1.6,margin:"0 0 32px",maxWidth:"620px"}}>Write, research, and produce in one place. Your notes compile into a report in one click.</p>

          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 300px",minHeight:"240px"}}>
              <div style={{padding:"24px",borderRight:"1px solid #E5E7EB"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#9AA0A6",letterSpacing:"0.1em",marginBottom:"12px"}}>CONSULTATION RESPONSE</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#202124",lineHeight:1.7}}>
                  <p style={{margin:"0 0 12px"}}>The proposed OSPAR MPA network designates 34 areas across UK and Norwegian waters. Current draft criteria would affect existing offshore energy licences issued before the 2023 ministerial decision.</p>
                  <p style={{margin:"0 0 12px"}}>Under Annex V, Article 4(2), existing licensed activities may continue subject to a compatibility review within 18 months of designation. States retain discretion over enforcement timing within that window.</p>
                  <p style={{margin:0,color:"#9AA0A6",fontSize:"12px"}}>2 paragraphs {"\u00B7"} 3 sources saved</p>
                </div>
              </div>
              <div style={{padding:"20px",background:"#FAFAFA"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#9AA0A6",letterSpacing:"0.1em",marginBottom:"16px"}}>SAVED SOURCES</div>
                {[
                  {tag:"OSPAR",title:"OSPAR Convention Annex V (amended 2021)"},
                  {tag:"IMO",title:"MEPC 82 GHG intensity decision text"},
                  {tag:"BBNJ",title:"BBNJ Agreement Art. 38 \u2013 EIA provisions"},
                ].map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 0",borderBottom:i<2?"1px solid #E5E7EB":"none"}}>
                    <div style={{width:"24px",height:"24px",borderRadius:"4px",background:"#E8F5F0",display:"grid",placeItems:"center",flexShrink:0}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="#1D9E75" strokeWidth="1.2"/><line x1="3.5" y1="4" x2="8.5" y2="4" stroke="#1D9E75" strokeWidth="0.8"/><line x1="3.5" y1="6" x2="7" y2="6" stroke="#1D9E75" strokeWidth="0.8"/><line x1="3.5" y1="8" x2="6" y2="8" stroke="#1D9E75" strokeWidth="0.8"/></svg>
                    </div>
                    <div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.1em",marginBottom:"2px"}}>{s.tag}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#202124",lineHeight:1.4}}>{s.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{borderTop:"1px solid #E5E7EB",padding:"16px 24px"}}>
              <div style={{width:"100%",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,color:"#fff",background:"#1D9E75",borderRadius:"8px",padding:"12px",textAlign:"center"}}>Generate Report {"\u2192"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Trackers */}
      <section style={{padding:"64px 24px",background:"#FAFAFA",borderTop:"1px solid #E5E7EB"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",textTransform:"uppercase",color:"#1D9E75",letterSpacing:"0.12em",marginBottom:"8px"}}>THE PLATFORM {"\u00B7"} LIVE TRACKERS</div>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"28px",color:"#0A1628",margin:"0 0 8px",lineHeight:1.2}}>Follow what matters. Automatically.</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"#5F6368",lineHeight:1.6,margin:"0 0 32px",maxWidth:"620px"}}>Five live trackers across the biggest issues in the sector. Updated in real time.</p>

          <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:"12px",overflow:"hidden"}}>
            {[
              {name:"ISA Mining Code",time:"Updated 2 min ago"},
              {name:"30x30 Progress",time:"Updated 1 hr ago"},
              {name:"IUU Enforcement",time:"Updated 3 hr ago"},
              {name:"Shipping Emissions",time:"Updated today"},
              {name:"Blue Finance",time:"Updated today"},
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",padding:"16px 20px",borderBottom:i<4?"1px solid #E5E7EB":"none"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#1D9E75",marginRight:"14px",flexShrink:0,animation:"pulse 2.2s ease-in-out infinite"}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",fontWeight:500,color:"#0A1628"}}>{t.name}</div>
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#9AA0A6",marginRight:"12px"}}>{t.time}</div>
                <span style={{color:"#9AA0A6",fontSize:"14px"}}>{"\u2192"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:"#1D9E75",padding:"80px 24px",textAlign:"center"}}>
        <div style={{maxWidth:"600px",margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"32px",color:"#fff",margin:"0 0 12px",lineHeight:1.2}}>Seen enough?</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"rgba(255,255,255,0.6)",lineHeight:1.6,margin:"0 0 32px"}}>Start your 7-day free trial. No card required.</p>
          <button
            onClick={() => setShowEarlyAccess(true)}
            style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",fontWeight:600,color:"#1D9E75",background:"#fff",border:"none",borderRadius:"8px",padding:"14px 32px",cursor:"pointer",marginBottom:"16px"}}
          >
            Start free trial
          </button>
          <div>
            <a href="/" style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"rgba(255,255,255,0.6)",textDecoration:"underline"}}>Back to home</a>
          </div>
        </div>
      </section>

      {showEarlyAccess && <EarlyAccessModal onClose={() => setShowEarlyAccess(false)} />}
    </div>
  );
}
