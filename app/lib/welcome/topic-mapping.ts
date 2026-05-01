/**
 * Maps tracker slugs to governance_events.topics[] values.
 * Mirrors TRACKER_TOPICS in app/lib/velocity.ts (same slugs, same topic strings).
 * Used to find relevant upcoming governance events for each entity.
 */
export const WELCOME_TOPIC_MAP: Record<string, string[]> = {
  isa:              ["dsm"],
  bbnj:             ["bbnj", "high-seas"],
  iuu:              ["iuu"],
  "30x30":          ["mpa", "30x30"],
  "blue-finance":   ["blue-finance", "esg"],
  plastics:         ["plastics", "pollution"],
  "imo-shipping":   ["shipping"],
  "offshore-wind":  ["offshore-wind"],
  "cites-marine":   ["cites", "sharks", "shark", "rays", "guitarfish"],
  "wto-fisheries":  ["wto-fisheries", "fisheries-subsidies", "subsidies"],
};
