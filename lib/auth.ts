import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('[AUTH] Missing credentials')
            return null
          }

          const normalizedEmail = credentials.email.toLowerCase().trim()
          console.log('[AUTH] Attempting to find user:', normalizedEmail)

          const user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail
            }
          })

          if (!user) {
            console.error('[AUTH] User not found:', normalizedEmail)
            return null
          }

          if (!user.password) {
            console.error('[AUTH] User found but no password set:', normalizedEmail)
            return null
          }

          console.log('[AUTH] User found, comparing password...')
          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isCorrectPassword) {
            console.error('[AUTH] Password mismatch for user:', normalizedEmail)
            return null
          }

          console.log('[AUTH] Authentication successful for user:', normalizedEmail)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('[AUTH] Authorization error:', error)
          if (error instanceof Error) {
            console.error('[AUTH] Error message:', error.message)
            console.error('[AUTH] Error stack:', error.stack)
          }
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}

