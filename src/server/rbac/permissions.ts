// مجوزها به‌صورت رشته‌ای؛ منبع حقیقت در Role.permissions (دیتابیس) است.
export type Permission = string

export interface PermissionGroup {
  resource: string
  label: string
  permissions: { key: string; label: string }[]
}

/** کاتالوگ کامل مجوزها برای نمایش تیک‌باکس در پنل مدیریت نقش. */
export const PERMISSION_CATALOG: PermissionGroup[] = [
  {
    resource: 'users',
    label: 'کاربران',
    permissions: [
      { key: 'users:create', label: 'ایجاد' },
      { key: 'users:read', label: 'مشاهده' },
      { key: 'users:update', label: 'ویرایش' },
      { key: 'users:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'roles',
    label: 'نقش‌ها',
    permissions: [{ key: 'roles:manage', label: 'مدیریت نقش‌ها' }],
  },
  {
    resource: 'shifts',
    label: 'شیفت‌ها',
    permissions: [
      { key: 'shifts:create', label: 'ایجاد' },
      { key: 'shifts:read', label: 'مشاهده' },
      { key: 'shifts:update', label: 'ویرایش' },
      { key: 'shifts:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'tickets',
    label: 'تیکت‌ها',
    permissions: [
      { key: 'tickets:create', label: 'ایجاد' },
      { key: 'tickets:read', label: 'مشاهده' },
      { key: 'tickets:update', label: 'ویرایش' },
      { key: 'tickets:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'bulletins',
    label: 'بخش‌نامه‌ها',
    permissions: [
      { key: 'bulletins:create', label: 'ایجاد' },
      { key: 'bulletins:read', label: 'مشاهده' },
      { key: 'bulletins:update', label: 'ویرایش' },
      { key: 'bulletins:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'posts',
    label: 'محتوا',
    permissions: [
      { key: 'posts:create', label: 'ایجاد' },
      { key: 'posts:read', label: 'مشاهده' },
      { key: 'posts:update', label: 'ویرایش' },
      { key: 'posts:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'meetings',
    label: 'جلسات',
    permissions: [
      { key: 'meetings:create', label: 'درخواست جلسه' },
      { key: 'meetings:read', label: 'مشاهده' },
      { key: 'meetings:manage', label: 'مدیریت درخواست‌ها' },
    ],
  },
  {
    resource: 'feedback',
    label: 'بازخوردها',
    permissions: [
      { key: 'feedback:create', label: 'ارسال' },
      { key: 'feedback:read', label: 'مشاهده' },
      { key: 'feedback:respond', label: 'پاسخ‌دهی' },
    ],
  },
  {
    resource: 'notifications',
    label: 'اعلان‌ها',
    permissions: [{ key: 'notifications:send', label: 'ارسال گروهی' }],
  },
  {
    resource: 'imports',
    label: 'ورود/خروج داده',
    permissions: [
      { key: 'imports:create', label: 'ورود داده' },
      { key: 'imports:read', label: 'مشاهده' },
    ],
  },
  {
    resource: 'settings',
    label: 'تنظیمات',
    permissions: [
      { key: 'settings:read', label: 'مشاهده' },
      { key: 'settings:update', label: 'ویرایش' },
    ],
  },
  {
    resource: 'faults',
    label: 'مدیریت خرابی‌ها (فالت)',
    permissions: [
      { key: 'faults:create', label: 'ثبت فالت' },
      { key: 'faults:read', label: 'مشاهده فالت‌ها' },
      { key: 'faults:review', label: 'تایید / رد / ویرایش در مرحله بازبینی' },
      { key: 'faults:repair', label: 'ثبت اقدامات تعمیراتی' },
      { key: 'faults:verify', label: 'تایید نهایی و بستن' },
      { key: 'faults:reopen', label: 'بازگشایی فالت بسته‌شده' },
      { key: 'faults:defer', label: 'ماندگار کردن (Deferred)' },
    ],
  },
  {
    resource: 'fleet',
    label: 'ناوگان قطارها',
    permissions: [
      { key: 'fleet:manage', label: 'مدیریت قطارها و واگن‌ها' },
      { key: 'fleet:read', label: 'مشاهده ناوگان' },
    ],
  },
  {
    resource: 'fault-catalog',
    label: 'کاتالوگ خطاها',
    permissions: [
      { key: 'fault-catalog:manage', label: 'مدیریت کاتالوگ' },
      { key: 'fault-catalog:read', label: 'مشاهده کاتالوگ' },
    ],
  },
  {
    resource: 'calendar',
    label: 'تقویم',
    permissions: [
      { key: 'calendar:view', label: 'مشاهده تقویم خود' },
      { key: 'calendar:personal', label: 'مدیریت رویدادهای شخصی' },
      { key: 'calendar:view-team', label: 'مشاهده شیفت هم‌گروهی‌ها' },
      { key: 'calendar:ics', label: 'اشتراک ICS' },
    ],
  },
  {
    resource: 'calendar-admin',
    label: 'مدیریت تقویم',
    permissions: [
      { key: 'calendar-admin:holidays', label: 'مدیریت تعطیلات و مناسبت‌ها' },
      { key: 'calendar-admin:events', label: 'رویدادهای سازمانی' },
      { key: 'calendar-admin:config', label: 'پیکربندی ظاهر و قوانین' },
    ],
  },
  {
    resource: 'fault-reports',
    label: 'گزارش‌های فالت',
    permissions: [
      { key: 'fault-reports:view', label: 'مشاهده گزارش‌ها و داشبورد' },
      { key: 'fault-reports:export', label: 'خروجی اکسل / PDF' },
    ],
  },
]

/** فهرست تخت همهٔ کلیدهای مجوز معتبر. */
export const ALL_PERMISSIONS: string[] = PERMISSION_CATALOG.flatMap((g) =>
  g.permissions.map((p) => p.key),
)

/** رتبهٔ نقش‌های سیستمی برای سازگاری با گاردهای مبتنی بر نقش. */
export const SYSTEM_ROLE_RANKS: Record<string, number> = {
  driver: 0,
  shift_lead: 0,
  expert: 0,
  dispatch_tech: 0,
  clerical: 0,
  operator: 0,

  supervisor: 1,
  chief: 1,
  manager: 1,
  admin: 1,

  super_admin: 2,
}

export const POST_TO_ROLE_KEY: Record<string, string> = {
  'راهبر': 'driver',
  'مسئول شیفت': 'shift_lead',
  'کارشناس': 'expert',
  'تکنسین اعزام پذیرش': 'dispatch_tech',
  'سرپرست': 'supervisor',
  'رئیس': 'chief',
  'مدیر': 'manager',
  'دفتری': 'clerical'
}

export function rankForRoleKey(key: string): number {
  return SYSTEM_ROLE_RANKS[key] ?? 0
}

/** بررسی مجوز؛ `*` به‌معنای دسترسی کامل (مدیر ارشد). */
export function hasPermission(
  permissions: string[],
  permission: string,
): boolean {
  return permissions.includes('*') || permissions.includes(permission)
}

/**
 * نرمال‌سازی مقدار خام Role.permissions به آرایهٔ تخت رشته‌ای.
 * از سه شکل پشتیبانی می‌کند: رشتهٔ JSON، آرایهٔ تخت (['users:read', '*'])،
 * یا ماتریس شیئی ({ users: ['read', 'create'] }).
 */
export function coercePermissions(raw: unknown): string[] {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([resource, actions]) =>
        Array.isArray(actions) ? actions.map((a) => `${resource}:${a}`) : [],
    )
  }
  return []
}
