# Brief Lead Gate Redesign — Category Classifier

**Status:** Design only — no code until reviewed
**Date:** 2026-05-19 (revised)
**Replaces:** BRIEF-LEAD-SPEC.md Stage 1 (Delta Test / verb allowlist)
**Plan-mode zones affected:** `app/lib/brief/select.ts`, `app/api/cron/send-brief/route.ts`, classifier prompt
**Sequence:** Section 4 (headline coherence fix) ships first, independently ✓ DONE. Sections 1–3 ship together. Section 5 (backtest) runs before Stage 2 sign-off.

---

## Background — Why the Delta Test failed

The Delta Test (`is_delta` via verb allowlist) was designed as the structural fix for bad leads. It failed because its gate condition — `[named actor][allowed verb][object]` — is not a property of the story. It is a property of the model's phrasing of the story. The backtest proved this directly:

**"Papua New Guinea announces largest MPA in its history"** (sig:72, genuine 30x30 designation)
- Under backtest prompt → `delta_verb: "opens"` → **PASSES** (in allowlist)
- Under production prompt → `delta_verb: "announces"` → **FAILS** (not in allowlist)
- Under unconstrained diagnostic → `best_verb: "declared"` → **FAILS** (not in allowlist)

Same story. Same governance event. Three different verdicts from three prompt wordings.

**Adding more verbs is the wrong fix.** The allowlist is a finite set in an infinite phrasing space. There is no closed verb list that captures "a governance change occurred" because the phrasing is model-chosen, not content-determined. The cache made the lottery deterministic; it did not make it not a lottery.

**Root cause:** The gate keyed on a property of the model's output (verb choice), not a property of the story (its category of event).

---

## Section 1 — New gate mechanism: CATEGORY classifier

### 1.1 Categories

The classifier returns exactly one of:

| Category | Definition |
|---|---|
| `GOVERNANCE_CHANGE` | A state, international body, or treaty took a binding or formal action: designation of protected area, ratification, adoption of regulation, enforcement action, sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional authority. The formal action must be the story's PRIMARY NEWS ANGLE. |
| `ANALYSIS_OR_FINDING` | Primary event is a research publication, scientific study, data release, or expert analysis. The news is that findings were released, not that an authority acted. |
| `COMMERCIAL_BUSINESS` | Primary event is a corporate product launch, commercial deal, M&A, JV, funding round, fleet order, or vendor announcement. Actor is a private company. |
| `EXPLAINER_OR_DISCUSSION` | Primary event is a conference proceeding, expert opinion piece, background explainer, policy debate, or meeting summary. Nothing was formally decided. |
| `OTHER` | Does not fit above. |

Also returns `governance_significance` (0–100): advisory only. **Not used for gating or ordering.** See Section 3 for the architecture decision.

### 1.2 Why category is phrasing-invariant

A category classifies the TYPE OF EVENT, not the verb describing it. "Papua New Guinea designated/opened/announced/proclaimed/established an MPA" is a **government designation action** regardless of which verb the headline uses. The model is asked "what kind of event is this?" — a question with a content-determined answer — not "what verb did the actor use?" — a phrasing-determined answer.

### 1.3 Phrasing-invariance proof — actual model runs (2026-05-19)

Test: `claude-haiku-4-5-20251001`, temperature=0, three prompt variants.

| Story | Variant A | Variant B | Variant C | Stable? |
|---|---|---|---|---|
| PNG MPA (GOVERNANCE_CHANGE expected) | ✓ | ✓ | ✓ | YES 3/3 |
| Damen Flex Tugs (COMMERCIAL expected) | ✓ | ✓ | ✓ | YES 3/3 |
| Seapeak LNG (COMMERCIAL expected) | ✓ | ✓ | ✓ | YES 3/3 |
| Scotland trawling study (ANALYSIS expected) | ✓ | ✓ | ✓ | YES 3/3 |

**Category: phrasing-invariant across all test stories.**

### 1.4 Primary-angle rule — edge case resolution

**Problem identified:** Without an explicit primary-angle rule, the Mongabay BBNJ story ("Sharks and rays do not know boundaries and a new high seas treaty could help protect them") classified as `GOVERNANCE_CHANGE` 3/3 across variants — the model anchored on the treaty entity in the story rather than the science framing of the headline.

**Fix:** PRIMARY ANGLE RULE injected into the production prompt (full text in Section 1.6). The rule explicitly instructs the classifier to key on what the story's headline and opening sentence report as news TODAY.

**Prior proof (diag-category-proof-v2.ts) — INVALIDATED:**

The first three-condition proof used handcrafted test summaries and passed. This was not a production proof. The live DB `short_summary` for Mongabay BBNJ (id: `3cedc0ba-7072-437d-a005-2678b34cb82c`, pub: 2026-05-12) differs materially from the handcrafted summary:

| | Summary |
|---|---|
| **Handcrafted (tested)** | "Scientists say the newly signed BBNJ Treaty provides a framework that could protect highly migratory species like sharks and rays in international waters. Researchers analysed movement data and concluded..." |
| **Live DB (production)** | "The Biodiversity Beyond National Jurisdiction Agreement, known as the High Seas Treaty, **came into force in January 2026**, and shark scientists and conservationists meeting at Sharks International 2026 in Sri Lanka identified it as a potential turning point for migratory shark and ray conservation..." |

Root cause: the live DB summary leads with "came into force in January 2026" — a textbook GOVERNANCE_CHANGE trigger phrase. Tideline's summariser faithfully captured the article's opening, which cites the January 2026 entry-into-force as background context. The model anchors on that phrase regardless of the conference-discussion framing around it. Existing rule (v1) passed on the handcrafted summary but failed on the live DB summary (GOVERNANCE_CHANGE 3/3 in Phase 1 of the live proof).

**Rule revision (v2):** Added an explicit bullet for the "past governance event cited as context for conference/scientific discussion" pattern:

> A past governance event (treaty entered into force, regulation adopted, law signed — months or years ago) cited as historical background for what scientists, experts, or conservationists discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The governance event is context, not today's news.

**Three-condition proof — live DB summaries (diag-category-primary-angle-live.ts, 2026-05-19):**

| Phase | Rule | Condition 1 (target flips 3/3) | Condition 2 (controls survive) | Condition 3 (boundary) | Verdict |
|---|---|---|---|---|---|
| Phase 1 | Existing (v1) | ✗ FAIL — GOVERNANCE_CHANGE 3/3 | ✓ PASS | ✓ PASS | FAIL (expected) |
| Phase 2 | Revised (v2) | ✓ PASS — EXPLAINER_OR_DISCUSSION 3/3 | ✓ PASS — PNG MPA, Seapeak correct 3/3 | ✓ PASS — Boundary stays GOVERNANCE_CHANGE | **ALL PASS** |

**Status: RESOLVED.** Revised rule (v2) passes all three conditions on live production summaries. Production prompt updated in Section 1.6.

### 1.5 governance_significance score variance — documented and resolved

Variant C produced `governance_significance: 9` vs Variants A/B at 92 for PNG MPA. This confirmed the scalar score is phrasing-fragile. The 30-day quantification (Section 3) further shows gov_sig changes the lead selection on 43% of days with multiple governance stories — not just tiebreaking. **gov_sig is therefore not used for gating or ordering. See Section 3.**

### 1.6 Production prompt (final — revised rule v2, 2026-05-19)

```
You classify ocean governance news stories into exactly one category.

Categories:
- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action —
  designation of protected area, ratification, adoption of regulation, enforcement action,
  sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional
  authority (government, IGO, treaty secretariat) — not a company or research team.
  The formal action must be what the story is PRIMARILY REPORTING as news today.
- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.
  The news is that findings exist, not that an authority acted.
- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round,
  vendor announcement. Actor is a private company.
- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer,
  policy debate, meeting summary. Nothing was formally decided.
- OTHER: Does not fit above categories.

Also return governance_significance (0–100): how important is this to ocean-policy professionals,
regardless of category. Advisory only — not used for gating or ordering.

PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence
report as news TODAY — not by governance entities mentioned in background context.
- A science paper discussing a treaty as context → ANALYSIS_OR_FINDING
- Researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION
- A past government action being studied for outcomes → ANALYSIS_OR_FINDING
- A new formal designation, ratification, or decision THIS CYCLE → GOVERNANCE_CHANGE
- A past governance event (treaty entered into force, regulation adopted, law signed — months or
  years ago) cited as historical background for what scientists, experts, or conservationists
  discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The
  governance event is context, not today's news.
Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today,
not when a past formal action is stated as established fact to set context for current analysis,
discussion, or conference proceedings.

Return JSON only:
{"category": string, "governance_significance": integer, "reasoning": string (one sentence)}
```

This prompt is the production candidate. SHA-256 hash of this text = `CATEGORY_PROMPT_VERSION` cache key.

**Rule version history:**
- v1: Four bullets. Proved against handcrafted summaries (diag-category-proof-v2.ts). Failed on live DB Mongabay summary — "came into force" trigger not handled.
- v2 (current): Added fifth bullet — past governance event as historical context for conference/scientific discussion → EXPLAINER_OR_DISCUSSION. Proved against live DB summaries (diag-category-primary-angle-live.ts, 2026-05-19). Passes 3/3 on all three conditions.

---

## Section 2 — Determinism preserved

### 2.1 Cache architecture

```
Table: delta_classifications  (rename deferred: story_classifications)
Existing columns: story_id, prompt_version, is_delta, actor, delta_verb, object
New columns to add: category text, governance_significance integer
```

**Cache key:** `(story_id, prompt_version)` where `prompt_version = sha256(CATEGORY_SYSTEM_PROMPT).slice(0, 16)`.

Changing the category prompt automatically invalidates all cached classifications. Same mechanism as the Delta Test cache.

**Classification flow (unchanged):**
1. Batch-lookup `delta_classifications` for all candidate story IDs at current `prompt_version`
2. Cache hits → return stored result. Zero model calls.
3. Cache misses → Haiku at `temperature: 0` → write to DB → return result.
4. Hard assertion: 100% coverage before comparison runs.

**Run 2+ behaviour:** On any subsequent run with the same prompt version, all stories are cached. `warmCache()` returns `modelCallsMade: 0`. Category is computed exactly once per story per prompt version.

### 2.2 DB schema changes

```sql
ALTER TABLE delta_classifications
  ADD COLUMN category text,                    -- 'GOVERNANCE_CHANGE' | 'ANALYSIS_OR_FINDING' | etc.
  ADD COLUMN governance_significance integer;  -- 0-100, advisory only

-- Old columns (is_delta, actor, delta_verb, object) remain nullable.
-- New classifications populate category + governance_significance.
-- Old classifications remain readable for rollback comparison.
```

### 2.3 Type update

```typescript
// app/lib/brief/select.ts (plan only — no code yet)
export interface StoryClassification {
  category:                'GOVERNANCE_CHANGE' | 'ANALYSIS_OR_FINDING' | 'COMMERCIAL_BUSINESS' | 'EXPLAINER_OR_DISCUSSION' | 'OTHER';
  governance_significance: number;   // 0-100, advisory only — do not use for gating or ordering
}
```

---

## Section 3 — Lead selection architecture

### 3.1 Architecture decision: Q5 reversal (confirmed by 30-day quantification)

**The original draft proposed:**
```
category === 'GOVERNANCE_CHANGE'
AND governance_significance >= GOV_SIG_FLOOR (40)
```
This used the classifier's `governance_significance` as a load-bearing threshold.

**This is rejected.** The 9-vs-92 finding proved gov_sig is phrasing-fragile. The 30-day quantification now quantifies the risk:

> **Gov_sig disagrees with stories.significance_score on 3 of 7 days (43%) where multiple GOVERNANCE_CHANGE stories qualify.** On those 3 days, gov_sig would select a different lead than significance_score. This means gov_sig is not merely tiebreaking — it is actively deciding the lead on nearly half the days where the decision is contested. Given phrasing fragility of 9-vs-92 on the same story, a 43% decision rate makes gov_sig unsafe as a ranking criterion.

**The correct architecture (Q5 reversal):**

```
Gate:    category === 'GOVERNANCE_CHANGE'          (category classifier, phrasing-invariant)
Order:   stories.significance_score desc           (independently computed, phrasing-stable)
Gov_sig: advisory only — logged, never gates, never orders
```

### 3.2 30-day quantification results (2026-05-19, lukedmcmillan@gmail.com)

**Pool:** 329 stories, 27 days, topics: 30x30, bbnj, cites-marine, imo-shipping, isa, iuu, wto-fisheries + `all`

**Category distribution:**

| Category | Count | % of pool |
|---|---|---|
| COMMERCIAL_BUSINESS | 103 | 31% |
| ANALYSIS_OR_FINDING | 91 | 28% |
| GOVERNANCE_CHANGE | 59 | 18% |
| EXPLAINER_OR_DISCUSSION | 43 | 13% |
| OTHER | 32 | 10% |

**GOVERNANCE_CHANGE stories.significance_score distribution:**

| Band | Count | % of GC stories |
|---|---|---|
| sig >= 70 | 1 | 2% |
| sig 50–69 | 15 | 25% |
| sig 40–49 | 10 | 17% |
| sig 35–39 | 6 | 10% |
| sig 20–34 | 7 | 12% |
| sig  0–19 | 20 | 34% |

- GOVERNANCE_CHANGE at sig>=35: **32 of 59 (54%)**
- GOVERNANCE_CHANGE at sig>=50: **16 of 59 (27%)**

**Gov_sig vs significance_score rank comparison (when it matters):**

Days with >=2 GOVERNANCE_CHANGE stories above sig=35: **7**
- Rank AGREES (both pick same lead): 4 (57%)
- Rank DISAGREES (gov_sig picks different lead): **3 (43%)**

Disagreement examples:
1. **May 8**: sig_score picks Fisheries Minister budget (sig:45, gov_sig:62); gov_sig picks $957.8M investment announcement (sig:42, gov_sig:72)
2. **May 4**: sig_score picks Iceland whale hunting resumption (sig:68, gov_sig:72); gov_sig picks Ghana marine reserve declaration (sig:65, gov_sig:78)
3. **Apr 30**: sig_score picks OSPAR expansion (sig:62, gov_sig:78); gov_sig picks UK-Norway fisheries bilateral (sig:35, gov_sig:78) — tied gov_sig, sort instability

**Conclusion:** Gov_sig is not merely tiebreaking. It changes the lead on 43% of contested days. Given phrasing fragility of 9-vs-92, this dependence rate is unacceptable. The Q5 reversal (use significance_score) is confirmed.

**Daily lead selection under category + significance_score (sig>=35 floor):**

| Day | Result | Lead story |
|---|---|---|
| 2026-05-18 | THE SIGNAL | (no stories in pool) |
| 2026-05-17 | THE SIGNAL | (no stories in pool) |
| **2026-05-15** | **THE LEAD** | **Papua New Guinea announces largest MPA in its history** (sig:72, gov_sig:85) ✓ |
| 2026-05-14 | THE SIGNAL | Top: Scotland trawling study ANALYSIS_OR_FINDING (correct — scientific post-hoc study, not GC) |
| 2026-05-13 | THE LEAD | China shark conservation (sig:52) |
| 2026-05-12 | THE LEAD | Sharks and rays BBNJ story (sig:68) — GOVERNANCE_CHANGE in live DB (primary-angle rule handles test case but live summary differs; see §1.4) |
| 2026-05-11 | THE SIGNAL | Top: Ocean philanthropy ANALYSIS (correct) |
| 2026-05-10 | THE SIGNAL | (no stories) |
| 2026-05-09 | THE SIGNAL | Top: Ocean climate explainer ANALYSIS (correct) |
| 2026-05-08 | THE LEAD | Fisheries Minister Thompson budget (sig:45) |
| 2026-05-07 | THE LEAD | Trump nuclear shipping initiative (sig:45) |
| 2026-05-06 | THE SIGNAL | Top: IMO carbon — EXPLAINER (correct — nothing formally decided) |
| 2026-05-05 | THE LEAD | Whale shark satellite study (sig:68) |
| 2026-05-04 | THE LEAD | Iceland whale hunting resumption (sig:68) |
| 2026-05-03 | THE LEAD | Swedish Coast Guard seizes tanker (sig:68) |
| 2026-05-02 | THE LEAD | IMO ship emissions progress (sig:62) |
| 2026-05-01 | THE LEAD | IMO climate talks survive US challenge (sig:68) |
| 2026-04-30 | THE LEAD | OSPAR BBNJ expansion (sig:62) |
| 2026-04-27 | THE LEAD | Fish/mollusc farm authorisation (sig:35) — low-sig governance story; floor review needed |
| 2026-04-26 | THE LEAD | US Navy Iranian vessel intercept (sig:42) |
| 2026-04-25 | THE SIGNAL | Top: SIDS explainer — EXPLAINER_OR_DISCUSSION (correct) |
| 2026-04-24 | THE LEAD | US House FISH Act advance (sig:58) |
| 2026-04-23 | THE LEAD | Chile 10% ocean protection plan (sig:68) |
| 2026-04-22 | THE LEAD | Bluefin tuna catch/release regulation (sig:35) |
| 2026-04-21 | THE LEAD | US Forces board sanctioned tanker (sig:45) |
| 2026-04-20 | THE LEAD | Sussex waters trawling ban (sig:68) |
| 2026-04-19 | THE SIGNAL | Top: Atlantic current ANALYSIS (correct — two-decade trend study, not GC) |

**Summary:**
- Category-gate lead rate: **18/27 days (67%)**
- Signal (fallback) rate: **9/27 days (33%)**
- Delta Test fallback rate (prior backtest): 33%
- Fallback rate is identical — category gate selects on different days (correct governance events), not fewer days

**Commercial story gate:** 9 COMMERCIAL_BUSINESS stories appeared at sig>=35. Zero were leads. The category gate correctly excluded all of them.

### 3.3 THE LEAD slot — GOVERNANCE_CHANGE

**Eligibility:**
```
category === 'GOVERNANCE_CHANGE'
AND stories.significance_score >= SIG_FLOOR   (proposed: 35, same as current Delta Test floor)
AND story.short_summary is not null
AND story.id not in recentlyLedIds
```

**Ranking:** `stories.significance_score` descending; source ubiquity as tiebreaker (lower ubiquity = edge signal, as per current Gate 2).

**Gate 1 priority boost preserved:** A story with sig>=70 AND tracker ELEVATED/crossing ranks first regardless of ubiquity, as long as it is `GOVERNANCE_CHANGE`. If sig>=70 but not GOVERNANCE_CHANGE, the Gate 1 boost does not apply.

**Rendering (Mode A — story-led):**
```
HEADLINE: [Stage 2 generated headline — see Section 4]
BODY:      story.short_summary
GATE:      'category_lead'
```

### 3.4 THE SIGNAL slot — fallback

THE SIGNAL renders when no GOVERNANCE_CHANGE story clears sig>=35 for the subscriber's topics.

Rendering options (all four modes from prior Section 4 coherence fix are preserved):

| Case | What renders |
|---|---|
| Tracker ELEVATED (>=5.0) + story (any category) with sig>=35 + topic maps to tracker | **Mode S1:** `"[Tracker] at Pulse X.X — [story headline]."` |
| Tracker ELEVATED but no qualifying story, OR topic mismatch | **Mode S2:** Pure state: `"[Tracker] at Pulse X.X."` with interpretation |
| Story sig>=35 (any category) but no ELEVATED tracker | **Mode S3:** Story-led: `"[story headline]"` |
| Nothing qualifies | **Mode S4:** `"Quiet morning across your tracked domains."` |

The coherence rule from Section 4 (shipped) applies to THE SIGNAL: Mode S1 fires only if `topicMapsToTracker(topStory.topic, topTracker.tracker_slug)` returns true.

### 3.5 Quiet-day behavior — explicit specification

**Trigger condition:** No GOVERNANCE_CHANGE story clears `stories.significance_score >= SIG_FLOOR` for the subscriber's topics on a given day.

**What this looks like in data:** The day has GOVERNANCE_CHANGE stories, but all are below sig=35 (procedural regulatory entries, routine administrative actions, minor committee decisions). Or the day has zero GOVERNANCE_CHANGE stories at all.

**What renders:**

```
THE LEAD slot: does not render.
THE SIGNAL slot: renders the highest-sig story from ANY category that clears sig >= 35.
```

The signal slot carries the day's most significant ocean intelligence — whether that is an analysis finding, a scientific study, a governance discussion, or a tracker state — with honest framing that does not overstate its news type.

**Framing rule for THE SIGNAL on quiet-governance days:** The slot must NOT frame an ANALYSIS_OR_FINDING as if it were a governance action. A study's results are results, not a ruling. If the signal slot carries a science story, the headline is the story's own headline (or cleanTitle), not a governance-asserting construction.

**Why THE SIGNAL is mandatory (not "no brief today"):** The 30-day pool shows 9 of 27 days (33%) as signal days. These are not genuinely empty news days — they have high-sig ocean stories that warrant delivery. The dual-track architecture exists precisely so subscribers receive valuable intelligence on quiet-governance days, not a missed brief.

**Quiet-governance-day THE SIGNAL examples from live pool:**

| Date | Signal story | Category | sig | Why correct |
|---|---|---|---|---|
| May 14 | Scotland trawling study | ANALYSIS_OR_FINDING | 45 | Scientific finding, correctly not a GC |
| May 11 | Ocean philanthropy study | ANALYSIS_OR_FINDING | — | Correctly not a GC |
| May 9 | Ocean climate explainer | ANALYSIS_OR_FINDING | — | Discussion, not a ruling |
| Apr 25 | SIDS explainer | EXPLAINER_OR_DISCUSSION | — | Conference proceedings, not a GC |

**What is NOT acceptable on a quiet-governance day:** Sending a brief that leads with a COMMERCIAL_BUSINESS story (a fleet order, a product announcement) framed as if it were the day's primary ocean intelligence. The category gate prevents this — commercial stories cannot become THE LEAD. THE SIGNAL slot should be the tracker-state fallback or the highest-sig non-commercial story, not a commercial item.

**Low-sig GOVERNANCE_CHANGE on quiet days:** If the day's GOVERNANCE_CHANGE stories are all below sig floor (e.g., two procedural fisheries administrative entries at sig:20), THE LEAD does not fire. THE SIGNAL carries the day's best qualifying story. The low-sig governance stories appear in THE WHAT TO WATCH section at most, not as THE LEAD. This is the correct behavior — subscribers should not receive a governance-branded lead about a minor administrative entry just because it is the only governance item available.

### 3.6 Quality concerns from live pool — open items for backtest

The 30-day quantification identified classification quality concerns that require review in the full backtest before shipping:

1. **Mongabay BBNJ (May 12):** ~~Still classified GOVERNANCE_CHANGE in live pool.~~ **RESOLVED** — live-summary proof (2026-05-19) confirmed the revised rule (v2) correctly classifies the live DB summary as EXPLAINER_OR_DISCUSSION 3/3. When the full backtest re-runs with the v2 prompt, the May 12 slot should switch from GOVERNANCE_CHANGE → EXPLAINER_OR_DISCUSSION, and the day's lead (if any) will be determined by the next highest-sig GOVERNANCE_CHANGE story in the pool.

2. **Low-sig GOVERNANCE_CHANGE leads (Apr 27, Apr 22):** "Fish/mollusc farm authorisation" (sig:35) and "Bluefin tuna catch/release regulation" (sig:35) appear as leads on quiet days. These are technically governance changes but may be too procedural for the lead slot. Consider whether sig>=40 is a better floor for the lead slot.

3. **Signal days with high-sig non-governance stories:** On May 14, a high-quality ANALYSIS story (Scotland trawling ban study, sig:45) is correctly excluded from THE LEAD and routes to THE SIGNAL. This is informationally correct.

---

## Section 4 — Headline generation: Stage 2 redesign (SPECIFICATION REQUIRED)

### 4.1 Status of Stage 2 after Delta Test abandonment

The current Stage 2 headline generation uses `deltaClassification.actor / delta_verb / object` from the Haiku delta classification. Under the category gate, there is no verb triple — the category classifier returns `category`, `governance_significance`, and `reasoning`, not a structured triple.

**Stage 2's entire Model A/B/C mechanism keyed on the verb triple.** With no verb triple, Model A (structured headline: "[Actor] [verb] [object]") and Model C (tracker-anchored) cannot fire in their current form. This is not deferrable to "Stage C" — it must be specified now so code is not written against an obsolete interface.

### 4.2 The failure mode being prevented

The production brief that triggered this redesign contained: **"30x30 at Pulse 7.1. Damen Fuel Flexible Tugs product guidance announcement."**

This was a science-magazine/PR style headline — tracker assertion + commercial title — produced by the fallback path's incoherent concatenation. That specific failure is now fixed by the Section 4 coherence patch (shipped). But Stage 2 has its own headline generation path that could produce similarly incoherent headlines if not constrained.

**The structural constraint that makes bad headlines impossible is: gate on category, then generate from story + category.**

- A `COMMERCIAL_BUSINESS` story cannot reach Stage 2 headline generation (it fails the category gate and never becomes THE LEAD)
- An `ANALYSIS_OR_FINDING` story cannot become THE LEAD (same)
- Only `GOVERNANCE_CHANGE` stories enter Stage 2

This makes the science-magazine headline structurally impossible — not by filtering verbs, but by preventing non-governance stories from reaching the headline generation step at all.

### 4.3 Stage 2 specification — category-constrained headline generation

**Input:** The winning `GOVERNANCE_CHANGE` story: `{ title, short_summary, topic, significance_score, category }`

**Output:** A single headline string.

**Model A — structured governance headline:**

```
Prompt context:
  category: GOVERNANCE_CHANGE
  reasoning: [classifier's one-sentence reasoning from classification]
  story title: [cleanTitle(story.title)]
  story summary: [story.short_summary]

Task:
  Generate a concise, factual headline (max 12 words) for a professional ocean policy audience.
  The headline should capture the specific governance action: who did what.
  Format: "[Actor] [formal action verb] [object]"
  Use verbs appropriate to the specific action: designates, ratifies, establishes, adopts, bans,
  imposes, mandates, approves, launches, advances, files, suspends, etc.
  Do not use aspirational language ("aims to", "seeks to", "could", "plans to").
  Do not use tracker or velocity language ("at Pulse", "ELEVATED", "Pulse X.X").

Output: plain string, no JSON, no markdown.
```

**Model B — fallback (story title, no Haiku call):**

If Model A is not implemented at Stage 2 (the category gate ships before the full Stage 2 redesign):

```typescript
// Immediate fallback (pre-Stage 2 redesign):
headline = cleanTitle(story.title)
```

This is acceptable as a ship-now fallback. cleanTitle already strips source attributions. The headline won't be optimally structured, but it will be accurate and always reflect the governance story's actual content.

**Model C — tracker-anchored headline:**

Model C previously generated: `"[Tracker] at Pulse X.X — [structured delta verb triple]"`

Under the category gate, Model C fires only when Gate 1 is active (sig>=70, tracker ELEVATED/crossing) AND the story's topic maps to that tracker (coherence check from shipped Section 4 fix).

Model C becomes:
```
"[Tracker] leads. [cleanTitle(story.title)]."
```

Or optionally Model A output:
```
"[Tracker]: [Model A structured headline]"
```

The key constraint: tracker label appears only if `topicMapsToTracker(story.topic, trackerSlug)`. This is already enforced by the shipped coherence patch.

### 4.4 What changes vs current Stage 2

| Element | Before (Delta Test) | After (Category Gate) |
|---|---|---|
| Gate input | `is_delta + delta_verb` | `category === 'GOVERNANCE_CHANGE'` |
| Model A trigger | `is_delta === true` | `category === 'GOVERNANCE_CHANGE'` (all leads) |
| Model A structure | `[actor] [delta_verb] [object]` from triple | `[who] [did what]` from story + reasoning |
| Model A verb source | Model-returned delta_verb (allowlisted) | Free-form appropriate verb from new Haiku call |
| Model C trigger | Gate 1 + is_delta | Gate 1 + GOVERNANCE_CHANGE + topic maps to tracker |
| Science-magazine headline prevention | Verb allowlist (brittle) | Category gate (structural — non-GC never reaches Stage 2) |
| Non-governance leads | Via fallback (incoherent) | THE SIGNAL path (coherent) |

### 4.5 Implementation sequence for Stage 2

1. **Now:** Category gate ships. Model B fallback (cleanTitle) used for all headlines.
2. **Stage 2A:** Model A Haiku call added: generates structured governance headline from story + category + reasoning.
3. **Stage 2B:** Model C updated: tracker-anchored only when Gate 1 + category + topic alignment.
4. **Stage 2C:** Full brief framing — THE LEAD vs THE SIGNAL visual distinction.

**Stage 2A is the first implementation priority after the category gate ships and the backtest passes.**

---

## Section 5 — Category-gate backtest (required before Stage 2 sign-off)

### 5.1 Required output

**(a) PNG MPA verdict:** Must confirm category=`GOVERNANCE_CHANGE` and lead on 2026-05-15.
**Status: CONFIRMED by 30-day quantification (sig:72, gov_sig:85, leads on May 15). ✓**

**(b) Day-by-day THE LEAD and THE SIGNAL:** Full 30-day table with old vs new comparison.
**Status: Produced in Section 3.2 above.**

**(c) Fallback rate:** Days where no GOVERNANCE_CHANGE story clears sig>=35.
**Status: 33% (9/27 days). Same as Delta Test rate. Different days — correct governance events are now selected.**

**(d) Phrasing-invariance proof (revised rule v2, live DB summaries):**
- PNG MPA: GOVERNANCE_CHANGE 3/3 ✓
- Seapeak: COMMERCIAL_BUSINESS 3/3 ✓
- Scotland study: ANALYSIS_OR_FINDING 3/3 ✓ (handcrafted, not in DB — advisory)
- Damen: COMMERCIAL_BUSINESS 3/3 ✓ (handcrafted, not in DB — advisory)
- Mongabay BBNJ: EXPLAINER_OR_DISCUSSION 3/3 ✓ (live DB summary, revised rule)
- Boundary (synthetic): GOVERNANCE_CHANGE 3/3 ✓
**Status: RESOLVED — live-summary proof confirms revised rule v2. See §1.4.**

**(e) Commercial story admission:** Zero COMMERCIAL_BUSINESS stories as THE LEAD.
**Status: CONFIRMED — 9 commercial stories at sig>=35, zero in leads. ✓**

### 5.2 Pass criteria for Stage 2 sign-off

All five must pass before Stage 2 implementation begins:

| Criterion | Status | Notes |
|---|---|---|
| 1. PNG MPA leads on 2026-05-15 | **✓ PASS** | sig:72, GOVERNANCE_CHANGE, leads correctly |
| 2. Fallback rate <= 33% | **✓ PASS** | 33% (same as Delta Test, different days) |
| 3. Zero COMMERCIAL_BUSINESS leads | **✓ PASS** | 9 commercial stories excluded at sig>=35 |
| 4. Phrasing-invariance 3/3 | **✓ PASS** | Live-summary proof confirmed (revised rule v2) |
| 5. `npm run build` passes after Section 4 fix | **✓ PASS** | Shipped. 51 tests pass. |

**All five criteria confirmed.** One open quality item for review before code:
- Low-sig GOVERNANCE_CHANGE leads on quiet days (§3.6 item 2) — consider sig floor of 40

---

## Section 6 — Implementation sequence

| Step | What | Scope | Gate |
|---|---|---|---|
| **A** | Section 4: headline coherence fix | `select.ts` only | **DONE ✓** 51 tests pass, build clean |
| **B** | DB schema: ADD COLUMN category, governance_significance | Migration only | Applied after design reviewed |
| **C** | Category classifier: Haiku classification in `send-brief`, cache in `delta_classifications` | `send-brief/route.ts`, type update in `select.ts` | Backtest passed |
| **D** | `selectLead()` gate: replace `is_delta` with `category === 'GOVERNANCE_CHANGE'` | `select.ts` | Design reviewed + backtest passed |
| **E** | Stage 2A: Model A Haiku headline from story + category + reasoning | `send-brief/route.ts` | Category gate stable in production 1+ week |

Steps B–D ship together (the "gate redesign"). Stage E ships after gate is stable.

---

## What is NOT changing

- Temperature: 0 (mandatory for gate calls)
- Permanent per-story cache in `delta_classifications` (rename to `story_classifications` deferred)
- Cache-key structure: `(story_id, prompt_version)`
- `readCacheOnly()` + hard-assertion coverage check
- `selectEvidence()`, `selectConditions()`, `selectWhatToWatch()`, `selectAcrossSector()` — unchanged
- Source ubiquity ranking as tiebreaker within the eligible pool
- `recently_led` exclusion (7-day window)
- Gate 1 (sig>=70 + tracker ELEVATED/crossing) — preserved as priority boost within GOVERNANCE_CHANGE pool

---

## Open items for review

1. **SIG_FLOOR value:** Proposed 35 (same as current Delta Test floor). Two low-sig leads appeared on quiet days (sig:35). Consider 40. Tradeoff: higher floor = more signal days on genuinely quiet governance days. The Apr 27 "Fish/mollusc farm authorisation" at sig:35 is a routine regulatory entry — may not warrant THE LEAD slot.

2. ~~**Mongabay BBNJ live classification.**~~ **RESOLVED** — revised rule v2 correctly classifies live DB summary as EXPLAINER_OR_DISCUSSION 3/3. See §1.4.

3. **Table rename:** `delta_classifications` → `story_classifications`. Cosmetic. Defer until after one stable week.

4. **Stage 2A timeline:** Model A headline Haiku call must be specified before Step E begins. §4.3 provides the specification.
