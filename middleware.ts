import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Paths that require auth but should NOT enforce the paywall
// (users can hit /upgrade even with an expired subscription)
const PAYWALL_EXEMPT = ['/platform/upgrade', '/platform/projects']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Not signed in: bounce to /sign-in
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Admin routes: require role = 'admin', bypass paywall
  if (pathname.startsWith('/admin')) {
    const role = token.role as string | null | undefined
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/platform/feed', request.url))
    }
    return NextResponse.next()
  }

  // Paywall enforcement for /platform/* only (tracker stays auth-only)
  if (pathname.startsWith('/platform') && !PAYWALL_EXEMPT.some(p => pathname.startsWith(p))) {
    const status = token.subscription_status as string | undefined
    const trialEndsAt = token.trial_ends_at as string | null | undefined

    const trialValid =
      status === 'trial' &&
      trialEndsAt &&
      new Date(trialEndsAt).getTime() > Date.now()

    const hasAccess = status === 'active' || trialValid

    if (!hasAccess) {
      const upgradeUrl = new URL('/upgrade', request.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/platform/:path*', '/tracker/:path*', '/admin/:path*'],
}
