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

interface HolidaySeed {
  jalaliDate: string
  title: string
  kind: 'official' | 'religious' | 'occasion'
  isOffDay: boolean
}

const SOLAR_HOLIDAYS: HolidaySeed[] = [
  { jalaliDate: '1405-01-01', title: 'نوروز', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-01-02', title: 'نوروز', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-01-03', title: 'نوروز', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-01-04', title: 'نوروز', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-01-12', title: 'روز جمهوری اسلامی', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-01-13', title: 'روز طبیعت (سیزده‌به‌در)', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-03-14', title: 'رحلت امام خمینی', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-03-15', title: 'قیام ۱۵ خرداد', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-11-22', title: 'پیروزی انقلاب اسلامی', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-12-29', title: 'ملی شدن صنعت نفت', kind: 'official', isOffDay: true },
  { jalaliDate: '1405-09-30', title: 'شب یلدا', kind: 'occasion', isOffDay: false },
]

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || `file:${dbPath}`,
  })
  const prisma = new PrismaClient({ adapter })

  let created = 0
  let skipped = 0

  for (const h of SOLAR_HOLIDAYS) {
    // تکرارشونده جلالی: کلید منطقی = ماه-روز + عنوان
    const monthDay = h.jalaliDate.slice(5)
    const existing = await prisma.holiday.findFirst({
      where: { title: h.title, recurring: true, jalaliDate: { endsWith: monthDay } },
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
        recurring: true,
        hijriBased: false,
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
