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
  try {
    const { story_id, title, short_summary, full_summary, source_name } = await request.json()

    if (!story_id || !title) {
      return NextResponse.json({ error: 'story_id and title required' }, { status: 400 })
    }

    const summaryText = full_summary || short_summary || ''
    if (!summaryText) {
      return NextResponse.json({ error: 'At least one of short_summary or full_summary required' }, { status: 400 })
    }

    // Fetch all ACTIVE or OPEN threads
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('id, title, hypothesis')
      .in('status', ['ACTIVE', 'OPEN'])

    if (threadsError) {
      console.error('Threads fetch error:', threadsError)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    if (!threads || threads.length === 0) {
      return NextResponse.json({ matches: [], message: 'No active threads to check against' })
    }

    // Build thread list for Claude
    const threadList = threads
      .map((t) => `ID: ${t.id} | Title: ${t.title} | Hypothesis: ${t.hypothesis}`)
      .join('\n')

    const userMessage = `Story title: ${title}
Story summary: ${summaryText}
Source: ${source_name || 'Unknown'}

Threads to check:
${threadList}

Return this exact JSON format:
{ "matches": [ { "thread_id": number, "confidence": "STRONG"|"MODERATE"|"WEAK", "evidence_note": "string" } ] }

Each evidence_note must be one sentence explaining specifically what this story adds to that thread hypothesis. If no matches, return { "matches": [] }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: [{ type: 'text', text: 'You are an investigative intelligence assistant for Tideline, an ocean intelligence platform. You will be given a news story summary and a list of open investigative threads. Your job is to identify which threads this story adds evidence to. Be conservative. Only match when the connection is genuinely meaningful, not superficial. For each match, assign a confidence level: STRONG, MODERATE, or WEAK. STRONG means the story directly advances the thread hypothesis. MODERATE means it is relevant context. WEAK means it is tangentially related. Return JSON only. No explanation. No markdown.', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('[Thread Match] Raw Claude response:', text)
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    if (!parsed.matches || !Array.isArray(parsed.matches)) {
      return NextResponse.json({ matches: [], message: 'No matches found' })
    }

    // Valid thread IDs for safety check
    const validThreadIds = new Set(threads.map((t) => t.id))
    const validConfidence = new Set(['STRONG', 'MODERATE', 'WEAK'])

    const results = []

    for (const match of parsed.matches) {
      if (!validThreadIds.has(match.thread_id) || !validConfidence.has(match.confidence)) {
        continue
      }

      const row = {
        thread_id: match.thread_id,
        story_id,
        evidence_note: match.evidence_note || '',
        confidence: match.confidence,
        added_by: 'AI',
        reviewed: match.confidence !== 'WEAK',
      }

      const { error: insertError } = await supabase
        .from('thread_evidence')
        .upsert(row, { onConflict: 'thread_id,story_id' })

      if (insertError) {
        console.error('[Thread Match] Evidence insert error:', insertError)
        continue
      }

      results.push({
        thread_id: match.thread_id,
        thread_title: threads.find((t) => t.id === match.thread_id)?.title,
        confidence: match.confidence,
        evidence_note: match.evidence_note,
      })
    }

    return NextResponse.json({
      story_id,
      story_title: title,
      matches: results,
      total_matches: results.length,
    })
  } catch (err) {
    console.error('Thread match error:', err)
    return NextResponse.json({ error: 'Failed to match story against threads' }, { status: 500 })
  }
}
