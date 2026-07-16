Protecting and building the asset that gets sold
Version 1.0, July 2026. Referenced by TIDELINE-MASTER.md 1.2 and 4.4. Read by Claude Code before any migration touching an export-grade table.

1. Why this file exists
The £5m exit thesis rests on one structural milestone: at least one API or data licensing contract by Year 5. Data infrastructure sells at 6-10x revenue; a media property sells at 2-4x. The difference between those multiples is decided by schema and provenance decisions being made right now, in 2026, mostly by Claude Code sessions that will never think about 2031 unless a file makes them.
This file names the tables that constitute the licensable asset, the rules that protect them, and the wedge product that converts them into the first contract.

2. The export-grade tables
These tables are the asset. Everything else is the application.
TableLicensable dataset it becomesStatusvelocity_scoresPulse Score time series per domain: a regulatory activity index with published methodology, weekly since inception, with component-level breakdownLive, weekly since launch of scoringdivergencesSource conflict time series: which authoritative sources contradicted each other, on what, scored, with typed source classification (GOVERNMENT/NGO/ACADEMIC/PRESS)Table designed, detection not yet running (priority 4)Entity system tables~930-entity ocean governance registry with alias resolution, linkable to stories, scores, and conflictsLivestories (+ classifier output)Classified event stream: GOVERNANCE_CHANGE events with tracker tags, significance scores, entitiesLivedocuments / document_chunks7,700-document treaty and regulatory corpus with embeddings. Licensable only as derived products, not raw (source copyright)Live
The compounding rule: never delete, always dismiss/version. Historical rows are the time series and the time series is the value. dismissed_at over deletion, retention over cleanup, everywhere in these tables. A five-year unbroken Pulse series is worth more than the same series with gaps; gaps cannot be backfilled later.

3. Schema stability rules (Claude Code: these are plan-mode-zone, always)

Additive-only changes to export-grade tables. New columns are fine. Renaming, retyping, or dropping columns on velocity_scores, divergences, stories, or entity tables requires an explicit migration proposal to Luke with the licensing impact stated.
Never rewrite history. No UPDATE that changes historical score values, historical classifications, or historical divergence records. Corrections happen as new rows or flagged annotations, never as silent overwrites. A licensee buying a time series is buying the claim that it was not retroactively edited.
Every scored row must be reproducible in principle. velocity_scores already logs component values per run; keep that pattern for divergences (store the four dimension scores, not just the composite). The methodology document plus the component values is what makes the dataset defensible to an expert buyer.
Timestamps in UTC, always, with the calculation time distinct from the event time.
The published methodology must match the live product. The Pulse methodology page is a licensing prospectus in disguise. The current mismatch (Type 6 multiplier 0.80 not in the published four-type table; 11 trackers vs published 10) is exactly the kind of discrepancy a buyer's due diligence finds. Fix per TIDELINE-MASTER.md 4.3.


4. What makes this data licensable (the buyer's checklist)
An ESG data major or maritime intelligence buyer evaluating this dataset will ask:

Provenance: where did each signal come from? (Source URL, source name, source type on every row. Already the pattern; keep it.)
Methodology: is the scoring documented, versioned, and honest about failure modes? (Yes: the Pulse methodology with published hit rates is the strongest asset in the company. Version every methodology change; score rows should be interpretable against the methodology version in force when calculated.)
Continuity: is the series unbroken and unedited? (Rules 1-2 above.)
Uniqueness: does anyone else have this? (No one scores source divergence on ocean governance. That table is the crown jewel; the strategic note in TIDELINE-MASTER.md 4.4 stands: design it for time-series export from day one.)
Rights: can Tideline actually license it? (Derived scores, classifications, and the entity registry are Tideline's IP. Raw scraped article text is not. Licensed products are always the derived layer.)


5. The wedge: risk screener output
The first licensing contract will not be "buy our database." It will be risk screener output in a RepRisk/Refinitiv-comparable format: per-entity, per-domain ocean governance risk indicators built from Pulse scores, divergence history, and classified events. High-value survey respondents independently specified this format; Jonny Hardaker (ex-RepRisk) is the format critic; Titia Sjenitzer's offered proprietary data partnership is a potential two-way data deal that strengthens the asset.
Sequence:

Now to launch: protect the tables (rules above), fix the methodology mismatch, ship divergence detection so its series starts accumulating.
Post-launch 2027: LP briefing PDF as the manual, human-readable prototype of the screener. Every LP briefing sold is evidence of the data's commercial value.
2028: define the screener output schema (per-entity risk indicators, versioned, documented) and pilot it as a flat-file export with one corporate customer.
2029-2031: API access to the screener output and Pulse/divergence time series. First licensing contract. This is the valuation event.


6. Decision filter addendum
TIDELINE-MASTER.md 1.2 asks of every feature: does it move toward licensable data? The concrete version:

Does it write structured, scored, provenance-carrying rows into an export-grade table? → toward.
Does it produce prose a human reads once? → neutral at best.
Does it risk breaking continuity, provenance, or methodology consistency of an export-grade table? → away, and plan-mode-zone.