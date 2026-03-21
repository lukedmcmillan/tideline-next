import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ─── Clients ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 20       // stories per run — keep API costs controlled
const MAX_TOKENS = 350      // bumped from 280 — two-section structure needs room

// ─── Paywalled sources ────────────────────────────────────────────────────────
// These sources return meta description only — full scrape blocked by paywall.
// Everything else gets full article body extraction.

const PAYWALLED_SOURCES = new Set([
  "Lloyd's List",
  'TradeWinds',
  'Undercurrent News',
  'Responsible Investor',
  'Nature Climate Change',
  'Nature Sustainability',
  'Nature Ecology & Evolution',
  'Science Ocean Research',
])

// ─── HTML entity decoder ──────────────────────────────────────────────────────

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#8217;/g, '\u2019').replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C').replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013').replace(/&#8212;/g, '\u2014')
    .replace(/&nbsp;/g, ' ').replace(/&#8230;/g, '\u2026')
    .replace(/&ndash;/g, '\u2013').replace(/&mdash;/g, '\u2014')
    .replace(/&lsquo;/g, '\u2018').replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D')
    .replace(/<[^>]+>/g, '').trim()
}

// ─── Content extractors ───────────────────────────────────────────────────────

function extractArticleBody(html: string): string {
  // Try <article> tag first — most modern CMSs use this
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  const searchArea = articleMatch?.[1] ?? html

  const paragraphs: string[] = []
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match

  while ((match = pRegex.exec(searchArea)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length < 40) continue

    const boilerplate = [
      'cookie', 'subscribe', 'newsletter', 'sign up', 'sign in',
      'log in', 'register', 'advertisement', 'share this', 'follow us',
      'read more', 'click here', 'all rights reserved', 'privacy policy',
    ]
    if (boilerplate.some(b => text.toLowerCase().includes(b))) continue

    paragraphs.push(text)
    if (paragraphs.length >= 4) break
  }

  return paragraphs.join(' ').slice(0, 1500).trim()
}

function extractMetaDescription(html: string): string {
  const ogDesc =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+property=["']og:description["']/i)?.[1]

  if (ogDesc) return ogDesc.trim()

  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+name=["']description["']/i)?.[1]

  if (metaDesc) return metaDesc.trim()

  const twitterDesc =
    html.match(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+name=["']twitter:description["']/i)?.[1]

  return twitterDesc?.trim() ?? ''
}

async function scrapeArticleContent(url: string, paywalled: boolean): Promise<string> {
  try {
    if (paywalled) {
      // Paywalled — fetch only <head> for meta tags (first 10KB)
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Tideline/1.0 (+https://thetideline.co)',
          'Range': 'bytes=0-10240',
        },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok && res.status !== 206) return ''
      const html = await res.text()
      return decodeEntities(extractMetaDescription(html))
    }

    // Open access — fetch full page and extract article body
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tideline/1.0 (+https://thetideline.co)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ''
    const html = await res.text()

    // Try article body first — much richer than meta description
    const body = extractArticleBody(html)
    if (body.length >= 150) return decodeEntities(body)

    // Body extraction too thin — fall back to meta description
    return decodeEntities(extractMetaDescription(html))

  } catch {
    return ''
  }
}

// ─── Summary prompt ───────────────────────────────────────────────────────────

function buildPrompt(
  title: string,
  description: string,
  sourceName: string,
  sourceType: string,
  topic: string
): string {
  const sourceContext = {
    gov:   'a government or intergovernmental body',
    reg:   'a regulatory organisation',
    ngo:   'a conservation or advocacy NGO',
    res:   'a scientific research institution or journal',
    media: 'a specialist media publication',
    esg:   'a finance or ESG intelligence source',
  }[sourceType] ?? 'a specialist publication'

  const sourceContent = description?.trim()
    ? `Headline: "${title}"\nDescription: "${description}"`
    : `Headline: "${title}"\n(No description available — return exactly: "Insufficient source material." Do not attempt to write a brief under any circumstances.)`

  return `You are a senior ocean intelligence analyst writing for Tideline, a professional intelligence platform. Readers are NGO policy teams, corporate ESG leads, shipping compliance officers, blue finance investors, and ocean researchers. They are sector experts. Write for them accordingly.

SOURCE MATERIAL
Source: ${sourceName} (${sourceContext})
Topic area: ${topic}
${sourceContent}

INSTRUCTIONS
Write an intelligence brief in two clearly labelled sections:

REPORTED
2-3 sentences covering only what the source material explicitly states. Every factual claim must appear in the headline or description above. If a fact is not in those two sources, it does not exist for the purposes of this brief. Do not supplement with background knowledge about the topic, previous coverage, or sector context — even if accurate. Background knowledge belongs in Significance only.

Critical: for well-covered topics — deep-sea mining, climate negotiations, fisheries governance, shipping regulation — you will have extensive background knowledge that feels relevant. Do not use it in the Reported section. The Reported section must reflect only this specific article, not the general narrative around the topic. It should read differently from every other brief on this subject because it is sourced from this article alone.

Preserve exact technical terminology. Do not generalise specialist terms. Lead with the most professionally significant detail in the source material, not the most familiar or expected angle.

SIGNIFICANCE
2-3 sentences of analysis explaining why this matters for the professional ocean sector. Connect to relevant governance, compliance, investment, or operational context. Scale the analytical frame to match the actual story — a training contract is not a fleet expansion, a software integration is not a regulatory mandate. Do not overreach. Identify who specifically should pay attention and why. End with one concrete watch point: a specific body, process, or deadline professionals should monitor.

RULES
- Plain prose only. No markdown, no bullet points, no headers within sections.
- No hedging: "it appears", "it seems", "it is worth noting"
- No filler: "this is significant because" — state the significance directly
- No em dashes
- Total length: 120-180 words across both sections
- If source material is too thin for a meaningful Significance section, write Reported only and note: "Insufficient detail for significance assessment."`
}

// ─── Summarise a single story ─────────────────────────────────────────────────

async function summariseStory(story: {
  id: string
  title: string
  link: string
  source_name: string
  source_type: string
  topic: string
}): Promise<{ id: string; success: boolean; error?: string }> {
  // Scrape content fresh at summarisation time — richer than stored description
  // for open access sources, meta tags only for paywalled sources
  const paywalled = PAYWALLED_SOURCES.has(story.source_name)
  const description = await scrapeArticleContent(story.link, paywalled)

  // Hard skip — no content means no brief
  if (!description || description.trim().length < 80) {
    return { id: story.id, success: false, error: 'Skipped — insufficient source content' }
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: buildPrompt(
            story.title,
            description,
            story.source_name,
            story.source_type,
            story.topic
          ),
        },
      ],
    })

    const summary = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    if (!summary) {
      return { id: story.id, success: false, error: 'Empty response from Claude' }
    }

    const { error } = await supabase
      .from('stories')
      .update({
        summary,
        description,                                    // store what we scraped
        summary_generated_at: new Date().toISOString(),
      })
      .eq('id', story.id)

    if (error) {
      return { id: story.id, success: false, error: error.message }
    }

    return { id: story.id, success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { id: story.id, success: false, error: message }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  // Fetch unsummarised stories from the last 7 days
  // link is required — content is scraped live at summarisation time
  const { data: stories, error: fetchError } = await supabase
    .from('stories')
    .select('id, title, link, source_name, source_type, topic')
    .is('summary', null)
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('published_at', { ascending: false })
    .limit(BATCH_SIZE)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'No stories pending summarisation',
      duration_ms: Date.now() - startTime,
    })
  }

  const results: { id: string; success: boolean; error?: string }[] = []
  const CONCURRENCY = 5

  for (let i = 0; i < stories.length; i += CONCURRENCY) {
    const batch = stories.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.allSettled(
      batch.map(story => summariseStory(story))
    )
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(r.value)
      else results.push({ id: 'unknown', success: false, error: String(r.reason) })
    }
  }

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success)

  return NextResponse.json({
    success: true,
    processed: stories.length,
    succeeded,
    failed: failed.length,
    failed_ids: failed.map(f => ({ id: f.id, error: f.error })),
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  })
}