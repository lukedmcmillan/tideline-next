"use client";

import { useState } from "react";

const BLACK   = "#0D0D0D";
const WHITE   = "#FFFFFF";
const TEAL    = "#1D9E75";
const RULE    = "#E4E4E4";
const SERIF   = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS    = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const MONO    = "var(--font-mono), 'DM Mono', monospace";

// ── Mobile nav ────────────────────────────────────────────────────────
function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ display: "block", width: 20, height: 1.5, background: BLACK, transition: "all 0.2s", transform: open ? "rotate(45deg) translate(4px,4px)" : "none" }} />
        <span style={{ display: "block", width: 20, height: 1.5, background: BLACK, transition: "all 0.2s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: 20, height: 1.5, background: BLACK, transition: "all 0.2s", transform: open ? "rotate(-45deg) translate(4px,-4px)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: WHITE, borderBottom: `1px solid ${RULE}`, zIndex: 200, padding: "12px 0 20px" }}>
          {[
            { label: "What it covers", href: "/#product" },
            { label: "Who it's for", href: "/#audience" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Sign in", href: "/login" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "11px 24px", color: BLACK, fontSize: 14, fontFamily: SANS, textDecoration: "none", opacity: 0.65 }}>
              {item.label}
            </a>
          ))}
          <div style={{ padding: "12px 24px 0" }}>
            <a href="/subscribe" style={{ display: "block", padding: "11px", background: BLACK, color: WHITE, fontSize: 13, fontWeight: 500, fontFamily: SANS, textAlign: "center", textDecoration: "none" }}>Start free trial</a>
          </div>
        </div>
      )}
    </>
  );
}

// ── Section rule ──────────────────────────────────────────────────────
function Rule() {
  return <div style={{ borderBottom: `1px solid ${RULE}` }} />;
}

// ── Main ──────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: WHITE, color: BLACK }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        a { text-decoration: none; color: inherit; }
        .nav-links { display: flex; }
        .nav-mobile { display: none; }
        .feed-grid { display: grid; grid-template-columns: 1fr 1px 1fr 1px 1fr; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1px 1fr 1px 1fr; gap: 0; }
        .audience-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .pricing-grid { display: grid; grid-template-columns: 1fr 1px 1fr; }
        .footer-row { display: flex; align-items: center; justify-content: space-between; }
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          .nav-mobile { display: flex !important; }
          .section-pad { padding-left: 24px !important; padding-right: 24px !important; }
          .feed-grid { grid-template-columns: 1fr; }
          .feed-rule-v { display: none; }
          .feed-rule-h { display: block !important; }
          .feature-grid { grid-template-columns: 1fr; }
          .feature-rule-v { display: none; }
          .audience-grid { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-rule-v { display: none; }
          .footer-row { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>

      {/* ═══ 1. NAV ═══ */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: WHITE, borderBottom: `2px solid ${BLACK}` }}>
        <div className="section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "relative" }}>
          <a href="/" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, fontFamily: MONO, letterSpacing: "0.18em", textTransform: "uppercase", color: BLACK, lineHeight: 1 }}>TIDELINE</span>
            <span style={{ fontSize: 9, fontFamily: MONO, letterSpacing: "0.2em", color: BLACK, opacity: 0.4, marginTop: 2 }}>OCEAN INTELLIGENCE</span>
          </a>
          <div className="nav-links" style={{ alignItems: "center", gap: 28 }}>
            {[
              { label: "What it covers", href: "/#product" },
              { label: "Who it\u2019s for", href: "/#audience" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Sign in", href: "/login" },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 13, fontFamily: SANS, color: BLACK, opacity: 0.55 }}>{l.label}</a>
            ))}
            <a href="/subscribe" style={{ fontSize: 13, fontFamily: SANS, fontWeight: 500, color: WHITE, background: BLACK, padding: "8px 18px" }}>Start free trial</a>
          </div>
          <div className="nav-mobile" style={{ alignItems: "center" }}>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ═══ 2. HERO ═══ */}
      <section className="section-pad" style={{ padding: "96px 48px 80px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "pulse 2.2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, fontFamily: MONO, color: BLACK, opacity: 0.45, letterSpacing: "0.06em" }}>Ocean intelligence</span>
        </div>
        <h1 style={{ fontSize: "clamp(42px, 5.5vw, 68px)", fontWeight: 700, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.08, margin: "0 0 20px", color: BLACK }}>
          The brief.<br />The trackers.<br />The edge.
        </h1>
        <div style={{ fontSize: 13, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.55, marginBottom: 24 }}>
          Built for every professional with a stake in the ocean.
        </div>
        <p style={{ fontSize: 19, fontFamily: SERIF, lineHeight: 1.65, maxWidth: 620, margin: "0 0 36px", color: BLACK }}>
          The ocean space moves fast. Tideline tracks everything that matters across governance, regulation, finance and policy &mdash; so you are never the professional who missed it.
        </p>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <a href="/subscribe" style={{ fontSize: 13, fontFamily: SANS, fontWeight: 500, color: WHITE, background: BLACK, padding: "13px 28px" }}>Start your free trial</a>
          <a href="/#product" style={{ fontSize: 13, fontFamily: SANS, color: BLACK, opacity: 0.55, textDecoration: "underline", textUnderlineOffset: "4px" }}>See what's covered</a>
        </div>
      </section>

      <Rule />

      {/* ═══ 4. LIVE FEED ═══ */}
      <section className="section-pad" style={{ padding: "64px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "pulse 2.2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase", color: BLACK, opacity: 0.45 }}>LATEST INTELLIGENCE</span>
        </div>
        <div className="feed-grid">
          {[
            { tag: "OCEAN GOVERNANCE", time: "06:42", headline: "BBNJ ratification tracker: third instrument deposit confirmed as Pacific bloc signals alignment", source: "IISD Reporting Services" },
            { tag: "DEEP-SEA MINING", time: "05:18", headline: "ISA Council defers exploitation code vote as sponsoring state pressure mounts ahead of July session", source: "ISA / Bloomberg Law" },
            { tag: "BLUE FINANCE", time: "04:55", headline: "Sovereign blue bond pipeline doubles in 12 months as IFC publishes revised certification framework", source: "IFC / Climate Bonds Initiative" },
          ].map((item, i) => (
            <>
              {i > 0 && <div key={`rv-${i}`} className="feed-rule-v" style={{ background: RULE }} />}
              {i > 0 && <div key={`rh-${i}`} className="feed-rule-h" style={{ display: "none", borderBottom: `1px solid ${RULE}`, margin: "0" }} />}
              <div key={i} style={{ padding: i === 0 ? "0 28px 0 0" : i === 2 ? "0 0 0 28px" : "0 28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.45 }}>{item.tag}</span>
                  <span style={{ fontSize: 10, fontFamily: MONO, opacity: 0.35 }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 15, fontFamily: SERIF, fontWeight: 700, lineHeight: 1.45, marginBottom: 10, color: BLACK }}>{item.headline}</div>
                <div style={{ fontSize: 12, fontFamily: SANS, opacity: 0.45 }}>{item.source}</div>
              </div>
            </>
          ))}
        </div>
      </section>

      <Rule />

      {/* ═══ 6. PRODUCT ═══ */}
      <section id="product" className="section-pad" style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ maxWidth: 560, marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontFamily: SERIF, fontWeight: 700, lineHeight: 1.2, margin: "0 0 12px" }}>One platform. Every signal that matters.</h2>
          <p style={{ fontSize: 17, fontFamily: SERIF, opacity: 0.5, lineHeight: 1.55, margin: 0 }}>Built for the professionals who cannot afford to miss what happened overnight.</p>
        </div>
        <div className="feature-grid">
          {[
            { num: "01", title: "The Morning Brief", body: "A synthesised summary of overnight developments across regulation, science, finance and policy. In your inbox before 7am. Written from primary sources, not press releases." },
            { num: "02", title: "Live Trackers", body: "Running status on BBNJ ratification, ISA negotiations, IUU enforcement actions, blue bond issuance, and the key regulatory dockets shaping the next five years." },
            { num: "03", title: "Source Intelligence", body: "Monitored feeds from 50+ primary sources: UN agencies, scientific journals, enforcement bodies, financial regulators and government ministries. Curated, not scraped." },
          ].map((f, i) => (
            <>
              {i > 0 && <div key={`frv-${i}`} className="feature-rule-v" style={{ background: RULE }} />}
              <div key={i} style={{ padding: i === 0 ? "0 32px 0 0" : i === 2 ? "0 0 0 32px" : "0 32px", borderTop: `1px solid ${RULE}`, paddingTop: 24 }}>
                <div style={{ fontSize: 11, fontFamily: MONO, opacity: 0.3, marginBottom: 12 }}>{f.num}</div>
                <div style={{ fontSize: 18, fontFamily: SERIF, fontWeight: 700, lineHeight: 1.35, marginBottom: 10, color: BLACK }}>{f.title}</div>
                <p style={{ fontSize: 15, fontFamily: SERIF, lineHeight: 1.65, opacity: 0.6, margin: 0 }}>{f.body}</p>
              </div>
            </>
          ))}
        </div>
      </section>

      <Rule />

      {/* ═══ 8. WHO IT IS FOR ═══ */}
      <section id="audience" className="section-pad" style={{ padding: "80px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ maxWidth: 480, marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontFamily: SERIF, fontWeight: 700, lineHeight: 1.2, margin: "0 0 12px" }}>Built for the people who read primary sources for a living.</h2>
        </div>
        <div className="audience-grid">
          {[
            { label: "NGO & Policy", headline: "Stay ahead of the regulatory calendar.", body: "Ocean policy moves in cycles. Tideline maps them. Track which instruments are moving, which negotiations are stalling, and where advocacy pressure is landing, with the source documentation to back your briefings." },
            { label: "Corporate & ESG", headline: "Know what your supply chain does not.", body: "Ocean regulation is increasingly binding. Blue finance standards are hardening. Tideline surfaces the developments that will affect your reporting obligations and investment exposure before they become material surprises." },
            { label: "Journalists & Researchers", headline: "The briefing room you always wanted.", body: "Tideline monitors the sources that matter: UN agencies, scientific journals, enforcement databases, government registries. Your morning brief arrives already read, already verified, already cross-referenced against what came before." },
            { label: "Ocean Investors & Funds", headline: "The signal before the consensus forms.", body: "In a sector still building its information infrastructure, Tideline is the daily read for fund managers, blended finance desks and impact investors who need to know what shifted before the rest of the market catches up." },
          ].map((seg, i) => (
            <div key={i} style={{ padding: 28, borderTop: `1px solid ${RULE}`, borderRight: i % 2 === 0 ? `1px solid ${RULE}` : "none" }} className={i % 2 === 0 ? "" : ""}>
              <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4, marginBottom: 12 }}>{seg.label}</div>
              <div style={{ fontSize: 18, fontFamily: SERIF, fontWeight: 700, lineHeight: 1.35, marginBottom: 10 }}>{seg.headline}</div>
              <p style={{ fontSize: 15, fontFamily: SERIF, lineHeight: 1.65, opacity: 0.55, margin: 0 }}>{seg.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* ═══ 10. PRICING ═══ */}
      <section id="pricing" className="section-pad" style={{ padding: "80px 48px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontFamily: SERIF, fontWeight: 700, lineHeight: 1.2, margin: "0 0 12px" }}>Simple pricing. No lock-in.</h2>
          <p style={{ fontSize: 17, fontFamily: SERIF, opacity: 0.5, lineHeight: 1.55, margin: 0, maxWidth: 520 }}>Start with a 14-day free trial on either plan. No credit card required until you decide to continue.</p>
        </div>
        <div className="pricing-grid">
          {[
            { label: "INDIVIDUAL", price: "\u00A379", period: "per month", features: ["Daily morning brief", "Full live tracker access", "50+ monitored primary sources", "Breaking alert notifications", "Archive search"], cta: "Start free trial", href: "/subscribe" },
            { label: "TEAM", price: "\u00A3399", period: "per month, up to 10 seats", features: ["Everything in Individual", "Team dashboard and shared notes", "Customised topic alerts", "Weekly synthesis briefing", "Priority support"], cta: "Start free trial", href: "/subscribe" },
          ].map((plan, i) => (
            <>
              {i > 0 && <div key="prv" className="pricing-rule-v" style={{ background: RULE }} />}
              <div key={i} style={{ padding: i === 0 ? "0 36px 0 0" : "0 0 0 36px" }}>
                <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em", opacity: 0.4, marginBottom: 16 }}>{plan.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontFamily: SERIF, fontWeight: 700 }}>{plan.price}</span>
                </div>
                <div style={{ fontSize: 13, fontFamily: SANS, opacity: 0.45, marginBottom: 28 }}>{plan.period}</div>
                <div style={{ marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ padding: "10px 0", borderBottom: `1px solid ${RULE}`, fontSize: 14, fontFamily: SERIF, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, opacity: 0.25 }}>&mdash;</span> {f}
                    </div>
                  ))}
                </div>
                <a href={plan.href} style={{ display: "block", padding: "12px", background: BLACK, color: WHITE, fontSize: 13, fontFamily: SANS, fontWeight: 500, textAlign: "center" }}>{plan.cta}</a>
                <div style={{ fontSize: 10, fontFamily: MONO, opacity: 0.35, textAlign: "center", marginTop: 10 }}>14 days free. Cancel any time.</div>
              </div>
            </>
          ))}
        </div>
      </section>

      <Rule />

      {/* ═══ 12. FOUNDER ═══ */}
      <section className="section-pad" style={{ padding: "80px 48px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 13, fontFamily: SANS, opacity: 0.45, marginBottom: 28 }}>Your ocean intelligence. Filtered to what you actually need.</div>
        <blockquote style={{ fontSize: "clamp(18px, 2.2vw, 24px)", fontFamily: SERIF, fontStyle: "italic", lineHeight: 1.55, margin: "0 0 28px", padding: 0, border: "none" }}>
          &ldquo;I have spent fifteen years covering the ocean for the Guardian, the BBC and Oceanographic Magazine. I built Tideline because I could not find a single platform that tracked what I needed to track. Every day, critical signals were scattered across dozens of sources that no individual could monitor in real time. Tideline is the product I always needed.&rdquo;
        </blockquote>
        <div style={{ fontSize: 13, fontFamily: SANS, opacity: 0.5, lineHeight: 1.6 }}>Luke McMillan, Founder, Tideline. Head of Hunting and Captivity, Whale and Dolphin Conservation. Ocean journalist and founder of Ocean Rising.</div>
      </section>

      <Rule />

      {/* ═══ 14. FINAL CTA ═══ */}
      <section className="section-pad" style={{ padding: "96px 48px", maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontFamily: SERIF, fontWeight: 700, lineHeight: 1.2, margin: "0 0 16px" }}>Start your free trial today.</h2>
        <p style={{ fontSize: 17, fontFamily: SERIF, opacity: 0.5, lineHeight: 1.55, margin: "0 0 36px" }}>14 days. Full access. No credit card required. Cancel before the trial ends and you will not be charged.</p>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <a href="/subscribe" style={{ fontSize: 13, fontFamily: SANS, fontWeight: 500, color: WHITE, background: BLACK, padding: "13px 28px" }}>Start free trial</a>
          <a href="/#pricing" style={{ fontSize: 13, fontFamily: SANS, color: BLACK, opacity: 0.55, textDecoration: "underline", textUnderlineOffset: "4px" }}>View pricing</a>
        </div>
      </section>

      <Rule />

      {/* ═══ 16. FOOTER ═══ */}
      <footer className="section-pad" style={{ padding: "32px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="footer-row">
          <span style={{ fontSize: 11, fontFamily: MONO, opacity: 0.35 }}>TIDELINE</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Contact", "Press"].map(l => (
              <span key={l} style={{ fontSize: 12, fontFamily: SANS, opacity: 0.4, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
