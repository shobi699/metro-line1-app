import AsyncStorage from '@react-native-async-storage/async-storage'

/** یک روز فشرده در بسته ویجت — آینه‌ی GET /api/calendar/widget-data */
export interface WidgetDay {
  d: string // میلادی YYYY-MM-DD
  j: string // جلالی YYYY-MM-DD
  w: number // شنبه=۰ ... جمعه=۶
  s: string | null // کد شیفت
  st: string | null // ساعت شروع
  en: string | null // ساعت پایان
  f: boolean // پیش‌بینی سیکل
  h: string | null // عنوان تعطیلی/مناسبت
  ho: boolean // تعطیل رسمی
  e: number // تعداد رویداد
  t: string[] // عنوان حداکثر ۲ رویداد
}

export interface WidgetReminderEvent {
  id: string
  title: string
  type: string
  startAt: string
  allDay: boolean
  reminders: { minutesBefore: number }[]
}

export interface WidgetBundle {
  generatedAt: string
  from: string
  to: string
  days: WidgetDay[]
  reminders: WidgetReminderEvent[]
}

const STORAGE_KEY = 'shift_widget_bundle_v1'

export async function saveWidgetBundle(bundle: WidgetBundle): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bundle))
}

export async function loadWidgetBundle(): Promise<WidgetBundle | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WidgetBundle) : null
  } catch {
    return null
  }
}

export function todayGregStr(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** آیا بسته کهنه است؟ (>۲۴ ساعت از تولید — نقطه زرد در ویجت) */
export function isBundleStale(bundle: WidgetBundle, now: Date = new Date()): boolean {
  return now.getTime() - new Date(bundle.generatedAt).getTime() > 24 * 60 * 60 * 1000
}
