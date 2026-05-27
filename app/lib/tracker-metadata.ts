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
  "blue-carbon-credits": {
    type: "Type 6",
    label: "Voluntary standard-setting",
    multiplier: 0.80,
    warning: "Emerging domain with limited historical validation data. Calibrated threshold (7.0) and true positive rate (~70%) are provisional and will be revised after 6 months of operational data.",
  },
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
  "blue-carbon-credits": "Indeterminate \u2014 credit market and registry decisions have no fixed session calendar",
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
  "blue-carbon-credits": "Blue Carbon & Biodiversity Credits",
};

export const HISTORICAL_CASES: Record<string, {
  threshold: number;
  hitRate: string;
  cases: Array<{ date: string; score: number; event: string; outcome: string; verified: boolean; outcomePositive: boolean }>;
  caveat: string;
}> = {
  isa: {
    threshold: 6.5, hitRate: "~70%",
    cases: [
      { date: "Jul 2023", score: 6.53, event: "ISA Council deadline session", outcome: "Council adopted application oversight procedures and regulatory roadmap. Landmark procedural decisions.", verified: true, outcomePositive: true },
      { date: "Mar 2026", score: 6.8, event: "ISA 31st Session", outcome: "Council issued contractor non-compliance rulings. India polymetallic sulphide contract signed.", verified: true, outcomePositive: true },
    ],
    caveat: "Tracks ISA session activity reliably. Cannot detect surprise unilateral actions \u2014 Nauru's June 2021 two-year rule trigger occurred at a score of 2.05 and was the most consequential ISA event of the decade.",
  },
  bbnj: {
    threshold: 7.0, hitRate: "~46%",
    cases: [
      { date: "Mar 2023", score: 8.45, event: "IGC-5.2 \u2014 final negotiating session", outcome: "BBNJ Agreement adopted after marathon closed-door negotiations. Historic agreement on high seas governance.", verified: true, outcomePositive: true },
      { date: "Mar 2022", score: 8.45, event: "IGC-4 \u2014 negotiating session", outcome: "Session failed. No agreement reached despite maximum signal level \u2014 identical score to the session that succeeded.", verified: true, outcomePositive: false },
    ],
    caveat: "This is a Type 3 consensus body. The score correctly identified active conditions but cannot distinguish sessions that succeed from those that deadlock. IGC-4 and IGC-5.2 scored identically. Use as a conditions indicator only.",
  },
  iuu: {
    threshold: 6.0, hitRate: "~35\u201380% depending on sub-domain",
    cases: [
      { date: "Jan 2026", score: 4.6, event: "EU CATCH system mandatory", outcome: "Port-level enforcement disruptions across European markets within three weeks of score elevation.", verified: true, outcomePositive: true },
      { date: "Dec 2022", score: 7.1, event: "WCPFC annual meeting", outcome: "Historic skipjack management procedure adopted. Most significant WCPFC outcome in a decade.", verified: true, outcomePositive: true },
    ],
    caveat: "Performance varies sharply by sub-domain. WCPFC sessions: ~80% accuracy. CCAMLR: ~15% accuracy due to Russia-China vetoes on Antarctic MPA proposals. EU and US unilateral enforcement: ~70% accuracy.",
  },
  "30x30": {
    threshold: 7.5, hitRate: "~25\u201335% for actual designations",
    cases: [
      { date: "Dec 2022", score: 8.2, event: "COP15 Part 2, Montreal", outcome: "Kunming-Montreal Global Biodiversity Framework adopted. 30x30 target enshrined in international law.", verified: true, outcomePositive: true },
      { date: "Mar 2026", score: 7.6, event: "Chile mega-MPA", outcome: "360,000 km\u00B2 marine protected area designated before political transition.", verified: true, outcomePositive: true },
    ],
    caveat: "Highest false positive rate in the framework (~70\u201375%). Global advocacy generates enormous signal while actual designations occur through domestic sovereign processes below detection. Valid for framework-level political outcomes only \u2014 not individual area-based designations.",
  },
  "blue-finance": {
    threshold: 7.0, hitRate: "~70% for policy events",
    cases: [
      { date: "Sep 2023", score: 9.1, event: "TNFD v1.0 launch, NYSE", outcome: "320 early adopters within four months. 600+ by 2025. ISSB integration confirmed.", verified: true, outcomePositive: true },
      { date: "Feb 2026", score: 7.2, event: "ISSB nature disclosure decisions", outcome: "ISSB voted to move from research to standard-setting on nature-related risks.", verified: true, outcomePositive: true },
    ],
    caveat: "The largest financial transactions in this domain \u2014 debt-for-nature swaps and sovereign blue bonds \u2014 are deliberately designed to avoid public signal detection. The Belize blue bond ($364M) had a preceding score of approximately 3/10. This tracker cannot detect confidential sovereign transactions.",
  },
  plastics: {
    threshold: 5.0, hitRate: "~0\u201310%",
    cases: [
      { date: "Nov 2024", score: 4.01, event: "INC-5 Busan", outcome: "Treaty failed. Base score 9.33 \u2014 highest raw signal in dataset \u2014 correctly suppressed to 4.01 by petrostate veto multiplier. Score said do not act.", verified: true, outcomePositive: false },
    ],
    caveat: "Petrostate veto dynamics are structurally identical to CCAMLR. The multiplier (0.46) correctly suppresses scores in this domain. INC-5 Busan produced the highest raw signal in the entire dataset and completely failed. Use this tracker to monitor session activity only \u2014 not to predict outcomes.",
  },
  "imo-shipping": {
    threshold: 5.0, hitRate: "~75% for scheduled MEPC sessions",
    cases: [
      { date: "Jul 2023", score: 6.60, event: "IMO MEPC 80", outcome: "Net-Zero by 2050 framework adopted. Revised GHG strategy with 2030 and 2040 interim checkpoints.", verified: true, outcomePositive: true },
    ],
    caveat: "IMO MEPC sessions are scheduled events with clear pre-session document ramps. This tracker performs well for MEPC preparation windows (4\u20138 weeks). MEPC 84 convenes 27 April 2026 \u2014 the current score is in the preparation window.",
  },
  "wto-fisheries": {
    threshold: 5.0, hitRate: "~75% for ratification milestones",
    cases: [
      { date: "Sep 2025", score: 5.86, event: "Agreement on Fisheries Subsidies in force", outcome: "Agreement entered into force 15 September 2025 after two-thirds ratification threshold met. First multilateral agreement targeting a sector's environmental impact directly.", verified: true, outcomePositive: true },
    ],
    caveat: "Fish Two negotiations have no chair and no timeline. The four-year sunset clause means Phase 1 provisions lapse by 2029 if Phase 2 fails. Compliance deadline 15 September 2026 has no formal enforcement mechanism \u2014 compliance is self-reported.",
  },
  "offshore-wind": {
    threshold: 3.5, hitRate: "~70% for commercial leasing decisions",
    cases: [
      { date: "Nov 2025", score: 4.1, event: "Crown Estate Round 5 confirmed", outcome: "Largest UK offshore wind leasing round confirmed. Projects now in planning and consenting phase.", verified: true, outcomePositive: true },
    ],
    caveat: "Alert threshold adjusted 1.5 points below standard because commercial regulatory signals score structurally lower than diplomatic document signals. US federal leasing remains suspended pending appellate court ruling \u2014 the single critical path item for Atlantic wind development.",
  },
  "cites-marine": {
    threshold: 5.0, hitRate: "~75% for CoP listing decisions",
    cases: [
      { date: "Nov 2022", score: 5.91, event: "CITES CoP19", outcome: "Requiem sharks, hammerheads, and guitarfish listed Appendix II. Largest marine species listing in CITES history at that point.", verified: true, outcomePositive: true },
      { date: "Nov 2025", score: 5.5, event: "CITES CoP20", outcome: "Blue shark and shortfin mako listed Appendix II. Trade controls active from March 2026.", verified: true, outcomePositive: true },
    ],
    caveat: "CITES operates on a two-thirds majority vote with no single-state veto. One of the more predictable bodies in the framework. Next CoP is 2028 \u2014 implementation compliance for CoP20 listings is the live issue.",
  },
  "blue-carbon-credits": {
    threshold: 7.0, hitRate: "~70% policy-side (provisional \u2014 <6 months data)",
    cases: [],
    caveat: "This is an emerging domain with limited historical validation data. Calibrated threshold and true positive rate are provisional and will be revised after 6 months of operational data. Standards-body methodology releases generate signal that does not always translate to market uptake. Score readings should be interpreted alongside transaction volume from credit registries where available. Confidential offtake agreements between credit issuers and corporate buyers are structurally invisible to this index.",
  },
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
    "blue-carbon-credits": "a registry or standards decision",
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
