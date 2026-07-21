import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getTsrEntries } from '@/server/modules/occ/tsr-service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const tsrs = await getTsrEntries()

    // Simulate trains based on current seconds to animate movement
    const now = new Date()
    const sec = now.getSeconds() + now.getMilliseconds() / 1000

    const rawTrains = [
      { id: 'TR-101', basePos: (sec * 1.5) % 100 },
      { id: 'TR-204', basePos: 100 - ((sec * 1.5 + 30) % 100) },
      { id: 'TR-088', basePos: (sec * 1.2 + 50) % 100 },
    ]

    const trains = rawTrains.map((t) => {
      const pos = t.basePos
      // Map percentage to station name
      let station = 'تجریش'
      if (pos >= 20 && pos < 35) station = 'قیطریه'
      else if (pos >= 35 && pos < 50) station = 'میرداماد'
      else if (pos >= 50 && pos < 68) station = 'شهید حقانی'
      else if (pos >= 68 && pos < 85) station = 'دکتر شریعتی'
      else if (pos >= 85) station = 'گل‌حکیم'

      // Check if there is an active TSR on this station
      const matchingTsr = tsrs.find((tsr) => {
        const secLower = tsr.section.toLowerCase()
        const stLower = station.toLowerCase()
        if (secLower.includes(stLower)) return true
        if (stLower === 'تجریش' && secLower.includes('104')) return true
        if (stLower === 'میرداماد' && secLower.includes('088')) return true
        return false
      })

      let status: 'ok' | 'warn' | 'error' = 'ok'
      let speedLimitInfo = ''
      if (matchingTsr) {
        status = matchingTsr.speedLimit <= 15 ? 'error' : 'warn'
        speedLimitInfo = `${matchingTsr.speedLimit} km/h (${matchingTsr.reason})`
      }

      return {
        id: t.id,
        station,
        status,
        position: `${pos.toFixed(1)}%`,
        speedLimitInfo,
      }
    })

    return NextResponse.json({ data: trains })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت قطارها: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
