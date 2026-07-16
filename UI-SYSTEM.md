# UI-SYSTEM.md — TIDELINE DESIGN SYSTEM
## Approved July 2026 visual authority
*The primary visual authority is the complete eleven-file suite under `Design/approved-2026-07/`. It supersedes every older visual specification and mockup. Current application code remains the implementation base; the approved HTML files govern visual outcome and information architecture. If this document and the approved suite disagree, the suite wins and the conflict must be flagged rather than resolved silently.*

---

## 0. Two related treatments, deliberately distinct

- **Public marketing:** the homepage and landing surfaces under `app/landing/`. Cream `#F4F0E8`, Newsreader, Plus Jakarta Sans, DM Sans, and restrained coral are permitted as shown in the approved homepage.
- **Authenticated platform:** everything under `/platform`. Use the approved deep green sidebar, white working canvas, Newsreader headings, DM Sans interface text, and semantic green, amber, and red.
- **Implementation:** current application code remains the implementation base. Extract and adapt the approved system rather than copying prototype HTML into the application.
- **Evidence:** prototype data, claims, dates, counts, and controls are illustrative until their live data and functionality are verified. A visual reference is not runtime evidence.
- **Separation:** do not restyle either treatment to match the other. Assess both against the complete approved suite.

## Approved reference suite

1. `tideline-homepage-console-directory-v12.html`
2. `tideline-dashboard.html`
3. `tideline-directory.html`
4. `tideline-entity.html`
5. `tideline-library.html`
6. `tideline-news-feed.html`
7. `tideline-regulatory-calendar.html`
8. `tideline-source-conflicts.html`
9. `tideline-tracker-detail.html`
10. `tideline-trackers.html`
11. `tideline-workspace.html`

The ten same-named files under `public/demo/` are mirrors of the approved platform references, not a separate source of authority. References to missing `design/mockups/` files and all older mockups are superseded.

## 1. Canvas and surfaces

| Token | Value |
|---|---|
| Working canvas | `#FFFFFF` |
| Card | `#FFFFFF`, border `#E4E8EC`, radius 14-16px |
| Hairline inside cards | `#EDF0F3` |
| Resting shadow | `0 1px 2px rgba(24,35,46,.05), 0 3px 10px rgba(24,35,46,.05)` |
| Hover lift | `0 3px 6px rgba(24,35,46,.07), 0 12px 28px rgba(24,35,46,.10)` plus translateY(-1 to -2px) |
| Inset panel (e.g. "what changed") | Restrained grey or green tint from the approved page, radius 10-12px |
| Sidebar | Deep green, using the approved `#0B2A23` / `#0C2A23` family |

The authenticated working canvas is white. Borders, insets, and restrained surface fills create separation. Follow the approved page composition rather than introducing a universal grey page background.

## 2. Type

- **Authenticated headings:** Newsreader 400/500. **Authenticated interface text:** DM Sans.
- **Public marketing:** Newsreader, Plus Jakarta Sans, and DM Sans as shown in the approved homepage.
- **All figures:** `font-variant-numeric: tabular-nums`. This replaces DM Mono everywhere (DM Mono stays banned).
- Banned: Instrument Serif and DM Mono.
- Copy rules unchanged: no em dashes, never "Tideline's agents", dry register ("3 flagged", not "worth your time!").

## 3. Colour is a language, and the language is state

| State | Colour / tint | Meaning |
|---|---|---|
| Red `#C0472E` / bright `#D0553B` / tint `#FCEEE9` | Decision likely soon, above threshold, high severity, conflict |
| Amber `#B5791C` / tint `#FDF4E3` | More active than usual, disclosures, deadlines, calibrating warnings |
| Green `#149A73` / deep `#0F7C5C` / tint `#E8F6F0` | Active/healthy, liveness, brand actions, positive pills |
| Stone `#8A929B` / slate tint `#EDF0F4` | Quiet, neutral metadata |

**The blue exception (`#2C6BB5` / tint `#EAF1FA`), the only non-state colour:** neutral verified identifiers or external-record metadata where the approved suite supports it, including citation and document-ID chips. Blue must read as verified metadata, never as product state or decorative accent.

**Explicitly rejected on authenticated platform pages, do not reintroduce:** per-domain identity colours (teal/violet), domain icons (fish, ships, turbines: read as consumer-app), the stacked board-health bar (summary tiles won), beige working canvases, solid domain badges. The approved cream marketing treatment is not a beige platform canvas.

## 4. The boldness budget

One loud zone per page. **Boards and the dashboard may shout:** state-tinted header washes on moved cards, 30-38px score numerals, tinted significance squares. **Detail pages state, they don't shout:** slim status rows, a 4px left colour bar instead of a wash, numerals ~30px max. If everything is loud, nothing is.

## 5. Component inventory (drawn from the complete approved suite; extract, don't reinvent)

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
3. **Liveness everywhere.** Every implemented page footer must truthfully prove the pipeline ran. Prototype liveness copy is illustrative until connected to verified runtime data. An unexplained stale page reads as abandoned.
4. **No entrance animations.** Hover lift and tab switches only. Focus-visible: 2px green outline.
5. **Detail pages carry substance:** what is being decided, primary documents with real citation symbols, active entities. A meter without the fight it measures is decoration.
6. **Never adjudicate conflicts**; severity bands per CONFLICTS-PAGE-SPEC (HIGH at 8.0 and above, MEDIUM 5.0-7.9); never show an empty conflicts state.

## 7. Authenticated platform inventory (locked references)

dashboard · trackers · tracker-detail · news-feed · source-conflicts · library · directory · entity · regulatory-calendar · workspace.

Workspace has an approved reference. The Dashboard has minor token differences from the remaining platform pages; reconcile those tokens during implementation without changing its approved content hierarchy or information architecture.

## 8. Conversion checklist (run on every page before it merges)

Canvas #F4F6F8, white cards, correct shadows and radii · colour used only per Section 3, blue only per the exception · no icons, no identity hues, no health bar, no DM Mono, no em dashes · tabular-nums on all figures · one loud zone max · every number a door · liveness footer present and truthful · honest empty states render · no entrance animations · matches its mockup side by side.
