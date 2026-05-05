// Static fallback for VelocityScore rendered when API returns no data.
// Mirrors VelocityScore chrome exactly — same structure, same constants,
// Chart.js trend replaced with inline SVG. Slug-aware display names and
// cached representative values. Shown on both tracker pages and landing page.

const F = "'DM Sans',system-ui,sans-serif";
const M = "#9AA0A6";
const B = "#DADCE0";
const TK = "#E8EAED";

function col(s: number) {
  return s < 4 ? "#E24B4A" : s <= 7 ? "#EF9F27" : "#1D9E75";
}

interface SlugMeta {
  name: string;
  score: number;
  volume: number | null;
  recency: number | null;
  signals: number | null;
  momentum: "accelerating" | "stable" | "decelerating";
  type: number;
  typeName: string;
  multiplier: number;
  pts: number[];
}

const SLUG_META: Record<string, SlugMeta> = {
  isa: {
    name: "ISA deep-sea mining",
    score: 7.2, volume: 6.8, recency: 8.1, signals: 6.5,
    momentum: "stable", type: 2, typeName: "Mixed architecture", multiplier: 0.75,
    pts: [5.2, 5.8, 6.1, 6.4, 6.0, 6.7, 7.0, 6.8, 7.1, 7.2],
  },
  bbnj: {
    name: "BBNJ high seas treaty",
    score: 6.4, volume: 5.9, recency: 7.2, signals: 5.8,
    momentum: "stable", type: 3, typeName: "Consensus-dependent", multiplier: 0.46,
    pts: [4.8, 5.2, 5.5, 5.8, 6.0, 6.2, 6.4, 6.1, 6.3, 6.4],
  },
  iuu: {
    name: "IUU fishing enforcement",
    score: 5.8, volume: 5.2, recency: 6.4, signals: 5.5,
    momentum: "stable", type: 2, typeName: "Mixed architecture", multiplier: 0.85,
    pts: [4.6, 4.9, 5.1, 5.4, 5.6, 5.8, 5.5, 5.7, 5.9, 5.8],
  },
  "30x30": {
    name: "30×30 ocean protection",
    score: 6.1, volume: 5.8, recency: 6.8, signals: 5.2,
    momentum: "stable", type: 1, typeName: "Unilateral", multiplier: 0.85,
    pts: [4.5, 4.9, 5.2, 5.6, 5.8, 6.0, 6.1, 5.9, 6.2, 6.1],
  },
  "blue-finance": {
    name: "Blue finance & TNFD",
    score: 5.5, volume: 5.0, recency: 6.2, signals: 4.8,
    momentum: "stable", type: 6, typeName: "Voluntary standard-setting", multiplier: 0.80,
    pts: [3.8, 4.2, 4.5, 4.8, 5.0, 5.2, 5.5, 5.3, 5.4, 5.5],
  },
  plastics: {
    name: "Global plastics treaty",
    score: 4.8, volume: 4.5, recency: 5.6, signals: 4.2,
    momentum: "decelerating", type: 3, typeName: "Consensus-dependent", multiplier: 0.46,
    pts: [6.2, 6.0, 5.8, 5.5, 5.2, 5.0, 4.8, 5.1, 4.9, 4.8],
  },
  "imo-shipping": {
    name: "IMO shipping emissions",
    score: 6.8, volume: 6.2, recency: 7.5, signals: 6.0,
    momentum: "accelerating", type: 2, typeName: "Mixed architecture", multiplier: 0.75,
    pts: [4.9, 5.3, 5.7, 6.0, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8],
  },
  "wto-fisheries": {
    name: "WTO fisheries subsidies",
    score: 5.2, volume: 4.8, recency: 5.9, signals: 4.5,
    momentum: "stable", type: 5, typeName: "Ratification milestone", multiplier: 0.75,
    pts: [4.2, 4.5, 4.8, 5.0, 5.2, 5.1, 5.3, 5.0, 5.2, 5.2],
  },
  "offshore-wind": {
    name: "Offshore wind regulation",
    score: 4.5, volume: 4.2, recency: 5.0, signals: 3.8,
    momentum: "stable", type: 1, typeName: "Unilateral", multiplier: 0.85,
    pts: [3.5, 3.8, 4.0, 4.2, 4.5, 4.3, 4.6, 4.4, 4.5, 4.5],
  },
  "cites-marine": {
    name: "CITES marine species",
    score: 5.6, volume: 5.1, recency: 6.3, signals: 5.0,
    momentum: "stable", type: 2, typeName: "Mixed architecture", multiplier: 0.75,
    pts: [4.4, 4.7, 5.0, 5.2, 5.4, 5.5, 5.6, 5.4, 5.5, 5.6],
  },
};

const DEFAULT_META: SlugMeta = {
  name: "Ocean domain",
  score: 5.5, volume: 5.0, recency: 6.0, signals: 4.8,
  momentum: "stable", type: 2, typeName: "Mixed architecture", multiplier: 0.75,
  pts: [4.0, 4.5, 5.0, 5.2, 5.4, 5.5, 5.3, 5.5, 5.4, 5.5],
};

function momBadge(dir: string) {
  if (dir === "accelerating") return { bg: "#E8F7F2", color: "#1D9E75" };
  if (dir === "decelerating") return { bg: "#FDEAEA", color: "#E24B4A" };
  return { bg: "#FEF3E2", color: "#EF9F27" };
}

interface Props { slug: string }

export default function VelocityFallback({ slug }: Props) {
  const meta = SLUG_META[slug] ?? DEFAULT_META;
  const c = col(meta.score);
  const mb = momBadge(meta.momentum);

  const H = 60;
  const W = 300;
  const pts = meta.pts;
  const polyline = pts
    .map((v, i) => `${i * (W / (pts.length - 1))},${H - (v / 10) * H}`)
    .join(" ");

  const subs: Array<{ label: string; value: number | null }> = [
    { label: "Volume trend", value: meta.volume },
    { label: "Recency", value: meta.recency },
    { label: "Decision signals", value: meta.signals },
  ];

  return (
    <div ref={undefined} style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>

      {/* Header bar — matches VelocityScore */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px", borderBottom: `0.5px solid ${B}` }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M }}>PULSE SCORE</div>
          <div style={{ fontFamily: F, fontSize: 12, color: "#5F6368", lineHeight: 1.5, marginTop: 4 }}>{meta.name}</div>
        </div>
        <span style={{ fontFamily: F, fontSize: 10, color: M, border: `0.5px solid ${B}`, borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap" }}>
          How this is calculated
        </span>
      </div>

      {/* Score */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `0.5px solid ${B}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: F, fontSize: 40, fontWeight: 700, color: c, lineHeight: 1 }}>{meta.score}</span>
          <span style={{ fontFamily: F, fontSize: 16, color: M }}>/10</span>
          <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: mb.bg, color: mb.color }}>
            {meta.momentum.charAt(0).toUpperCase() + meta.momentum.slice(1)}
          </span>
        </div>
        <div style={{ height: 3, background: TK, borderRadius: 99, marginTop: 10 }}>
          <div style={{ height: 3, width: `${(meta.score / 10) * 100}%`, background: c, borderRadius: 99 }} />
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `0.5px solid ${B}` }}>
        {subs.map((s, i) => {
          const has = s.value != null && s.value > 0;
          const sc = has ? col(s.value!) : M;
          return (
            <div key={s.label} style={{ padding: "14px 20px", borderLeft: i > 0 ? `0.5px solid ${B}` : undefined }}>
              <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".1em", color: M, marginBottom: 4 }}>{s.label}</div>
              {has ? (
                <>
                  <div style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: sc, marginBottom: 6 }}>
                    {s.value}<span style={{ fontSize: 10, fontWeight: 400, color: M }}>/10</span>
                  </div>
                  <div style={{ height: 2, background: TK, borderRadius: 99 }}>
                    <div style={{ height: 2, width: `${((s.value ?? 0) / 10) * 100}%`, background: sc, borderRadius: 99 }} />
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 400, color: "#C5C5C5" }}>{"\u2014"}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Static SVG trend — replaces Chart.js */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".12em", color: M }}>10-WEEK TREND</div>
          <div style={{ fontFamily: F, fontSize: 10, color: M }}>Cached data</div>
        </div>
        <div style={{ height: 80 }}>
          <svg width="100%" height="60" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline points={polyline} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((v, i) => (
              <circle key={i} cx={i * (W / (pts.length - 1))} cy={H - (v / 10) * H} r="3" fill={c} />
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 10px" }}>
          {pts.map((_, i) => (
            <div key={i} style={{ fontFamily: F, fontSize: 9, color: M, textAlign: "center", flex: 1 }}>W{i + 1}</div>
          ))}
        </div>
      </div>

      {/* Institutional type footer */}
      <div style={{ padding: "10px 20px", borderTop: `0.5px solid ${B}`, background: "#FAFAFA" }}>
        <div style={{ fontFamily: F, fontSize: 11, color: M }}>
          Type {meta.type} {"\u00B7"} {meta.typeName} {"\u00B7"} Risk multiplier {meta.multiplier}x
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#C5C5C5", marginTop: 4 }}>
          Showing recent representative data. Live scores temporarily unavailable.
        </div>
      </div>
    </div>
  );
}
