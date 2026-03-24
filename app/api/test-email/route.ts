import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tideline <noreply@thetideline.co>',
      to: 'luke.mcmillan@whales.org',
      subject: 'Tideline email test',
      html: '<p>This is a test email from Tideline.</p>',
    }),
  })
  const data = await res.json()
  return NextResponse.json({ status: res.status, data })
}
