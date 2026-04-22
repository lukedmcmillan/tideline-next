export interface RSSSource {
  name: string;
  rss: string;
  topic: string;
  type: string;
}

export const RSS_SOURCES: RSSSource[] = [
  // ─── GOVERNMENT ───────────────────────────────────────────────────────────────
  { name: "NOAA", rss: "https://www.noaa.gov/rss.xml", topic: "climate", type: "gov" },
  { name: "Fisheries and Oceans Canada (DFO)", rss: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=fisheriesoceans&sort=publishedDate&orderBy=desc&publishedDate%3E=2022-04-01&pick=25&format=atom&atomtitle=Canada%20News%20Centre%20-%20Fisheries%20and%20Oceans%20Canada", topic: "fisheries", type: "gov" },
  { name: "UK DEFRA", rss: "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom", topic: "governance", type: "gov" },
  { name: "UK MMO", rss: "https://www.gov.uk/government/organisations/marine-management-organisation.atom", topic: "governance", type: "gov" },

  // ─── REGULATORY ───────────────────────────────────────────────────────────────
  { name: "ISA", rss: "https://www.isa.org.jm/feed", topic: "dsm", type: "reg" },
  // UNEP uses non-standard XML: <response> root, <path> for URLs, dates in <created><time datetime="..."></created>.
  // Handled by the generalised parser (no special-case code needed).
  { name: "UNEP", rss: "https://www.unep.org/news-and-stories/rss.xml", topic: "governance", type: "reg" },
  // CITES removed 2026-04-22: Cloudflare blocks Vercel IPs. Add to harvest-scraped-sources via Jina scraper.
  { name: "HELCOM", rss: "https://helcom.fi/feed/", topic: "governance", type: "reg" },
  { name: "CCAMLR", rss: "https://www.ccamlr.org/en/rss.xml", topic: "governance", type: "reg" },
  { name: "IPCC", rss: "https://www.ipcc.ch/feed/", topic: "climate", type: "reg" },
  // CBD Secretariat: moved to Jina scraper 2026-04-20 (site "Under Construction", no RSS)

  // ─── NGOs ─────────────────────────────────────────────────────────────────────
  { name: "Oceana", rss: "https://oceana.org/feed/", topic: "all", type: "ngo" },
  // WWF removed 2026-04-22: Cloudflare blocks Vercel IPs. Add to harvest-scraped-sources via Jina scraper.
  { name: "Ocean Conservancy", rss: "https://oceanconservancy.org/feed/", topic: "pollution", type: "ngo" },
  { name: "Sea Shepherd", rss: "https://seashepherd.org/feed/", topic: "iuu", type: "ngo" },
  { name: "Blue Marine Foundation", rss: "https://www.bluemarinefoundation.com/feed/", topic: "mpa", type: "ngo" },
  { name: "Global Fishing Watch", rss: "https://globalfishingwatch.org/feed/", topic: "iuu", type: "ngo" },
  { name: "High Seas Alliance", rss: "https://highseasalliance.org/feed/", topic: "governance", type: "ngo" },
  // DSCC removed 2026-04-22: savethehighseas.org/feed/ returns HTML not RSS. No alternative feed found. Consider adding to harvest-scraped-sources via Jina.

  // ─── RESEARCH & SCIENCE ───────────────────────────────────────────────────────
  // Nature Ocean & Marine removed 2026-04-22: search RSS endpoint at nature.com/search.rss is 404. No alternative.
  { name: "Nature Climate Change", rss: "https://www.nature.com/nclimate.rss", topic: "climate", type: "res" },
  { name: "Nature Sustainability", rss: "https://www.nature.com/natsustain.rss", topic: "governance", type: "res" },
  { name: "Nature Ecology & Evolution", rss: "https://www.nature.com/natecolevol.rss", topic: "science", type: "res" },
  { name: "Science Ocean Research", rss: "https://www.science.org/rss/news_current.xml", topic: "science", type: "res" },
  { name: "Scripps Oceanography", rss: "https://scripps.ucsd.edu/news/feed/", topic: "science", type: "res" },
  { name: "WHOI", rss: "https://www.whoi.edu/feed/", topic: "science", type: "res" },
  { name: "MBARI", rss: "https://www.mbari.org/feed/", topic: "technology", type: "res" },
  // PLOS ONE Marine removed 2026-04-22: re-audit confirmed 9 quarantines in 12h (burns, eye disease, management studies). Not ocean-specific.
  { name: "British Antarctic Survey", rss: "https://www.bas.ac.uk/feed/", topic: "climate", type: "res" },
  // Plymouth Marine Laboratory removed 2026-04-22: redirects www→non-www (301), Vercel IP blocked at redirect destination.

  // ─── MEDIA ────────────────────────────────────────────────────────────────────
  { name: "Mongabay Oceans", rss: "https://news.mongabay.com/topic/oceans/feed/", topic: "all", type: "media" },
  { name: "Guardian Oceans", rss: "https://www.theguardian.com/environment/oceans/rss", topic: "governance", type: "media" },
  { name: "Guardian Fishing", rss: "https://www.theguardian.com/environment/fishing/rss", topic: "fisheries", type: "media" },
  { name: "Hakai Magazine", rss: "https://www.hakaimagazine.com/feed/", topic: "all", type: "media" },
  { name: "Undercurrent News", rss: "https://www.undercurrentnews.com/feed/", topic: "fisheries", type: "media" },
  { name: "Oceanographic Magazine", rss: "https://oceanographicmagazine.com/news/feed/", topic: "all", type: "media" },
  { name: "Phys.org Ocean", rss: "https://phys.org/rss-feed/earth-news/", topic: "science", type: "media" },
  { name: "BBC Science & Environment", rss: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", topic: "science", type: "media" },
  { name: "Carbon Brief", rss: "https://www.carbonbrief.org/feed/", topic: "climate", type: "media" },
  { name: "gCaptain", rss: "https://gcaptain.com/feed/", topic: "shipping", type: "media" },
  { name: "Splash247", rss: "https://splash247.com/feed/", topic: "shipping", type: "media" },

  // ─── ESG / FINANCE ────────────────────────────────────────────────────────────
  // Bloomberg Green removed 2026-04-22: re-audit confirmed 6 quarantines in 12h. General climate/ESG, rarely ocean-specific.
];

// Sources that are ocean-dedicated and bypass the keyword filter.
// All sources here have their full output ingested without title-keyword matching.
export const OCEAN_DEDICATED_SOURCES = new Set([
  // NGOs
  'Oceana', 'Ocean Conservancy', 'Sea Shepherd',
  'Blue Marine Foundation', 'Global Fishing Watch',
  'High Seas Alliance',
  // Research
  'WHOI', 'Scripps Oceanography', 'MBARI',
  'British Antarctic Survey',
  // Regulatory
  'ISA', 'HELCOM', 'CCAMLR', 'IPCC', 'CBD Secretariat',
  // Media (ocean-specific)
  'Mongabay Oceans', 'Hakai Magazine', 'Oceanographic Magazine',
  'Undercurrent News', 'gCaptain', 'Splash247', 'BBC Science & Environment',
  // Nature journals (topic-filtered already)
  'Nature Climate Change', 'Nature Sustainability', 'Nature Ecology & Evolution',
  // Government (ocean-specific remits)
  'UK MMO', 'Fisheries and Oceans Canada (DFO)',
]);
