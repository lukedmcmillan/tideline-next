import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'

export const authOptions = {
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: 'Tideline <noreply@thetideline.co>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
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
                  <h1 style="font-size:22px;color:#0a1628;margin:0 0 16px;">Sign in to Tideline</h1>
                  <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">Click the button below to sign in. This link expires in 24 hours.</p>
                  <a href="${url}" style="display:inline-block;padding:13px 28px;background:#1d6fa4;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Sign in to Tideline</a>
                  <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;">If you did not request this, you can safely ignore this email.</p>
                </div>
              </div>
            `,
          }),
        })
        if (!res.ok) {
          const error = await res.text()
          throw new Error(`Failed to send email: ${error}`)
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    error: '/login?error=1',
  },
  session: {
    strategy: 'jwt' as const,
  },
}

export default NextAuth(authOptions)
