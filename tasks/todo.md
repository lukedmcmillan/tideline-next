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
