# MORNING BRIEF — LEAD & SYNTHESIS SPECIFICATION
*Tideline Ocean Intelligence · v1 · May 2026*
*This document defines what the brief lead optimises for, how it is written, and the synthesis line. It is the source of truth for the brief generator's selection and rendering logic. Implementation must match this spec; deviations require updating this file first.*

---

## THE SPINE — WHAT THE LEAD IS FOR

The lead surfaces the most significant **genuine change** in the subscriber's tracked domains overnight, framed so that knowing it makes the subscriber the **most informed person in their next meeting**.

This is a **C + D** function:

- **D (Delta) governs selection.** A story is lead-eligible only if it represents *movement* — a decision taken, a threshold crossed, a position shifted, a number changed, a new actor entering. Existence is not change. "Researchers tested an instrument" fails D regardless of significance score. "X adopted Y" passes D.
- **C (Cover) governs framing.** Once selected, the lead is written so the subscriber can repeat it in a meeting and sound informed — named actors, specific particulars, the implication stated, and the non-obvious angle a peer would not already know.

---

## STAGE 1 — SELECTION (TIERED)

Two gates, evaluated in order.

**Gate 1 — Major-threshold check.** A change qualifies as *major* if BOTH:
- significance_score >= a hard threshold (start at 70; tune empirically), AND
- the story's tracker is at ELEVATED or above, OR the story corresponds to a Pulse band crossing in the last 7 days.

If a story clears Gate 1, it leads outright, regardless of how widely known it is. Never bury a genuinely major change for cleverness.

**Gate 2 — The edge (applies only if no story clears Gate 1).** Among stories that pass the D test (genuine change — see Delta Test below), the lead is the one a knowledgeable peer is **least likely to already know**. Operationalise "edge" as: lower source ubiquity (fewer distinct sources covering it), higher specificity, not a perennial-topic restatement. Among genuine changes, prefer the non-obvious signal over the widely-covered one.

**The Delta Test (eligibility filter for both gates).** A story is change-eligible only if its core can be stated as `[named actor] [delta verb] [object]`. Delta verbs (allowed set, extend as needed): *adopts, rejects, proposes, enters, crosses, shifts, opens, closes, suspends, ratifies, triggers, escalates, stalls, advances, withdraws, mandates, files, imposes, lifts*. A story that can only be stated with *is, explores, highlights, discusses, examines, fights, considers* is not a change and is not lead-eligible.

**Recently-led exclusion** (already shipped, retain): a story or its near-duplicate cluster that led a brief in the last 7 days is excluded from lead candidates.

---

## STAGE 2 — HEADLINE

The headline is **generated in Tideline's voice**, never the source's headline lifted.

**Default — Model A (constrained declarative).** Used for all Gate 2 (edge) leads.
- Pattern: `[Actor/domain] [delta verb] [object][, optional now-state]`
- The model fills a strict structure; it may NOT editorialize, may NOT use non-delta verbs, may NOT adopt explainer/magazine register.
- Example: source "The ocean is fighting climate change: how people are trying to help it" -> Tideline "Ocean CDR enters open-water field testing".

**Major-threshold — Model C (interpretive).** Used ONLY for Gate 1 leads.
- May state the interpretation/take, not just the event.
- Still must name the actor and assert a change.
- Must pass the existing pre-send quality gate before shipping.
- Example: "Nuclear shipping is now a US policy direction, not a fringe proposal".

**Generation is constrained, never free.** The delta-verb constraint makes the science-magazine headline structurally impossible to construct, rather than relying on the model choosing not to write it. No em dashes (copy rule) — use colon or period.

---

## STAGE 3 — SUMMARY (TWO SENTENCES)

**Sentence 1 — the change (D).** Named actor + delta verb + concrete particular (number, instrument, date, decision). The change itself, not the scene around it.

**Sentence 2 — the stakes (C).** The consequence for a named stakeholder type (marine lawyers / compliance / ESG analysts / investors / NGOs). Why knowing this is useful.

**Hard anti-repetition rule.** Sentence 2 may not reuse any significant noun phrase from sentence 1. This makes "restate the event as padding" structurally impossible. Sentence 2 has nowhere to go except forward to the consequence.

**Default — Model B (constrained slots).** Used for all Gate 2 leads. Sentence 1 slots: actor + delta verb + particular. Sentence 2 slots: consequence + named stakeholder type. Anti-repetition enforced mechanically.

**Major-threshold — Model C (domain-targeted).** Used ONLY for Gate 1 leads. Sentence 2 is written for the specific subscriber's top tracked domain (lawyer vs ESG vs investor get different sentence 2). Passes the quality gate.

---

## STAGE 4 — SYNTHESIS LINE (BULLETPROOF, ZERO-GENERATION)

One line, placed directly under the lead, before Conditions. **No model writes this sentence. It is templated string assembly over verified data, with a pre-send equality check. Omit on mismatch.**

### Templates (typed slots, filled by code from queried values)

- **STALLED:** `{tracker_name} has held at {band} ({score}) for {n} consecutive weeks.`
- **QUIET:** `No tracked domain crossed a band threshold this week. Conditions unchanged since {date}.`
- **OUTSIDE:** `The week's only band movement was {tracker_name}: {old_band} to {new_band}.`
- **BLINDSPOT (appended, not standalone):** `{tracker_a} and {tracker_b} remain unmonitored: zero sources in {n} days.`

All slot values are direct reads from `velocity_scores`, score history, trackers table, and story counts. No inference. No em dashes (use colon/period).

### Selection cascade (rules in code, not model judgment)

1. Exactly one band crossed this week -> **OUTSIDE** fires.
2. Zero bands crossed AND top tracker stalled >= 2 weeks -> **STALLED** fires.
3. >= 2 zero-story trackers exist -> **BLINDSPOT** appended.
4. Nothing notable -> **QUIET** fires.

Same inputs always produce the same line. Determinism is the requirement, not a well-behaved model.

### Pre-send verification (the actual guarantee)

Before send, every numeric and categorical value in the assembled synthesis line is **re-read from source and asserted equal** to the value in the line. On any mismatch, the synthesis line is **omitted entirely** — the brief sends without it. A missing synthesis line is invisible; a wrong one is fatal. The system structurally cannot send a synthesis line whose values do not match the database at send time.

---

## WORKED EXAMPLE (this week's real data)

**Lead (Gate 2 edge — Trump nuclear shipping was the stronger C+D candidate than the dive-boat story):**

> **US opens regulatory door to nuclear commercial shipping**
> The Trump administration moved to permit nuclear-powered commercial vessels as part of a US maritime revival initiative. This is the first structural shift in US commercial propulsion policy in decades, putting flag-state strategy and newbuild financing assumptions in play for shipping operators and maritime lenders.

*(Headline: Model A, delta verb "opens". S1: actor + delta + particular. S2: consequence for named stakeholders, zero noun reuse.)*

**Synthesis line (STALLED + BLINDSPOT, zero generation):**

> 30x30 has held at ELEVATED (7.7) for 3 consecutive weeks. WTO fisheries and plastics remain unmonitored: zero sources in 90 days.

*(Every value a read. No model touched it. Pre-send check confirms 7.7 / ELEVATED / 3 / zero against live data or the line is omitted.)*

---

## THE GOVERNING PRINCIPLE

Every fix this week that relied on the model *choosing the right thing* drifted. Every fix that made the wrong thing *structurally impossible* held. This spec applies that lesson to the lead: constrained generation where the model is needed, deterministic assembly plus pre-send verification where it must be bulletproof.

---

## OUT OF SCOPE FOR v1 (deliberately deferred)

- Free-form thesis synthesis (graduate STALLED/QUIET/OUTSIDE templates to interpretive synthesis only after v1 is proven in production and the quality gate is trusted on it).
- Per-subscriber summary personalization beyond the major-threshold Model C path.
- Synthesis lines that connect stories causally ("X because Y").

These are earned later, from a position of strength, with the gate watching them.
