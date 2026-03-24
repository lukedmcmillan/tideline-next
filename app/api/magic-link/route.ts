import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Store in Supabase
    const { error: dbError } = await supabase
      .from('magic_links')
      .insert({ email, token, expires_at })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    // Send email via Resend
    const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tideline <noreply@thetideline.co>',
        to: email,
        subject: 'Sign in to Tideline',
        html: `
          <div style="max-width:520px;margin:40px auto;font-family:Georgia,serif;">
            <div style="background:#0a1628;padding:20px 32px;border-bottom:3px solid #1d6fa4;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;">TIDELINE</span>
            </div>
            <div style="padding:40px 32px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);">
              <h1 style="font-size:22px;color:#0a1628;margin:0 0 16px;font-family:Georgia,serif;">Sign in to Tideline</h1>
              <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;font-family:Arial,sans-serif;">Click the button below to sign in. This link expires in 24 hours and can only be used once.</p>
              <a href="${url}" style="display:inline-block;padding:13px 28px;background:#1d6fa4;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;font-family:Arial,sans-serif;">Sign in to Tideline</a>
              <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;font-family:Arial,sans-serif;">Or copy this link: ${url}</p>
              <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;font-family:Arial,sans-serif;">If you did not request this, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Magic link error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
