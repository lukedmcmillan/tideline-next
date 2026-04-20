import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractEntities } from '@/lib/entities'
import { RSS_SOURCES, OCEAN_DEDICATED_SOURCES } from '@/app/lib/sources'
import { checkOceanRelevance } from '@/app/lib/ocean-relevance-gate'

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function parseRSSFeed(url: string): Promise<{ title: string; link: string; published_at: string | null; description: string | null }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tideline/1.0 RSS Reader' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()

    const items: { title: string; link: string; published_at: string | null; description: string | null }[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match

    const parseItems = (regex: RegExp, isAtom: boolean) => {
      while ((match = regex.exec(xml)) !== null) {
        const item = match[1]
        const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim()
        const link = isAtom
          ? item.match(/<link[^>]*href="([^"]+)"/i)?.[1]?.trim()
          : item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim()
            || item.match(/<link[^>]*href="([^"]+)"/i)?.[1]?.trim()
        const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim()
          || item.match(/<published[^>]*>(.*?)<\/published>/i)?.[1]?.trim()
          || item.match(/<updated[^>]*>(.*?)<\/updated>/i)?.[1]?.trim()
          || item.match(/<dc:date[^>]*>(.*?)<\/dc:date>/i)?.[1]?.trim()

        const descRaw = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim()
          || item.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)?.[1]?.trim()
          || item.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1]?.trim()
          || ''
        const description = descRaw
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
          .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ').trim()

        if (title && link) {
          items.push({
            title: title
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#038;/g, '&')
              .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, '"')
              .replace(/&#8221;/g, '"').replace(/&#8211;/g, '-').replace(/&#8212;/g, '-')
              .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '...').replace(/<[^>]+>/g, '').trim(),
            link: link.replace(/&amp;/g, '&'),
            published_at: pubDate ? new Date(pubDate).toISOString() : null,
            description: description || null,
          })
        }
      }
    }

    parseItems(itemRegex, false)
    if (items.length === 0) parseItems(entryRegex, true)

    return items.slice(0, 10)
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalSaved = 0
  let totalSkipped = 0
  const errors: string[] = []

  // Ocean-relevance gate metrics (shadow mode)
  let gateProcessed = 0
  let gateWouldQuarantine = 0
  let gateUnavailable = 0
  let gateTotalMs = 0
  const quarantineSampleTitles: string[] = []

  const oceanKeywords = [
    'ocean', 'marine', 'sea ', 'seas', 'coral', 'fish', 'whale', 'shark', 'trawl',
    'fishing', 'coastal', 'reef', 'dolphin', 'plastic', 'pollution', 'climate', 'carbon',
    'arctic', 'antarctic', 'shipping', 'vessel', 'aquaculture', 'mangrove', 'kelp',
    'seagrass', 'deep-sea', 'tuna', 'salmon', 'bluefin', 'IUU', 'CITES', 'ISA', 'IMO',
    'NOAA', 'seabed', 'tidal', 'plankton', 'algae', 'cetacean', 'dugong', 'manatee',
    'walrus', 'seal ', 'seals', 'otter', 'pelican', 'albatross', 'seabird', 'bycatch',
    'overfishing', 'stock', 'quota', 'MPA', 'maritime', 'offshore', 'trawling',
  ]

  for (const source of RSS_SOURCES) {
    const items = await parseRSSFeed(source.rss)

    for (const item of items) {
      // Skip articles with no pub date
      if (!item.published_at) {
        totalSkipped++
        continue
      }

      // Skip articles older than 60 days
      const pubDate = new Date(item.published_at)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 60)
      if (pubDate < cutoff) {
        totalSkipped++
        continue
      }

      // Skip non-English titles
      if (/\b(les|des|une|pour|dans|avec|sur|est|del|los|las|por|una|con|que|como|der|die|und|auch|nicht)\b/i.test(item.title)) {
        totalSkipped++
        continue
      }
      // Skip titles with predominantly non-Latin characters
      if (/[\u0400-\u04FF\u10A0-\u10FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF]/.test(item.title)) {
        totalSkipped++
        continue
      }

      // Skip non-ocean stories from general sources
      const isDedicated = OCEAN_DEDICATED_SOURCES.has(source.name)
      if (!isDedicated) {
        const titleLower = item.title.toLowerCase()
        const isRelevant = oceanKeywords.some(kw => titleLower.includes(kw.toLowerCase()))
        if (!isRelevant) {
          totalSkipped++
          continue
        }
      }

      // Ocean-relevance gate (shadow mode — log but do not block)
      const gateResult = await checkOceanRelevance({
        title: item.title,
        content: item.description || '',
      })
      gateProcessed++
      gateTotalMs += gateResult.duration_ms
      if (gateResult.verdict === 'gate_unavailable') {
        gateUnavailable++
      }
      if (!gateResult.relevant) {
        gateWouldQuarantine++
        if (quarantineSampleTitles.length < 3) quarantineSampleTitles.push(item.title)
        try {
          await supabase.from('stories_quarantine').insert({
            title: item.title,
            source_name: source.name,
            url: item.link,
            published_at: item.published_at,
            raw_content: (item.description || '').slice(0, 500),
            haiku_verdict: gateResult.verdict,
            haiku_raw_response: gateResult.raw,
          })
        } catch { /* quarantine insert failure is non-fatal */ }
      }
      // Shadow mode: proceed with insert regardless of gate result

      const storyData: Record<string, unknown> = {
        title: item.title,
        link: item.link,
        source_name: source.name,
        topic: source.topic,
        source_type: source.type,
        published_at: item.published_at,
      }
      if (item.description) storyData.description = item.description

      const { data: upserted, error } = await supabase
        .from('stories')
        .upsert(storyData, { onConflict: 'link', ignoreDuplicates: true })
        .select('id, title, short_summary, full_summary')

      if (error) {
        totalSkipped++
      } else {
        totalSaved++
        // Fire-and-forget entity extraction for new stories
        if (upserted && upserted.length > 0) {
          const s = upserted[0]
          extractEntities(s)
            .then(() => supabase.from('stories').update({ entities_extracted: true }).eq('id', s.id))
            .catch(() => {})
        }
      }
    }

    if (items.length === 0) {
      errors.push(source.name)
    }
  }

  // Ocean-relevance gate shadow-mode summary
  const gateSummary = {
    run: new Date().toISOString(),
    processed: gateProcessed,
    would_quarantine: gateWouldQuarantine,
    gate_unavailable: gateUnavailable,
    avg_gate_ms: gateProcessed > 0 ? Math.round(gateTotalMs / gateProcessed) : 0,
    sample_quarantine_titles: quarantineSampleTitles,
  }
  console.log('[ocean-gate:shadow]', JSON.stringify(gateSummary))

  return NextResponse.json({
    success: true,
    saved: totalSaved,
    skipped: totalSkipped,
    sources: RSS_SOURCES.length,
    failed_sources: errors,
    ocean_gate_shadow: gateSummary,
    timestamp: new Date().toISOString(),
  })
}
