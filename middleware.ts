import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value

  if (!sessionToken) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/platform/:path*', '/tracker/:path*']
}
