export interface RSSSource {
  name: string;
  rss: string;
  topic: string;
  type: string;
}

export const RSS_SOURCES: RSSSource[] = [
  // GOVERNMENT
  { name: "NOAA Fisheries", rss: "https://www.fisheries.noaa.gov/rss.xml", topic: "fisheries", type: "gov" },
  { name: "NOAA Ocean Service", rss: "https://oceanservice.noaa.gov/rss/oceancast.xml", topic: "climate", type: "gov" },
  { name: "NOAA News", rss: "https://www.noaa.gov/news-release/feed", topic: "climate", type: "gov" },
  { name: "EPA Water News", rss: "https://www.epa.gov/rss/epa-news-releases.rss", topic: "pollution", type: "gov" },
  { name: "European Environment Agency", rss: "https://www.eea.europa.eu/rss/highlights.rss", topic: "governance", type: "gov" },
  { name: "UK DEFRA", rss: "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom", topic: "governance", type: "gov" },
  { name: "FAO Fisheries", rss: "https://www.fao.org/fishery/rss/en", topic: "fisheries", type: "gov" },

  // REGULATORY
  { name: "ISA", rss: "https://www.isa.org.jm/feed", topic: "dsm", type: "reg" },
  { name: "IMO News", rss: "https://www.imo.org/en/MediaCentre/PressBriefings/Pages/rss.aspx", topic: "shipping", type: "reg" },
  { name: "CITES", rss: "https://cites.org/eng/news/rss.xml", topic: "cites", type: "reg" },
  { name: "IWC", rss: "https://iwc.int/en/news/feed", topic: "whales", type: "reg" },

  // NGOs
  { name: "IUCN Red List", rss: "https://www.iucnredlist.org/rss.xml", topic: "iucn", type: "ngo" },
  { name: "WWF", rss: "https://www.worldwildlife.org/press-releases.rss", topic: "all", type: "ngo" },
  { name: "Oceana", rss: "https://oceana.org/rss.xml", topic: "all", type: "ngo" },
  { name: "Ocean Conservancy", rss: "https://oceanconservancy.org/feed/", topic: "pollution", type: "ngo" },
  { name: "Sea Shepherd", rss: "https://seashepherd.org/feed/", topic: "iuu", type: "ngo" },
  { name: "Shark Trust", rss: "https://www.sharktrust.org/feed", topic: "sharks", type: "ngo" },
  { name: "WCS Marine", rss: "https://newsroom.wcs.org/rss.aspx", topic: "all", type: "ngo" },
  { name: "Plastic Soup Foundation", rss: "https://www.plasticsoupfoundation.org/en/feed/", topic: "pollution", type: "ngo" },
  { name: "Sea Turtle Conservancy", rss: "https://conserveturtles.org/feed/", topic: "turtles", type: "ngo" },
  { name: "Reef Check", rss: "https://www.reefcheck.org/feed/", topic: "coral", type: "ngo" },
  { name: "DSCC", rss: "https://www.savethehighseas.org/feed/", topic: "dsm", type: "ngo" },
  { name: "Blue Marine Foundation", rss: "https://www.bluemarinefoundation.com/feed/", topic: "mpa", type: "ngo" },
  { name: "Mission Blue", rss: "https://mission-blue.org/feed/", topic: "mpa", type: "ngo" },
  { name: "ClientEarth", rss: "https://www.clientearth.org/rss/latest-news/", topic: "governance", type: "ngo" },
  { name: "EDF Oceans", rss: "https://www.edf.org/feed/category/oceans", topic: "fisheries", type: "ngo" },
  { name: "5 Gyres", rss: "https://www.5gyres.org/feed", topic: "pollution", type: "ngo" },
  { name: "The Ocean Foundation", rss: "https://oceanfdn.org/feed/", topic: "acidification", type: "ngo" },
  { name: "Surfrider Foundation", rss: "https://www.surfrider.org/feed", topic: "pollution", type: "ngo" },
  { name: "Global Fishing Watch", rss: "https://globalfishingwatch.org/feed/", topic: "iuu", type: "ngo" },
  { name: "MSC", rss: "https://www.msc.org/media-centre/news-opinion/rss", topic: "fisheries", type: "ngo" },
  { name: "Marine Conservation Society", rss: "https://www.mcsuk.org/feed/", topic: "governance", type: "ngo" },
  { name: "High Seas Alliance", rss: "https://highseasalliance.org/feed/", topic: "governance", type: "ngo" },
  { name: "Deep Sea Conservation Coalition", rss: "https://www.savethehighseas.org/feed/", topic: "dsm", type: "ngo" },
  { name: "WWF Oceans", rss: "https://www.worldwildlife.org/stories.rss", topic: "governance", type: "ngo" },

  // RESEARCH & SCIENCE
  { name: "Nature Ocean & Marine", rss: "https://www.nature.com/search.rss?q=ocean&subject=earth-and-environmental-sciences", topic: "science", type: "res" },
  { name: "Nature Climate Change", rss: "https://www.nature.com/nclimate.rss", topic: "climate", type: "res" },
  { name: "Nature Sustainability", rss: "https://www.nature.com/natsustain.rss", topic: "governance", type: "res" },
  { name: "Nature Ecology & Evolution", rss: "https://www.nature.com/natecolevol.rss", topic: "science", type: "res" },
  { name: "Science Ocean Research", rss: "https://www.science.org/rss/news_current.xml", topic: "science", type: "res" },
  { name: "Scripps Oceanography", rss: "https://scripps.ucsd.edu/news/rss.xml", topic: "science", type: "res" },
  { name: "WHOI", rss: "https://www.whoi.edu/press-room/news-releases/rss/", topic: "science", type: "res" },
  { name: "MBARI", rss: "https://www.mbari.org/feed/", topic: "technology", type: "res" },
  { name: "Smithsonian Ocean", rss: "https://ocean.si.edu/rss.xml", topic: "science", type: "res" },
  { name: "PLOS ONE Marine", rss: "https://journals.plos.org/plosone/feed/atom?filterSubjects=Marine+and+aquatic+sciences", topic: "science", type: "res" },
  { name: "British Antarctic Survey", rss: "https://www.bas.ac.uk/feed/", topic: "climate", type: "res" },
  { name: "National Oceanography Centre", rss: "https://noc.ac.uk/feed", topic: "science", type: "res" },
  { name: "Plymouth Marine Laboratory", rss: "https://www.pml.ac.uk/feed/", topic: "science", type: "res" },

  // MEDIA
  { name: "Mongabay Oceans", rss: "https://news.mongabay.com/oceans/feed/", topic: "all", type: "media" },
  { name: "Guardian Oceans", rss: "https://www.theguardian.com/environment/oceans/rss", topic: "governance", type: "media" },
  { name: "Guardian Fishing", rss: "https://www.theguardian.com/environment/fishing/rss", topic: "fisheries", type: "media" },
  { name: "Hakai Magazine", rss: "https://www.hakaimagazine.com/feed/", topic: "all", type: "media" },
  { name: "The Fish Site", rss: "https://thefishsite.com/feed", topic: "aquaculture", type: "media" },
  { name: "Undercurrent News", rss: "https://www.undercurrentnews.com/feed/", topic: "fisheries", type: "media" },
  { name: "IntraFish", rss: "https://www.intrafish.com/rss", topic: "fisheries", type: "media" },
  { name: "BBC Science & Environment", rss: "https://feeds.bbci.co.uk/news/science_environment/rss.xml", topic: "all", type: "media" },
  { name: "ScienceAlert", rss: "https://www.sciencealert.com/feed", topic: "science", type: "media" },
  { name: "National Geographic", rss: "https://www.nationalgeographic.com/feed/rss", topic: "all", type: "media" },
  { name: "New Scientist", rss: "https://www.newscientist.com/feed/home/", topic: "science", type: "media" },
  { name: "Natural History Museum", rss: "https://www.nhm.ac.uk/discover/news/rss-feed.xml", topic: "science", type: "media" },
  { name: "Oceanographic Magazine", rss: "https://oceanographicmagazine.com/news/feed/", topic: "all", type: "media" },
  { name: "Phys.org Ocean", rss: "https://phys.org/rss-feed/earth-news/", topic: "science", type: "media" },
  { name: "Carbon Brief", rss: "https://www.carbonbrief.org/feed/", topic: "climate", type: "media" },

  // ESG / FINANCE
  { name: "Bloomberg Green", rss: "https://feeds.bloomberg.com/green/news.rss", topic: "bluefinance", type: "esg" },
  { name: "GreenBiz", rss: "https://www.greenbiz.com/rss.xml", topic: "bluefinance", type: "esg" },
  { name: "OECD Ocean Finance", rss: "https://www.oecd.org/ocean/rss.xml", topic: "bluefinance", type: "esg" },
  { name: "CBD Secretariat", rss: "https://www.cbd.int/rss/news.xml", topic: "governance", type: "reg" },
  { name: "IPCC", rss: "https://www.ipcc.ch/feed/", topic: "climate", type: "reg" },
];

export const OCEAN_DEDICATED_SOURCES = new Set([
  'Oceana', 'Ocean Conservancy', 'Sea Shepherd',
  'Shark Trust', 'Sea Turtle Conservancy', 'Reef Check', 'Blue Marine Foundation',
  'Mission Blue', 'Plastic Soup Foundation', 'The Ocean Foundation', 'Surfrider Foundation',
  'Global Fishing Watch', 'EDF Oceans', '5 Gyres', 'MSC', 'Marine Conservation Society',
  'ClientEarth', 'High Seas Alliance', 'DSCC', 'Deep Sea Conservation Coalition', 'WCS Marine',
  'WHOI', 'Scripps Oceanography', 'MBARI', 'Smithsonian Ocean', 'NASA Earth Observatory',
  'PLOS ONE Marine', 'Plymouth Marine Laboratory', 'British Antarctic Survey',
  'National Oceanography Centre', 'ICES', 'ISA', 'IUCN Red List', 'IMO News', 'CITES',
  'Mongabay Oceans', 'Hakai Magazine', 'Oceanographic Magazine', 'The Fish Site',
  'Undercurrent News', 'IntraFish', 'Natural History Museum', 'Bloomberg Green',
  'GreenBiz', 'OECD Ocean Finance', 'WWF Oceans', 'WWF', 'Nature Ocean & Marine',
  'Nature Climate Change', 'Nature Sustainability', 'Nature Ecology & Evolution',
  'IWC', 'Phys.org Ocean', 'Carbon Brief', 'NOAA News',
]);
