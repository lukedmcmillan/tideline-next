import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tracker_events')
    .select('id, tracker_slug, event_date, title, summary, source_url, event_type')
    .eq('tracker_slug', slug)
    .order('event_date', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data || [] })
}
