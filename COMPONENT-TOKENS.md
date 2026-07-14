# COMPONENT-TOKENS.md
## Extracted from the nine locked mockups in public/demo/ · reference input for S3

*This is the raw material S3 (shared UI foundation session) implements from. Every token, class, and component here appears identically across the nine mockup files; if any value drifts between here and the mockups, the mockups win, flag it. Consume this in the S3 session so Claude Code isn't re-deriving from nine HTML files.*

---

## 1. Design tokens (CSS variables, canonical values)

Copy this block verbatim into `app/globals.css` or a `tokens.css` imported by the platform shell. Do not rename variables, seven pages already reference these names in their inline styles.

```css
:root {
  /* Canvas + surfaces */
  --canvas: #F4F6F8;
  --card: #FFFFFF;
  --ink: #18232E;
  --ink-soft: #525E69;
  --ink-mute: #87919B;
  --line: #E4E8EC;
  --line-soft: #EDF0F3;
  --shadow: 0 1px 2px rgba(24,35,46,.05), 0 3px 10px rgba(24,35,46,.05);
  --shadow-lift: 0 3px 6px rgba(24,35,46,.07), 0 12px 28px rgba(24,35,46,.10);

  /* State colours (Section 3 of UI-SYSTEM.md) */
  --green: #149A73;
  --green-deep: #0F7C5C;
  --green-tint: #E8F6F0;
  --green-line: #BFE7D7;
  --amber: #B5791C;
  --amber-tint: #FDF4E3;
  --amber-line: #F0DCB0;
  --red: #C0472E;
  --red-bright: #D0553B;
  --red-tint: #FCEEE9;
  --red-line: #F2CEC3;

  /* The functional blue exception (institutional-type + citation IDs only) */
  --blue: #2C6BB5;
  --blue-tint: #EAF1FA;

  /* Neutrals */
  --slate-tint: #EDF0F4;
  --stone-ink: #8A929B;
  --seg-empty: #E7EAEE;

  /* Sidebar (unchanged from current shell) */
  --sidebar: #0C2A23;
  --sidebar-line: rgba(255,255,255,.09);
  --sidebar-mute: rgba(232,240,236,.6);
}

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--canvas);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
```

Type: DM Sans (body), Plus Jakarta Sans 700/800 (display + numerals), `font-variant-numeric: tabular-nums` on every figure. No DM Mono, no Instrument Serif, no Newsreader in the product.

## 2. Component API sketch

Nine components cover all nine pages. Each is described by its props, its variants, and its consumers (which mockup uses it).

### `<AppShell>` (existing, keep)
The dark sidebar and topbar shell already live in the current `/platform` routes. Keep as-is; just make sure the new components render correctly *inside* it.

### `<Masthead>` (page header)
```tsx
<Masthead
  eyebrow?: string        // "Morning Edition No. 187 · Friday 10 July"
  title: string           // "Trackers"
  sub?: string            // "11 governance domains · scores calculated Monday 06:04 UTC"
  actions?: ReactNode     // right-aligned button group
/>
```
All nine pages. Title is Plus Jakarta Sans 800 at 25–26px, letter-spacing -.02em.

### `<SummaryTile>` (the tile pattern that replaced the board-health bar)
```tsx
<SummaryTile
  n: string | number      // "11", "6.2", "98.5%"
  label: string           // "Domains tracked"
  variant: "tracked" | "hot" | "warm" | "ok" | "quiet" | "new" | "amend"
                          // controls the 4px left colour bar and numeral colour
/>
```
Consumers: trackers (5 tiles), conflicts (4), library (4 entry doors), calendar (deadline counts). Grid parent is `.summary { display: grid; grid-template-columns: repeat(4-5, 1fr); gap: 12px; margin-bottom: 20px; }`.

### `<StateChip>` (plain-English states)
```tsx
<StateChip
  state: "hot" | "warm" | "ok" | "calm"
  label: string           // "Decision likely soon" | "More active than usual" | "Active" | "Quiet"
  size?: "sm" | "md"
/>
```
Wrapped as a pill with tint + border + dot. Note: event-driven domains (Offshore Wind, IUU) *drop the state pill* on the trackers board and carry a pace sentence instead; component allows null and renders nothing in that case.

### `<Gauge>` (10-segment with threshold notch)
```tsx
<Gauge
  score: number           // 0–10
  threshold?: number      // 0–10, renders notch with label at that position
  variant: "hot" | "warm" | "ok" | "quiet"
  size?: "sm" | "md" | "lg"   // 10px | 14px | 16px height
  showThresholdLabel?: boolean  // large sizes show "threshold 6.0" above notch
/>
```
Consumers: trackers board (moved-card gauges, size lg), tracker detail (size lg), dashboard pulse card (size sm), quiet table mini-strips (custom 8px height, 80px wide, 5 segments). The last variant is a `<QuietGauge>` subtype worth building separately.

### `<BandHistoryStrip>` (12-week trajectory)
```tsx
<BandHistoryStrip
  weeks: Array<{ score: number, band: "quiet"|"warm"|"exceed" }>
  size: "micro" | "detail"
/>
```
Micro (trackers board moved cards): 12 coloured segments, no values. Detail (tracker detail page): 12 bars with numeric values below, band-colour keyed, last bar carries "now" styling. `micro` variant uses `.hist-strip i.w/e/wq` from mockups.

### `<SignalRow>` (feed + dashboard + tracker detail contributing stories)
```tsx
<SignalRow
  significance: number    // 0-100
  variant?: "top" | "normal" | "soft"  // controls sig-number square colour
  headline: string
  summary?: string
  chips: Chip[]           // classification, domain, entity, deadline, doc-id, lens, override
  timestamp?: string      // "IMO docs · 9h"
  thread?: ThreadMarker   // renders green dot + "Developing story · nth update since..."
  actions?: ReactNode     // hover-revealed row actions
/>
```
Consumers: feed (with lens + thread + actions), dashboard (three top signals + missed rows), tracker detail (contributing stories, no actions).

### `<Chip>` (many variants, one component)
```tsx
<Chip
  variant: "default" | "change" | "domain" | "entity" | "deadline"
         | "doc-id" | "lens" | "override" | "status" | "resolution"
  label: string
  icon?: ReactNode        // e.g. clock for deadline
/>
```
Colour map, condensed from the mockups:
- `change` → green-tint + green-deep ("Governance change")
- `domain` → slate-tint + ink-soft ("IMO Shipping")
- `entity` → white + line border ("DG MARE")
- `deadline` → amber-tint + amber, bold ("⏱ Responses due 24 Jul")
- `doc-id` → blue-tint + blue, tabular-nums ("MEPC 84/INF.2")
- `lens` → blue-tint + blue ("Your lens: enforcement")
- `override` → red-tint + red ("Shows for everyone · 81")
- `status` → in force (green-tint), in draft (amber-tint), adopted-awaiting (blue-tint), superseded (slate-tint)
- `resolution` → Converged (green-tint), Superseded (blue-tint), Expired (slate-tint)

### `<LivenessFooter>` (bottom of every page)
```tsx
<LivenessFooter
  sources?: { reporting: number, total: number }   // "89 of 89 sources reporting"
  runs: Array<{ label: string, at: string }>        // "Ingest ran today 02:14 UTC"
  extra?: string                                    // "412 documents scanned overnight"
  methodologyHref?: string
/>
```
Every page. Green-tint background, green-line border, radius 13px, ok-dot on left with box-shadow glow.

### `<RailCard>` (rail-column modules used on dashboard and tracker detail)
```tsx
<RailCard
  kicker: string          // "Your projects" | "Coming up" | "Related conflict"
  action?: { label, href }  // upper-right link
  topEdge?: "conflict" | "edge"  // adds 4px red or green top border
  children: ReactNode
/>
```
Consumers: dashboard rail (edge line, projects, entities, conflict, coming-up), tracker detail rail (methodology, conflict, coming-up, alert state), entity rail (record, conflict, coming-up).

### `<SectionLabel>` (grey-uppercase section headings with rule)
```tsx
<SectionLabel
  label: string           // "Moved this week"
  badge?: string          // "2" | "last 30 days"
  action?: { label, href } // right-aligned link
  sub?: string            // "below thresholds, no preparation indicated"
/>
```

## 3. Utility patterns (not components, but consistent CSS)

**Card container:** `.card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; margin-bottom: 16-18px; }`

**Card foot ("N more →"):** `.card-foot { padding: 11px 18px; border-top: 1px solid var(--line-soft); background: #FAFBFC; font-size: 12.5px; color: var(--ink-mute); display: flex; justify-content: space-between; }` with `.card-foot a { color: var(--green-deep); font-weight: 700; }`.

**Header wash on moved cards (dashboard, trackers board):** `.mcard.hot .mcard-top { background: linear-gradient(180deg, var(--red-tint) 0%, rgba(252,238,233,.35) 60%, transparent); }` — same pattern for `.warm` with amber-tint.

**Inset panel ("what changed"):** `background: var(--slate-tint); border-radius: 10-12px; padding: 10-12px 12-13px;` — no border.

**Amber footnote callout:** `background: var(--amber-tint); border: 1px solid var(--amber-line); border-radius: 11-13px; padding: 10-12px 12-15px;` with `<sup>` daggers and `#7A5A1A` body text.

**Buttons:** `.btn` = white, `.btn.primary` = green fill. Hover: `box-shadow: var(--shadow-lift)` + optional `translateY(-1px)`. Focus-visible: 2px green outline, 2px offset. Small: `.btn.sm` at 12px/6px 12px padding.

**Sidebar readiness widget (dark card at bottom):** already exists in current shell, extract into `<Readiness>` if it's not one already.

## 4. What the `/dev/system` route should render (for S3 acceptance)

A single page under a dev-only path that showcases every component above in every variant, arranged as sections. Order:

1. Tokens: swatches for canvas/card/ink/state colours + type samples.
2. `<Masthead>` in three configurations.
3. `<SummaryTile>` grid in all seven variants.
4. `<StateChip>` all four states, both sizes, plus the null case (renders nothing).
5. `<Gauge>` at all three sizes, with and without threshold, all four state variants.
6. `<BandHistoryStrip>` both variants.
7. `<SignalRow>` in all three variants, with and without thread marker, with and without hover actions.
8. `<Chip>` — one row per variant, all ten variants shown.
9. `<RailCard>` — three examples: plain, conflict edge, edge-line edge.
10. `<SectionLabel>` — with badge, with action, with sub.
11. `<LivenessFooter>` at the bottom, real-looking data.

Acceptance: this page renders correctly at desktop (≥1120px), tablet (~900px), and mobile (~380px). No Storybook needed; a single route is enough and matches the "ship ugly, refactor later" principle.

## 5. What S3 should NOT do (guardrails so the session stays scoped)

- Do not build pages. S3 is components only. Page builds are S4–S10.
- Do not touch database or migrations. That's S2.
- Do not restyle the existing shell (sidebar, topbar). The console tokens are what render *inside* the shell.
- Do not add animations beyond hover-lift on cards and tab-switch fades. Explicitly no entrance animations.
- Do not "helpfully" reconcile with the marketing homepage styles. It stays separate (UI-SYSTEM.md Section 0).
- Do not extract every mockup CSS line. Consume this reference; return to the mockups only for cases this doc doesn't cover.

## 6. Known deltas between mockups and this reference

Two small drifts across the nine files, so S3 can flatten them deliberately rather than pick one arbitrarily:

- Card border radius ranges 14–16px across mockups; standardise on **16px** for main cards, **14px** for compact cards (acards, sum-cards, resolution rows).
- `.gauge` height ranges 10–16px; standardise on the three sizes in the `<Gauge>` prop table above (10 / 14 / 16px for sm / md / lg).

Anything else that differs is a bug in a mockup; when it comes up in S4+, fix the mockup to match the built component, not the other way round.
