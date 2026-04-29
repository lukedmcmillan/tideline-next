/**
 * Static starter set config for onboarding v2.
 * Keyed by entity name (not UUID) so it survives entity merges/renames.
 * The API looks up IDs at request time against the entities table.
 *
 * Each entry: { name, tracker_tags[] }
 * tracker_tags align with the tracker domains used across the platform:
 *   imo-shipping, wto-fisheries, isa, bbnj, plastics,
 *   30x30, iuu, blue-finance, offshore-wind, cites-marine
 */

export type JobType =
  | "marine_lawyer"
  | "esg_analyst"
  | "blue_finance"
  | "shipping_compliance"
  | "ngo_campaigner"
  | "generalist";

export interface StarterEntity {
  name: string;
  tracker_tags: string[];
}

export const STARTER_SETS: Record<JobType, StarterEntity[]> = {
  marine_lawyer: [
    { name: "International Maritime Organization", tracker_tags: ["imo-shipping"] },
    { name: "International Seabed Authority", tracker_tags: ["isa"] },
    { name: "International Tribunal for the Law of the Sea", tracker_tags: ["bbnj"] },
    { name: "UN Division for Ocean Affairs and the Law of the Sea", tracker_tags: ["bbnj"] },
    { name: "BBNJ Agreement", tracker_tags: ["bbnj"] },
    { name: "UNCLOS", tracker_tags: ["bbnj"] },
    { name: "Port State Measures Agreement", tracker_tags: ["iuu"] },
    { name: "CITES Secretariat", tracker_tags: ["cites-marine"] },
    { name: "World Trade Organization", tracker_tags: ["wto-fisheries"] },
    { name: "European Commission", tracker_tags: ["imo-shipping", "iuu"] },
    { name: "London Convention and Protocol", tracker_tags: ["imo-shipping"] },
    { name: "OSPAR Commission", tracker_tags: ["30x30"] },
    { name: "CCAMLR", tracker_tags: ["30x30", "iuu"] },
    { name: "Nairobi Convention", tracker_tags: ["30x30"] },
    { name: "Helsinki Commission", tracker_tags: ["30x30"] },
  ],

  esg_analyst: [
    { name: "TNFD", tracker_tags: ["blue-finance"] },
    { name: "ISSB Standards", tracker_tags: ["blue-finance"] },
    { name: "European Commission", tracker_tags: ["blue-finance", "imo-shipping"] },
    { name: "CSRD", tracker_tags: ["blue-finance"] },
    { name: "International Maritime Organization", tracker_tags: ["imo-shipping"] },
    { name: "Science Based Targets Network", tracker_tags: ["blue-finance"] },
    { name: "UN Global Compact", tracker_tags: ["blue-finance"] },
    { name: "World Benchmarking Alliance", tracker_tags: ["blue-finance"] },
    { name: "CDP", tracker_tags: ["blue-finance"] },
    { name: "BBNJ Agreement", tracker_tags: ["bbnj"] },
    { name: "Convention on Biological Diversity", tracker_tags: ["30x30"] },
    { name: "World Bank", tracker_tags: ["blue-finance"] },
    { name: "Asian Development Bank", tracker_tags: ["blue-finance"] },
    { name: "EU Taxonomy", tracker_tags: ["blue-finance"] },
    { name: "Global Reporting Initiative Standards", tracker_tags: ["blue-finance"] },
  ],

  blue_finance: [
    { name: "World Bank", tracker_tags: ["blue-finance"] },
    { name: "Asian Development Bank", tracker_tags: ["blue-finance"] },
    { name: "TNFD", tracker_tags: ["blue-finance"] },
    { name: "ISSB Standards", tracker_tags: ["blue-finance"] },
    { name: "International Finance Corporation", tracker_tags: ["blue-finance"] },
    { name: "Blue Bond Initiative", tracker_tags: ["blue-finance"] },
    { name: "UN Capital Development Fund", tracker_tags: ["blue-finance"] },
    { name: "European Investment Bank", tracker_tags: ["blue-finance"] },
    { name: "Green Climate Fund", tracker_tags: ["blue-finance"] },
    { name: "Global Environment Facility", tracker_tags: ["blue-finance"] },
    { name: "CSRD", tracker_tags: ["blue-finance"] },
    { name: "EU Taxonomy", tracker_tags: ["blue-finance"] },
    { name: "Science Based Targets Network", tracker_tags: ["blue-finance"] },
    { name: "Convention on Biological Diversity", tracker_tags: ["30x30"] },
    { name: "BBNJ Agreement", tracker_tags: ["bbnj"] },
  ],

  shipping_compliance: [
    { name: "International Maritime Organization", tracker_tags: ["imo-shipping"] },
    { name: "Marine Environment Protection Committee", tracker_tags: ["imo-shipping"] },
    { name: "Maritime Safety Committee", tracker_tags: ["imo-shipping"] },
    { name: "EU Emissions Trading System", tracker_tags: ["imo-shipping"] },
    { name: "FuelEU Maritime", tracker_tags: ["imo-shipping"] },
    { name: "CII Rating", tracker_tags: ["imo-shipping"] },
    { name: "European Commission", tracker_tags: ["imo-shipping", "iuu"] },
    { name: "Paris MOU", tracker_tags: ["imo-shipping", "iuu"] },
    { name: "Tokyo MOU", tracker_tags: ["imo-shipping", "iuu"] },
    { name: "US Coast Guard", tracker_tags: ["imo-shipping", "iuu"] },
    { name: "DNV", tracker_tags: ["imo-shipping"] },
    { name: "Lloyds Register", tracker_tags: ["imo-shipping"] },
    { name: "Poseidon Principles", tracker_tags: ["imo-shipping", "blue-finance"] },
    { name: "World Trade Organization", tracker_tags: ["wto-fisheries"] },
    { name: "International Convention on Ballast Water Management", tracker_tags: ["imo-shipping"] },
  ],

  ngo_campaigner: [
    { name: "High Seas Alliance", tracker_tags: ["bbnj"] },
    { name: "BBNJ Agreement", tracker_tags: ["bbnj"] },
    { name: "Deep Sea Conservation Coalition", tracker_tags: ["isa"] },
    { name: "International Seabed Authority", tracker_tags: ["isa"] },
    { name: "Convention on Biological Diversity", tracker_tags: ["30x30"] },
    { name: "IUCN", tracker_tags: ["30x30", "cites-marine"] },
    { name: "Greenpeace International", tracker_tags: ["isa", "bbnj"] },
    { name: "Oceana", tracker_tags: ["iuu", "30x30"] },
    { name: "WWF", tracker_tags: ["30x30", "blue-finance"] },
    { name: "Pew Charitable Trusts", tracker_tags: ["30x30", "iuu"] },
    { name: "Ocean Conservancy", tracker_tags: ["plastics"] },
    { name: "Plastic Pollution Coalition", tracker_tags: ["plastics"] },
    { name: "Environmental Justice Foundation", tracker_tags: ["iuu"] },
    { name: "Global Fishing Watch", tracker_tags: ["iuu"] },
    { name: "CCAMLR", tracker_tags: ["30x30", "iuu"] },
  ],

  generalist: [
    { name: "International Maritime Organization", tracker_tags: ["imo-shipping"] },
    { name: "International Seabed Authority", tracker_tags: ["isa"] },
    { name: "BBNJ Agreement", tracker_tags: ["bbnj"] },
    { name: "Convention on Biological Diversity", tracker_tags: ["30x30"] },
    { name: "World Trade Organization", tracker_tags: ["wto-fisheries"] },
    { name: "TNFD", tracker_tags: ["blue-finance"] },
    { name: "European Commission", tracker_tags: ["imo-shipping", "blue-finance"] },
    { name: "CITES Secretariat", tracker_tags: ["cites-marine"] },
    { name: "IUCN", tracker_tags: ["30x30", "cites-marine"] },
    { name: "Global Fishing Watch", tracker_tags: ["iuu"] },
    { name: "Marine Environment Protection Committee", tracker_tags: ["imo-shipping"] },
    { name: "World Bank", tracker_tags: ["blue-finance"] },
    { name: "High Seas Alliance", tracker_tags: ["bbnj"] },
    { name: "ISSB Standards", tracker_tags: ["blue-finance"] },
    { name: "Ocean Conservancy", tracker_tags: ["plastics"] },
  ],
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  marine_lawyer: "Marine Lawyer",
  esg_analyst: "ESG Analyst",
  blue_finance: "Blue Finance",
  shipping_compliance: "Shipping Compliance",
  ngo_campaigner: "NGO Campaigner",
  generalist: "Generalist",
};

export const JOB_TYPES = Object.keys(STARTER_SETS) as JobType[];
