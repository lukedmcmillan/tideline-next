import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Same source list as fetch-feeds — single source of truth
const RSS_SOURCES = [
  { name: "NOAA Fisheries", rss: "https://www.fisheries.noaa.gov/rss.xml" },
  { name: "NOAA Ocean Service", rss: "https://oceanservice.noaa.gov/rss/oceancast.xml" },
  { name: "NOAA News", rss: "https://www.noaa.gov/news-release/feed" },
  { name: "EPA Water News", rss: "https://www.epa.gov/rss/epa-news-releases.rss" },
  { name: "European Environment Agency", rss: "https://www.eea.europa.eu/rss/highlights.rss" },
  { name: "UK DEFRA", rss: "https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom" },
  { name: "FAO Fisheries", rss: "https://www.fao.org/fishery/rss/en" },
  { name: "ISA", rss: "https://www.isa.org.jm/feed" },
  { name: "IMO News", rss: "https://www.imo.org/en/MediaCentre/PressBriefings/Pages/rss.aspx" },
  { name: "CITES", rss: "https://cites.org/eng/news/rss.xml" },
  { name: "IWC", rss: "https://iwc.int/en/news/feed" },
  { name: "IUCN Red List", rss: "https://www.iucnredlist.org/rss.xml" },
  { name: "WWF", rss: "https://www.worldwildlife.org/press-releases.rss" },
  { name: "Oceana", rss: "https://oceana.org/rss.xml" },
  { name: "Ocean Conservancy", rss: "https://oceanconservancy.org/feed/" },
  { name: "Sea Shepherd", rss: "https://seashepherd.org/feed/" },
  { name: "Shark Trust", rss: "https://www.sharktrust.org/feed" },
  { name: "WCS Marine", rss: "https://newsroom.wcs.org/rss.aspx" },
  { name: "Plastic Soup Foundation", rss: "https://www.plasticsoupfoundation.org/en/feed/" },
  { name: "Sea Turtle Conservancy", rss: "https://conserveturtles.org/feed/" },
  { name: "Reef Check", rss: "https://www.reefcheck.org/feed/" },
  { name: "DSCC", rss: "https://www.savethehighseas.org/feed/" },
  { name: "Blue Marine Foundation", rss: "https://www.bluemarinefoundation.com/feed/" },
  { name: "Mission Blue", rss: "https://mission-blue.org/feed/" },
  { name: "ClientEarth", rss: "https://www.clientearth.org/rss/latest-news/" },
  { name: "EDF Oceans", rss: "https://www.edf.org/feed/category/oceans" },
  { name: "5 Gyres", rss: "https://www.5gyres.org/feed" },
  { name: "The Ocean Foundation", rss: "https://oceanfdn.org/feed/" },
  { name: "Surfrider Foundation", rss: "https://www.surfrider.org/feed" },
  { name: "Global Fishing Watch", rss: "https://globalfishingwatch.org/feed/" },
  { name: "MSC", rss: "https://www.msc.org/media-centre/news-opinion/rss" },
  { name: "Marine Conservation Society", rss: "https://www.mcsuk.org/feed/" },
  { name: "High Seas Alliance", rss: "https://highseasalliance.org/feed/" },
  { name: "Deep Sea Conservation Coalition", rss: "https://www.savethehighseas.org/feed/" },
  { name: "WWF Oceans", rss: "https://www.worldwildlife.org/stories.rss" },
  { name: "Nature Ocean & Marine", rss: "https://www.nature.com/search.rss?q=ocean&subject=earth-and-environmental-sciences" },
  { name: "Nature Climate Change", rss: "https://www.nature.com/nclimate.rss" },
  { name: "Nature Sustainability", rss: "https://www.nature.com/natsustain.rss" },
  { name: "Nature Ecology & Evolution", rss: "https://www.nature.com/natecolevol.rss" },
  { name: "Science Ocean Research", rss: "https://www.science.org/rss/news_current.xml" },
  { name: "Scripps Oceanography", rss: "https://scripps.ucsd.edu/news/rss.xml" },
  { name: "WHOI", rss: "https://www.whoi.edu/press-room/news-releases/rss/" },
  { name: "MBARI", rss: "https://www.mbari.org/feed/" },
  { name: "Smithsonian Ocean", rss: "https://ocean.si.edu/rss.xml" },
  { name: "PLOS ONE Marine", rss: "https://journals.plos.org/plosone/feed/atom?filterSubjects=Marine+and+aquatic+sciences" },
  { name: "British Antarctic Survey", rss: "https://www.bas.ac.uk/feed/" },
  { name: "National Oceanography Centre", rss: "https://noc.ac.uk/feed" },
  { name: "Plymouth Marine Laboratory", rss: "https://www.pml.ac.uk/feed/" },
  { name: "Mongabay Oceans", rss: "https://news.mongabay.com/oceans/feed/" },
  { name: "Guardian Oceans", rss: "https://www.theguardian.com/environment/oceans/rss" },
  { name: "Guardian Fishing", rss: "https://www.theguardian.com/environment/fishing/rss" },
  { name: "Hakai Magazine", rss: "https://www.hakaimagazine.com/feed/" },
  { name: "The Fish Site", rss: "https://thefishsite.com/feed" },
  { name: "Undercurrent News", rss: "https://www.undercurrentnews.com/feed/" },
  { name: "IntraFish", rss: "https://www.intrafish.com/rss" },
  { name: "BBC Science & Environment", rss: "https://feeds.bbci.co.uk/news/science_environment/rss.xml" },
  { name: "ScienceAlert", rss: "https://www.sciencealert.com/feed" },
  { name: "National Geographic", rss: "https://www.nationalgeographic.com/feed/rss" },
  { name: "New Scientist", rss: "https://www.newscientist.com/feed/home/" },
  { name: "Natural History Museum", rss: "https://www.nhm.ac.uk/discover/news/rss-feed.xml" },
  { name: "Oceanographic Magazine", rss: "https://oceanographicmagazine.com/news/feed/" },
  { name: "Phys.org Ocean", rss: "https://phys.org/rss-feed/earth-news/" },
  { name: "Carbon Brief", rss: "https://www.carbonbrief.org/feed/" },
  { name: "Bloomberg Green", rss: "https://feeds.bloomberg.com/green/news.rss" },
  { name: "GreenBiz", rss: "https://www.greenbiz.com/rss.xml" },
  { name: "OECD Ocean Finance", rss: "https://www.oecd.org/ocean/rss.xml" },
  { name: "CBD Secretariat", rss: "https://www.cbd.int/rss/news.xml" },
  { name: "IPCC", rss: "https://www.ipcc.ch/feed/" },
];

interface CheckResult {
  source_name: string;
  rss_url: string;
  http_status: number | null;
  response_time_ms: number;
  items_returned: number;
  most_recent_item: string | null;
  health: "healthy" | "stale" | "dead";
  error_message: string | null;
}

function extractMostRecentDate(xml: string): string | null {
  const datePatterns = [
    /<pubDate[^>]*>(.*?)<\/pubDate>/i,
    /<published[^>]*>(.*?)<\/published>/i,
    /<updated[^>]*>(.*?)<\/updated>/i,
    /<dc:date[^>]*>(.*?)<\/dc:date>/i,
  ];
  for (const pattern of datePatterns) {
    const match = xml.match(pattern);
    if (match) {
      const d = new Date(match[1].trim());
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

function countItems(xml: string): number {
  const items = xml.match(/<item[\s>]/gi) || [];
  const entries = xml.match(/<entry[\s>]/gi) || [];
  return Math.max(items.length, entries.length);
}

async function checkSource(source: { name: string; rss: string }): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(source.rss, {
      headers: { "User-Agent": "Tideline/1.0 Source Monitor" },
      signal: AbortSignal.timeout(10000),
    });
    const elapsed = Date.now() - start;

    if (!res.ok) {
      return {
        source_name: source.name,
        rss_url: source.rss,
        http_status: res.status,
        response_time_ms: elapsed,
        items_returned: 0,
        most_recent_item: null,
        health: "dead",
        error_message: `HTTP ${res.status}`,
      };
    }

    const xml = await res.text();
    const itemCount = countItems(xml);
    const mostRecent = extractMostRecentDate(xml);

    let health: "healthy" | "stale" | "dead" = "healthy";
    if (itemCount === 0) {
      health = "dead";
    } else if (mostRecent) {
      const age = Date.now() - new Date(mostRecent).getTime();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      if (age > fourteenDays) health = "stale";
    }

    return {
      source_name: source.name,
      rss_url: source.rss,
      http_status: res.status,
      response_time_ms: elapsed,
      items_returned: itemCount,
      most_recent_item: mostRecent,
      health,
      error_message: null,
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      source_name: source.name,
      rss_url: source.rss,
      http_status: null,
      response_time_ms: elapsed,
      items_returned: 0,
      most_recent_item: null,
      health: "dead",
      error_message: msg.includes("abort") || msg.includes("timeout") ? "Timeout (10s)" : msg,
    };
  }
}

async function sendAlertEmail(deadSources: CheckResult[]) {
  const rows = deadSources
    .map((s) => `- ${s.source_name}: ${s.error_message || "No items"} (${s.rss_url})`)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tideline Ops <noreply@thetideline.co>",
      to: "luke@thetideline.co",
      subject: `Source monitor: ${deadSources.length} dead feeds`,
      text: `Weekly source health check found ${deadSources.length} dead RSS feeds:\n\n${rows}\n\nCheck the source_health_checks table for full details.`,
    }),
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check all sources (5 concurrent to avoid overwhelming)
  const results: CheckResult[] = [];
  const batchSize = 5;
  for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
    const batch = RSS_SOURCES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkSource));
    results.push(...batchResults);
  }

  const healthy = results.filter((r) => r.health === "healthy");
  const stale = results.filter((r) => r.health === "stale");
  const dead = results.filter((r) => r.health === "dead");

  // Write individual check results
  try {
    await supabase.from("source_health_checks").insert(
      results.map((r) => ({
        source_name: r.source_name,
        rss_url: r.rss_url,
        http_status: r.http_status,
        response_time_ms: r.response_time_ms,
        items_returned: r.items_returned,
        most_recent_item: r.most_recent_item,
        health: r.health,
        error_message: r.error_message,
      }))
    );
  } catch (err) {
    console.error("Failed to write health checks:", err);
  }

  // Write summary log
  try {
    await supabase.from("source_health_log").insert({
      total: results.length,
      healthy_count: healthy.length,
      stale_count: stale.length,
      dead_count: dead.length,
    });
  } catch (err) {
    console.error("Failed to write health log:", err);
  }

  // Alert if more than 3 dead sources
  if (dead.length > 3) {
    try {
      await sendAlertEmail(dead);
    } catch (err) {
      console.error("Failed to send alert email:", err);
    }
  }

  return NextResponse.json({
    total: results.length,
    healthy: healthy.length,
    stale: stale.length,
    dead: dead.length,
    dead_sources: dead.map((d) => ({
      name: d.source_name,
      error: d.error_message,
    })),
    stale_sources: stale.map((s) => ({
      name: s.source_name,
      most_recent: s.most_recent_item,
    })),
  });
}
