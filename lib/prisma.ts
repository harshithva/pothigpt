import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// In production on Vercel, ensure we use a singleton pattern
if (process.env.NODE_ENV === 'production' && typeof globalThis !== 'undefined') {
  // Ensure we reuse the same Prisma instance across serverless functions
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma
  }
}

