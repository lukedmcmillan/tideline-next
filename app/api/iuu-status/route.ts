import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    active_investigations: 14,
    vessels_blacklisted: 47,
    port_state_alerts: 6,
    enforcement_status: "Active",
  })
}
