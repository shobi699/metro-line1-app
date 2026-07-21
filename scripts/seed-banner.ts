import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  await prisma.setting.upsert({
    where: { key: 'mobile.dashboard.banner.enabled' },
    update: {},
    create: {
      key: 'mobile.dashboard.banner.enabled',
      label: 'نمایش بنر داشبورد',
      description: 'فعال یا غیرفعال بودن بنر تصویری در پایین داشبورد اپلیکیشن موبایل',
      type: 'boolean',
      value: JSON.stringify(true),
      defaultValue: JSON.stringify(false),
      category: 'mobile',
      isEnabled: true,
    }
  })

  await prisma.setting.upsert({
    where: { key: 'mobile.dashboard.banner.url' },
    update: {},
    create: {
      key: 'mobile.dashboard.banner.url',
      label: 'لینک تصویر بنر داشبورد',
      description: 'آدرس اینترنتی (URL) تصویر بنر. برای نمایش بهتر از نسبت ابعاد مستطیل افقی استفاده کنید.',
      type: 'text',
      value: JSON.stringify('https://picsum.photos/id/1050/800/250'),
      defaultValue: JSON.stringify(''),
      category: 'mobile',
      isEnabled: true,
    }
  })

  await prisma.setting.upsert({
    where: { key: 'mobile.dashboard.banner.link' },
    update: {},
    create: {
      key: 'mobile.dashboard.banner.link',
      label: 'لینک هدف بنر داشبورد',
      description: 'آدرس وب‌سایتی که با کلیک روی بنر باز می‌شود.',
      type: 'text',
      value: JSON.stringify('https://metro.tehran.ir'),
      defaultValue: JSON.stringify(''),
      category: 'mobile',
      isEnabled: true,
    }
  })

  console.log('Banner settings seeded.')
  await prisma.$disconnect()
}

main().catch(console.error)
