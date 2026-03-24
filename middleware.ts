import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('tideline_session')

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const data = JSON.parse(Buffer.from(session.value, 'base64').toString())
    if (new Date(data.expires) < new Date()) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('tideline_session')
      return response
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/platform/:path*']
}
