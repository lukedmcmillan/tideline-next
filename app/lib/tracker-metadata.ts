export const INST_TYPE: Record<string, { type: string; label: string; multiplier: number; warning?: string }> = {
  "imo-shipping": { type: "Type 2", label: "Mixed architecture", multiplier: 0.75 },
  "wto-fisheries": { type: "Type 2", label: "Mixed architecture", multiplier: 0.75 },
  isa: { type: "Type 2", label: "Mixed architecture", multiplier: 0.75 },
  bbnj: { type: "Type 3", label: "Consensus-dependent", multiplier: 0.46, warning: "Structural veto players present. Score cannot distinguish breakthrough from deadlock." },
  plastics: { type: "Type 3", label: "Consensus-dependent", multiplier: 0.46, warning: "Petrostate veto dynamics. Score cannot distinguish breakthrough from deadlock." },
  "30x30": { type: "Type 1", label: "Unilateral decisions", multiplier: 0.85 },
  iuu: { type: "Type 1/2", label: "Enforcement actions", multiplier: 0.85 },
  "blue-finance": { type: "Type 6", label: "Voluntary standard-setting", multiplier: 0.80 },
  "offshore-wind": { type: "Type 1", label: "Commercial leasing", multiplier: 0.85 },
  "cites-marine": { type: "Type 2", label: "Majority vote", multiplier: 0.75 },
};

export const PREP_HORIZON: Record<string, string> = {
  "imo-shipping": "4\u20138 weeks (MEPC pre-session ramp)",
  "wto-fisheries": "2\u20134 weeks once within 5% of threshold",
  isa: "4\u20138 weeks (pre-session document ramp)",
  bbnj: "Indeterminate (Type 3 \u2014 consensus timing uncertain)",
  plastics: "Indeterminate (Type 3 \u2014 consensus timing uncertain)",
  "30x30": "Sovereign designation decisions \u2014 no reliable estimate",
  iuu: "3\u20136 weeks (EU/US enforcement escalation pathway)",
  "blue-finance": "6\u201310 weeks (framework release cycle)",
  "offshore-wind": "8\u201320 weeks (commercial planning cycles)",
  "cites-marine": "6\u201312 weeks (CoP proposal submission to vote)",
};

export const DOMAIN_NAMES: Record<string, string> = {
  "imo-shipping": "IMO Shipping",
  "wto-fisheries": "WTO Fisheries Subsidies",
  isa: "Deep-Sea Mining",
  bbnj: "High Seas Treaty",
  plastics: "Plastics Treaty",
  "30x30": "30\u00D730 MPA",
  iuu: "IUU Fishing",
  "blue-finance": "Blue Finance",
  "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine",
};

export function alertBand(score: number, slug?: string): "HIGH" | "ELEVATED" | "WATCH" | "QUIET" {
  const shift = slug === "offshore-wind" ? 1.5 : 0;
  const s = score + shift;
  if (s >= 7.0) return "HIGH";
  if (s >= 5.0) return "ELEVATED";
  if (s >= 3.0) return "WATCH";
  return "QUIET";
}

export function bandColor(band: string): string {
  if (band === "HIGH") return "#1D9E75";
  if (band === "ELEVATED") return "#EF9F27";
  if (band === "WATCH") return "#9AA0A6";
  return "#DADCE0";
}

export function interpretationSentence(slug: string, score: number, momentum: "up" | "flat" | "dn"): string {
  const band = alertBand(score, slug);
  const domain = DOMAIN_NAMES[slug] ?? slug;
  const horizons: Record<string, string> = {
    "imo-shipping": "a MEPC decision window",
    "wto-fisheries": "a compliance milestone",
    isa: "a Council decision window",
    bbnj: "ratification activity",
    plastics: "negotiating session activity",
    "30x30": "designation activity",
    iuu: "enforcement action",
    "blue-finance": "a framework release",
    "offshore-wind": "a leasing or planning decision",
    "cites-marine": "a CoP listing decision",
  };
  const h = horizons[slug] ?? "a governance event";

  if (band === "HIGH" && momentum === "up") return `${domain} activity is at its highest level \u2014 ${h} is likely open in the next 4\u20136 weeks.`;
  if (band === "HIGH" && momentum === "flat") return `${domain} activity remains high \u2014 ${h} conditions are present.`;
  if (band === "ELEVATED" && momentum === "up") return `${domain} activity is elevated and accelerating \u2014 monitor closely for ${h}.`;
  if (band === "ELEVATED" && momentum === "flat") return `${domain} activity is elevated but stable \u2014 conditions present, timing uncertain.`;
  if (band === "ELEVATED" && momentum === "dn") return `${domain} activity is elevated but decelerating \u2014 the immediate preparation window may be closing.`;
  if (band === "WATCH") return `${domain} activity is at watch level \u2014 no immediate action required. Check again next cycle.`;
  return `${domain} activity is low \u2014 domain appears dormant. Note: significant events can occur at any score level.`;
}

export const DISCLOSURE = "Pulse Score measures observable public regulatory activity only. It cannot detect surprise unilateral actions, confidential commercial transactions, or informal negotiating dynamics. Elevated score = conditions present, not outcome predicted. Methodology v1.2 \u00B7 Tideline Ocean Intelligence";
