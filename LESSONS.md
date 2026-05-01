# Lessons Learned

## Significance scoring — wide topic variance (filed 2026-05-01)

Significance scoring shows wide variance by topic. governance averages 13/100, dsm averages 29.5, iuu averages 4.5. Either the score-significance prompt is harsh on enforcement-focused content (which IUU mostly is), or the topic genuinely has low-significance news. Worth auditing the prompt. Currently not blocking — relative ranking within user topics still works for selection.

## Candidate window — 48h is too narrow for low-volume topics (filed 2026-05-01)

With topics like dsm and iuu, 48h yields 0-1 stories. Widened to 7 days. Tradeoff is age of content, mitigated by sorting by significance_score desc within the window. Most-significant 7-day story beats most-recent empty brief.

## TRACKER_TO_TOPICS — coarse topic buckets causing content bleed (filed 2026-05-01)

TRACKER_TO_TOPICS map is coarse. plastics → governance, bbnj → governance, 30x30 → governance all share the same topic bucket, so selectLead may surface BBNJ stories to plastics-tracker subscribers. Fix paths: (a) extend AI tagging prompt to use granular topic values (plastics, biodiversity, deep-sea-mining as distinct topics rather than all falling under governance), then retag historical stories — heavier fix; (b) add substring filter post-topic-match — story.title or story.short_summary must contain at least one keyword associated with the user-tracked tracker — lighter fix, less robust. Not blocking Phase 4 launch. Surface and revisit after first week of real subscriber data.

## Dual summarisation — architectural debt (filed 2026-05-01)

Generate-brief and summarise-pending both call Haiku to summarise stories. Generate-brief produces 2-sentence editorial format. Summarise-pending produces longer factual format. Same story can have different summaries depending on which system reads it. Cost is doubled (both crons summarise the same stories). Consolidate into single summarisation pipeline once brief is stable in production. Estimated work: medium. Not blocking.

## Lead selection — absolute significance thresholds fail on low-score topics (filed 2026-05-01)

selectLead needs relative thresholds, not absolute. Implemented three modes: story-led (max sig >= 50), hybrid (pool not empty, max sig < 50), state-led (empty pool). This ensures a brief always has a lead.

## LLM-generated copy needs explicit voice guardrails (filed 2026-05-01)

Haiku summarisation was producing consultant-register prose ('face expanded documentation requirements', 'bifurcating compliance requirements', 'requires repricing of assets') — closer to McKinsey output than Tideline's editorial register. Templates and tone instructions alone are insufficient. Every LLM prompt that produces user-facing copy must include: (a) a banned-phrase list with concrete examples, (b) a named target register ('source's own language'), (c) an explicit non-escalation rule ('if the source says guidance, write guidance'). Added to SUMMARY_SYSTEM_PROMPT 2026-05-01.
