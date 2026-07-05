import { Platform } from 'react-native'
import { cachedFetch } from './cached-fetch'
import { saveWidgetBundle, type WidgetBundle } from '../widgets/widget-data'
import { syncReminders } from './reminders'

/**
 * همگام‌سازی بسته ۳۰ روزه: دریافت از سرور، نوشتن در Shared Storage ویجت،
 * تازه‌سازی ویجت‌های اندروید و زمان‌بندی یادآورهای محلی.
 * بعد از ورود، باز شدن تقویم و هر تغییر رویداد صدا زده می‌شود؛ خطاها بی‌صدا هستند
 * تا مسیر اصلی UI هرگز بلاک نشود.
 */
export async function syncWidgetAndReminders(): Promise<void> {
  try {
    const bundle = await cachedFetch<WidgetBundle>('/calendar/widget-data')
    if (!bundle) return

    await saveWidgetBundle(bundle)
    await syncReminders(bundle.reminders)

    if (Platform.OS === 'android') {
      // ماژول native فقط در build دارای پلاگین ویجت موجود است (نه Expo Go)
      try {
        /* eslint-disable @typescript-eslint/no-var-requires */
        const { requestWidgetUpdate } = require('react-native-android-widget')
        const { SmallShiftWidget, WeekShiftWidget, MonthShiftWidget } = require('../widgets/ShiftWidgets')
        const React = require('react')
        /* eslint-enable @typescript-eslint/no-var-requires */
        await requestWidgetUpdate({
          widgetName: 'ShiftSmall',
          renderWidget: () => React.createElement(SmallShiftWidget, { bundle }),
        })
        await requestWidgetUpdate({
          widgetName: 'ShiftWeek',
          renderWidget: () => React.createElement(WeekShiftWidget, { bundle }),
        })
        await requestWidgetUpdate({
          widgetName: 'ShiftMonth',
          renderWidget: () => React.createElement(MonthShiftWidget, { bundle }),
        })
      } catch {
        // بدون ویجت native (مثلاً Expo Go) — داده ذخیره شده و آماده است
      }
    }
  } catch {
    // آفلاین یا خطای سرور — بسته قبلی ویجت معتبر می‌ماند
  }
}
