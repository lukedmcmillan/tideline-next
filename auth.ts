import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
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
        await fetch('https://api.resend.com/emails', {
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
                <div style="background:#0D1B2A;padding:20px 32px;">
                  <span style="font-size:14px;font-weight:400;color:#ffffff;letter-spacing:0.18em;text-transform:uppercase;font-family:monospace;">TIDELINE</span>
                </div>
                <div style="padding:40px 32px;background:#ffffff;border:1px solid #E4E4E4;">
                  <h1 style="font-size:22px;color:#0D0D0D;margin:0 0 16px;font-family:Georgia,serif;">Sign in to Tideline</h1>
                  <p style="font-size:15px;color:#64748B;margin:0 0 28px;font-family:sans-serif;">Click the button below to sign in. This link expires in 24 hours.</p>
                  <a href="${url}" style="display:inline-block;padding:13px 28px;background:#0D0D0D;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;font-family:sans-serif;">Sign in to Tideline</a>
                  <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;font-family:sans-serif;">If you did not request this, you can safely ignore this email.</p>
                </div>
              </div>
            `,
          }),
        })
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/sign-in?verify=1',
    error: '/sign-in?error=1',
  },
  debug: true,
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return `${baseUrl}/platform/feed`
    },
    async signIn({ user }: { user: any }) {
      if (!user?.email) return false

      // Create user in public.users on first login
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        console.log('[auth] signIn check for:', user.email, 'existing:', !!existing)

        if (!existing) {
          const { error: insertErr } = await supabase.from('users').insert({
            email: user.email,
            subscription_status: 'trial',
            tier: 'free',
            onboarding_completed: false,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            topics: [],
            timezone: 'Europe/London',
          })
          if (insertErr) console.error('[auth] users insert error:', insertErr.message, insertErr.details, insertErr.hint)
          else console.log('[auth] created public.users row for:', user.email)
        }
      } catch (err) {
        console.error('[auth] signIn callback error:', err)
      }

      return true
    },
    async jwt({ token, user, trigger }: { token: any; user?: any; trigger?: string }) {
      if (user) {
        token.email = user.email
        token.name = user.name
      }

      const shouldRefresh =
        !!user ||
        trigger === 'update' ||
        token.subscription_status === undefined ||
        token.subscription_status === null

      if (shouldRefresh && token.email) {
        try {
          const { data: u } = await supabase
            .from('users')
            .select('subscription_status, trial_ends_at, tier, onboarding_completed, role')
            .eq('email', token.email)
            .single()
          if (u) {
            token.subscription_status = u.subscription_status ?? 'trial'
            token.trial_ends_at = u.trial_ends_at ?? null
            token.tier = u.tier ?? 'free'
            token.onboarding_completed = u.onboarding_completed ?? false
            token.role = u.role ?? null
          } else {
            // User not in public.users yet. Set safe defaults so middleware never sees undefined.
            token.subscription_status = token.subscription_status ?? 'trial'
            token.trial_ends_at = token.trial_ends_at ?? null
            token.tier = token.tier ?? 'free'
            token.onboarding_completed = token.onboarding_completed ?? false
            token.role = token.role ?? null
          }
        } catch (err) {
          console.error('[auth] jwt callback DB fetch error:', err)
        }
      }

      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.email = token.email
        session.user.name = token.name
        session.user.subscription_status = token.subscription_status
        session.user.trial_ends_at = token.trial_ends_at
        session.user.tier = token.tier
        session.user.onboarding_completed = token.onboarding_completed
        session.user.role = token.role
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
