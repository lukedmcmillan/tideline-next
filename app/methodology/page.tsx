import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pulse Score Methodology - Tideline Ocean Intelligence",
  description: "Published methodology for the Ocean Governance Pulse Score. Validation results, honest failure modes, and domain thresholds. Open for scrutiny and citation.",
  alternates: { canonical: "https://thetideline.co/methodology" },
};

export default function MethodologyPage() {
  const F = "'DM Sans', sans-serif";
  const MONO = "'DM Mono', monospace";
  const NAVY = "#0B1628";
  const BODY = "#5F6368";
  const SEC = "#9AA0A6";
  const BORDER = "#DADCE0";
  const TEAL = "#1D9E75";
  const RED = "#E24B4A";
  const AMBER = "#EF9F27";

  const sectionHeading: React.CSSProperties = {
    fontFamily: F, fontSize: 22, fontWeight: 700, color: NAVY,
    margin: "56px 0 16px", lineHeight: 1.3,
  };
  const bodyText: React.CSSProperties = {
    fontFamily: F, fontSize: 15, color: BODY, lineHeight: 1.75, margin: "0 0 16px",
  };
  const formulaBlock: React.CSSProperties = {
    background: "#F8F9FA", border: `0.5px solid ${BORDER}`, borderRadius: 8,
    padding: "20px 24px", marginBottom: 20, fontFamily: MONO, fontSize: 14,
    color: NAVY, lineHeight: 1.8, whiteSpace: "pre",
  };
  const componentLabel: React.CSSProperties = {
    fontFamily: F, fontSize: 15, fontWeight: 700, color: NAVY, margin: "0 0 8px",
  };
  const th: React.CSSProperties = {
    padding: "10px 14px", fontFamily: MONO, fontSize: 11, fontWeight: 600,
    color: SEC, textTransform: "uppercase", letterSpacing: "0.05em",
    textAlign: "left", borderBottom: `2px solid ${BORDER}`,
  };
  const td: React.CSSProperties = {
    padding: "10px 14px", fontFamily: F, fontSize: 13, color: NAVY,
    borderBottom: `1px solid ${BORDER}`, lineHeight: 1.5, verticalAlign: "top",
  };
  const tdMono: React.CSSProperties = { ...td, fontFamily: MONO, fontSize: 12 };

  const validationRows: [string, string, string, string, boolean][] = [
    ["ISA Council, Jul 2023 deadline session", "6.53", "\u2713 True positive", "Score correctly elevated before landmark Council decisions on application oversight procedures.", true],
    ["BBNJ IGC-4, Mar 2022 (session failed)", "3.89", "\u2713 False positive correctly suppressed", "Base score 8.45 dropped below alert threshold by Type 3 multiplier. Session failed as the suppressed score indicated.", true],
    ["Nauru two-year rule, Jun 2021", "2.05", "\u26A0 Missed signal", "Most consequential ISA event of the decade. Score was 2.05. Structural blind spot documented below.", false],
    ["IMO MEPC 80, Jul 2023", "6.60", "\u2713 True positive", "Net-Zero framework adoption correctly flagged 4-6 weeks in advance.", true],
    ["INC-5 Busan, Nov 2024 (treaty failed)", "4.01", "\u2713 False positive correctly suppressed", "Highest raw signal in dataset (base 9.33). Multiplier suppressed to 4.01. Treaty failed. Score said do not act.", true],
    ["WTO fisheries ratification, Sep 2025", "5.86", "\u2713 True positive", "Compliance milestone correctly flagged.", true],
    ["CITES CoP19, Nov 2022", "5.91", "\u2713 True positive", "Species listing adoption correctly flagged.", true],
    ["BBNJ IGC-5.2, Feb 2023 (succeeded)", "3.89", "\u26A0 Ambiguous", "Indistinguishable from failed IGC-4. Framework limitation for Type 3 bodies.", false],
    ["WCPFC skipjack, Dec 2022", "6.08", "\u2713 True positive", "Historic management procedure adoption correctly flagged.", true],
    ["ScotWind, Jan 2022", "5.27*", "\u2713 Adjusted positive", "*Domain-adjusted threshold applied. Offshore Wind bands shifted -1.5 points.", true],
  ];

  const domainRows: [string, string, string, string, string][] = [
    ["ISA / Deep-Sea Mining", "2", "6.5", "~70%", "Tracks session activity well. Cannot detect surprise unilateral actors."],
    ["BBNJ / High Seas Treaty", "3", "7.0", "~46%", "Cannot distinguish breakthrough from deadlock. Use as conditions indicator only."],
    ["IUU Fishing Enforcement", "1/2", "6.0", "~35-80%*", "*WCPFC ~80%, CCAMLR ~15%. Performance varies by sub-domain."],
    ["30x30 / MPA Designations", "1", "7.5", "~25-35%", "Valid for framework-level outcomes only. Not individual area-based designations."],
    ["Blue Finance / TNFD", "6/4", "7.0", "~70% policy / ~30% market", "Structurally blind to confidential sovereign bond transactions."],
    ["IMO Shipping Emissions", "2", "5.0", "~75%", "Strong for scheduled MEPC sessions. 4-8 week preparation window."],
    ["WTO Fisheries Subsidies", "2/5", "5.0", "~75%", "Strong for ratification milestones and compliance deadlines."],
    ["Offshore Wind / MSP", "1", "3.5*", "~70%", "*Domain-adjusted. Standard alert bands do not apply to this domain."],
    ["CITES Marine Species", "2", "5.0", "~75%", "Strong for CoP listing decisions. Two-thirds majority vote architecture."],
    ["Plastics Treaty", "3", "5.0", "~0-10%", "Petrostate veto dynamics. Multiplier (0.46) correctly suppresses score. Monitor session activity only."],
  ];

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
          TIDELINE OCEAN INTELLIGENCE
        </div>
        <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: NAVY, lineHeight: 1.2, margin: "0 0 12px" }}>
          The Pulse Score
        </h1>
        <p style={{ fontFamily: F, fontSize: 18, fontWeight: 400, color: BODY, margin: "0 0 24px", lineHeight: 1.5 }}>
          A conditions indicator for ocean governance activity. Updated April 2026.
        </p>
        <div style={{ width: 48, height: 2, background: TEAL, marginBottom: 48 }} />

        {/* ── SECTION 1 ── */}
        <h2 style={sectionHeading}>What it is, and what it is not</h2>
        <p style={bodyText}>
          The Pulse Score is a structured monitoring index. It measures the intensity of observable public regulatory activity across ten ocean governance domains and produces a numerical output on a 0 to 10 scale, updated every four days.
        </p>
        <p style={bodyText}>
          It answers one question: are the conditions for a significant governance event currently present in this domain?
        </p>
        <p style={bodyText}>
          It does not answer: will a significant event occur?
        </p>
        <p style={bodyText}>
          The appropriate analogy is an atmospheric pressure system. A falling barometer does not predict rain with certainty. It detects that the conditions for rain are present. A professional who acts on an elevated Pulse Score is not predicting an outcome. They are making a rational preparation decision under uncertainty.
        </p>
        <p style={bodyText}>
          This distinction is not a weakness of the framework. It is its most important honest claim, and the one that makes it defensible under scrutiny. Any index claiming to predict multilateral governance outcomes with high confidence is either measuring something different from what it claims, or is not being honest about its false positive rate.
        </p>

        {/* ── SECTION 2 ── */}
        <h2 style={sectionHeading}>The equation</h2>
        <p style={bodyText}>
          The score is calculated in two steps. First, a Base Score from three observable signals. Second, an Adjusted Score that accounts for the decision-making architecture of the relevant governance body.
        </p>

        <div style={formulaBlock}>
{`BASE SCORE =
  (Volume Trend    x 0.40) +
  (Recency         x 0.35) +
  (Decision Signals x 0.25)`}
        </div>
        <div style={formulaBlock}>
{`ADJUSTED SCORE =
  Base Score x Institutional Risk Multiplier`}
        </div>

        {/* Plain English */}
        <div style={{ background: "#F0FDF4", borderLeft: `3px solid ${TEAL}`, borderRadius: 4, padding: "16px 20px", marginBottom: 32, fontSize: 15, color: NAVY, lineHeight: 1.6, fontFamily: F }}>
          In plain English: the score asks three questions about each domain every week. Is more being written about it than last month? How recently? Does the language signal a decision is coming? Each question gets a score out of 10. They are combined with different weights. Then adjusted down for institutions where political deadlock is structurally likely.
        </div>

        {/* Volume Trend */}
        <p style={componentLabel}>VOLUME TREND, 40%</p>
        <p style={bodyText}>
          Compares the number of relevant documents published in the past 30 days against the preceding 30-day period, within the same domain. Formula: clamp(5 + growth x 5, 0, 10). Weighted highest because it is the most consistently collectable and reproducible signal. A second analyst counting the same sources in the same window will produce a materially identical score. Volume is measured within each domain to avoid bias from structural differences in publication practices across governance bodies.
        </p>

        {/* Recency */}
        <p style={componentLabel}>RECENCY, 35%</p>
        <p style={bodyText}>
          Measures how recently something significant was published in this domain. Recent activity scores higher. A domain that went quiet six weeks ago scores much lower than one with documents published this week.
        </p>
        <p style={bodyText}>
          The decay is gradual and continuous, not a cliff edge. A document published 14 days ago scores 5.0. One published 30 days ago scores 2.2. One published today scores 10.0.
        </p>
        <p style={{ fontFamily: MONO, fontSize: 13, color: SEC, margin: "0 0 16px" }}>
          Technical formula: Score = 10 x e^(-0.05 x days)
        </p>

        {/* Decision Signals */}
        <p style={componentLabel}>DECISION SIGNALS, 25%</p>
        <p style={bodyText}>
          Counts documents in the 30-day window containing language associated with concrete regulatory action: ratif, adopt, enforc, sanction, decision, resolution, agreement, signed, implement, deadline, entry into force, final text, mandate, conclude, binding. Formula: min(signal_count x 2, 10). Weighted lowest because advocacy organisations frequently use urgent decision-language that does not correlate with decision proximity. The keyword approach is retained over machine-learning alternatives because reproducibility requires that a second analyst following the same method can independently verify the score.
        </p>

        {/* Institutional Risk Multiplier */}
        <p style={componentLabel}>INSTITUTIONAL RISK MULTIPLIER</p>
        <p style={bodyText}>
          Adjusts the Base Score based on the decision-making architecture of the governance body. Grounded in George Tsebelis&apos;s veto player theory (Veto Players: How Political Institutions Work, Princeton University Press, 2002, 4,000+ academic citations), which establishes that policy change requires agreement among all actors with veto authority. The fewer veto players and the closer their positions, the higher the probability of a governance outcome.
        </p>
        <p style={{ fontFamily: F, fontSize: 15, color: BODY, lineHeight: 1.75, margin: "0 0 16px" }}>
          The core idea: some governance bodies can act quickly (one country decides, done). Others require every country in the room to agree, and one country can veto the whole thing. The multiplier adjusts the score to reflect this. The more veto players, the lower the multiplier, the lower the adjusted score.
        </p>
        <p style={bodyText}>
          Six institutional types, derived from historical true positive rates across the validation dataset:
        </p>

        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Type</th>
                <th style={th}>Name</th>
                <th style={th}>Description</th>
                <th style={th}>Multiplier</th>
                <th style={th}>Examples</th>
              </tr>
            </thead>
            <tbody>
              {([
                ["1", "Unilateral", "Single decision-maker no consensus required", "0.85", "EU carding decisions, US enforcement actions, Crown Estate leasing rounds"],
                ["2", "Mixed architecture", "Consensus preferred majority fallback available", "0.75", "IMO MEPC, ISA Council, CITES CoP, WCPFC"],
                ["3", "Consensus-dependent", "Full consensus required known structural veto players", "0.46", "BBNJ negotiations, Plastics Treaty INC, CCAMLR MPAs"],
                ["4", "Confidential commercial", "Transaction designed to avoid public signal detection", "0.40", "Debt-for-nature swaps, sovereign blue bonds"],
                ["5", "Ratification milestone", "Public counter approaching defined threshold", "0.90", "WTO fisheries subsidies compliance, BBNJ ratification counter"],
                ["6", "Voluntary standard-setting", "Market-led multi-stakeholder voluntary adoption", "0.80", "TNFD framework releases, GRI updates, SBTi ocean guidance"],
              ] as const).map(([type, name, desc, mult, ex], i) => (
                <tr key={type} style={{ background: i % 2 === 1 ? "#F8F9FA" : "transparent" }}>
                  <td style={tdMono}>{type}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{name}</td>
                  <td style={{ ...td, color: BODY }}>{desc}</td>
                  <td style={tdMono}>{mult}</td>
                  <td style={{ ...td, color: BODY, fontSize: 12 }}>{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={bodyText}>
          Multiplier values are derived from historical true positive rates across the validation dataset and are presented as indicative point estimates. Estimated ranges: Type 1 (0.75-0.90), Type 2 (0.65-0.85), Type 3 (0.30-0.55), Type 4 (indicative floor), Type 5 (0.85-0.95), Type 6 (0.70-0.88). Statistical calibration with confidence intervals is planned once the validation dataset reaches 50+ formally coded events.
        </p>

        {/* ── SECTION 3 ── */}
        <h2 style={sectionHeading}>Validated performance</h2>
        <p style={bodyText}>
          The framework was tested against ten discrete historical event-periods selected to stress-test each component. Results are reported with failures included, including the single most damaging case in the dataset.
        </p>

        <div style={{ overflowX: "auto", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Event</th>
                <th style={th}>Adj. Score</th>
                <th style={th}>Result</th>
                <th style={th}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {validationRows.map(([event, score, result, detail, pass]) => (
                <tr key={event} style={{ background: validationRows.indexOf([event, score, result, detail, pass]) % 2 === 1 ? "#F8F9FA" : "transparent" }}>
                  <td style={{ ...td, fontWeight: 500 }}>{event}</td>
                  <td style={tdMono}>{score}</td>
                  <td style={{ ...td, color: pass ? TEAL : "#B45309", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{result}</td>
                  <td style={{ ...td, color: BODY, fontSize: 12 }}>{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {([
            ["PRECISION", "0.83", TEAL, "Of events flagged, 83% produced a significant outcome"],
            ["RECALL", "0.83", TEAL, "Of significant outcomes, 83% were flagged by the framework"],
            ["F1 SCORE", "0.83", TEAL, "Harmonic mean of precision and recall"],
            ["SAMPLE SIZE", "n=10", AMBER, "Confidence intervals require 50+ events, planned next revision"],
          ] as const).map(([label, value, color, desc]) => (
            <div key={label} style={{ background: "#FFFFFF", border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: SEC, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: BODY, lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: F, fontSize: 13, color: SEC, fontStyle: "italic", margin: "0 0 48px", lineHeight: 1.6 }}>
          Performance varies by event type. Scheduled institutional events (MEPC sessions, CoP votes, ratification milestones): estimated hit rate 80-86%. Unscheduled events (surprise unilateral actions, confidential transactions): estimated hit rate significantly lower. See structural failure modes below.
        </p>

        {/* ── SECTION 4 ── */}
        <h2 style={sectionHeading}>What the score cannot tell you</h2>
        <p style={bodyText}>
          Three categories of events are structurally invisible to the Pulse Score regardless of threshold or calibration. These are not limitations to be fixed in a future version. They are permanent features of any index based on public documentary signals.
        </p>

        {/* Failure Mode 1 */}
        <div style={{ background: "#FEF2F2", borderLeft: `3px solid ${RED}`, borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: RED, marginBottom: 8 }}>FAILURE MODE 1: SURPRISE STRATEGIC ACTIONS</div>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Individual state actors using dormant institutional channels, coordinated with private commercial interests, outside the normal session calendar. The canonical case: Nauru&apos;s June 2021 invocation of the ISA two-year rule. The score was 2.05. The most consequential ISA regulatory event of the decade followed. The event was driven by DeepGreen&apos;s SPAC merger timeline, a commercial calendar entirely invisible to public document monitoring. No volume ramp, no decision-signal language, and no recency signal preceded it. The Actor Anomaly Flag, Component 5 of the methodology, is designed to partially recover these cases by monitoring specific registered entities for behaviour outside established patterns. It is currently in development.
          </p>
        </div>

        {/* Failure Mode 2 */}
        <div style={{ background: "#FEF2F2", borderLeft: `3px solid ${RED}`, borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: RED, marginBottom: 8 }}>FAILURE MODE 2: CONFIDENTIAL COMMERCIAL TRANSACTIONS</div>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Sovereign debt-for-nature swaps and blue bond instruments are deliberately designed to avoid public signal detection before closing. TNC maintains deal confidentiality to prevent bond price inflation before buyback. The Belize blue bond ($364M, November 2021), the world&apos;s largest at the time, had a preceding score of approximately 3/10. The largest financial transactions in the blue finance domain are structurally invisible to this framework. Type 4 classification and mandatory disclosure are the honest response, not a claim that the framework can detect what it cannot.
          </p>
        </div>

        {/* Failure Mode 3 */}
        <div style={{ background: "#FEF2F2", borderLeft: `3px solid ${RED}`, borderRadius: 4, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: RED, marginBottom: 8 }}>FAILURE MODE 3: CONSENSUS-BLOCKED INSTITUTIONS</div>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            In bodies where structural veto players have demonstrated blocking behaviour (CCAMLR, the Plastics Treaty INC, ICCAT tropical tuna reform), the framework cannot distinguish sessions that will eventually break through from those that will deadlock indefinitely. BBNJ IGC-4 and IGC-5.2 produced identical adjusted scores (3.89) despite one failing and one succeeding. The variables that determined the outcome (negotiating exhaustion, a US power alignment shift on 23 January 2023, closed-door marathon format) are invisible to public document analysis. Type 3 classification and explicit veto-risk warnings are applied to all outputs in these domains.
          </p>
        </div>

        {/* Mandatory disclosure */}
        <div style={{ background: "#F0FDF4", borderLeft: `3px solid ${TEAL}`, borderRadius: 4, padding: "16px 20px", marginBottom: 48 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>MANDATORY DISCLOSURE</div>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Appears on all Pulse Score outputs: This score measures observable public regulatory activity. It cannot detect surprise unilateral actions, confidential commercial transactions, or informal negotiating dynamics. Elevated score = conditions present, not outcome predicted.
          </p>
        </div>

        {/* ── SECTION 5 ── */}
        <h2 style={sectionHeading}>Alert thresholds by domain</h2>
        <p style={bodyText}>
          Every domain has a calibrated alert threshold, the adjusted score above which the framework considers conditions for a significant outcome to be present. Thresholds reflect institutional type and historical performance. Offshore Wind uses a domain-specific threshold shifted 1.5 points below standard bands because commercial regulatory signals score structurally lower than diplomatic document signals.
        </p>

        {/* Alert band pills */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, background: TEAL, color: "#fff", padding: "6px 14px", borderRadius: 20 }}>HIGH 7.0+</span>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, background: AMBER, color: "#fff", padding: "6px 14px", borderRadius: 20 }}>ELEVATED 5.0-6.9</span>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, background: "#9AA0A6", color: "#fff", padding: "6px 14px", borderRadius: 20 }}>WATCH 3.0-4.9</span>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, background: "#E8EAED", color: BODY, padding: "6px 14px", borderRadius: 20 }}>QUIET 0-2.9</span>
        </div>

        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Domain</th>
                <th style={th}>Type</th>
                <th style={th}>Threshold</th>
                <th style={th}>Est. TPR</th>
                <th style={th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {domainRows.map(([domain, type, threshold, tpr, notes], i) => (
                <tr key={domain} style={{ background: i % 2 === 1 ? "#F8F9FA" : "transparent" }}>
                  <td style={{ ...td, fontWeight: 500 }}>{domain}</td>
                  <td style={tdMono}>{type}</td>
                  <td style={tdMono}>{threshold}</td>
                  <td style={tdMono}>{tpr}</td>
                  <td style={{ ...td, color: BODY, fontSize: 12 }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: F, fontSize: 12, fontStyle: "italic", color: SEC, margin: "0 0 48px", lineHeight: 1.6 }}>
          True positive rate estimates are derived from a validation dataset of ten formally coded events supplemented by approximately 120 event-periods from domain analysis spanning 2020-2026. Sample sizes are insufficient for formal confidence intervals. These figures should be treated as directional indicators, not statistically precise parameters.
        </p>

        {/* ── SECTION 6 ── */}
        <h2 style={sectionHeading}>How to use it in practice</h2>

        {([
          ["MARITIME COMPLIANCE OFFICER", "An IMO score above 5.0 with accelerating momentum means a MEPC preparation window is open, typically 4-8 weeks before a session. The score does not tell you what will be decided. It tells you this is the window to ensure your CII documentation and EU ETS allowance position is current before the session closes that window."],
          ["ESG / TNFD ANALYST", "A Blue Finance score above 7.0 in a Type 6 classification period means a framework release or standard adoption is approaching. The TNFD v1.0 launch at NYSE Climate Week in September 2023 was preceded by a score of 9.1. You do not need to predict the exact date. You need to know the window is open and your disclosure team should be monitoring closely."],
          ["OCEAN POLICY ADVOCATE", "A score crossing from WATCH to ELEVATED is your signal to begin intervention preparation: submission of position papers, coalition coordination, media briefings. A score at HIGH means the final mobilisation window. In Type 3 bodies the score correctly identifies active conditions but cannot tell you whether this session will succeed. It tells you this is the moment to be present and prepared regardless."],
          ["SEAFOOD TRADE COMPLIANCE", "An IUU score above 6.0 in a Type 1 period means EU or US enforcement escalation is approaching. The EU CATCH system went mandatory in January 2026 when the IUU score was at 4.6 and rising. Three weeks later, port-level enforcement disruptions hit European markets. Operators monitoring the score had a preparation window. Operators who were not monitoring it did not."],
        ] as const).map(([label, text]) => (
          <div key={label} style={{ borderTop: `1px solid ${BORDER}`, padding: "20px 0", marginBottom: 0 }}>
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: NAVY, marginBottom: 8, letterSpacing: "0.03em" }}>{label}</div>
            <p style={{ fontFamily: F, fontSize: 15, color: BODY, lineHeight: 1.75, margin: 0 }}>{text}</p>
          </div>
        ))}

        {/* ── SECTION 7 ── */}
        <h2 style={sectionHeading}>Methodology governance and open scrutiny</h2>
        <p style={bodyText}>
          This methodology is published openly because transparency is the only honest basis for a claim to professional credibility. The framework has been stress-tested against approximately 120 historical event-periods across five domains from 2020 to 2026, and failures are reported alongside successes. The false positive rates, missed signals, and structural blind spots documented above are not footnotes. They are central to understanding what this score can and cannot do.
        </p>
        <p style={bodyText}>
          This methodology has not yet been subjected to independent academic peer review. That is a planned step, not a completed one. What has been done is to apply the standard any honest index should meet: publish the equation, publish the validation data including failures, publish the limitations, and invite scrutiny.
        </p>
        <p style={bodyText}>
          If you work in ocean governance, maritime law, ESG analysis, fisheries compliance, or marine science and you find an error, a miscalibrated multiplier, or a domain where the threshold claims do not hold, contact us. The methodology improves through challenge, not through insulation from it.
        </p>

        {/* Open for scrutiny callout */}
        <div style={{ background: "#F0FDF4", border: `0.5px solid ${TEAL}`, borderLeft: `3px solid ${TEAL}`, borderRadius: 4, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: TEAL, marginBottom: 12 }}>OPEN FOR SCRUTINY</div>
          <p style={{ fontFamily: F, fontSize: 14, color: "#3C4043", lineHeight: 1.65, margin: 0 }}>
            {"\u00B7"} Critical assessment of threshold claims and multiplier values.<br />
            {"\u00B7"} Proposals to cite this framework in academic or professional publications.<br />
            {"\u00B7"} Identification of historical events where the score would have failed.<br />
            {"\u00B7"} Suggestions for additional monitored sources or domains.<br />
            Contact: <a href="mailto:methodology@thetideline.co" style={{ color: TEAL, textDecoration: "none" }}>methodology@thetideline.co</a>
          </p>
        </div>

        {/* Governance note */}
        <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 16, marginTop: 24 }}>
          <p style={{ fontFamily: F, fontSize: 13, color: SEC, lineHeight: 1.65, margin: 0 }}>
            Methodology updates require documented rationale and validation against at least five historical events before any change takes effect. Updates to monitored source lists or domain classifications are treated as methodology revisions and require the same standard. The reproducibility standard: a second analyst following this methodology, using the same sources in the same time window, must produce an Adjusted Score within 0.5 points of the published score for any domain and period. This methodology will be submitted for independent academic peer review. When that review is complete, findings and responses will be published at this URL.
          </p>
        </div>

        {/* ── SECTION 8 ── */}
        <h2 style={sectionHeading}>Academic foundations</h2>
        <p style={bodyText}>
          The theoretical foundation for the Institutional Risk Multiplier is George Tsebelis&apos;s veto player theory:
        </p>

        <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 16, marginBottom: 12 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Tsebelis, G. (2002). Veto Players: How Political Institutions Work. Princeton University Press. [Foundation for Component 4. Veto player theory applied to ocean governance institutional types. 4,000+ academic citations.]
          </p>
        </div>
        <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 16, marginBottom: 12 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Young, O.R. (1994). International Governance: Protecting the Environment in a Stateless Society. Cornell University Press. [Theoretical basis for monitoring formal treaty body activity as a governance signal.]
          </p>
        </div>
        <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 16, marginBottom: 12 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: BODY, lineHeight: 1.65, margin: 0 }}>
            Mitchell, R.B. (2003). International Environmental Agreements: A Survey of Their Features, Formation, and Effects. Annual Review of Environment and Resources, 28(1), 429-461. [Framework for classifying international environmental agreement types.]
          </p>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Tideline Ocean Intelligence</div>
              <div style={{ fontFamily: F, fontSize: 13, color: SEC }}>methodology@thetideline.co</div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <a href="/platform/trackers" style={{ fontFamily: F, fontSize: 13, color: TEAL, textDecoration: "none" }}>View live trackers</a>
              <a href="/platform" style={{ fontFamily: F, fontSize: 13, color: TEAL, textDecoration: "none" }}>Platform</a>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: F, fontSize: 12, color: SEC, margin: 0 }}>
              2026 Tideline Ocean Intelligence. Methodology published openly for scrutiny and citation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
