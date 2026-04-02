import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: threads, error: threadsError } = await supabase
    .from('threads')
    .select('id, thread_number, title, category, status, horizon, hypothesis')
    .order('thread_number', { ascending: true })

  if (threadsError) {
    console.error('Threads fetch error:', threadsError)
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }

  if (!threads || threads.length === 0) {
    return NextResponse.json([])
  }

  const threadIds = threads.map(t => t.id)

  const { data: evidence, error: evidenceError } = await supabase
    .from('thread_evidence')
    .select('id, thread_id, evidence_note, confidence, added_at, reviewed')
    .in('thread_id', threadIds)
    .order('added_at', { ascending: false })

  if (evidenceError) {
    console.error('Evidence fetch error:', evidenceError)
  }

  const evidenceByThread = new Map<number, typeof evidence>()
  for (const e of evidence || []) {
    const arr = evidenceByThread.get(e.thread_id) || []
    arr.push(e)
    evidenceByThread.set(e.thread_id, arr)
  }

  const result = threads.map(t => {
    const threadEvidence = evidenceByThread.get(t.id) || []
    return {
      ...t,
      evidence_count: threadEvidence.length,
      evidence: threadEvidence,
    }
  })

  return NextResponse.json(result)
}
