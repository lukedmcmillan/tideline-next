# TIDELINE MASTER FILE
## Single source of truth for context, state, discipline, and strategy
*Version 2.0, July 2026. Supersedes TIDELINE-CONTEXT.md entirely. Patches and consolidates PULSE_SCORE_METHODOLOGY.md, DIVERGENCE_DETECTION_SPEC.md, CONFLICTS-PAGE-SPEC.md, SUPERCLAUDE-COMMANDS.md, CLAUDE-RULES.md, BRIEF-LEAD-SPEC.md. Where this file conflicts with any of those, this file wins. Deep implementation detail stays in the referenced spec files; this file corrects their known errors.*

*Update this file at the end of every significant build session. A stale master file has repeatedly caused wasted sessions. If build state in this file has not been confirmed against production in the current session, confirm with Luke before acting on it.*

---

# PART 1: WHAT TIDELINE IS AND WHERE IT IS GOING

## 1.1 The product

Tideline is a professional ocean governance intelligence subscription platform at thetideline.co. It aggregates regulatory intelligence, treaty developments, blue finance activity, and enforcement actions for professionals who need to stay ahead of the ocean sector.

**Positioning line:** "Most professionals in this sector have six tabs open right now. Tideline is one."

**The differentiator (validated, locked):** conflict and contradiction detection. "Most intelligence tools tell you what was said. Tideline tells you when two authoritative sources are saying different things about the same event." Validated by a former RepRisk employee and confirmed as the single most-valued feature across 37 survey respondents.

**What Tideline is not:** a news aggregator, a chatbot, an academic database.

**The psychological test for every feature:** does this help someone avoid thinking while still looking smart? Tideline sells confidence, cover, and plausible competence.

## 1.2 The 10-year outcome: £5m exit

Target: a sale in the region of £5m within 10 years. The mechanism matters more than the number.

**The valuation fork: data infrastructure vs media property.**
- A subscription media property (newsletters, dashboards, human-readable briefs) sells at roughly 2 to 4x revenue.
- Data infrastructure (API access, data licensing, integration into buyers' risk and compliance workflows) sells at 6 to 10x revenue or better, because the buyer acquires a data asset and switching costs, not an audience.

**The single most important structural milestone for exit value: at least one API or data licensing contract signed by Year 5.** Everything in the product roadmap that moves Tideline toward machine-readable, licensable data (entity system, divergence scores, Pulse time series, risk screener output) compounds toward the higher multiple. Everything that is purely editorial does not.

**Roadmap to £5m, in phases:**
1. **2026: Foundation.** Explorer programme, September GO/HOLD/STOP, sales conversations from Month 2 of the plan.
2. **Jan 2027: Launch as a ramp, not an event.** Founding cohort converts, corporate pipeline already warm.
3. **2027-2028: £300k ARR** at 18-24 months post-launch, driven by team and corporate tiers. Individual subscriptions alone cannot carry this; survey willingness clusters well below what individual revenue could support.
4. **2029-2031: First data licensing or API contract.** Risk screener output comparable to RepRisk/Refinitiv formats is the wedge. This is the valuation event, not the launch.
5. **2032-2036: Scale licensing, become the reference dataset for ocean governance risk.** Acquirers: ESG data majors (MSCI, Morningstar/Sustainalytics, LSEG/Refinitiv, RepRisk), maritime intelligence (Lloyd's List, Kpler, Windward), or legal intelligence platforms.

**Decision filter for every new feature or tool: does this advance a specific line item on the current priority list, and does it move toward licensable data or away from it?** Model choice is not the bottleneck; execution is.

## 1.3 Milestones and governance

- **September 2026: GO/HOLD/STOP decision point** with explicit criteria. This governs whether the current plan continues or pivots.
- **January 2027: public launch.** Governed by the principle that launch is a ramp. Sales conversations begin in Month 2 of the plan, not at launch.
- **£300k ARR: an 18-24 month post-launch outcome**, not a launch-year target.

## 1.4 ICP (reframed mid-research; this ordering is current)

Primary, in priority order:
1. **ESG analysts and sustainable finance teams** (institutional investors, blue bond desks, debt-for-nature funds). Budget, compliance driver, underserved.
2. **Marine lawyers and general counsel** at maritime firms. Need cited regulatory briefs; pay from firm budgets.
3. **Shipping and maritime compliance teams.** IMO, emissions, port state control.
4. **Conservation NGOs.** Still served, no longer the primary target. This is a deliberate reframe from the original NGO-first positioning.

One team subscription is worth roughly seven individual subscribers. Highest-value buyers: compliance teams at shipping companies, GCs at maritime firms, ESG analysts at institutional investors.

## 1.5 Pricing (locked, do not revisit)

| Tier | Price |
|---|---|
| Founding Member | £39/month, locked for life |
| Individual | £99/month, 14-day free trial |
| Team | £699/month, 10 seats |
| Corporate (in development) | £500+/month per seat equivalent; unlocked by LP briefing PDF and risk screener output |

Path to £300k ARR: team and corporate tier mix plus potential data licensing. Not individuals alone.

## 1.6 Research base (current)

- **Two waves, 37 respondents** (supersedes the old "15 respondents" figure everywhere).
- **Contradiction detection: single most-valued feature.** Story evolution tracking: most-named pain point.
- Four features high-value respondents independently specified: story/regulation timeline view, commitment tracker, contact directory, risk screener output (RepRisk/Refinitiv-comparable).

## 1.7 Pipeline and Explorer programme

**Named pipeline:** Yiannis Bartzilas (ESG, Muzinich), Jonny Hardaker (formerly RepRisk, validated the divergence differentiator), Titia Sjenitzer (Blue Bond Accelerator; has offered a proprietary data partnership), Jane Eva Collins (Commonwealth Secretariat), Malia Rouillon, Brett Jacobs. Corporate targets: Katapult, Aqua-Spark, Ocean 14, Builders Vision.

**Explorer programme:** 8-12 testers, full access in exchange for weekly feedback; six months free Individual access post-launch and founding rate locked for life. Three email templates drafted. Two priority leads from Wave 2 (one tracking ISA/flag states/investment funds; one tracking Portuguese and Azorean government entities; note the typo flagged in the second lead's survey email address before sending).

---

# PART 2: CURRENT BUILD STATE

*This section is the corrected replacement for the "what is built" and "priorities" sections of the old context file, which were wrong about multiple major components. Confirm against production before acting.*

## 2.1 Shipped and live

- **Morning brief** with quality gate. Story eligibility uses the **category classifier** (GOVERNANCE_CHANGE / ANALYSIS_OR_FINDING / COMMERCIAL_BUSINESS / EXPLAINER_OR_DISCUSSION / OTHER). This **replaced the verb-allowlist Delta Test** in BRIEF-LEAD-SPEC.md; that section of the spec is superseded, though its governing principle stands (see 4.1).
- **Threshold alerts** and onboarding flow.
- **Entity system:** ~930 entities with alias search (GIN-indexed `aliases text[]`).
- **11 regulatory trackers** including Blue Carbon & Biodiversity Credits (11th, Type 6 multiplier 0.80, deployed in calibrating state).
- **Document library:** ~7,700 documents, 368,000+ embedded chunks at 98.5% coverage, **768-dimension Jina embeddings (jina-embeddings-v2-base-en)**.
- **Ask Tideline RAG:** `lib/research.ts` built with the reliability triad; `match_document_chunks_filtered` RPC and `research_queries` table migrations live. RESEARCH-RAG-SPEC.md is the engineering source of truth; ASK-TIDELINE-BUILD-GUIDE.md is the operator runbook.
- **Word processor** on TipTap. Phase 1 fixes shipped: content persistence, UUID routing, Sources card, Regenerate wiring, .docx export, design system corrections.
- **InforMEA OData scraper:** run, 111 IWC decisions ingested.
- FAOLEX bulk import partially in progress (30,578 records total, phased).
- Live feed from 89+ RSS sources, quality-gated; nightly scraper agents (ISA, DOALOS, OSPAR, IMO, CBD, FAO, IWC, InforMEA); Stripe; magic link auth; workspace with 5 project types; platform shell; landing page.

## 2.2 Active blockers (manual action required before next Claude Code session)

1. **Exposed database credential:** password reset plus Vercel environment variable update.
2. **Supabase project restart** to clear pooler authentication failures.
3. **HNSW vector index not yet built.** This gates the entire RAG four-case behavioural verification sequence, which gates Step 4 API endpoints, which gates the Phase 3 React component.

## 2.3 Priority order (current; replaces the old file's list)

1. HNSW index build → four-case RAG verification → Step 4 API endpoints → Phase 3 React component
2. Ask Tideline Phase 3 completion; Fable 5 routing once access stabilises (selective tool for highest-complexity sessions, not a blocker)
3. Active project watcher
4. Trust architecture and divergence detection Phase 1
5. FAOLEX completion (phased)
6. Open-rate instrumentation and lifecycle emails (open rate IS the retention metric)
7. LP briefing PDF (this is a corporate product, not a nice-to-have)
8. Landing page rebuild
9. Query limits implementation
10. Sales conversations from Month 2 (calendar item, not a build item)

## 2.4 Known outstanding issues

- Quick Ask hardcoded copy ("Quite a week" runs regardless of activity)
- WHAT TO WATCH duplication (same meeting twice in brief)
- Classifier false-positive audit needed on GOVERNANCE_CHANGE
- `topic='all'` exclusion from fallback lead pool
- Cron liveness audit across all pipeline components
- Tags vs Tracked Entities unification: project dashboard reads legacy `topic_tags` instead of `project_entities` / `project_auto_entries`

## 2.5 Deprioritised / parked

- **Mobile app (Expo monorepo):** scaffolded, stalled. Not on the current priority list. Do not resume without an explicit decision; it fails the licensable-data filter.
- LangFuse, LiteLLM, Bifrost, ChangeDetection.io, PostHog: researched, not integrated. Apply the decision filter (1.2) before adopting any. PostHog is the strongest candidate once retention data matters (post-Explorer cohort); the gateways are premature.
- Obsidian second-brain: vault exists at `C:\Users\luke.mcmillan\tideline-brain` but is secondary; the real knowledge base is Supabase.

---

# PART 3: TECH STACK AND DESIGN SYSTEM

## 3.1 Stack (corrected)

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | **Jina jina-embeddings-v2-base-en, 768 dimensions** |
| Hosting | Vercel |
| Payments | Stripe |
| Email | Resend |
| Scraping | Firecrawl, Jina, custom TypeScript scrapers |
| Automation | GitHub Actions and Vercel cron |
| AI | Anthropic Claude (Haiku for classification/extraction; Opus 4.8 for Claude Code sessions; Fable 5 reserved for highest-complexity sessions once access stabilises) |
| Adversarial review | GPT-5 via ChatGPT (spec review, long-context analysis, prompt drafting) |
| Research-only agent | Manus (bulk analysis, competitive intel, scraper recon; never repo or database access) |

**CRITICAL CORRECTION: any old instruction referencing OpenAI text-embedding-3-small or a vector(1536) column is wrong and dangerous.** The corpus is 768-d Jina. Running a 1536-d backfill would corrupt the embedding space. The `/sc:task` embedding prompt in SUPERCLAUDE-COMMANDS.md must never be pasted as written.

Environment: PowerShell on Windows. Repo at `C:\Users\luke.mcmillan\tideline-next`.

## 3.2 Design system

**Superseded.** The dark navy palette (`#0B1628`) is retired. The canonical product design system is now **UI-SYSTEM.md** (repo root, July 2026). Reference implementations: the nine locked mockups in `public/demo/`. Canvas is `#F4F6F8` (light grey), cards are white, colour encodes state per UI-SYSTEM.md Section 3. DM Mono ban confirmed and resolved: all numerals use `font-variant-numeric: tabular-nums` on DM Sans / Plus Jakarta Sans.

**Copy rules (unchanged):** no em dashes in any copy. Never "Tideline's agents"; say "overnight" or "while you were sleeping". Replies and outreach must not sound AI-generated or over-structured. LinkedIn messages short and direct.

---

# PART 4: PRODUCT SPECS, CONSOLIDATED AND PATCHED

## 4.1 The governing engineering principle (promoted from BRIEF-LEAD-SPEC.md to the whole platform)

**Every fix that relied on the model choosing the right thing drifted. Every fix that made the wrong thing structurally impossible held.** Constrained generation where a model is needed; deterministic assembly plus pre-send verification where it must be bulletproof. Apply this to every generation surface: brief, synthesis line, divergence scoring, Ask Tideline answers, alert copy.

## 4.2 Morning brief (BRIEF-LEAD-SPEC.md, patched)

Everything in BRIEF-LEAD-SPEC.md stands **except** the Delta Test verb allowlist, which is superseded by the category classifier. Corrected selection logic:

- **Eligibility:** story classified GOVERNANCE_CHANGE by the category classifier (quality-gated). ANALYSIS_OR_FINDING, COMMERCIAL_BUSINESS, EXPLAINER_OR_DISCUSSION, OTHER are not lead-eligible.
- Gate 1 (major threshold: significance ≥ 70 AND tracker at ELEVATED+, or band crossing in last 7 days) and Gate 2 (edge: least likely to be already known) stand as written.
- Headline models A and C, two-sentence summary with the anti-repetition rule, recently-led exclusion: all stand.
- Synthesis line: zero-generation templated assembly (STALLED / QUIET / OUTSIDE / BLINDSPOT) with pre-send equality check, omit on mismatch. Stands as written; this is the canonical example of 4.1.
- Divergence integration: conflicts scored ≥ 6.0 in the last 24h appear as a brief line.

**Needed additions to this spec:** classifier false-positive audit on GOVERNANCE_CHANGE (open issue), WHAT TO WATCH dedupe, removal of hardcoded Quick Ask copy, open-rate instrumentation (the retention metric has no dashboard yet).

## 4.3 Pulse Score (PULSE_SCORE_METHODOLOGY.md v1.1, patched)

The four-component architecture (A 35% volume trend, B 30% recency, C 20% decision signal, D 15% institutional risk modifier), bands, preparation horizons, honest hit rates, and three structural failure modes stand. It is one of the strongest assets in the file set: publishable, defensible, and a data-licensing artifact in its own right.

**Required updates:**
1. **11 trackers, not 10.** Add Blue Carbon & Biodiversity Credits.
2. **The institutional type table is out of date.** The Blue Carbon tracker uses a Type 6 multiplier of 0.80, which does not exist in the published four-type table (1.0 / 0.85 / 0.70 / 0.55). Publish the extended type taxonomy or the public methodology contradicts the live product. This matters because the methodology page is a trust artifact for expert users.
3. Component C keyword matching should migrate to the category classifier over time (same fragility class as the old verb allowlist; apply 4.1).
4. Roadmap items to keep visible: Actor Anomaly component (addresses the Nauru-type miss), Transaction Proximity Indicator, source diversity, non-English source gap.

## 4.4 Divergence detection and Conflicts page (two specs merged)

DIVERGENCE_DETECTION_SPEC.md and CONFLICTS-PAGE-SPEC.md overlap ~70%. CONFLICTS-PAGE-SPEC.md is the more complete build plan; treat it as canonical and retire the other after folding in these resolutions:

- **Schema: use the CONFLICTS-PAGE version** (with `story_id_a`/`story_id_b` references, `source_a_type`/`source_b_type`, `dismissed_at`). The other spec's `resolved_at`/`is_active` variant is dropped. Keep the partial index on active rows.
- Detection: 72h window, same tracker_tag, different source org; Haiku scoring across four dimensions; composite = factual 0.40 + conclusion 0.30 + framing 0.20 + authority 0.10; insert gate at composite ≥ 5.0 with non-empty `why_it_matters` and pair dedupe; auto-dismiss at 14 days. All stands.
- **Apply 4.1 to the Haiku scorer:** structured JSON output, schema-validate before insert, reject on any missing field. No free-form output reaches the table.
- Build order stands: feed-top DivergenceCallout before the standalone page. Never show an empty state; show the most recent resolved conflict.
- **Design patch:** replace all DM Mono mandates per 3.2 (pending Luke's confirmation).
- All locked copy lines stand (landing, FAQ, pricing callout, brief line format, dismiss micro-copy).
- **Strategic note:** divergence scores over time per entity are exactly the kind of dataset that becomes licensable (1.2). Design the table and scoring for time-series export from day one; it costs nothing now and is the exit thesis later.

## 4.5 Ask Tideline (pointer)

RESEARCH-RAG-SPEC.md is the engineering source of truth; ASK-TIDELINE-BUILD-GUIDE.md is the paste-in-sequence runbook. Current gate: HNSW index build, then the four-case behavioural verification, then Step 4 API endpoints, then Phase 3 React component. Query limits must ship before public launch.

## 4.6 Retention mechanics (status corrected)

| Mechanic | Old file said | Actual |
|---|---|---|
| Morning brief | Not built | **Shipped, quality-gated** |
| Threshold alerts | Not built | **Shipped** |
| Personalisation/onboarding | Not built | **Shipped** |
| RAG / Ask Tideline | Embeddings not generated | **Live; verification sequence pending HNSW** |
| Active project watcher | Not built | Not built (priority 3) |
| Trust architecture | Not built | Not built (priority 4, with divergence Phase 1) |

Still to design: Day 45 intervention email, significance scoring surface, entity hover card, meeting prep one-click. LP briefing PDF is promoted from "medium priority" to a corporate product line (priority 7).

---

# PART 5: ENGINEERING DISCIPLINE (CLAUDE-RULES.md, patched)

## 5.1 Session protocol (corrected)

**Every Claude Code session begins by reading only:** `CLAUDE.md`, `SUPERCLAUDE-COMMANDS.md`, `CLAUDE-RULES.md`, `git log --oneline -5`, and **`tasks/lessons-MERGED.md`**. Then `/sc:index-repo`. Nothing else before instructions.

**Canonical lessons file is `tasks/lessons-MERGED.md`.** `tasks/lessons.md` is gitignored with a tombstone note (persistent Windows file lock). Any instruction referencing LESSONS.md or tasks/lessons.md means lessons-MERGED.md.

**End of session (mandatory):** `/sc:save`, then update `.claude/SPEC.md` and `tasks/lessons-MERGED.md`, then **update this master file's Part 2 if build state changed.**

## 5.2 Rule Zero: spec adherence

Locked decisions stay locked (pricing, design tokens, copy lines, sidebar rules). If a request contradicts one, STOP and ask. Spec-before-code, diagnostic-before-plan: Luke reviews spec diffs and proposed plans before Claude Code runs anything, especially database writes and git operations. This discipline has caught threshold values being silently "improved" and greenfield-vs-migration misidentification. It is not optional.

## 5.3 Verification rules (hardened by experience)

1. **Verify against exact production artifacts.** Not cleaned, reconstructed, or adjacent substitutes. Wrong account, wrong environment, wrong file: each has caused a full debugging loop. Production vs localhost confusion is a recurring trap; state which environment every check ran against.
2. **Code-read audits cannot substitute for runtime verification.** "Handler exists" is not "handler fires" (TipTap menu, click-outside bugs).
3. Database changes: run the SELECT, show the result. API routes: curl it. UI: demonstrate render.
4. Never mark done without proof. "Should work" is not a status.

## 5.4 Codebase lessons (permanent)

- **React 17+ `stopPropagation` does not stop native event bubbling past the React root.** Click-outside handlers must use ref-based `contains()` checks.
- **The ingestion gate silently quarantines** stories from non-ocean-dedicated sources before the Haiku classifier. General-domain sources covering ocean as a subset need `skipGate: true`.
- Ship ugly, refactor later. Refactor only when retention data proves the feature matters, the hack blocks new work, or Luke asks.
- Autonomous zones (fix without asking): UI components, pure logic, type errors, lint, non-critical test failures. Plan-mode zones (propose first): writes to `document_queue`, `stories`, `velocity_scores`, `divergences`, anything touching Stripe/Resend/auth, scraper ingestion, cron schedules, migrations.

## 5.5 SuperClaude routing (condensed; full inventory in SUPERCLAUDE-COMMANDS.md)

Every prompt is a `/sc:*` command; if unsure, `/sc:recommend`. The workhorses: `/sc:index-repo` (first, every session), `/sc:workflow` (any feature touching 3+ files, plan before build), `/sc:implement`, `/sc:troubleshoot`, `/sc:analyze`, `/sc:improve`, `/sc:git`, `/sc:save`. Non-existent commands that waste a call: `/sc:fix`, `/sc:refactor`, `/sc:debug`, `/sc:review`, `/sc:deploy`, `/sc:plan`.

**Patched command patterns (the old file's versions are wrong):**

RAG work (replaces the dangerous OpenAI embedding prompt):
```
/sc:workflow "Ask Tideline next step per RESEARCH-RAG-SPEC.md. Corpus is
768-d Jina (jina-embeddings-v2-base-en); do NOT introduce any other
embedding model or dimension. Current gate: [HNSW index build / four-case
verification / Step 4 endpoints]. Return the plan before writing code."
```

Divergence build:
```
/sc:implement "Divergence detection Phase 1 per CONFLICTS-PAGE-SPEC.md
as patched by TIDELINE-MASTER.md 4.4: CONFLICTS-PAGE schema variant,
schema-validated Haiku JSON, no DM Mono. Table, lib/divergence.ts, cron,
seed rows. No UI yet. Return the plan before writing code."
```

## 5.6 Things to never do

- Revisit pricing. Use em dashes, blue, Instrument Serif, solid badges, or DM Mono. Individual tracker links in the sidebar. "Tideline's agents" in copy.
- Run any embedding operation without confirming 768-d Jina.
- Trust this file's Part 2 without confirmation if it has not been updated this session.
- Start a session without the opener and `/sc:index-repo`.
- Give Manus repo or database access.
- Adopt a new tool without passing the decision filter in 1.2.

---

# PART 6: FILE SET DISPOSITION

| File | Status after this consolidation |
|---|---|
| TIDELINE-CONTEXT.md | **Retired.** Replace with this file (or a pointer to it). Its build-state and priority sections caused repeated wasted sessions. |
| BRIEF-LEAD-SPEC.md | Keep for implementation detail. Delta Test section superseded (4.2). |
| PULSE_SCORE_METHODOLOGY.md | Keep; publish v1.2 with 11 trackers and the extended institutional type taxonomy (4.3). Public methodology page must match the live product. |
| CONFLICTS-PAGE-SPEC.md | Canonical divergence spec, patched per 4.4. |
| DIVERGENCE_DETECTION_SPEC.md | **Retire** after confirming nothing unique remains (the positioning narrative is preserved here and in CONFLICTS-PAGE-SPEC.md). |
| SUPERCLAUDE-COMMANDS.md | Keep as command inventory. Its embedding prompt and session opener are superseded by 5.5 and 5.1. |
| CLAUDE-RULES.md | Keep; update lessons-file references to lessons-MERGED.md and fold in 5.4. |
| RESEARCH-RAG-SPEC.md / ASK-TIDELINE-BUILD-GUIDE.md | Unchanged; RAG sources of truth. |

**Open items requiring Luke's decision:**
1. DM Mono replacement approach in divergence components (3.2).
2. Publishing the extended institutional type taxonomy, including Type 6 at 0.80 (4.3).
3. Formal decision to park the mobile app rather than leaving it "stalled".

---

*One file. Two questions before anything gets built: is it on the priority list, and does it move toward licensable data. Everything else is noise.*
