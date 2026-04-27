/**
 * BriefPreview.tsx
 *
 * Visual mirror of the v6 entity brief email (app/lib/entity-brief.ts).
 * Used on the landing page product showcase — static placeholder data only.
 *
 * ⚠ KEEP IN SYNC WITH app/lib/entity-brief.ts
 * When the v6 brief structure changes (sections, labels, layout), update
 * both this file and entity-brief.ts together.
 *
 * Sections rendered (condensed — 2 items each):
 *   THE WATCH · YOUR ENTITIES · ACROSS THE SECTOR · THE WEEK AHEAD
 */

// Card chrome constants — shared with all three Phase 4 showcase cards.
const CARD_BG    = "#0D1E35";
const TEXT_PRI   = "#E8EDF4";
const TEXT_SEC   = "rgba(232,237,244,0.65)";
const TEXT_MUT   = "rgba(232,237,244,0.4)";
const TEXT_DIM   = "rgba(232,237,244,0.28)";
const DIVIDER    = "rgba(255,255,255,0.07)";
const TEAL       = "#1D9E75";
const AMBER      = "#EF9F27";
const LABEL_FONT = "'DM Mono',monospace";
const BODY_FONT  = "'DM Sans',sans-serif";

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: TEXT_MUT,
  marginBottom: "12px",
};

const DIVIDER_STYLE: React.CSSProperties = {
  borderTop: `1px solid ${DIVIDER}`,
  margin: "20px 0",
};

// ── Placeholder data ──────────────────────────────────────────────────────────

const WATCH = {
  headline: "ISA council defers vote on mining code amid scientific body objections",
  summary:
    "The International Seabed Authority council postponed a scheduled vote on the commercial deep-sea mining code following formal objections submitted by ITLOS scientific advisors.",
  source: "ISA",
};

const DOT_QUIET = "rgba(255,255,255,0.2)";

const ENTITIES = [
  {
    name: "ACME Shipping Ltd",
    dot: AMBER,
    status: "IMO MEPC 83 draft amendments directly reference flag state obligations for vessels in ACME Shipping Ltd's registered category.",
  },
  {
    name: "Pacific Minerals Ltd",
    dot: AMBER,
    status: "ISA council deferral on the mining code delays regulatory clarity for Pacific Minerals Ltd's exploration licence area.",
  },
  {
    name: "Nauru Ocean Resources Inc",
    dot: AMBER,
    status: "Nauru Ocean Resources Inc named in ISA secretariat briefing note circulated ahead of the deferred vote.",
  },
  {
    name: "Blue Carbon Initiative",
    dot: DOT_QUIET,
    status: "No developments in the last 24 hours. Last relevant movement: UNFCCC Article 6 guidance, 18 April.",
  },
];

const SECTOR_STORIES = [
  {
    headline: "BBNJ treaty ratification reaches 34 parties as Pacific bloc confirms support",
    source: "UN Treaty Collection",
  },
  {
    headline: "IMO MEPC 83 opens with revised CII corridor proposals on the table",
    source: "IMO",
  },
];

const WEEK_AHEAD = [
  { day: "MON", text: "ISA Council session resumes. Contractor compliance review agenda published." },
  { day: "WED", text: "BBNJ Preparatory Committee third meeting, New York." },
  { day: "FRI", text: "IMO MEPC 83 plenary closes. Draft CII amendments expected for adoption." },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function BriefPreview() {
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: "12px",
        padding: "2rem",
        fontFamily: BODY_FONT,
        color: TEXT_PRI,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: LABEL_FONT,
          fontSize: "9px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: TEAL,
          paddingBottom: "16px",
          marginBottom: "20px",
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        TIDELINE &middot; Friday 25 April 2026
      </div>

      {/* Opening */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontFamily: BODY_FONT,
            fontSize: "18px",
            fontWeight: 600,
            color: TEXT_PRI,
            marginBottom: "8px",
            lineHeight: 1.3,
          }}
        >
          Good morning.
        </div>
        <div style={{ fontSize: "13px", color: TEXT_SEC, lineHeight: 1.55 }}>
          3 of your 4 tracked entities moved yesterday. Here&rsquo;s where each stands.
        </div>
      </div>

      <div style={DIVIDER_STYLE} />

      {/* THE WATCH */}
      <div style={{ marginBottom: "20px" }}>
        <div style={LABEL_STYLE}>THE WATCH</div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: TEXT_PRI,
            lineHeight: 1.4,
            marginBottom: "6px",
          }}
        >
          {WATCH.headline}
        </div>
        <div style={{ fontSize: "12px", color: TEXT_SEC, lineHeight: 1.6 }}>
          {WATCH.summary}
        </div>
        <div
          style={{
            fontFamily: LABEL_FONT,
            fontSize: "10px",
            color: TEXT_DIM,
            marginTop: "6px",
          }}
        >
          {WATCH.source}
        </div>
      </div>

      <div style={DIVIDER_STYLE} />

      {/* YOUR ENTITIES */}
      <div style={{ marginBottom: "20px" }}>
        <div style={LABEL_STYLE}>YOUR 4 TODAY</div>
        {ENTITIES.map((e) => (
          <div
            key={e.name}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: e.dot,
                flexShrink: 0,
                marginTop: "5px",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: TEXT_PRI,
                  lineHeight: 1.3,
                  marginBottom: "3px",
                }}
              >
                {e.name}
              </div>
              <div style={{ fontSize: "12px", color: TEXT_SEC, lineHeight: 1.55 }}>
                {e.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={DIVIDER_STYLE} />

      {/* ACROSS THE SECTOR */}
      <div style={{ marginBottom: "20px" }}>
        <div style={LABEL_STYLE}>ACROSS THE SECTOR</div>
        {SECTOR_STORIES.map((s, i) => (
          <div
            key={s.headline}
            style={{
              marginBottom: i < SECTOR_STORIES.length - 1 ? "14px" : 0,
              paddingBottom: i < SECTOR_STORIES.length - 1 ? "14px" : 0,
              borderBottom:
                i < SECTOR_STORIES.length - 1 ? `1px solid ${DIVIDER}` : "none",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: TEXT_PRI,
                lineHeight: 1.4,
                marginBottom: "3px",
              }}
            >
              {s.headline}
            </div>
            <div style={{ fontFamily: LABEL_FONT, fontSize: "10px", color: TEXT_DIM }}>
              {s.source}
            </div>
          </div>
        ))}
      </div>

      <div style={DIVIDER_STYLE} />

      {/* THE WEEK AHEAD */}
      <div>
        <div style={LABEL_STYLE}>THE WEEK AHEAD</div>
        {WEEK_AHEAD.map((w) => (
          <div
            key={w.day}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                fontFamily: LABEL_FONT,
                fontSize: "10px",
                fontWeight: 700,
                color: TEAL,
                flexShrink: 0,
                width: "28px",
                paddingTop: "2px",
              }}
            >
              {w.day}
            </div>
            <div style={{ fontSize: "12px", color: TEXT_SEC, lineHeight: 1.55 }}>
              {w.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
