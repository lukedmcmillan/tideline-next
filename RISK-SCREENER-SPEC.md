Ocean Governance Risk Screener: output schema, buyer critique, and table protections
Version 1.0, July 2026. Companion to DATA-LICENSING-DESIGN.md Section 5. This file defines the export format that becomes the first licensing contract, then attacks it from the buyer's side, then fixes it. Section 5 lists the additive-only changes needed in production tables NOW so the 2029 export requires no migration.

PART 1: THE SCHEMA (v1 DESIGN)
1.1 The product shape
The screener is a weekly, versioned, point-in-time flat-file export (CSV/Parquet now, API later) in three layers:

Indicator file: one row per entity x domain x as_of_date. The thing that drops into a buyer's workflow next to RepRisk RRI columns.
Evidence file: the provenance rows backing every indicator. One row per contributing signal.
Reference files: entities, external identifiers, entity lineage, domains, methodology versions.

Grain and cadence align to the Pulse run: Mondays 06:00 UTC. as_of_date is the knowledge cutoff; generated_at is the calculation time. These are never the same field (DATA-LICENSING-DESIGN rule 4).
1.2 The headline indicator: OGX (Ocean Governance Exposure), 0-100
RepRisk-comparable in structure: a bounded index, a peak value, a trend, and decomposable components. Deterministic assembly over stored values, per the governing principle (TIDELINE-MASTER 4.1). No model output enters the composite at export time.
OGX = clamp( (E x 0.50) + (R x 0.30) + (C x 0.20), 0, 100 )

E  (Event pressure, 0-100):     severity- and recency-weighted classified
                                 events linking this entity to this domain.
                                 Half-life decay, 90 days. Enforcement-class
                                 events weight 2x governance-change events.
R  (Regulatory climate, 0-100): the domain's Pulse score x 10 at as_of_date.
                                 Institutional multiplier already applied
                                 inside Pulse; not applied twice.
C  (Contestation, 0-100):       max divergence composite involving this
                                 entity in the domain, x 10, half-life decay
                                 30 days from detected_at.
Weights are versioned constants, published, and changeable only via a new methodology version. All three components are stored per row, so every OGX value is reproducible from its own row forever (rule 3).
1.3 Indicator file: screener_scores
ColumnTypeNotesschema_versiontexte.g. 1.0methodology_versiontextPulse + screener methodology in force at calculationas_of_datedateknowledge cutoff, UTCgenerated_attimestamptzcalculation time, UTCentity_iduuidstable Tideline ID, survives renamesentity_nametextdisplay name at as_of_dateentity_typetextCOMPANY / FUND / TREATY / NGO / VESSEL / BODYdomain_slugtexttracker sluginstitutional_typetextfrom published taxonomy (incl. Type 6)ogxnumeric(5,1)0-100 compositeogx_peak_365dnumeric(5,1)highest OGX in trailing yeartrend_90dtextRISING / STABLE / FALLING (threshold-defined, versioned)component_enumeric(5,1)stored, reproduciblecomponent_rnumeric(5,1)storedcomponent_cnumeric(5,1)storedpulse_scorenumeric(3,1)domain Pulse at as_ofpulse_bandtextLOW / WATCH / ELEVATED / HIGHevent_count_30d / 90d / 365dintclassified events linking entity to domainenforcement_count_365dintenforcement-class subsetdivergence_count_activeintundismissed divergences involving entitydivergence_max_scorenumeric(3,1)max composite, activecontested_flagbooleanany active divergence >= 6.0source_count_90dintdistinct sources contributingsource_type_mixjsonb{GOV: n, NGO: n, ACADEMIC: n, PRESS: n}coverage_statustextCOVERED / THIN / NOT_COVERED (see 3.2)confidence_tiertextA / B / C, derived from source count + type mix
1.4 Evidence file: screener_evidence
One row per contributing signal per indicator row. Columns: entity_id, domain_slug, as_of_date, evidence_type (STORY / DOCUMENT / DIVERGENCE / PULSE_COMPONENT), evidence_id (FK to source table), event_date, detected_at, source_name, source_type, source_url, classification, classifier_version, contribution_weight. This is the "provenance on every row" requirement made literal: a buyer can rebuild any OGX from its evidence rows and the published formula.
1.5 Reference files

entities: entity_id, canonical name, type, aliases, first_seen, status.
entity_identifiers: entity_id, id_type (LEI / ISIN / IMO / MMSI / FLAG_REG / DUNS), id_value, valid_from, valid_to. THE join key to the buyer's universe.
entity_successions: predecessor_id, successor_id, relation (RENAMED / MERGED / ACQUIRED / SPUN_OFF), effective_date. TMC / DeepGreen / NORI is the live example.
domains: slug, name, institutional type, multiplier, calibration status, threshold, published hit rate.
methodology_versions: version, effective_from, changelog, formula constants. Every score row joins to the version in force when calculated.


PART 2: THE BUYER'S DUE DILIGENCE (RED TEAM)
Role: due diligence lead at an ESG data major evaluating this dataset for licensing or acquisition, 2029. Questions in the order they would kill the deal.
D1. Identifier mapping (dealbreaker). "Your entity_id is internal. I have 9,000 portfolio companies keyed on ISIN and LEI. If I cannot join your file to my universe in one pass, this dataset does not exist for me. What fraction of your company entities carry an LEI or ISIN? Vessels an IMO number?" v1 weakness: entity_identifiers is designed but the current production entity table has no external-ID capability at all. 930 entities with zero LEIs is a demo, not a dataset.
D2. Coverage semantics (silent killer). "Entity X has no row. Is that 'no ocean governance risk' or 'you never looked'? If your file cannot distinguish absence-of-risk from absence-of-coverage, every screen my clients run on it is silently wrong, and that is a liability I will not license." v1 fix already present (coverage_status), but the rule must be absolute: a NOT_COVERED row is emitted for every entity in the delivered universe, never an implicit zero.
D3. Point-in-time integrity. "Prove that the row dated 2027-03-01 was computed only from information detectable before 2027-03-01. Backtest contamination is the most common fraud in ESG data. Where is detected_at versus event_date on every evidence row, and what is your restatement policy?" v1 weakness: the schema carries both timestamps, but the production stories table must actually record ingest time distinct from published time, and it must have done so from the start of the series. If detection timestamps were never stored, point-in-time claims are unverifiable and the pre-2029 history is worth a fraction of its face value.
D4. Entity lineage and survivorship. "Company renamed in 2028. Does its 2026 history survive under the new identity? Do dissolved entities stay in the file? A dataset that silently drops dead entities has survivorship bias and I will find it in the first week."
D5. Methodology version comparability. "You went from methodology 1.1 to 2.0 in 2027. Are scores comparable across the break? Did you parallel-run? Never rewriting history is correct, but a series with an undocumented regime change in the middle is two short series pretending to be one long one."
D6. Source bias, disclosed. "English-only sources. Your own Pulse methodology admits non-Anglophone undercounting. That means systematic underscoring of, say, East Asian flag states versus European ones. Where is the per-entity source-language and source-concentration disclosure? I would rather license a biased dataset that measures its bias than a clean-looking one that hides it."
D7. Severity validation. "Pulse publishes hit rates. OGX does not. What does 72 mean? Show me the entity-level validation: did high-OGX entities go on to experience enforcement actions, licence losses, contract suspensions at a higher rate than low-OGX entities? Without this, OGX is an activity counter wearing a risk costume."
D8. Model dependence and reproducibility. "Your classifier is a third-party LLM. When the model version changes, classifications drift, and your time series has an invisible seam. Is classifier_version stamped on every classified row from day one? Can you re-run 2026 stories through the 2026 classifier?" v1 weakness: classifier_version exists in the evidence schema but not, currently, in the production stories pipeline.
D9. Legal exposure on person entities and negative signals. "You are scoring named companies, and your entity types include PERSON. Named-individual risk scores in the EU is GDPR territory RepRisk spends serious money managing. What is your right-of-reply process, your correction process, and your defamation posture on enforcement-class classifications that later prove wrong?"
D10. Divergence semantics. "Contestation as a risk component is genuinely novel, and it is the thing I cannot get elsewhere. But: a dismissed divergence, is it resolved-false or just aged out? Your auto-dismiss at 14 days conflates the two. If contestation feeds a risk score, its resolution state must be typed, not just timestamped."
D11. Operational continuity. "Solo founder, weekly cron. Show me the run log proving the series has no gaps. A hole in the winter of 2027 because a cron died silently is a permanent defect in the asset." The OPS-RUNBOOK cron_runs heartbeat is not just ops hygiene; it is continuity evidence for this exact question.
D12. Rights. "Confirm the export contains zero verbatim third-party article text. Derived scores, your classifications, your entity registry: licensable. Snippets of Reuters: not."

PART 3: THE SCHEMA, FIXED (v1 → v1.1 DELTAS)
3.1 (fixes D1) entity_identifiers promoted from reference file to required production table. Target: LEI or ISIN on 100% of COMPANY/FUND entities in any delivered universe; IMO on all vessels. Coverage of the buyer's join keys is itself a reported metric in every delivery.
3.2 (fixes D2) coverage_status becomes mandatory and three-valued with hard definitions: COVERED (>= 3 distinct sources in 365d), THIN (1-2 sources; OGX delivered with confidence_tier C and a thin-coverage flag), NOT_COVERED (row emitted, ogx null, never zero). Zero is a measurement; null is an admission. The file never confuses them.
3.3 (fixes D3) detected_at is required on every evidence row and every classified story from now on. Screener computation reads only evidence where detected_at <= as_of_date. Restatements are new rows carrying supersedes_id; the superseded row keeps its original values forever.
3.4 (fixes D4) entity_successions promoted to production table. entity_id never changes on rename; successions carry merge/acquisition lineage. Dissolved entities get status DISSOLVED and remain in every historical file.
3.5 (fixes D5) methodology changes ship with a mandatory 8-week parallel run: both versions calculated and stored, published crosswalk note. The series is then honestly segmentable rather than deceptively smooth.
3.6 (fixes D6) two disclosure columns added per indicator row: source_language_mix (jsonb) and top_source_share (numeric: largest single source's share of evidence). Bias measured beats bias hidden. This is the Pulse honesty posture extended to the entity level, and per SALES-PLAYBOOK it is also the pitch.
3.7 (fixes D7) an annual OGX validation file becomes part of the product: for each OGX decile, the observed rate of subsequent enforcement-class events in the following 180 days. This is the entity-level analogue of the published Pulse hit rates, and until two years of it exist, marketing language for the screener says "exposure indicator", never "predictive risk score".
3.8 (fixes D8) classifier_version and model_id stamped on every classified story and every divergence score row from now on. Model migrations get a 4-week dual-classification overlap on a sample, with drift stats retained.
3.9 (fixes D9) PERSON entities excluded from the licensed export in v1 entirely. Companies only until a right-of-reply and correction process exists in writing. A published corrections policy (annotation rows, never overwrites) ships with the first delivery.
3.10 (fixes D10) divergences gain resolution_type: SUPERSEDED (one source corrected), CONVERGED (sources aligned), EXPIRED (aged out), DISMISSED_MANUAL. Auto-dismiss at 14 days writes EXPIRED. Contestation decay in component C treats CONVERGED as resolved and EXPIRED as unknown, at different decay rates.
3.11 (fixes D11) cron_runs heartbeat table built (already an OPS-RUNBOOK backlog item), retained forever, and included in due diligence packs as continuity evidence.
3.12 (fixes D12) the export pipeline has a structural rule: no column in any delivered file may contain source article body text. Claims fields (source_a_claim etc.) are Tideline-authored summaries and are flagged as such in the data dictionary.

PART 4: WHAT THE v1.1 SCHEMA IS, IN ONE PARAGRAPH
A weekly point-in-time file, one row per entity per domain, carrying a 0-100 exposure composite that is deterministically assembled from three stored components (event pressure, regulatory climate, contestation), joined to the buyer's universe through LEI/ISIN/IMO, honest about coverage through a three-valued status, reproducible through a full evidence layer with dual timestamps and classifier versions, comparable across methodology changes through parallel runs, and validated annually against observed enforcement outcomes. The contestation component is the thing no incumbent has; everything else is the credibility scaffolding that lets a buyer trust it.

PART 5: ADDITIVE-ONLY CHANGES TO PRODUCTION TABLES, NOW
Ordered by urgency. All additive: new columns nullable or defaulted, new tables, no renames, no retypes, no rewrites. Everything here is plan-mode-zone per CLAUDE-RULES 6 and DATA-LICENSING-DESIGN 3.
P1. divergences: add the four dimension score columns BEFORE Phase 1 builds.
score_factual numeric(3,1), score_conclusion numeric(3,1), score_framing numeric(3,1), score_authority numeric(3,1), plus classifier_version text, resolution_type text, supersedes_id uuid.
The CONFLICTS-PAGE-SPEC schema stores only the composite. DATA-LICENSING-DESIGN rule 3 requires the components. Divergence detection is priority 4 and not yet built: adding these columns to the spec now costs one edit; adding them after the series starts means the crown-jewel table opens with irreproducible rows. This is the single most time-sensitive item in this file.
P2. stories: add detected_at timestamptz default now() (if ingest time is not already stored separately from published_at), classifier_version text, source_type text (GOV/NGO/ACADEMIC/PRESS, the same taxonomy divergences uses).
Every week that passes without detected_at is a week of history that can never make the point-in-time claim. If an ingest timestamp already exists under another name, document the mapping in this file and stop; do not add a duplicate.
P3. New table entity_identifiers (entity_id, id_type, id_value, valid_from, valid_to, unique on type+value). Backfill opportunistically: IMO numbers for vessels and LEIs for the largest ~100 companies are afternoon-sized jobs, and D1 is the dealbreaker question.
P4. New table entity_successions (predecessor_id, successor_id, relation, effective_date, note). Cheap now, unbackfillable later: nobody will remember 2026's renames in 2029.
P5. New table cron_runs (job_name, started_at, finished_at, rows_affected, error). Already wanted by OPS-RUNBOOK Section 4 for liveness; doubles as the continuity evidence for D11. One small build, two files satisfied.
P6. velocity_scores: add methodology_version text. Backfillable today because the version history is known (v1.1 to date; v1.2 pending per TIDELINE-MASTER 4.3). Confirm component values and calculated_at are stored per run (methodology Section 8 says they are; verify against a production row, not this document).
P7. Entity-story link rows: ensure the linkage carries its own detected_at and the mention snippet is Tideline-authored, not verbatim source text. Verify current shape before assuming; if mentions store verbatim quotes today, that is a D12 problem to fix at write time going forward, not retroactively.
None of these change any application behaviour. Together they are the difference between the 2029 dataset being exportable and being rebuilt.
