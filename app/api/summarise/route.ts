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
  'sciencedirect.com', 'nature.com', 'science.org', 'journals.plos.org',
  'onlinelibrary.wiley.com', 'springer.com', 'tandfonline.com', 'jstor.org',
  'frontiersin.org', 'mdpi.com', 'academic.oup.com', 'cell.com', 'pnas.org', 'ices.dk',
]

const PAYWALLED_DOMAINS = [
  'bloomberg.com', 'ft.com', 'wsj.com', 'economist.com',
  'thetimes.co.uk', 'telegraph.co.uk', 'intrafish.com',
  'undercurrentnews.com', 'seafoodsource.com',
]

function isAcademicPaper(url: string): boolean {
  return ACADEMIC_DOMAINS.some(domain => url.includes(domain))
}

function isPaywalled(url: string): boolean {
  return PAYWALLED_DOMAINS.some(domain => url.includes(domain))
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
      if (text.length > 50) return text
    }
  }
  return null
}

async function fetchArticleText(url: string): Promise<string | null> {
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

    // Strip abstract section so model reads the body
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
    // Paywalled sources — no summary attempt
    if (isPaywalled(story.link)) {
      const short_summary = `This article is from ${story.source_name}. Full access requires a subscription to the original source.`
      const full_summary = short_summary
      await supabase.from('stories').update({ short_summary, full_summary }).eq('id', storyId)
      return NextResponse.json({ short_summary, full_summary })
    }

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
            const short_summary = abstract.slice(0, 300).trim() + (abstract.length > 300 ? '…' : '')
            const full_summary = abstract
            await supabase.from('stories').update({ short_summary, full_summary }).eq('id', storyId)
            return NextResponse.json({ short_summary, full_summary })
          }
        }
      } catch {
        // Fall through to AI summary if abstract extraction fails
      }
    }

    // Open news articles — fetch full text and generate AI summary
    const articleText = await fetchArticleText(story.link)

    const prompt = articleText
      ? `You are a factual intelligence editor at Tideline, an ocean and marine policy briefing platform. Write accurate, source-faithful summaries based only on what the article actually says.

Article title: "${story.title}"
Source: ${story.source_name}
URL: ${story.link}

ARTICLE CONTENT:
${articleText}

---

RULES:
- Summarise only what the article explicitly states. Never paraphrase the abstract — read and draw from the full body.
- Preserve approximate language exactly. Do not round up or sharpen numbers.
- Do not add implications, urgency, or significance the article does not state.
- No AI-tell phrases: "crucial", "urgent", "significant", "vital", "important" unless the source uses them.
- No meta-commentary or framing language.
- Declarative sentences only.
- The full summary must be a DISTINCT account from the short summary. Do not repeat the short summary opening.

SHORT SUMMARY (2 sentences maximum):
Sentence 1: source, publication context, and what the document is.
Sentence 2: the single most important factual finding from the body — not from any abstract.

FULL SUMMARY (6-10 sentences):
Do NOT begin with the same sentence as the short summary.
Draw from the body — methodology, specific findings, numbers, implementation details, cost figures, caveats.
Final sentence: the single most important limitation or qualification the authors themselves state.

Respond in this exact JSON format with no markdown or code fences:
{
  "short_summary": "...",
  "full_summary": "..."
}`
      : `You are a factual intelligence editor at Tideline. The full article text could not be retrieved.

Article title: "${story.title}"
Source: ${story.source_name}

Write two summaries based only on what can be reasonably inferred from the title and source. Do not fabricate findings or statistics.

SHORT SUMMARY (1-2 sentences): What the article appears to cover based on title and source only.
FULL SUMMARY (2-3 sentences): Same, ending with: "Full article text was unavailable — this summary is based on the title and source only."

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
