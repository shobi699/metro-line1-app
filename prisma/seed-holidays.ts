/**
 * Seed تعطیلات رسمی شمسی (تکرارشونده سالانه جلالی).
 * مناسبت‌های قمری هر سال جابه‌جا می‌شوند و طبق طراحی (SHIFT_CALENDAR_DESIGN.md §۱۱)
 * توسط ادمین از پنل ایمپورت می‌شوند — این‌جا seed نمی‌شوند.
 * اجرا: npx tsx prisma/seed-holidays.ts  (idempotent — قابل اجرای مکرر)
 */
import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

import { SYSTEM_DEFAULT_HOLIDAYS } from './seed-holidays-data'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || `file:${dbPath}`,
  })
  const prisma = new PrismaClient({ adapter })

  let created = 0
  let skipped = 0

  for (const h of SYSTEM_DEFAULT_HOLIDAYS) {
    const existing = await prisma.holiday.findFirst({
      where: { jalaliDate: h.jalaliDate, title: h.title },
    })
    if (existing) {
      skipped++
      continue
    }
    await prisma.holiday.create({
      data: {
        jalaliDate: h.jalaliDate,
        title: h.title,
        kind: h.kind,
        isOffDay: h.isOffDay,
        recurring: h.recurring ?? false,
        hijriBased: h.hijriBased ?? false,
        isActive: true,
      },
    })
    created++
  }

  process.stdout.write(`holidays seeded: ${created} created, ${skipped} already present\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  process.stderr.write(String(e) + '\n')
  process.exit(1)
})
