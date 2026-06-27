import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  transactionOptions: {
    timeout: 30000,
    maxWait: 30000,
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

let seedStarted = false
async function runSeed() {
  if (seedStarted) return
  seedStarted = true
  try {
    const { seedDatabase } = await import('./db-seed')
    await seedDatabase(prisma)
  } catch {}
}

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Fire and forget — don't block server startup or requests
  setTimeout(() => runSeed(), 0)
}
