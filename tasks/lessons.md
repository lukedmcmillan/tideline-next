# Lessons Learned

## 2026-05-20 (Architectural verification complete — FOURTEENTH meta-lesson)

- **Classification is phrasing-robust; scoring is phrasing-fragile.** Low-cardinality bucket classification (GOVERNANCE_CHANGE vs ANALYSIS_OR_FINDING etc.) is stable across prompt wording variation — the same story lands in the same bucket regardless of how the prompt is phrased. Continuous scalar scoring (governance_significance, delta confidence, significance estimation) swings dramatically on prompt wording for identical content. RULE: gate on category; order on the independently-computed `significance_score` from the DB. Never use a model-elicited scalar as a load-bearing threshold. This is the generalised principle behind the verb-allowlist failure (EIGHTH), the governance_significance swing finding (NINTH), and the SIG_FLOOR caution in the current spec.

- **Verification must be against the actual production artifact at every check.** Three instances this investigation: (a) determinism proof ran against a clean-cache environment, not the live DB with verb-era collisions; (b) the category gate was "working" locally for two days while production ran a week-old commit; (c) Step F initially gate-failed because the deploy had not happened despite a green local build. The pattern in all three: the local artifact (code, cache, build) was assumed to match the production artifact without confirmation. RULE: before attributing a production behaviour to local code, confirm: `git log origin/main..HEAD --oneline` returns empty, the runtime prompt_version hash matches the local hash, and the DB state reflects what the deployed code should have written — not what the local code would write.

- **Warm-cache determinism verified in production for the first time (2026-05-20).** All 60 `delta_classifications` rows under `f6491a2171c78bdf` written at `14:21:24` (Brief #1 cold). Zero rows written after that timestamp across Briefs #2, #3, #4. Zero Haiku calls on warm runs — confirmed by `classified_at` distribution, not log lines (Vercel MCP aggregates to one log entry per HTTP request; individual `console.log` lines within a serverless function are not exposed by the log API).

---

## 2026-05-19 (Primary-angle proof — tenth instance, verification-against-convenient-data)

- **TENTH instance, same root as all prior. The primary-angle proof PASSED — against a summary that is not the one production classifies. Live-DB Mongabay BBNJ still confabulates GOVERNANCE_CHANGE. This is the verification-against-convenient-data failure for the tenth time: wrong account (TEST_EMAIL), wrong cache partition (backtest), now wrong summary (primary-angle proof). RULE, now absolute: every proof must run against the EXACT production artifact — the live DB row, the production prompt version, the real account — never a cleaned, reconstructed, or adjacent substitute. A proof against non-production data proves nothing about production. Disclosing the gap honestly is necessary but the conclusion must be 'not proven', never 'open item'.**

---

## 2026-05-19 (Classifier design — ninth layer, generalizes the eighth)

- **NINTH layer, generalizes the eighth. Category classifier is phrasing-robust (PNG 3/3) — the redesign core is sound. BUT governance_significance from the same classifier swung 9→92 on prompt wording for one story. "Pin one prompt version" is the verb-lottery non-fix again: freezes an arbitrary value, does not make it correct. GENERALIZED RULE: low-cardinality classification is phrasing-robust and safe to gate on; continuous scalar scoring elicited from the model is phrasing-fragile and must NEVER be the load-bearing threshold. Use category to gate, use the independently-computed existing significance_score to order, treat any model-elicited scalar as advisory. Also: the category classifier reproduced the original stale-context confabulation (science story + treaty mention → GOVERNANCE_CHANGE) — primary-angle rule is mandatory in the classifier prompt, not optional, not floor-absorbed.**

---

## 2026-05-19 (Category gate redesign — eighth and spec-invalidating instance)

- **EIGHTH and the spec-invalidating one. The Delta Test — the spec's central structural mechanism — gated on a verb allowlist. The backtest proved the same governance event (PNG designates UK-sized MPA) passes or fails purely on whether the model phrases it opens (allowed) vs declares/announces (not allowed). Delta-SHAPE is not a stable property of a story; it is an artifact of model phrasing. Caching froze the lottery deterministically but a deterministic lottery is still a lottery. The allowlist looked like a structural constraint but was a prompt-output filter — the exact failure mode hit three times prior this week. RESOLUTION: gate on STORY CATEGORY (governance change vs analysis vs commercial vs explainer), which is phrasing-invariant, not on extracted verb. RULE: a structural gate must key on a property intrinsic to the input, not on a property of the model's description of the input. If changing the prompt wording can flip the verdict for identical content, it is not a structural gate. Also confirmed by data: significance floor alone is insufficient — 33% of days have no qualifying delta, so the dual-track THE SIGNAL slot is mandatory, not optional.**

---

## 2026-05-19 (Brief lead selection — three compounding production failures, seventh instance)

- **SEVENTH instance, confirmed in PRODUCTION. Tue 19 May brief led with a Damen tugboat product brochure under a "30x30 at Pulse 7.1" conservation headline, while the actual textbook 30x30 story (PNG announces UK-sized no-take MPA, explicit 30% by 2030) was buried in the footer because "announces" is not in the delta-verb allowlist. Three compounding flaws: (a) no governance-relevance floor — a commercial vendor announcement is categorically not governance at any significance; (b) delta-verb allowlist rejects genuine governance verbs (announces a designation) while accepting commercial ones (releases product guidance) — the allowlist encodes the wrong distinction; (c) headline asserts a tracker state unrelated to the body — no coherence check between lead headline tracker attribution and selected story content. The Delta Test was the spec's structural fix; it is admitting commercial noise and rejecting governance events. The gate is deterministic and wrong, which is more dangerous than non-deterministic, because it ships the same wrong answer confidently every day.**

---

## 2026-05-18 (Brief topic filter — correct-logic-on-wrong-inputs, fourth instance)

- **SIXTH instance, and the most conceptually important.** The Delta Test was the spec's structural fix for bad leads. It works deterministically and correctly filters non-deltas. But it encodes "is it a genuine change" with NO relevance floor — significance is only an inner tiebreaker. Result: a sig-28 commercial logistics deal beat a sig-72 coral reef collapse, because the collapse is a finding (correctly non-delta) and the logistics deal is a grammatical delta. The spec optimized for the right SHAPE (delta) but not the right WEIGHT (governance significance). **Lesson: a structural gate that is correct in its own terms can still produce wrong outputs if the thing it gates on is not the thing that actually matters to the audience. Verify not just that a gate works, but that "works" means "selects what the user needs", not "selects what satisfies the gate's internal definition."**

- **Determinism proof must exercise the cache path with a zero-model-calls assertion on the second run.** Temp 0 producing matching output across two runs is NOT a determinism proof — it is two die rolls that happened to agree. A gate is deterministic only if the second evaluation provably does not invoke the model. Every future determinism checkpoint asserts zero model calls on repeat, not output equality under temp 0.

- **FIFTH and sharpest instance of the week's pattern.** The Delta Test was designed as the STRUCTURAL fix that makes bad leads impossible — but it was implemented as an LLM call, so it inherited the exact drift it was meant to eliminate. It (a) confabulated a delta from a 4-month-old background clause in a conference explainer (BBNJ "entered force" cited as context, extracted as today's news), and (b) returned different verdicts for the same story on identical input (PNG MPA fail then pass). The spec's governing principle — deterministic assembly where it must be bulletproof — was applied to the synthesis line but NOT to the gate, which is the part that most needs it. Fix: prompt rules for precision + temperature 0 + permanent per-story cache for determinism. **RULE: any LLM call that functions as a GATE (pass/fail eligibility) must be deterministic by construction — temp 0 and cached — and every checkpoint must prove the gate returns identical results on a repeat run before the logic downstream of it can be trusted. An LLM gate that is not cached is not a gate, it is a die roll wearing a gate's uniform.**

- **FOURTH instance this week of correct-logic-on-wrong-inputs — refined diagnosis.** (1) velocity.ts queried stories.topic not cross_tracker_flags. (2) cleaned classifier not queried by consumers. (3) TEST_EMAIL pointed at cancelled account. (4) brief topic filter excludes topic='all' stories from everyone (best editorial sources: Oceana, Mongabay, Hakai, Oceanographic Magazine) plus has a phantom conservation mapping (no source produces topic='conservation'). **RULE: when output looks wrong, audit the input set BEFORE the processing logic. Every instance this week was an input problem masquerading as a logic problem. Verifying a fix against a convenient/thin/wrong dataset is not verification. The candidate pool must be proven correct before any selection logic built on it can be trusted.**

- **Fourth instance refined — initial diagnosis overstated severity.** The brief topic filter bug was real but initially assessed as "90% invisible" based on the hotmail test account's 4/49 pool (8%). The active gmail account had an 85% pool. The real gap: topic='all' exclusion (best editorial sources, 63 stories in 30d including 21 sig>=50) plus a phantom conservation mapping (content gap, not missing stories). The meta-lesson compounds: not only was the logic correct on wrong inputs, but the diagnosis of the input problem was itself initially made against the wrong account. **Audit which account/dataset every diagnosis runs against, including diagnoses of input bugs.**

- **TRACKER_TO_TOPICS maps 30x30 and cites-marine to "conservation", but zero sources in sources.ts produce topic=conservation.** These are high-value ESG-segment trackers with no dedicated content source. This is a feed-coverage gap, not a code bug. Removing the mapping would hide the gap. Resolution: add a conservation-tagged source (IUCN, WWF, or similar conservation NGO RSS) in a future feed-expansion session. The conservation mapping remains in place as a known-failing marker — its absence from stories.topic values is the signal.

---

## 2026-05-13 (Velocity diagnostics — blue-finance and thin-tracker coverage)

- **Blue-finance 2.2 score was from contaminated topic-path, not a scoring bug.** Running `diag-blue-finance.ts` revealed two completely different pictures depending on query path: (a) `stories.topic = 'bluefinance'` returns 52 stories but they are general ESG/energy — EU carbon market reform, EV sales, Iran war energy demand — not ocean blue finance. Those stories were scoring the tracker artificially. (b) `cross_tracker_flags @> ['blue_finance']` returns 1 story in the last 30 days (a coastal wetlands investment piece). The 1.5 score from path (b) is honest. The fix (using cross_tracker_flags) was already in place since 2026-05-11; the contaminated score was from a stale velocity_scores row calculated on the old topic path.

- **velocity.ts fix confirmed already shipped (2026-05-11).** The fix to switch from `stories.topic` to `.contains("cross_tracker_flags", [flag])` was applied in the May 11 session. The lessons.md entry "velocity.ts queried on stories.topic, not cross_tracker_flags" already exists from that session. No re-work needed.

- **wto-fisheries and plastics are confirmed feed coverage blind spots, not policy signals.** Diagnostic run 2026-05-13: wto-fisheries = 0 stories from 0 sources in 90 days; plastics = 1 story from 1 source in 90 days. Their low Pulse Scores (2.0 and 2.4) are formula floor scores, not measured signals. **A tracker with zero source coverage is not a quiet tracker — it's an unmonitored one.** cites-marine has 3 stories from 2 sources (Mongabay Oceans, Oceanographic Magazine) — marginal. InforMEA OData and FAOLEX import are both noted as ready-to-run and could fill plastics and CITES coverage gaps. Feed coverage task logged.

- **Velocity score "stories=0 / score=2.0" pattern is a visibility hazard.** wto-fisheries shows score=2, story_count_30d=0. From the subscriber perspective this looks like a low-activity tracker. It is actually an unmonitored tracker. The tracker UI should distinguish "0 stories tracked" from "low activity" — different confidence levels.

## 2026-05-13 (Phase 2B — empirical results)

- **Phase 2B empirical test ran 2026-05-13 across AWI (8 records) and WDC (78 records). Results:**
  - AWI: 0/8 succeeded under canonical UA (8/8 still HTTP 403)
  - WDC: 71/78 succeeded under canonical UA (71 HTTP 200 + PDF, 2 HTML landing pages, 1 HTTP 404, 4 dead wdcs.org domain)

  **Interpretation:** Results are mixed in the OPPOSITE direction from what was predicted. AWI is a hard server-side UA block — canonical crawler etiquette makes no difference, Option C (partnership) required. WDC PDFs are fully accessible under the canonical Tideline UA — 91% success rate. The "Cloudflare Managed Challenge" documented in May 12 was blocking the HTML publications *index page* (what Jina tried to render), NOT the individual `/wp-content/uploads/` PDF files. WordPress CDN-hosted assets are not protected by the same Cloudflare challenge that guards the site's HTML pages. **This is a significant intelligence correction: WDC is a recoverable source for direct PDF downloads. The coverage gap is much smaller than May 12 suggested.**

  **Strategic conclusion:** Option B (crawler etiquette) DOES work for direct-PDF NGO sources like WDC. Option C (partnerships) is specifically required for sources that serve reports only through HTML-rendered pages with Cloudflare protection (AWI, CITES cites.org). The wall is not uniform. Prioritise partnership outreach to AWI and cites.org; WDC library can be ingested via the existing direct-PDF path once the processor backlog is cleared.

- **Phase 2B retry diagnostic revealed processor throughput crisis.** Document_queue has 10,146 pending records. Processor `BATCH_LIMIT` is 500 per run. AWI and WDC records queued on 2026-04-20 are at queue position ~5,400 — three weeks unprocessed. New scraper output (including Phase 2A nightly cron) queues behind this backlog. At current cron cadence, new records wait weeks before reaching the processor. The library has been receiving content at a rate structurally slower than scrapers are producing it. **Resolution needed:** (a) increase `BATCH_LIMIT` and cron frequency to drain backlog, (b) add a parallel high-priority processor lane for recent records, (c) audit the 855 OpenAlex pending records — if those are broken/stale, clearing them immediately reduces queue depth by 8%. Priority: HIGH. Affects every scraper migration shipped this week — content is being queued but not reaching the library at usable latency.

  **Pattern:** This is the second time in three days that work has been happening at the scraper level but not reaching the subscriber (velocity.ts queried the wrong field; processor falling behind). Scraper-side success ≠ subscriber-visible value. **Both lessons together argue for ongoing end-to-end metrics showing queue → library latency, not just per-stage success rates.**

- **The May 12 "WDC Cloudflare-blocked" lesson needs a correction.** Cloudflare Managed Challenge blocks the HTML publications listing page (`/whales-dolphins/wdc-publications-and-reports/`) — what `scraper-ngo-reports.ts` tries to load via Jina. It does NOT block direct downloads of `/wp-content/uploads/sites/6/*.pdf` files. These are on a standard WordPress CDN path. Direct PDF download under the canonical Tideline UA succeeds at 91%. The lesson was accurate for the HTML scraping path but incorrect as a blanket statement about WDC accessibility. Generalisation: **distinguish between "site HTML is blocked" and "content files are blocked" — these can and do differ on the same domain.**

## 2026-05-13 (Phase 2B — retry experiment + NGO scraper diagnosis)

- **scraper-ngo-reports was confirmed broken in Phase 2B.** Returns HTTP 200 and fetches pages successfully (OceanCare 104k chars, IUCN 32k, Oceana 20k via Jina) but extracts zero documents because the `[text](url)` regex pattern is too narrow for modern NGO pages. Modern report links arrive as: (a) bare `*.pdf` URLs in Jina markdown without link text wrapper, (b) short `[Download](url)` patterns filtered out by the 10-char minimum text length check, (c) deeply nested JS-rendered content that Jina doesn't fully render. Was saved from being a silent production hazard only because it's a manual-only script, not on cron. **Generalisable rule: every scraper that returns success with zero results should be flagged for review. Add a yield-floor metric to cron monitoring — a scraper that completes successfully but produces zero new queue entries N runs in a row is a warning condition.**

- **Phase 2B retry experiment scope was much smaller than expected.** Of the 6 NGO domains targeted, only AWI (awionline.org) had actionable failed records (8 × HTTP 403). WDC had 78 pending records that never failed — they will hit Cloudflare when the processor runs (known structural block per May 12 lessons). Pew, SAS, IUCN had 0 records in the queue at all — they were never successfully scraped in the first place. The Option B empirical test is limited to AWI (8 records). Statistical significance is low; treat as a signal rather than a conclusion. **Pattern to note: before designing a retry experiment, verify that the sources in scope actually have failed records to retry. Queue gaps (0 records) are as informative as failure patterns.**

## 2026-05-13 (Phase 2A — scraper migration)

- **Dry-run flag is mandatory before any scraper commit, not optional.** scraper-informea had no `--dry-run` guard — the flag existed in the header comment but the `isAlreadyQueued` and DB insert paths ran regardless. Phase 2A added a proper dry-run gate. Pattern: every scraper that writes to `document_queue` must have a `--dry-run` flag that gates ALL DB writes, and the flag must be the first test run before any commit. Never commit a scraper without a successful dry-run output.

- **UN Digital Library OAI-PMH endpoint investigation: endpoint is compliant but content window is wrong.** The OAI-PMH interface at `digitallibrary.un.org/oai2d` is robots.txt-permitted and responds to MARCXML queries. However the catalog-added-date sort means the current date window is serving a 1996–2015 historical retroactive cataloguing batch (decolonisation/apartheid/sanctions records). UNBIS subject filter logic is correct but irrelevant when no ocean records exist in the window. Alternative endpoint (`/search`) has the right ocean content but is robots.txt-disallowed (`Disallow: /search`). Resolution: outreach to library-ny@un.org for API access, not a code change. Key lesson: **verify that the target endpoint actually serves the expected content before building the filter logic around it.** A dry-run diagnostic with subject-frequency output (which we added) would have caught this immediately.

- **Phase 1 robots-parser caught a planned robots.txt violation before it shipped.** The initial Phase 2A plan for scraper-un-library was to switch from OAI-PMH to the Invenio `/search` endpoint. When we ran the test fetch, `fetchAsTideline` threw `RobotsBlocked` — the UN Library robots.txt has `Disallow: /search`. Without the Phase 1 utility in place, this violation would have shipped silently and run against a UN body. The robots.txt compliance layer in `app/lib/http-client.ts` is paying for itself. **Always run the compliance layer before designing scraper endpoints — check robots.txt first, then decide on the URL pattern.**

## 2026-05-13

- **Partial-fix pattern now recurring inside the brief pipeline itself, not just across modules.** Three instances this week: (1) `velocity.ts` `cross_tracker_flags` cleaned without redirecting the query path; (2) `score-significance` prompt got verbatim methodology definitions but downstream consumers stayed unchanged; (3) `subjectHeadline` fix (May 11) landed in Mode b only — Modes a and LOW-band fallback continued emitting full-paragraph subjects through May 13 because `buildSubject` only guards `lead.type === 'state'`. The pattern: a multi-mode/multi-branch function gets a fix applied to one branch, the fix is committed, the bug persists in the untouched branches. Mitigation: **every fix to a function with multiple return paths requires an explicit audit of all paths before claiming the fix complete.** Write the audit as a comment or checklist line in the PR — do not rely on memory.

- **`brief_sends` had no `lead_story_id` column.** Without recording which story led each brief, there was no mechanism to exclude repeat leads from future selection. The recently-led exclusion required a schema addition. Pattern to generalise: any selection/ranking function that should not repeat the same item across runs needs a persistence layer for the last-selected item from the start, not after the bug manifests.

- **Test/staging account hygiene: `TEST_EMAIL` pointed at a cancelled account with stale old-format topics for an unknown duration.** Every `test_send` was validated against the wrong user profile. Three days of investigation into a "repeat Canada Small Craft Harbours lead" were partly diagnosing real bugs (subject line, recently-led memory) but partly diagnosing the wrong user's correct behaviour — the Canada story was in scope for the hotmail account's `blue-finance` topic, but never in scope for the active `lukedmcmillan@gmail.com` subscriber. Generalisable rule: **test fixtures must mirror an active production subscriber's configuration exactly, or validation runs are theatre.** Audit all `*_EMAIL` env vars quarterly.

- **The hotmail account topic list was "old format" — different shape from the gmail account's current tracker slugs.** Hotmail topics: `["coral-reefs","sharks-rays","blue-finance","imo-regulation",...]`. Gmail topics: `["30x30","wto-fisheries","bbnj","cites-marine",...]`. This implies a topic schema migration happened at some point that was not applied to all accounts. Worth a one-off audit: query `topics` across all rows in `public.users`, check for shape consistency (old free-text strings vs. current tracker slugs), and normalise any stragglers before they cause similar confusion in future pipeline validation.

## 2026-05-12

- **RFMO session working documents have ephemeral URLs (~20% queue failure rate is structural, not a bug).** IOTC confirmed (19/98 = 19.4% HTTP 404s); likely same pattern for ICCAT/WCPFC/IATTC. Pre-session proposals and draft agendas are published temporarily during sessions then removed or superseded post-session. Expect ~20% failure rate on RFMO batches as temporal URL churn. Two mitigation paths to investigate: (a) staleness check at processing time — if queue item is >30 days old, recheck source URL before attempting download; (b) URL pattern exclusion at scraper level for known-ephemeral working document prefixes (e.g. `Prop*.pdf`, draft agenda patterns). Do not treat RFMO 404 failure rate as a processor quality signal.

- **WDC reports (uk.whales.org, 76 records) structurally blocked by Cloudflare Managed Challenge.** All subdomains tested (uk.whales.org, whales.org, us.whales.org, au.whales.org) — all return HTTP 403 + `cf-mitigated: challenge`. Honest research crawler user-agent (`Tideline-Ocean-Intelligence/1.0`) makes no difference — the challenge requires JavaScript/browser execution, not identification. Permanent coverage gap. WDC is the highest-value NGO cetacean policy source outside IWC Secretariat. Gap should be visible on any IWC tracker page or cetacean topic view.

- **Bot-blocking is now a systemic pattern: cites.org + uk.whales.org both Cloudflare-gated.** Two authoritative sources blocked in one session. Not a CAPTCHA bypass problem — these sites have deployed Cloudflare Managed Challenge requiring full browser execution. The right response is: (a) crawler etiquette policy decision — does Tideline attempt to negotiate API access with CITES/WDC directly? (b) manual curation pipeline — can the researcher download and manually submit PDFs? (c) accept gaps and disclose on tracker pages. Do not invest in headless browser infrastructure — it violates ToS and is an arms race we will lose.

- **IOTC Glossary of Terms queued twice — small dedup leak.** Same filename appeared as two queue records and both processed to `failed` (relevance rejection). Not urgent but worth investigating scraper-side dedup logic when RFMO scrapers are next revisited.

- **IWC discoverability via library topic tags verified.** 111 IWC documents processed with reliable whaling/cetacean/marine-mammal vocabulary across 7 distinct tag classes (whale conservation ×37, cetacean conservation ×26, marine conservation ×18, whaling management ×17, whaling regulation ×16, cetacean management ×11, marine mammal protection ×8). Option (b) from last night was correct — no IWC tracker reinstatement required. Topic-tag-based discovery is sufficient for tracker-orphaned MEA content.

- **CITES decisions hit structural Cloudflare/CAPTCHA block during processing.** 38 records queued May 11 (cites.org HTML URLs) all failed as "Not relevant" — Jina received the security verification page, not decision text. This is a site access pattern, not a scraper bug. Do NOT build a headless-browser bypass. Full investigation May 12: April 13 run brought 34 CITES Resolutions — zero overlap with the 38 Decisions. InforMEA OData has no PDF attachments for these 38 records. Gap accepted as structural coverage limitation.

- **CITES Marine library has Resolutions but no CoP20 Decisions.** Resolutions are steady-state rules (remain valid until repealed); Decisions are current operational instructions (species-specific trade controls, permit procedures, national action directives). Gap is more significant than the record count suggests — represents the missing operational layer for the only CITES tracker. Subscribers viewing the CITES Marine tracker need a visible coverage disclosure. Secondary-source workaround to investigate: IISD ENB CoP20 coverage (PDF daily summaries with decision text — less authoritative but fills operational layer).

- **Morning brief quality gate "Zero passing stories" traced to Anthropic credit exhaustion.** On 2026-05-12 07:00 UTC, `generateSummary()` threw `BadRequestError: credit balance too low` for every candidate story, all caught as `null`, collapsing `summarisedStories` to empty array — quality gate rejected with 0 passing stories. Root cause: no fallback when Haiku API fails. Fix: `finalSummary = summary || s.short_summary || null` in `generate-brief/route.ts`. DB-stored `short_summary` is now the resilience layer when API is unavailable. Re-verification window: 06:30 UTC 2026-05-13.

## 2026-05-11

- **Scraper scope discipline**: Dry-run scripts preview scope narrowly (e.g. `--days 180`); live scrapers default to no time cap and run full history. Pattern: make `--days` a required argument with no implicit default in any scraper. The April 13 and May 11 InforMEA runs both exhibited this — records were correct but scope was wider than the dry-run preview suggested.

- **InforMEA has been running since April 13, 2026** (not May 11 as TIDELINE-CONTEXT.md status implied). First run (April 13) queued ~318 PDFs from CBD, Barcelona Convention, ASCOBANS with `source_domain='informea.org'`. May 11 run added 180 HTML decisions from CITES (38), IWC (130), CBD (8), Barcelona (1), ASCOBANS (3) via Option B HTML fallback. TIDELINE-CONTEXT.md scraper status block should read: "LIVE — first run April 13 2026 (PDFs only), HTML fallback added May 11 2026. Yields CITES, IWC, CBD, Barcelona, ASCOBANS decisions. ~498 records queued to date."

- **IWC decisions (130 queued May 11) have no tracker surface**: IWC was deprecated as a tracker slug. Option chosen: rely on Claude topic tagging during processing (cetacean / whaling / marine mammals) to make them discoverable via library faceted search. Verify after first processor run that topic_tags are reliable. Do not stand up an IWC tracker without methodology calibration — IWC meets on ~2yr cycles, making real-time Pulse Scores misleading.

- **InforMEA live run scope (180 records across 5 MEAs) exceeded dry-run scope (33 CITES)**: The dry run used `--days 180` (date-capped preview). The live scraper has no date window and no MEA restriction — it processes all historical decisions across all 17 treaties. Next time: either add a `--days` flag to the live scraper for controlled rollout, or explicitly approve full-backfill scope before running. Records themselves are valid; process gap is the lesson.

- **5,607 OpenAlex DOI rows have source_format NULL**: Processor defaults to PDF path for these, but DOI URLs (e.g. doi.org/10.5281/zenodo.*) typically resolve to HTML landing pages, not direct PDFs. These will fail at extractText() and be marked failed. Silent quality gap worth auditing in a future session — either backfill with source_format='html' after confirming URL patterns, or add DOI resolution to the processor.

- **Revised CITES decisions and document relationships**: Revised decisions (e.g. "CITES Decision 19.178 (Rev. CoP20)") supersede a prior version but there is no `superseded_by` or `revision_of` relationship in the `documents` table. The revision is captured in the title (and slug: `CITES_DEC_19_178_REV_COP20`) but not linked to the original `19.178`. This is acceptable for v1 but creates a gap for legal research users who need to trace decision lineage. Add `revision_of uuid REFERENCES documents(id)` before the library becomes a primary research tool.
- **InforMEA OData: status field values**: Real InforMEA status values are `"active"` (adopted/in-force), NOT `"adopted"` or `"in force"`. Exclude: `draft`, `recommended`, `withdrawn`, `deleted`, `""`. Any future scraper hitting this API should probe `?$top=1` first to confirm field values before writing a filter.
- **InforMEA OData: client-side date filtering required**: Server-side `$filter=published gt datetime'...'` returns 0 results on this endpoint. Parse `/Date(milliseconds)/` format client-side. Confirmed with `scripts/probe-informea.ts`.
- **HTML-only documents in PDF-assumed pipeline**: CITES CoP20 decisions (33 records) are HTML-only on cites.org. Queuing them in `document_queue` without format tracking would silently fail at `extractText()` in processor-agent. Added `source_format` column to both `document_queue` and `documents`; processor routes HTML to Jina fetch instead of PDF download.
- **velocity.ts queried on stories.topic, not cross_tracker_flags**: The backfill cleaned `cross_tracker_flags` but velocity.ts still queried `stories.topic`. Cleaning the classifier without redirecting the score query path meant the backfill had no effect on Pulse Scores. The cleaned data must be read by the consumers that need it. Fixed 2026-05-11: switched to `.contains("cross_tracker_flags", [flag])`.

## 2026-05-07

- **Migration tracking**: Migration files marked 'pending Studio apply' need to be tracked and verified applied — `matched_entity_id` was committed but not run, leaving auto-attach silently broken in production. Always verify migration applied before testing the feature it supports.
- **Silent swallow patterns**: `matchEntitiesToStory` had inner try/catch swallowing upsert failures and returning success-shaped result objects. `fetch-feeds` saw `matched > 0` and reported success while `project_auto_entries` got nothing. Don't trust `matched: N` returns from functions with internal error handling — verify against the database.
- **Postgres partial unique index + ON CONFLICT**: `ON CONFLICT` requires the target to match a unique index exactly, including any WHERE predicate. Partial unique indexes (e.g. `WHERE story_id IS NOT NULL`) cannot be matched by Supabase JS `.upsert()` with simple `onConflict` syntax. Use plain `.insert()` and catch `error.code === '23505'` for duplicate-as-no-op semantics.
- **Two parallel implementations**: Two parallel implementations of the same concept (project tags vs project entities) running simultaneously is a sign of an incomplete migration. Don't remove either side without auditing all read/write paths first. The grep audit prevented a destructive UI change that day.
- **Synthetic vs real-data replay cleanup**: Synthetic tests need cleanup queries printed but not executed; review the data created before deleting it. Real-data replays are different — the data they create is real intelligence content and shouldn't be cleaned up.
- **TipTap stale closure**: Handlers captured at `useEditor` call time read stale state. Solve via a ref pattern — `useState` + `useRef` + `useEffect` to sync `ref.current`. Existing `slashMenuRef` pattern in the codebase is the model. Used for `pendingCitationRef` this session.
- **Clipboard paste defensive guards**: When the AI acts on user-typed content (paste handler reading clipboard), defensive guards are essential: empty clipboard, image paste, non-text content all return strings or empty values that would create broken UI if not guarded.
- **TipTap custom nodes vs built-in**: Custom TipTap nodes are heavier than reusing built-in StarterKit nodes. Phase C originally needed a custom CitedQuote node; investigation revealed StarterKit's Blockquote with structured content was sufficient. Always check what the framework already provides before designing custom extensions.
- **'Describe the diff' is not 'show the diff'**: Three times today Claude Code presented authoritative summaries instead of code. Each time, asking for the literal file bytes caught issues a summary review would have missed. Repeat lesson from previous session.
- **End-of-day product design**: End-of-day product design conversations (personas exercise, workspace product theory) are higher-leverage than end-of-day debugging. Open product questions deserve fresh-head time but they don't have to wait until the next morning if the energy is for thinking, not debugging.
- **Citations need provenance minimum**: Citations need three things minimum to be load-bearing for professional use: source name, source URL, publication date. Anything less is decorative. The attribution row of the citation block is real product surface, not styling.

## 2026-05-05

### Fonts

- **DM Mono removed 2026-04-30.** Never reference it in any spec, including email templates. Use DM Sans with `font-variant-numeric: tabular-nums` inline for numerals (scores, dates, counts).

### AI-generated content caching

- **Cache keys for AI-generated content must be the triggering event's stable identifier, not a tuple of attributes.** Keying interpretation cache on `(tracker_slug, band_from, band_to)` over a 7-day window reuses one interpretation across multiple distinct crossings that happen to share the same transition. Use the specific row's timestamp or primary key (`velocity_calculated_at` here) so each unique event gets its own generation.

### Haiku prompt hygiene

- **Map internal type codes to plain English before injecting into prompts.** Injecting `"Type 2 (Mixed architecture)"` into a "no jargon" prompt results in the jargon being parroted or silently preserved. Maintain a `PLAIN_INST_TYPE` map and transform at the call site — never let schema/type identifiers enter prompt text directly.

### Sparkline y-axis

- **Hardcode the y-axis to the data's known range, not the input min/max.** Auto-scaling to the input range makes a flat tracker (6.0–6.2) look as dramatic as a ramping one (3.2→7.4). For Pulse Scores the range is always 0–10. Hardcoded range preserves visual truthfulness across trackers with different activity levels.

### Direction arrow colours

- **Direction arrows should use direction-appropriate colour (red for down, teal for up), independent of the destination band's colour.** The crossing direction is the alarming signal. A HIGH→ELEVATED downward crossing should show a red ▼ even though the ELEVATED band colour is teal.

### Test email recipient

- **Always confirm the actual recipient before chasing "email not arriving" as a code bug.** A hardcoded address in a test script that the developer doesn't actively monitor causes wasted diagnosis time. The Resend API returned `last_event: suppressed` for `luke@thetideline.co` — the address was suppressed, not a code failure. Check the Resend status first, and verify the `to:` field in the payload before reading logs.

## 2026-04-27

### Library / Document Pipeline

- **document_queue is a manual-only pipeline** — `scripts/processor-agent.ts` drains the queue. No Vercel cron equivalent exists. Items stuck in `processing` after an interrupted run must be manually reset: `UPDATE document_queue SET status = 'pending' WHERE status = 'processing';`
- **embed-documents cron has a silent window bug** — Only fetches the 100 most-recently-created approved docs. Once those are embedded it processes 0 forever with no error. Fix: use `NOT IN (SELECT document_id FROM document_chunks)` with pagination instead of a recency cap.
- **Supabase REST API max 1,000 rows regardless of limit** — `.limit(5000)` in a Node script still returns at most 1,000 rows. Use paginated `.range()` calls for full-table diagnostics.

### Prompt Caching

- **1024-token minimum for caching to activate** — `cache_control: { type: "ephemeral" }` on a block shorter than 1,024 tokens does nothing (2,048 for Haiku 4.5). Add markers as forward-proofing but do not count on savings until prompts grow.
- **Prioritise by volume x prompt size** — A high-frequency route with a short prompt saves less than a medium-frequency route with a 2,000-token stable prompt. Multiply calls/hour by stable token count to rank candidates.

### Production Diagnostics

- **Node script + .env.local is sufficient for DB diagnostics** — No Docker or Supabase CLI needed. `npx @dotenvx/dotenvx run -f .env.local -- node -e "..."` gives a live DB read in seconds.

### Entity Type Data Quality

- **entity_type column has architectural debt** — At least 15 distinct values across three casing conventions (lowercase, UPPERCASE, mixed). Both `organization` and `organisation` exist as separate values. Future cleanup pass needed: normalise to lowercase singular, merge spelling variants, add CHECK constraint. Today's label mapper (`app/lib/entity-type-label.ts`) is a display-layer fix only — it does not address the underlying data inconsistency.

## 2026-04-28

### Onboarding Deploy

- **`/start` is legacy — v2 onboarding replaces it** — New users flow through `EarlyAccessModal` → NextAuth → `/onboarding`. The `/start` route and its API endpoint (`/api/trial-signup`) are kept live but receive no new traffic. After 30 days post-launch with no meaningful traffic to `/start`, delete both. Check Vercel analytics before deleting.
- **`onboarding_completed` column does not exist in migration** — `20260419_onboarding_v2.sql` only added `onboarded_at`, `job_type`, `brief_time`. Do not set `onboarding_completed` in the onboarding API route — it will cause a silent Supabase error. Use `onboarded_at` (timestamp) as the sole completion signal.
- **Middleware `undefined` vs `null` distinction for JWT fields** — Middleware reads the JWT cookie directly (bypasses the JWT callback). Existing users' tokens have `onboarded_at === undefined` (field not yet set). New unonboarded users have `onboarded_at === null`. Use strict `=== null` in the middleware gate, not `!token.onboarded_at`, to avoid false redirects during rollout.
- **`shouldRefresh` pattern for adding new JWT fields without re-auth** — Adding `token.onboarded_at === undefined` to the `shouldRefresh` condition in `auth.ts` triggers a one-time DB re-fetch on the user's next request, backfilling the new field into their existing token. Zero disruption, no re-auth required.

### Design System Violations (BLUE constant)

- **`BLUE` (#1d6fa4) used in live platform tracker pages — audit required** — TIDELINE-CONTEXT.md locks "No blue colour" in the design system. `BLUE` is defined as a local constant (not shared tokens) in 7 files. Three are live `/platform` routes needing a cleanup pass:
  - `app/platform/(shell)/tracker/bbnj/page.tsx` — choropleth map (signed status), legend, stat card, source link colour
  - `app/platform/(shell)/tracker/blue-finance/page.tsx` — stat card colour, source link colour
  - `app/platform/(shell)/tracker/governance/page.tsx` — stat card colour, nav `borderBottom` accent
  - `app/workspace/page.tsx` and `app/workspace/[id]/page.tsx` — uses `#185FA5` variant
  - `app/start/page.tsx` and `app/subscribe/page.tsx` — legacy routes, violations auto-resolve on deletion.
  - Replacement: teal (`#1D9E75`) for UI accents; data viz "signed" status needs a design decision (teal or neutral).

### Entity Deduplication

- **Entity dedup principle: full canonical name wins, abbreviation becomes alias** — When merging a full-name entity with its abbreviation, keep the full name as the canonical `entities.name` record regardless of which variant has higher `mention_count`. Abbreviations go into `entity_aliases`. Reasoning: the entity record must be unambiguous; the alias table handles lookup.
- **Trigram similarity (threshold 0.75) misses short-string duplicates** — The highest-impact duplicate in the entities table (U.S. / US, 1,394 combined mentions) scored below 0.75 because trigrams require string length to produce meaningful overlap. Pre-insert dedup helpers must run BOTH checks: trigram similarity > 0.85 AND normalised-key match (`name.toLowerCase().replace(/[^a-z0-9]/g, '')`). One without the other is insufficient.
- **Denormalised `mention_count` column found to be systematically wrong, not stale** — Pattern of identical drift values (~183 across many rows) indicates a write-path bug stamping a constant value (likely stories table row count at entity creation time) rather than a real mention count. `mention_count` cannot be used in any UI, scoring, or decision logic until: (a) the write-path bug is fixed, (b) the table is recalculated from `entity_mentions`, and (c) a trigger keeps them in sync. Any feature spec referencing `mention_count` needs review.

### Onboarding / Entity Matching

- **Starter-set route resolves entities by exact `name` match, not aliases** — `app/api/onboarding/starter-set/route.ts` uses `.in("name", names)`. If the config name drifts from the DB canonical name, the entity is silently skipped. Symptom: G2 check returns "missing" entities that actually exist under a different name with the config name as an alias. Fix applied 2026-04-28: updated `starter-sets.ts` to use canonical DB names.
- **`/onboarding` client-side guard bounces already-onboarded users** — `useEffect` on mount calls `/api/subscription-status` and redirects to `/platform/directory` if `needsOnboarding` is false. This is a client-side guard, not middleware — there is a brief flash of the onboarding page before redirect fires. Low priority for now; middleware guard would be the clean fix (add `token.onboarded_at !== null` check to bounce at edge).
- **FOLLOW-UP (not done):** The starter-set route should fall back to `match_entities_by_alias` when `.in("name", ...)` returns nothing for a given name. This makes the system resilient to future config drift without requiring manual audits. Add after onboarding deploy is proven stable.
- **`Lloyds Register` stored without apostrophe** — DB canonical name is `"Lloyds Register"`, not `"Lloyd's Register"`. Likely a data entry inconsistency. Future cleanup: normalise to `"Lloyd's Register"` in both `entities.name` and any `entity_aliases.alias_text` rows. Low priority.

## 2026-04-29

### Entity Dedup — Denormalised Counter Integrity

- **Idempotency, not just first-call correctness, is the required test for denormalised counters** — Bug 2 in `lib/entity-matching.ts` fired `increment_entity_count` unconditionally after every upsert, even when `ignoreDuplicates: false` returned 0 new rows. The bug hid for the entire feature lifetime because tests only asserted that the first call incremented the counter. New rule: any write path that updates a denormalised counter must have a test that calls the path twice with identical input and asserts the counter is incremented exactly once. First-call correctness is not sufficient.

### Entity Dedup — The fix-X.ts Anti-Pattern

- **Two ad-hoc fix scripts for the same class of problem signals structural debt** — By 2026-04-29 there were four one-off scripts (cleanup-entities, fix-entities, fix-convergence, fix-convergence-alias) each addressing entity false-positive matches from different angles. When you have shipped two fixes for the same class of problem, the next iteration must be structural. The `entity_review_queue` table + `findOrCreateEntity()` helper replaces this pattern by capturing near-matches for review instead of silently inserting duplicates.

### Entity Dedup — Canonical Name vs. Abbreviation

- **Full canonical name wins, abbreviation becomes alias, regardless of mention count** — When deduplicating US / U.S. / United States (combined ~1,400 mentions pre-recalc), the correct keep is "United States" even though the abbreviations had higher raw counts. Entity records must be unambiguous; the alias table handles all lookup paths. Trigram similarity alone misses short-string duplicates — BOTH trigram > 0.85 AND normalised-key match (`name.replace(/[^a-z0-9]/g, '')`) are required for complete dedup coverage.

### Entity Dedup — Read git log Before Scoping

- **`git log --stat` against feature files surfaces scripts and audit docs that aren't in the investigation context** — Before the dedup pass, `git log --stat lib/entity-matching.ts` would have revealed 11 scripts and 2 audit documents added in c351d8c that were not visible from the original issue report. Reading the commit log first prevents re-discovering work that already exists and scoping fixes that are already partially done.

### Entity Dedup — Schema Assumptions

- **Schema drift assumptions waste investigation time** — Use `information_schema.columns` or read the migration file before writing queries against tables not recently inspected. Tideline uses semantic naming (`first_seen_at`, `alias_text`) not ORM defaults (`created_at`, `alias`). A column that "should" exist may have a different name or not exist at all.

### Entity Dedup — Markdown and SQL Safety

- **Markdown auto-linking corrupts dotted identifiers** — SQL fragments and code containing `process.env.NEXT_PUBLIC_X`, `ea.alias_text`, `e.id` etc. are mangled by markdown renderers. Always wrap in fenced code blocks when sharing in chat; always paste through a plain-text intermediate before copying out of chat into an editor.

### Entity Dedup — UUID Test Fixtures

- **UUIDs are hex-only** — Postgres silently rejects test fixture IDs like `'00000000-test-0000-0000-entity-idem'` at insert time, causing tests to run against missing data with misleading downstream errors. Always use `00000000-0000-0000-0000-000000000001`-style fixture IDs or `crypto.randomUUID()`.

### Entity Dedup — Vitest Config

- **Vitest needs explicit path alias config** — Next.js `tsconfig.json` paths are not auto-detected by Vitest. Add `vitest.config.ts` with `resolve.alias: { '@': path.resolve(__dirname, './') }` to use `@/` imports in tests. Without this, all `@/lib/...` imports fail at test runtime.

### Entity Dedup — Unapplied Recommendations

- **Check for unapplied recommendations when re-entering a feature area** — Two audit outputs from April 20 (tier1-second-pass.md RSS sources, three-tier matching SQL from cleanup-entities.ts) sat unapplied for 8 days. Drift between "recommendation made" and "recommendation applied" is hidden debt. At the start of any investigation, grep the feature directory for `.md` audit files and check git log for script output that was never acted on.

### Entity Dedup — LLM Write-Path Call Order

- **LLM-written write paths need causal-order review, not just correctness review** — The Bug 2 root cause was `increment_entity_count` being called before the mention insert it was meant to count: narrative order (count it, then record it) rather than causal order (record it, then count if recorded). This is a repeatable LLM failure mode — narrative coherence overrides causal correctness. When reviewing any LLM-written write path that updates a counter, verify the order of calls against the causal dependency, not just whether each call looks individually correct.

### pgvector Function Signature Verification

- **`pg_get_function_identity_arguments` is unreliable for pgvector functions** — The metadata view displays all pgvector arguments as untyped `vector` regardless of the actual declared dimension (e.g. `vector(768)` vs `vector(1536)`). Chasing this phantom costs multiple debug rounds. Use a **runtime test** instead: `SELECT * FROM match_entity_embeddings(array_fill(0.1::real, ARRAY[768])::vector, 0.5::double precision, 10)` — if it returns 0 rows (not an error), the function accepts `vector(768)`. Trust the runtime, not the metadata view.

### Entity Embeddings — Dimension Mismatch

- **`entities.embedding` was declared `vector(1536)` but the app uses Jina v2 (768 dims)** — `story_chunks.embedding` was explicitly migrated from 1536→768 in `20260331_alter_embedding_dimension.sql`. The entity column and its RPC were added later (`20260418_entity_tracking_v2.sql`, `20260421_match_entity_embeddings_rpc.sql`) and incorrectly copied the original 1536 dim. The matcher's Pass 3 would have thrown a dimension error at runtime for every story, not just returned 0 results. Fix: migration `20260429_entity_embedding_to_768.sql` drops/re-adds column at vector(768) and updates the RPC. Lesson: when adding a new vector column, check the dimension used by the existing embedding infrastructure before declaring.

### Entity Embeddings — Backfill Recovery

- **Baseline unmentioned count was wrong before backfill** — `count-unmentioned.ts` initially fetched `entity_mentions` without pagination and hit the Supabase 1000-row cap. The displayed "458 unmentioned" was an undercount of entity_mentions, producing an inflated unmentioned number. Always paginate diagnostic queries against tables that grow without bound. Fixed in the script using `.range()` loops.
- **Post-embedding + post-backfill result: 265 unmentioned entities (out of 942)** — After running `embed-entities.ts` (942/942 embedded, 0 failed) and draining the backfill queue (182 stories across 11 runs, avg 5.3 matches/story), 677 entities have at least one story mention. Pass 3 (semantic) confirmed live: `[exact, semantic]` fired on first test. The 265 still-unmentioned entities are likely very niche/seeded entities that haven't appeared in story text yet — this is expected and will resolve as the feed runs.
- **backfill-entity-matching.ts caps at 20 stories per run** — Run in a loop (`for i in $(seq 1 N)`) to drain the queue. Queue drains when it prints "No unmatched stories found". It uses `entities_extracted IS NULL or false` to track which stories have been processed.

### Shell Cross-Terminal Paste Corruption

- **Never paste multi-line commands across terminal types (PowerShell → bash)** — Three corrupted files named `ntent scripts<filename>.ts` (~2,822 bytes each) were silently created in the repo when bash interpreted a multi-line PowerShell paste as redirect-to-file operations. They passed linting but caused Vercel build failures on deploy. Lesson: run `git status` after every Claude Code session before committing; anything with a space in the filename or non-alphanumeric prefix is almost certainly a paste artifact. Delete before staging.

## 2026-05-01

### Morning Brief — LLM Prompt Voice

- **LLM-generated copy needs explicit banned phrase lists, not just tone descriptions** — Haiku defaulted to consulting-firm-prose ('face expanded documentation requirements', 'bifurcating compliance requirements') until banned phrases were listed explicitly. The brief needed two prompt revisions: first to remove consultant-voice, second to remove epistemic-hedging tic ('specifics are unclear from the source'). When telling an LLM to be restrained, give it explicit alternative content to write instead — otherwise it narrates its own constraints.

- **Brief content fails in two opposite directions** — Overreach: claiming regulatory change where the source says guidance. Underreach: narrating that the source is thin instead of writing what IS clear. Both undermine trust. The prompt must hold both rails: never escalate (guidance stays guidance), AND never apologise for source brevity (write what is there, stop).

### Morning Brief — Content Selection

- **selectEvidence needs a dedup pass** — Two near-identical stories about the same event made it into the same brief because selection ranked only by significance. Rule: same topic + 3+ overlapping headline words + published within 7 days = duplicate. Keep higher significance.

- **Architecture: pre-summarise once, render per-user** — Haiku cost is O(pool_size) not O(pool × subscribers). Trivial difference at one subscriber, material at scale. Generate-brief summarises and stores JSONB; send-brief reads and renders.

- **48-hour candidate window was too narrow** — At current ingestion volume, 48h produced 0-1 stories for low-volume topics. 7-day window yields ~3x candidate density. Sort by significance desc within the window — most-significant 7-day story beats most-recent empty brief.

### Morning Brief — Architecture

- **Significance is relative within topic, not absolute across topics** — governance averages 13/100, dsm 29.5, iuu 4.5. Absolute thresholds useless. Three-mode selectLead (story-led >=50, hybrid <50, state-led empty) handles this gracefully.

- **TRACKER_LABELS must not conflate tracker slugs with topic values** — A single 19-entry map with both velocity_scores.tracker_slug keys and stories.topic keys does double duty silently. Any *_LABELS or *_LOOKUP map where the same value appears under multiple key types needs splitting. Split into TRACKER_LABELS (10 tracker slugs) and TOPIC_LABELS (9 topic values).

### Morning Brief — Mobile UX

- **Subject line truncation is mobile-critical** — Gmail and iOS Mail truncate at ~77 chars in notification preview. Long titles (100+ char BBNJ treaty names) need word-boundary truncation. Reserve 12-15 chars for the data-point appendix ('· Pulse 6.1'), leaving ~63-65 for headline.

- **Architecture tests do not catch content quality** — vitest passes and API returns 200 does not mean the brief reads well. After every prompt change, run TEST_EMAIL and read it as a paying subscriber: consultant voice, hedge language, factual overreach, repetition. Build content-quality verification into the brief shipping process.

## 2026-05-06

### Auth & Session Cookies

- **next-auth `getToken()` does not auto-detect cookie name — pass `secureCookie` explicitly.** Edge middleware sees the HTTPS request URL; serverless API routes see an HTTP internal URL. Without `secureCookie: true`, `getToken` looks for `next-auth.session-token` but Vercel sets `__Secure-next-auth.session-token`. Fix: derive from `NEXTAUTH_URL?.startsWith("https://")`.
- **Two-stage auth deploys reduce blast radius.** Stage 1: fix the underlying bug WITH the fallback still in place (deploy and verify sessions resolve). Stage 2: remove fallbacks once stage 1 is verified in production. Never remove a safety net in the same deploy that introduces a behavioural change.
- **Hardcoded user-id fallbacks in API routes are auth holes AND mask real bugs.** `if (!email) email = "lukedmcmillan@hotmail.com"` meant authenticated users always got data even when the session resolved wrong. The fallback was the reason the auth bug was invisible for weeks. Fail closed on null session: return 401.
- **Returning empty arrays on auth failure is misleading — return 401.** The frontend can handle session-expired state; returning `{ projects: [] }` when auth fails makes the UI silently show an empty state rather than prompting re-login.
- **'Shipped' = verified in production with a real request, not 'committed and pushed'.** Three times this session a deploy was described as done before verifying in Vercel logs. A commit on origin/main is not a shipped feature.
- **Run `npm run build` LOCALLY before commit/push.** Three failed deploys this session all would have been caught by a local build. The build takes 35s and is mandatory before any push.
- **Reviewing a diff in chat is not the same as verifying it compiles.** A diff shown in chat is a plan. Apply, build, push are three separate verifiable steps. Approving a diff does not mean it has been applied.
- **A diff in chat is not a diff on disk.** After showing diffs and receiving approval, the edits must still be applied with Edit tool calls. Check `git status` to confirm.

### Supabase

- **Every Supabase SQL Editor migration block must end with a verification SELECT.** Without a result set, silent failures are invisible — the statement ran but the data may not have changed.
- **Supabase SQL Editor closes transactions silently between submissions.** `BEGIN` and `COMMIT` must be pasted as one block, not as separate submissions. A partial transaction committed as a COMMIT-less block leaves the DB in an indeterminate state.
- **`SECURITY DEFINER` functions bypass RLS; route handler must do explicit ownership check before calling the RPC.** `touch_project_viewed` is SECURITY DEFINER — it will run against any project_id it's given. The ownership `SELECT` must precede the RPC call, not follow it.
- **404 vs 403 for ownership failures: pick one. 404 is safer.** Returning 404 for "project not found for this user" avoids leaking whether the resource exists at all.
- **Supabase JS `.upsert()` with `ignoreDuplicates` does not throw on conflict — it returns the error in the response object.** Check `data` (rows inserted) to determine if the upsert was a no-op; don't rely on absence of error.
- **Cross-table user_id migrations: probe for unique constraints first, DELETE-then-UPDATE for preference tables, blind UPDATE for activity logs.** A `UPDATE ... SET user_id = X WHERE user_id = Y` against a table with a `UNIQUE(user_id, entity_id)` constraint will fail if the target user already has the same row.

### API Design

- **Fallbacks appropriate for side-effect operations are a bug for primary operations.** A fallback email on auth failure is appropriate for a fire-and-forget notification; it is a security hole for a data-returning API route.
- **Removing one bug can expose adjacent bugs the masking was hiding.** Part B (removing fallbacks) immediately revealed the workspace creation modal flow doesn't persist — the fallback was serving real data and masking the modal's broken POST path.

### Vocabulary & Schema

- **Workspace/project vocabulary split is intentional.** "Workspace" is the UI-facing term; "project" is the DB table name. Never rename one to match the other in code.
- **Project columns are `name` not `title`; entity columns are `name` not `canonical_name`.**

### Development Workflow

- **End-of-session UI debugging is the highest-risk activity in a session — defer to fresh eyes the next day.** Low blood sugar + accumulated context = increased chance of making the problem worse or missing an obvious cause. Stop at a known-good state.
- **NEVER paste secret values in chat; rotate immediately if leaked.** `.mcp.json` is gitignored but Supabase service role keys and NEXTAUTH_SECRET pasted in chat are visible in conversation history. Rotate if exposed.

## 2026-05-06 (continued — hydration diagnosis)

### React Hydration

- **`new Date()` and `Math.random()` at render scope are guaranteed hydration mismatches.** Server (Vercel, UTC) and client (user's TZ) produce different values. Fix pattern: `useState(null)` initialiser + `useEffect(() => { setState(new Date()) }, [])`. SSR renders the `null` fallback (stable, same on server and client); client hydrates without mismatch, then populates after mount.
- **React #418 manifests as silent UI failure, not a visible crash.** The hydration tear-down kills event handlers attached during the mismatched render. Result: buttons do nothing, modals don't open. The symptom (e.g. workspace creation not persisting) looks like a backend bug but is actually a frontend render issue. Always check the browser console for `#418` before chasing API logs.
- **`useId()` is the correct tool for SVG/DOM IDs in React components — never `Math.random()`.** `Math.random()` at render scope produces different values server-side vs client-side → hydration mismatch. `useId()` is stable across server and client renders. Must be called before any early return (Rules of Hooks).
- **Bug masking chains are real and compounding.** This session: hardcoded email fallback → masked auth cookie bug → masked hydration error (killed click handlers) → modal appeared broken → appeared to be a backend/modal POST bug. When the fallback was removed (Part B) the hydration error surfaced; fixing hydration fixed the modal. Never assume the bug is where the symptom appears.
- **Auth API fix ≠ platform shipped.** Browser DevTools / console is load-bearing verification. A clean Vercel log showing `hasEmail: true` does not prove the platform UI works. Open the page, open DevTools, exercise the failing path, confirm console is clean, confirm the network request fires. This is the only valid shipping proof for UI-facing auth fixes.
- **"Tracking 0 everywhere" and silent empty states always mean look upstream of the data layer.** Three sessions of this pattern (signals, workspace modal, entity chips): the data layer is fine; the auth layer, hydration layer, or wire-up between them is broken. When data reads "0" or "nothing", suspect the delivery path (auth → hydration → event handlers), not the data itself.

## 2026-05-11

### Tracker Canonical List Drift

- **Canonical tracker list lives in 5+ places (TRACKER_LABELS, score-significance prompt, methodology doc, TRACKER_TO_TOPICS, tracker routes). Drift caused two production bugs in May 2026. Refactor candidate: single `lib/trackers.ts` source of truth.** The score-significance prompt used `whaling`, `ocean_carbon`, `msp`, `arctic` (deprecated aspirational slugs) while all other sources had moved to `wto_fisheries`, `cites_marine`, `plastics`, `offshore_wind`. 295+ stories carried incorrect/deprecated cross_tracker_flags for months before detection.

### Blue Finance Pulse Score Data Contamination

- **Blue Finance Pulse Score pre-backfill was built on contaminated data.** 21 stories incorrectly tagged `blue_finance`, mostly aquaculture VC rounds and fisheries subsidies that are not TNFD/blue bond instruments. Score will drop after backfill, which is correct per PULSE_SCORE_METHODOLOGY.md §6. Additionally: `velocity.ts` queries `topic IN ['blue-finance', 'esg']` but DB topic value is `bluefinance` (no hyphen) — near-zero topic matches, so blue-finance velocity was already undercooked regardless of cross_tracker_flags.

### IMO Shipping Pulse Score Data Contamination

- **IMO Shipping Pulse Score pre-backfill included 94 geopolitical shipping stories (Hormuz, naval deployments, cruise incidents) that are not IMO regulatory activity.** The published 70% TPR in PULSE_SCORE_METHODOLOGY.md §5 was measured on contaminated classifier output and needs re-validation against cleaned data. Note: velocity.ts uses `topic = 'shipping'` for the count — Hormuz stories have `topic = 'shipping'` so they still affect velocity regardless of the cross_tracker_flags backfill. Fixing velocity accuracy requires either: (a) tightening title keyword regex, or (b) using cross_tracker_flags for velocity (architectural change).

### Feed Coverage — Thin Tracker Domains

- **offshore_wind (4 stories/30d), cites_marine (3), plastics (1) appear structurally under-covered.** These were formerly coded as impossible to tag (old prompt used deprecated slugs). Low story counts will cause structurally noisy velocity scores regardless of classifier quality. Verify whether RSS feed sources cover these domains adequately — if not, add targeted sources before treating their Pulse Scores as reliable signals.

### Velocity Query Path — Clean Data Must Be Read by Consumers

- **velocity.ts queried on `stories.topic`, not `cross_tracker_flags`. Cleaning the classifier without redirecting the score query path meant the backfill had no effect on Pulse Scores. The cleaned data must be read by the consumers that need it.** After the May 2026 cross_tracker_flags backfill (235 corrections), velocity scores still reflected contaminated data because `calculateVelocityScore()` was fetching by `topic IN [...]` — a coarse RSS source tag that is: (a) contaminated for `bluefinance` (returns ESG/energy stories), (b) too broad for `shipping` (includes 94 Hormuz/naval stories), and (c) simply absent for 5 trackers. Fixed 2026-05-11: velocity.ts now uses `.contains('cross_tracker_flags', [flag])`. Rule: any consumer of tracker-scoped data must read from the same source that the classifier writes to.

### Blue Finance — Topic Tag Data Quality

- **DB `topic='bluefinance'` does not mean "ocean blue finance."** The 89-source RSS feed includes an ESG/clean energy source tagged `bluefinance` in sources.ts. Result: 63 stories in last 30d matching `topic='bluefinance'` include "Bad Bunny's Backstage Hedge to Beat Bad Weather" and "Iran War Is Forcing a Reckoning on Energy Demand." The cross_tracker_flags path (AI-verified) shows 1 genuine blue finance story in the same window. Never trust source-level topic tags for meaning — they reflect the feed slot, not the content.

### 30x30 Classifier — False Positive Classes to Exclude

- **First clean 30x30 spot-check (2026-05-11): 7 of 12 stories legitimate (58% TPR — within documented 55-75% range). 4 clear false positives identified. 7.4 ELEVATED score is slightly inflated but within calibrated noise tolerance.** Three structural false positive classes need adding to the score-significance 30x30 prompt exclusions: (1) General conservation science/ecology papers that mention protection as context (tipping points, climate-adaptation studies) — exclude unless a specific new designation is described; (2) BBNJ/CBD/treaty meeting summaries where MPA conservation appears as background — those belong to `bbnj` tracker; (3) Enforcement operations in existing MPAs (Sea Shepherd patrols, IUU enforcement inside national parks) — those belong to `iuu` tracker. Prompt tightening queued for next cycle; too late to backfill before 06:30 UTC cron. The Ghana MPA designation appeared twice (Mongabay + Undercurrent News) — same event, two legitimate rows.

### Morning Brief — Structural Feed Duplication

- **stories table has structural duplication: same real-world event, multiple rows from different press releases.** The Canada $957.8M Small Craft Harbours announcement surfaced as 6 DFO press release rows (3 on the same day, different officials quoted). These are not near-duplicates at the text level — headlines differ enough to pass word-overlap dedup — but they represent one event. This pattern surfaces in: feed (same story appears multiple times), brief lead+evidence dedup (anchor-based filter needed as workaround), and workspace context (entity signal noise). **Canonical clustering is the structural fix**: hash on `(entity_set + dollar_figure + date_window)` at ingest, or post-hoc event-cluster table. Workaround (anchor-based dedup in selectEvidence) is in place but does not address the root cause.

---

## 2026-05-07 (auto-attach pipeline verification)

### Migration Tracking

- **Migration files marked 'pending Studio apply' must be tracked until confirmed applied.** `supabase/migrations/20260505_matched_entity_id.sql` was committed to the repo but never run in production, leaving auto-attach silently broken for 24+ hours. After applying any migration in Studio, run a verification SELECT immediately and update SPEC.md with the confirmed date.

### Silent Swallow Anti-Pattern

- **Don't trust "matched: N" from functions with internal error handling — verify against the database.** `matchEntitiesToStory` had an inner try/catch that swallowed upsert failures and returned a success-shaped result. `fetch-feeds` saw `matched > 0` and set `entities_extracted: true`, while `project_auto_entries` got nothing. The function logged `console.error` inside the catch, but the outer caller never saw the failure. When a pipeline step claims success, verify the downstream table directly.

### Postgres ON CONFLICT and Partial Unique Indexes

- **Postgres `ON CONFLICT` requires the target to match a unique index exactly, including its WHERE predicate.** A partial unique index (`UNIQUE(project_id, story_id) WHERE story_id IS NOT NULL`) cannot be resolved by Supabase JS `.upsert()` with `onConflict: "project_id,story_id"` — Postgres rejects it with "there is no unique or exclusion constraint matching the ON CONFLICT specification". Fix: use plain `.insert()` and catch `error.code === "23505"` as a no-op for duplicates.

### Parallel Implementation Debt

- **Two parallel implementations of the same concept running simultaneously signals an incomplete migration.** Project entity association ran through both `projects.topic_tags` (string array, legacy) and `project_entities` table (new). Neither was fully deprecated. Before shipping new features in this area, audit all read/write paths for both systems.

### Synthetic Test Discipline

- **Synthetic test cleanup queries must be printed but not auto-executed.** Print the DELETE SQL at the end of the script, run it manually after reviewing the created data. Auto-executing rollbacks defeats the purpose of verifying what was created.

## 2026-04-30

### RSS Source Verification

- **RSS verification must check both that the feed returns valid XML AND that the items are actually about the expected topic** — The April 20 audit verified DG MARE returned HTTP 200 + valid XML + recent items, but did not verify the items were maritime/fisheries content. They were generic EU Commission press releases — the `?c=Maritime+Affairs+and+Fisheries` parameter is a category tag applied to the press release, not a filter that scopes feed output. Re-verification 9 days later caught this because we sampled actual item titles. Lesson: when adding a new RSS source, check 5 random item titles match the expected domain before committing. URL liveness is necessary but not sufficient.

- **SPEC.md "still unapplied" notes can go stale** — SPEC.md written on 2026-04-29 stated "RSS source maintenance from April 20 still unapplied" but all 4 valid source changes (NOAA parent, UK MMO, HELCOM, DFO Canada) were applied in commits on April 20 itself. At session start, cross-check SPEC.md known follow-ups against `git log --follow` on the relevant file before scoping the work — the changes may already be done.

### Supabase Count Queries

- **Supabase JS client count queries silently cap at 1,000 rows** — A `COUNT(column)` query or `select('*', { count: 'exact' })` without `head: true` on a table with >1,000 rows can return wrong results if the underlying query returns rows rather than the aggregate. Today, a diagnostic script suggested "96.9% of stories missing summaries, pipeline broken for 3 weeks" — the real number was 19.6% missing with a clean explanation (post-RSS-source-addition backlog). The fault was a count query hitting the row cap and producing a meaningless ratio. Lesson: when a count looks suspiciously high or low, verify directly in Supabase Studio (no row limit) before drawing conclusions. For programmatic counts in the JS client, always use `.select('*', { count: 'exact', head: true })` — `head: true` returns only the count, not rows, and bypasses the row cap.

### Bot-Block Strategy — Phase 1 (2026-05-13)

- **Phase 1 of bot-block strategy shipped.** Foundation utility built (`app/lib/http-client.ts`) and all 5 verification tests passing. No production scraper migrated yet. Canonical Tideline UA established. robots.txt compliance via robots-parser (24h cache, fail-open). Per-domain rate limiting (5s default, override list for OpenAlex/Jina/Google APIs). About-crawler public page deployed at `/about-our-crawler`. Next: Phase 2 migration of high-value direct-fetch scrapers (scraper-informea, scraper-un-library, scraper-ngo-reports direct fallback, queue PDF processor).

## 2026-05-20

### Determinism Proof vs Production Runtime (TWELFTH instance)

- **THIRTEENTH instance -- production was running a week-old commit (35c36a36) when "today's brief" outputs were being interpreted as evidence of the new gate working/failing.** Three days of brief work (Section 4 coherence fix, full category gate, ignoreDuplicates upsert fix) were all local-only, never pushed. The Step F GATE caught this exactly because it queried the production DB for category data and found none. RULE: every interpretation of production behaviour must be preceded by a check that production is running the code being attributed to it. Specifically: (a) git log origin/main..HEAD --oneline should return EMPTY before any "the deploy is live" claim. If non-empty, work is local-only and production attribution is wrong. (b) The runtime CATEGORY_PROMPT_VERSION (or equivalent hash for whatever mechanism) should be exposed in a /health endpoint or logged on every cron run, so the production hash can be verified against the local hash without needing to inspect deploy logs. (c) "Build clean + tests pass" is necessary but not sufficient for "the change is live" -- it only proves the local code is valid. A separate verification that the local code has been PUSHED and DEPLOYED is required before treating production output as evidence of the change.

- **TWELFTH instance -- the determinism proof's ARCHITECTURE was correct (temp 0, prompt-version invalidation, constraint-based dedupe) but its production RUNTIME has never worked.** The upsert used `ignoreDuplicates: true` while verb-era rows occupied the same `(story_id, prompt_version)` primary key for 44/60 stories. Every cache write silently dropped. Every run since deployment has been cold-start, classifications evaporated post-response, NO data persisted in `delta_classifications` under the category-era hash. The proof passed against test conditions that did not include verb-era PK collisions in the same DB. The eleventh lesson (verify against production artifact) is now sharpened: verification must include the actual data state the production DB is in, not just the production code path. A determinism proof that runs in a clean cache cannot detect a collision with rows from a previous mechanism. Determinism must be re-proven IN PRODUCTION after every mechanism change, by inspecting the actual `delta_classifications` table contents after a real send-brief run -- not by running a diagnostic script that happens to have a clean cache. Also: the local file and deployed code carried different prompt hashes for an unknown period, meaning local diagnostics were testing a different classifier than production was running -- this is an adjacent hygiene problem that must be added to the operational checklist.
