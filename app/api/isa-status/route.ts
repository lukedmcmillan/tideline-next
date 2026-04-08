import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  // Live count of pending application events from the last 2 years.
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const cutoff = twoYearsAgo.toISOString().slice(0, 10)

  const { count, error } = await supabase
    .from('tracker_events')
    .select('id', { count: 'exact', head: true })
    .eq('tracker_slug', 'isa')
    .eq('event_type', 'regulation_update')
    .ilike('title', '%application%')
    .eq('status', 'live')
    .gte('event_date', cutoff)

  const pending_applications = error ? 0 : (count ?? 0)

  return NextResponse.json({
    active_licences: 31,
    states_sponsoring: 22,
    pending_applications,
    moratorium_status: "Contested",
  })
}
