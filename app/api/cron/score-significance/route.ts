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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, title, short_summary')
      .gte('published_at', h24)
      .eq('significance_score', 0)
      .not('short_summary', 'is', null)

    if (error) {
      console.error('[Significance] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!stories || stories.length === 0) {
      console.log('[Significance] No unscored stories found')
      return NextResponse.json({ scored: 0, message: 'No unscored stories' })
    }

    console.log(`[Significance] Scoring ${stories.length} stories`)

    let scored = 0
    let featured = 0

    for (const story of stories) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: [{ type: 'text', text: 'You are an ocean governance analyst. Score this story and return JSON only. No markdown. No explanation.', cache_control: { type: 'ephemeral' } }],
          messages: [{
            role: 'user',
            content: `Story headline: ${story.title}. Summary: ${story.short_summary}. Return this exact JSON: { "score": 0-100, "trackers": [] } where trackers is an array of slugs from this list only: bbnj, isa, iuu, 30x30, blue_finance, imo_shipping, whaling, ocean_carbon, msp, arctic. Score meaning: 0-30 = routine update, 31-60 = noteworthy, 61-75 = significant development, 76-100 = major policy shift. Only include tracker slugs this story directly affects. Return only valid JSON.`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

        const score = Math.max(0, Math.min(100, Math.round(parsed.score || 0)))
        const trackers = Array.isArray(parsed.trackers) ? parsed.trackers.filter((t: string) =>
          ['bbnj', 'isa', 'iuu', '30x30', 'blue_finance', 'imo_shipping', 'whaling', 'ocean_carbon', 'msp', 'arctic'].includes(t)
        ) : []
        const isFeatured = score > 75

        const { error: updateError } = await supabase
          .from('stories')
          .update({
            significance_score: score,
            cross_tracker_flags: trackers,
            is_featured: isFeatured,
          })
          .eq('id', story.id)

        if (updateError) {
          console.error(`[Significance] Update error for ${story.id}:`, updateError)
          continue
        }

        scored++
        if (isFeatured) featured++
        console.log(`[Significance] "${story.title}" → score: ${score}, trackers: [${trackers.join(', ')}]${isFeatured ? ' ★ FEATURED' : ''}`)
      } catch (err) {
        console.error(`[Significance] Error scoring "${story.title}":`, err)
        continue
      }
    }

    console.log(`[Significance] Done. Scored: ${scored}/${stories.length}, Featured: ${featured}`)

    return NextResponse.json({
      scored,
      featured,
      total: stories.length,
    })
  } catch (err) {
    console.error('[Significance] Cron error:', err)
    return NextResponse.json({ error: 'Failed to score stories' }, { status: 500 })
  }
}
