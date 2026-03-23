import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { SupabaseAdapter } from '@auth/supabase-adapter'

export const authOptions = {
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: 'Tideline <noreply@thetideline.co>',
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const { createTransport } = await import('nodemailer')
        const transport = createTransport(provider.server)
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: 'Sign in to Tideline',
          text: `Sign in to Tideline\n\nClick this link to sign in:\n${url}\n\nThis link expires in 24 hours and can only be used once.\n\nIf you did not request this email, you can safely ignore it.`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="margin:0;padding:0;background:#f5f4ef;font-family:'Helvetica Neue',Arial,sans-serif;">
              <div style="max-width:520px;margin:40px auto;background:#ffffff;border:1px solid rgba(0,0,0,0.08);">
                <div style="background:#0a1628;padding:20px 32px;border-bottom:3px solid #1d6fa4;">
                  <span style="font-size:20px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:-0.02em;">TIDELINE</span>
                </div>
                <div style="padding:40px 32px;">
                  <h1 style="font-size:22px;font-weight:700;color:#0a1628;font-family:Georgia,serif;margin:0 0 16px;letter-spacing:-0.02em;">Sign in to Tideline</h1>
                  <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;">Click the button below to sign in. This link expires in 24 hours.</p>
                  <a href="${url}" style="display:inline-block;padding:13px 28px;background:#1d6fa4;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:2px;">Sign in to Tideline</a>
                  <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;line-height:1.6;">Or copy this link: <span style="color:#1d6fa4;">${url}</span></p>
                  <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;">If you did not request this, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        })
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    error: '/login?error=1',
  },
  session: {
    strategy: 'database' as const,
  },
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
