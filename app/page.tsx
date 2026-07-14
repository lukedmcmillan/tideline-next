// Marketing design system is DELIBERATELY separate from the console product
// system in UI-SYSTEM.md. Do not reconcile them. Import NOTHING from
// components/ or app/platform/.

import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { DM_Sans, Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import { ScrollProgress, MobileMenu, LensTabs, WorkflowSwitcher, PlatformDemo } from "./landing/LandingClient";
import ReserveForm from "./landing/ReserveForm";
import "./landing/landing.css";

export const revalidate = 3600;

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tideline | Ocean policy intelligence",
  description: "Tideline monitors ocean policy, regulation and governance so professionals know what changed, why it matters and where the evidence is.",
  openGraph: {
    type: "website",
    title: "Tideline | Ocean policy intelligence",
    description: "Know what changed. Know what needs your attention. Have the source ready.",
    url: "https://www.thetideline.co/",
  },
};

interface LiveCounts {
  sources: number;
}

async function getLiveCounts(): Promise<LiveCounts> {
  const fallback: LiveCounts = { sources: 89 };
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const srcSet = new Set<string>();
    let from = 0;
    while (true) {
      const { data } = await supabase.from("stories").select("source_name").range(from, from + 999);
      if (!data || data.length === 0) break;
      data.forEach((r) => { if (r.source_name) srcSet.add(r.source_name); });
      if (data.length < 1000) break;
      from += 1000;
    }
    return { sources: srcSet.size || fallback.sources };
  } catch {
    return fallback;
  }
}

export default async function LandingPage() {
  const counts = await getLiveCounts();

  return (
    <div className={`landing-page ${dmSans.variable} ${plusJakarta.variable} ${newsreader.variable}`}>
      <ScrollProgress />
      <div className="progress" aria-hidden="true"></div>

      {/* ==================== ANNOUNCEMENT BAR ==================== */}
      <div className="announcement">
        <div className="announcement-inner">
          <span className="live-dot" aria-hidden="true"></span>
          <span><strong>{counts.sources} official and specialist sources monitored.</strong></span>
        </div>
      </div>

      {/* ==================== HEADER ==================== */}
      <header className="site-header">
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Tideline home">
            <span className="brand-mark">T</span>
            <span>
              <span className="brand-name">Tideline</span>
              <span className="brand-sub">Ocean intelligence</span>
            </span>
          </a>
          <div className="nav-links" id="nav-links">
            <a href="#intelligence">Today</a>
            <a href="#workflow">Platform</a>
            <a href="#investigations">Investigations</a>
            <a href="#trust">Methodology</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-actions">
            <a className="text-link" href="/sign-in">Sign in</a>
            <a className="button" href="#pricing">Reserve a founding place</a>
            <MobileMenu />
          </div>
        </nav>
      </header>

      <main id="top">
        {/* ==================== HERO ==================== */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1>Know what changed. Know what needs <em>your attention.</em></h1>
              <p>Tideline watches ocean policy, regulation and governance while you do the rest of your job. Material developments arrive with an explanation of why they may matter and the source behind them.</p>
              <div className="hero-actions">
                <a className="button large" href="#intelligence">See today&apos;s brief <span className="arrow">&darr;</span></a>
                <a className="button light large" href="#pricing">Reserve a founding place</a>
              </div>
              <div className="price-note"><b>&pound;39 a month, locked for life.</b> The founding rate ends January 2027.</div>
            </div>

            <div className="hero-visual" aria-label="A sample Tideline morning briefing">
              <div className="brief-window">
                <div className="brief-top">
                  <div className="brief-logo"><span>T</span> Tideline</div>
                  <div className="brief-status"><i className="live-dot"></i> Example morning edition</div>
                </div>
                <div className="brief-body">
                  <aside className="brief-rail">
                    <div className="brief-date">Monday<br /><span>19 January 2026<br />06:47 GMT</span></div>
                    <div className="rail-rule"></div>
                    <div className="rail-label">Your watch</div>
                    <div className="rail-domain"><i></i> BBNJ implementation</div>
                    <div className="rail-domain"><i></i> High seas governance</div>
                    <div className="rail-domain"><i></i> Treaty bodies</div>
                    <div className="rail-rule"></div>
                    <div className="rail-label">Status</div>
                    <div className="rail-domain"><i style={{ background: "#e8b457" }}></i> 1 material change</div>
                  </aside>
                  <div className="brief-content">
                    <div className="brief-kicker"><span>Your morning briefing</span><span>90 second read</span></div>
                    <h3>The BBNJ Agreement entered into force.</h3>
                    <p className="brief-summary">A material change in a policy area you follow, confirmed by the treaty text and UN depositary record.</p>
                    <article className="signal-card">
                      <div className="signal-top">
                        <span className="signal-score">01</span>
                        <span className="signal-tag">What changed</span>
                        <span className="signal-time">17 Jan 2026</span>
                      </div>
                      <h4>The Agreement is now legally in force</h4>
                      <p>Work moves from ratification towards implementation and preparation for the first Conference of the Parties.</p>
                      <div className="signal-source"><b>UN Treaty Collection</b><span>&middot;</span><span>Article 68 and depositary record attached</span></div>
                    </article>
                    <article className="signal-card">
                      <div className="signal-top">
                        <span className="signal-score" style={{ background: "#f5eddc", color: "#a96e13" }}>02</span>
                        <span className="signal-tag">Why it needs attention</span>
                        <span className="signal-time">Your BBNJ watch</span>
                      </div>
                      <h4>Implementation questions now become practical work</h4>
                      <p>Teams following high seas governance can start tracking institutional decisions, national implementation and the first COP timetable.</p>
                    </article>
                    <div className="brief-foot"><span>2 primary records attached</span><b>Open evidence &rarr;</b></div>
                  </div>
                </div>
              </div>
              <div className="float-note"><strong>Not just a headline</strong>What changed, why it matters to your work and the records that prove it.</div>
            </div>
          </div>
        </section>

        {/* ==================== PROOF RAIL ==================== */}
        <div className="proof-rail" aria-label="What the morning briefing delivers">
          <div className="proof-item"><div className="proof-number proof-word">Selected</div><div className="proof-label">Material changes from the policy areas and organisations you follow</div></div>
          <div className="proof-item"><div className="proof-number proof-word">Explained</div><div className="proof-label">Why the development may matter to your role and current work</div></div>
          <div className="proof-item"><div className="proof-number proof-word">Cited</div><div className="proof-label">The primary record and relevant passage remain attached</div></div>
          <div className="proof-item"><div className="proof-number proof-word">Ready to use</div><div className="proof-label">Move the evidence into a project, briefing or exported report</div></div>
        </div>

        {/* ==================== §01 PERSONAL RELEVANCE ==================== */}
        <section className="section signal-desk" id="intelligence">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <div className="section-index"><span>01</span> Personal relevance</div>
                <h2>One development. Four different working decisions.</h2>
              </div>
              <p>Tideline explains what the same verified development changes for your role, then gives you the evidence needed to act.</p>
            </div>

            {/* Relevance example */}
            <div className="relevance-example">
              <div className="relevance-event">
                <b>The verified change</b>
                <div>
                  <h3>The IMO postponed adoption of its Net-Zero Framework for one year.</h3>
                  <p>The October 2025 decision changed the timetable for global shipping emissions rules. Each view below starts with the same decision and supporting records.</p>
                </div>
              </div>
              <div className="relevance-roles">
                <article className="relevance-role"><span>ESG and sustainable finance</span><h3>Test an investment assumption before it reaches committee.</h3><p>See which vessel values, fuel investments and transition claims depend on the delayed IMO timetable. Open the supporting decision and use it in your screening note.</p></article>
                <article className="relevance-role"><span>Shipping and compliance</span><h3>Separate a delay from a reason to stop preparing.</h3><p>See that no new IMO obligation took effect, which regional requirements continue and what your emissions data and fuel planning teams should keep ready.</p></article>
                <article className="relevance-role"><span>Legal and advisory</span><h3>Answer the question your board or client will ask first.</h3><p>Confirm that no new IMO obligation arose, then identify the contracts, public claims and regional rules that still need review.</p></article>
                <article className="relevance-role"><span>Policy, research and reporting</span><h3>Reconstruct the decision without rebuilding the record.</h3><p>See the vote, state positions, agreed framework, source documents and next formal decision point in one evidence trail.</p></article>
              </div>
              <div className="relevance-buyers"><b>Built for analysts doing the monitoring, advisers turning it into recommendations and senior leaders accountable for the decision.</b></div>
            </div>

            {/* Lens tabs */}
            <div style={{ marginTop: 60 }}>
              <LensTabs />
            </div>
          </div>
        </section>

        {/* ==================== §02 WORKFLOW ==================== */}
        <section className="section workflow" id="workflow">
          <div className="section-inner">
            <WorkflowSwitcher />
          </div>
        </section>

        {/* ==================== LIVE PLATFORM DEMO ==================== */}
        <section className="section real-platform" id="product">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <div className="section-index"><span>03</span> The actual product</div>
                <h2>Explore the interface with sample data.</h2>
              </div>
              <p>These are real screens from the Tideline platform, populated with example content. The scores, stories and documents shown are illustrative, not today&apos;s live data.</p>
            </div>
            <PlatformDemo />
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <a className="button large" href="#pricing">Reserve a founding place</a>
            </div>
          </div>
        </section>

        {/* ==================== §04 LIBRARY / ASK (static demo) ==================== */}
        <section className="section library-section" id="library">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <div className="section-index"><span>04</span> Cited research</div>
                <h2>Ask a question. Get an answer with the source attached.</h2>
              </div>
              <p>Tideline searches a controlled library of primary documents and specialist reporting. Every substantive answer returns with evidence you can inspect.</p>
            </div>
            <div className="library-search-shell">
              <div className="library-bar">
                <input type="text" placeholder="What obligations arise from the BBNJ Agreement entering into force?" readOnly aria-label="Example question" />
                <button className="button" type="button" style={{ pointerEvents: "none" }}>Search</button>
              </div>
              <div className="library-examples">
                <span className="example-query">What changed in the latest ISA mining code draft?</span>
                <span className="example-query">Which states have ratified the BBNJ Agreement?</span>
                <span className="example-query">What is the current IUU carding status?</span>
              </div>
              {/* Static cited-answer demo */}
              <div className="answer-panel" style={{ display: "grid" }}>
                <div className="answer-source">
                  <b>BBNJ Agreement, Article 68</b>
                  Treaty text, UN Treaty Collection<br /><br />
                  <b>UN Depositary Record</b>
                  Status as at 17 January 2026
                </div>
                <div>
                  <div className="answer-copy">
                    The Agreement enters into force 120 days after the 60th ratification. The depositary record confirms this threshold was reached on 19 September 2025, placing entry into force on 17 January 2026.
                    <small>Answer drawn from 2 primary records. Passages cited below.</small>
                  </div>
                  <div className="answer-passage">
                    &ldquo;This Agreement shall enter into force 120 days after the date of deposit of the sixtieth instrument of ratification, approval, acceptance or accession.&rdquo; &mdash; BBNJ Agreement, Article 68(1)
                  </div>
                  <div className="answer-actions">
                    <a className="button" href="#pricing">Reserve a founding place</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== §04 TRUST / METHODOLOGY ==================== */}
        <section className="section trust" id="trust">
          <div className="section-inner">
            <div className="trust-grid">
              <div className="trust-copy">
                <div className="section-index"><span>05</span> How it works</div>
                <h2>Honest about what it does and does not know.</h2>
                <p>Tideline is sold on the quality of its sources and its usefulness, not on artificial intelligence. Technology helps classify, connect and search material. The methodology, thresholds and known blind spots are published.</p>
                <a className="method-link" href="/methodology">Read the methodology &rarr;</a>
              </div>
              <div className="trust-list">
                <div className="trust-row"><div className="trust-n">i</div><div><h3>Primary sources first</h3><p>Official records, treaty texts, regulatory notices and depositary records are preferred over secondary reporting.</p></div></div>
                <div className="trust-row"><div className="trust-n">ii</div><div><h3>Cited, not summarised away</h3><p>Every substantive claim links to the passage that supports it. The source remains accessible alongside the answer.</p></div></div>
                <div className="trust-row"><div className="trust-n">iii</div><div><h3>Quiet is a useful result</h3><p>When no material development crossed your threshold, the morning briefing says so. Tideline does not fill the space.</p></div></div>
                <div className="trust-row"><div className="trust-n">iv</div><div><h3>Competing claims stay visible</h3><p>When authoritative sources disagree, Tideline keeps both claims visible and explains what the distinction may change.</p></div></div>
                <div className="trust-row"><div className="trust-n">v</div><div><h3>Limits are published</h3><p>Tracker readings carry their known blind spots. Coverage gaps are stated, not hidden behind a confident number.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== §05 FOUNDER ==================== */}
        <section className="section founder-section" id="founder">
          <div className="section-inner founder-card">
            <div>
              <div className="section-index" style={{ color: "#74d6b5" }}>Why I built this</div>
              <h2>The tool I wanted on the mornings when something might have moved.</h2>
              <p>I have worked across ocean policy and campaigns with the same open tabs, saved PDFs and worry that an important development had passed without me seeing it. Tideline is built around that problem. It has been tested with 37 people working across finance, law, compliance, journalism and conservation.</p>
              <p>A 15 minute walkthrough is with me, not a sales team. Bring the issue, organisation or regulatory question you actually need to follow.</p>
            </div>
            <div className="founder-sign">
              <strong>Luke McMillan</strong>
              <span>Founder, Tideline</span>
              <a className="button cream" href="mailto:hello@thetideline.co?subject=15%20minute%20Tideline%20walkthrough">Book 15 minutes</a>
            </div>
          </div>
        </section>

        {/* ==================== §06 PRICING ==================== */}
        <section className="section pricing" id="pricing">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <div className="section-index" style={{ color: "#74d6b5" }}><span>07</span> Membership</div>
                <h2>One professional plan.</h2>
              </div>
              <p>Everything needed to monitor, understand and use ocean policy intelligence. Full access to the current platform, with every core research tool included.</p>
            </div>
            <div className="pricing-card">
              <div className="price-main">
                <div className="price-label">Founding member</div>
                <h3>Full platform access</h3>
                <div className="price-number">&pound;39 <span>a month</span></div>
                <p>Locked for life. The founding rate ends at launch, January 2027. Choose your domains and the organisations you follow, then receive your first personalised briefing.</p>
                <ReserveForm />
              </div>
              <div className="price-detail">
                <h3>Everything included</h3>
                <div className="price-list">
                  <div><i>&#10003;</i><span>Personal morning briefing every weekday</span></div>
                  <div><i>&#10003;</i><span>Live feed filtered to your work</span></div>
                  <div><i>&#10003;</i><span>Eleven governance trackers and alerts</span></div>
                  <div><i>&#10003;</i><span>Regulatory calendar and deadlines</span></div>
                  <div><i>&#10003;</i><span>7,700 plus document library</span></div>
                  <div><i>&#10003;</i><span>Cited answers from primary sources</span></div>
                  <div><i>&#10003;</i><span>Projects, notes and report exports</span></div>
                  <div><i>&#10003;</i><span>Alerts when authoritative sources disagree</span></div>
                </div>
                <div className="annual-note"><b>At launch:</b> &pound;99 a month. Invoices and receipts are available for professional expenses.</div>
              </div>
            </div>
            <div className="team-route">
              <div>
                <div className="price-label">For organisations</div>
                <h3>Give the whole team the same evidence base.</h3>
                <p>Discuss multiple seats, coordinated onboarding, invoicing and the policy areas your organisation needs to monitor. The conversation is directly with the founder, using a real piece of your team&apos;s work.</p>
              </div>
              <div className="team-route-actions">
                <a className="button cream large" href="mailto:hello@thetideline.co?subject=Tideline%20team%20access">Discuss team access</a>
                <span>No generic sales call. Bring the issue, organisation or regulatory question your team follows.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== §07 FAQ ==================== */}
        <section className="section faq" id="faq">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <div className="section-index"><span>08</span> Questions</div>
                <h2>Before you subscribe.</h2>
              </div>
              <p>Clear answers about coverage, verification and how the platform fits into professional work.</p>
            </div>
            <div className="faq-grid">
              <details><summary>Will Tideline cover the part of ocean governance I work on?</summary><p>Tideline monitors official records, treaty bodies, regulators, organisations and specialist reporting across eleven ocean governance domains. During onboarding you choose your domains and the companies, public bodies, states and people you need to follow. Use the trial on your actual area of work. If it does not surface useful material for that work, do not subscribe.</p></details>
              <details><summary>What is the difference between the free weekly brief and the paid platform?</summary><p>The weekly brief contains three developments selected for the wider Tideline audience. Professional membership gives you a personalised briefing every weekday, a live feed filtered to your work, followed organisations and people, alerts, the calendar, cited research and working projects.</p></details>
              <details><summary>How is my morning briefing personalised?</summary><p>Three things shape it: the governance domains you select, the type of work you do and the organisations and people you follow. Those choices determine which developments are selected, how their relevance is explained and which organisations or people appear in your watchlist line.</p></details>
              <details><summary>Does Tideline use artificial intelligence?</summary><p>Technology helps classify, connect and search material. Tideline is sold on the quality of its sources and its usefulness, not on AI. Ask Tideline searches the controlled document library rather than the open internet, and every substantive answer returns with evidence that you can inspect.</p></details>
              <details><summary>What happens when authoritative sources disagree?</summary><p>Tideline keeps both claims visible, shows the records they came from and explains why the distinction could matter. It does not quietly select a winner or turn competing accounts into one unsupported conclusion.</p></details>
              <details><summary>Does a tracker predict what governments will decide?</summary><p>No. Trackers identify when public activity is higher than usual and preparation may be justified. Method, thresholds and known blind spots are published so each reading can be judged properly.</p></details>
              <details><summary>What happens on a quiet day?</summary><p>The morning briefing says that nothing material crossed your threshold. Tideline does not fill the space with weaker stories to create the appearance of activity. Quiet is a useful result when the monitored sources were checked.</p></details>
              <details><summary>Can I cancel or get access for a team?</summary><p>Monthly membership can be cancelled before the next renewal. Teams can book a short conversation with the founder to discuss seats, shared workspaces and onboarding.</p></details>
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="final-cta" id="contact">
          <div className="final-cta-inner">
            <div className="eyebrow" style={{ justifyContent: "center" }}>Your first briefing</div>
            <h2>Open the laptop already knowing what changed.</h2>
            <p>Choose what you follow and see how Tideline turns the public record into a working morning brief.</p>
            <div className="final-actions">
              <a className="button large" href="#pricing">Reserve a founding place</a>
              <a className="button light large" href="#founder">Book 15 minutes with the founder</a>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-name">Tideline</div>
            <p>Ocean intelligence for people who need to notice change and show the evidence behind their work.</p>
          </div>
          <div className="footer-links">
            <a href="#trust">Methodology</a>
            <a href="#pricing">Pricing</a>
            <a href="/privacy">Privacy</a>
            <a href="mailto:hello@thetideline.co">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
