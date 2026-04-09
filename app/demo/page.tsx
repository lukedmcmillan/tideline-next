"use client";

import { useState } from "react";
import "@/styles/landing.css";
import Header from "@/components/Header";
import EarlyAccessModal from "@/components/EarlyAccessModal";

export default function DemoPage() {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", background: "#fff", color: "#202124", WebkitFontSmoothing: "antialiased", lineHeight: 1.5 }}>
      <Header
        onLoginClick={() => setShowEarlyAccess(true)}
        onJoinClick={() => setShowEarlyAccess(true)}
      />

      {/* Section 1 — Header */}
      <div style={{padding:"80px 24px 48px",background:"#fff"}}>
        <div style={{maxWidth:"760px",margin:"0 auto"}}>
          <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"48px",lineHeight:1.08,letterSpacing:"-0.025em",color:"#0A1628",margin:0,marginBottom:"16px"}}>
            The real product. No signup required.
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"18px",color:"#5F6368",lineHeight:1.7,margin:0}}>
            This is what Tideline looks like from the inside. Every story sourced and tiered. Every development tracked. Everything in one place.
          </p>
        </div>
      </div>

      {/* Section 2 — Screenshot */}
      <div style={{background:"#fff",padding:"0 48px 80px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{borderRadius:"12px",overflow:"hidden",border:"1px solid #E5E7EB",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
            <div style={{background:"#1E293B",padding:"10px 14px",display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#FF5F57"}}/>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#FEBC2E"}}/>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#28C840"}}/>
              <div style={{background:"#0F172A",borderRadius:"6px",padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#94A3B8",marginLeft:"12px"}}>thetideline.co/platform/feed</div>
            </div>
            <img src="/platform-screenshot.png" alt="Tideline live feed" style={{width:"100%",display:"block"}} />
          </div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#9AA0A6",textAlign:"center",marginTop:"16px"}}>
            Your live feed. Filtered to your sector. Updated the moment something moves.
          </p>
        </div>
      </div>

      {/* Section 3 — Feature pills */}
      <div style={{background:"#fff",padding:"48px 24px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
          {[
            {heading:"45 seconds",body:"Type a topic. Get a cited brief from primary sources."},
            {heading:"100+ sources",body:"Monitored continuously. Filtered to your work."},
            {heading:"One workspace",body:"Research, write, and produce without switching tabs."},
          ].map((f)=>(
            <div key={f.heading} style={{background:"#FAFAFA",border:"1px solid #E5E7EB",borderRadius:"12px",padding:"28px"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"22px",color:"#0A1628",marginBottom:"8px",letterSpacing:"-0.02em"}}>{f.heading}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:"#5F6368",lineHeight:1.6}}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — CTA */}
      <section style={{background:"#1D9E75",padding:"80px 24px",textAlign:"center"}}>
        <div style={{maxWidth:"600px",margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:"32px",color:"#fff",margin:"0 0 12px",lineHeight:1.2}}>Seen enough?</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"16px",color:"rgba(255,255,255,0.7)",lineHeight:1.6,margin:"0 0 32px"}}>Start your 7-day free trial. No card required.</p>
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
