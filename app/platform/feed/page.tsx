"use client";
import { useState, useEffect, useRef } from "react";

const VERTICALS = [
  { id: "all",         label: "All intelligence",   count: 147 },
  { id: "governance",  label: "Ocean governance",    count: 34  },
  { id: "shipping",    label: "Shipping & IMO",      count: 22  },
  { id: "fisheries",   label: "Fisheries",           count: 19  },
  { id: "bluefinance", label: "Blue finance",        count: 18  },
  { id: "dsm",         label: "Deep-sea mining",     count: 11  },
  { id: "climate",     label: "Climate science",     count: 21  },
  { id: "pollution",   label: "Pollution",           count: 9   },
  { id: "mpa",         label: "MPAs & 30x30",        count: 7   },
  { id: "iuu",         label: "Illegal fishing",     count: 6   },
];

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  gov:   { bg:"#dbeafe", text:"#1e40af" },
  reg:   { bg:"#fee2e2", text:"#991b1b" },
  ngo:   { bg:"#dcfce7", text:"#166534" },
  res:   { bg:"#f3e8ff", text:"#6b21a8" },
  media: { bg:"#fef3c7", text:"#78350f" },
  esg:   { bg:"#ccfbf1", text:"#134e4a" },
};

const SOURCE_LABELS: Record<string, string> = {
  gov:"Gov", reg:"Reg", ngo:"NGO", res:"Research", media:"Media", esg:"ESG"
};

function ageStr(iso: string): string {
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if (m < 60) return m+"m ago";
  const h = Math.floor(m/60);
  if (h < 24) return h+"h ago";
  return Math.floor(h/24)+"d ago";
}

function sig(iso: string): string {
  const m = (Date.now()-new Date(iso).getTime())/60000;
  if (m < 60) return "breaking";
  if (m < 480) return "new";
  return "standard";
}

function Badge({ type, small }: { type: string; small?: boolean }) {
  const c = SOURCE_COLORS[type] || SOURCE_COLORS.media;
  return (
    <span style={{ fontSize:small?10:11, fontFamily:"system-ui,-apple-system,sans-serif", fontWeight:600, padding:"2px 7px", borderRadius:4, background:c.bg, color:c.text, flexShrink:0, lineHeight:1.6 }}>
      {SOURCE_LABELS[type]||"—"}
    </span>
  );
}

function SigLabel({ type }: { type: string }) {
  if (type==="breaking") return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,fontFamily:"system-ui,-apple-system,sans-serif",letterSpacing:"0.04em",color:"#b91c1c",flexShrink:0 }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:"#ef4444",display:"inline-block",animation:"tlpulse 1.5s ease-in-out infinite" }}/>Breaking
    </span>
  );
  if (type==="new") return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:600,fontFamily:"system-ui,-apple-system,sans-serif",letterSpacing:"0.03em",color:"#15803d",flexShrink:0 }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block" }}/>New
    </span>
  );
  return null;
}

function TopStory({ story, onClick }: { story: any; onClick: () => void }) {
  const [hov,setHov]=useState(false);
  const s=sig(story.published_at);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ padding:"22px 24px 18px", borderBottom:"1px solid #e8e4dc", cursor:"pointer", background:hov?"#f0ebe0":"#faf8f4", borderLeft:s==="breaking"?"3px solid #ef4444":"3px solid #c8b89a", transition:"background 0.12s ease" }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:11,flexWrap:"wrap" }}>
        <span style={{ fontSize:10,fontWeight:700,fontFamily:"system-ui,-apple-system,sans-serif",letterSpacing:"0.1em",color:"#a8a29e",textTransform:"uppercase" }}>Top story</span>
        {s!=="standard"&&<SigLabel type={s}/>}
        <span style={{ marginLeft:"auto",fontSize:11,color:"#a8a29e",fontFamily:"system-ui,-apple-system,sans-serif" }}>{ageStr(story.published_at)}</span>
      </div>
      <h2 style={{ fontFamily:"'Libre Baskerville',Georgia,serif",fontSize:18,lineHeight:1.45,fontWeight:700,color:"#1c1917",marginBottom:9,letterSpacing:"-0.01em" }}>{story.title}</h2>
      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
        <Badge type={story.source_type}/>
        <span style={{ fontSize:12,fontFamily:"system-ui,-apple-system,sans-serif",color:"#78716c" }}>{story.source_name}</span>
        {story.summary&&(
          <a href={`/platform/story/${story.id}`} onClick={e=>e.stopPropagation()} style={{ marginLeft:"auto",fontSize:12,fontFamily:"system-ui,-apple-system,sans-serif",fontWeight:600,color:"#1d4ed8",textDecoration:"none" }}>
            Intelligence brief →
          </a>
        )}
      </div>
    </div>
  );
}

function Row({ story, selected, onClick, idx }: { story: any; selected: boolean; onClick: () => void; idx: number }) {
  const [hov,setHov]=useState(false);
  const s=sig(story.published_at);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:"13px 20px", borderBottom:"1px solid #e8e4dc", cursor:"pointer", background:selected?"#eff4ff":hov?"#f0ebe0":"#faf8f4", borderLeft:selected?"3px solid #1d4ed8":s==="breaking"?"3px solid #fca5a5":"3px solid transparent", transition:"background 0.1s ease", animation:"tlfade 0.22s ease both", animationDelay:Math.min(idx*0.025,0.3)+"s" }}>
      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:7,flexWrap:"wrap" }}>
        {s!=="standard"&&<SigLabel type={s}/>}
        <span style={{ fontSize:11,fontFamily:"system-ui,-apple-system,sans-serif",color:"#78716c",fontWeight:500 }}>{story.source_name}</span>
        <Badge type={story.source_type} small/>
        <span style={{ fontSize:11,fontFamily:"system-ui,-apple-system,sans-serif",color:"#a8a29e",marginLeft:"auto",flexShrink:0 }}>{ageStr(story.published_at)}</span>
      </div>
      <div style={{ fontSize:14,fontFamily:"'Libre Baskerville',Georgia,serif",lineHeight:1.5,color:selected?"#0f172a":"#1c1917",fontWeight:selected?700:400,marginBottom:6 }}>{story.title}</div>
      {story.summary&&(
        <a href={`/platform/story/${story.id}`} onClick={e=>e.stopPropagation()} style={{ fontSize:11,fontFamily:"system-ui,-apple-system,sans-serif",fontWeight:600,color:"#1d4ed8",textDecoration:"none" }}>
          Intelligence brief →
        </a>
      )}
    </div>
  );
}

function Detail({ story, onBack, mobile }: { story: any; onBack: () => void; mobile: boolean }) {
  useEffect(()=>{ if(mobile) window.scrollTo(0,0); },[story]);
  if(!story&&!mobile) return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"#faf8f4" }}>
      <div style={{ fontSize:28,color:"#d6d3d1" }}>◈</div>
      <div style={{ fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:"#a8a29e" }}>Select a story</div>
    </div>
  );
  if(!story) return null;
  const s=sig(story.published_at);
  const excerptWords = story.summary ? story.summary.split(' ').slice(0, 40).join(' ') + '...' : null;

  return (
    <div style={{ padding:mobile?"20px 20px 48px":"28px 28px 48px", overflowY:"auto", height:"100%", background:"#faf8f4", animation:"tlfade 0.18s ease both" }}>
      {mobile&&<button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:5,marginBottom:24,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,color:"#1d4ed8",fontWeight:600 }}>← Back to feed</button>}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap" }}>
        {s!=="standard"&&<SigLabel type={s}/>}
        <Badge type={story.source_type}/>
        <span style={{ fontSize:12,fontFamily:"system-ui,-apple-system,sans-serif",color:"#78716c" }}>{story.source_name}</span>
        <span style={{ fontSize:11,fontFamily:"system-ui,-apple-system,sans-serif",color:"#a8a29e",marginLeft:"auto" }}>{ageStr(story.published_at)}</span>
      </div>
      <h1 style={{ fontFamily:"'Libre Baskerville',Georgia,serif",fontSize:mobile?19:22,lineHeight:1.4,fontWeight:700,color:"#1c1917",marginBottom:16,letterSpacing:"-0.01em" }}>{story.title}</h1>
      {excerptWords ? (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10,fontFamily:"system-ui,-apple-system,sans-serif",fontWeight:700,letterSpacing:"0.12em",color:"#1d4ed8",textTransform:"uppercase" as const,marginBottom:10 }}>Intelligence Brief</div>
          <p style={{ fontFamily:"'Libre Baskerville',Georgia,serif",fontSize:14,lineHeight:1.8,color:"#292524",marginBottom:14 }}>{excerptWords}</p>
          <a href={`/platform/story/${story.id}`} style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontFamily:"system-ui,-apple-system,sans-serif",fontWeight:700,color:"#1d4ed8",textDecoration:"none",borderBottom:"1.5px solid #bfdbfe",paddingBottom:1 }}>
            Read full intelligence brief →
          </a>
        </div>
      ) : (
        <div style={{ padding:"13px 16px",background:"#f5f0e8",border:"1px solid #e8e4dc",borderRadius:6,fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:"#a8a29e",marginBottom:24 }}>Intelligence brief generating...</div>
      )}
      <div style={{ paddingTop:20,borderTop:"1px solid #e8e4dc" }}>
        <a href={story.link||"#"} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex",alignItems:"center",gap:5,fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,color:"#78716c",textDecoration:"none",borderBottom:"1px solid #d6d3d1",paddingBottom:2 }}
          onMouseEnter={e=>{e.currentTarget.style.color="#1d4ed8";e.currentTarget.style.borderColor="#1d4ed8"}}
          onMouseLeave={e=>{e.currentTarget.style.color="#78716c";e.currentTarget.style.borderColor="#d6d3d1"}}>
          Read full article ↗
        </a>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding:"40px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ width:24, height:24, borderRadius:"50%", border:"2px solid #e8e4dc", borderTopColor:"#1d4ed8", animation:"tlspin 0.8s linear infinite" }}/>
      <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", fontSize:12, color:"#a8a29e" }}>Loading intelligence...</div>
    </div>
  );
}

function EmptyState({ vertical }: { vertical: string }) {
  return (
    <div style={{ padding:"40px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
      <div style={{ fontSize:28, color:"#d6d3d1" }}>◈</div>
      <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", fontSize:12, color:"#a8a29e", textAlign:"center" }}>
        No stories yet{vertical !== "all" ? " in this area" : ""}.<br/>Feed updates every hour.
      </div>
    </div>
  );
}

export default function TidelineFeed() {
  const [vertical,setVertical]=useState("all");
  const [selected,setSelected]=useState<any>(null);
  const [showDetail,setShowDetail]=useState(false);
  const [newCount,setNewCount]=useState(0);
  const [mobile,setMobile]=useState(false);
  const [stories,setStories]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [lastUpdated,setLastUpdated]=useState<Date|null>(null);
  const feedRef=useRef<HTMLDivElement>(null);
  const prevCountRef=useRef(0);

  useEffect(()=>{
    const c=()=>setMobile(window.innerWidth<768);
    c();
    window.addEventListener("resize",c);
    return()=>window.removeEventListener("resize",c);
  },[]);

  const fetchStories = async () => {
    try {
      const params = new URLSearchParams({ limit:"50" });
      if (vertical !== "all") params.set("topic", vertical);
      const res = await fetch(`/api/stories?${params}`);
      const data = await res.json();
      const fetched = data.stories || [];
      if (prevCountRef.current > 0 && fetched.length > prevCountRef.current) {
        setNewCount(fetched.length - prevCountRef.current);
      }
      prevCountRef.current = fetched.length;
      setStories(fetched);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch stories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    setLoading(true);
    setStories([]);
    prevCountRef.current = 0;
    fetchStories();
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  },[vertical]);

  const top=stories[0];
  const rest=stories.slice(1);
  const pick=(s: any)=>{setSelected(s);setShowDetail(true);if(mobile)window.scrollTo(0,0);};
  const back=()=>{setShowDetail(false);setTimeout(()=>setSelected(null),50);};
  const sw=(id: string)=>{setVertical(id);setSelected(null);setShowDetail(false);};
  const nudge=()=>{setNewCount(0);if(feedRef.current)feedRef.current.scrollTop=0;};

  const updatedLabel = lastUpdated
    ? `Live · Updated ${ageStr(lastUpdated.toISOString())}`
    : "Live";

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    @keyframes tlpulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5);}50%{box-shadow:0 0 0 4px rgba(239,68,68,0);}}
    @keyframes tlfade{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
    @keyframes tlslide{from{transform:translateX(100%);}to{transform:translateX(0);}}
    @keyframes tlspin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    ::-webkit-scrollbar{width:4px;height:3px;}
    ::-webkit-scrollbar-thumb{background:#d6d3d1;border-radius:2px;}
  `;

  if(mobile) return (
    <><style>{CSS}</style>
    <div style={{ minHeight:"100vh",background:"#faf8f4" }}>
      {showDetail&&selected&&(
        <div style={{ background:"#faf8f4",minHeight:"calc(100vh - 56px)",animation:"tlslide 0.26s cubic-bezier(0.32,0.72,0,1) both" }}>
          <Detail story={selected} onBack={back} mobile={true}/>
        </div>
      )}
      {!showDetail&&<div style={{ animation:"tlfade 0.2s ease both" }}>
        <div style={{ overflowX:"auto",display:"flex",gap:6,padding:"10px 16px",background:"#faf8f4",borderBottom:"1px solid #e8e4dc",WebkitOverflowScrolling:"touch" } as React.CSSProperties}>
          {VERTICALS.map(v=>(
            <button key={v.id} onClick={()=>sw(v.id)} style={{ flexShrink:0,padding:"6px 13px",borderRadius:20,border:vertical===v.id?"1.5px solid #1d4ed8":"1.5px solid #d6d3d1",background:vertical===v.id?"#eff6ff":"#faf8f4",color:vertical===v.id?"#1d4ed8":"#57534e",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:11,fontWeight:vertical===v.id?600:400,cursor:"pointer",whiteSpace:"nowrap",lineHeight:1 }}>
              {v.label}{vertical===v.id&&<span style={{ marginLeft:5,color:"#93c5fd",fontSize:10 }}>{stories.length}</span>}
            </button>
          ))}
        </div>
        {newCount>0&&<button onClick={nudge} style={{ width:"calc(100% - 32px)",margin:"10px 16px 0",padding:"10px",background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:8,color:"#1d4ed8",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,cursor:"pointer",fontWeight:600,textAlign:"center" }}>↑ {newCount} new stories</button>}
        {loading ? <LoadingState/> : stories.length === 0 ? <EmptyState vertical={vertical}/> : (
          <>
            {top&&<TopStory story={top} onClick={()=>pick(top)}/>}
            <div>{rest.map((s,i)=><Row key={s.id} story={s} idx={i} selected={false} onClick={()=>pick(s)}/>)}</div>
          </>
        )}
      </div>}
    </div></>
  );

  return (
    <><style>{CSS}</style>
    <div style={{ width:"100%",height:"calc(100vh - 56px)",background:"#f2ede4",display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        <div style={{ width:210,borderRight:"1px solid #e0d9ce",background:"#faf8f4",display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0 }}>
          <div style={{ padding:"18px 18px 8px",fontSize:10,letterSpacing:"0.12em",color:"#a8a29e",fontWeight:600,fontFamily:"system-ui,-apple-system,sans-serif",textTransform:"uppercase" }}>Intelligence areas</div>
          {VERTICALS.map(v=>(
            <button key={v.id} onClick={()=>sw(v.id)}
              style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 18px",background:vertical===v.id?"#eff6ff":"transparent",border:"none",borderLeft:vertical===v.id?"3px solid #1d4ed8":"3px solid transparent",color:vertical===v.id?"#1d4ed8":"#57534e",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,cursor:"pointer",textAlign:"left",width:"100%",transition:"background 0.1s ease",fontWeight:vertical===v.id?600:400 }}
              onMouseEnter={e=>{if(vertical!==v.id)(e.currentTarget as HTMLButtonElement).style.background="#f0ebe0";}}
              onMouseLeave={e=>{if(vertical!==v.id)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
              <span>{v.label}</span>
              <span style={{ fontSize:11,fontWeight:500,color:vertical===v.id?"#93c5fd":"#d6d3d1",fontFamily:"system-ui,-apple-system,sans-serif" }}>
                {vertical===v.id ? stories.length : v.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid #e0d9ce",background:"#faf8f4" }}>
          <div style={{ padding:"12px 20px",borderBottom:"1px solid #e8e4dc",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
            <div style={{ fontSize:13,color:"#1c1917",fontWeight:600,fontFamily:"system-ui,-apple-system,sans-serif" }}>{VERTICALS.find(v=>v.id===vertical)?.label}</div>
            <div style={{ fontSize:11,color:"#a8a29e",fontFamily:"system-ui,-apple-system,sans-serif" }}>
              {loading ? "Loading..." : `${stories.length} stories · ${updatedLabel}`}
            </div>
          </div>
          {newCount>0&&<button onClick={nudge} style={{ margin:"8px 12px",padding:"8px 16px",background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:6,color:"#1d4ed8",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:12,cursor:"pointer",fontWeight:600,flexShrink:0 }}>↑ {newCount} new stories</button>}
          <div ref={feedRef} style={{ flex:1,overflowY:"auto" }}>
            {loading ? <LoadingState/> : stories.length === 0 ? <EmptyState vertical={vertical}/> : (
              <>
                {top&&<TopStory story={top} onClick={()=>pick(top)}/>}
                {rest.map((s,i)=><Row key={s.id} story={s} idx={i} selected={selected?.id===s.id} onClick={()=>pick(s)}/>)}
              </>
            )}
          </div>
        </div>
        <div style={{ width:400,flexShrink:0,background:"#faf8f4",borderLeft:"1px solid #e0d9ce",overflowY:"auto" }}>
          <Detail story={selected} onBack={back} mobile={false}/>
        </div>
      </div>
    </div></>
  );
}
