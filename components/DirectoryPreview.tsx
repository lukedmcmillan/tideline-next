// DRIFT MANAGEMENT: This component is a static marketing mirror of
// app/platform/(shell)/directory/page.tsx. If EntityCard layout, SignalPill
// styles, TypePill styles, or StarButton change in the live page, update
// this component to match. Key design tokens must stay in sync.

const F  = "'DM Sans', system-ui, sans-serif";
const M  = "'DM Mono', monospace";
const T1 = "#202124";
const T4 = "#9AA0A6";
const B  = "#DADCE0";
const BLT = "#E8EAED";
const TEAL = "#1D9E75";
const WHITE = "#FFFFFF";

type SignalState = "HIGH" | "WATCH" | "QUIET" | "DORMANT";

function signalStyle(s: SignalState): { bg: string; color: string; dot: string } {
  switch (s) {
    case "HIGH":    return { bg: "#E6F5EE", color: "#0F7452", dot: "#1D9E75" };
    case "WATCH":   return { bg: "#FDF4E4", color: "#8F5E10", dot: "#EF9F27" };
    case "QUIET":   return { bg: "#EEF2F7", color: "#5A7290", dot: "#8BA0BC" };
    case "DORMANT": return { bg: "#F4F6F9", color: "#8BA0BC", dot: "#C2CBD6" };
  }
}

function SignalPill({ signal }: { signal: SignalState }) {
  const { bg, color, dot } = signalStyle(signal);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color,
      borderRadius: 10, padding: "3px 7px 3px 5px",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", fontFamily: M,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {signal}
    </span>
  );
}

function TypePill({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
      color: T4, border: `1px solid #D4DDE8`,
      borderRadius: 10, padding: "2px 7px", fontFamily: M,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="#EF9F27">
      <path d="M9 1.5l2.1 4.8 5.1.5-3.8 3.5 1.2 5L9 12.6 4.4 15.3l1.2-5L1.8 6.8l5.1-.5L9 1.5z"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#C2CBD6" strokeWidth="1.3">
      <path d="M9 1.5l2.1 4.8 5.1.5-3.8 3.5 1.2 5L9 12.6 4.4 15.3l1.2-5L1.8 6.8l5.1-.5L9 1.5z"/>
    </svg>
  );
}

interface StaticEntity {
  name: string;
  type: string;
  signal: SignalState;
  tracker: string | null;
  timeAgo: string;
  snippet: string | null;
  tracked: boolean;
}

const ENTITIES: StaticEntity[] = [
  {
    name: "International Seabed Authority",
    type: "Body",
    signal: "HIGH",
    tracker: "ISA",
    timeAgo: "2h ago",
    snippet: "Draft exploitation regulations circulated to Council members ahead of July session.",
    tracked: true,
  },
  {
    name: "BBNJ Agreement",
    type: "Treaty",
    signal: "WATCH",
    tracker: "BBNJ",
    timeAgo: "1d ago",
    snippet: "Preparatory Commission secretariat published provisional rules of procedure.",
    tracked: true,
  },
  {
    name: "Deep Green Metals",
    type: "Company",
    signal: "HIGH",
    tracker: null,
    timeAgo: "3h ago",
    snippet: null,
    tracked: false,
  },
  {
    name: "Norway",
    type: "Country",
    signal: "QUIET",
    tracker: "30x30",
    timeAgo: "4d ago",
    snippet: null,
    tracked: true,
  },
  {
    name: "IMO Marine Environment Protection Committee",
    type: "Body",
    signal: "WATCH",
    tracker: "IMO",
    timeAgo: "2d ago",
    snippet: null,
    tracked: false,
  },
  {
    name: "Pacific Community",
    type: "Org",
    signal: "DORMANT",
    tracker: null,
    timeAgo: "3w ago",
    snippet: null,
    tracked: false,
  },
];

function EntityRow({ entity }: { entity: StaticEntity }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderBottom: `1px solid ${BLT}`,
      background: WHITE,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.35, flex: 1 }}>
          {entity.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {entity.tracked && <SignalPill signal={entity.signal} />}
          <StarIcon filled={entity.tracked} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: entity.snippet ? 5 : 0, flexWrap: "wrap" as const }}>
        <TypePill label={entity.type} />
        {entity.tracker && (
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const,
            color: TEAL, border: `1px solid rgba(29,158,117,0.25)`,
            borderRadius: 10, padding: "2px 7px", fontFamily: M, whiteSpace: "nowrap" as const,
          }}>
            {entity.tracker}
          </span>
        )}
        <span style={{ fontSize: 11, color: T4, marginLeft: "auto" }}>{entity.timeAgo}</span>
      </div>
      {entity.snippet && (
        <div style={{ fontSize: 12, color: "#5F6368", lineHeight: 1.5, marginTop: 2 }}>
          {entity.snippet}
        </div>
      )}
    </div>
  );
}

export default function DirectoryPreview() {
  return (
    <div style={{ fontFamily: F, background: WHITE, border: `0.5px solid ${B}`, borderRadius: 8, overflow: "hidden" }}>
      {/* Search bar */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BLT}`, display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={T4} strokeWidth="1.5">
          <circle cx="6" cy="6" r="4.5" />
          <line x1="9.5" y1="9.5" x2="13" y2="13" />
        </svg>
        <span style={{ fontSize: 13, color: T4, fontFamily: F }}>Search 928 entities...</span>
      </div>

      {/* Filter strip */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${BLT}`, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {["All", "Body", "Treaty", "Country", "Org", "Company", "Person"].map((label, i) => (
          <span key={label} style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
            fontFamily: M, padding: "3px 9px", borderRadius: 10,
            background: i === 0 ? TEAL : "transparent",
            color: i === 0 ? WHITE : T4,
            border: i === 0 ? `1px solid ${TEAL}` : `1px solid ${B}`,
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* Entity list */}
      {ENTITIES.map(entity => (
        <EntityRow key={entity.name} entity={entity} />
      ))}
    </div>
  );
}
