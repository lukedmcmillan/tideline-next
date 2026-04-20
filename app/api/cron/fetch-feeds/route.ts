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

  // Ocean-relevance gate metrics
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

  // Phase 1: Collect all eligible items from all sources (fast, no AI calls)
  interface EligibleItem {
    title: string; link: string; published_at: string; description: string | null;
    source_name: string; topic: string; source_type: string;
  }
  const eligible: EligibleItem[] = []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  for (const source of RSS_SOURCES) {
    const items = await parseRSSFeed(source.rss)

    if (items.length === 0) {
      errors.push(source.name)
    }

    for (const item of items) {
      if (!item.published_at) { totalSkipped++; continue }
      if (new Date(item.published_at) < cutoff) { totalSkipped++; continue }
      if (/\b(les|des|une|pour|dans|avec|sur|est|del|los|las|por|una|con|que|como|der|die|und|auch|nicht)\b/i.test(item.title)) { totalSkipped++; continue }
      if (/[\u0400-\u04FF\u10A0-\u10FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF]/.test(item.title)) { totalSkipped++; continue }

      const isDedicated = OCEAN_DEDICATED_SOURCES.has(source.name)
      if (!isDedicated) {
        const titleLower = item.title.toLowerCase()
        const isRelevant = oceanKeywords.some(kw => titleLower.includes(kw.toLowerCase()))
        if (!isRelevant) { totalSkipped++; continue }
      }

      eligible.push({
        title: item.title,
        link: item.link,
        published_at: item.published_at,
        description: item.description,
        source_name: source.name,
        topic: source.topic,
        source_type: source.type,
      })
    }
  }

  // Phase 1.5: Per-source daily cap (soft 15% rule)
  const MAX_SOURCE_PERCENT = 0.15
  const today = new Date().toISOString().slice(0, 10)

  const { data: todayCounts } = await supabase
    .from('stories')
    .select('source_name')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)

  const sourceCountToday: Record<string, number> = {}
  for (const row of todayCounts || []) {
    sourceCountToday[row.source_name] = (sourceCountToday[row.source_name] || 0) + 1
  }

  const totalTodaySoFar = (todayCounts || []).length
  const maxPerSource = Math.max(5, Math.ceil(totalTodaySoFar * MAX_SOURCE_PERCENT))

  const capped: EligibleItem[] = []
  const cappedSources: string[] = []

  for (const item of eligible) {
    const currentCount = sourceCountToday[item.source_name] || 0
    if (currentCount >= maxPerSource) {
      if (!cappedSources.includes(item.source_name)) cappedSources.push(item.source_name)
      totalSkipped++
      continue
    }
    sourceCountToday[item.source_name] = currentCount + 1
    capped.push(item)
  }

  // Phase 2: Batch ocean-relevance gate calls (15 concurrent per batch)
  const GATE_BATCH = 15
  const gateResults: Awaited<ReturnType<typeof checkOceanRelevance>>[] = []

  for (let i = 0; i < capped.length; i += GATE_BATCH) {
    const batch = capped.slice(i, i + GATE_BATCH)
    const batchResults = await Promise.all(
      batch.map(item => checkOceanRelevance({ title: item.title, content: item.description || '' }))
    )
    gateResults.push(...batchResults)
  }

  // Phase 3: Process DB writes sequentially with gate results
  for (let i = 0; i < capped.length; i++) {
    const item = capped[i]
    const gateResult = gateResults[i]

    gateProcessed++
    gateTotalMs += gateResult.duration_ms
    if (gateResult.verdict === 'gate_unavailable') gateUnavailable++

    if (!gateResult.relevant) {
      gateWouldQuarantine++
      if (quarantineSampleTitles.length < 3) quarantineSampleTitles.push(item.title)
      try {
        await supabase.from('stories_quarantine').insert({
          title: item.title,
          source_name: item.source_name,
          url: item.link,
          published_at: item.published_at,
          raw_content: (item.description || '').slice(0, 500),
          haiku_verdict: gateResult.verdict,
          haiku_raw_response: gateResult.raw,
        })
      } catch { /* quarantine insert failure is non-fatal */ }
      continue // BLOCKING MODE: skip main stories insert
    }

    const storyData: Record<string, unknown> = {
      title: item.title,
      link: item.link,
      source_name: item.source_name,
      topic: item.topic,
      source_type: item.source_type,
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
      if (upserted && upserted.length > 0) {
        const s = upserted[0]
        extractEntities(s)
          .then(() => supabase.from('stories').update({ entities_extracted: true }).eq('id', s.id))
          .catch(() => {})
      }
    }
  }

  // Ocean-relevance gate summary (BLOCKING MODE — enabled 2026-04-22)
  const gateSummary = {
    run: new Date().toISOString(),
    processed: gateProcessed,
    quarantined: gateWouldQuarantine,
    gate_unavailable: gateUnavailable,
    avg_gate_ms: gateProcessed > 0 ? Math.round(gateTotalMs / gateProcessed) : 0,
    sample_quarantine_titles: quarantineSampleTitles,
  }
  console.log('[ocean-gate:blocking]', JSON.stringify(gateSummary))

  return NextResponse.json({
    success: true,
    saved: totalSaved,
    skipped: totalSkipped,
    sources: RSS_SOURCES.length,
    failed_sources: errors,
    capped_sources: cappedSources,
    max_per_source: maxPerSource,
    ocean_gate: gateSummary,
    timestamp: new Date().toISOString(),
  })
}
