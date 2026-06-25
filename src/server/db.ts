// Trigger reload: ensure personnel custom fields are populated
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'node:path'
import { seedDatabase } from './db-seed'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Automatically trigger self-seeding if running in server-side node context
if (typeof window === 'undefined') {
  seedDatabase(prisma).catch(() => {})
}
