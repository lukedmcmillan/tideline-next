// Shown when a valid tracker slug has no velocity scores calculated yet.
// Same chrome as VelocityScore. No fake numbers — honest placeholder only.

const F = "'DM Sans',system-ui,sans-serif";
const M = "#9AA0A6";
const B = "#DADCE0";

const SLUG_NAMES: Record<string, string> = {
  isa: "ISA deep-sea mining",
  bbnj: "BBNJ high seas treaty",
  iuu: "IUU fishing enforcement",
  "30x30": "30x30 ocean protection",
  "blue-finance": "Blue finance & TNFD",
  plastics: "Global plastics treaty",
  "imo-shipping": "IMO shipping emissions",
  "wto-fisheries": "WTO fisheries subsidies",
  "offshore-wind": "Offshore wind regulation",
  "cites-marine": "CITES marine species",
};

interface Props { slug: string }

export default function VelocityEmpty({ slug }: Props) {
  const name = SLUG_NAMES[slug] ?? "Ocean domain";
  return (
    <div style={{ fontFamily: F, background: "#fff", border: `0.5px solid ${B}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px", borderBottom: `0.5px solid ${B}` }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".1em", color: M }}>PULSE SCORE</div>
          <div style={{ fontSize: 12, color: "#5F6368", lineHeight: 1.5, marginTop: 4 }}>{name}</div>
        </div>
        <span style={{ fontSize: 10, color: M, border: `0.5px solid ${B}`, borderRadius: 99, padding: "3px 10px", whiteSpace: "nowrap" as const }}>
          How this is calculated
        </span>
      </div>
      <div style={{ padding: "40px 20px 48px", textAlign: "center" as const }}>
        <div style={{ fontSize: 13, color: M, lineHeight: 1.6 }}>
          Pulse score not yet calculated for this domain.
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#C5C5C5", marginTop: 8 }}>
          Next update Monday 06:00 UTC
        </div>
      </div>
    </div>
  );
}
