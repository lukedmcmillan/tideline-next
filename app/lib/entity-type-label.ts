/**
 * entityTypeLabel() — single source of truth for entity_type display labels.
 *
 * The entities table has architectural debt: values exist in lowercase,
 * UPPERCASE, and mixed casing. This mapper normalises all variants to a
 * consistent friendly label. Case-insensitive — accepts any casing.
 *
 * Do not add rendering logic here. Labels only.
 */

const LABEL_MAP: Record<string, string> = {
  // Intergovernmental / regulatory bodies
  body:         "Body",
  regulator:    "Body",

  // Legal instruments / treaties
  treaty:       "Treaty",
  instrument:   "Treaty",

  // People
  person:       "Person",
  individual:   "Person",

  // Initiatives / programmes
  initiative:   "Initiative",
  issue:        "Issue",

  // Organisations
  organization: "Org",
  organisation: "Org",
  company:      "Company",
  fund:         "Fund",

  // Geographies / vessels
  country:      "Country",
  vessel:       "Vessel",
};

export function entityTypeLabel(type: string | null | undefined): string {
  if (!type) return "";
  return LABEL_MAP[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());
}
