# Project Index: Tideline

Generated: 2026-05-06 | Next.js 16 · React 19 · TypeScript · Supabase · Tailwind v4

---

## 📁 Directory Structure

```
tideline-next/
├── app/
│   ├── api/              # Route handlers (100+ endpoints)
│   │   ├── cron/         # 20 scheduled jobs (Vercel cron)
│   │   ├── admin/        # Admin-only routes
│   │   ├── webhooks/     # Supabase/Stripe event receivers
│   │   └── ...           # Feature endpoints
│   ├── lib/              # Shared server-side modules
│   │   ├── brief/        # Morning brief pipeline (select, template, utils, quick-asks)
│   │   ├── onboarding/   # Starter sets per job_type
│   │   ├── types/        # Shared TypeScript types
│   │   └── welcome/      # Welcome screen data/rules
│   └── platform/(shell)/ # Authenticated pages (layout with sidebar)
├── scripts/              # Manual one-off scripts (embed, backfill, scrape)
├── supabase/migrations/  # 50+ SQL migration files
├── __tests__/            # Vitest tests (1 file: entity-matching idempotency)
└── components/           # Shared React components (Header, etc.)
```

---

## 🚀 Entry Points

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page (LandingClient + LandingClientMobile) |
| `/login` | Magic link sign-in |
| `/onboarding` | 4-step onboarding (job type → entities → brief time → confirm) |
| `/subscribe` | Stripe Elements checkout |
| `/platform/feed` | Main authenticated feed |
| `/platform/workspace` | Workspace with projects + entity watcher |
| `/platform/projects/[id]` | Project detail + draft editor (TipTap) |
| `/platform/tracker/*` | 11 tracker pages (BBNJ, ISA, IMO, 30x30, etc.) |
| `/platform/library` | Community document library |
| `/platform/research` | RAG-powered research interface |
| `/platform/lp-briefing` | LP Portfolio Intelligence Briefing |

---

## 📦 Core Modules (`app/lib/`)

| Module | Purpose |
|--------|---------|
| `auth.ts` | `getEmailFromSession()` — JWT extraction via `getToken()` with `secureCookie` derivation from `NEXTAUTH_URL` |
| `brief/select.ts` | Story selection for morning brief (selectLead, selectEvidence, selectTrackers) |
| `brief/template.ts` | HTML email renderer (`compileBriefHtml`) |
| `brief/utils.ts` | Score formatting, label maps, dedup logic |
| `brief/quick-asks.ts` | Rotating 10-question library for brief footer |
| `sources.ts` | 89 RSS sources + 14 Jina scrapers |
| `velocity.ts` | Pulse score computation from story significance |
| `signal-generation.ts` | 4 signal generators (band_crossing, countdown, convergence_spike, high_sig_story) |
| `ocean-relevance-gate.ts` | Haiku classifier for feed quality (~25-28% quarantine rate) |
| `entity-matching.ts` | 3-pass matcher: exact substring → fuzzy trigram → semantic embedding |
| `jina.ts` | Article scraping via Jina API |
| `html.ts` | HTML extraction utilities |
| `confidence.ts` | Source confidence scoring |
| `embeddings.ts` | Jina v2 embedding calls (768 dims) |
| `search.ts` | Vector + full-text search |
| `subscription.ts` | Subscription status helpers |
| `tracker-metadata.ts` | Tracker config (slugs, display names, topics) |
| `trackers.ts` | Tracker data fetching |
| `user-preferences.ts` | User topic/entity preference helpers |

---

## ⏱ Cron Jobs (`app/api/cron/`)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `fetch-feeds` | Hourly | RSS aggregation from ~89 sources |
| `harvest-scraped-sources` | Every 6h | Jina scrape (IMO, ISA, FAO, IUCN, CBD, BBNJ) |
| `scrape-governance-calendar` | Mon 3am UTC | 10 body meeting pages → governance_events |
| `score-significance` | Daily | Story significance scoring |
| `velocity-scores` | Daily | Pulse score computation per tracker |
| `generate-brief` | Weekdays | Pool 60 stories → structured JSONB to brief_buffer |
| `send-brief` | Weekdays 7am | Per-user brief rendering + Resend delivery |
| `threshold-alerts` | Hourly | User alert threshold checks |
| `embed-documents` | Daily 3am | Document chunk embedding (SILENT BUG: newest 100 only) |
| `summarise-pending` | Periodic | Haiku summaries for un-summarised stories |
| `generate-connections` | Daily | Story → entity connection inference |
| `project-populate` | Triggered | Auto-populate project with matching stories |
| `monitor-sources` | Daily | RSS health monitoring |
| `source-health` | Daily | Source health snapshot |
| `blue-finance-agent` | Weekly | Blue finance data aggregation |
| `governance-agent` | Weekly | Governance event enrichment |
| `scrape-isa` | Daily | ISA contractor data |
| `scrape-psma` | Weekly | PSMA treaty status |
| `conversion-triggers` | Hourly | Trial conversion event tracking |
| `generate-embeddings` | Daily | Story embedding generation |

---

## 🗄 Key Database Tables

| Table | Purpose |
|-------|---------|
| `public.users` | subscription_status, topics (jsonb), job_type, brief_time, onboarded_at |
| `public.stories` | title, link, topic, significance, alert_type, entities_extracted |
| `public.entities` | 942 entities, name, entity_type, embedding vector(768), mention_count |
| `public.entity_mentions` | match_score, match_method, confidence, significance |
| `public.entity_aliases` | alias_text with trigram index |
| `public.projects` | user workspace projects; `last_viewed_at` column updated by `touch_project_viewed` RPC |
| `public.project_entities` | entities attached to projects (watcher config) — new 2026-05-05 |
| `public.project_auto_entries` | stories auto-matched to projects via entities |
| `public.velocity_scores` | tracker_slug, band, score, interpretation |
| `public.governance_events` | 10 body meetings with expected_decisions |
| `public.brief_buffer` | Structured JSONB brief candidates per day |
| `public.signal_events` | Feed events for dashboard signal display |
| `public.alert_sends` | Threshold alert delivery log |
| `public.document_queue` | Manual pipeline (drained by processor-agent.ts) |
| `public.treaty_ratifications` | BBNJ change log with pg_net trigger |
| `public.lp_portfolios` | LP fund portfolios (5 seeded funds) |

---

## 🔧 Configuration

| File | Purpose |
|------|---------|
| `vercel.json` | Cron schedules + serverExternalPackages (pdfkit) |
| `next.config.ts` | Next.js config |
| `middleware.ts` | Auth gate for `/platform/*` and `/tracker/*` |
| `vitest.config.ts` | Test config with `@/` path alias |
| `.env.local` | All secrets (never commit) |
| `CLAUDE.md` | Coding rules + architecture reference |
| `MESSAGING_HOUSE.md` | Copy rules (read before any UI work) |
| `.claude/SPEC.md` | Live session state + next steps |
| `tasks/lessons.md` | Engineering lessons + gotchas |

---

## 🔌 External Services

| Service | Use |
|---------|-----|
| Supabase | DB + pgvector + pg_net triggers |
| NextAuth v4 | Google OAuth + magic link JWT sessions |
| Anthropic Claude | Haiku (bulk/briefs), Sonnet (summaries/governance) |
| Resend | Transactional email delivery |
| Stripe | Subscriptions + webhooks (5 events) |
| Jina | Article scraping + v2 embeddings (768d) |
| Vercel | Hosting + cron jobs |
| Mastra | RAG pipeline (library search) |
| TipTap | Rich text editor (project drafts) |
| D3 + Chart.js | Data visualisations on tracker pages |

---

## 🔑 Active Issues (2026-05-07 close-out)

1. **ENTITY PICKER ACRONYM SEARCH** — Typing `iwc`, `isa`, `bbnj` returns no results. Picker searches `entities.name` only; does not query `entity_aliases`. Next session P1.
2. **embed-documents cron** — Silent window bug: only processes newest 100 docs; stalls once those are embedded.
3. **document_queue** — No Vercel cron; manual drain only via `scripts/processor-agent.ts`.
4. **ISA Secretariat tracker_tag = null** — May prevent correct routing of ISA stories through auto-attach. Needs audit.
5. **StoryDrawer fetch race** — Fast clicks on different story cards can race; drawer may show wrong content. Fix: AbortController keyed to storyId.

### Shipped 2026-05-07 (this session)
- `matched_entity_id` column applied to production (`project_auto_entries`)
- `lib/entity-matching.ts` ON CONFLICT bug fixed → plain insert + 23505 catch
- Auto-attach pipeline VERIFIED: synthetic PASS + 4 real stories auto-attached to auth-test-2
- Entity picker dropdown overflow fixed (`maxHeight: 280, overflowY: auto`)
- **Workspace reading drawer** — `StoryDrawer` component in `workspace/page.tsx`; click auto-attached source card → drawer with title, summary, source, date
- **Full citation flow** — `buildCitationBlock()` module-level helper; `pendingCitation` state + ref pattern; paste handler on `editor.view.dom`; floating Cite button on text selection; "Quote from this story" button; publication date in attribution; `@tiptap/extension-link` added
- **Workspace design locked** — `.claude/DESIGN-WORKSPACE-COLUMN.md` is authoritative for right-column design

### Shipped 2026-05-06
- React hydration fix (e5dc826): `SidebarDatetime`, `greeting()`, `Sparkline` gradient ID, workspace placeholder
- Auth fix Parts A + B: `secureCookie` derivation + 6 hardcoded email fallbacks removed → 401
- Threshold alert email upgrade (React Email template)
- Active project watcher (Phases A-E): `project_entities` migration, route handlers, auto-attach hook, workspace UI
- User_id consolidation: gmail `c652fd7f-...` canonical

### New endpoints / tables (2026-05-05/06/07)
- `GET/POST/DELETE /api/project-entities` — entity watcher management (ownership-gated)
- `touch_project_viewed` RPC — SECURITY DEFINER; updates `projects.last_viewed_at`, returns previous value
- `public.project_entities` — entities attached to projects (watcher config)
- `public.project_auto_entries.matched_entity_id` — FK to entities, set on auto-attach rows
- `scripts/test-auto-attach.ts` — synthetic e2e test for auto-attach pipeline
- `scripts/replay-recent-matches.ts` — bounded historical replay with confirmation prompt

---

## 📝 Quick Start

```bash
npm run dev              # dev server
npm run build            # production build
npm run lint             # ESLint
npm run test:run         # Vitest (requires .env.local)
npm run embeddings:entities  # Embed entities via Jina
```

---

## 🧪 Tests

- `__tests__/entity-matching.idempotency.test.ts` — denormalised counter idempotency
- `app/lib/brief/select.test.ts` — brief selection logic (48 tests passing)

---

## 🗺 Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `processor-agent.ts` | Drain document_queue (manual, `--limit=N` flag) |
| `embed-entities.ts` | Embed all 942 entities via Jina v2 |
| `embed-stories.ts` | Embed story chunks |
| `embed-documents.ts` | Embed document chunks |
| `backfill-entity-matching.ts` | Re-run entity matching on unprocessed stories |
| `seed-loader.ts` | Load entity seed CSV |
| `test-send-brief.ts` | Send test morning brief email |
| `screenshot-briefs.ts` | Screenshot brief for QA |
| `scraper-informea.ts` | InforMEA treaty scraper |
| `import-faolex.ts` | FAOLEX fisheries law importer |
