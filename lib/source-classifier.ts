/**
 * Classifies a story source into one of four categories for RAG retrieval tagging.
 * Used by embed-stories.ts and summarise-pending to populate story_chunks.source_type.
 *
 * Categories:
 *   GOVERNMENT — intergovernmental bodies, national government agencies, UN system
 *   NGO        — non-governmental advocacy and conservation organisations
 *   ACADEMIC   — peer-reviewed journals, university research institutions
 *   PRESS      — news media, trade press, industry outlets (default)
 */

export type SourceType = "GOVERNMENT" | "NGO" | "ACADEMIC" | "PRESS";

// Exact source_name matches (derived from sources.ts types + scraped source names)
const GOVERNMENT_SOURCES = new Set([
  // National government (type: 'gov' in sources.ts)
  "NOAA",
  "Fisheries and Oceans Canada (DFO)",
  "UK DEFRA",
  "UK MMO",
  // Intergovernmental / regulatory (type: 'reg' in sources.ts)
  "ISA",
  "UNEP",
  "HELCOM",
  "CCAMLR",
  "IPCC",
  // Scraped / harvested sources
  "IMO",
  "IMO Press Briefings",
  "FAO",
  "CBD",
  "CITES",
  "IWC",
  "Ramsar Convention",
  "CMS",
  "OSPAR",
  "ITLOS",
  "UNCLOS",
  "UN BBNJ",
  "BBNJ Secretariat",
  "UN Environment",
  "InforMEA",
  "PSMA",
]);

const NGO_SOURCES = new Set([
  // type: 'ngo' in sources.ts
  "Oceana",
  "Ocean Conservancy",
  "Sea Shepherd",
  "Blue Marine Foundation",
  "Global Fishing Watch",
  "High Seas Alliance",
  // Common scraped NGO sources
  "WWF",
  "Greenpeace",
  "WDC",
  "Whale and Dolphin Conservation",
  "DSCC",
  "Deep Sea Conservation Coalition",
  "ClientEarth",
  "Earthjustice",
  "Environmental Defense Fund",
  "Pew Charitable Trusts",
  "Marine Conservation Society",
  "MSC",
  "Marine Stewardship Council",
  "IUCN",
  "Surfrider Foundation",
  "5 Gyres",
]);

const ACADEMIC_SOURCES = new Set([
  // type: 'res' in sources.ts
  "Nature Climate Change",
  "Nature Sustainability",
  "Nature Ecology & Evolution",
  "Science Ocean Research",
  "Scripps Oceanography",
  "WHOI",
  "MBARI",
  "British Antarctic Survey",
  // Additional peer-reviewed / institutional research
  "ICES",
  "Frontiers in Marine Science",
  "Marine Policy",
  "Ocean & Coastal Management",
  "Deep-Sea Research",
  "Oceanography",
]);

// Domain-based fallback patterns (matched against sourceUrl)
const GOVERNMENT_DOMAIN_FRAGMENTS = [
  ".gov",
  ".gov.uk",
  ".gc.ca",
  "isa.org.jm",
  "unep.org",
  "fao.org",
  "imo.org",
  "cbd.int",
  "cites.org",
  "iwc.int",
  "ramsar.org",
  "cms.int",
  "ospar.org",
  "itlos.org",
  "un.org",
  "helcom.fi",
  "ccamlr.org",
  "ipcc.ch",
];

const NGO_DOMAIN_FRAGMENTS = [
  "oceana.org",
  "oceanconservancy.org",
  "seashepherd.org",
  "bluemarinefoundation.com",
  "globalfishingwatch.org",
  "highseasalliance.org",
  "wwf.org",
  "panda.org",
  "greenpeace.org",
  "wdcs.org",
  "whales.org",
  "ds-coalition.org",
  "clientearth.org",
  "edf.org",
  "pewtrusts.org",
  "mcsuk.org",
  "msc.org",
  "iucn.org",
];

const ACADEMIC_DOMAIN_FRAGMENTS = [
  "nature.com",
  "science.org",
  "plos.org",
  "frontiersin.org",
  "ices.dk",
  "sciencedirect.com",
  "springer.com",
  "onlinelibrary.wiley.com",
  "tandfonline.com",
  "jstor.org",
  "academic.oup.com",
  "cell.com",
  "pnas.org",
  "scripps.ucsd.edu",
  "whoi.edu",
  "mbari.org",
  "bas.ac.uk",
];

/**
 * Classify a story source into a type for RAG retrieval.
 *
 * @param sourceName - The source_name field from the stories table
 * @param sourceUrl  - Optional URL for domain-based fallback matching
 */
export function classifySourceType(
  sourceName: string | null | undefined,
  sourceUrl?: string | null
): SourceType {
  if (sourceName) {
    const name = sourceName.trim();

    if (GOVERNMENT_SOURCES.has(name)) return "GOVERNMENT";
    if (NGO_SOURCES.has(name)) return "NGO";
    if (ACADEMIC_SOURCES.has(name)) return "ACADEMIC";

    // Partial name heuristics for government bodies not in the exact set
    const nameLower = name.toLowerCase();
    if (
      nameLower.startsWith("un ") ||
      nameLower.startsWith("united nations") ||
      nameLower.includes("ministry of") ||
      nameLower.includes("department of") ||
      nameLower.includes("government of") ||
      nameLower.includes("secretariat")
    ) {
      return "GOVERNMENT";
    }
  }

  // Domain-based fallback when URL is available
  if (sourceUrl) {
    const url = sourceUrl.toLowerCase();
    if (GOVERNMENT_DOMAIN_FRAGMENTS.some((d) => url.includes(d))) return "GOVERNMENT";
    if (NGO_DOMAIN_FRAGMENTS.some((d) => url.includes(d))) return "NGO";
    if (ACADEMIC_DOMAIN_FRAGMENTS.some((d) => url.includes(d))) return "ACADEMIC";
  }

  return "PRESS";
}
