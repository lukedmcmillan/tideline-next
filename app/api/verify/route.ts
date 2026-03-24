import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  const { data: link, error } = await supabase
    .from('magic_links')
    .select('*')
    .eq('token', token)
    .eq('email', email)
    .eq('used', false)
    .single()

  if (error || !link) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url))
  }

  await supabase.from('magic_links').update({ used: true }).eq('id', link.id)

  // Create user record on first login (skip if already exists)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, topics')
    .eq('email', link.email)
    .single()

  let needsOnboarding = true
  if (!existingUser) {
    await supabase.from('users').insert({
      email: link.email,
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      topics: [],
      timezone: 'Europe/London',
    })
  } else {
    needsOnboarding = !existingUser.topics || (Array.isArray(existingUser.topics) && existingUser.topics.length === 0)
  }

  const session = Buffer.from(JSON.stringify({
    email: link.email,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })).toString('base64')

  const callbackUrl = searchParams.get('callbackUrl')
  const redirectTo = needsOnboarding
    ? '/onboarding'
    : (callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/platform/feed')
  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set('tideline_session', session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
