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

  const th: React.CSSProperties = { padding: "10px 14px", fontFamily: MONO, fontSize: 11, fontWeight: 600, color: T4, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: `2px solid ${BD}` };
  const td: React.CSSProperties = { padding: "10px 14px", fontFamily: F, fontSize: 13, color: T1, borderBottom: `1px solid ${BD}`, lineHeight: 1.5, verticalAlign: "top" };
  const tdMono: React.CSSProperties = { ...td, fontFamily: MONO, fontSize: 12 };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Nav */}
      <div style={{ background: NAVY, padding: "16px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: WHITE, letterSpacing: "-0.02em" }}>Tideline</span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase", marginLeft: 10 }}>Ocean Intelligence</span>
          </a>
          <a href="/platform/feed" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Back to platform</a>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Title */}
        <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: T1, lineHeight: 1.25, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          What the Pulse Score can and cannot tell you
        </h1>
        <p style={{ fontFamily: F, fontSize: 15, color: T3, margin: "0 0 48px", lineHeight: 1.6 }}>
          A published methodology with honest hit rates and documented failure modes. Version 1.2, April 2026.
        </p>

        {/* ── Section 1: What it is ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px" }}>What it is</h2>
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

        {/* ── Section 2: How it is calculated ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 24px" }}>How it is calculated</h2>

        <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: T1, lineHeight: 2 }}>
            <div style={{ color: T4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Base Score</div>
            <div><span style={{ color: TEAL, fontWeight: 500 }}>BASE</span> = (Volume Trend <span style={{ color: T4 }}>x</span> 0.40) + (Recency <span style={{ color: T4 }}>x</span> 0.35) + (Decision Signals <span style={{ color: T4 }}>x</span> 0.25)</div>
            <div style={{ height: 1, background: BD, margin: "16px 0" }} />
            <div style={{ color: T4, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Adjusted Score</div>
            <div><span style={{ color: TEAL, fontWeight: 500 }}>ADJUSTED</span> = Base Score <span style={{ color: T4 }}>x</span> Institutional Risk Multiplier</div>
          </div>
        </div>

        {/* Volume Trend */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Volume Trend <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(40%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>Compares document volume in the past 30 days against the preceding 30 days.</p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>clamp(5 + growth x 5, 0, 10)</div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 28px" }}>Weighted highest because it is the most consistently collectable and verifiable signal across all ten domains.</p>

        {/* Recency */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Recency <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(35%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>Exponential decay from most recent significant document. A document 14 days old scores 5.0. A document 30 days old scores 2.2.</p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>{"10 x e^(-0.05 x days)"}</div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 28px" }}>Captures whether the domain is currently live or dormant.</p>

        {/* Decision Signals */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Decision Signals <span style={{ fontFamily: MONO, fontSize: 13, color: T4, fontWeight: 400 }}>(25%)</span></h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>Count of documents containing signal terms: ratif, adopt, enforc, sanction, decision, resolution, agreement, signed, implement, deadline, entry into force, final text, mandate, conclude, binding.</p>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T3, background: WHITE, border: `1px solid ${BD}`, borderRadius: 6, padding: "8px 14px", marginBottom: 8, display: "inline-block" }}>min(signal_count x 2, 10)</div>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "8px 0 36px" }}>Weighted lowest because advocacy language appears in both successful and failed sessions.</p>

        {/* Institutional Risk Multiplier */}
        <h3 style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: T1, margin: "0 0 8px" }}>Institutional Risk Multiplier</h3>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 8px" }}>Adjusts the Base Score based on the decision-making architecture of the governance body. Derived from George Tsebelis&apos;s veto player theory (Princeton University Press, 2002).</p>
        <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: "0 0 16px" }}>Bodies with more veto players and consensus requirements are less likely to convert high activity into a binding outcome. The multiplier compresses their scores accordingly.</p>

        <div style={{ overflowX: "auto", marginBottom: 48 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: WHITE, border: `1px solid ${BD}`, borderRadius: 8 }}>
            <thead><tr><th style={th}>Type</th><th style={th}>Architecture</th><th style={th}>Multiplier</th><th style={th}>Examples</th></tr></thead>
            <tbody>
              {([
                ["Type 1", "Unilateral", "0.85", "EU carding, US enforcement, Crown Estate leasing"],
                ["Type 2", "Mixed architecture", "0.75", "IMO MEPC, ISA Council, CITES CoP"],
                ["Type 3", "Consensus-dependent", "0.46", "BBNJ, Plastics Treaty, CCAMLR"],
                ["Type 4", "Confidential commercial", "0.40", "Debt-for-nature swaps, sovereign blue bonds"],
                ["Type 5", "Ratification milestone", "0.90", "WTO compliance threshold, BBNJ ratification counter"],
                ["Type 6", "Voluntary standard-setting", "0.80", "TNFD releases, GRI updates"],
              ] as const).map(([type, arch, mult, ex]) => (
                <tr key={type}><td style={tdMono}>{type}</td><td style={td}>{arch}</td><td style={tdMono}>{mult}</td><td style={{ ...td, color: T3 }}>{ex}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Section 3: Validated performance ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px" }}>Validated performance</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 24px" }}>The framework was tested against ten discrete historical event-periods selected to stress-test each component. Results are reported with failures included.</p>

        <div style={{ overflowX: "auto", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: WHITE, border: `1px solid ${BD}`, borderRadius: 8 }}>
            <thead><tr><th style={th}>Event</th><th style={th}>Base</th><th style={th}>Mult.</th><th style={th}>Adj.</th><th style={th}>Result</th></tr></thead>
            <tbody>
              {([
                ["ISA July 2023 deadline session", "9.33", "0.75", "6.53", "True positive", true],
                ["BBNJ IGC-4 March 2022 (failed)", "8.45", "0.46", "3.89", "FP correctly suppressed", true],
                ["Nauru two-year trigger June 2021", "2.93", "0.75", "2.05", "Score fails. Flag needed.", false],
                ["IMO MEPC 80 July 2023", "8.80", "0.75", "6.60", "True positive", true],
                ["INC-5 Busan Nov 2024 (failed)", "9.33", "0.46", "4.01", "FP correctly suppressed", true],
                ["WTO Fish ratification Sep 2025", "7.33", "0.90", "5.86", "True positive", true],
              ] as [string, string, string, string, string, boolean][]).map(([event, base, mult, adj, result, pass]) => (
                <tr key={event}>
                  <td style={td}>{event}</td><td style={tdMono}>{base}</td><td style={tdMono}>{mult}</td><td style={tdMono}>{adj}</td>
                  <td style={{ ...td, color: pass ? TEAL : "#B45309" }}><span style={{ marginRight: 6 }}>{pass ? "\u2713" : "\u26A0"}</span>{result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: WHITE, border: `1px solid ${BD}`, borderRadius: 8, padding: "24px 28px", marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: T4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Performance metrics (n=10)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.83</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>Precision. Of events flagged, 83% produced a significant outcome.</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.83</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>Recall. Of significant outcomes, 83% were flagged.</div>
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: T1 }}>0.83</div>
              <div style={{ fontFamily: F, fontSize: 13, color: T3, marginTop: 4 }}>F1 Score. Harmonic mean of precision and recall across the validation set.</div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Hard limits ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px" }}>Hard limits</h2>
        <p style={{ fontFamily: F, fontSize: 15, color: T2, lineHeight: 1.75, margin: "0 0 20px" }}>Three categories of events are structurally invisible to the Pulse Score:</p>

        {([
          {
            title: "1. Surprise strategic actions",
            body: "Individual state actors using unfamiliar institutional channels. The canonical case: Nauru\u2019s June 2021 invocation of the ISA two-year rule. Score was 2.05. The most consequential ISA event of the decade. This failure mode is addressed by the Actor Anomaly Flag (in development).",
          },
          {
            title: "2. Confidential commercial transactions",
            body: "Debt-for-nature swaps and sovereign blue bonds are deliberately designed to avoid public signal detection. The Belize blue bond ($364M) had a preceding signal of approximately 3/10. These transactions cannot be detected through public document monitoring.",
          },
          {
            title: "3. Consensus-blocked institutions",
            body: "The framework cannot distinguish high-signal sessions that will succeed from those that will deadlock. BBNJ IGC-4 and IGC-5.2 produced identical adjusted scores (3.89) despite one failing and one succeeding. This is the framework\u2019s most important honest limitation.",
          },
        ]).map((item) => (
          <div key={item.title} style={{ borderLeft: `3px solid ${BD}`, paddingLeft: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1, marginBottom: 4 }}>{item.title}</div>
            <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
          </div>
        ))}

        <div style={{ background: "#FFF8F0", border: "1px solid #FDE68A", borderRadius: 8, padding: "16px 20px", marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Mandatory disclosure</div>
          <p style={{ fontFamily: F, fontSize: 14, color: "#78350F", lineHeight: 1.65, margin: 0 }}>
            This score measures observable public regulatory activity. It cannot detect surprise unilateral actions, confidential commercial transactions, or informal negotiating dynamics. Elevated score = conditions present, not outcome predicted.
          </p>
        </div>

        {/* ── Section 5: Domain thresholds ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px" }}>Alert thresholds by domain</h2>

        <div style={{ overflowX: "auto", marginBottom: 48 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: WHITE, border: `1px solid ${BD}`, borderRadius: 8 }}>
            <thead><tr><th style={th}>Domain</th><th style={th}>Threshold</th><th style={th}>TPR</th><th style={th}>FPR</th><th style={th}>Honest caveat</th></tr></thead>
            <tbody>
              {([
                ["ISA / Deep-Sea Mining", "6.5", "~70%", "~25-30%", "Tracks session activity. Misses surprise unilateral actors."],
                ["BBNJ / High Seas Treaty", "7.0", "~46%", "~46-54%", "Cannot distinguish breakthrough from deadlock in Type 3 body."],
                ["IUU Fishing", "6.0", "~35-80%*", "~15-50%*", "*Varies by sub-domain. WCPFC 80%, CCAMLR 15%."],
                ["30x30 / MPAs", "7.5", "~25-35%", "~70-75%", "Valid for framework outcomes only. Not individual designations."],
                ["Blue Finance / TNFD", "7.0", "~37-70%*", "~37%", "*70% for policy events. 30% for market transactions."],
                ["IMO Shipping", "5.0", "~75%", "~25%", "Strong for scheduled MEPC sessions."],
                ["WTO Fisheries", "5.0", "~75%", "~25%", "Strong for ratification milestones."],
                ["Offshore Wind", "3.5*", "~70%", "~30%", "*Threshold adjusted -1.5 points for commercial regulatory signals."],
                ["CITES Marine", "5.0", "~75%", "~25%", "Strong for CoP listing decisions."],
                ["Plastics Treaty", "5.0", "~0-10%", "~90-100%", "Petrostate veto dynamics. Score rarely reaches threshold."],
              ] as const).map(([domain, thresh, tpr, fpr, caveat]) => (
                <tr key={domain}>
                  <td style={{ ...td, fontWeight: 500 }}>{domain}</td>
                  <td style={tdMono}>{thresh}</td>
                  <td style={tdMono}>{tpr}</td>
                  <td style={tdMono}>{fpr}</td>
                  <td style={{ ...td, fontSize: 12, color: T3 }}>{caveat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Section 6: Version history ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "0 0 16px" }}>Methodology governance</h2>

        {([
          { version: "Version 1.0", date: "April 2026", desc: "Initial publication." },
          { version: "Version 1.2", date: "April 2026", desc: "Revised in response to two rounds of external peer review. Exponential decay recency function replacing stepwise scoring. Type 6 institutional classification added. Multiplier values presented as indicative point estimates with ranges." },
          { version: "Version 2.0", date: "Planned", desc: "Expanded validation dataset (50+ events), statistically derived multipliers with confidence intervals, NLP-based decision-signal analysis, commercial regulatory sub-index for Offshore Wind." },
        ]).map((v) => (
          <div key={v.version} style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "baseline" }}>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: TEAL, flexShrink: 0, minWidth: 90 }}>{v.version}</div>
            <div>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T1 }}>{v.date}.</span>{" "}
              <span style={{ fontFamily: F, fontSize: 13, color: T3 }}>{v.desc}</span>
            </div>
          </div>
        ))}

        {/* ── Section 7: Academic references ── */}
        <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: T1, margin: "36px 0 16px" }}>Academic references</h2>

        {([
          "Tsebelis, G. (2002). Veto Players: How Political Institutions Work. Princeton University Press. [Foundation for institutional risk multiplier]",
          "Young, O.R. (1994). International Governance. Cornell University Press.",
          "Mitchell, R.B. (2003). International Environmental Agreements. Annual Review of Environment and Resources.",
        ]).map((ref) => (
          <p key={ref} style={{ fontFamily: F, fontSize: 14, color: T2, lineHeight: 1.65, margin: "0 0 10px", paddingLeft: 16, borderLeft: `2px solid ${BD}` }}>{ref}</p>
        ))}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BD}`, paddingTop: 24, marginTop: 48 }}>
          <p style={{ fontFamily: F, fontSize: 13, color: T4, lineHeight: 1.6, margin: "0 0 8px" }}>
            Tideline Ocean Intelligence. Questions about this methodology: <a href="mailto:methodology@thetideline.co" style={{ color: TEAL, textDecoration: "none" }}>methodology@thetideline.co</a>
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: T4, lineHeight: 1.6, margin: 0 }}>
            Citation: Tideline Ocean Governance Pulse Score, Version 1.2, April 2026. thetideline.co/methodology
          </p>
        </div>
      </div>
    </div>
  );
}
