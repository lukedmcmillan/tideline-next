import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ocean_protected: "8.3%",
    mpas_designated: 847,
    states_committed: 112,
    years_remaining: 4,
  })
}
