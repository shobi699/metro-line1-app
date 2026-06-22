import dayjs from 'dayjs'
import jalaliPlugin from 'dayjs-jalali'

dayjs.extend(jalaliPlugin)

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[Number(d)])
}

export function jalali(date?: Date | string): string {
  const d = dayjs(date)
  return d.isValid() ? d.format('jYYYY/jMM/jDD') : '—'
}
