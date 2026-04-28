// Tideline Mobile Landing — Header
// Sticky, blurred warm-light background, hairline border on scroll.
// Replaces the desktop tri-column layout with a logo-left + menu-right pattern.
// Drawer opens full-screen with primary nav and stacked CTAs.

const TidelineGlyph = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, background: '#0B1628', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontFamily: "'Plus Jakarta Sans',sans-serif",
    fontWeight: 800, fontSize: size * 0.5, flexShrink: 0,
  }}>T</div>
);

function MobileHeader({ onCta, onLogin }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 80,
        background: 'rgba(250,250,247,0.92)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid #E5E1D8' : '1px solid transparent',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', minHeight: 56 }}>
          <a href="#top" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0});}} style={{
            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          }}>
            <TidelineGlyph size={28} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 19,
              color: '#0B1628', letterSpacing: '-0.015em',
            }}>Tideline</span>
          </a>
          <button onClick={() => setOpen(true)} aria-label="Menu" style={{
            width: 44, height: 44, background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="#0B1628" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#FAFAF7',
          display: 'flex', flexDirection: 'column',
          animation: 'tdl-slide-down 0.22s cubic-bezier(0.2,0.8,0.3,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', minHeight: 56, borderBottom: '1px solid #E5E1D8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TidelineGlyph size={28} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 19, color: '#0B1628', letterSpacing: '-0.015em' }}>Tideline</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{
              width: 44, height: 44, background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 5l12 12M17 5L5 17" stroke="#0B1628" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <nav style={{ flex: 1, padding: '8px 20px', overflow: 'auto' }}>
            {[
              { l: 'Platform', h: '#showcase' },
              { l: 'Methodology', h: '#methodology' },
              { l: 'Pricing', h: '#pricing' },
              { l: 'Built for', h: '#built-for' },
            ].map((item, i, arr) => (
              <a key={item.l} href={item.h} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 4px', borderBottom: i < arr.length - 1 ? '1px solid #EDEAE3' : 'none',
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22,
                color: '#0B1628', textDecoration: 'none', letterSpacing: '-0.01em',
              }}>
                {item.l}
                <span style={{ color: '#9AA8B8', fontFamily: "'DM Mono',monospace", fontSize: 16 }}>→</span>
              </a>
            ))}
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#6B7A8C',
              letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 32, marginBottom: 12, paddingLeft: 4,
            }}>Account</div>
            <a href="#login" onClick={(e)=>{e.preventDefault(); setOpen(false); onLogin?.();}} style={{
              display: 'block', padding: '14px 4px',
              fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: '#3A4A5C',
              textDecoration: 'none', borderBottom: '1px solid #EDEAE3',
            }}>Log in</a>
          </nav>
          <div style={{ padding: '16px 20px 28px', borderTop: '1px solid #E5E1D8', background: '#FFFFFF' }}>
            <button onClick={() => { setOpen(false); onCta?.(); }} style={{
              width: '100%', minHeight: 50,
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
              background: '#0B1628', color: 'white', fontSize: 16,
              borderRadius: 10, border: 'none', cursor: 'pointer',
            }}>Start your 7-day free trial</button>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#6B7A8C',
              letterSpacing: '0.04em', textAlign: 'center', marginTop: 12,
            }}>No card required · 47 founding spots left</div>
          </div>
        </div>
      )}
    </>
  );
}

window.MobileHeader = MobileHeader;
window.TidelineGlyph = TidelineGlyph;
