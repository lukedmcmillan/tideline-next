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
    /<div[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<h2[^>]*>Abstract<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]*id="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<p[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text.length > 100) return text
    }
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
        headers: { 'Authorization': `Bearer ${process.env.JINA_API_KEY}`, 'Accept': 'text/plain', 'X-Return-Format': 'markdown', 'X-Timeout': '8' },
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0)' },
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
      .replace(/\s+/g, ' ').trim()
    return text.length > 100 ? text.slice(0, 20000) : null
  } catch { return null }
}

export async function POST(request: Request) {
  const { storyId } = await request.json()
  if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 })

  const { data: story, error } = await supabase.from('stories').select('*').eq('id', storyId).single()
  if (error || !story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  if (story.short_summary && story.full_summary) return NextResponse.json({ short_summary: story.short_summary, full_summary: story.full_summary })

  try {
    if (isAcademicPaper(story.link)) {
      try {
        const res = await fetch(story.link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0)' }, signal: AbortSignal.timeout(10000) })
        if (res.ok) {
          const abstract = extractAbstract(await res.text())
          if (abstract) {
            const short_summary = abstract.slice(0, 300).trim() + (abstract.length > 300 ? '...' : '')
            await supabase.from('stories').update({ short_summary, full_summary: abstract }).eq('id', storyId)
            return NextResponse.json({ short_summary, full_summary: abstract })
          }
        }
      } catch { /* fall through */ }
    }

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

    const prompt = articleText && articleText.length > 80
      ? `You are a factual intelligence editor at Tideline, an ocean and marine policy briefing platform. Readers are sector experts: NGO policy teams, corporate ESG leads, shipping compliance officers, blue finance investors, and ocean researchers.

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
- For well-covered topics (deep-sea mining, climate, fisheries, shipping) do not use background knowledge in the summary.
- Scale the significance to match the actual story. Do not overreach.
- No hedging: "it appears", "it seems"
- No filler: state significance directly
- No em dashes
- Declarative sentences only

SHORT SUMMARY (2 sentences max):
Sentence 1: what happened, grounded in the article.
Sentence 2: the single most professionally significant detail from the article body.

FULL SUMMARY (5-8 sentences):
Do NOT begin with the same sentence as the short summary.
1. The specific mechanism or technology � explain exactly how it works, never leave a technical term unexplained.
2. Quantitative data � specific numbers, named participants, measurable outcomes from the article.
3. Why this decision was made � connect mechanism and data to outcome.
4. The non-obvious watch point � downstream implications for adjacent jurisdictions or frameworks, not just obvious next steps.

Respond in this exact JSON format with no markdown:
{"short_summary":"...","full_summary":"..."}`
      : `You are a factual intelligence editor at Tideline. Article text unavailable.
Title: "${story.title}"
Source: ${story.source_name}
Respond: {"short_summary":"Summary unavailable � full article text could not be retrieved.","full_summary":"Summary unavailable � full article text could not be retrieved. Visit the original source directly."}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    await supabase.from('stories').update({ short_summary: parsed.short_summary, full_summary: parsed.full_summary }).eq('id', storyId)
    return NextResponse.json({ short_summary: parsed.short_summary, full_summary: parsed.full_summary })
  } catch (err) {
    console.error('Summary error:', err)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
