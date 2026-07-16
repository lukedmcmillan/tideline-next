# BRIEF-V2-SPEC.md
## Morning brief redesign: template v5, personalisation, and divergence lifecycle
*Version 1.0, July 2026. Supersedes the rendering and Quick Ask sections of BRIEF-LEAD-SPEC.md; selection logic (gates, classifier eligibility, synthesis templates) in BRIEF-LEAD-SPEC.md as patched by TIDELINE-MASTER.md 4.2 still stands. Reference mockup: morning-brief-v5.html (commit to repo at /design/morning-brief-v5.html). Where this file and the mockup disagree, the mockup wins on visuals and this file wins on logic.*

**Governing principle (TIDELINE-MASTER.md 4.1): constrained generation where a model is needed, deterministic assembly plus pre-send verification everywhere else. Every section below is explicitly marked GENERATED or ASSEMBLED.**

---

## 1. The two variants

The brief has one template with two intensity states, chosen deterministically at send time:

**VARIANT A (active day)** fires when ANY of: a lead-eligible GOVERNANCE_CHANGE story exists for the user's domains, a band crossed in the last 24h, or an active conflict changed state overnight.

**VARIANT B (quiet day)** fires otherwise. It is shorter (target 40-second read), and colour recedes to near-greyscale per Section 7.

The variant decision is code, not model judgement.

## 2. Section inventory and order

| # | Section | Variant A | Variant B | Type |
|---|---|---|---|---|
| 0 | Preheader (lead + top signal in one line) | yes | yes | ASSEMBLED from headline + top signal |
| 1 | Header (wordmark, date, read time) | yes | yes | ASSEMBLED |
| 2 | Watchlist hit-line | if hits | if hits | ASSEMBLED |
| 3 | The Lead / This Morning | lead story | "No governance change" block | GENERATED (A) / ASSEMBLED (B) |
| 4 | Synthesis strip (+ conflict heartbeat) | yes | yes | ASSEMBLED |
| 5 | Sources in Conflict card | only on state change | never (heartbeat only) | ASSEMBLED from divergences row |
| 6 | Conditions | yes | yes | ASSEMBLED |
| 7 | The Evidence / Worth Knowing | max 2 items | max 1 item | GENERATED summaries, ASSEMBLED chrome |
| 8 | What to Watch | yes | yes | ASSEMBLED from sessions table |
| 9 | Sign-off + CTAs | yes | yes | STATIC |
| 10 | Footer | yes | yes | STATIC |

**Removed: Quick Ask.** Deleted entirely. The "Reply with a question" CTA carries that function. Remove the hardcoded "Quite a week" copy from the generator (known issue, closes it).

## 3. Per-section rules

### 3.1 Watchlist hit-line (NEW)
One line under the header when any story or conflict in today's brief is linked to an entity the user tracks:
> `Today's brief touches {n} entities you track: {entity_a}, {entity_b}.`
ASSEMBLED: join today's brief items against `user_entities`. Omit entirely on zero hits. Never generated.

### 3.2 The Lead
Selection and headline per BRIEF-LEAD-SPEC.md (Gate 1/Gate 2, Model A/C headlines, category classifier eligibility). Rendering additions:
- Source line: each source named, linked, and labelled lowercase (`primary`, `industry`, `press`, `ngo`, `academic`, `government`). The primary document is linked whenever one exists, never only a writeup.
- Entity chips: tappable pills for each entity tagged to the lead story, linking to the entity page.
- Sentence 2 keeps the stakes-for-named-stakeholder rule and is written for the user's `stakeholder_type` (see Section 5). One generation per stakeholder type per day, not per user: four variants max, cached, reused across users sharing the type.

### 3.3 Synthesis strip
Templates STALLED / QUIET / OUTSIDE / BLINDSPOT per BRIEF-LEAD-SPEC.md, plus the conflict heartbeat appended when a conflict is active but unchanged:
> `1 conflict active: {headline_short}, day {n}, unresolved, score {x.x}. View`
Pre-send equality check on every value; omit line on mismatch. Fully ASSEMBLED.

### 3.4 Sources in Conflict lifecycle (the staleness fix)
The full card renders ONLY when the conflict changed state since the last brief sent to this user. States:
- DETECTED (first appearance)
- ESCALATED / DE-ESCALATED (score recalculated because either source published again; show old → new score in the header pill)
- NEW SOURCE JOINED (a third source takes a side)
- RESOLUTION APPROACHING (linked session or deadline within 7 days)
- RESOLVED (record which source's claim the outcome matched; render once)

Cap: full card max 3 appearances per conflict lifetime unless the score moves. All other days while active: heartbeat line only (3.3). No conflict active: section absent entirely, no empty state in the email (the platform page keeps its own never-empty rule per CONFLICTS-PAGE-SPEC.md; that rule does not apply to the email).

Card copy rules: "Tideline does not adjudicate which source is correct" footnote stands. Two claims in tinted panels, full wrap, no truncation. Why-this-matters line mandatory.

### 3.5 Conditions
User's tracked domains only. Row: domain name left, band pill right (`{score} · {BAND} {arrow}`). Momentum arrow from week-on-week growth rate per PULSE_SCORE_METHODOLOGY.md Section 3. Methodology link always present. Fully ASSEMBLED.

### 3.6 The Evidence
Max 2 items (Variant A) / 1 item as "Worth Knowing" (Variant B). Each item:
- Headline + 1-2 sentence summary (GENERATED, quality-gated)
- Insight panel, exactly one of:
  - `For {stakeholder}:` when the implication is factual/sourced (green tint)
  - `Tideline's read:` when it is inference; must include the honest caveat about what has not happened (amber tint)
  The GENERATED insight must declare which type it is; the renderer styles from the declared type. A missing or invalid type drops the panel, never guesses.
- Entity chips (ASSEMBLED from story entity tags)
- Source line with lowercase type + primary label (ASSEMBLED)
- Freshness marker where derivable: `new` / `developing` (story cluster previously appeared in a brief sent to this user). Requires the brief_sends log (Section 6). Omit until that ships.

### 3.7 What to Watch
Dated upcoming sessions relevant to the user's domains, nearest first, max 2 (A) / 1 (B). Day-count tile colour by proximity: ≤ 21 days amber, else green (A only; neutral on B). Copy pattern: what it is, why this week matters ("prepare now" framing). ASSEMBLED from a `sessions` reference table (create if absent: session name, body, location, start_date, tracker_tag).

### 3.8 Selection math (credibility line)
In the sign-off or the This Morning block: `{n} sources checked, {m} stories ingested, {k} met the threshold for your domains.` All three values are direct reads. ASSEMBLED.

## 4. Visual system (locked for the brief)

Light system per mockup v5:
- Page `#F6F4EF`, card `#FFFFFF`, ink `#17150F`, body `#3F3B33`, muted `#8A8478`, hairline `#F0EDE6`
- Green `#149A73` primary / `#0F7C5C` links, tint `#E7F5EF`
- Amber text `#A5711A`, tint `#FDF3E3`. Red text `#B23A22` / `#C2472F`, tint `#FBEDE9`. Neutral stone tint `#F1EFE9`
- Fonts: DM Sans body, Plus Jakarta Sans 800 headlines. Scores and dates use `font-variant-numeric: tabular-nums`. No DM Mono, no em dashes, no blue, anywhere.
- Header: flat 3px top rule. Green on Variant A, stone `#D8D3C8` on Variant B. No gradients.
- Colour scales with the day: Variant A full palette; Variant B near-greyscale, colour permitted only on the heartbeat score, links, and the single CTA.
- Email engineering: table layout, all critical styles inline, 600px container, single column under 640px, tested in Outlook/Gmail/Apple Mail before first send.

## 5. Personalisation model (one skeleton, three slots)

One template for everyone. Exactly three personalised slots:
1. **Domains** → Conditions rows, What to Watch filter, lead/evidence eligibility pool (existing user_topics mechanism)
2. **Stakeholder type** → selects the cached stakes-sentence variant and the `For {stakeholder}:` label. Values: `esg_finance`, `legal`, `compliance_shipping`, `ngo_policy`
3. **Watchlist entities** → hit-line (3.1) and freshness relevance

Nothing else varies per user. Do not add per-user generation beyond the four cached stakeholder variants.

### Onboarding changes (sign-up flow)
Extend the existing onboarding with two steps, both tappable, total under one minute:
1. **Stakeholder question (one tap):** "What best describes your work?" Four options mapping to stakeholder_type. Required.
2. **Entity picker (seeded, not blank):** after domain selection, show the 20-30 most-mentioned entities across the chosen domains as tappable chips plus a search box over the entity alias index. Skippable. Selections write to `user_entities`.
Existing users: prompt for the two missing answers via a one-time banner in the platform, and default stakeholder_type to `esg_finance` with the generic label `For your screening:` until answered. Never block the brief on missing personalisation.

## 6. Schema changes (ALL additive, ALL plan-mode)

1. `users` or profile table: `stakeholder_type text` (nullable, values above)
2. `user_entities (user_id uuid, entity_id uuid, created_at timestamptz, PRIMARY KEY (user_id, entity_id))`
3. `brief_sends (id uuid, user_id uuid, sent_at timestamptz, variant text, lead_story_id uuid, story_ids uuid[], divergence_ids uuid[], synthesis_line text, resend_message_id text)` — powers freshness markers, the recently-led exclusion, open-rate joins (priority 6), and per-user conflict state-change detection
4. `divergences`: `resolved_outcome text` (values: `source_a`, `source_b`, `mixed`, `neither`, `unresolved_expired`) and `resolved_at timestamptz` — fold into the existing B.1 migration in SCREENER-OUTPUT-SPEC.md Part B; must land before the detection cron writes row one
5. `sessions` reference table per 3.7 if it does not exist

Rules per DATA-LICENSING-DESIGN.md: additive only, no history rewrites, UTC.

## 7. Verification gates (no gate, no ship)

1. Schema: run the SELECTs, show columns and counts, state environment (production).
2. Variant selection: force both variants against production data snapshots; show the deciding values for each.
3. Conflict lifecycle: seed one divergence, simulate DETECTED → unchanged day → ESCALATED → RESOLVED across four generated briefs for one test user; show the card renders on days 1, 3, 4 and the heartbeat only on day 2.
4. Synthesis pre-send check: inject a mismatched value; confirm the line is omitted and the brief still sends.
5. Personalisation: two test users with different stakeholder_type and watchlists; show the same skeleton with different slot values, and confirm the stakes sentence was generated once per type, not per user.
6. Insight panel typing: force a generation with a missing type; confirm the panel drops rather than defaulting.
7. Render: send to a seed inbox, screenshot Gmail + Outlook + iOS Mail, check against the mockup.

## 8. Explicitly out of scope for this build

Free-form synthesis, per-user generated summaries beyond the four stakeholder variants, negative-signal ("expected but did not happen") lines beyond the existing STALLED/QUIET templates, open-rate dashboard (separate priority 6 item; brief_sends table here is its prerequisite), any platform UI for conflicts (CONFLICTS-PAGE-SPEC.md governs that separately).
