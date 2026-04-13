export default function MethodologyPage() {
  const F = "'DM Sans', sans-serif";
  const MONO = "'DM Mono', monospace";
  const T1 = "#202124";
  const T2 = "#3C4043";
  const T3 = "#5F6368";
  const T4 = "#9AA0A6";
  const TEAL = "#1D9E75";
  const BG = "#FAFAF7";
  const WHITE = "#FFFFFF";
  const BD = "#E8EAED";
  const NAVY = "#0A1628";

  const multiplierRows = [
    { type: "Type 1", label: "Unilateral", value: "0.85", examples: "EU carding, US enforcement, Crown Estate leasing" },
    { type: "Type 2", label: "Mixed architecture", value: "0.75", examples: "IMO MEPC, ISA Council, CITES CoP" },
    { type: "Type 3", label: "Consensus-dependent", value: "0.46", examples: "BBNJ, Plastics Treaty, CCAMLR" },
    { type: "Type 4", label: "Confidential commercial", value: "0.40", examples: "Debt-for-nature swaps, sovereign blue bonds" },
    { type: "Type 5", label: "Ratification milestone", value: "0.90", examples: "WTO compliance threshold, BBNJ ratification counter" },
    { type: "Type 6", label: "Voluntary standard-setting", value: "0.80", examples: "TNFD releases, GRI updates" },
  ];

  const validationRows = [
    { event: "ISA July 2023 deadline session", base: "9.33", mult: "0.75", adj: "6.53", result: "True positive", icon: "check" },
    { event: "BBNJ IGC-4 March 2022 (failed)", base: "8.45", mult: "0.46", adj: "3.89", result: "FP correctly suppressed", icon: "check" },
    { event: "Nauru two-year trigger June 2021", base: "2.93", mult: "0.75", adj: "2.05", result: "Score fails. Flag needed.", icon: "warn" },
    { event: "IMO MEPC 80 July 2023", base: "8.80", mult: "0.75", adj: "6.60", result: "True positive", icon: "check" },
    { event: "INC-5 Busan Nov 2024 (failed)", base: "9.33", mult: "0.46", adj: "4.01", result: "FP correctly suppressed", icon: "check" },
    { event: "WTO Fish ratification Sep 2025", base: "7.33", mult: "0.90", adj: "5.86", result: "True positive", icon: "check" },
  ];

  const th = { padding: "10px 14px", fontFamily: MONO, fontSize: 11, fontWeight: 600 as const, color: T4, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left" as const, borderBottom: `2px solid ${BD}` };
  const td = { padding: "10px 14px", fontFamily: F, fontSize: 13, color: T1, borderBottom: `1px solid ${BD}`, lineHeight: 1.5 };
  const tdMono = { ...td, fontFamily: MONO, fontSize: 12 };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Nav bar */}
      <div style={{ background: NAVY, padding: "16px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em" }}>Tideline</span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase", marginLeft: 10 }}>Ocean Intelligence</span>
          </a>
          <a href="/platform/feed" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Back to platform</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Title */}
        <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: T1, lineHeight: 1.25, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          What the Pulse Score can and cannot tell you
        </h1>
        <p style={{ fontFamily: F, fontSize: 15, color: T3, margin: "0 0 48px", lineHeight: 1.6 }}>
          A published methodology with honest hit rates and documented failure modes. Version 1.2, April 2026.
        </p>

        {/* Section 1 */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px", letterSpacing: "-0.01em" }}>What it is</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 16px" }}>
          The Ocean Governance Pulse Score is a structured monitoring index. It measures the intensity of observable public regulatory activity across ten ocean governance domains and produces a weekly numerical output on a 0 to 10 scale.
        </p>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 16px" }}>
          It answers one question: are the conditions for a significant governance event currently present in this domain?
        </p>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 16px" }}>
          It does not answer: will a significant event occur?
        </p>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 48px" }}>
          The distinction is not a weakness. It is the most important honest claim the score makes, and the one that makes it defensible under scrutiny.
        </p>

        {/* Section 2 */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 24px", letterSpacing: "-0.01em" }}>How it is calculated</h2>

        {/* Formula block */}
        <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, padding: "24px 28px", marginBottom: 32, overflow: "hidden" }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: T1, lineHeight: 2 }}>
            <div style={{ color: T4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Base Score</div>
            <div>
              <span style={{ color: TEAL, fontWeight: 500 }}>BASE</span> = (Volume Trend <span style={{ color: T4 }}>x</span> 0.40) + (Recency <span style={{ color: T4 }}>x</span> 0.35) + (Decision Signals <span style={{ color: T4 }}>x</span> 0.25)
            </div>
            <div style={{ height: 1, background: BD, margin: "16px 0" }} />
            <div style={{ color: T4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Adjusted Score</div>
            <div>
              <span style={{ color: TEAL, fontWeight: 500 }}>ADJUSTED</span> = Base Score <span style={{ color: T4 }}>x</span> Institutional Risk Multiplier
            </div>
          </div>
        </div>

        {/* Component: Volume Trend */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Volume Trend <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(40%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>
          Compares document volume in the past 30 days against the preceding 30 days.
        </p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>
          clamp(5 + growth x 5, 0, 10)
        </div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 28px" }}>
          Weighted highest because it is the most consistently collectable and verifiable signal across all ten domains.
        </p>

        {/* Component: Recency */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Recency <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(35%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>
          Exponential decay from most recent significant document. A document 14 days old scores 5.0. A document 30 days old scores 2.2.
        </p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>
          {"10 x e^(-0.05 x days)"}
        </div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 28px" }}>
          Captures whether the domain is currently live or dormant.
        </p>

        {/* Component: Decision Signals */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Decision Signals <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(25%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>
          Count of documents containing signal terms: ratif, adopt, enforc, sanction, decision, resolution, agreement, signed, implement, deadline, entry into force, final text, mandate, conclude, binding.
        </p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>
          min(signal_count x 2, 10)
        </div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 36px" }}>
          Weighted lowest because advocacy language appears in both successful and failed sessions.
        </p>

        {/* Institutional Risk Multiplier */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Institutional Risk Multiplier</h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>
          Adjusts the Base Score based on the decision-making architecture of the governance body. Derived from George Tsebelis&apos;s veto player theory (Princeton University Press, 2002).
        </p>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "0 0 16px" }}>
          Bodies with more veto players and consensus requirements are less likely to convert high activity into a binding outcome. The multiplier compresses their scores accordingly.
        </p>

        <div style={{ overflowX: "auto", marginBottom: 48 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={th}>Type</th>
                <th style={th}>Architecture</th>
                <th style={th}>Multiplier</th>
                <th style={th}>Examples</th>
              </tr>
            </thead>
            <tbody>
              {multiplierRows.map((r) => (
                <tr key={r.type}>
                  <td style={tdMono}>{r.type}</td>
                  <td style={td}>{r.label}</td>
                  <td style={tdMono}>{r.value}</td>
                  <td style={{ ...td, fontSize: 13, color: T3 }}>{r.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3 */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px", letterSpacing: "-0.01em" }}>Validated performance</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>
          The framework was tested against ten discrete historical event-periods selected to stress-test each component. Results are reported with failures included.
        </p>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "0 0 24px" }}>
          Six representative cases are shown below. The full validation dataset is available on request.
        </p>

        <div style={{ overflowX: "auto", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={th}>Event</th>
                <th style={th}>Base</th>
                <th style={th}>Mult.</th>
                <th style={th}>Adj.</th>
                <th style={th}>Result</th>
              </tr>
            </thead>
            <tbody>
              {validationRows.map((r) => (
                <tr key={r.event}>
                  <td style={td}>{r.event}</td>
                  <td style={tdMono}>{r.base}</td>
                  <td style={tdMono}>{r.mult}</td>
                  <td style={tdMono}>{r.adj}</td>
                  <td style={{ ...td, color: r.icon === "check" ? TEAL : "#B45309" }}>
                    <span style={{ marginRight: 6 }}>{r.icon === "check" ? "\u2713" : "\u26A0"}</span>
                    {r.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance metrics */}
        <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, padding: "24px 28px", marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Performance metrics (n=10)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.83</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>Precision. Of events flagged, 83% produced a governance outcome within 30 days.</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.71</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>Recall. Of known governance events in the test set, 71% were flagged in advance.</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.77</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>F1 Score. Harmonic mean of precision and recall across the validation set.</div>
            </div>
          </div>
        </div>

        {/* Section 4: What it cannot tell you */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px", letterSpacing: "-0.01em" }}>Known failure modes</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 16px" }}>
          The score fails in predictable, documented ways. These are not bugs. They are structural limitations of any index built on observable public signals.
        </p>

        <div style={{ marginBottom: 48 }}>
          {[
            {
              title: "Procedural triggers without public signal buildup",
              body: "The Nauru two-year trigger (June 2021) activated a regulatory deadline with minimal preceding document activity. The score read 2.05. The event happened anyway. Any calendar-driven trigger that does not require negotiation or public deliberation will produce a low score regardless of consequence."
            },
            {
              title: "Confidential negotiations",
              body: "Debt-for-nature swaps, sovereign blue bond structuring, and bilateral enforcement deals generate almost no public documentation until announcement. The score cannot see what is not published. The 0.40 multiplier compresses these domains but does not eliminate the blind spot."
            },
            {
              title: "Advocacy noise in document signals",
              body: "NGO submissions, side-event reports, and advocacy press releases use the same signal terms as binding decisions. The decision signal component cannot distinguish a resolution from a call for one. This is why it carries the lowest weight (25%), but it still introduces noise during active campaign periods."
            },
            {
              title: "Language and jurisdiction gaps",
              body: "The index monitors English-language public documents. Governance activity in non-English jurisdictions, regional fisheries management organisations with limited English publication, or bodies that publish primarily in French or Spanish will be underrepresented."
            },
          ].map((item) => (
            <div key={item.title} style={{ borderLeft: `3px solid ${BD}`, paddingLeft: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1, marginBottom: 4 }}>{item.title}</div>
              <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>

        {/* Section 5: How to use it */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px", letterSpacing: "-0.01em" }}>How to use the score</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 16px" }}>
          The Pulse Score is a monitoring instrument, not a forecast. It is designed to be used as one input alongside professional judgement, not as a replacement for it.
        </p>
        <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, padding: "24px 28px", marginBottom: 48 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>Use it to</div>
              <ul style={{ fontFamily: F, fontSize: 14, color: T2, lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                <li>Prioritise which domains need attention this week</li>
                <li>Brief colleagues on where regulatory conditions are intensifying</li>
                <li>Cross-reference against your own intelligence before a session</li>
                <li>Track whether a domain is accelerating, stable, or quiet</li>
              </ul>
            </div>
            <div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#B45309", marginBottom: 8 }}>Do not use it to</div>
              <ul style={{ fontFamily: F, fontSize: 14, color: T2, lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                <li>Predict whether a treaty session will succeed or fail</li>
                <li>Make investment decisions without independent due diligence</li>
                <li>Replace domain expertise or direct source monitoring</li>
                <li>Infer causation from correlation between domains</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BD}`, paddingTop: 24 }}>
          <p style={{ fontFamily: F, fontSize: 13, color: T4, lineHeight: 1.6, margin: "0 0 8px" }}>
            This methodology is published for transparency and professional citation. If you reference the Pulse Score in published work, cite as: Tideline Ocean Governance Pulse Score, Version 1.2, April 2026. thetideline.co/methodology.
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: T4, lineHeight: 1.6, margin: 0 }}>
            Questions about the methodology can be directed to <a href="mailto:luke@thetideline.co" style={{ color: TEAL, textDecoration: "none" }}>luke@thetideline.co</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
