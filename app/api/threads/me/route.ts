import { NextRequest, NextResponse } from 'next/server'
import { getEmailFromSession } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req)
  return NextResponse.json({ email: email || null })
}
