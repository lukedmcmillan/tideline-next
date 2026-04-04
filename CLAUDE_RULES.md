# CLAUDE_RULES.md

Rules that apply to every change made in this codebase. Do not deviate without explicit instruction.

## API Model Assignments

Every Anthropic API call must use the correct model for its task category.

**claude-haiku-4-5-20251001** (classification, scoring, structured output):
- `app/api/cron/blue-finance-agent/route.ts` - classify blue finance events
- `app/api/cron/generate-brief/route.ts` - quality gate review
- `app/api/cron/governance-agent/route.ts` - classify governance events
- `app/api/cron/project-populate/route.ts` - classify and generate project entries
- `app/api/cron/score-significance/route.ts` - score and classify story significance
- `lib/entities.ts` - entity extraction

**claude-sonnet-4-6** (interpretation, reasoning, drafting, research):
- `app/api/ask/route.ts` - research library /ask queries
- `app/api/cron/scrape-governance-calendar/route.ts` - governance calendar extraction (2 calls)
- `app/api/cron/summarise-pending/route.ts` - batch article summarisation
- `app/api/documents/generate-brief/route.ts` - Generate Report
- `app/api/research/inline/route.ts` - inline research with RAG
- `app/api/story/linkedin-draft/route.ts` - LinkedIn post drafting
- `app/api/summarise/route.ts` - on-demand article summarisation
- `app/api/threads/match/route.ts` - Crosscurrent connection detection
- `app/api/webhooks/treaty-change/route.ts` - treaty change assessment
- `app/api/workspace/narrative/route.ts` - intelligence thread narrative

Do not change a route's model without confirming which category the task falls into. If unclear, leave as-is and add a comment: `// TODO: Review model assignment`.

## Prompt Caching

These files have `cache_control: { type: "ephemeral" }` applied to static system prompt blocks. The static portion is separated from per-request dynamic content using structured content blocks.

- `app/api/ask/route.ts`
- `app/api/cron/blue-finance-agent/route.ts`
- `app/api/cron/generate-brief/route.ts`
- `app/api/cron/governance-agent/route.ts`
- `app/api/cron/project-populate/route.ts`
- `app/api/cron/score-significance/route.ts`
- `app/api/cron/scrape-governance-calendar/route.ts`
- `app/api/cron/summarise-pending/route.ts`
- `app/api/research/inline/route.ts`
- `app/api/story/linkedin-draft/route.ts`
- `app/api/summarise/route.ts`
- `app/api/threads/match/route.ts`

When adding or modifying a system prompt longer than 200 tokens that is identical across requests, apply caching by splitting into a static cached block and a dynamic block.

## Design Rules

- Brand colour: `#1D9E75` (teal). Use this everywhere. No blue (`#1a73e8`) anywhere.
- No em dashes. Use commas, full stops, colons, or restructure the sentence. Zero em dashes permitted in any file.
- Inline styles only in JSX. No Tailwind utility classes.
- Fonts: DM Sans (body), Georgia (serif headlines), DM Mono (monospace). Google Sans on landing page only.

## CTA Buttons

Never change button labels, `onClick` handlers, or `href` attributes on the landing page or any signup flow without explicit instruction. These are wired to email capture and payment flows. Changing them silently breaks conversion.

## Landing Page

Never modify `app/page.tsx` without explicit instruction from the user. This file contains the marketing landing page and every word, layout choice, and section order has been deliberately set.
