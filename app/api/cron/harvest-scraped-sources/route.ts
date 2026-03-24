import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Source definitions ───────────────────────────────────────────────────────
// Each entry defines an index page to scrape, a CSS-style pattern to find links,
// a URL prefix to resolve relative links, and metadata for the stories table.

interface ScrapedSource {
  name: string
  indexUrl: string       // The news/press release listing page
  linkPattern: RegExp    // Regex to extract article hrefs from the page HTML
  baseUrl: string        // Prepended to relative links
  topic: string
  type: string
}

const SCRAPED_SOURCES: ScrapedSource[] = [
  {
    name: 'IMO',
    indexUrl: 'https://www.imo.org/en/MediaCentre/PressBriefings/Pages/Home.aspx',
    // IMO press briefing links follow this pattern
    linkPattern: /href="(\/en\/MediaCentre\/PressBriefings\/Pages\/[^"]+\.aspx)"/g,
    baseUrl: 'https://www.imo.org',
    topic: 'shipping',
    type: 'reg',
  },
  {
    name: 'ISA',
    indexUrl: 'https://www.isa.int/en/Sections/external/Pages/newsroom.aspx',
    // ISA news links
    linkPattern: /href="(\/en\/Sections\/external\/Pages\/[^"]+\.aspx)"/g,
    baseUrl: 'https://www.isa.int',
    topic: 'dsm',
    type: 'reg',
  },
  {
    name: 'FAO Fisheries',
    indexUrl: 'https://www.fao.org/fishery/en/news',
    // FAO news links — typically /fishery/en/news/XXXXX
    linkPattern: /href="(\/fishery\/en\/news\/\d+[^"]*)"/g,
    baseUrl: 'https://www.fao.org',
    topic: 'fisheries',
    type: 'gov',
  },
  {
    name: 'UN BBNJ',
    indexUrl: 'https://www.un.org/bbnjagreement/en/news',
    // UN BBNJ news links
    linkPattern: /href="(\/bbnjagreement\/en\/news\/[^"]+)"/g,
    baseUrl: 'https://www.un.org',
    topic: 'governance',
    type: 'gov',
  },
  {
    name: 'IISD ENB Ocean',
    indexUrl: 'https://enb.iisd.org/oceans',
    // IISD ENB article links
    linkPattern: /href="(https:\/\/enb\.iisd\.org\/[^"]+\/\d{4}\/[^"]+)"/g,
    baseUrl: '',  // links are absolute
    topic: 'governance',
    type: 'ngo',
  },
]

// ─── Fetch index page and extract article URLs ────────────────────────────────

async function harvestSource(source: ScrapedSource): Promise<{
  name: string
  found: number
  inserted: number
  errors: number
}> {
  let found = 0
  let inserted = 0
  let errors = 0

  try {
    // Fetch the index page via Jina for clean HTML (handles JS rendering)
    const jinaUrl = `https://r.jina.ai/${source.indexUrl}`
    const res = await fetch(jinaUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
        'Accept': 'text/html',
        'X-Return-Format': 'html',
        'X-Timeout': '15',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.error(`[${source.name}] Jina fetch failed: ${res.status}`)
      return { name: source.name, found, inserted, errors: 1 }
    }

    const html = await res.text()

    // Extract all matching links
    const urls: string[] = []
    let match: RegExpExecArray | null
    const pattern = new RegExp(source.linkPattern.source, 'g')

    while ((match = pattern.exec(html)) !== null) {
      const href = match[1]
      const fullUrl = href.startsWith('http') ? href : `${source.baseUrl}${href}`
      // Deduplicate within this batch
      if (!urls.includes(fullUrl)) {
        urls.push(fullUrl)
      }
    }

    found = urls.length

    if (found === 0) {
      console.warn(`[${source.name}] No URLs matched pattern — index page structure may have changed`)
      return { name: source.name, found, inserted, errors: 0 }
    }

    // For each URL, extract a title from Jina metadata and insert into stories
    // We do this in batches of 3 to avoid hammering Jina
    const BATCH_SIZE = 3

    for (let i = 0; i < Math.min(urls.length, 10); i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async (url) => {
        try {
          // Fetch article title via Jina
          const articleRes = await fetch(`https://r.jina.ai/${url}`, {
            headers: {
              'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
              'Accept': 'text/plain',
              'X-Return-Format': 'markdown',
              'X-Timeout': '8',
            },
            signal: AbortSignal.timeout(12000),
          })

          if (!articleRes.ok) return

          const text = await articleRes.text()

          // Jina returns markdown with Title: on first line
          const titleMatch = text.match(/^Title:\s*(.+)$/m)
          const title = titleMatch?.[1]?.trim() || url

          // Skip if title is generic/empty
          if (!title || title === url || title.length < 10) return

          // Insert into stories — onConflict: 'link' means duplicates are silently skipped
          const { error } = await supabase
            .from('stories')
            .upsert(
              {
                title,
                link: url,
                source_name: source.name,
                topic: source.topic,
                source_type: source.type,
                published_at: new Date().toISOString(), // Jina doesn't reliably return pub dates
                // summary left null — picked up by summarise-stories cron
              },
              { onConflict: 'link', ignoreDuplicates: true }
            )

          if (error) {
            console.error(`[${source.name}] Supabase insert error for ${url}:`, error.message)
            errors++
          } else {
            inserted++
          }
        } catch (err) {
          console.error(`[${source.name}] Article fetch error for ${url}:`, err)
          errors++
        }
      }))

      // Small delay between batches
      if (i + BATCH_SIZE < urls.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  } catch (err) {
    console.error(`[${source.name}] Harvest error:`, err)
    errors++
  }

  return { name: source.name, found, inserted, errors }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = await Promise.allSettled(
    SCRAPED_SOURCES.map(source => harvestSource(source))
  )

  const summary = results.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : { name: 'unknown', found: 0, inserted: 0, errors: 1 }
  )

  const totalInserted = summary.reduce((acc, r) => acc + r.inserted, 0)
  const totalFound = summary.reduce((acc, r) => acc + r.found, 0)

  return NextResponse.json({
    success: true,
    sources_scraped: SCRAPED_SOURCES.length,
    urls_found: totalFound,
    stories_inserted: totalInserted,
    per_source: summary,
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  })
}
