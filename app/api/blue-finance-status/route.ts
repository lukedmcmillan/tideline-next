import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    blue_bonds_issued: 23,
    total_capital: "$5.2bn",
    debt_swaps_active: 8,
    market_status: "Growing",
  })
}
