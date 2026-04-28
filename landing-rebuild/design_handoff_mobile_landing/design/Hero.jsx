// Hero — mobile-first.
// Stacks: eyebrow → H1 → sub → primary CTA → secondary text-link → trust line → Pulse card.
// H1 sized for 390px (38px); sub uses generous max-width 30ch.

function Hero({ onCta }) {
  return (
    <section style={{ padding: '24px 20px 36px' }}>
      {/* Eyebrow */}
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#1D9E75',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
      }}>
        <span className="tdl-live-dot" style={{
          width: 6, height: 6, background: '#1D9E75', borderRadius: '50%',
          display: 'inline-block', animation: 'tdl-pulse 2.5s ease-in-out infinite',
        }} />
        Ocean intelligence · Live
      </div>

      {/* H1 */}
      <h1 style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
        fontSize: 38, lineHeight: 1.05,
        letterSpacing: '-0.025em', color: '#0B1628',
        marginBottom: 16, textWrap: 'balance',
      }}>
        The platform of record for <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>ocean governance</em>
      </h1>

      <p style={{
        fontSize: 16, lineHeight: 1.55, color: '#3A4A5C',
        marginBottom: 22, maxWidth: '32ch',
      }}>
        Watch entities, read primary sources, score regulatory activity, and receive a personalised brief before 7am.
      </p>

      {/* Primary CTA — full width, generous tap target */}
      <button onClick={onCta} style={{
        width: '100%', minHeight: 52,
        fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
        background: '#0B1628', color: 'white', fontSize: 16,
        borderRadius: 10, border: 'none', cursor: 'pointer',
        marginBottom: 14,
      }}>
        Start your 7-day free trial
      </button>

      {/* Secondary link — own row, centred */}
      <a href="#showcase" style={{
        display: 'block', textAlign: 'center', marginBottom: 18,
        fontSize: 14, color: '#0B1628', fontWeight: 600,
        textDecoration: 'none',
      }}>
        See the platform <span style={{ borderBottom: '1px solid #0B1628' }}>→</span>
      </a>

      {/* Trust line — stacked on its own row, no overflow */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C',
        letterSpacing: '0.04em',
      }}>
        <span>No card required</span>
        <span style={{ color: '#E5E1D8' }}>·</span>
        <span>7 days full access</span>
        <span style={{ color: '#E5E1D8' }}>·</span>
        <span style={{ color: '#C97A1A', fontWeight: 600 }}>47 founding spots left</span>
      </div>
    </section>
  );
}

window.Hero = Hero;
