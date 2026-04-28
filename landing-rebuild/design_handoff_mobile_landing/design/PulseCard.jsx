// Mobile Pulse Card — redesigned for 390px.
// Original desktop card was cramped on mobile. Restructured:
// - Header stacks (tracker label + multilateral pill on its own row).
// - Score numeral keeps its 60px scale, paired with status block beside it.
// - Sparkline full-width, 56px tall.
// - Component grid 2x2 on mobile (was 4-up).

function PulseCard() {
  return (
    <div style={{
      margin: '0 20px 8px',
      background: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 1px 2px rgba(11,22,40,0.04), 0 12px 32px rgba(11,22,40,0.08)',
    }}>
      {/* Header row */}
      <div style={{ paddingBottom: 14, borderBottom: '1px solid #E5E1D8', marginBottom: 18 }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
        }}>Live tracker</div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12,
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
            fontSize: 18, color: '#0B1628', letterSpacing: '-0.01em',
          }}>ISA Deep-Sea Mining</div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C',
            border: '1px solid #E5E1D8', padding: '3px 8px', borderRadius: 99,
            letterSpacing: '0.06em', background: '#FAFAF7', whiteSpace: 'nowrap', flexShrink: 0,
          }}>0.70x</div>
        </div>
      </div>

      {/* Score stacks above band on mobile (was a 2-col grid → empty hole bug) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 72, color: '#1D9E75',
          lineHeight: 0.9, fontWeight: 500, letterSpacing: '-0.045em',
          marginBottom: 12,
        }}>7.2</div>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#1D9E75',
          letterSpacing: '0.16em', marginBottom: 6, textTransform: 'uppercase',
        }}>Elevated · Active conditions</div>
        <div style={{
          fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C',
        }}>↑ <span style={{ color: '#1D9E75' }}>+0.4 vs last week</span></div>
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 16, height: 56 }}>
        <svg width="100%" height="56" viewBox="0 0 400 64" preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="mob-spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M 0 50 L 50 46 L 100 42 L 150 40 L 200 35 L 250 30 L 300 24 L 350 18 L 400 12 L 400 64 L 0 64 Z" fill="url(#mob-spark)" />
          <path d="M 0 50 L 50 46 L 100 42 L 150 40 L 200 35 L 250 30 L 300 24 L 350 18 L 400 12" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="400" cy="12" r="6" fill="#1D9E75" opacity="0.2" />
          <circle cx="400" cy="12" r="3.5" fill="#1D9E75" />
        </svg>
      </div>

      {/* 2x2 component grid (was 4-up on desktop — cramped at 390px) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px',
        padding: '14px 0', borderTop: '1px solid #E5E1D8', borderBottom: '1px solid #E5E1D8',
        marginBottom: 14,
      }}>
        {[
          { l: 'Volume', v: '8.2' },
          { l: 'Recency', v: '9.0' },
          { l: 'Decision', v: '7.5' },
          { l: 'Risk', v: '×0.70' },
        ].map((c) => (
          <div key={c.l}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#9AA8B8',
              letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase',
            }}>{c.l}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: '#0B1628', fontWeight: 500 }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C', lineHeight: 1.5,
      }}>
        <span style={{ color: '#C97A1A', marginRight: 6, fontWeight: 500 }}>Disclosure</span>
        ISA commercial licensing runs structurally lower in this index. Read alongside ISA portal.
      </div>
    </div>
  );
}

window.PulseCard = PulseCard;
