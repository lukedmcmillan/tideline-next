// Authoritative tracker slug lists. Import from here — do not hardcode in routes.
//
// VELOCITY_TRACKER_SLUGS: trackers that have velocity scores calculated by the
//   velocity cron. Used by app/api/velocity/[slug]/route.ts for slug validation.
//
// ALERTABLE_TRACKER_SLUGS: trackers that support user alert subscriptions.
//   Used by app/api/alerts/subscribe/route.ts. Includes governance (calendar alerts)
//   but excludes newer velocity trackers not yet wired to the alert system.

export const VELOCITY_TRACKER_SLUGS: Set<string> = new Set([
  "isa",
  "bbnj",
  "iuu",
  "30x30",
  "blue-finance",
  "plastics",
  "imo-shipping",
  "wto-fisheries",
  "offshore-wind",
  "cites-marine",
]);

export const ALERTABLE_TRACKER_SLUGS: Set<string> = new Set([
  "isa",
  "bbnj",
  "iuu",
  "30x30",
  "blue-finance",
  "governance",
]);
