// Stats band, Showcase rows, comparison, and supporting band — all stacked single-column.

function StatsBand({ socialProof }) {
  const stats = [
    { v: '10,000+', l: 'primary source documents in the library' },
    { v: socialProof.entities.toLocaleString('en-GB'), l: 'entities you can track' },
    { v: String(socialProof.trackers), l: 'regulatory pulse domains, scored weekly' },
  ];
  return (
    <section style={{
      padding: '32px 20px',
      borderTop: '1px solid #E5E1D8', borderBottom: '1px solid #E5E1D8',
      background: '#F4F2EC',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {stats.map(s => (
          <div key={s.l} style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'baseline' }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontWeight: 500, fontSize: 30,
              color: '#0B1628', lineHeight: 1, letterSpacing: '-0.025em',
            }}>{s.v}</div>
            <div style={{ fontSize: 13, color: '#6B7A8C', lineHeight: 1.4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// One showcase row: eyebrow → H3 → body → link, then visual below.
function ShowcaseRow({ eyebrow, headline, accent, body, link, children, id }) {
  return (
    <div id={id} style={{ marginBottom: 56 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12,
        }}>{eyebrow}</div>
        <h3 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
          fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#0B1628', marginBottom: 12, textWrap: 'balance',
        }}>
          {headline}{accent && <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>{accent}</em>}.
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: '#3A4A5C', marginBottom: 12, maxWidth: '38ch' }}>
          {body}
        </p>
        <a href={link.href} style={{
          fontSize: 14, color: '#0B1628', fontWeight: 600,
          textDecoration: 'none', borderBottom: '1px solid #0B1628', paddingBottom: 2,
        }}>{link.label} →</a>
      </div>
      {children}
    </div>
  );
}

function FeedMini() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E1D8', borderRadius: 12,
      boxShadow: '0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E5E1D8', marginBottom: 4 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, color: '#0B1628', letterSpacing: '-0.01em' }}>Live feed</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#9AA8B8', letterSpacing: '0.04em' }}>12 min ago</div>
      </div>
      {[
        { tracker: 'ISA', entity: 'Pacific Minerals', time: '2h', headline: 'ISA council defers vote on mining code amid scientific objections', source: 'International Seabed Authority · Press release' },
        { tracker: 'BBNJ', entity: 'UN Treaty Collection', time: '4h', headline: 'BBNJ ratification reaches 34 parties as Pacific bloc confirms support', source: 'UN Treaty Collection · Filing' },
        { tracker: 'IMO MEPC', entity: 'ACME Shipping', time: '6h', headline: 'MEPC 83 opens with revised CII corridor proposals on the table', source: 'IMO Documents · Working paper' },
      ].map((item, idx, arr) => (
        <div key={item.tracker} style={{ padding: '12px 0', borderBottom: idx < arr.length - 1 ? '1px solid #EDEAE3' : 'none' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, padding: '3px 8px', borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1D9E75', background: '#E8F4EE' }}>{item.tracker}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, padding: '3px 8px', borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B7A8C', border: '1px solid #E5E1D8', background: '#FAFAF7' }}>{item.entity}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#9AA8B8', marginLeft: 'auto' }}>{item.time}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.4, color: '#0B1628', fontWeight: 500, marginBottom: 4 }}>{item.headline}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C' }}>{item.source}</div>
        </div>
      ))}
    </div>
  );
}

function PulseMini() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E1D8', borderRadius: 12,
      boxShadow: '0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)',
      padding: 18,
    }}>
      <div style={{ paddingBottom: 14, borderBottom: '1px solid #E5E1D8', marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C', letterSpacing: '0.1em', marginBottom: 4, textTransform: 'uppercase' }}>Updated Monday</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16, color: '#0B1628', letterSpacing: '-0.01em' }}>BBNJ High Seas Treaty</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C', border: '1px solid #E5E1D8', padding: '3px 8px', borderRadius: 99, letterSpacing: '0.06em', background: '#FAFAF7', whiteSpace: 'nowrap', flexShrink: 0 }}>0.70x</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 56, color: '#1D9E75', lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.04em' }}>6.4</div>
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#1D9E75', letterSpacing: '0.14em', marginBottom: 3, textTransform: 'uppercase' }}>Watch</div>
          <div style={{ fontSize: 12.5, color: '#0B1628', marginBottom: 4 }}>Conditions developing</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C' }}>↑ <span style={{ color: '#1D9E75' }}>+0.6 vs last week</span></div>
        </div>
      </div>
      <svg viewBox="0 0 400 64" preserveAspectRatio="none" style={{ width: '100%', height: 50, display: 'block', marginBottom: 14 }}>
        <defs><linearGradient id="ps2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1D9E75" stopOpacity="0.18"/><stop offset="100%" stopColor="#1D9E75" stopOpacity="0"/></linearGradient></defs>
        <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16 L 400 64 L 0 64 Z" fill="url(#ps2)"/>
        <path d="M 0 52 L 50 50 L 100 46 L 150 44 L 200 38 L 250 32 L 300 26 L 350 20 L 400 16" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="400" cy="16" r="3.5" fill="#1D9E75"/>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', padding: '12px 0', borderTop: '1px solid #E5E1D8' }}>
        {[{l:'Volume',v:'7.4'},{l:'Recency',v:'8.0'},{l:'Decision',v:'5.5'},{l:'Risk',v:'×0.70'}].map(c => (
          <div key={c.l}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9AA8B8', letterSpacing: '0.08em', marginBottom: 3, textTransform: 'uppercase' }}>{c.l}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, color: '#0B1628', fontWeight: 500 }}>{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceMini() {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E1D8', borderRadius: 12,
      boxShadow: '0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E1D8' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#1D9E75', background: '#E8F4EE', padding: '3px 8px', borderRadius: 99, letterSpacing: '0.06em', marginBottom: 6, display: 'inline-block', textTransform: 'uppercase' }}>Regulatory watch</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, color: '#0B1628', letterSpacing: '-0.01em' }}>BBNJ Ratification Tracker</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#9AA8B8', whiteSpace: 'nowrap' }}>12 · 3 new</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9AA8B8', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>Attached</div>
        {[
          { tag: 'Primary · Library', tagColor: '#1D9E75', title: 'PIF Communiqué on BBNJ ratification commitments', meta: 'PIF Secretariat · 12 Mar 2026' },
          { tag: 'Primary · Library', tagColor: '#1D9E75', title: 'UN Treaty Collection: BBNJ signatories deposited', meta: 'UN Treaty Collection · 18 Apr' },
          { tag: 'Secondary · Feed', tagColor: '#C97A1A', title: 'BBNJ ratification reaches 34 parties', meta: 'Reuters · 4h ago' },
        ].map((item, i, arr) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #EDEAE3' : 'none' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.1em', marginBottom: 3, textTransform: 'uppercase', color: item.tagColor }}>{item.tag}</div>
            <div style={{ color: '#0B1628', fontSize: 13, lineHeight: 1.4, marginBottom: 3 }}>{item.title}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#9AA8B8' }}>{item.meta}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', background: '#FAFAF7', borderTop: '1px solid #E5E1D8', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 14, right: 16, fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#C97A1A', border: '1px solid #E8C896', background: '#FBF3E5', padding: '3px 8px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Q3 2026</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9AA8B8', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>Ask Tideline</div>
        <div style={{ background: 'white', border: '1px solid #E5E1D8', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 12.5, color: '#0B1628', fontWeight: 500, lineHeight: 1.45 }}>
          What did Pacific bloc states commit to at PrepCom III?
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#3A4A5C' }}>
          The Pacific Islands Forum bloc collectively committed to depositing instruments before the second BBNJ COP<sup style={{ color: '#1D9E75', fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500 }}>¹</sup>. Fiji, Palau, and the Marshall Islands have since deposited<sup style={{ color: '#1D9E75', fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500 }}>²</sup>.
        </div>
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <section id="showcase" style={{ padding: '48px 20px', background: '#FAFAF7' }}>
      <ShowcaseRow
        id="feed"
        eyebrow="The feed"
        headline="Every signal, "
        accent="one inbox"
        body="Continuous coverage of every story that matters across ocean governance. Tagged to entities and trackers, summarised in the platform, with the source one click away."
        link={{ href: '#', label: 'See the feed' }}
      >
        <FeedMini />
      </ShowcaseRow>

      <ShowcaseRow
        id="pulse"
        eyebrow="The pulse"
        headline="Ten domains, "
        accent="scored weekly"
        body="A regulatory activity index calibrated against the historical record. Methodology published openly, including its failure modes."
        link={{ href: '#methodology', label: 'Read the methodology' }}
      >
        <PulseMini />
      </ShowcaseRow>

      <ShowcaseRow
        id="workspace"
        eyebrow="The workspace"
        headline="Tag the project, "
        accent="the platform builds the file"
        body="Build situation reports, regulatory watches, briefing notes. Tag a project. Primary documents from the library and stories from the feed attach automatically."
        link={{ href: '#', label: 'Tour the workspace' }}
      >
        <WorkspaceMini />
      </ShowcaseRow>
    </section>
  );
}

window.StatsBand = StatsBand;
window.Showcase = Showcase;
