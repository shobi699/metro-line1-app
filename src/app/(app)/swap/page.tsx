'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toFa, jalali } from '@/lib/fa'
import { ArrowLeftRight, Send, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

interface UserOption {
  id: string
  name: string
  personnelCode: string
}

interface ShiftOption {
  id: string
  date: string
  code: string
}

interface RuleViolation {
  rule: string
  message: string
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت (OFF)',
}

export default function CreateSwapRequestPage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [myShifts, setMyShifts] = useState<ShiftOption[]>([])
  const [colleagues, setColleagues] = useState<UserOption[]>([])
  const [selectedColleagueId, setSelectedColleagueId] = useState('')
  const [colleagueShifts, setColleagueShifts] = useState<ShiftOption[]>([])

  const [selectedMyShiftId, setSelectedMyShiftId] = useState('')
  const [selectedColleagueShiftId, setSelectedColleagueShiftId] = useState('')
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetchingShifts, setFetchingShifts] = useState(false)
  const [error, setError] = useState('')
  const [violations, setViolations] = useState<RuleViolation[]>([])
  const [success, setSuccess] = useState(false)

  // Fetch my shifts & colleague list
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    async function loadInitialData() {
      try {
        const [myShiftsRes, usersRes] = await Promise.all([
          fetch('/api/shifts/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch('/api/users?pageSize=100', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        if (myShiftsRes.ok && usersRes.ok) {
          const myShiftsData = await myShiftsRes.json()
          const usersData = await usersRes.json()

          // Only keep shifts that are not 'off'
          setMyShifts(
            (myShiftsData.data || []).filter((s: ShiftOption) => s.code !== 'off')
          )

          // Filter out current user from colleague list
          setColleagues(
            (usersData.data?.users || []).filter(
              (u: UserOption) => u.id !== currentUser?.id
            )
          )
        }
      } catch {
        setError('خطا در بارگذاری اطلاعات اولیه')
      }
    }

    loadInitialData()
  }, [accessToken, currentUser?.id, isAuthenticated, router])

  // Fetch shifts for selected colleague
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedColleagueId) {
      setColleagueShifts([])
      return
    }

    async function loadColleagueShifts() {
      setFetchingShifts(true)
      setColleagueShifts([])
      try {
        // Fetch all shifts and filter by selected user
        const res = await fetch('/api/shifts', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          const filtered = (data.data || []).filter(
            (s: ShiftOption & { user: { id: string } }) => s.user.id === selectedColleagueId && s.code !== 'off'
          )
          setColleagueShifts(filtered)
        }
      } catch {
        setError('خطا در دریافت شیفت‌های همکار')
      } finally {
        setFetchingShifts(false)
      }
    }

    loadColleagueShifts()
  }, [selectedColleagueId, accessToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setViolations([])
    setSuccess(false)

    if (!selectedMyShiftId || !selectedColleagueId || !selectedColleagueShiftId) {
      setError('لطفاً تمامی فیلدهای الزامی را تکمیل کنید')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/swap-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetUserId: selectedColleagueId,
          sourceShiftId: selectedMyShiftId,
          targetShiftId: selectedColleagueShiftId,
          note: note || undefined,
        }),
      })

      const data = await res.json()

      if (res.status === 422) {
        setViolations(data.violations || [])
        setError('درخواست شما با قوانین شیفت مغایرت دارد')
        return
      }

      if (!res.ok) {
        setError(data.error || 'خطا در ثبت درخواست')
        return
      }

      setSuccess(true)
      setSelectedMyShiftId('')
      setSelectedColleagueId('')
      setSelectedColleagueShiftId('')
      setNote('')
    } catch {
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-xl mx-auto w-full" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <ArrowLeftRight className="size-5 text-accent" />
          درخواست جابجایی شیفت
        </h1>
        <Button variant="outline" size="sm" onClick={() => router.push('/swap/inbox')} className="cursor-pointer">
          صندوق درخواست‌ها
        </Button>
      </div>

      <Card className="w-full bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
        <CardHeader className="pb-3 border-b border-border-subtle/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Send className="size-4 text-accent" />
            ایجاد درخواست جدید
          </CardTitle>
          <CardDescription className="text-xs text-foreground-muted">
            شیفت مورد نظر خود را برای جابجایی با همکار انتخاب کنید. قوانین ایمنی استراحت به طور خودکار بررسی خواهند شد.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md bg-accent/10 border border-accent/20 p-3 text-xs text-accent flex items-start gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-success/10 border border-success/20 p-3 text-xs text-success flex items-start gap-2 animate-in fade-in duration-150">
                <CheckCircle className="size-4 shrink-0 mt-0.5" />
                <span>درخواست جابجایی شیفت با موفقیت ثبت شد و در انتظار تایید همکار است.</span>
              </div>
            )}

            {violations.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-accent animate-in fade-in duration-150">
                <span className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="size-3.5" />
                  موارد نقض قوانین شیفت سازمانی:
                </span>
                <ul className="list-inside list-disc space-y-0.5 pe-4 text-foreground-muted">
                  {violations.map((v, i) => (
                    <li key={i} className="text-[11px]">{v.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="myShift" className="text-xs font-semibold text-foreground">شیفت من *</Label>
              <select
                id="myShift"
                value={selectedMyShiftId}
                onChange={(e) => setSelectedMyShiftId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 cursor-pointer"
                required
              >
                <option value="">انتخاب شیفت من</option>
                {myShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {jalali(s.date)} — {SHIFT_LABELS[s.code]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="colleague" className="text-xs font-semibold text-foreground">انتخاب همکار *</Label>
              <select
                id="colleague"
                value={selectedColleagueId}
                onChange={(e) => setSelectedColleagueId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 cursor-pointer"
                required
              >
                <option value="">انتخاب همکار</option>
                {colleagues.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (کد پرسنلی: {toFa(c.personnelCode)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="colleagueShift" className="text-xs font-semibold text-foreground">شیفت همکار *</Label>
              <select
                id="colleagueShift"
                value={selectedColleagueShiftId}
                onChange={(e) => setSelectedColleagueShiftId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!selectedColleagueId || fetchingShifts}
                required
              >
                <option value="">
                  {fetchingShifts ? 'در حال بارگذاری شیفت‌ها...' : 'انتخاب شیفت همکار'}
                </option>
                {colleagueShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {jalali(s.date)} — {SHIFT_LABELS[s.code]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <FileText className="size-3.5 text-foreground-muted" />
                توضیحات (اختیاری)
              </Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-20 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 text-right resize-none"
                placeholder="علت جابجایی..."
                maxLength={500}
              />
            </div>

            <Button type="submit" className="w-full cursor-pointer mt-2" disabled={loading}>
              {loading ? 'در حال بررسی و ثبت...' : 'ثبت درخواست جابجایی'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

