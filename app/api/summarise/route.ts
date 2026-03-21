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

function isAcademicPaper(url: string): boolean {
  return ACADEMIC_DOMAINS.some(domain => url.includes(domain))
}

function extractAbstract(html: string): string | null {
  let abstract = ''

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
      const text = match[1]
        .replace(/<h2[^>]*>Abstract<\/h2>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length > 100) {
        abstract = text
        break
      }
    }
  }

  if (!abstract) {
    const abstractSection = html.match(/Abstract\s*<\/[^>]+>\s*([\s\S]{100,2000}?)(?:Keywords|Introduction|1\.|Background)/i)
    if (abstractSection) {
      const text = abstractSection[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text.length > 100) abstract = text
    }
  }

  if (abstract) return abstract
  return null
}

// Jina Reader API — returns clean markdown of article content.
// Handles JS rendering, soft paywalls, and messy HTML automatically.
// Falls back to direct HTML fetch if Jina fails or returns thin content.
async function fetchArticleText(url: string): Promise<string | null> {
  // Try Jina first
  if (process.env.JINA_API_KEY) {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`
      const res = await fetch(jinaUrl, {
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
        // Strip Jina metadata header
        const cleaned = text
          .replace(/^Title:.*\n/m, '')
          .replace(/^URL Source:.*\n/m, '')
          .replace(/^Markdown Content:\n/m, '')
          .trim()
        if (cleaned.length > 200) return cleaned.slice(0, 8000)
      }
    } catch {
      // Fall through to direct fetch
    }
  }

  // Direct HTML fetch fallback
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0; +https://thetideline.co)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const htmlWithoutAbstract = html
      .replace(/<section[^>]*class="[^"]*abstract[^"]*"[^>]*>[\s\S]*?<\/section>/gi, '')
      .replace(/<div[^>]*class="[^"]*abstract[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<h2[^>]*>Abstract<\/h2>[\s\S]*?(?=<h2)/gi, '')

    const text = htmlWithoutAbstract
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()

    return text.length > 100 ? text.slice(0, 20000) : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const { storyId } = await request.json()

  if (!storyId) {
    return NextResponse.json({ error: 'storyId required' }, { status: 400 })
  }

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single()

  if (error || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  if (story.short_summary && story.full_summary) {
    return NextResponse.json({
      short_summary: story.short_summary,
      full_summary: story.full_summary,
    })
  }

  try {
    // Academic papers — extract and use the abstract directly
    if (isAcademicPaper(story.link)) {
      try {
        const res = await fetch(story.link, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tideline/1.0)' },
          signal: AbortSignal.timeout(10000),
        })
        if (res.ok) {
          const html = await res.text()
          const abstract = extractAbstract(html)
          if (abstract) {
            const short_summary = abstract.slice(0, 300).trim() + (abstract.length > 300 ? '...' : '')
            const full_summary = abstract
            await supabase.from('stories').update({ short_summary, full_summary }).eq('id', storyId)
            return NextResponse.json({ short_summary, full_summary })
          }
        }
      } catch {
        // Fall through to Jina fetch if abstract extraction fails
      }
    }

    // Fetch full article text via Jina (with direct HTML fallback)
    const articleText = await fetchArticleText(story.link)

    const prompt = articleText
      ? `You are a factual intelligence editor at Tideline, an ocean and marine policy briefing platform. Your readers are sector experts: NGO policy teams, corporate ESG leads, shipping compliance officers, blue finance investors, and ocean researchers.

Article title: "${story.title}"
Source: ${story.source_name}
URL: ${story.link}

ARTICLE CONTENT:
${articleText}

STRICT ACCURACY RULES — violations damage editorial credibility:
- Base every factual claim solely on the article content above. Nothing else.
- Do not add company locations, funding totals, customer sectors, or technical specifications unless the article states them explicitly.
- Preserve exact technical terminology. Do not generalise specialist terms (e.g. "split-beam echosounder" stays "split-beam echosounder", "torpedo launcher support" stays "torpedo launcher support").
- Do not supplement with background knowledge about the topic — even if accurate and relevant. If it is not in the article, it does not exist for this brief.
- For well-covered topics (deep-sea mining, climate negotiations, fisheries governance, shipping regulation) you will have strong background knowledge. Do not use it in the summary. Report only what this specific article states.
- Scale the significance frame to the actual story. A training contract is not a fleet expansion. A software integration is not a regulatory mandate. Do not overreach.
- Lead with the most professionally significant detail in the article — not the most familiar or expected angle.
- No hedging phrases: "it appears", "it seems", "it is worth noting"
- No filler: "this is significant because" — state the significance directly
- No em dashes
- No AI-tell phrases: "crucial", "urgent", "vital", "significant", "important" unless the source uses them
- Declarative sentences only
- The full summary must be a distinct account from the short summary — do not repeat the opening sentence

SHORT SUMMARY (2 sentences maximum):
Sentence 1: what happened or was announced, grounded strictly in the article.
Sentence 2: the single most professionally significant detail from the article body.

FULL SUMMARY (5-8 sentences):
Do NOT begin with the same sentence as the short summary.
Cover: specific findings, named organisations, numbers, methodology, implementation details, and caveats — all drawn from the article.
End with one concrete watch point: a specific body, process, or deadline professionals should monitor.

Respond in this exact JSON format with no markdown or code fences:
{
  "short_summary": "...",
  "full_summary": "..."
}`
      : `You are a factual intelligence editor at Tideline. The full article text could not be retrieved.

Article title: "${story.title}"
Source: ${story.source_name}

Write two summaries based only on what the title and source name explicitly suggest. Do not fabricate findings, statistics, or context.

SHORT SUMMARY (1 sentence): What the article covers based on title and source only.
FULL SUMMARY (2 sentences): Same, ending with: "Full article text was unavailable — this summary is based on the title and source only."

Respond in this exact JSON format with no markdown:
{
  "short_summary": "...",
  "full_summary": "..."
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    await supabase
      .from('stories')
      .update({
        short_summary: parsed.short_summary,
        full_summary: parsed.full_summary,
      })
      .eq('id', storyId)

    return NextResponse.json({
      short_summary: parsed.short_summary,
      full_summary: parsed.full_summary,
    })
  } catch (err) {
    console.error('Summary error:', err)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}