# UI-SYSTEM.md — TIDELINE PRODUCT DESIGN SYSTEM
## The console system · locked July 2026
*Supersedes TIDELINE-MASTER.md 3.2 and every earlier visual spec (dark navy, ruled editorial). Canonical for all product surfaces. Reference implementations: the nine mockups in public/demo/ (also design/mockups/). If code and this file disagree, this file wins; if this file and the locked mockups disagree, flag it to Luke, do not pick silently.*

---

## 0. Two design systems, deliberately separate

- **Product (console):** everything under /platform. This document.
- **Marketing:** the homepage and landing surfaces (app/landing/). Cream #f4f0e8, Newsreader serif, coral accent. Deliberately different, governed by the homepage mockup, NOT this file.
- **Never reconcile them.** Do not restyle one to match the other. The comment at the top of app/page.tsx enforces this; leave it there.

## 1. Canvas and surfaces

| Token | Value |
|---|---|
| Canvas | `#F4F6F8` |
| Card | `#FFFFFF`, border `#E4E8EC`, radius 14-16px |
| Hairline inside cards | `#EDF0F3` |
| Resting shadow | `0 1px 2px rgba(24,35,46,.05), 0 3px 10px rgba(24,35,46,.05)` |
| Hover lift | `0 3px 6px rgba(24,35,46,.07), 0 12px 28px rgba(24,35,46,.10)` plus translateY(-1 to -2px) |
| Inset panel (e.g. "what changed") | `#EDF0F4`, radius 10-12px |
| Sidebar | `#0C2A23` dark green, unchanged from live shell |

Content sits on grey; white cards do the separating. Never white-on-white.

## 2. Type

- **Body:** DM Sans. **Display and numerals:** Plus Jakarta Sans 700/800.
- **All figures:** `font-variant-numeric: tabular-nums`. This replaces DM Mono everywhere (DM Mono stays banned).
- Banned: Instrument Serif anywhere; Newsreader in the product (marketing only).
- Copy rules unchanged: no em dashes, never "Tideline's agents", dry register ("3 flagged", not "worth your time!").

## 3. Colour is a language, and the language is state

| State | Colour / tint | Meaning |
|---|---|---|
| Red `#C0472E` / bright `#D0553B` / tint `#FCEEE9` | Decision likely soon, above threshold, high severity, conflict |
| Amber `#B5791C` / tint `#FDF4E3` | More active than usual, disclosures, deadlines, calibrating warnings |
| Green `#149A73` / deep `#0F7C5C` / tint `#E8F6F0` | Active/healthy, liveness, brand actions, positive pills |
| Stone `#8A929B` / slate tint `#EDF0F4` | Quiet, neutral metadata |

**The blue exception (`#2C6BB5` / tint `#EAF1FA`), the only non-state colour:** institutional-type chips, citation and document-ID chips, "adopted, awaiting entry into force" status. Functional metadata that must read as *not a state*. Nothing else is blue.

**Explicitly rejected, do not reintroduce:** per-domain identity colours (teal/violet), domain icons (fish, ships, turbines: read as consumer-app), the stacked board-health bar (summary tiles won), beige, solid domain badges.

## 4. The boldness budget

One loud zone per page. **Boards and the dashboard may shout:** state-tinted header washes on moved cards, 30-38px score numerals, tinted significance squares. **Detail pages state, they don't shout:** slim status rows, a 4px left colour bar instead of a wash, numerals ~30px max. If everything is loud, nothing is.

## 5. Component inventory (all exist in the nine mockups; extract, don't reinvent)

- **Summary tiles:** white card, 4px left colour bar, 24-26px numeral, label. The board-at-a-glance pattern.
- **State chips** (pill, tint + border + dot) with the locked plain-English states: *Quiet / More active than usual / Decision likely soon*. Event-driven domains drop the pill for a pace sentence.
- **Delta pills**, **10-segment gauges** with threshold notch (labelled on large sizes), **12-week history** (micro strip on cards, value bars on detail pages).
- **Signal rows:** tinted significance square (red at lead level, green normal, slate soft), headline, summary, chip row.
- **Chips:** classification (green tint for Governance change), domain (slate), entity (outlined), deadline (amber, clock + date), document/citation ID (blue), lens reason (blue), Gate-1 override (red, "Shows for everyone · N").
- **Thread marker:** green dot + "Developing story · nth update since [date]" + View thread link.
- **Insets and callouts:** grey inset for "what changed"; amber bordered callout for footnotes, disclosures, backfill notes; **green liveness footer on every page** (sources reporting, last run, next run, methodology link).
- **Rail cards:** 4px top edge red for conflict, green for edge line; kicker heading; key/value rows.
- **Status pills:** In force (green) / In draft (amber) / Adopted-awaiting (blue) / Superseded (slate). **Resolution pills:** Converged (green) / Superseded (blue) / Expired (slate).
- **Calendar tiles** (month/day blocks, state-tinted), **filter pills**, **tab pills** (green fill when active), **card-foot doors** ("N more... with link").

## 6. Behavioural rules (design rules, not engineering nice-to-haves)

1. **Numbers are doors.** Every score, count, and percentage links to its evidence or it does not ship.
2. **Honest empties.** "Calibrating", "backfill in progress", "quiet", "no outcome" render as designed. Nothing fakes data, ever. Null is an admission, zero is a measurement; never confuse them.
3. **Liveness everywhere.** Every page footer proves the pipeline ran. An unexplained stale page reads as abandoned.
4. **No entrance animations.** Hover lift and tab switches only. Focus-visible: 2px green outline.
5. **Detail pages carry substance:** what is being decided, primary documents with real citation symbols, active entities. A meter without the fight it measures is decoration.
6. **Never adjudicate conflicts**; severity bands per CONFLICTS-PAGE-SPEC (HIGH at 8.0 and above, MEDIUM 5.0-7.9); never show an empty conflicts state.

## 7. Page inventory (locked references)

dashboard · trackers (v3) · tracker-detail · news-feed · source-conflicts · library (instrument-first) · directory (split view) · entity · regulatory-calendar. Workspace has no console mockup yet; build one before restyling that page.

## 8. Conversion checklist (run on every page before it merges)

Canvas #F4F6F8, white cards, correct shadows and radii · colour used only per Section 3, blue only per the exception · no icons, no identity hues, no health bar, no DM Mono, no em dashes · tabular-nums on all figures · one loud zone max · every number a door · liveness footer present and truthful · honest empty states render · no entrance animations · matches its mockup side by side.
