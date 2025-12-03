import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object to prevent
// exhausting your database connection limit in serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with optimized settings for serverless
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent multiple instances of Prisma Client in all environments
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production (Vercel), reuse the same instance
  globalForPrisma.prisma = prisma
}

// Add connection error handling
prisma.$connect().catch((error) => {
  console.error('[PRISMA] Failed to connect to database:', error)
})

export default prisma
