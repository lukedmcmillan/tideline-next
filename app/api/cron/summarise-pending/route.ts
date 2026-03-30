import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const ACADEMIC_DOMAINS = [
  'nature.com', 'science.org', 'journals.plos.org',
  'onlinelibrary.wiley.com', 'springer.com', 'tandfonline.com', 'jstor.org',
  'frontiersin.org', 'mdpi.com', 'academic.oup.com', 'cell.com', 'pnas.org', 'ices.dk',
]

const PAYWALLED_DOMAINS = [
  'bloomberg.com', 'ft.com', 'wsj.com', 'economist.com',
  'thetimes.co.uk', 'telegraph.co.uk', 'intrafish.com',
  'undercurrentnews.com', 'seafoodsource.com', 'sciencedirect.com',
  'lloydslist.com', 'tradewindsnews.com',
]

function isAcademicPaper(url: string): boolean {
  return ACADEMIC_DOMAINS.some(d => url.includes(d))
}

function isPaywalled(url: string): boolean {
  return PAYWALLED_DOMAINS.some(d => url.includes(d))
}

function extractAbstract(html: string): string | null {
  const patterns = [
    /<div[^>]*class="[^"]*abstract[^"]*author[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*abstract[^"]*"[^>]*>\s*<h2[^>]*>Abstract<\/h2>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*data-component="abstract"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="abstract0"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*JournalAbstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /(?:<h2[^>]*>|<h3[^>]*>)Abstract(?:<\/h2>|<\/h3>)\s*<p[^>]*>([\s\S]*?)<\/p>/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      const text = match[1].replace(/<h2[^>]*>Abstract<\/h2>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text.length > 100) return text
    }
  }
  const abstractSection = html.match(/Abstract\s*<\/[^>]+>\s*([\s\S]{100,2000}?)(?:Keywords|Introduction|1\.|Background)/i)
  if (abstractSection) {
    const text = abstractSection[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 100) return text
  }
  return null
}

async function scrapeMetaDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tideline/1.0 (+https://thetideline.co)', 'Range': 'bytes=0-10240' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok && res.status !== 206) return ''
    const html = await res.text()
    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+property=["']og:description["']/i)?.[1]
    if (ogDesc) return ogDesc.trim()
    const metaDesc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,500})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{20,500})["'][^>]+name=["']description["']/i)?.[1]
    return metaDesc?.trim() ?? ''
  } catch { return '' }
}

async function fetchArticleText(url: string): Promise<string | null> {
  if (process.env.JINA_API_KEY) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown',
          'X-Timeout': '8',
        },
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) {
        const text = await res.text()
        const cleaned = text.replace(/^Title:.*\n/m, '').replace(/^URL Source:.*\n/m, '').replace(/^Markdown Content:\n/m, '').trim()
        if (cleaned.length > 200) return cleaned.slice(0, 8000)
      }
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0; +https://thetideline.co)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ').trim()
    return text.length > 100 ? text.slice(0, 20000) : null
  } catch { return null }
}

async function summariseStory(story: {
  id: string;
  title: string;
  link: string;
  source_name: string;
  description: string | null;
}): Promise<{ short_summary: string; full_summary: string }> {
  // Academic paper: try abstract extraction first
  if (isAcademicPaper(story.link)) {
    try {
      const res = await fetch(story.link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0)' }, signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const abstract = extractAbstract(await res.text())
        if (abstract) {
          const short_summary = abstract.slice(0, 300).trim() + (abstract.length > 300 ? '...' : '')
          return { short_summary, full_summary: abstract }
        }
      }
    } catch { /* fall through */ }
  }

  // Fetch article text
  let articleText: string | null = null
  if (isPaywalled(story.link)) {
    articleText = await scrapeMetaDescription(story.link)
  } else {
    articleText = await fetchArticleText(story.link)
    if (!articleText || articleText.length < 200) {
      const meta = await scrapeMetaDescription(story.link)
      if (meta) articleText = meta
    }
  }

  // Fall back to RSS description
  if ((!articleText || articleText.length < 80) && story.description) {
    articleText = story.description
  }

  // Nothing to summarise
  if (!articleText || articleText.length < 80) {
    return {
      short_summary: 'Summary unavailable. Full article text could not be retrieved. Visit the original source directly.',
      full_summary: 'Summary unavailable. Full article text could not be retrieved. Visit the original source directly.',
    }
  }

  const prompt = `You are a factual intelligence editor at Tideline, an ocean and marine policy briefing platform. Readers are sector experts: NGO policy teams, corporate ESG leads, shipping compliance officers, blue finance investors, and ocean researchers.

Article title: "${story.title}"
Source: ${story.source_name}
URL: ${story.link}

ARTICLE CONTENT:
${articleText}

STRICT ACCURACY RULES:
- Base every factual claim solely on the article content above. Nothing else.
- Do not add locations, funding totals, customer sectors, or specs unless explicitly stated.
- Preserve exact technical terminology. Do not generalise specialist terms.
- Do not use background knowledge. If it is not in the article, it does not exist for this brief.
- For well-covered topics (deep-sea mining, climate, fisheries, shipping) do not use background knowledge.
- Scale the significance to match the actual story. Do not overreach.
- Do not sub-categorise or break down figures beyond what the article states.
- No hedging: "it appears", "it seems"
- No filler: state significance directly
- No em dashes
- Declarative sentences only

SHORT SUMMARY (2 sentences max):
Sentence 1: what happened, grounded in the article.
Sentence 2: the single most professionally significant detail from the article body.

FULL SUMMARY (max 150 words, plain text, no bullet points):
Do NOT begin with the same sentence as the short summary. Do not begin with a reference to "the article" itself. Cover three things in order:
1. What caused this development, based only on information in the article.
2. What it means for the relevant industry or policy area, based only on what the article says.
3. One specific thing a professional should watch next, only if the article explicitly mentions it.
If the article does not contain enough information to answer any of these three points, say so in one short sentence rather than speculating.

Respond in this exact JSON format with no markdown:
{"short_summary":"...","full_summary":"..."}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
  return { short_summary: parsed.short_summary, full_summary: parsed.full_summary }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending, error } = await supabase
    .from('stories')
    .select('id, title, link, source_name, description')
    .is('short_summary', null)
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ summarised: 0, message: 'No pending stories' })
  }

  let summarised = 0
  const errors: string[] = []

  for (const story of pending) {
    try {
      const { short_summary, full_summary } = await summariseStory(story)
      await supabase
        .from('stories')
        .update({ short_summary, full_summary })
        .eq('id', story.id)
      summarised++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${story.id}: ${msg}`)
      console.error(`Failed to summarise story ${story.id}:`, err)
    }
  }

  return NextResponse.json({
    summarised,
    pending: pending.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
