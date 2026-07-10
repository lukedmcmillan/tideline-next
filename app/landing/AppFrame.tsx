'use client';

import { useState, useEffect, useRef } from 'react';

type PanelId = 'feed' | 'workspace' | 'trackers' | 'library' | 'ask' | 'directory';

const TAB_ORDER: PanelId[] = ['feed', 'workspace', 'trackers', 'library', 'ask', 'directory'];

export default function AppFrame() {
  const [activeTab, setActiveTab] = useState<PanelId>('feed');
  const pausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function fillBars() {
      const bars = document.querySelectorAll<HTMLElement>('[data-w]');
      bars.forEach((el) => {
        const w = el.getAttribute('data-w');
        if (w) {
          el.style.width = w + '%';
        }
      });
    }
    fillBars();
  }, [activeTab]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setActiveTab((prev) => {
          const idx = TAB_ORDER.indexOf(prev);
          return TAB_ORDER[(idx + 1) % TAB_ORDER.length];
        });
      }
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="app-outer reveal" id="platform">
      <div
        className="app"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >

        {/* ---- APP TOP BAR ---- */}
        <div className="app-top">
          <div className="app-logo">
            <span className="mark">T</span>
            <span>
              Tideline
              <span className="sub">OCEAN INTELLIGENCE</span>
            </span>
          </div>
          <div className="app-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Search or ask Tideline anything
            <span className="kbd">⌘K</span>
          </div>
          <div className="app-user">
            <span className="plan">Individual</span>
            <span className="avatar">LM</span>
          </div>
        </div>

        {/* ---- APP BODY ---- */}
        <div className="app-body">

          {/* ---- SIDEBAR ---- */}
          <div className="app-side">
            <div className="side-date">
              <div className="day">Tuesday</div>
              <div className="full num">7 July 2026</div>
              <div className="time num">09:23 BST</div>
            </div>
            <div className="side-nav" role="tablist" aria-label="Platform surfaces">

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'feed'}
                data-panel="feed"
                onClick={() => setActiveTab('feed')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
                News Feed
              </button>

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'workspace'}
                data-panel="workspace"
                onClick={() => setActiveTab('workspace')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                My Workspace <span className="badge num">2</span>
              </button>

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'trackers'}
                data-panel="trackers"
                onClick={() => setActiveTab('trackers')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h4l3-8 4 16 3-8h4" />
                </svg>
                Trackers
              </button>

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'library'}
                data-panel="library"
                onClick={() => setActiveTab('library')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5z" />
                  <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
                </svg>
                Library
              </button>

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'ask'}
                data-panel="ask"
                onClick={() => setActiveTab('ask')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Ask Tideline
              </button>

              <button
                className="side-item"
                role="tab"
                aria-selected={activeTab === 'directory'}
                data-panel="directory"
                onClick={() => setActiveTab('directory')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Directory
              </button>

            </div>
            <div className="side-ready">
              <div className="lab">READINESS</div>
              <div className="val">MEPC 84</div>
              <div className="sub num">Session in 16 days</div>
            </div>
          </div>

          {/* ---- MAIN CONTENT ---- */}
          <div className="app-main">

            {/* NEWS FEED */}
            <section className={`panel${activeTab === 'feed' ? ' active' : ''}`} id="panel-feed" role="tabpanel">
              <div className="panel-head">
                <div className="panel-title">
                  <span className="dot"></span>
                  What you&apos;ve missed{' '}
                  <span className="panel-meta num" style={{ fontWeight: 500 }}>· 50 unread</span>
                </div>
                <a className="panel-link" href="#">Mark all read</a>
              </div>
              <div className="feed-grid">
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="story-top">
                    <span className="tag new">NEW</span>
                    <span className="tag cat">GOVERNANCE</span>
                  </div>
                  <div className="story-h" style={{ fontSize: '16.5px' }}>BBNJ Agreement: Tonga ratified</div>
                  <div className="story-d">Tonga has ratified the BBNJ Agreement, bringing the total number of ratifications to 92. As a Pacific Small Island Developing State with deep ocean governance stakes, Tonga&apos;s ratification strengthens the treaty&apos;s legitimacy among the communities most dependent on healthy high-seas ecosystems.</div>
                  <div className="story-src"><b>Tideline Treaty Monitor</b> · View original ↗ · 8 Jul, 06:31</div>
                </div>
                <div className="feed-side">
                  <div className="card">
                    <div className="story-top">
                      <span className="tag new">NEW</span>
                      <span className="tag cat">DEEP-SEA MINING</span>
                    </div>
                    <div className="story-h">ISA webinar highlights LLDC engagement in the regime of the Area</div>
                    <div className="story-src"><b>ISA</b> · View original ↗ · 7 Jul</div>
                  </div>
                  <div className="card">
                    <div className="story-top">
                      <span className="tag new">NEW</span>
                      <span className="tag cat">SHIPPING</span>
                    </div>
                    <div className="story-h">IMO announces regional team to deepen on-the-ground impact</div>
                    <div className="story-src"><b>IMO</b> · View original ↗ · 7 Jul</div>
                  </div>
                </div>
              </div>
              <div className="feed-row">
                <div className="card">
                  <div className="story-top">
                    <span className="tag new">NEW</span>
                    <span className="tag cat">OCEAN</span>
                    <span className="story-time num">18h ago</span>
                  </div>
                  <div className="story-h">Dolphins increasingly reliant on trawler bycatch in overfished Adriatic</div>
                  <div className="story-src"><b>Mongabay</b> · View original ↗</div>
                </div>
                <div className="card">
                  <div className="story-top">
                    <span className="tag new">NEW</span>
                    <span className="tag cat">OCEAN</span>
                    <span className="story-time num">20h ago</span>
                  </div>
                  <div className="story-h">Sightings off Southern Africa suggest blue and fin whales may be rebounding</div>
                  <div className="story-src"><b>Mongabay</b> · View original ↗</div>
                </div>
              </div>
            </section>

            {/* WORKSPACE */}
            <section className={`panel${activeTab === 'workspace' ? ' active' : ''}`} id="panel-workspace" role="tabpanel">
              <div className="panel-head">
                <div className="panel-title">My Workspace</div>
                <a className="panel-link" href="#">Export report</a>
              </div>
              <div className="ws-grid">
                <div className="ed">
                  <div className="ed-bar">
                    <span className="ed-t b">B</span>
                    <span className="ed-t i">I</span>
                    <span className="ed-t u">U</span>
                    <span className="ed-sep"></span>
                    <span className="ed-t">H2</span>
                    <span className="ed-t">&quot;</span>
                    <span className="ed-t">Aa</span>
                    <span className="ed-status num">3,091 words · Ready to draft</span>
                  </div>
                  <div className="ed-body">
                    <div className="ed-title">MEPC 84 briefing note</div>
                    <div className="ed-p">The revised CII framework reaches the committee with two flag states still diverging on implementation dates. For the fleet, the material question is whether the reduction factors adopted in the autumn session apply from the 2027 reporting year or are phased.</div>
                    <div className="ed-quote">&quot;Protected marine areas function as engines for wildlife population recovery, and the expedition team explicitly frame the findings as supporting the Biodiversity Framework&apos;s 30-by-2030 target.&quot;</div>
                    <div className="ed-cite"><b>Oceanographic Magazine</b> · Read source · pulled without leaving the page</div>
                    <div className="ws-actions" style={{ marginTop: '2px' }}>
                      <button className="ws-btn">↑ Upload</button>
                      <button className="ws-btn">Ask Tideline</button>
                      <button className="ws-btn primary">Draft from notes</button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="tip">Pick the people, companies and bodies you want to follow. Tideline attaches relevant stories as they arrive.</div>
                  <div className="ws-chips">
                    <span className="ws-chip">BBNJ Agreement ×</span>
                    <span className="ws-chip">ISA Secretariat ×</span>
                    <span className="ws-chip">Int. Whaling Commission ×</span>
                    <span className="ws-chip add">+ Add entity</span>
                  </div>
                  <div className="panel-meta" style={{ marginBottom: '8px' }}>
                    <b style={{ color: 'var(--ink)' }}>2 new</b> since your last visit
                  </div>
                  <div className="ws-new">
                    <div className="t">Council circulates revised consolidated text on exploitation regulations</div>
                    <div className="m num">ISA · 6 Jul</div>
                  </div>
                  <div className="ws-new" style={{ marginBottom: 0 }}>
                    <div className="t">Listen to whales to improve connection, study finds</div>
                    <div className="m num">Mongabay Oceans · 6 Jul</div>
                  </div>
                </div>
              </div>
            </section>

            {/* TRACKERS */}
            <section className={`panel${activeTab === 'trackers' ? ' active' : ''}`} id="panel-trackers" role="tabpanel">
              <div className="panel-head">
                <div className="panel-title">Trackers</div>
                <div className="panel-meta num">Scored Monday 06:00</div>
              </div>
              <div className="t-row">
                <div>
                  <div className="t-name">30x30 / MPA Designations</div>
                  <div className="t-sub num">3 weeks at band</div>
                </div>
                <span className="pill elev">Elevated</span>
                <div className="bar"><i className="elev" data-w="77"></i></div>
                <div className="t-score elev num">7.7</div>
              </div>
              <div className="t-row">
                <div>
                  <div className="t-name">BBNJ High Seas Treaty</div>
                  <div className="t-sub">Accelerating</div>
                </div>
                <span className="pill elev">Elevated</span>
                <div className="bar"><i className="elev" data-w="72"></i></div>
                <div className="t-score elev num">7.2</div>
              </div>
              <div className="t-row">
                <div>
                  <div className="t-name">Plastics Treaty (INC)</div>
                  <div className="t-sub">Accelerating</div>
                </div>
                <span className="pill watch">Watch</span>
                <div className="bar"><i className="watch" data-w="69"></i></div>
                <div className="t-score watch num">6.9</div>
              </div>
              <div className="t-row">
                <div>
                  <div className="t-name">IMO Shipping Emissions</div>
                  <div className="t-sub num">MEPC in 16 days</div>
                </div>
                <span className="pill watch">Watch</span>
                <div className="bar"><i className="watch" data-w="64"></i></div>
                <div className="t-score watch num">6.4</div>
              </div>
              <div className="t-row">
                <div>
                  <div className="t-name">ISA Deep-Sea Mining</div>
                  <div className="t-sub">Below threshold</div>
                </div>
                <span className="pill watch">Watch</span>
                <div className="bar"><i className="watch" data-w="61"></i></div>
                <div className="t-score watch num">6.1</div>
              </div>
              <div className="panel-meta num" style={{ marginTop: '11px' }}>+ 6 more domains · alerts fire when a domain crosses a band</div>
            </section>

            {/* LIBRARY */}
            <section className={`panel${activeTab === 'library' ? ' active' : ''}`} id="panel-library" role="tabpanel">
              <div className="panel-head">
                <div className="panel-title">Library</div>
                <div className="panel-meta num">7,700+ documents · 598,000+ passages</div>
              </div>
              <div className="ask-bar" style={{ maxWidth: 'none', margin: '0 0 10px' }}>
                <span className="q" style={{ color: 'var(--ink)' }}>area-based management tools high seas</span>
                <button className="go">Search</button>
              </div>
              <div className="panel-meta num" style={{ marginBottom: '9px' }}>4 of 128 results · searched by meaning, not keywords · 0.4s</div>
              <div className="d-row">
                <div className="d-ic">PDF</div>
                <div>
                  <div className="d-t">BBNJ Agreement, Part III: Area-Based Management Tools including Marine Protected Areas</div>
                  <div className="d-m num">UN DOALOS · Treaty text · Art. 17 to 26 · 2023</div>
                </div>
                <div className="d-rel num">0.94</div>
              </div>
              <div className="d-row">
                <div className="d-ic">DOC</div>
                <div>
                  <div className="d-t">CCAMLR Conservation Measure 91-05: Ross Sea Region Marine Protected Area</div>
                  <div className="d-m num">CCAMLR · In force · 2016</div>
                </div>
                <div className="d-rel num">0.91</div>
              </div>
              <div className="d-row">
                <div className="d-ic">PDF</div>
                <div>
                  <div className="d-t">ISA Draft Regulations on Exploitation of Mineral Resources in the Area, consolidated text</div>
                  <div className="d-m num">International Seabed Authority · ISBA/29/C · 2025</div>
                </div>
                <div className="d-rel num">0.89</div>
              </div>
              <div className="d-row" style={{ marginBottom: 0 }}>
                <div className="d-ic">RES</div>
                <div>
                  <div className="d-t">IMO Resolution MEPC.377(80): 2023 Strategy on Reduction of GHG Emissions from Ships</div>
                  <div className="d-m num">IMO · Adopted · 2023</div>
                </div>
                <div className="d-rel num">0.86</div>
              </div>
            </section>

            {/* ASK TIDELINE */}
            <section className={`panel${activeTab === 'ask' ? ' active' : ''}`} id="panel-ask" role="tabpanel">
              <div className="ask-panel">
                <div className="ask-ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h4>Ask Tideline</h4>
                <p className="sub">Cited answers from the document library. Answers come from the document library we built, not a live web search.</p>
                <div className="ask-bar">
                  <span className="q">Ask anything about ocean governance, regulation, or policy...</span>
                  <button className="go">Search</button>
                </div>
                <p className="ask-hint">Tideline reports what sources say. It does not tell you what to conclude.</p>
                <div className="chips">
                  <span className="chip"><span className="lab">TREATY</span>What is BBNJ?</span>
                  <span className="chip"><span className="lab">REGULATION</span>What changed in deep-sea mining regulation recently?</span>
                  <span className="chip"><span className="lab">POLICY</span>What does the ISA mining code say about environmental bonds?</span>
                </div>
              </div>
            </section>

            {/* DIRECTORY */}
            <section className={`panel${activeTab === 'directory' ? ' active' : ''}`} id="panel-directory" role="tabpanel">
              <div className="panel-head">
                <div className="panel-title">Directory</div>
                <div className="panel-meta num">My tracked (10) · All entities (1,000+)</div>
              </div>
              <div className="dir-grid">
                <div className="dir-list">
                  <div className="dir-filters">
                    <span className="dir-f on">COMPANY</span>
                    <span className="dir-f">FUND</span>
                    <span className="dir-f on">TREATY</span>
                    <span className="dir-f">NGO</span>
                    <span className="dir-f">PERSON</span>
                    <span className="dir-f">VESSEL</span>
                  </div>
                  <div className="e-row">
                    <div className="e-av">BB</div>
                    <div>
                      <div className="e-n">BBNJ Agreement</div>
                      <div className="e-a">TREATY · BBNJ</div>
                    </div>
                    <span className="e-status">DORMANT</span>
                    <button className="e-star on">★</button>
                  </div>
                  <div className="e-row">
                    <div className="e-av">IS</div>
                    <div>
                      <div className="e-n">International Seabed Authority</div>
                      <div className="e-a num">ORGANISATION · today</div>
                    </div>
                    <span className="e-status">ACTIVE</span>
                    <button className="e-star on">★</button>
                  </div>
                  <div className="e-row">
                    <div className="e-av">HM</div>
                    <div>
                      <div className="e-n">HMM</div>
                      <div className="e-a">COMPANY · Shipping</div>
                    </div>
                    <button className="e-star">★</button>
                  </div>
                  <div className="e-row" style={{ marginBottom: 0 }}>
                    <div className="e-av">YM</div>
                    <div>
                      <div className="e-n">Yang Ming Marine Transport</div>
                      <div className="e-a">COMPANY · IMO</div>
                    </div>
                    <button className="e-star">★</button>
                  </div>
                </div>
                <div className="dir-detail">
                  <div className="dd-kind">ORGANISATION</div>
                  <div className="dd-name">International Seabed Authority</div>
                  <div className="dd-meta num">21 mentions in last 30 days · Last seen today</div>
                  <div className="dd-tabs">
                    <span className="on">Overview</span>
                    <span>Timeline</span>
                    <span>Stories</span>
                  </div>
                  <div className="dd-track">
                    <span className="star">★</span>
                    <span><b>YOUR TRACKING</b> · Tracking since 1 March</span>
                    <button className="dd-untrack">Untrack</button>
                  </div>
                  <div className="dd-stats">
                    <div className="dd-stat">
                      <div className="lab">MENTION FREQUENCY</div>
                      <div className="freq">
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i className="hot"></i>
                        <i></i>
                      </div>
                    </div>
                    <div className="dd-stat">
                      <div className="lab">CONTEXT BREAKDOWN</div>
                      <div className="ctx-row">
                        <span className="d" style={{ background: 'var(--green)' }}></span>
                        Regulatory
                        <span className="n num">12</span>
                      </div>
                      <div className="ctx-row">
                        <span className="d" style={{ background: 'var(--amber)' }}></span>
                        Developing
                        <span className="n num">6</span>
                      </div>
                      <div className="ctx-row">
                        <span className="d" style={{ background: 'var(--red)' }}></span>
                        Institutional
                        <span className="n num">3</span>
                      </div>
                    </div>
                  </div>
                  <div className="dd-mention">
                    <div className="m-top">
                      <span className="m-date num">8 JUL 06:30</span>
                      <span className="m-tag">REGULATORY</span>
                    </div>
                    <p>Webinar highlights LLDC engagement in the regime of the Area.</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: activeTab === tab ? 'var(--green)' : '#D8D5CB',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
              transition: 'background .2s',
            }}
            aria-label={`Go to ${tab}`}
          />
        ))}
      </div>
    </div>
  );
}
