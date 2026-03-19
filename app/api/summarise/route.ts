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
    const prompt = `You are an editor at Tideline, an ocean intelligence platform for professionals.

Story title: "${story.title}"
Source: ${story.source_name}
Topic area: ${story.topic}
URL: ${story.link}

Write two summaries:
SHORT (2 sentences max): The key fact and why it matters to ocean professionals.
FULL (4-6 sentences): Context, implications, who is affected, what happens next.

Respond in this exact JSON format:
{
  "short_summary": "...",
  "full_summary": "..."
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
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