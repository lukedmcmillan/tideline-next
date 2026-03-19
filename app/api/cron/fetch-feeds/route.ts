import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RSS_SOURCES = [
  { name: "NOAA Fisheries", rss: "https://www.fisheries.noaa.gov/rss.xml", topic: "fisheries", type: "gov" },
  { name: "NOAA Ocean Service", rss: "https://oceanservice.noaa.gov/rss/oceancast.xml", topic: "climate", type: "gov" },
  { name: "NOAA Climate", rss: "https://www.climate.gov/rss.xml", topic: "climate", type: "gov" },
  { name: "EPA Water News", rss: "https://www.epa.gov/rss/epa-news-releases.rss", topic: "pollution", type: "gov" },
  { name: "European Environment Agency", rss: "https://www.eea.europa.eu/rss/highlights.rss", topic: "governance", type: "gov" },
  { name: "ISA", rss: "https://www.isa.org.jm/feed", topic: "dsm", type: "reg" },
  { name: "IUCN Red List", rss: "https://www.iucnredlist.org/rss.xml", topic: "iucn", type: "ngo" },
  { name: "WWF", rss: "https://www.worldwildlife.org/press-releases.rss", topic: "all", type: "ngo" },
  { name: "Oceana", rss: "https://oceana.org/rss.xml", topic: "all", type: "ngo" },
  { name: "Ocean Conservancy", rss: "https://oceanconservancy.org/feed/", topic: "pollution", type: "ngo" },
  { name: "Sea Shepherd", rss: "https://seashepherd.org/feed/", topic: "iuu", type: "ngo" },
  { name: "Shark Trust", rss: "https://www.sharktrust.org/feed", topic: "sharks", type: "ngo" },
  { name: "WCS Marine", rss: "https://newsroom.wcs.org/rss.aspx", topic: "all", type: "ngo" },
  { name: "Plastic Soup Foundation", rss: "https://www.plasticsoupfoundation.org/en/feed/", topic: "pollution", type: "ngo" },
  { name: "Whale and Dolphin Conservation", rss: "https://uk.whales.org/feed/", topic: "whales", type: "ngo" },
  { name: "Sea Turtle Conservancy", rss: "https://conserveturtles.org/feed/", topic: "turtles", type: "ngo" },
  { name: "Reef Check", rss: "https://www.reefcheck.org/feed/", topic: "coral", type: "ngo" },
  { name: "DSCC", rss: "https://www.savethehighseas.org/feed/", topic: "dsm", type: "ngo" },
  { name: "Blue Marine Foundation", rss: "https://www.bluemarinefoundation.com/feed/", topic: "mpa", type: "ngo" },
  { name: "Mission Blue", rss: "https://mission-blue.org/feed/", topic: "mpa", type: "ngo" },
  { name: "Mongabay Oceans", rss: "https://news.mongabay.com/oceans/feed/", topic: "all", type: "media" },
  { name: "The Guardian Environment", rss: "https://www.theguardian.com/environment/rss", topic: "all", type: "media" },
  { name: "Hakai Magazine", rss: "https://www.hakaimagazine.com/feed/", topic: "all", type: "media" },
  { name: "Scripps Oceanography", rss: "https://scripps.ucsd.edu/news/rss.xml", topic: "science", type: "res" },
  { name: "MBARI", rss: "https://www.mbari.org/feed/", topic: "technology", type: "res" },
  { name: "Bloomberg Green", rss: "https://feeds.bloomberg.com/green/news.rss", topic: "bluefinance", type: "esg" },
]

async function parseRSSFeed(url: string): Promise<{ title: string; link: string; published_at: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tideline/1.0 RSS Reader' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items: { title: string; link: string; published_at: string }[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1]
      const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim()
      const link = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim()
        || item.match(/<link[^>]*href="([^"]+)"/i)?.[1]?.trim()
      const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim()
        || item.match(/<published[^>]*>(.*?)<\/published>/i)?.[1]?.trim()
      if (title && link) {
        items.push({
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          link: link.replace(/&amp;/g, '&'),
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        })
      }
    }
    return items.slice(0, 10)
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let totalSaved = 0
  let totalSkipped = 0

  for (const source of RSS_SOURCES) {
    const items = await parseRSSFeed(source.rss)
    for (const item of items) {
      const { error } = await supabase
        .from('stories')
        .upsert(
          {
            title: item.title,
            link: item.link,
            source_name: source.name,
            topic: source.topic,
            source_type: source.type,
            published_at: item.published_at,
          },
          { onConflict: 'link', ignoreDuplicates: true }
        )
      if (error) { totalSkipped++ } else { totalSaved++ }
    }
  }

  return NextResponse.json({
    success: true,
    saved: totalSaved,
    skipped: totalSkipped,
    sources: RSS_SOURCES.length,
    timestamp: new Date().toISOString(),
  })
}