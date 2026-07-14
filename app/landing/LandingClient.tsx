"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Lens data (§01 Personal relevance) ──────────────────────────────────────

interface LensStory {
  score: number;
  tag: string;
  headline: string;
  detail: string;
  source: string;
  time: string;
}

interface LensData {
  title: string;
  count: string;
  stories: LensStory[];
}

const LENS_DATA: Record<string, LensData> = {
  policy: {
    title: "For policy and advocacy",
    count: "14 relevant developments",
    stories: [
      { score: 81, tag: "Governance change", headline: "A revised regulatory text changes when organisations need to prepare", detail: "The source document and response deadline are attached to the development.", source: "Primary document", time: "9h ago" },
      { score: 74, tag: "Enforcement", headline: "A formal notice opens a new opportunity to submit evidence", detail: "The timeline shows how the issue developed and which institutions acted first.", source: "Two corroborating sources", time: "4h ago" },
      { score: 62, tag: "Position", headline: "A government position has shifted since the previous session", detail: "Tideline has preserved both statements and highlighted the material difference.", source: "Official statement", time: "6h ago" },
    ],
  },
  finance: {
    title: "For sustainable finance",
    count: "9 relevant developments",
    stories: [
      { score: 79, tag: "Material exposure", headline: "A sovereign fund adds ocean risk to its screening criteria", detail: "The change may affect how investors assess related holdings.", source: "Fund disclosure", time: "6h ago" },
      { score: 71, tag: "Disclosure", headline: "Two banks adopt new ocean reporting guidance", detail: "The commitments apply from the next reporting year and link to the source annex.", source: "Company filings", time: "7h ago" },
      { score: 58, tag: "Blue bond", headline: "A blue finance deal closes on terms that compare favourably with government borrowing", detail: "Tideline connects the transaction to the relevant nature and disclosure commitments.", source: "Market reporting", time: "1d ago" },
    ],
  },
  legal: {
    title: "For marine legal and general counsel",
    count: "8 relevant developments",
    stories: [
      { score: 86, tag: "Legal text change", headline: "A published text changes the reporting timetable", detail: "The current legal text, related decision and affected organisations are linked to the development.", source: "Primary source", time: "3h ago" },
      { score: 73, tag: "Interpretation", headline: "Two authoritative sources disagree on legal effect", detail: "Both claims remain visible so the distinction can be tested against the original record.", source: "Source conflict", time: "5h ago" },
      { score: 65, tag: "Procedure", headline: "A submission deadline is close enough that preparation should begin", detail: "The relevant session, filing date and source text are grouped with the matter.", source: "Official calendar", time: "8h ago" },
    ],
  },
  shipping: {
    title: "For shipping and compliance",
    count: "11 relevant developments",
    stories: [
      { score: 84, tag: "Deadline", headline: "Flag state responses are due before the next formal session", detail: "The current text, previous version and submission window are grouped in one place.", source: "Official calendar", time: "3h ago" },
      { score: 76, tag: "Compliance", headline: "Three states enter the first formal stage of a compliance process", detail: "Companies may need to review their supply chains before a final decision is made.", source: "Regulatory notice", time: "4h ago" },
      { score: 61, tag: "Position", headline: "An industry assessment favours the longer transition option", detail: "The paper is attached to the issue thread and the organisations involved are connected.", source: "Industry paper", time: "1d ago" },
    ],
  },
  research: {
    title: "For research and journalism",
    count: "17 relevant developments",
    stories: [
      { score: 77, tag: "Primary evidence", headline: "A new treaty implementation document has been published", detail: "The document is searchable by passage and connected to its earlier drafts.", source: "Treaty body", time: "5h ago" },
      { score: 69, tag: "Developing story", headline: "The fourth update changes the account of what happened", detail: "Tideline preserves the thread so each change can be traced through time.", source: "Four source timeline", time: "8h ago" },
      { score: 63, tag: "Source conflict", headline: "Two credible accounts disagree on legal effect", detail: "Both claims are visible with an explanation of what the distinction changes.", source: "Conflict monitor", time: "9h ago" },
    ],
  },
};

// ── Workflow data (§02 Product walkthrough) ──────────────────────────────────

interface WorkflowStep {
  eyebrow: string;
  title: string;
  sub: string;
  verdict: string;
  stats: [string | number, string][];
  listTitle: string;
  listCount: string;
  note: string;
  rows: [string, string, string][];
}

const WORKFLOW_DATA: Record<string, WorkflowStep> = {
  brief: {
    eyebrow: "Morning brief \u00b7 19 January 2026",
    title: "The BBNJ Agreement is now in force",
    sub: "The weekday brief selects material changes from the policy areas and organisations you follow.",
    verdict: "The Agreement entered into force on 17 January. Work now moves from ratification towards implementation and preparation for the first Conference of the Parties.",
    stats: [[2, "primary records"], [1, "policy area"], [6, "followed bodies"], [1, "change to review"]],
    listTitle: "Why it is in your brief", listCount: "BBNJ implementation", note: "The summary links to the treaty text and depositary record.",
    rows: [["NEW", "Agreement entered into force", "UN depositary record"], ["WHY", "Implementation work now becomes active", "Relevance to your role"], ["NEXT", "Prepare for the first Conference of the Parties", "Connected calendar"]],
  },
  tracker: {
    eyebrow: "Tracker \u00b7 BBNJ implementation",
    title: "The policy area has entered a new stage",
    sub: "A tracker keeps one governance area together and shows when its public activity or formal status changes.",
    verdict: "Entry into force changes the tracker from ratification monitoring to implementation, institutional preparation and the first Conference of the Parties.",
    stats: [["In force", "legal status"], [17, "January 2026"], [60, "ratifications reached"], [1, "next phase"]],
    listTitle: "What changed", listCount: "3 connected facts", note: "A tracker explains the reading and keeps its limits visible.",
    rows: [["LAW", "Article 68 test was met", "Treaty text"], ["REC", "Entry into force date confirmed", "Depositary record"], ["IMP", "Implementation phase opened", "Tracker status"]],
  },
  calendar: {
    eyebrow: "Regulatory calendar",
    title: "See what follows the legal change",
    sub: "The calendar connects formal dates, meetings and submission windows to the policy areas and organisations you follow.",
    verdict: "The entry into force date is fixed to the BBNJ tracker. Preparation dates for the first Conference of the Parties can now be followed in the same place.",
    stats: [[17, "January 2026"], [1, "legal milestone"], [1, "COP to prepare for"], [6, "followed bodies"]],
    listTitle: "Connected dates", listCount: "BBNJ", note: "Dates can be added to a workspace or exported.",
    rows: [["17", "Agreement entered into force", "Confirmed milestone"], ["NEXT", "Preparatory meetings", "Add when announced"], ["COP", "First Conference of the Parties", "Follow official timetable"]],
  },
  library: {
    eyebrow: "Primary evidence",
    title: "Open the legal basis and confirmation",
    sub: "The library stores primary documents, makes their text searchable and keeps the exact passage with the answer.",
    verdict: "Article 68 explains the legal test. The UN depositary record confirms that the Agreement entered into force on 17 January 2026.",
    stats: [[2, "primary records"], [68, "relevant article"], [1, "confirmed date"], [0, "unsupported claims"]],
    listTitle: "Evidence for this change", listCount: "2 records", note: "Document status and the cited passage remain visible.",
    rows: [["LAW", "BBNJ Agreement, Article 68", "Primary legal text"], ["UN", "UN depositary record", "Entry into force confirmed"], ["NOTE", "Relevant passage and citation", "Ready to use"]],
  },
  workspace: {
    eyebrow: "My workspace",
    title: "Turn the change into a briefing",
    sub: "A workspace keeps the development, notes, dates and source passages together while you write.",
    verdict: "The briefing now states what changed, why it matters, what comes next and which primary records support it. Export it with the citations attached.",
    stats: [[2, "sources attached"], [1, "tracker update"], [1, "calendar thread"], [1, "brief ready"]],
    listTitle: "Briefing contents", listCount: "Ready to review", note: "Sources remain attached when the briefing is exported.",
    rows: [["SUM", "What changed and why it matters", "Drafted from the record"], ["SRC", "Treaty text and depositary record", "Citations attached"], ["NEXT", "Implementation and COP preparation", "Dates connected"]],
  },
};

const WORKFLOW_NAV_MAP: Record<string, number> = { brief: 0, tracker: 3, calendar: 5, library: 6, workspace: 2 };

// ── Component ───────────────────────────────────────────────────────────────

export function ScrollProgress() {
  useEffect(() => {
    const bar = document.querySelector(".progress") as HTMLElement | null;
    if (!bar) return;
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${total > 0 ? (window.scrollY / total) * 100 : 0}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return null;
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className="menu-button"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen(!open)}
        style={open ? {} : {}}
        ref={(el) => {
          if (el) {
            el.classList.toggle("open", open);
          }
        }}
      >
      </button>
      {open && (
        <style>{`.nav-links { display: flex !important; }`}</style>
      )}
      {/* Close on link click */}
      <CloseMobileOnNav close={close} open={open} />
    </>
  );
}

function CloseMobileOnNav({ close, open }: { close: () => void; open: boolean }) {
  useEffect(() => {
    if (!open) return;
    const links = document.getElementById("nav-links");
    if (!links) return;
    const handler = (e: Event) => {
      if ((e.target as HTMLElement).tagName === "A") close();
    };
    links.addEventListener("click", handler);
    return () => links.removeEventListener("click", handler);
  }, [open, close]);
  return null;
}

export function LensTabs() {
  const [active, setActive] = useState("policy");
  const lens = LENS_DATA[active];

  return (
    <>
      <div className="lens-tabs" role="tablist" aria-label="Professional lens">
        {Object.entries(LENS_DATA).map(([key, data]) => (
          <button
            key={key}
            className={`lens-tab${active === key ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={active === key}
            data-lens={key}
            onClick={() => setActive(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
      <div className="desk-grid">
        <div className="desk-panel">
          <div className="desk-panel-head">
            <span><strong id="lens-title">{lens.title}</strong></span>
            <span id="lens-count">{lens.count}</span>
          </div>
          <div id="desk-stories">
            {lens.stories.map((s, i) => {
              const priority = s.score >= 80 ? "Act now" : s.score >= 70 ? "Review" : "Monitor";
              return (
                <article key={i} className={`desk-story${i === 0 ? " hot" : ""}`}>
                  <div className="desk-score" aria-label={`Priority: ${priority}`}>{priority}</div>
                  <div className="desk-copy">
                    <h3>{s.headline}</h3>
                    <p>{s.detail}</p>
                    <div className="desk-meta">
                      <span className="desk-chip">{s.tag}</span>
                      <span>{s.source}</span>
                      <span>&middot;</span>
                      <span>{s.time}</span>
                    </div>
                  </div>
                  <div className="story-action">&rarr;</div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function WorkflowSwitcher() {
  const [active, setActive] = useState("brief");
  const step = WORKFLOW_DATA[active];
  const miniNavItems = ["Dashboard", "News Feed", "My Workspace", "Trackers", "Conflicts", "Calendar", "Library", "Ask Tideline"];

  return (
    <div className="workflow-shell">
      <div className="workflow-intro">
        <div className="section-index"><span>02</span> One change, through Tideline</div>
        <h2>From discovery to a finished brief.</h2>
        <p>Follow one development through the platform. Each step removes work without removing the underlying evidence.</p>
        <p>On 17 January 2026, the BBNJ Agreement entered into force. This example shows how Tideline could have carried that change from the{" "}
          <a href="https://treaties.un.org/Pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXI-10&chapter=21&clang=_en" target="_blank" rel="noopener">UN depositary record</a>
          {" "}to an internal briefing.</p>
        <div className="workflow-steps" role="tablist" aria-label="Product workflow">
          {Object.entries(WORKFLOW_DATA).map(([key, data], i) => (
            <button
              key={key}
              className={`workflow-step${active === key ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={active === key}
              data-step={key}
              onClick={() => setActive(key)}
            >
              <span>{i + 1}</span>
              <b>{key === "brief" ? "Morning brief: what changed overnight"
                : key === "tracker" ? "Tracker: the state of one policy area"
                : key === "calendar" ? "Calendar: the dates connected to it"
                : key === "library" ? "Library: the primary evidence"
                : "Workspace: the finished briefing"}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="product-window" aria-live="polite">
        <div className="product-top">
          <div className="product-brand"><i>T</i> Tideline</div>
          <div className="product-search">Search or ask Tideline anything&nbsp;&nbsp; &#8984;K</div>
          <div className="product-user">LM</div>
        </div>
        <div className="product-body">
          <aside className="product-nav">
            <div className="product-date">Monday<br />13 July 2026<br /><span>06:47 BST</span></div>
            <div className="mini-nav">
              {miniNavItems.map((item, i) => (
                <div key={item} className={i === WORKFLOW_NAV_MAP[active] ? "active" : ""}>{item}</div>
              ))}
            </div>
            <div className="readiness-box">Readiness<span>2 deadlines approaching</span></div>
          </aside>
          <div className="product-main">
            <div className="product-eyebrow">{step.eyebrow}</div>
            <h3>{step.title}</h3>
            <p className="product-sub">{step.sub}</p>
            <div className="product-verdict">{step.verdict}</div>
            <div className="product-stats">
              {step.stats.map((s, i) => (
                <div key={i} className="product-stat"><b>{s[0]}</b><span>{s[1]}</span></div>
              ))}
            </div>
            <div className="product-card">
              <div className="product-card-head"><span>{step.listTitle}</span><span>{step.listCount}</span></div>
              <div>
                {step.rows.map((r, i) => (
                  <div key={i} className="product-row">
                    <div className="product-row-score">{r[0]}</div>
                    <div className="product-row-copy"><b>{r[1]}</b><span>{r[2]}</span></div>
                    <div className="product-row-action">&rarr;</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="product-footnote"><span>{step.note}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Platform demo tabs (live iframes of console mockups) ────────────────────

const DEMO_TABS: { label: string; src: string; caption: string }[] = [
  { label: "Dashboard", src: "/demo/tideline-dashboard.html", caption: "The morning view. What changed overnight across your tracked domains." },
  { label: "Trackers", src: "/demo/tideline-trackers.html", caption: "Eleven governance areas scored by public activity and formal status." },
  { label: "Tracker detail", src: "/demo/tideline-tracker-detail.html", caption: "One policy area in depth. Score history, events, entities and evidence." },
  { label: "News feed", src: "/demo/tideline-news-feed.html", caption: "Stories filtered to your domains, scored for materiality." },
  { label: "Conflicts", src: "/demo/tideline-source-conflicts.html", caption: "When authoritative sources disagree, both claims stay visible." },
  { label: "Library", src: "/demo/tideline-library.html", caption: "Primary documents searchable by passage. Ask a question, get a cited answer." },
  { label: "Directory", src: "/demo/tideline-directory.html", caption: "Organisations, people and instruments connected to your work." },
  { label: "Entity", src: "/demo/tideline-entity.html", caption: "One organisation or person. Mentions, connections and recent activity." },
  { label: "Calendar", src: "/demo/tideline-regulatory-calendar.html", caption: "Formal dates, deadlines and sessions connected to your policy areas." },
];

// Design width of the demo pages. The iframe renders at this width and is
// CSS-scaled down to fit the container, keeping text legible.
const DEMO_DESIGN_WIDTH = 1536;
const DEMO_DESIGN_HEIGHT = 960;

export function PlatformDemo() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const resize = () => {
      if (!stageRef.current) return;
      const s = Math.min(1, stageRef.current.clientWidth / DEMO_DESIGN_WIDTH);
      setScale(s);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const tab = DEMO_TABS[active];

  return (
    <div className="real-shell">
      <div className="real-tabs" role="tablist" aria-label="Platform screens">
        {DEMO_TABS.map((t, i) => (
          <button
            key={t.label}
            className={`real-tab${i === active ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        className="real-stage"
        ref={stageRef}
        style={{ height: Math.max(320, DEMO_DESIGN_HEIGHT * scale) }}
      >
        <iframe
          src={tab.src}
          title={tab.label}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: DEMO_DESIGN_WIDTH,
            height: DEMO_DESIGN_HEIGHT,
            border: 0,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            background: "#f4f6f8",
          }}
        />
      </div>
      <div className="real-caption">
        <span><strong>{tab.label}</strong></span>
        <span>{tab.caption}</span>
      </div>
    </div>
  );
}
