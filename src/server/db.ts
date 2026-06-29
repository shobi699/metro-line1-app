import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createAdapter() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (url && token) {
    return new PrismaLibSql({ url, authToken: token })
  }

  // Local dev fallback — use file-based SQLite
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const p = require('node:path')
  const dbPath = p.resolve(process.cwd(), 'prisma', 'dev.db')
  return new PrismaLibSql({ url: `file:${dbPath}` })
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: createAdapter(),
  transactionOptions: {
    timeout: 30000,
    maxWait: 30000,
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
