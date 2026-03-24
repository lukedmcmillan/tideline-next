import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'

export const authOptions = {
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 587,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: 'Tideline <noreply@thetideline.co>',
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
