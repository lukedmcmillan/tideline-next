import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const topic = searchParams.get('topic')
  const tracker = searchParams.get('tracker')
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '0')

  // Single story lookup
  if (id) {
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, link, source_name, topic, source_type, published_at, short_summary, full_summary, is_pro, alert_type, significance_score, cross_tracker_flags')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ story: data })
  }

  // List lookup
  let query = supabase
    .from('stories')
    .select('id, title, link, source_name, topic, source_type, published_at, short_summary, full_summary, is_pro, alert_type, significance_score, cross_tracker_flags')
    .eq('status', 'live')
    .not('short_summary', 'is', null)
    .order('published_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)
  if (topic && topic !== 'all') {
    query = query.eq('topic', topic)
  }
  if (tracker) {
    query = query.contains('cross_tracker_flags', [tracker])
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ stories: data, count: data?.length || 0 })
}
