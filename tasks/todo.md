# Tideline — Open Tickets

---

## TICKET: Remove user_topics dead code path

**Priority:** Medium
**Discovered:** 2026-04-23 during dashboard signals diagnosis

### Problem
`getUserTrackedDomains()` in `app/lib/user-preferences.ts` queries a
`user_topics` table that does not exist in the database (`public.user_topics`
is absent from the schema cache). The function errors silently and falls back
to ALL_SLUGS. `/api/user/topics` (GET + PUT) also writes to this phantom table.
Topics are actually stored in `users.topics` (jsonb array column).

### Work needed
- Delete `getUserTrackedDomains()` from `app/lib/user-preferences.ts`
- Delete `app/api/user/topics/route.ts`
- Audit all callers of `getUserTrackedDomains` — replace with direct read of
  `users.topics` jsonb column
- Verify no other route references `user_topics` table
- Check onboarding flow: does it write to `users.topics` or `user_topics`?
- Add migration guard: `DROP TABLE IF EXISTS user_topics;` to clean up if the
  table was ever created in any environment

### Risk
Low — current behaviour already falls back to ALL_SLUGS, so removal is
a no-op from the user's perspective until callers are updated.

---

## TICKET: Fix mojibake in generateBandCrossingSignals

**Priority:** Medium
**Discovered:** 2026-04-23 during signal_events audit

### Problem
The live cron (`fetch-feeds` every 2h, calling `runSignalGeneration()`) writes
band-crossing headlines with corrupted arrow characters:

- Written by cron: `Deep-Sea Mining â†' ELEVATED`
- Written by migration seed: `Deep-Sea Mining → ELEVATED`

The source string in `app/lib/signal-generation.ts:99` is:
```ts
headline: `${trackerName} → ${currentBand}`,
```

The `→` (U+2192) is correct in source. The corruption suggests a double-encoding
or charset mismatch between the Node.js runtime string and the Supabase client
at insert time on Vercel edge.

### Work needed
- Investigate whether Vercel edge runtime has a different charset handling
  path vs local Node.js (migration ran fine locally / in Supabase dashboard)
- Check `@supabase/supabase-js` version — any known charset regressions
- Try replacing the `→` literal with `\u2192` (explicit Unicode escape) as a
  workaround to isolate whether the issue is in source encoding vs wire encoding
- Clean up existing mojibake rows in signal_events once root cause confirmed

### Risk
Low — cosmetic only, signals display correctly otherwise.

---

## TICKET: Commit PULSE_SCORE_METHODOLOGY.md to repo root

**Priority:** Low
**Discovered:** 2026-05-05

### Problem
`PULSE_SCORE_METHODOLOGY.md` is referenced in multiple specs and the Haiku
prompt for alert interpretations but has never been committed to the repo
root. It only exists in `.claude/` or chat context.

### Work needed
- Commit `PULSE_SCORE_METHODOLOGY.md` to repo root
- Verify all spec cross-references use the correct path

---

## TICKET: Upgrade alert preheader to show real session date

**Priority:** Low
**Discovered:** 2026-05-05

### Problem
Alert email preheader currently shows only `"Score moved from X to Y."` —
the spec called for `"N days to next known session."` but this was deferred
because no live session date data is wired into the alert pipeline.

### Work needed
- Wire governance_events lookup into `getOrCreateInterpretation` or the
  cron pre-loop to find the next event for the tracker's governing body
- Add `days_to_next_session` to the preheader when a future event exists
  within 90 days; fall back to current plain text when none found

---

## TICKET: Confirm test-alert-email.tsx recipient before wider test traffic

**Priority:** Medium
**Discovered:** 2026-05-05

### Problem
`scripts/test-alert-email.tsx` has `to: "lukedmcmillan@gmail.com"` hardcoded.
This is fine for dev testing but must not be used as a template for any
production send path or load test.

### Work needed
- Before any wider test traffic: confirm production cron uses each user's
  email from `user_alert_preferences` → `users.email` join, not this script
- Add a comment in the script header: `// DEV ONLY — recipient hardcoded`

---

## TICKET: Reconcile two-band-system conflict

**Priority:** Low
**Discovered:** 2026-05-05 during threshold alert email planning

### Problem
Two incompatible band systems exist in the codebase:
- `bandFor()` in `app/api/cron/threshold-alerts/route.ts` — uses LOW/WATCH/ELEVATED/HIGH with thresholds <4, <7, <=8.5, >8.5
- `alertBand()` in `app/lib/tracker-metadata.ts` — uses QUIET/WATCH/ELEVATED/HIGH with thresholds <3, <5, <7, >=7

They disagree on band names, thresholds, and offshore-wind score shifting. `bandColor()` in tracker-metadata.ts maps to alertBand values (not the cron's LOW band).

### Work needed
- Decide which system is canonical
- Migrate the other to match
- Update `bandColor()` to handle whichever band names are canonical
- Audit all callers of both functions

### Risk
Medium — existing alert sends use the threshold-alerts cron's system. Changing thresholds could suppress or trigger alerts for users already enrolled.

---
