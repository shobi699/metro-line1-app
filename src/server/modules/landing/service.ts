import { prisma } from '@/server/db'

const LANDING_SETTINGS_DEFAULTS = [
  {
    key: 'landing.particleCount',
    label: 'تعداد ذرات کره',
    type: 'number',
    value: 1200,
    defaultValue: 1200,
    category: 'landing',
    min: 200,
    max: 5000,
  },
  {
    key: 'landing.sphereRadius',
    label: 'شعاع کره',
    type: 'number',
    value: 3,
    defaultValue: 3,
    category: 'landing',
    min: 1,
    max: 10,
  },
  {
    key: 'landing.autoRotateSpeed',
    label: 'سرعت چرخش خودکار',
    type: 'number',
    value: 0.3,
    defaultValue: 0.3,
    category: 'landing',
    min: 0,
    max: 2,
  },
  {
    key: 'landing.bloomIntensity',
    label: 'شدت درخشش (bloom)',
    type: 'number',
    value: 0.8,
    defaultValue: 0.8,
    category: 'landing',
    min: 0,
    max: 3,
  },
  {
    key: 'landing.quoteMode',
    label: 'حالت نمایش نقل‌قول',
    type: 'select',
    value: 'random',
    defaultValue: 'random',
    category: 'landing',
    options: ['fixed', 'random'],
  },
  {
    key: 'landing.fallbackMode',
    label: 'سیاست افت‌گرایی',
    type: 'select',
    value: 'auto',
    defaultValue: 'auto',
    category: 'landing',
    options: ['auto', 'always3d', 'always2d'],
  },
  {
    key: 'landing.seoTitle',
    label: 'عنوان سئو',
    type: 'text',
    value: 'مدار خط یک — سامانه سیر و حرکت مترو تهران',
    defaultValue: 'مدار خط یک — سامانه سیر و حرکت مترو تهران',
    category: 'landing',
  },
  {
    key: 'landing.seoDescription',
    label: 'توضیحات سئو',
    type: 'text',
    value: 'سامانه یکپارچه مدیریت عملیات، شیفت‌ها، ایمنی و ارتباطات پرسنل خط ۱ مترو تهران',
    defaultValue: 'سامانه یکپارچه مدیریت عملیات، شیفت‌ها، ایمنی و ارتباطات پرسنل خط ۱ مترو تهران',
    category: 'landing',
  },
  {
    key: 'landing.headerTitle',
    label: 'عنوان هدر سایت',
    type: 'text',
    value: 'مدار خط یک',
    defaultValue: 'مدار خط یک',
    category: 'landing',
  },
  {
    key: 'landing.heroTitle',
    label: 'عنوان اصلی لندینگ',
    type: 'text',
    value: 'مدار خط یک',
    defaultValue: 'مدار خط یک',
    category: 'landing',
  },
  {
    key: 'landing.heroSubtitle',
    label: 'زیرعنوان لندینگ',
    type: 'text',
    value: 'سامانه سیر و حرکت خط ۱ مترو تهران',
    defaultValue: 'سامانه سیر و حرکت خط ۱ مترو تهران',
    category: 'landing',
  },
  {
    key: 'landing.footerText',
    label: 'متن کپی‌رایت فوتر',
    type: 'text',
    value: 'سامانه سیر و حرکت خط ۱ مترو تهران — مدار خط یک',
    defaultValue: 'سامانه سیر و حرکت خط ۱ مترو تهران — مدار خط یک',
    category: 'landing',
  },
]

export async function ensureLandingSettings() {
  for (const d of LANDING_SETTINGS_DEFAULTS) {
    const existing = await prisma.setting.findUnique({ where: { key: d.key } })
    if (!existing) {
      await prisma.setting.create({
        data: {
          key: d.key,
          label: d.label,
          type: d.type,
          value: JSON.stringify(d.value),
          defaultValue: JSON.stringify(d.defaultValue),
          category: d.category,
          min: d.min ?? null,
          max: d.max ?? null,
          options: d.options ? JSON.stringify(d.options) : null,
          isEnabled: true,
        },
      })
    }
  }
}

export async function getPublishedLandingData() {
  await ensureLandingSettings()

  const [images, quotes, ctas, settings] = await Promise.all([
    prisma.orbitImage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.heroQuote.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.landingCta.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.setting.findMany({
      where: { category: 'landing' },
    }),
  ])

  const settingsMap: Record<string, unknown> = {}
  for (const s of settings) {
    const shortKey = s.key.replace('landing.', '')
    try {
      settingsMap[shortKey] = JSON.parse(s.value)
    } catch {
      settingsMap[shortKey] = s.value
    }
  }

  return { images, quotes, ctas, settings: settingsMap }
}

export async function seedLandingData() {
  const imageCount = await prisma.orbitImage.count()
  if (imageCount > 0) return

  const sampleImages = [
    { title: 'ایستگاه تجریش', alt: 'نمای ایستگاه تجریش خط ۱ مترو تهران', sortOrder: 0 },
    { title: 'ایستگاه کهریزک', alt: 'نمای ایستگاه کهریزک خط ۱ مترو تهران', sortOrder: 1 },
    { title: 'اتاق فرمان OCC', alt: 'مرکز کنترل فرماندهی خط ۱ مترو', sortOrder: 2 },
    { title: 'قطار خط ۱', alt: 'قطار در حال حرکت در تونل خط ۱', sortOrder: 3 },
    { title: 'ایستگاه ولیعصر', alt: 'نمای داخلی ایستگاه ولیعصر', sortOrder: 4 },
    { title: 'ایستگاه دروازه دولت', alt: 'ورودی ایستگاه دروازه دولت', sortOrder: 5 },
    { title: 'پرسنل عملیات', alt: 'تیم عملیات خط ۱ مترو تهران', sortOrder: 6 },
    { title: 'نمای شبانه', alt: 'نمای شبانه ایستگاه‌های خط ۱', sortOrder: 7 },
  ]

  for (const img of sampleImages) {
    await prisma.orbitImage.create({
      data: {
        title: img.title,
        alt: img.alt,
        mediaUrl: `/images/landing/placeholder-${img.sortOrder + 1}.jpg`,
        sortOrder: img.sortOrder,
        isActive: true,
      },
    })
  }

  await prisma.heroQuote.create({
    data: {
      text: 'ما نگهبانان حرکت شهر هستیم؛ هر سفر امن، افتخار ماست.',
      author: 'خانواده بزرگ خط ۱ مترو تهران',
      isActive: true,
      sortOrder: 0,
    },
  })

  await prisma.heroQuote.create({
    data: {
      text: 'ایمنی مسافران، بالاترین اولویت ماست.',
      isActive: true,
      sortOrder: 1,
    },
  })

  const defaultCtas = [
    { label: 'ورود به سامانه', href: '/login', icon: 'LogIn', variant: 'primary', sortOrder: 0 },
    { label: 'داشبورد', href: '/dashboard', icon: 'LayoutDashboard', variant: 'secondary', sortOrder: 1, authOnly: true },
    { label: 'دفتر تلفن', href: '/directory', icon: 'Users', variant: 'ghost', sortOrder: 2, authOnly: true },
  ]

  for (const cta of defaultCtas) {
    await prisma.landingCta.create({
      data: {
        label: cta.label,
        href: cta.href,
        icon: cta.icon,
        variant: cta.variant,
        sortOrder: cta.sortOrder,
        isActive: true,
        authOnly: cta.authOnly ?? false,
      },
    })
  }

  await ensureLandingSettings()
}
