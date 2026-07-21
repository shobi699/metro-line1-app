import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { toFa } from './jalali'
import type { WidgetReminderEvent } from '../widgets/widget-data'

// نمایش اعلان حتی وقتی اپ باز است
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync()
    if (settings.granted) return true
    const req = await Notifications.requestPermissionsAsync()
    return req.granted
  } catch {
    return false
  }
}

/** زمان پایه رویداد تمام‌روز: ۰۸:۰۰ محلی همان روز (نه نیمه‌شب UTC) */
function eventBaseTime(event: WidgetReminderEvent): Date {
  const start = new Date(event.startAt)
  if (!event.allDay) return start
  const base = new Date(start)
  base.setHours(8, 0, 0, 0)
  return base
}

/**
 * همگام‌سازی یادآورهای محلی با رویدادهای ۳۰ روز آینده.
 * idempotent: همه اعلان‌های زمان‌بندی‌شده قبلی لغو و از داده تازه ساخته می‌شوند
 * (این اپ جای دیگری اعلان محلی زمان‌بندی نمی‌کند).
 */
export async function syncReminders(events: WidgetReminderEvent[]): Promise<void> {
  if (Platform.OS === 'web') return

  const granted = await ensureNotificationPermission()
  if (!granted) return

  await Notifications.cancelAllScheduledNotificationsAsync()

  const now = Date.now()
  for (const event of events) {
    const base = eventBaseTime(event)
    for (const r of event.reminders) {
      const fireAt = new Date(base.getTime() - r.minutesBefore * 60_000)
      if (fireAt.getTime() <= now) continue

      const whenLabel =
        r.minutesBefore === 0
          ? 'اکنون'
          : r.minutesBefore < 60
            ? `${toFa(r.minutesBefore)} دقیقه دیگر`
            : r.minutesBefore < 1440
              ? `${toFa(Math.round(r.minutesBefore / 60))} ساعت دیگر`
              : `${toFa(Math.round(r.minutesBefore / 1440))} روز دیگر`

      await Notifications.scheduleNotificationAsync({
        content: {
          title: event.type === 'task' ? `☐ یادآور کار: ${event.title}` : `● یادآور: ${event.title}`,
          body: `${whenLabel} — از تقویم زندگی`,
        },
        trigger: fireAt,
      })
    }
  }
}
