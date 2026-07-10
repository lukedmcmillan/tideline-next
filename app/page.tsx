import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import AppFrame from "./landing/AppFrame";
import RevealObserver from "./landing/RevealObserver";
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
  weight: ["700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tideline \u00b7 The ocean governance terminal",
  description:
    "Document library, regulatory trackers, entity directory, live feed and workspace for ocean governance professionals.",
};

interface LiveCounts {
  documents: number;
  passages: number;
  entities: number;
  sources: number;
  trackers: number;
}

async function getLiveCounts(): Promise<LiveCounts> {
  const fallback: LiveCounts = { documents: 7700, passages: 598750, entities: 940, sources: 63, trackers: 11 };
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const [docsRes, chunksRes, storyChunksRes, entsRes] = await Promise.all([
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("document_chunks").select("id", { count: "exact", head: true }),
      supabase.from("story_chunks").select("id", { count: "exact", head: true }),
      supabase.from("entities").select("id", { count: "exact", head: true }),
    ]);
    // Sources: paginated distinct count
    const srcSet = new Set<string>();
    let from = 0;
    while (true) {
      const { data } = await supabase.from("stories").select("source_name").range(from, from + 999);
      if (!data || data.length === 0) break;
      data.forEach((r) => { if (r.source_name) srcSet.add(r.source_name); });
      if (data.length < 1000) break;
      from += 1000;
    }
    // Trackers: distinct slugs scored in last 14 days, exclude governance
    const { data: trackerData } = await supabase
      .from("velocity_scores")
      .select("tracker_slug")
      .gt("calculated_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
    const trackerSlugs = [...new Set((trackerData || []).map((r) => r.tracker_slug))].filter(
      (s) => s !== "governance",
    );

    return {
      documents: docsRes.count ?? fallback.documents,
      passages: (chunksRes.count ?? 0) + (storyChunksRes.count ?? 0) || fallback.passages,
      entities: entsRes.count ?? fallback.entities,
      sources: srcSet.size || fallback.sources,
      trackers: trackerSlugs.length || fallback.trackers,
    };
  } catch {
    return fallback;
  }
}

function roundDown(n: number, to: number): string {
  const rounded = Math.floor(n / to) * to;
  return rounded.toLocaleString("en-GB");
}

export default async function LandingPage() {
  const counts = await getLiveCounts();

  return (
    <div
      className={`landing-page ${dmSans.variable} ${plusJakarta.variable}`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <RevealObserver />

      {/* ==================== NAV ==================== */}
      <nav className="landing-nav">
        <div className="wrap nav-inner">
          <a className="logo" href="#" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            <span className="logo-mark">T</span>Tideline
          </a>
          <div className="nav-links">
            <a href="#platform">Platform</a>
            <a href="#brief">The brief</a>
            <a href="#who">Who it&apos;s for</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-cta">
            <a className="signin" href="/sign-in">Sign in</a>
            <a className="btn btn-primary" href="#pricing">Reserve a founding place</a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <header className="hero">
        <div className="wrap">
          <h1 className="reveal" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            The ocean governance <span className="g">terminal</span>.
          </h1>
          <p className="hero-sub reveal">
            Most professionals in this sector have six tabs open right now.{" "}
            <strong>Tideline is one.</strong>
          </p>
          <p className="hero-surfaces reveal">
            Document Library &middot; Regulatory Trackers &middot; Entity Directory &middot; Live Feed &middot; Daily Brief &middot; Workspace
          </p>
          <div className="hero-ctas reveal">
            <a className="btn btn-primary btn-lg" href="#pricing">Reserve a founding place</a>
            <a className="btn btn-secondary btn-lg" href="#founder">15 minutes with the founder</a>
          </div>
          <p className="hero-note reveal">
            <b>&pound;39 a month</b> for founding members, locked for life. The founding rate ends at launch, January 2027.
          </p>
          <p className="hero-note reveal" style={{ marginTop: 6 }}>
            You&apos;ll get the general edition; pick your domains when you join.
          </p>
        </div>
      </header>

      {/* ==================== APP FRAME ==================== */}
      <AppFrame />

      {/* ==================== NUMBERS ==================== */}
      <div className="numbers reveal">
        <div className="wrap numbers-inner">
          <div className="n-cell">
            <div className="n-fig num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{roundDown(counts.documents, 100)}+</div>
            <div className="n-lab">treaty and regulatory documents</div>
          </div>
          <div className="n-cell">
            <div className="n-fig num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{roundDown(counts.entities, 10)}+</div>
            <div className="n-lab">companies and individuals you can follow for updates</div>
          </div>
          <div className="n-cell">
            <div className="n-fig num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{counts.trackers}</div>
            <div className="n-lab">domains tracked and scored weekly</div>
          </div>
          <div className="n-cell">
            <div className="n-fig num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{roundDown(counts.sources, 10)}+</div>
            <div className="n-lab">news sources read and summarised daily</div>
          </div>
        </div>
        <div className="n-sources wrap" style={{ maxWidth: 900 }}>
          <b>Sourced from the record itself:</b> IMO filings and DOALOS records, RFMO records, flag-state registries, treaty-body databases, ISA, OSPAR, CBD, FAO and IWC, alongside {roundDown(counts.sources, 10)}+ monitored news outlets.
        </div>
      </div>

      {/* ==================== SURFACES ==================== */}
      <section className="section">
        <div className="wrap">

          {/* --- Trackers --- */}
          <div className="surface reveal">
            <div className="surface-copy">
              <div className="eyebrow">The trackers</div>
              <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Know which domains are <span className="g">about to move</span>.</h3>
              <p>Each of the {counts.trackers} domains gets a score every Monday, based on how much is happening and how serious it looks. When ISA starts building toward a session, the score climbs weeks in advance, which is usually enough time to write the client note or prepare the review before anyone asks for it. Set an alert on a domain and the crossing comes to you, so you don&apos;t have to keep checking.</p>
              <div className="method-strip">
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="txt">The scoring method is published in full, hit rates and blind spots included. <a href="/methodology">Read the methodology &rarr;</a></div>
              </div>
            </div>
            <div className="mini">
              <div className="t-row"><div><div className="t-name">30x30 / MPA</div><div className="t-sub num">3 weeks at band</div></div><span className="pill elev">Elevated</span><div className="bar"><i className="elev" data-w="77"></i></div><div className="t-score elev num">7.7</div></div>
              <div className="t-row"><div><div className="t-name">BBNJ Treaty</div><div className="t-sub">Accelerating</div></div><span className="pill elev">Elevated</span><div className="bar"><i className="elev" data-w="72"></i></div><div className="t-score elev num">7.2</div></div>
              <div className="t-row"><div><div className="t-name">ISA Mining</div><div className="t-sub">Below threshold</div></div><span className="pill watch">Watch</span><div className="bar"><i className="watch" data-w="61"></i></div><div className="t-score watch num">6.1</div></div>
              <div className="t-row" style={{ marginBottom: 0 }}><div><div className="t-name">Offshore Wind</div><div className="t-sub">Quiet</div></div><span className="pill low">Low</span><div className="bar"><i className="low" data-w="36"></i></div><div className="t-score low num">3.6</div></div>
            </div>
          </div>

          {/* --- Library --- */}
          <div className="surface reveal">
            <div className="surface-copy">
              <div className="eyebrow">The library</div>
              <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Every treaty, regulation and decision. <span className="g">One search</span>.</h3>
              <p>Over {roundDown(counts.documents, 100)} documents from ISA, IMO, DOALOS, CBD, FAO, OSPAR and more, broken into {roundDown(counts.passages, 1000)}+ searchable passages. Ask in plain language and you get the exact article back, with the citation. It&apos;s the afternoon of research most of us have been doing by hand for years, done in a query.</p>
            </div>
            <div className="mini">
              <div className="d-row"><div className="d-ic">PDF</div><div><div className="d-t">UNCLOS Part XI: The Area, and the 1994 Implementing Agreement</div><div className="d-m num">UN DOALOS &middot; Treaty text &middot; 1982 / 1994</div></div><div className="d-rel num">0.96</div></div>
              <div className="d-row"><div className="d-ic">REG</div><div><div className="d-t">FAO Port State Measures Agreement: implementation review, third meeting</div><div className="d-m num">FAO &middot; Review &middot; 2024</div></div><div className="d-rel num">0.92</div></div>
              <div className="d-row" style={{ marginBottom: 0 }}><div className="d-ic">DEC</div><div><div className="d-t">IWC Resolution 2024-2 on the Eastern Pacific gray whale</div><div className="d-m num">IWC &middot; Resolution &middot; 2024</div></div><div className="d-rel num">0.88</div></div>
            </div>
          </div>

          {/* --- Directory --- */}
          <div className="surface reveal">
            <div className="surface-copy">
              <div className="eyebrow">The directory</div>
              <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{roundDown(counts.entities, 10)}+ companies and people. <span className="g">Follow the ones that matter</span>.</h3>
              <p>Every company, regulator, treaty body and key individual that moves this sector, with every alias resolved, so when NORI files you already know that means The Metals Company and Nauru. Follow the ones you work on and Tideline brings you everything they touch: stories, filings, documents, score movements. You get an alert when something happens, not a feed to scroll.</p>
            </div>
            <div className="mini">
              <div className="e-row"><div className="e-av">TM</div><div><div className="e-n">The Metals Company</div><div className="e-a num">TMC &middot; DeepGreen &middot; NORI</div></div><span className="e-status">QUIET</span><button className="e-star on">★</button></div>
              <div className="e-row"><div className="e-av">RN</div><div><div className="e-n">Republic of Nauru</div><div className="e-a num">Sponsoring state</div></div><span className="e-status">DORMANT</span><button className="e-star">★</button></div>
              <div className="e-row" style={{ marginBottom: 0 }}><div className="e-av">IS</div><div><div className="e-n">International Seabed Authority</div><div className="e-a num">ISA &middot; {counts.trackers} tracked domains</div></div><span className="e-status num">ACTIVE</span><button className="e-star on">★</button></div>
            </div>
          </div>

          {/* --- Live Feed --- */}
          <div className="surface reveal">
            <div className="surface-copy">
              <div className="eyebrow">The live feed</div>
              <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>{roundDown(counts.sources, 10)}+ sources, read and summarised. <span className="g">Every day</span>.</h3>
              <p>Regulator releases, treaty communiqu&eacute;s, trade press, NGO reports, wire coverage. All of it pulled in daily, checked, summarised and tagged to the domains and entities you follow, with the things you care about at the top.</p>
              <p className="fine">The brief comes to you at 7am. The feed is here for the rest of the day, whenever you go looking.</p>
            </div>
            <div className="mini">
              <div className="card"><div className="story-top"><span className="tag new">NEW</span><span className="tag cat">TREATY</span><span className="story-time num">5h ago</span></div><div className="story-h">Two further BBNJ ratifications deposited, count advances toward entry into force</div><div className="story-src"><b>UN DOALOS</b> &middot; View original &nearr;</div></div>
              <div className="card"><div className="story-top"><span className="tag new">NEW</span><span className="tag cat">ENFORCEMENT</span><span className="story-time num">9h ago</span></div><div className="story-h">Commission issues formal notice to flag state over IUU control failures</div><div className="story-src"><b>EU DG MARE</b> &middot; View original &nearr;</div></div>
              <div className="card" style={{ marginBottom: 0 }}><div className="story-top"><span className="tag new">NEW</span><span className="tag cat">FINANCE</span><span className="story-time num">14h ago</span></div><div className="story-h">Sovereign blue bond priced at 745m USD with debt-for-nature structure</div><div className="story-src"><b>Reuters</b> &middot; View original &nearr;</div></div>
            </div>
          </div>

          {/* --- Workspace --- */}
          <div className="surface reveal">
            <div className="surface-copy">
              <div className="eyebrow">The workspace</div>
              <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>The only tab you <span className="g">don&apos;t have to leave</span>.</h3>
              <p>A proper word processor with the whole platform behind it. Ask the database a question mid-sentence, pull a cited passage without opening another window, and take a brief or a pre-meeting note from blank page to export in one place.</p>
              <p>And your projects fill themselves. Choose what to follow, and the platform watches: when one of your entities or domains shows up in the press, a document or a filing, it attaches itself to the right project overnight. You open it in the morning and the new material is already in the source list.</p>
            </div>
            <div className="mini">
              <div className="ws-title" style={{ fontSize: 16, fontFamily: "var(--font-plus-jakarta), sans-serif" }}>ISA exploitation regs watch</div>
              <div className="ws-chips"><span className="ws-chip">ISA &times;</span><span className="ws-chip">The Metals Company &times;</span><span className="ws-chip add">+ Add entity</span></div>
              <div className="ws-new"><div className="t">Council circulates revised consolidated text</div><div className="m num">ISA &middot; attached overnight</div></div>
              <div className="ws-new"><div className="t">ITLOS opinion cited in Council working paper</div><div className="m num">ISA &middot; attached overnight</div></div>
              <div className="ws-actions" style={{ marginTop: 12 }}><button className="ws-btn">Ask Tideline</button><button className="ws-btn primary">Draft from notes</button></div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== THE BRIEF ==================== */}
      <section className="section brief-section" id="brief">
        <div className="wrap brief-grid">
          <div className="brief-copy reveal">
            <div className="eyebrow">The brief</div>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Your morning, <span className="g">before 7am</span>.</h2>
            <p>Every weekday morning you get a short brief built only from what you follow. If you track ISA, two mining companies and a handful of flag states, that&apos;s what your brief is about. Your colleague tracking plastics and port state control gets a completely different one.</p>
            <p>It&apos;s drawn from the overnight feed, scored against the trackers, and checked before it sends. And if nothing meaningful happened on your patch, it says so, rather than dressing quiet news up as important. That honesty is the point: <span className="kicker">when your brief says something moved, it moved.</span></p>
            <p>Ninety seconds with your coffee, and you&apos;re across it.</p>
          </div>
          <div className="reveal">
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-notch"></div>
                <div className="b-app num">Tideline &middot; 6:47</div>
                <div className="b-head" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Tuesday &middot; 2 entities moved overnight</div>
                <div className="b-date num">TUESDAY 8 JULY</div>
                <hr className="b-rule" />
                <div className="b-lab">GOOD MORNING</div>
                <div className="b-item-d">2 of your 6 tracked entities moved yesterday. One domain is approaching its threshold.</div>
                <hr className="b-rule" />
                <div className="b-lab">THE WATCH</div>
                <div className="b-item-t">ISA defers vote on mining code</div>
                <div className="b-item-d">Council postponed following ITLOS objections.</div>
                <hr className="b-rule" />
                <div className="b-lab">YOUR ENTITIES</div>
                <div className="b-ent"><span className="b-dot" style={{ background: "var(--green)" }}></span><span className="b-ent-n">BBNJ Agreement</span></div>
                <div className="b-ent-d num">Tonga ratified, bringing the total to 92.</div>
                <div className="b-ent"><span className="b-dot" style={{ background: "var(--amber)" }}></span><span className="b-ent-n">International Seabed Authority</span> <span className="b-up num">&uarr; 7.2</span></div>
                <div className="b-ent-d num">ISA Pulse rose 6.4 to 7.2 at Monday&apos;s scoring.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TOMORROW ==================== */}
      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">One day with it</div>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>What tomorrow <span className="g">looks like</span>.</h2>
          </div>
          <div className="timeline reveal">
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>6:47</div><div className="tl-text">The brief lands. Two of your entities moved overnight, one flagged. You read it with your coffee.<span className="tl-tag">THE BRIEF</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>8:30</div><div className="tl-text">The partner asks about the ISA decision. <q>Council deferred the vote. Here&apos;s the citation.</q><span className="tl-tag">THE LIBRARY</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>9:15</div><div className="tl-text">An alert: the Plastics Treaty domain crossed into elevated. You block out Thursday to prepare, weeks before the session.<span className="tl-tag">THE TRACKERS</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>11:00</div><div className="tl-text">You open the BBNJ briefing note. Twelve new documents attached themselves overnight. You write instead of hunting.<span className="tl-tag">THE WORKSPACE</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>14:20</div><div className="tl-text">A company you don&apos;t recognise comes up on a call. You look it up while they&apos;re still talking: a subsidiary of one you already follow.<span className="tl-tag">THE DIRECTORY</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>16:30</div><div className="tl-text">A client emails asking about the ISA session. You pull up the entity page, find the relevant filing, and reply in four minutes.<span className="tl-tag">THE WORKSPACE</span></div></div>
            <div className="tl-row"><div className="tl-time num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>17:15</div><div className="tl-text">One last pass of the feed: everything new on your domains, already sorted and summarised. You close the laptop knowing nothing slipped.<span className="tl-tag">THE LIVE FEED</span></div></div>
          </div>
        </div>
      </section>

      {/* ==================== PERSONAS ==================== */}
      <section className="section personas" id="who">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">Who it&apos;s for</div>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Built around the moments that this job <span className="g">gets hard</span>.</h2>
            <p>We asked professionals across the ocean sector what slows them down, and nearly everyone gave one of four answers: no single place covers what I need, stories are hard to track as they evolve, citable sources take too long to find, and I&apos;m searching across too many sources. Tideline was built against those four answers.</p>
          </div>
          <div className="persona-grid reveal">
            <div className="persona"><h3>ESG and sustainable finance</h3><p>Nearly every finance professional we spoke to gave the same answer: there is no single place that covers what they need. The fund asks about seabed mining exposure and the picture is scattered across a dozen sources. Tideline puts the entity&apos;s full regulatory history in front of you before the meeting ends.</p></div>
            <div className="persona"><h3>Consultants and advisers</h3><p>Consultants were one of the largest groups in the research, and their pain was consistent: too long spent searching across too many sources. They asked for all the relevant events in one place. That&apos;s the product. The client report starts from an assembled picture, not a blank tab.</p></div>
            <div className="persona"><h3>Shipping and compliance teams</h3><p>The regulatory landscape shifts twice between reviews, and tracking how a rule evolved is nobody&apos;s day job. Shipping professionals told us this is exactly where they lose time. MEPC 84 is approaching and your fleet note is already drafted, because the alert came a month ago.</p></div>
            <div className="persona"><h3>Journalists and editors</h3><p>Journalists in the research were the ones tracking the widest range of topics and spending the most hours doing it. The pain they named was searching across too many sources. The primary documents, the timeline and everyone involved are in one place, so the afternoon goes on writing.</p></div>
            <div className="persona"><h3>NGO and policy teams</h3><p>The single largest group in the research, and their top two answers were the same: stories are hard to track as they evolve, and citable sources take too long to find. When a funder asks who said what and when, the timeline and the citation are one click away, not somewhere in last month&apos;s tabs.</p></div>
            <div className="persona"><h3>Scientists and researchers</h3><p>Researchers told us the same two things again and again: citable sources are slow to find, and regulation is hard to follow from the outside. When reviewer two wants the policy relevance spelled out, the current state of the negotiations, and the treaty text behind it, is one search away.</p></div>
          </div>
        </div>
      </section>

      {/* ==================== WHAT IT ISN'T ==================== */}
      <section className="section">
        <div className="wrap">
          <div className="nots reveal">
            <div className="not"><h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Not Google Alerts.</h3><p>Google Alerts gives you volume. Tideline gives you signal, including when two authoritative sources are saying different things about the same event.</p></div>
            <div className="not"><h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Not a chatbot.</h3><p>Every answer cites the document it came from. Nothing lands in your inbox unverified.</p></div>
            <div className="not"><h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Not an academic database.</h3><p>For working professionals who need the answer in five minutes, not the literature review in five hours.</p></div>
          </div>
        </div>
      </section>

      {/* ==================== FOUNDER ==================== */}
      <section className="section personas" id="founder">
        <div className="wrap">
          <div className="section-head reveal" style={{ marginBottom: 44 }}>
            <div className="eyebrow">Why I built this</div>
          </div>
          <div className="founder reveal">
            <p>I&apos;m Luke. I covered this sector for years, and like everyone in it I did the job with six tabs open, a folder of PDFs, and the quiet worry that something had moved without me noticing. Tideline is the tool I wanted on those mornings.</p>
            <p>It hasn&apos;t been built in a vacuum. I&apos;ve spoken to people right across the ocean sector, ESG analysts, lawyers, compliance leads, journalists and policy officers, and a group of them tells me every week what&apos;s working and what&apos;s still missing. The product follows what they say, not what I guess.</p>
            <p>If you want to talk it through, book 15 minutes. You get me, not a sales team.</p>
            <div className="sig" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Luke McMillan<span>Founder, Tideline</span></div>
            <div className="founder-cta"><a className="btn btn-secondary" href="#">Book 15 minutes</a></div>
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section className="section" id="pricing">
        <div className="wrap">
          <div className="section-head reveal" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>One platform. Priced for the person, the team, <span className="g">or the firm</span>.</h2>
          </div>
          <p className="price-kicker reveal">Most of the professionals we spoke to spend between one and five hours a week just keeping across the sector, some far more. Tideline is built to give most of that back, and to hand it to the parts of your job that actually need you.</p>
          <div className="tiers reveal">
            <div className="tier feature">
              <div className="tier-tag">FOUNDING</div>
              <h3>Founding Member</h3>
              <div className="tier-price num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>&pound;39<span>/month</span></div>
              <div className="tier-sub">Locked for life. The founding rate ends at launch, January 2027.</div>
              <ul>
                <li>Everything in Individual, including Ask Tideline with citations</li>
                <li>Unlimited projects and exports</li>
                <li>Morning brief and threshold alerts</li>
                <li>Direct line to the founder</li>
                <li>The founding roundtable: vote on what ships next</li>
              </ul>
              <ReserveForm />
            </div>
            <div className="tier">
              <h3>Individual</h3>
              <div className="tier-price num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>&pound;99<span>/month</span></div>
              <div className="tier-sub" style={{ color: "var(--muted)", fontStyle: "italic" }}>Available at launch, January 2027.</div>
              <ul>
                <li>Full platform access</li>
                <li>Ask Tideline, with citations</li>
                <li>Unlimited projects and exports</li>
              </ul>
            </div>
            <div className="tier">
              <h3>Team</h3>
              <div className="tier-price num" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>&pound;699<span>/month</span></div>
              <div className="tier-sub">10 seats. If three or more of you would use it, this is the sensible tier.</div>
              <ul>
                <li>Everything in Individual, 10 seats</li>
                <li>Shared projects and workspaces</li>
                <li>Priority onboarding</li>
              </ul>
              <a className="btn btn-secondary" href="#">Talk to the founder</a>
            </div>
          </div>
          <div className="why-39 reveal">
            <h3 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Why &pound;39?</h3>
            <p>Because founding members aren&apos;t just early customers. You get the platform before the market does, and in return I ask for the one thing money can&apos;t buy: honest feedback from people who do this work every day. What you flag gets fixed. What you ask for gets built. Tideline becomes the platform of record for this sector by being shaped by the people in it, and the founding rate is locked for life because the people who helped build it should never pay full price for it. You get an invoice and receipt for every payment, suitable for a team, tooling or research budget.</p>
          </div>
        </div>
      </section>

      {/* ==================== CLOSING QUESTION ==================== */}
      <section className="section close-q">
        <div className="wrap">
          <div className="inner reveal">
            <div className="eyebrow" style={{ justifyContent: "center" }}>Why it exists</div>
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Built for the people whose business is <span className="g">the ocean</span>.</h2>
            <p>Tideline wasn&apos;t built in a boardroom. It was built by talking to the people who work in this sector, asking what a good morning actually looks like, and then making the thing that delivers it. Everything on this page came from what they said they needed to do their best work.</p>
            <div className="ask-line" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Six tabs, a folder of PDFs, and the quiet worry that something moved without you noticing. Tideline is how that ends.</div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL ==================== */}
      <section className="final">
        <div className="wrap">
          <div className="final-card reveal">
            <h2 style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>Become a <span className="g">founding member</span>.</h2>
            <p style={{ maxWidth: 620 }}>&pound;39 a month, locked for life, full platform access. The founding rate ends at launch, January 2027. If you&apos;d rather look around first, the trial is seven days with no card, and either way, pick what you follow and your first brief arrives tomorrow morning.</p>
            <div className="final-ctas">
              <a className="btn btn-primary btn-lg" href="#pricing">Reserve a founding place</a>
              <a className="btn btn-secondary btn-lg" href="#founder">15 minutes with the founder</a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="wrap foot-inner">
          <div>&copy; 2026 Tideline Ocean Intelligence</div>
          <div><a href="/methodology">Methodology</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="#">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}
