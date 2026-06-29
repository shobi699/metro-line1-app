// منبع واحد نرمال‌سازی گروه شیفت و نوع شیفت + ساخت کلید ترکیبی انتساب الگو.
// در سرتاسر پروژه (موتور لوحه، materialize سرور، صفحه‌ی پرسنل، seed) فقط از این فایل استفاده شود
// تا قرارداد مقداری «گروه × نوع شیفت» در یک جا متمرکز بماند.

export type GroupKey = 'A' | 'B' | 'C' | 'ستادی'
export type ShiftTypeKey = '9-15' | '12-24' | 'ستادی'
export type ShiftRegime = 'rotational_9h' | 'rotational_12h' | 'staff'

/** برچسب‌های فارسی گروه‌های شیفتی برای سلکت‌ها و نمایش */
export const GROUPS_LIST: ReadonlyArray<{ key: GroupKey; name: string }> = [
  { key: 'A', name: 'گروه الف (A)' },
  { key: 'B', name: 'گروه ب (B)' },
  { key: 'C', name: 'گروه ج (C)' },
  { key: 'ستادی', name: 'نیروهای ستادی (اداری)' },
]

/** برچسب‌های فارسی نوع شیفت برای سلکت‌ها و نمایش */
export const SHIFT_TYPE_LIST: ReadonlyArray<{ key: ShiftTypeKey; name: string }> = [
  { key: '9-15', name: '۹ ساعته چرخشی (۹ تا ۱۵)' },
  { key: '12-24', name: '۱۲ ساعته چرخشی (۱۲ تا ۲۴)' },
  { key: 'ستادی', name: 'ستادی (اداری ثابت)' },
]

/**
 * نرمال‌سازی مقدار گروه به یکی از کلیدهای کانونیک.
 * نگاشت Staff↔ستادی و خالی→A را پوشش می‌دهد.
 */
export function normalizeGroup(value: unknown): GroupKey {
  const v = String(value ?? '').trim()
  if (v === 'Staff' || v === 'staff' || v === 'ستادی' || v === 'اداری') return 'ستادی'
  if (v === 'B' || v === 'ب') return 'B'
  if (v === 'C' || v === 'ج') return 'C'
  if (v === 'A' || v === 'الف' || v === '') return 'A'
  return (['A', 'B', 'C'].includes(v) ? v : 'A') as GroupKey
}

/**
 * نرمال‌سازی مقدار نوع شیفت به کلید کانونیک ساخت targetId.
 * `9-15`/`9 ساعته`→`9-15`، `12-24`/`12 ساعته`→`12-24`، `ستادی`→`ستادی`.
 */
export function shiftTypeKey(value: unknown): ShiftTypeKey {
  const v = String(value ?? '').trim()
  if (v === '12-24' || v === '12 ساعته' || v === '۱۲ ساعته' || v.includes('12')) return '12-24'
  if (v === 'ستادی' || v === 'staff' || v === 'Staff' || v === 'اداری') return 'ستادی'
  // پیش‌فرض و حالت ۹ ساعته
  return '9-15'
}

/** رژیم الگو متناظر با نوع شیفت پرسنل (برای پیشنهاد/اعتبارسنجی الگو) */
export function regimeFromShiftType(value: unknown): ShiftRegime {
  const key = shiftTypeKey(value)
  if (key === '12-24') return 'rotational_12h'
  if (key === 'ستادی') return 'staff'
  return 'rotational_9h'
}

/**
 * از روی customFields کاربر، گروه و نوع و کلید ترکیبی انتساب را می‌سازد.
 * `compositeKey` فرمت `"{shiftType}:{group}"` دارد؛ مثال: `9-15:A`، `12-24:C`، `ستادی:ستادی`.
 * منبع گروه فیلد `shift` است (نه `group` قدیمی)؛ در صورت خالی بودن به `group` عقب‌نشینی می‌کند.
 */
export function groupKeyFor(
  customFields: Record<string, unknown> | null | undefined,
): { group: GroupKey; type: ShiftTypeKey; compositeKey: string } {
  const cf = customFields ?? {}
  const rawGroup = cf.shift ?? cf.group
  const group = normalizeGroup(rawGroup)
  const type = group === 'ستادی' ? 'ستادی' : shiftTypeKey(cf.shiftType)
  return { group, type, compositeKey: `${type}:${group}` }
}

/** ساخت کلید ترکیبی از مقادیر خام گروه و نوع (برای فرم انتساب ادمین) */
export function buildCompositeKey(groupValue: unknown, typeValue: unknown): string {
  const group = normalizeGroup(groupValue)
  const type = group === 'ستادی' ? 'ستادی' : shiftTypeKey(typeValue)
  return `${type}:${group}`
}

/** تجزیه‌ی کلید ترکیبی یا گروه ساده به اجزای خوانا برای نمایش */
export function parseTargetId(targetId: string): { group: GroupKey; type: ShiftTypeKey | null } {
  if (targetId.includes(':')) {
    const [typePart, groupPart] = targetId.split(':')
    return { group: normalizeGroup(groupPart), type: shiftTypeKey(typePart) }
  }
  return { group: normalizeGroup(targetId), type: null }
}

/** برچسب فارسی خوانا برای یک targetId گروهی (ساده یا ترکیبی) */
export function targetIdLabel(targetId: string): string {
  const { group, type } = parseTargetId(targetId)
  const groupName = GROUPS_LIST.find((g) => g.key === group)?.name ?? `گروه ${group}`
  if (!type || group === 'ستادی') return groupName
  const typeName = type === '12-24' ? '۱۲ ساعته' : '۹ ساعته'
  return `${groupName} — ${typeName}`
}
