// Comparison, "Not"-strip, Built-for, Pricing, mid-CTA, Footer.

function Comparison() {
  const before = [
    { t: 'Mon 6:47',  x: 'Coffee. Six tabs from yesterday. Skim three newsletters.' },
    { t: 'Wed 11:00', x: 'Building the BBNJ briefing note. Open four tabs, copy-paste, hope it\u2019s current.' },
    { t: 'Fri 09:00', x: "Pulse on ISA crossed into elevated. You won\u2019t hear about it until next week." },
  ];
  const after = [
    { t: 'Mon 6:47',  x: 'Brief lands. Four entities moved overnight. Two flagged.' },
    { t: 'Wed 11:00', x: 'BBNJ project already has 12 documents attached overnight. Write, don\u2019t hunt.' },
    { t: 'Fri 09:00', x: "Pulse on ISA crossed into elevated. You\u2019ll see it Monday morning." },
  ];

  return (
    <section style={{
      padding: '48px 20px', background: '#FAFAF7',
      borderTop: '1px solid #E5E1D8', borderBottom: '1px solid #E5E1D8',
    }}>
      <h2 style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
        fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.025em',
        color: '#0B1628', marginBottom: 8, textWrap: 'balance',
      }}>
        Two ways to <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>spend a week</em>.
      </h2>
      <p style={{ fontSize: 15, color: '#3A4A5C', marginBottom: 28 }}>
        The same week, with and without the platform.
      </p>

      {/* Without */}
      <div style={{ borderRadius: 14, padding: '20px 18px', border: '1px solid #E5E1D8', background: '#F4F2EC', marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B8A89A', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #E5E1D8' }}>
          Without Tideline
        </div>
        {before.map((line, i, arr) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #EDEAE3' : 'none' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#C5B8AC', marginBottom: 4 }}>{line.t}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#8A7A6E' }}>{line.x}</div>
          </div>
        ))}
      </div>

      {/* With */}
      <div style={{ borderRadius: 14, padding: '20px 18px', border: '1px solid #0B1628', background: '#FFFFFF', boxShadow: '0 12px 36px rgba(11,22,40,0.10)', marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #E5E1D8' }}>
          With Tideline
        </div>
        {after.map((line, i, arr) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #EDEAE3' : 'none' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: 4 }}>{line.t}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#0B1628' }}>{line.x}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'left', maxWidth: '34ch', marginTop: 4 }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: 19, color: '#0B1628', lineHeight: 1.35, letterSpacing: '-0.015em',
        }}>
          Less than <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>£25 a week</em>. Less than a single billable hour.
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C', letterSpacing: '0.06em', marginTop: 6 }}>
          7-day free trial · No card required
        </div>
      </div>
    </section>
  );
}

function MidCta({ onCta }) {
  return (
    <section style={{ padding: '32px 20px', background: '#FAFAF7' }}>
      <div style={{ background: '#0B1628', padding: '28px 22px', borderRadius: 14 }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.015em',
          color: 'white', marginBottom: 6, textWrap: 'balance',
        }}>
          Try it free for 7 days. No card required.
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18, lineHeight: 1.5 }}>
          Founding member pricing locked at £39/month for life. 47 spots left.
        </div>
        <button onClick={onCta} style={{
          width: '100%', minHeight: 50,
          fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
          background: 'white', color: '#0B1628', fontSize: 15,
          borderRadius: 10, border: 'none', cursor: 'pointer',
        }}>Start your 7-day free trial</button>
      </div>
    </section>
  );
}

function NotStrip() {
  const items = [
    { h: 'Not Google Alerts.', b: 'Volume is not signal. Tideline scores activity, attributes sources, tracks how stories evolve.' },
    { h: 'Not a chatbot.', b: 'Curated by the platform\u2019s tracking systems and verified before it lands in your inbox.' },
    { h: 'Not an academic database.', b: 'For working professionals who need the answer in five minutes, not the literature review in five hours.' },
  ];
  return (
    <section style={{ background: '#F4F2EC', padding: '32px 20px', borderTop: '1px solid #E5E1D8', borderBottom: '1px solid #E5E1D8' }}>
      {items.map((item, i, arr) => (
        <div key={item.h} style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #E5E1D8' : 'none' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 18, color: '#0B1628', marginBottom: 6, letterSpacing: '-0.015em' }}>{item.h}</h3>
          <p style={{ fontSize: 14, color: '#3A4A5C', lineHeight: 1.5 }}>{item.b}</p>
        </div>
      ))}
    </section>
  );
}

function BuiltFor() {
  const segments = [
    { letter: 'L', name: 'Marine lawyers', track: 'Track regulatory changes across IMO, ISA, FAO, OSPAR.', get: 'Cited regulatory briefs in minutes.' },
    { letter: 'E', name: 'ESG and blue finance', track: 'Track TNFD, BBNJ, blue bonds, ISA exposure.', get: 'Portfolio intelligence with citable sources.' },
    { letter: 'S', name: 'Shipping compliance', track: 'Track IMO MEPC, MARPOL, EU MRV, port state.', get: 'Compliance window awareness early.' },
    { letter: 'N', name: 'Conservation NGOs', track: 'Track 30x30, IUU, MPAs, consultations.', get: 'Replace six tabs and Google Alerts.' },
    { letter: 'C', name: 'Climate finance', track: 'Track ISA, debt-for-nature, sustainable finance.', get: 'Emerging market signal early.' },
  ];
  return (
    <section id="built-for" style={{ padding: '48px 20px', background: '#FAFAF7' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>Built for</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0B1628', textWrap: 'balance' }}>
          Five sectors, <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>one platform</em>
        </h2>
      </div>
      <div style={{ borderTop: '1px solid #E5E1D8' }}>
        {segments.map(seg => (
          <div key={seg.letter} style={{ padding: '20px 0', borderBottom: '1px solid #E5E1D8', display: 'grid', gridTemplateColumns: '36px 1fr', gap: 16, alignItems: 'baseline' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 24, color: '#1D9E75', lineHeight: 1 }}>{seg.letter}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1628', marginBottom: 6, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{seg.name}</div>
              <div style={{ fontSize: 13, color: '#3A4A5C', lineHeight: 1.5, marginBottom: 4 }}>{seg.track}</div>
              <div style={{ fontSize: 13, color: '#6B7A8C', lineHeight: 1.5 }}>{seg.get}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ onCta }) {
  const tiers = [
    {
      name: 'Founding member', sub: 'Locked for life',
      price: '£39', per: 'per month, forever',
      features: ['Full platform access', 'Personalised brief', 'All trackers', 'Workspace and library', 'All future features included'],
      cta: 'Start your 7-day free trial', featured: true,
      badge: '47 of 50 left',
    },
    {
      name: 'Individual', sub: '7-day free trial',
      price: '£99', per: 'per month',
      features: ['Full platform access', 'Personalised brief', 'All trackers'],
      cta: 'Start your 7-day free trial', featured: false,
    },
    {
      name: 'Team', sub: '10 seats',
      price: '£699', per: 'per month',
      features: ['Everything in Individual', '10 seats', 'Shared library and projects', 'Priority support'],
      cta: 'Talk to us', featured: false,
    },
  ];

  return (
    <section id="pricing" style={{ padding: '48px 20px', background: '#F4F2EC' }}>
      <div style={{ marginBottom: 28, textAlign: 'left' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.025em', color: '#0B1628' }}>
          One platform. <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>No tiers</em>.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {tiers.map(t => (
          <div key={t.name} style={{
            background: '#FFFFFF',
            border: t.featured ? '1px solid #0B1628' : '1px solid #E5E1D8',
            borderRadius: 14, padding: '24px 22px',
            position: 'relative',
            boxShadow: t.featured ? '0 12px 36px rgba(11,22,40,0.12)' : '0 1px 2px rgba(11,22,40,0.04)',
            marginTop: t.featured ? 12 : 0,
          }}>
            {t.badge && (
              <div style={{
                position: 'absolute', top: -10, left: 22,
                background: '#C97A1A', color: 'white',
                fontFamily: "'DM Mono',monospace", fontSize: 10,
                letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 99,
                textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap',
              }}>{t.badge}</div>
            )}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C', letterSpacing: '0.14em', marginBottom: 4, textTransform: 'uppercase' }}>{t.name}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: t.featured ? '#C97A1A' : '#9AA8B8', letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>{t.sub}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 44, color: '#0B1628', lineHeight: 1, letterSpacing: '-0.035em' }}>{t.price}</div>
              <div style={{ fontSize: 13, color: '#6B7A8C' }}>{t.per}</div>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: 18, padding: 0 }}>
              {t.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: '#3A4A5C', padding: '5px 0', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#1D9E75', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={onCta} style={{
              width: '100%', minHeight: 48,
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
              background: t.featured ? '#0B1628' : 'transparent',
              color: t.featured ? 'white' : '#0B1628',
              fontSize: 14, borderRadius: 10,
              border: t.featured ? 'none' : '1px solid #0B1628',
              cursor: 'pointer',
            }}>{t.cta}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: '#0B1628', color: 'rgba(255,255,255,0.7)', padding: '36px 20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 28, height: 28, background: '#1D9E75', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 14 }}>T</div>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.015em' }}>Tideline</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Ocean Intelligence</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', marginBottom: 24 }}>
        {[
          { h: 'Platform', l: ['Feed', 'Trackers', 'Workspace', 'Library'] },
          { h: 'Company', l: ['Methodology', 'Pricing', 'Founder', 'Contact'] },
          { h: 'Legal', l: ['Privacy', 'Terms'] },
          { h: 'Account', l: ['Log in', 'Subscribe'] },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>{col.h}</div>
            {col.l.map(li => (
              <a key={li} href="#" style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '4px 0' }}>{li}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', borderTop: '1px solid #1A2C45', paddingTop: 16 }}>
        © 2026 Tideline · Built by the journalist who covers this beat.
      </div>
    </footer>
  );
}

window.Comparison = Comparison;
window.MidCta = MidCta;
window.NotStrip = NotStrip;
window.BuiltFor = BuiltFor;
window.Pricing = Pricing;
window.Footer = Footer;
