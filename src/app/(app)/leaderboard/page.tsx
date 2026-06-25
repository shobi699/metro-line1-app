'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toFa, jalali } from '@/lib/fa'
import { Trophy, Medal, Crown, Award, TrendingUp, User, Star, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopEntry {
  rank: number
  employeeId: string
  name: string
  avatar: string
  dept: string
  score: number
}

interface MyRank {
  rank: number | null
  percentile: number
  score: number
  totalCount: number
}

interface LeaderboardData {
  topFive: TopEntry[]
  myPrivateRank: MyRank
}

// Calculate current Jalali period
function getCurrentJalaliPeriod(): string {
  const d = new Date()
  const gy = d.getFullYear()
  const gm = d.getMonth() + 1
  const gd = d.getDate()
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  return `${jy}-${String(jm).padStart(2, '0')}`
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

function formatPeriod(periodId: string): string {
  const [year, month] = periodId.split('-')
  return `${JALALI_MONTHS[parseInt(month) - 1]} ${year}`
}

export default function LeaderboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.id)

  const currentPeriod = useMemo(() => getCurrentJalaliPeriod(), [])
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod)
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Generate last 6 months for selector
  const periodsList = useMemo(() => {
    const [y, m] = currentPeriod.split('-').map(Number)
    const list: string[] = []
    for (let i = 0; i < 6; i++) {
      let month = m - i
      let year = y
      if (month <= 0) { month += 12; year -= 1 }
      list.push(`${year}-${String(month).padStart(2, '0')}`)
    }
    return list
  }, [currentPeriod])

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    setError('')
    fetch(`/api/performance/leaderboard?periodId=${selectedPeriod}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data)
        else setError(json.error ?? 'خطا در دریافت داده')
      })
      .catch(() => setError('خطای شبکه'))
      .finally(() => setLoading(false))
  }, [accessToken, selectedPeriod])

  const podiumOrder = [1, 0, 2] // silver, gold, bronze
  const podiumConfig = [
    {
      icon: Medal,
      ringColor: 'ring-neutral-400/30',
      bgIcon: 'bg-neutral-200/20 dark:bg-neutral-700/30',
      textColor: 'text-neutral-400',
      label: '🥈',
    },
    {
      icon: Crown,
      ringColor: 'ring-warning/40',
      bgIcon: 'bg-warning/10',
      textColor: 'text-warning',
      label: '🥇',
      isBig: true,
    },
    {
      icon: Award,
      ringColor: 'ring-orange-400/30',
      bgIcon: 'bg-orange-400/10',
      textColor: 'text-orange-400',
      label: '🥉',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-2xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="size-6 text-warning" />
            جدول پرسنل برتر
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            رتبه‌بندی بر اساس کارنامه ارزیابی عملکرد
          </p>
        </div>

        {/* Period Dropdown */}
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none h-9 rounded-lg border border-outline-variant bg-surface-container px-3 pe-8 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none cursor-pointer"
          >
            {periodsList.map((p) => (
              <option key={p} value={p}>{formatPeriod(p)}</option>
            ))}
          </select>
          <ChevronDown className="absolute inset-y-0 end-2 my-auto size-4 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 h-36">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface-container-low border border-border" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-container-low border border-border" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <Trophy className="size-10 text-foreground-muted/40" />
            <p className="text-sm text-foreground-muted">{error}</p>
          </CardContent>
        </Card>
      ) : !data || data.topFive.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <Trophy className="size-10 text-foreground-muted/40" />
            <p className="text-sm text-foreground-muted">
              داده‌ای برای دوره <strong>{formatPeriod(selectedPeriod)}</strong> ثبت نشده است
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* My Rank Card (private) */}
          {data.myPrivateRank && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-lg">
                {data.myPrivateRank.rank ? toFa(data.myPrivateRank.rank) : '–'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground-muted">رتبه شما در این دوره</p>
                <p className="text-sm font-semibold text-foreground">
                  امتیاز: <span className="text-accent">{toFa(Math.round(data.myPrivateRank.score))}</span>
                  {' '}از {toFa(data.myPrivateRank.totalCount)} نفر
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs text-foreground-muted">صدک</p>
                <p className="text-sm font-bold text-success">
                  {toFa(Math.round(data.myPrivateRank.percentile))}%
                </p>
              </div>
            </div>
          )}

          {/* Podium - top 3 */}
          {data.topFive.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 items-end">
              {podiumOrder.map((rank, col) => {
                const entry = data.topFive[rank]
                if (!entry) return <div key={col} />
                const cfg = podiumConfig[col]
                const Icon = cfg.icon
                const isMe = entry.employeeId === userId
                return (
                  <Card
                    key={entry.employeeId}
                    className={cn(
                      'relative overflow-hidden transition-all',
                      cfg.isBig ? 'ring-2' : 'ring-1',
                      cfg.ringColor,
                      isMe && 'ring-2 ring-accent/50',
                    )}
                  >
                    <CardContent className={cn('flex flex-col items-center gap-2 p-3 text-center', cfg.isBig ? 'pt-8 pb-5' : 'pt-5 pb-4')}>
                      {/* Medal emoji */}
                      <span className="text-xl leading-none">{cfg.label}</span>
                      {/* Avatar circle */}
                      <div className={cn('flex size-10 items-center justify-center rounded-full', cfg.bgIcon)}>
                        <Icon className={cn('size-5', cfg.textColor)} />
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-semibold text-foreground truncate leading-tight">{entry.name}</p>
                        {entry.dept && (
                          <p className="text-[10px] text-foreground-muted truncate mt-0.5">{entry.dept}</p>
                        )}
                        <p className={cn('text-sm font-bold mt-1', cfg.textColor)}>
                          {toFa(Math.round(entry.score))}
                        </p>
                      </div>
                      {isMe && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-accent/40 text-accent">
                          شما
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Ranks 4-5 and beyond */}
          {data.topFive.slice(3).map((entry) => {
            const isMe = entry.employeeId === userId
            return (
              <Card key={entry.employeeId} className={cn('transition-all', isMe && 'ring-1 ring-accent/30 bg-accent/5')}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-foreground-muted">
                    {toFa(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                      {entry.name}
                      {isMe && <Badge variant="outline" className="text-[9px] px-1 py-0 border-accent/40 text-accent">شما</Badge>}
                    </div>
                    {entry.dept && (
                      <div className="text-[11px] text-foreground-muted truncate">{entry.dept}</div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-foreground-muted shrink-0">
                    {toFa(Math.round(entry.score))}
                    <span className="text-[10px] font-normal text-foreground-muted/60 ms-1">pt</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Note */}
          <p className="text-center text-[11px] text-foreground-muted/70 pt-2">
            * رتبه‌بندی نرمال‌سازی‌شده بر اساس امتیاز کارنامه ارزیابی عملکرد دوره {formatPeriod(selectedPeriod)}
          </p>
        </div>
      )}
    </div>
  )
}
