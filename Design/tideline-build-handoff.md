# TIDELINE LANDING PAGE — CLAUDE CODE BUILD HANDOFF
Reference artifact: `tideline-landing-v4.html` (the approved mockup). This is the single source of truth. The build must be visually identical to it.

---

## THE PROMPT TO PASTE INTO CLAUDE CODE

Paste the session opener first if this is a fresh session:

```
Read CLAUDE.md, SUPERCLAUDE-COMMANDS.md, CLAUDE-RULES.md, git log --oneline -5,
and tasks/lessons-MERGED.md only. Then run /sc:index-repo. Do not read any other
files. Do not write any code. Wait for instructions.
```

Then paste this:

```
/sc:workflow "Rebuild the public landing page at the marketing route to match the
approved mockup EXACTLY. The mockup file tideline-landing-v4.html is the single
source of truth and is attached / at the repo path I will give you. This is a
pixel-faithful port, not a redesign. Return the plan before writing any code.

HARD RULES (from TIDELINE-MASTER.md 3.2, non-negotiable):
- No em dashes anywhere in copy. Verify with a grep for the character before done.
- No blue. No Instrument Serif. No DM Mono. Outline-only badges (no solid fills).
- Fonts: DM Sans (body) and Plus Jakarta Sans 800 (display) only.
- Do NOT invent, improve, reword, or 'polish' any copy, colour, number, or layout.
  Every headline, paragraph, stat, and label must be byte-for-byte the mockup's.
- Do NOT introduce a dark page background. The page is light (#FAF9F5 canvas). The
  only dark element is the product app-frame's own sidebar (#0C2A23), exactly as
  in the mockup.

FIDELITY REQUIREMENTS:
1. Port the mockup's CSS custom properties verbatim into the design token layer.
   Every hex value in tideline-landing-v4.html :root must survive unchanged. Do not
   substitute 'close enough' Tailwind defaults for the exact hex values.
2. Reproduce all 13 page sections in the mockup's order: nav, hero, app-frame (with
   6 working tabs), numbers band + source-disclosure line, five surface blocks,
   the brief (with phone), the day timeline, personas, what-it-isn't, founder,
   pricing, closing question, final CTA, footer.
3. The app-frame tab switching (News Feed / My Workspace / Trackers / Library /
   Ask Tideline / Directory) must work exactly as the mockup's vanilla JS does:
   aria-selected toggles, panel show/hide, score bars fill on tab switch.
4. Preserve the exact tab panel contents: the News Feed featured+side grid, the
   Workspace word-processor + tracking panel, the split-view Directory with the
   open entity detail, the Ask Tideline empty state, the Library search results.
   These mirror the real product screenshots and must not be simplified.
5. Keep tabular-nums slashed-zero on every number, the eyebrow +0.16em tracking,
   and the hero headline -0.035em tracking.
6. Motion: one IntersectionObserver reveal (translateY fade) plus score-bar fill on
   load and tab switch. Respect prefers-reduced-motion exactly as the mockup does.
   Do not add any other animation.

STACK NOTES:
- Framework is Next.js App Router (per TIDELINE-MASTER.md 3.1). Build this as a
  server component page with a small client component ONLY for the app-frame tab
  switching and the reveal observer.
- Self-host DM Sans and Plus Jakarta Sans via next/font/local as variable fonts;
  do not hotlink Google Fonts in production.
- Match the mockup's responsive breakpoints (980px and 560px) exactly, including
  the app-frame sidebar collapsing to a horizontal scroll row on mobile.

VERIFICATION BEFORE DONE (per CLAUDE-RULES.md section 4):
- grep the rendered output for the em dash character: must return zero.
- grep for '#1A73E8' and any blue: must return zero.
- Confirm all six tabs switch and all score bars animate.
- Screenshot desktop and mobile and diff against the mockup section by section.
- State which environment (localhost/preview/prod) each check ran against.

Do NOT touch pricing values, the founding-place cap copy, or any source-name list
without flagging first: those are locked. Return the plan before writing code."
```

---

## COMPANION SPEC (give this to Claude Code alongside the mockup)

### Exact design tokens (from the mockup :root — port these verbatim)

```
--bg:#FAF9F5;          /* page canvas, warm off-white */
--bg2:#F3F1EA;         /* mini-frame / tier background */
--card:#FFFFFF;        /* cards, panels */
--line:#E7E5DC;        /* hairline borders everywhere */
--ink:#15201B;         /* headings, primary text */
--body:#42504A;        /* body copy */
--muted:#6E7C75;       /* meta, captions */
--green:#149A73;       /* accent: CTAs, active, highlight words */
--green-dark:#0F7C5C;
--green-tint:#E9F5F0;
--amber:#DD9414;
--amber-tint:#FBF3E2;
--red:#D14F4C;
--red-tint:#FBEBEA;
--side:#0C2A23;        /* product sidebar (the ONLY dark surface) */
--side2:#123B31;
--side-text:#AFC6BD;
--side-bright:#EAF4EF;
```
Accent-green-in-sidebar bright variant: `#35C99B`. Tracker pill/score reds and ambers use the tint pairs above. Do not add colours outside this set.

### The 13 sections, in order (must all be present)
1. Sticky nav — light, `z-index:100`, logo + 4 links (Platform, The brief, Who it's for, Pricing) + Sign in + green "Claim a founding place". NO Methodology link (removed deliberately).
2. Hero — centred, "The ocean governance terminal." (terminal in green), six-tabs subhead, two CTAs, founding-rate microline.
3. App-frame — light product recreation with dark-green sidebar, six working tabs, MEPC 84 readiness box, "Search or ask Tideline anything" + ⌘K, Individual pill + LM avatar.
4. Numbers band — 10,000+ / 1,000+ / 15 / 100+ with the named-source disclosure line beneath.
5. Five surfaces — trackers (with methodology trust strip), library, directory, live feed, workspace. Alternating image side. Each with a light mini-frame of real data.
6. The brief — copy left, phone mockup right, on white background.
7. What tomorrow looks like — compact 7-row timeline.
8. Who it's for — 6 personas, "we" voice, on white background.
9. What it isn't — 3 columns.
10. Why I built this — signed founder note, "I" voice, on white background.
11. Pricing — 3 tiers, Founding featured with "43 of 50 remaining" bar.
12. Closing question — "Built for the people whose business is the ocean." + the big display question.
13. Final CTA — single white card on canvas, one paragraph, two buttons. Then footer.

### Locked copy that must not change
- All pricing: £39 / £99 / £699. Founding cap: "50 places" and "43 of 50 remaining".
- Positioning: "Most professionals in this sector have six tabs open right now. Tideline is one."
- Source list line under the numbers band (verify names against real ingestion first).
- The closing question: "So the real question isn't what Tideline does. It's what you need to be the best version of yourself at this work, every day."
- The "we" voice across who-it's-for; the "I" voice in the founder note. Do not unify them.

### Open items to confirm with Luke before shipping (do NOT silently resolve)
1. Trial length: mockup says 7 days; TIDELINE-MASTER.md carries a 14-day figure. Confirm one.
2. Domain count: mockup says 15; live platform and public methodology say 11. These MUST agree at launch. Either update the methodology page to 15 or change the mockup to 11.
3. Founding cap: is 50 the real number, and should "43 of 50 remaining" be live-driven or static at launch?
4. Source-name list: confirm every named source (IMO, UNCLOS, RFMO, ISA, DOALOS, OSPAR, CBD, FAO, IWC) is actually ingested. Remove any that isn't; a false provenance claim is the one thing an expert buyer's due diligence catches.
```
