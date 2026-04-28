# Handoff: Tideline Mobile Landing Page

## Overview

This bundle contains the **redesigned mobile landing page** for Tideline at iPhone width (390 × 844). It replaces the existing mobile build, which had multiple layout-collapse bugs (cramped Pulse card, broken header nav, overflowing CTAs, awkward stacking) caused by a desktop layout responsively collapsing.

The redesign is **mobile-first** — the layout, type scale, tap targets, and stacking order were designed for a phone, not adapted from desktop.

---

## About the design files

The HTML/JSX files in `design/` are **design references**, not production code to copy directly. They are React prototypes that render in the browser through Babel-standalone (in-browser transpile) and use inline styles for fidelity, not for shipping.

**Your task:** recreate this design inside the existing **Next.js 16 + React 19 + Tailwind v4** codebase at `lukedmcmillan/tideline-next`, replacing the current mobile breakpoint of the `/` route. Use the codebase's existing patterns:

- Place the Next.js page at `app/page.tsx` or as a mobile-aware variant within `app/LandingClient.tsx` (the existing landing client).
- Use Tailwind v4 utility classes; the design tokens already exist in `app/globals.css` (`--bg-warm`, `--ink-navy`, `--accent-teal`, etc.).
- Use the existing fonts loaded in `app/layout.tsx` (Plus Jakarta Sans, DM Sans, DM Mono).
- Drop inline styles in favour of Tailwind utilities or CSS modules wherever possible.

The HTML files render correctly with `python -m http.server` from the `design/` folder; open `design/index.html` to see the click-thru prototype.

---

## Fidelity

**High-fidelity.** Every measurement, hex code, font-family, weight, line-height, letter-spacing, and animation timing is specified. The developer should recreate the UI pixel-perfectly using the codebase's existing libraries and patterns.

---

## Target viewport

- **Primary:** 390 × 844 (iPhone 14/15 Pro)
- **Range:** 360–430px wide
- **Above-fold:** Header (56px) + Hero stack (eyebrow → H1 → sub → CTA → secondary link → trust line)

The desktop landing is **out of scope**. Do not touch any breakpoint above 768px in this work.

---

## Screens / views

The mobile landing is one continuous scroll. Sections in order:

### 1. Header (sticky, 56px)
- Logo left (28×28 teal rounded-square glyph + "Tideline" wordmark in Plus Jakarta 800 / 19px / -0.015em).
- Hamburger button right (44×44 tap target, three 1.8px-stroke navy lines on a 22×22 SVG).
- **No nav links visible on mobile.** All nav lives behind the hamburger.
- Background: `rgba(250,250,247,0.92)` with `backdrop-filter: blur(16px)`.
- Hairline border `1px solid #E5E1D8` appears on `scrollY > 12px` only; transparent at top.

### 2. Hamburger drawer (full-screen overlay)
- Opens with a 0.22s `cubic-bezier(0.2,0.8,0.3,1)` slide-down animation.
- Locks body scroll while open.
- Header row repeats logo + close (X) button.
- Nav items: **Platform · Methodology · Pricing · Built for** as 22px Plus Jakarta 700, separated by `1px solid #EDEAE3` rules, with a faint trailing `→` chevron in DM Mono 16px / `#9AA8B8`.
- "Account" eyebrow in DM Mono 10px / `#6B7A8C` / `0.14em` tracking, then a **Log in** link.
- Pinned bottom panel (`#FFFFFF` background, `1px solid #E5E1D8` top): full-width primary CTA (50px min-height, navy `#0B1628`, white text, 10px radius) + trust line in DM Mono 11px.

### 3. Hero (24/20/36 padding)
Stacks vertically:
1. **Eyebrow** — DM Mono 11px uppercase `0.14em` / teal `#1D9E75` / pulsing 6×6 teal dot. Reads: *"Ocean intelligence · Live"*.
2. **H1** — Plus Jakarta 800 / 38px / line-height 1.05 / `-0.025em` / navy `#0B1628`. Single line break controlled by `text-wrap: balance`. Copy: *"The platform of record for ocean governance"* — only **"ocean governance"** is teal italic. **No trailing period.**
3. **Sub** — DM Sans 16px / 1.55 / `#3A4A5C` / `max-width: 32ch`. Copy: *"Watch entities, read primary sources, score regulatory activity, and receive a personalised brief before 7am."*
4. **Primary CTA** — full-width, 52px min-height, navy `#0B1628`, white DM Sans 16px / 600, 10px radius. Copy: *"Start your 7-day free trial"*.
5. **Secondary link** — centred, DM Sans 14px / 600 / navy with thin underline. Copy: *"See the platform →"*.
6. **Trust line** — DM Mono 11px, centred, flex-wrap, separator `·` in `#E5E1D8`. *"No card required · 7 days full access · 47 founding spots left"*. The scarcity span (*"47 founding spots left"*) is amber `#C97A1A` / weight 600.

### 4. Pulse card (margin: 0 20px 8px)
The hero proof card. **Critical fix from the live build:** the score (7.2) now stacks **above** the band/meaning text. The desktop "score left, meaning right" grid was producing an empty hole on mobile.

Stacking order inside the card:
1. **Header row** — eyebrow *"LIVE TRACKER"* (DM Mono 10px / `0.1em`), title *"ISA Deep-Sea Mining"* (Plus Jakarta 700 / 18px), `0.70x` outline pill aligned right.
2. **Score block (vertical stack)** — score *"7.2"* (DM Mono 72px / 500 / teal / `-0.045em` / line-height 0.9) → eyebrow *"ELEVATED · ACTIVE CONDITIONS"* (DM Mono 11px / `0.16em` / teal) → delta line *"↑ +0.4 vs last week"* (DM Mono 11px).
3. **Sparkline** — full-width, 56px tall, teal `#1D9E75` 2.5px stroke, gradient fill `0.18 → 0` opacity, terminal halo (6px transparent + 3.5px solid teal dot at end).
4. **Components grid** — 2×2 (was 4-up on desktop, cramped at 390px). Labels: **Volume / Recency / Decision / Risk** (no `35%`, `30%`, `20%`, `15%` suffixes on mobile to avoid wrapping). Values DM Mono 16px / 500.
5. **Disclosure footer** — DM Mono 10px, `Disclosure` keyword in amber `#C97A1A` weight 500.

Card style: `#FFFFFF`, `1px solid #E5E1D8`, 14px radius, padding 20px, shadow `0 1px 2px rgba(11,22,40,0.04), 0 12px 32px rgba(11,22,40,0.08)`.

### 5. Stats band (32px padding, `#F4F2EC` background, hairline rules top + bottom)
**Single column** (was orphaning the third number on the live build). Each stat is a `120px / 1fr` grid: large number left (DM Mono 30px / 500 / `-0.025em`), label right (DM Sans 13px / `#6B7A8C`).

### 6. Showcase (48/20 padding, `#FAFAF7`)
Three sections, each: eyebrow → H3 (28px Plus Jakarta 800 with single teal italic accent word, no trailing period) → body (15px / 1.55 / `38ch`) → underline link → visual.

The visuals are **smaller cards**, not full-width:
- **FeedMini** — 3 stories with tracker/entity outline pills, headline (14px / 500), source meta in DM Mono 10px.
- **PulseMini** — same pattern as Pulse card but at 56px score and 2×2 components.
- **WorkspaceMini** — header + attached-source list + an "Ask Tideline" panel marked with an amber **Q3 2026** outline pill (in-development disclosure).

### 7. Comparison (48/20 padding, `#FAFAF7`, hairline rules top + bottom)
H2 *"Two ways to spend a week"* with *"spend a week"* teal italic. Subhead 15px.

Two stacked cards:
- **Without Tideline** — `#F4F2EC` fill, `#E5E1D8` border. Eyebrow `B8A89A`, time stamps in dimmed warm-grey `#C5B8AC`, body `#8A7A6E`. Reads as faded paper.
- **With Tideline** — `#FFFFFF` fill, `1px solid #0B1628` border, hero shadow. Eyebrow + time stamps in teal `#1D9E75`, body navy.

Closing line below: Plus Jakarta 700 / 19px *"Less than £25 a week. Less than a single billable hour."* with *"£25 a week"* teal italic. Trust line beneath in DM Mono 11px. **Tighter top spacing** (`margin-top: 4` on the wrapper, not the previous gap).

### 8. Mid-CTA strip (32/20 padding, `#FAFAF7`)
Navy `#0B1628` panel, 14px radius, 28/22 padding. **Stacks vertically** (heading top, sub middle, button bottom). Heading Plus Jakarta 700 / 22px / white. Sub 13px white at 70% alpha. Button **full-width**, white background, navy text, 50px min-height.

### 9. "Not" strip (32/20 padding, `#F4F2EC`, hairline rules top + bottom)
Three rows separated by `1px solid #E5E1D8` rules. Each row: H3 18px navy, body 14px `#3A4A5C` / 1.5.

### 10. Built for (48/20 padding, `#FAFAF7`)
Eyebrow → H2 *"Five sectors, one platform"* at **26px** (reduced from 32px to keep to 2 lines max on 390px). Then a 5-row table, each row a `36px / 1fr` grid: letter glyph in Plus Jakarta 700 / 24px / teal, then name (15px / 700 / navy), tracking line (13px), outcome line (13px / `#6B7A8C`).

### 11. Pricing (48/20 padding, `#F4F2EC`)
Eyebrow → H2 *"One platform. No tiers"*. Three stacked cards (single column).

The **Founding member** card is featured: navy border instead of hairline, hero shadow, `margin-top: 12` to clear the floating amber **47 of 50 left** badge that sits at top: -10 / left: 22.

Each card: tier name (DM Mono 11px), sub-eyebrow (DM Mono 10px, amber on featured), price (Plus Jakarta 800 / 44px / `-0.035em`) + period (DM Sans 13px / `#6B7A8C`), feature list with teal ✓ checkmarks, full-width CTA.

### 12. Footer (36/20 padding, `#0B1628`)
Logo + wordmark + "Ocean Intelligence" eyebrow. 2×2 link grid (Platform / Company / Legal / Account) with column headers in DM Mono 10px / `0.14em` / 45% white. Bottom copyright line in DM Mono 10px / 45% white, separated by `1px solid #1A2C45` rule.

---

## Interactions & behavior

- **Header border** appears once `scroll > 12px` on the page (or scroll container).
- **Hamburger drawer** locks body scroll while open, animates in 0.22s.
- **Live dot** pulses every 2.5s `ease-in-out`, scaling 1 → 1.2, opacity 0.45 → 1.
- **All hover transitions**: 0.15s. No press-shrink. No opacity dim.
- **Primary CTA hover**: background `#0B1628` → `#19243A`. No scale.
- **Links hover**: navy → teal, with `border-bottom` colour matching.
- **Scroll behaviour**: native, no scrolljacking, no parallax.
- **Sparkline animation** (existing in codebase): `stroke-dasharray` 1000 → 0 over 1.8s ease-out on first paint. Score number fades up over 1s `cubic-bezier(0.2,0.8,0.2,1)`. Component labels fade in 0.6s ease, staggered 0.15s.

---

## State management

- Header: `scrolled` boolean from scroll listener. Bind to the actual scroll container, not `window`, if the page is inside a sticky/scaling shell.
- Drawer: `open` boolean, `body.style.overflow = 'hidden'` while open.
- Filter chips (Pulse view in platform UI kit): single-select state.

No data fetching in this scope.

---

## Design tokens

Drop these into `app/globals.css` if not already present (most are; reconcile with existing values).

```css
/* Surfaces */
--bg-warm: #FAFAF7;
--bg-warm-band: #F4F2EC;
--surface-card-light: #FFFFFF;
--rule-warm: #E5E1D8;
--rule-warm-soft: #EDEAE3;

/* Dark surfaces */
--bg-navy: #0B1628;
--surface-card-dark: #0D1E35;
--rule-navy: #1A2C45;

/* Text on light */
--text-ink: #0B1628;
--text-body: #3A4A5C;
--text-muted: #6B7A8C;
--text-dim: #9AA8B8;

/* Accent */
--accent-teal: #1D9E75;
--accent-teal-soft: #E8F4EE;
--warn-amber: #C97A1A;
--warn-amber-bright: #EF9F27;
--warn-amber-soft: #FBF3E5;
--warn-amber-rule: #E8C896;

/* Type */
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'DM Mono', monospace;

/* Radii */
--radius-card: 14px;
--radius-card-sm: 10px;
--radius-button: 10px;
--radius-input: 6px;
--radius-pill: 999px;

/* Shadows (always navy-tinted) */
--shadow-card: 0 1px 2px rgba(11,22,40,0.04), 0 8px 24px rgba(11,22,40,0.05);
--shadow-hero: 0 1px 2px rgba(11,22,40,0.04), 0 12px 32px rgba(11,22,40,0.08);
--shadow-pop:  0 12px 36px rgba(11,22,40,0.12);
```

### Spacing scale
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 36 · 48 · 56 · 80.

### Tap targets
44 × 44 px minimum on all interactive elements (header hamburger, drawer rows, pills, links). Buttons use 50–52px min-height for primary actions.

---

## Voice & copy rules (locked, do not paraphrase)

- **No em dashes anywhere.** Replace with `, ` or ` · ` or full stops.
- **No "Tideline's agents".** Use *"overnight"* or *"while you were sleeping"*.
- **No "transform your workflow"** or similar SaaS clichés.
- Talk to the reader as **you**. Refer to the product as **Tideline** or **the platform**, never **we**.
- Headline pattern is locked: single navy headline with **one teal italic accent word**. Never two-colour split lines.
- The accent word is implemented as `<em style="font-style: italic; color: #1D9E75">` — `<em>` carries colour, italic is preserved (counter to the existing codebase note that strips italic; here we keep italic as the brief specifies).

Verbatim copy to lift:
- CTA: **Start your 7-day free trial**
- Trust: *No card required · 7 days full access · 47 founding spots left*
- Live eyebrow: *Ocean intelligence · Live*
- H1: **The platform of record for *ocean governance*** (no period)
- H2 comparison: **Two ways to *spend a week***
- H2 sectors: **Five sectors, *one platform***
- H2 pricing: **One platform. *No tiers***
- Closing line: **Less than *£25 a week*. Less than a single billable hour.**

---

## Assets

- `assets/favicon.svg` — wordmark glyph (white "T" on teal `#1D9E75` rounded-square 72×72 with 16px radius). Used as favicon, app icon, and the small logo block in the header.
- **No icon font.** Three drawn icons in the header SVG (status bar wifi/battery, hamburger, X close). Stay inline.
- **No stock photography.** No drone shots. No ships. The product's subject is data, not the sea.
- **Unicode used as iconography:** `→` (links), `↑` `↓` (deltas), `★` (starred entities), `✓` (pricing checks), `⌕` (search placeholder), `·` (separators).

---

## Files in this bundle

```
design_handoff_mobile_landing/
  README.md                          this file
  colors_and_type.css                Drop-in CSS variables and semantic classes
  assets/
    favicon.svg                      Wordmark glyph
  design/
    index.html                       Click-thru prototype, open in browser
    App.jsx                          Top-level composition
    Header.jsx                       Sticky header + hamburger drawer
    Hero.jsx                         Eyebrow + H1 + sub + CTAs + trust line
    PulseCard.jsx                    The hero proof card
    Sections.jsx                     StatsBand, Showcase (Feed/Pulse/Workspace mini)
    Footer.jsx                       Comparison, MidCta, NotStrip, BuiltFor, Pricing, Footer
    ios-frame.jsx                    iPhone bezel utility (unused in current build)
```

To preview the prototype: `cd design_handoff_mobile_landing/design && python -m http.server 8000` then open `http://localhost:8000/`.

---

## What changed from the live build (specific bug fixes)

1. **Header** — collapses to logo+hamburger only. Removed the desktop tri-link layout that was clipping "Methodology" at the right edge.
2. **Pulse card score** — stacks above band/meaning text. Removed the desktop 2-column grid that produced an empty hole.
3. **Mid-CTA strip** — heading + button stack vertically. Removed the desktop 2-column layout that overflowed the navy container.
4. **Stats band** — single column. Removed the desktop 2-column grid that orphaned the third number.
5. **"Not" strip** — hairline `1px solid #E5E1D8` dividers between blocks (was reading as three centred paragraphs in a row).
6. **Built-for headline** — reduced from 32px to 26px so it fits in 2 lines max at 390px.
7. **Comparison closing line** — tighter top margin (4 not 24) so it sits closer to the columns.
8. **Pulse components** — labels are *Volume / Recency / Decision / Risk* on mobile (no `35%`, `30%`, `20%`, `15%` suffixes — they wrapped at 390px).
9. **Hero H1** — period dropped after *"ocean governance"*.
10. **Founding-spots line** — kept amber `#C97A1A` per direction, weight bumped to 600 for legibility against the warm background.

---

## Implementation checklist for the developer

- [ ] Replace mobile breakpoint of `app/LandingClient.tsx` (or a new `LandingClientMobile.tsx` rendered conditionally).
- [ ] Use existing Tailwind tokens; reconcile new ones from this README into `app/globals.css`.
- [ ] Hamburger drawer: implement scroll-lock on `document.body`.
- [ ] Sticky header: bind scroll listener to the document/window in production (the prototype binds to its own scroll container because it's nested in a phone frame).
- [ ] Run lighthouse mobile to confirm tap-target compliance (44 × 44 minimum on all interactive elements).
- [ ] Smoke-test at 360px, 390px, 414px, 430px widths.
- [ ] Verify `text-wrap: balance` falls back acceptably on browsers that don't support it (Safari < 17.4).
- [ ] Confirm font-loading does not cause CLS — preload the three families that are used in the first viewport.
- [ ] Replace **all** em dashes anywhere in the existing codebase with ` · ` or `, ` (lint rule recommended).
