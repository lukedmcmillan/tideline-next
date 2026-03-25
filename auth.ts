import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
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
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login?error=1',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user }: { user: any }) {
      if (!user?.email) return false

      // Create user in public.users on first login
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!existing) {
        await supabase.from('users').insert({
          email: user.email,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          topics: [],
          timezone: 'Europe/London',
        })
      }

      return true
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
