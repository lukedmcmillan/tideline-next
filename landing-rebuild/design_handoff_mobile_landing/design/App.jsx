// Tideline Mobile Landing — main app
// Composes Header / Hero / PulseCard / StatsBand / Showcase / Comparison / NotStrip / BuiltFor / Pricing / MidCta / Footer.

const SOCIAL = { entities: 1247, trackers: 10 };

function App() {
  const cta = () => alert('Trial signup flow (mocked)');
  const login = () => alert('Login flow (mocked)');

  return (
    <div style={{
      background: '#FAFAF7', color: '#0B1628',
      fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif",
      minHeight: '100%',
    }}>
      <MobileHeader onCta={cta} onLogin={login} />
      <main>
        <Hero onCta={cta} />
        <PulseCard />
        {/* breathing room before band */}
        <div style={{ height: 36 }} />
        <StatsBand socialProof={SOCIAL} />
        <Showcase />
        <Comparison />
        <MidCta onCta={cta} />
        <NotStrip />
        <BuiltFor />
        <Pricing onCta={cta} />
        <Footer />
      </main>
    </div>
  );
}

window.App = App;
