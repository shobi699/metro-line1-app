import React from 'react'
import { FlexWidget, TextWidget } from 'react-native-android-widget'
import { toFa } from '../shared/jalali'
import { type WidgetBundle, type WidgetDay, todayGregStr, isBundleStale } from './widget-data'

type HexColor = `#${string}`

// پالت تیره — SHIFT_CALENDAR_UI_DESIGN.md §2.1 (تم پیش‌فرض پروژه تیره است)
const COLORS: Record<'bg' | 'surface' | 'text' | 'muted' | 'brand' | 'stale', HexColor> = {
  bg: '#131922',
  surface: '#1b232e',
  text: '#e6eaf0',
  muted: '#9aa6b5',
  brand: '#f2556a',
  stale: '#fbbf24',
}

const SHIFT_META: Record<string, { label: string; icon: string; color: HexColor }> = {
  morning: { label: 'صبح', icon: '☀️', color: '#2dd4cf' },
  evening: { label: 'عصر', icon: '🌆', color: '#fbbf24' },
  night: { label: 'شب', icon: '🌙', color: '#818cf8' },
  off: { label: 'آف', icon: '🏖', color: '#4ade80' },
  office: { label: 'اداری', icon: '🏢', color: '#94a3b8' },
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
]

const WEEKDAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

function jalaliLabel(day: WidgetDay): string {
  const [, m, d] = day.j.split('-')
  return `${toFa(Number(d))} ${JALALI_MONTHS[Number(m) - 1]}`
}

function findToday(bundle: WidgetBundle): WidgetDay | null {
  const key = todayGregStr()
  return bundle.days.find((d) => d.d === key) ?? bundle.days[0] ?? null
}

function daysToNextOff(bundle: WidgetBundle): number | null {
  const key = todayGregStr()
  const upcoming = bundle.days.filter((d) => d.d > key)
  const idx = upcoming.findIndex((d) => d.s === 'off' || d.ho)
  return idx === -1 ? null : idx + 1
}

function StaleDot({ bundle }: { bundle: WidgetBundle }) {
  if (!isBundleStale(bundle)) return null
  return (
    <FlexWidget
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.stale }}
    />
  )
}

function EmptyWidget({ message }: { message: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
      }}
    >
      <TextWidget text="🔄" style={{ fontSize: 22 }} />
      <TextWidget text={message} style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }} />
    </FlexWidget>
  )
}

/** کوچک ۲×۲ — «پاسخ یک‌نگاهی» */
export function SmallShiftWidget({ bundle }: { bundle: WidgetBundle | null }) {
  if (!bundle) return <EmptyWidget message="برای همگام‌سازی باز کنید" />
  const today = findToday(bundle)
  if (!today) return <EmptyWidget message="برای همگام‌سازی باز کنید" />

  const meta = today.s ? SHIFT_META[today.s] : null
  const todayIdx = bundle.days.findIndex((d) => d.d === today.d)
  const tomorrow = bundle.days[todayIdx + 1] ?? null
  const tomorrowMeta = tomorrow?.s ? SHIFT_META[tomorrow.s] : null

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
        <StaleDot bundle={bundle} />
        <TextWidget text={jalaliLabel(today)} style={{ fontSize: 12, color: COLORS.muted }} />
      </FlexWidget>
      <TextWidget text={meta?.icon ?? '📅'} style={{ fontSize: 30, marginTop: 4 }} />
      <TextWidget
        text={meta ? meta.label : 'بدون شیفت'}
        style={{ fontSize: 18, fontWeight: 'bold', color: meta?.color ?? COLORS.text, marginTop: 2 }}
      />
      {today.st ? (
        <TextWidget
          text={toFa(`${today.st}–${today.en ?? ''}`)}
          style={{ fontSize: 12, color: COLORS.text, marginTop: 2 }}
        />
      ) : null}
      {tomorrowMeta ? (
        <TextWidget
          text={`فردا: ${tomorrowMeta.icon} ${tomorrowMeta.label}`}
          style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}
        />
      ) : null}
    </FlexWidget>
  )
}

/** متوسط ۴×۲ — «خطِ زندگی جیبی» */
export function WeekShiftWidget({ bundle }: { bundle: WidgetBundle | null }) {
  if (!bundle) return <EmptyWidget message="برای همگام‌سازی باز کنید" />
  const today = findToday(bundle)
  if (!today) return <EmptyWidget message="برای همگام‌سازی باز کنید" />

  const meta = today.s ? SHIFT_META[today.s] : null
  const todayIdx = bundle.days.findIndex((d) => d.d === today.d)
  const week = bundle.days.slice(todayIdx, todayIdx + 7)
  const nextOff = daysToNextOff(bundle)
  const firstEvent = today.t[0] ?? null

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* هدر: تاریخ + شیفت امروز */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={meta ? `${meta.icon} ${meta.label}${today.st ? ' ' + toFa(`${today.st}–${today.en ?? ''}`) : ''}` : 'بدون شیفت'}
          style={{ fontSize: 13, fontWeight: 'bold', color: meta?.color ?? COLORS.text }}
        />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
          <StaleDot bundle={bundle} />
          <TextWidget text={jalaliLabel(today)} style={{ fontSize: 12, color: COLORS.muted }} />
        </FlexWidget>
      </FlexWidget>

      {/* ریبون ۷ روزه — راست‌به‌چپ: امروز اول از راست */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}
      >
        {[...week].reverse().map((day) => {
          const m = day.s ? SHIFT_META[day.s] : null
          const isToday = day.d === today.d
          return (
            <FlexWidget
              key={day.d}
              style={{ flexDirection: 'column', alignItems: 'center', flexGap: 2 }}
            >
              <TextWidget text={m?.icon ?? '·'} style={{ fontSize: isToday ? 18 : 14 }} />
              <FlexWidget
                style={{
                  width: 22,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: m?.color ?? COLORS.surface,
                }}
              />
              <TextWidget
                text={WEEKDAY_LETTERS[day.w]}
                style={{
                  fontSize: 10,
                  color: isToday ? COLORS.brand : COLORS.muted,
                  fontWeight: isToday ? 'bold' : 'normal',
                }}
              />
            </FlexWidget>
          )
        })}
      </FlexWidget>

      {/* فوتر: رویداد امروز + شمارش معکوس آف */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={nextOff !== null ? `${toFa(nextOff)} روز تا آف 🎉` : ' '}
          style={{ fontSize: 11, color: COLORS.muted }}
        />
        <TextWidget
          text={firstEvent ? `● ${firstEvent}` : 'بدون رویداد'}
          style={{ fontSize: 11, color: firstEvent ? '#3b82f6' : COLORS.muted }}
        />
      </FlexWidget>
    </FlexWidget>
  )
}

/** بزرگ ۴×۴ — ماه مینیاتوری + رویدادهای بعدی */
export function MonthShiftWidget({ bundle }: { bundle: WidgetBundle | null }) {
  if (!bundle) return <EmptyWidget message="برای همگام‌سازی باز کنید" />
  const today = findToday(bundle)
  if (!today) return <EmptyWidget message="برای همگام‌سازی باز کنید" />

  // ردیف‌های هفتگی از ۳۰ روز بسته؛ ابتدای ردیف اول با روز هفته تراز می‌شود
  const rows: (WidgetDay | null)[][] = []
  let row: (WidgetDay | null)[] = Array.from({ length: bundle.days[0].w }, () => null)
  for (const day of bundle.days) {
    row.push(day)
    if (row.length === 7) {
      rows.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null)
    rows.push(row)
  }

  const key = todayGregStr()
  const upcomingEvents = bundle.days
    .filter((d) => d.d >= key && d.t.length > 0)
    .flatMap((d) => d.t.map((title) => ({ title, label: jalaliLabel(d) })))
    .slice(0, 3)

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        flexGap: 6,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget text="۳۰ روز پیش رو" style={{ fontSize: 11, color: COLORS.muted }} />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
          <StaleDot bundle={bundle} />
          <TextWidget
            text={jalaliLabel(today)}
            style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.text }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* سطر حروف هفته — راست‌به‌چپ */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}
      >
        {[...WEEKDAY_LETTERS].reverse().map((l, i) => (
          <TextWidget key={`h-${i}`} text={l} style={{ fontSize: 10, color: COLORS.muted }} />
        ))}
      </FlexWidget>

      {rows.map((r, ri) => (
        <FlexWidget
          key={`r-${ri}`}
          style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}
        >
          {[...r].reverse().map((day, ci) => {
            if (!day) {
              return <FlexWidget key={`e-${ri}-${ci}`} style={{ width: 24, height: 24 }} />
            }
            const m = day.s ? SHIFT_META[day.s] : null
            const isToday = day.d === today.d
            return (
              <FlexWidget
                key={day.d}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: isToday ? COLORS.brand : m ? (`${m.color}33` as HexColor) : COLORS.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TextWidget
                  text={toFa(Number(day.j.slice(8)))}
                  style={{
                    fontSize: 10,
                    color: isToday ? '#ffffff' : day.ho ? COLORS.brand : m?.color ?? COLORS.muted,
                    fontWeight: isToday ? 'bold' : 'normal',
                  }}
                />
              </FlexWidget>
            )
          })}
        </FlexWidget>
      ))}

      <FlexWidget style={{ flexDirection: 'column', flexGap: 2, width: 'match_parent' }}>
        {upcomingEvents.length === 0 ? (
          <TextWidget text="رویداد پیش رو ندارید" style={{ fontSize: 10, color: COLORS.muted }} />
        ) : (
          upcomingEvents.map((e, i) => (
            <TextWidget
              key={`ev-${i}`}
              text={`● ${e.title} — ${e.label}`}
              style={{ fontSize: 10, color: COLORS.text }}
              truncate="END"
              maxLines={1}
            />
          ))
        )}
      </FlexWidget>
    </FlexWidget>
  )
}
