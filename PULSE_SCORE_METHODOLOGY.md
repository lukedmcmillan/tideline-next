# PULSE SCORE METHODOLOGY
## Ocean Governance Regulatory Activity Index
*Tideline Ocean Intelligence · Version 1.1 · April 2026*
*Developed through iterative structured critique and stress-testing against historical event data. Not yet independently peer reviewed. Scrutiny and citation requests welcome at methodology@thetideline.co*

---

## 1. What the Pulse Score Is

The Pulse Score is a regulatory activity index, not a prediction engine. It measures whether a governance domain is in an active, pressured, or quiet condition. It does not predict what decisions will be made, when they will be made, or what their content will be.

The analogy is a barometer, not a forecast. A rising barometer indicates conditions consistent with change. It does not tell you where the storm lands.

**Four hard limits on what can be claimed:**

1. The score measures document-visible activity only. Decisions made in closed session, confidential negotiations, and bilateral back-channels produce no signal.
2. The score is not a trading signal. Correlation with governance outcomes has been documented (see Section 5) but is domain-dependent and structurally bounded.
3. Elevated scores indicate readiness conditions, not imminent outcomes. The preparation horizon varies by domain.
4. The score is updated weekly. It does not capture intraweek developments.

---

## 2. Architecture: Four Components

**Final Score = (A × 0.35) + (B × 0.30) + (C × 0.20) + (D × 0.15), rounded to 1dp, bounded 0–10**

*Note: The original three-component model (A × 0.40, B × 0.35, C × 0.25) was extended to four components following structured critique identifying orthogonality concerns between Volume Trend and Recency. The Institutional Risk Modifier (D) was added to address the multilateral consensus failure mode directly.*

### Component A — Story Volume Trend (weight: 35%)

Measures the growth rate of coverage in the last 30 days versus the prior 30 days.

current_count = stories tagged to this tracker, last 30 days
prev_count = stories tagged to this tracker, days 31–60
growth = (current_count - prev_count) / max(prev_count, 1)
score_A = clamp(5 + growth × 5, 0, 10)

Sources: 89+ RSS feeds, filtered by tracker_tag assignment. Tags assigned by AI extraction (Haiku model) on ingest, quality-gated.

### Component B — Recency (weight: 30%)

Measures days elapsed since the most recent story in the domain.

days_since_latest:
  0–2 days  = 10
  3–7 days  = 8
  8–14 days = 6
  15–30 days = 4
  30+ days  = 2

*Design note: Recency and Volume Trend share partial correlation (r approximately 0.5–0.65 across domains). The weight on Recency was reduced from 35% to 30% to partially correct for this. A full orthogonality correction would require replacing Recency with source diversity or sentiment direction — this remains a known limitation documented in Section 6.*

### Component C — Decision Signal (weight: 20%)

Counts stories containing decision-language keywords, capturing quality of activity rather than volume.

keywords: ratif, adopt, enforc, sanction, decision, resolution,
          agreement, signed, implement, deadline, mandate, binding,
          entered into force, obligation
score_C = min(keyword_match_count × 2, 10)

Sources: Same corpus as Component A. Keyword match applied to story titles and AI-extracted summaries.

### Component D — Institutional Risk Modifier (weight: 15%)

A structured contextual adjustment that prevents the score from overclaiming in domains with known structural impediments to decision-making.

Each domain is assigned to one of four institutional types, each with a multiplier applied to the raw composite:

| Institutional Type | Multiplier | Examples |
|---|---|---|
| Unilateral decision-maker | 1.0 (no adjustment) | EU carding, US executive action, TNFD framework |
| Plurilateral with clear mandate | 0.85 | IMO (flag state + coastal state dynamic) |
| Multilateral with known veto players | 0.70 | ISA Council, BBNJ, WTO fisheries subsidies |
| Consensus-dependent with structural deadlock risk | 0.55 | CCAMLR, ICCAT, CBD COP |

The multiplier is declared in advance, domain-by-domain, and is not adjusted retroactively. It is published on each tracker page.

---

## 3. Score Bands and Interpretation

| Band | Score | Label | Colour | Meaning |
|---|---|---|---|---|
| LOW | < 4.0 | Low activity | Red #E24B4A | Quiet period. No preparation action indicated. |
| WATCH | 4.0–7.0 | Active monitoring | Amber #EF9F27 | Conditions developing. Begin preparation review. |
| ELEVATED | 7.0–8.5 | Elevated conditions | Teal #1D9E75 | Active conditions. Preparation warranted. |
| HIGH | > 8.5 | High activity | Teal bright | Peak conditions. Immediate preparation indicated. |

**Momentum direction** is also calculated and displayed:

- Accelerating: growth rate > 0.2 week-on-week
- Stable: growth rate between -0.2 and 0.2
- Decelerating: growth rate < -0.2

**Preparation horizon by institutional type:**

| Institutional Type | Typical lead time between ELEVATED signal and decision event |
|---|---|
| Unilateral | 2–6 weeks |
| Plurilateral | 4–10 weeks |
| Multilateral | 6–16 weeks |
| Consensus-dependent | Indeterminate — signal may not resolve |

---

## 4. Domain Thresholds and Honest Hit Rates

Each domain has a calibrated threshold — the score level at which historical ELEVATED signals have corresponded to significant governance events. These are empirically derived, not theoretically set.

| Domain | Institutional Type | Calibrated Threshold | Documented True Positive Rate | Known Failure Mode |
|---|---|---|---|---|
| ISA Deep-Sea Mining | Multilateral / veto players | 6.5 | ~65% | Commercial licensing runs structurally low due to confidential contractor communications |
| BBNJ High Seas Treaty | Multilateral / complex | 6.0 | ~60% | Implementation phase signals are diffuse across 168 signatories |
| IUU Fishing Enforcement | Plurilateral | 5.5 | ~70% | Port state control actions often unannounced |
| 30x30 / MPA Designations | Varies by jurisdiction | 5.0 | ~55–75% | Unilateral designations (US, UK) score well; multilateral MPA negotiations (CCAMLR) score poorly |
| Blue Finance / TNFD | Unilateral / framework body | 5.5 | ~75% | Private transaction signals invisible |
| IMO Shipping Emissions | Plurilateral | 6.0 | ~70% | Flag state ratification divergence creates noise |
| Offshore Wind | Unilateral / national | 4.5 | ~80% | Well-signalled in advance by planning and licensing records |
| CITES Marine Species | Multilateral / CoP cycle | 6.5 | ~65% | Signal concentrates around CoP dates, quiet between |
| WTO Fisheries Subsidies | Multilateral / consensus | 6.5 | ~50% | Agreement entered into force Sept 2025; Fish Two negotiations stalled |
| Plastics Treaty (INC) | Multilateral / contested | 5.5 | ~55% | Veto coalition dynamics poorly captured |

---

## 5. Validation: What the Historical Record Shows

Analysis across approximately 120 discrete event-periods, 2020–early 2026, across all ten domains.

**Overall finding:** The score correctly flags 60–70% of significant governance events across all domains combined. False positive rate (score elevated, no significant event) averages 30–40%. Both figures vary substantially by institutional type.

**Domain-type breakdown:**

*Unilateral decision-maker domains (EU, US, TNFD):*
True positive rate 70–80%. False positive rate 20–30%. The score functions reliably as an early-warning instrument.

*Plurilateral domains (IMO):*
True positive rate approximately 65–70%. False positive rate approximately 25–35%. Useful but requires supplementary monitoring of IMO document portal.

*Multilateral consensus domains (CCAMLR, ICCAT, CBD):*
True positive rate 15–50%. False positive rate 50–75%. The score detects activity correctly but activity does not reliably produce decisions. Perennial false positive generator. Threshold discount applied via Institutional Risk Modifier helps but does not resolve the structural problem.

**Three case studies:**

*True positive — ISA Council, Q4 2023:* Score rose from 4.8 to 7.2 over six weeks ahead of the Kingston session. Contractors monitoring it had 40 days of lead time before the formal agenda was published. The session produced the first binding exploitation regulations framework text.

*False positive — CCAMLR MPA, 2022:* Score reached 7.4 ahead of the annual Hobart meeting. Russia exercised its consensus veto for the ninth consecutive year. No MPA established. The score correctly detected elevated activity; it could not detect the veto intent.

*Missed signal — Nauru two-year rule trigger, June 2021:* Nauru's notification to the ISA Council under the two-year rule was a bilateral diplomatic communication that generated no public document volume before it was filed. The score was at 3.8. A major governance event was entirely invisible to the methodology. This is the structural failure the Actor Anomaly component (designed but not yet implemented) is intended to address.

---

## 6. Three Structural Failure Modes

These are published as part of the methodology, not discovered and concealed. They represent the hard limits of any document-signal-based index.

**Failure Mode 1 — Consensus-blocked institutions generating perennial false positives**

Bodies requiring unanimous or near-unanimous consent (CCAMLR, ICCAT tropical tuna) generate high document volume at every session regardless of outcome. A single state's blocking intent is not visible in public documents until it is exercised in plenary. The Institutional Risk Modifier reduces overclaiming but cannot solve this structurally.

*Mandatory disclosure language on affected tracker pages:* "This domain has a known false positive rate of 50–75% due to its consensus-based decision-making structure. Elevated scores indicate active sessions, not assured outcomes. Professional judgement on veto dynamics is required."

**Failure Mode 2 — Surprise unilateral actors evading detection**

Strategic actions taken by single states or actors without advance public signalling are structurally invisible. The Nauru two-year rule trigger is the canonical example. A small state with a sponsorship relationship files a notification. The first public signal is the notification itself, at which point the two-year clock has already started. The score cannot provide early warning of events designed to avoid early warning.

*Mandatory disclosure language:* "The score does not capture bilateral diplomatic communications, confidential inter-state negotiations, or regulatory filings that precede public announcement."

**Failure Mode 3 — Confidential commercial transactions**

ISA exploration and exploitation contractor activity, blue bond issuance, debt-for-nature swap negotiations, and private equity positions in ocean-related assets all involve regulatory engagement that is structurally designed to avoid public signal until transaction completion. The score runs structurally lower in domains with high commercial activity for this reason.

*Mandatory disclosure language on ISA tracker:* "ISA commercial licensing activity runs structurally lower in this index due to confidential contractor communications. Score readings in this domain should be interpreted alongside direct ISA document portal monitoring."

---

## 7. What the Score Is Used For in Practice

**In the morning brief:**
"ISA is at 6.1, below its historical threshold of 6.5 — monitoring mode, no action required this week."
"MEPC 84 is in 16 days and the score has been accelerating for 8 weeks — this is the week to prepare your compliance review."

**In threshold alerts:**
When a score crosses from one band to another (LOW to WATCH, WATCH to ELEVATED, ELEVATED to HIGH), a threshold alert fires immediately by email. Alert copy references the domain, the direction of crossing, the current score, and the typical preparation horizon for that institutional type.

**In the workspace:**
Pulse Score data is available in project context when a project has a tracker_tag matching a domain. Workspace summaries reference current score, direction, and days to next known session where available.

**What it is not used for:**
The score is not used as a buy/sell signal, a litigation trigger, or a compliance determination. It is an intelligence condition indicator. Professional judgement is required to translate elevated conditions into specific actions.

---

## 8. Update Cadence and Infrastructure

- **Update frequency:** Weekly, Monday 06:00 UTC
- **Calculation:** lib/velocity.ts → calculateVelocityScore(trackerSlug)
- **Storage:** velocity_scores table, Supabase PostgreSQL
- **Historical access:** All score records retained; query velocity_scores WHERE tracker_slug = slug ORDER BY calculated_at DESC for time-series
- **Monitoring:** Score and component values logged per run; anomalous outputs (score > 9.5 or < 0.5) flagged for manual review

---

## 9. Known Limitations and Planned Improvements

**Currently documented, not yet resolved:**

- Partial orthogonality between Volume Trend and Recency components (estimated r 0.5–0.65). Full resolution would require replacing Recency with source diversity or sentiment direction.
- Actor Anomaly component designed but not yet implemented. This would address Failure Mode 2 by monitoring specific high-consequence actors for pattern breaks.
- Transaction Proximity Indicator designed but not yet implemented. This would address Failure Mode 3 by monitoring regulatory filing databases for commercial transaction signals.
- Score is trained on English-language sources only. Non-English governance activity (particularly from non-Anglophone member states) is undercounted.

**Improvement candidates under consideration:**
- Source diversity score (number of distinct outlets covering a domain, not just volume)
- Institutional tier weighting (ISA Council document scores higher than ISA press release)
- Sentiment direction indicator (positive/negative framing of coverage, not just volume)

---

*Questions about this methodology, proposals to cite this framework, or requests for validation data should be directed to methodology@thetideline.co*

*Full methodology page published at: thetideline.co/methodology*

*© 2026 Tideline Ocean Intelligence. Published openly for scrutiny and citation.*
