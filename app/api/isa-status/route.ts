import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    active_licences: 31,
    states_sponsoring: 22,
    pending_applications: 8,
    moratorium_status: "Contested",
  })
}
