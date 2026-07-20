import { prisma } from '@/server/db'
import { writeAuditLog } from '@/server/modules/audit/service'

export interface SystemModuleFlag {
  id: string
  title: string
  description: string
  category: 'core' | 'comms' | 'advanced' | 'admin' | 'services'
  platform: 'both' | 'web' | 'mobile'
  enabled: boolean
  matchingPrefixes: string[]
}

export const CATEGORY_LABELS: Record<string, string> = {
  core: 'ماژول‌های اصلی عملیاتی',
  comms: 'ارتباطات و پیام‌رسانی',
  advanced: 'ماژول‌های پیشرفته',
  services: 'خدمات رفاهی و عمومی',
  admin: 'بخش‌های مدیریت کل',
}

export const DEFAULT_MODULE_FLAGS: SystemModuleFlag[] = [
  {
    id: 'calendar_roster',
    title: 'تقویم زندگی و لوحه شیفت کاری',
    description: 'تقویم شیفت، مشاهده برنامه روزانه و تقویم ماهانه پرسنل',
    category: 'core',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/calendar', '/roster'],
  },
  {
    id: 'swap',
    title: 'درخواست و تعویض شیفت (Swap)',
    description: 'امکان جابه‌جایی و درخواست تعویض شیفت بین پرسنل هم‌رده',
    category: 'core',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/swap'],
  },
  {
    id: 'directory',
    title: 'دفتر تلفن و پرسنل',
    description: 'جستجوی پرسنل، دفتر تلفن سازمانی و فیلدهای شناور',
    category: 'core',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/directory'],
  },
  {
    id: 'safety',
    title: 'بخشنامه‌های ایمنی و ابلاغیه‌ها',
    description: 'مشاهده بخشنامه‌های ایمنی و ثبت رسید خوانده‌شده الزامی',
    category: 'core',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/admin/safety', '/admin/bulletins', '/onboarding'],
  },
  {
    id: 'tickets',
    title: 'ثبت خرابی و تیکتینگ ناوگان',
    description: 'گزارش خرابی ناوگان، تیکتینگ و آنوتیشن تصویر',
    category: 'core',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/tickets', '/reports/faults', '/admin/tickets'],
  },
  {
    id: 'chat',
    title: 'چت بلادرنگ و پیام‌رسانی',
    description: 'اتاق‌های گفت‌وگوی گروهی و پیام‌رسانی بین پرسنل',
    category: 'comms',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/chat'],
  },
  {
    id: 'ai',
    title: 'دستیار هوشمند AI و RAG',
    description: 'پرسش و پاسخ هوشمند از کتابچه عملیات و قوانین',
    category: 'comms',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/ai', '/admin/ai', '/admin/ai-providers', '/admin/ai-cache'],
  },
  {
    id: 'radio_comms',
    title: 'شبیه‌ساز بی‌سیم تترا و کنفرانس صوتی',
    description: 'مکالمات صوتی گروهی و شبیه‌ساز بی‌سیم راهبری',
    category: 'comms',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/comms/radio', '/comms/conference'],
  },
  {
    id: 'attendance',
    title: 'حضور و غیاب هوشمند (Geofence)',
    description: 'ثبت ورود و خروج مکانی و جغرافیایی پرسنل',
    category: 'advanced',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/attendance'],
  },
  {
    id: 'checklists',
    title: 'چک‌لیست قبل از حرکت قطار',
    description: 'چک‌لیست‌های دیجیتال تحویل و تحول قطار',
    category: 'advanced',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/checklists', '/admin/checklists'],
  },
  {
    id: 'ideas_feedback',
    title: 'صندوق ایده‌ها، نظرسنجی و بازخورد',
    description: 'ثبت ایده‌ها، نظرسنجی‌ها و فرم‌های ارزیابی',
    category: 'services',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/ideas', '/polls', '/feedback', '/admin/surveys'],
  },
  {
    id: 'meetings',
    title: 'سامانه رزرو وقت جلسه',
    description: 'رزرو سالن‌های کنفرانس و جلسات کاری',
    category: 'services',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/meetings', '/admin/meetings'],
  },
  {
    id: 'performance',
    title: 'کارنامه، لیدربورد و گیمیفیکیشن',
    description: 'جدول امتیازات، رتبه‌بندی راهبران و کارنامه عملکرد',
    category: 'advanced',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/performance', '/leaderboard', '/admin/performance'],
  },
  {
    id: 'learning',
    title: 'سامانه آموزش پرسنل (LMS)',
    description: 'دوره‌های آموزشی، آزمون‌ها و مقالات فنی',
    category: 'services',
    platform: 'both',
    enabled: true,
    matchingPrefixes: ['/learning', '/content', '/catalogs', '/admin/learning'],
  },
  {
    id: 'occ',
    title: 'دیسپاچینگ و فرماندهی OCC',
    description: 'کنترل ترافیک خط ۱، مانیتورینگ زنده و PA',
    category: 'advanced',
    platform: 'web',
    enabled: true,
    matchingPrefixes: ['/occ', '/pa', '/crisis'],
  },
  {
    id: 'admin_users',
    title: 'مدیریت کاربران و دسترسی‌ها',
    description: 'پنل مدیریت پرسنل، احراز هویت و ممیزی IAM',
    category: 'admin',
    platform: 'web',
    enabled: true,
    matchingPrefixes: ['/admin/users', '/admin/my-unit', '/admin/iam-reports', '/admin/biometrics'],
  },
  {
    id: 'admin_signage',
    title: 'نمایشگرهای اطلاع‌رسانی دیجیتال',
    description: 'مدیریت پلی‌لیست تابلوها و نمایشگرهای آنلاین',
    category: 'admin',
    platform: 'web',
    enabled: true,
    matchingPrefixes: ['/admin/signage'],
  },
]

export async function getModuleFlags(): Promise<SystemModuleFlag[]> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'system.module_flags' },
    })

    if (!setting || !setting.value) {
      return DEFAULT_MODULE_FLAGS
    }

    const savedFlags: SystemModuleFlag[] = JSON.parse(setting.value)
    
    // Merge defaults to ensure any newly added modules appear
    const savedMap = new Map(savedFlags.map((f) => [f.id, f]))
    return DEFAULT_MODULE_FLAGS.map((def) => {
      const saved = savedMap.get(def.id)
      return saved ? { ...def, enabled: saved.enabled } : def
    })
  } catch (err) {
    console.error('[module-flags] Failed to fetch module flags:', err)
    return DEFAULT_MODULE_FLAGS
  }
}

export async function updateModuleFlags(
  flags: { id: string; enabled: boolean }[],
  actorId: string
): Promise<SystemModuleFlag[]> {
  const current = await getModuleFlags()
  const flagMap = new Map(flags.map((f) => [f.id, f.enabled]))

  const updated = current.map((item) => {
    if (flagMap.has(item.id)) {
      return { ...item, enabled: flagMap.get(item.id)! }
    }
    return item
  })

  await prisma.setting.upsert({
    where: { key: 'system.module_flags' },
    create: {
      key: 'system.module_flags',
      label: 'پیکربندی فعال‌سازی ماژول‌های سامانه',
      description: 'تنظیمات سوپر ادمین جهت روشن/خاموش کردن بخش‌های مختلف نرم‌افزار',
      type: 'json',
      value: JSON.stringify(updated),
      defaultValue: JSON.stringify(DEFAULT_MODULE_FLAGS),
      category: 'system',
      isEnabled: true,
    },
    update: {
      value: JSON.stringify(updated),
    },
  })

  // Write audit log entry
  try {
    await writeAuditLog({
      actorId,
      action: 'update',
      entity: 'system_module_flags',
      entityId: 'system.module_flags',
      before: current,
      after: updated,
    })
  } catch (e) {
    console.error('[module-flags] Audit log failed:', e)
  }

  return updated
}
