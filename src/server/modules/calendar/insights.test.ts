import { describe, it, expect } from 'vitest'
import { findBridges } from './insights'
import type { CalendarDay, CalendarShiftEntry } from './service'

function day(
  date: string,
  weekday: number,
  shiftCode: string | null,
  holidayOff = false,
): CalendarDay {
  const shift: CalendarShiftEntry | null = shiftCode
    ? {
        code: shiftCode,
        label: shiftCode,
        startTime: '',
        endTime: '',
        hours: shiftCode === 'off' ? 0 : 9,
        source: 'cycle',
        forecast: false,
      }
    : null
  return {
    date,
    jalali: date, // برای تست کافی است
    weekday,
    shift,
    holidays: holidayOff
      ? [{ id: 'h1', title: 'تعطیل رسمی', kind: 'official', isOffDay: true, color: null }]
      : [],
    events: [],
    orgEvents: [],
    meetings: [],
  }
}

describe('findBridges — پل تعطیلات', () => {
  it('بازه آف + تعطیل رسمی + جمعه را یکپارچه پیدا می‌کند', () => {
    const days = [
      day('2026-08-31', 1, 'morning'),
      day('2026-09-01', 2, 'off'),
      day('2026-09-02', 3, 'off'),
      day('2026-09-03', 4, 'night', true), // تعطیل رسمی ولی شیفت کاری دارد ← استراحت نیست
      day('2026-09-04', 5, 'morning'),
    ]
    const bridges = findBridges(days)
    expect(bridges).toHaveLength(1)
    expect(bridges[0]).toMatchObject({ from: '2026-09-01', to: '2026-09-02', length: 2 })
    expect(bridges[0].parts).toEqual(['آف', 'آف'])
  })

  it('جمعه بدون شیفت و تعطیل رسمی بدون شیفت، پل را ادامه می‌دهند', () => {
    const days = [
      day('2026-09-07', 0, 'evening'),
      day('2026-09-08', 1, 'off'),
      day('2026-09-09', 2, null, true), // تعطیل رسمی بدون شیفت
      day('2026-09-10', 3, 'off'),
      day('2026-09-11', 6, null), // جمعه بدون شیفت
      day('2026-09-12', 0, 'morning'),
    ]
    const bridges = findBridges(days)
    expect(bridges).toHaveLength(1)
    expect(bridges[0].length).toBe(4)
    expect(bridges[0].parts).toEqual(['آف', 'تعطیل رسمی', 'آف', 'جمعه'])
  })

  it('روزهای تکی استراحت پل نمی‌سازند و بازه‌ها به طول مرتب می‌شوند', () => {
    const days = [
      day('2026-09-01', 1, 'off'),
      day('2026-09-02', 2, 'morning'),
      day('2026-09-03', 3, 'off'),
      day('2026-09-04', 4, 'off'),
      day('2026-09-05', 5, 'morning'),
      day('2026-09-06', 6, null), // جمعه
      day('2026-09-07', 0, 'off'),
      day('2026-09-08', 1, 'off'),
      day('2026-09-09', 2, 'morning'),
    ]
    const bridges = findBridges(days)
    expect(bridges.map((b) => b.length)).toEqual([3, 2])
    expect(bridges[0].from).toBe('2026-09-06')
  })

  it('پایان بازه، پلِ باز را می‌بندد', () => {
    const days = [day('2026-09-01', 1, 'off'), day('2026-09-02', 2, 'off')]
    expect(findBridges(days)).toHaveLength(1)
  })
})
