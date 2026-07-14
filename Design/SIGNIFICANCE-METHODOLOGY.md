# SIGNIFICANCE-METHODOLOGY.md
## Story Significance Score: how Tideline decides what is worth your time
*Version 0.1 DRAFT, July 2026. Companion to PULSE_SCORE_METHODOLOGY.md. All weights and thresholds marked [PROPOSED] are for Luke to confirm before this becomes v1.0 and is published. Follows the governing principle in TIDELINE-MASTER.md 4.1: deterministic assembly wherever possible, constrained generation where a model is unavoidable, every scored row reproducible from its own stored components.*

---

## 1. What the significance score is

A 0-100 estimate of how much a single story matters to a professional ocean governance audience, computed once at ingest, stored forever, never retroactively edited.

It answers one question: **of everything published today, what should a professional actually read?** It is the number that decides what leads the brief, what appears on the dashboard, what the feed shows in full, and what gets compressed into "19 lower-scoring stories."

**What it is not:**
- Not a measure of truth or quality. A significant story can be wrong; the conflicts system exists for that.
- Not personalised. The score is global (see Section 5). Relevance to an individual user is a display-time filter, never a mutation of the stored score.
- Not a risk score. It feeds one (OGX component E weights events by significance), but on its own it is an editorial triage instrument.

Until the validation programme in Section 7 has two cycles behind it, the published language is "significance estimate," never "importance ranking."

---

## 2. Architecture: five components

**Final score = A + B + C + D + E, bounded 0-100, all components stored per row.**

| Component | Range | Nature | Source |
|---|---|---|---|
| A. Category base | 0-30 | Deterministic | Existing category classifier |
| B. Source authority | 0-15 | Deterministic | Source registry (`source_type`, tier) |
| C. Corroboration | 0-15 | Deterministic | Story cluster within 72h |
| D. Tracker context | 0-10 | Deterministic | `velocity_scores` + event calendar |
| E. Impact dimensions | 0-30 | Constrained model | Haiku, strict JSON, schema-validated |

70% of the maximum score is deterministic given data already stored. The model touches only component E, and only through typed slots.

### A. Category base (0-30) [PROPOSED values]

Lookup on the classification the pipeline already assigns:

| Category | Base |
|---|---|
| GOVERNANCE_CHANGE | 30 |
| ANALYSIS_OR_FINDING | 18 |
| COMMERCIAL_BUSINESS | 14 |
| EXPLAINER_OR_DISCUSSION | 8 |
| OTHER | 4 |

### B. Source authority (0-15) [PROPOSED values]

Lookup on the source registry tier:

| Tier | Score | Examples |
|---|---|---|
| Issuing body / primary document | 15 | IMO docs, ISA, DOALOS, EU official journal, FAOLEX |
| Specialist trade press | 11 | Lloyd's List, TradeWinds, ENDS |
| Wire / major press | 9 | Reuters, AP |
| NGO / advocacy publication | 7 | DSCC, Oceana reports |
| Commentary, blogs, aggregators | 3 | |

Tier assignments live in the source registry, are published, and changes are versioned. A story carried by multiple sources takes the tier of the highest-authority source in its cluster.

### C. Corroboration (0-15)

```
distinct_orgs = count of distinct source organisations covering the
                same clustered story within 72h (same pairing logic
                as divergence candidate detection)
score_C = min(distinct_orgs, 5) x 3
```

Capped at 5 organisations. The cap is the anti-churnalism control: beyond five distinct sources, additional restatements add zero. Syndicated copies of one wire story count once (cluster dedupe by near-duplicate detection, not by outlet name).

### D. Tracker context (0-10) [PROPOSED values]

Deterministic read at scoring time:

- Domain at ELEVATED or HIGH: +6
- Domain crossed a band in the last 7 days: +2
- Known session or deadline in the domain within its preparation horizon: +2

Stored as computed, with the Pulse score and band that produced it recorded alongside (the context is point-in-time; the same story scored a month later would score differently, and the row must prove what the context was).

### E. Impact dimensions (0-30)

Haiku scores three narrow dimensions, 0-10 each, summed. Strict JSON schema; any missing or out-of-range field rejects the scoring and the story falls back to A+B+C+D with `e_status = 'unscored'` recorded. No free text reaches the composite.

| Dimension | 0 means | 10 means |
|---|---|---|
| Bindingness | Discussion, opinion, aspiration | Adopted, ratified, in force, enforced |
| Scope | One actor, local effect | Multilateral, fleet-wide, market-wide effect |
| Novelty | Restatement of known position | First occurrence, reversal, or threshold event |

Prompt returns `{bindingness, scope, novelty}` integers only. `classifier_version` and `model_id` stamped on every row (RISK-SCREENER-SPEC 3.8). Model migrations get a dual-scoring overlap on a sample with drift stats retained.

---

## 3. Bands and what they operate

The bands are not cosmetic; each one is wired to a product behaviour that already exists or is specced:

| Band | Score | Behaviour |
|---|---|---|
| Lead-eligible | ≥ 70 | Passes brief Gate 1 hard threshold (BRIEF-LEAD-SPEC, already locked at 70). Dashboard lead candidate. Red significance numeral in UI. |
| Shown | 40-69 | Full signal row in feed and story lists. Green numeral. |
| Compressed | < 40 | Collapsed into the "lower-scoring stories" line. Muted numeral if expanded. |

[PROPOSED] The 40 display threshold is user-adjustable as a personal significance line (display filter only; see Section 5).

---

## 4. Reproducibility and storage (export-grade discipline)

The `stories` scoring extension stores, per story: `significance_score`, `component_a` through `component_e` (E as its three sub-dimensions), `e_status`, `methodology_version`, `classifier_version`, `model_id`, `pulse_score_at_scoring`, `pulse_band_at_scoring`, `cluster_id`, `distinct_org_count`, `scored_at`.

Rules inherited from DATA-LICENSING-DESIGN:
1. Additive columns only; this extension is plan-mode-zone.
2. Scores are never retroactively edited. Corrections are new rows with `supersedes_id`.
3. Every score reproducible from its own row plus the published methodology version in force.
4. `scored_at` (calculation time) distinct from `published_at` (event time) distinct from `detected_at` (ingest time).

This matters commercially: OGX component E (event pressure) is defined as severity-weighted classified events, and significance is that severity weight. The significance series is therefore part of the licensable asset, and gets the same protections as `velocity_scores` and `divergences`.

---

## 5. Global score, personal display (a locked architectural split) [PROPOSED to lock]

The stored score is identical for every user. Personalisation (my trackers, my watched entities, my significance line) is applied at query time as filters and sort boosts, and never writes back to the stored score.

Why this is non-negotiable: a licensee buying the event stream needs one comparable series, not the average of everyone's preferences; and internally, a global score is the only way "You might have missed" (high-scoring this week, never led) has a stable meaning.

---

## 6. Published failure modes

Same posture as the Pulse methodology: stated up front, on the methodology page.

1. **Primary-source timing.** Issuing-body documents sometimes publish before any press coverage exists. Such stories score C = 3 (one org) at ingest and are structurally under-scored for their first hours. Mitigation: cluster re-scoring at +24h and +72h writes a new score row (never overwrites) so the series shows the correction honestly.
2. **The wire monoculture.** When one wire story is syndicated widely, near-duplicate detection collapses the cluster to one organisation. If dedupe fails, C inflates. Dedupe precision is a monitored metric, not an assumption.
3. **Model dependence in E.** 30% of the score is model judgment. It is constrained to three integers, versioned, and validated (Section 7), but drift risk is real and the seam between model versions is documented, never smoothed.
4. **English-only inheritance.** Inherits the Pulse corpus bias; non-Anglophone governance activity is under-scored. Disclosed, unresolved.
5. **Category classifier upstream risk.** Component A is only as good as the classification. The GOVERNANCE_CHANGE false-positive audit (open issue, TIDELINE-MASTER 2.4) directly protects this score.

---

## 7. Validation programme (what makes the number defensible)

Significance claims cannot be validated against "importance" directly; they are validated against observable proxies, published annually like the Pulse hit rates:

1. **Pickup prediction.** For each significance decile at first scoring, the observed rate at which the story gained additional distinct sources in the following 72h. High-significance stories should demonstrably lead coverage, not follow it.
2. **Band-crossing precedence.** Rate at which lead-eligible (≥70) stories in a domain were followed by a Pulse band crossing within 14 days.
3. **Reader behaviour** (once open-rate instrumentation ships, priority 6). Click-through and dwell by significance decile across the Explorer cohort. If readers systematically open compressed stories and skip shown ones, the weights are wrong and get revised in a new methodology version.

Until cycle one of this programme is published, the score is described as calibrating, exactly as the Blue Carbon tracker is.

---

## 8. Where it surfaces

- **Feed:** the numeral on every row; the compression line under each day.
- **Dashboard:** overnight top-3 selection; "You might have missed" (≥ [60 PROPOSED], never led, past 7 days).
- **Brief:** Gate 1 (≥70) unchanged.
- **Tracker detail:** contributing stories ordered by significance.
- **Entity pages:** mention stream ordering.
- **UI rule (numbers are doors):** clicking any significance numeral opens the component breakdown for that story. The score explains itself on demand, which is the difference between an instrument and decoration.

---

## 9. Open items for Luke

1. Confirm or edit every [PROPOSED] value (component weights, tier scores, band edges, the global/personal lock).
2. Decide re-scoring cadence for the primary-source timing fix (+24h/+72h proposed).
3. Sequencing: the schema extension (Section 4) is one additive migration and rides naturally with the P1-P7 batch already specced in RISK-SCREENER-SPEC Part 5.
4. Publish at thetideline.co/methodology alongside Pulse once v1.0, so the two instruments share one trust surface.

---

*The test from UI-SYSTEM.md applies to this number above all others: can it prove itself? A significance score that opens into its components, states its failure modes, and publishes its validation record is an instrument. One that does not is decoration at £99 a month.*
