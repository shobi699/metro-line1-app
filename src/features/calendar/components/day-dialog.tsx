'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, TriangleAlert, ArrowLeftRight } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { jdate, dayjs } from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/features/auth'
import { calendarApi } from '../api-client'
import { SHIFT_META, type CalendarDay, type PersonalEventInput } from '../types'

interface DayDialogProps {
  day: CalendarDay | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEvent: (input: PersonalEventInput) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
  onToggleTask: (id: string, isDone: boolean) => void
}

type QuickAddType = 'event' | 'task' | 'financial' | 'work_log' | 'on_call' | 'overtime' | 'leave_sick' | 'leave_daily' | 'leave_hourly' | 'note' | 'other' | 'reminder'

const STATUS_MENU = [
  { key: 'on_call', label: 'کشیک', color: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-sm' },
  { key: 'overtime', label: 'اضافه کار', color: 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600 shadow-sm' },
  { key: 'leave_sick', label: 'مرخصی استعلاجی', color: 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' },
  { key: 'leave_daily', label: 'مرخصی روزانه', color: 'bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-sm' },
  { key: 'note', label: 'یادداشت', color: 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-sm' },
  { key: 'leave_hourly', label: 'مرخصی ساعتی', color: 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm' },
  { key: 'other', label: 'سایر کارکرد', color: 'bg-red-700 text-white border-red-800 hover:bg-red-800 shadow-sm' },
  { key: 'reminder', label: 'یادآور', color: 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-sm' },
] as const
export function DayDialog({
  day,
  open,
  onOpenChange,
  onAddEvent,
  onDeleteEvent,
  onToggleTask,
}: DayDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [addType, setAddType] = useState<QuickAddType>('event')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [hours, setHours] = useState<string>('')
  const [isIncome, setIsIncome] = useState<boolean>(true)
  const [publicConfig, setPublicConfig] = useState<any>(null)
  const [quickAddDefaults, setQuickAddDefaults] = useState<Record<string, any>>({})
  const accessToken = useAuthStore(s => s.accessToken)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/calendar/config/public')
        if (res.ok) {
          const json = await res.json()
          setPublicConfig(json.data)
        }
      } catch (e) {
        // silent
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (accessToken && open) {
      calendarApi.getPreferences(accessToken)
        .then((res: any) => {
          if (res.quickAddDefaults) {
            setQuickAddDefaults(res.quickAddDefaults)
          }
        })
        .catch(() => {})
    }
  }, [accessToken, open])

  function handleSelectType(typeKey: QuickAddType) {
    setAddType(typeKey)
    setDescription('')
    const raw = quickAddDefaults[typeKey]
    if (raw && !Array.isArray(raw)) {
      setTitle(raw.title || '')
      setHours(raw.hours || '')
      setAmount(raw.amount || '')
      setIsIncome(raw.isIncome !== false)
    } else {
      setTitle('')
      setHours('')
      setAmount('')
      setIsIncome(true)
    }
  }

  // Calculate daily net balance for financial summary (user requested sum/diff calculations)
  const netBalance = useState<number | null>(null)[0] // stub or let's use actual useMemo!
  
  const calculatedNetBalance = day ? (() => {
    let balance = 0
    let hasFinancial = false
    day.events.forEach((e) => {
      if (e.type === 'financial' && e.metadata?.amount) {
        hasFinancial = true
        const metaObj = e.metadata as any
        const isInc = metaObj.isIncome !== false
        if (isInc) {
          balance += Number(metaObj.amount)
        } else {
          balance -= Number(metaObj.amount)
        }
      }
    })
    return hasFinancial ? balance : null
  })() : null

  if (!day) return null

  const meta = day.shift ? SHIFT_META[day.shift.code] : null
  const jalaliLabel = toFa(jdate(day.date).format('dddd D MMMM YYYY'))
  const gregorianLabel = dayjs(day.date).locale('en').format('D MMM YYYY')

  async function submitQuickAdd() {
    if (!day || title.trim().length === 0) return
    setSaving(true)
    setFormError(null)
    try {
      await onAddEvent({
        type: addType,
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: `${day.date}T00:00:00.000Z`,
        allDay: true,
        metadata:
          addType === 'financial'
            ? { amount: Number(amount) || 0, isIncome }
            : (addType === 'work_log' || addType === 'leave_hourly' || addType === 'overtime')
            ? { hours: Number(hours) || 0 }
            : undefined,
      })
      setTitle('')
      setDescription('')
      setAmount('')
      setHours('')
      setIsIncome(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'ثبت انجام نشد — دوباره تلاش کنید')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{jalaliLabel}</DialogTitle>
          <DialogDescription>
            <bdi dir="ltr">{gregorianLabel}</bdi>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {meta && day.shift ? (
            <div className={cn('rounded-lg border p-3', meta.chipClass)}>
              <div className="flex items-center gap-2 font-semibold">
                <span aria-hidden>{meta.icon}</span>
                <span>شیفت {meta.label}</span>
              </div>
              {day.shift.startTime && (
                <div className="mt-1 font-data-mono text-sm" dir="ltr">
                  {toFa(day.shift.startTime)}–{toFa(day.shift.endTime)}
                </div>
              )}
              {day.shift.forecast && (
                <div className="mt-1 text-xs opacity-80">پیش‌بینی سیکل — لوحه هنوز منتشر نشده</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border-subtle p-3 text-sm text-foreground-muted">
              شیفتی ثبت نشده است
            </div>
          )}

          {day.holidays.length > 0 && (
            <div
              className={cn(
                'rounded-lg border p-3 text-sm font-medium',
                day.holidays.some((h) => h.isOffDay)
                  ? 'border-critical/30 bg-critical/5 text-critical'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-500',
              )}
            >
              {day.holidays.map((h) => h.title).join('، ')}
            </div>
          )}

          {day.orgEvents.length > 0 && (
            <ul className="space-y-1.5">
              {day.orgEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="text-evt-org" aria-hidden>
                    ◆
                  </span>
                  <span className="truncate">{e.title}</span>
                  {e.mandatory && (
                    <span className="rounded bg-critical/10 px-1.5 py-0.5 text-[10px] text-critical">
                      الزامی
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {(day.meetings ?? []).length > 0 && (
            <ul className="space-y-2">
              <h3 className="text-sm font-medium text-sky-500">جلسات</h3>
              {(day.meetings ?? []).map((m) => {
                const statusText = m.status === 'approved' ? 'تایید شده' : m.status === 'pending' ? 'در انتظار' : m.status
                return (
                  <li key={m.id} className="flex flex-col gap-1 rounded bg-sky-500/10 p-2 text-sm border border-sky-500/20">
                    <div className="flex items-center gap-2 font-medium text-sky-500">
                      <span aria-hidden>👥</span>
                      <span>{m.title}</span>
                    </div>
                    <div className="flex justify-between text-xs text-foreground-muted">
                      <span>{m.role === 'host' ? 'شما میزبان هستید' : 'شما درخواست دادید'}</span>
                      <span>{statusText}</span>
                    </div>
                    <div className="font-data-mono text-xs text-foreground" dir="ltr">
                      {toFa(dayjs(m.startAt).format('HH:mm'))}
                      {m.endAt ? ` - ${toFa(dayjs(m.endAt).format('HH:mm'))}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {day.trips && day.trips.length > 0 && (
            <div className="space-y-2 border-t border-border/40 pt-3">
              <h3 className="text-sm font-medium text-foreground-muted flex items-center gap-1.5">
                <span>🚇</span> اعزام‌های لوحه کاری امروز
              </h3>
              <div className="grid gap-2">
                {day.trips.slice(0, 4).map((trip: any) => {
                  const isAcknowledged = !!trip.acknowledgedAt
                  const isReady = !!trip.readyAt
                  const isHandover = !!trip.handoverAt
                  const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
                  const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
                  return (
                    <div key={trip.id} className="flex flex-col gap-1.5 rounded-lg border border-border-subtle p-2.5 bg-surface-variant/20">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-xs">
                          قطار {toFa(trip.trainNumber || trip.rowNo)} (نوبت {toFa(trip.rowNo)})
                        </span>
                        {trip.myRole && (
                          <span className="bg-info/10 text-info text-[9px] font-bold px-1.5 py-0.5 rounded">
                            نقش: {trip.myRole}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-foreground-muted">
                        <span>{origin} ➔ {dest}</span>
                        <span dir="ltr" className="font-data-mono">{toFa(trip.departureTime)} - {toFa(trip.arrivalTime)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] border-t border-border-subtle/40 pt-1.5 mt-0.5">
                        <span className="text-foreground-muted">وضعیت اعزام:</span>
                        <span className={cn(
                          "font-bold",
                          isHandover ? "text-success" :
                          isReady ? "text-warning" :
                          isAcknowledged ? "text-info" :
                          "text-critical"
                        )}>
                          {isHandover ? "تحویل شده" :
                           isReady ? "کابین فعال" :
                           isAcknowledged ? "رویت شده" :
                           "در انتظار رویت"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link
                href={`/roster/my-day?date=${day.jalali.replace(/\//g, '-')}`}
                className="block text-center text-xs font-semibold text-accent hover:underline pt-1.5"
              >
                تایید اعزام‌ها و ثبت حضور در برنامه روزانه من ➔
              </Link>
            </div>
          )}

          <div className="space-y-1.5 border-t border-border/40 pt-3">
            <h3 className="text-sm font-medium text-foreground-muted">رویدادها و کارها</h3>
            {day.events.length === 0 ? (
              <p className="text-sm text-foreground-muted">روز آزاد شماست ✨ رویدادی اضافه کنید.</p>
            ) : (
              <div className="space-y-2">
                {calculatedNetBalance !== null && (
                  <div className={cn(
                    "rounded-lg border p-2.5 flex justify-between items-center text-xs font-bold shrink-0",
                    calculatedNetBalance >= 0 
                      ? "bg-success/10 border-success/20 text-success" 
                      : "bg-critical/10 border-critical/20 text-critical"
                  )}>
                    <span>تراز مالی امروز (جمع و تفریق):</span>
                    <span dir="ltr">
                      {calculatedNetBalance >= 0 ? '+' : '−'} {toFa(Math.abs(calculatedNetBalance).toLocaleString())} تومان
                    </span>
                  </div>
                )}
                <ul className="space-y-2">
                  {day.events.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-border-subtle p-2.5 text-right bg-surface/30 hover:bg-surface/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {e.type === 'task' ? (
                          <input
                            type="checkbox"
                            checked={e.isDone}
                            onChange={(ev) => onToggleTask(e.id, ev.target.checked)}
                            aria-label={`انجام شد: ${e.title}`}
                            className="size-4 accent-[var(--evt-task)] cursor-pointer"
                          />
                        ) : e.type === 'financial' ? (
                          <span aria-hidden>💰</span>
                        ) : e.type === 'work_log' ? (
                          <span aria-hidden>⏱️</span>
                        ) : (
                          <span
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              e.type === 'birthday' ? 'bg-shift-evening' : 
                              e.type === 'leave_sick' || e.type === 'leave_daily' || e.type === 'leave_hourly' ? 'bg-green-500' :
                              e.type === 'overtime' ? 'bg-purple-500' :
                              e.type === 'on_call' ? 'bg-blue-500' :
                              e.type === 'reminder' || e.type === 'other' ? 'bg-red-500' :
                              'bg-evt-personal',
                            )}
                            aria-hidden
                          />
                        )}
                        <span
                          className={cn(
                            'flex-1 font-bold text-sm truncate',
                            e.type === 'task' && e.isDone && 'text-foreground-muted line-through',
                          )}
                        >
                          {e.title}
                        </span>

                        {e.type === 'financial' && e.metadata?.amount && (
                          <span className={cn(
                            'font-data-mono font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0',
                            (e.metadata as any).isIncome !== false ? 'text-success bg-success/15' : 'text-critical bg-critical/15'
                          )} dir="ltr">
                            {(e.metadata as any).isIncome !== false ? '+' : '−'} {toFa(Number((e.metadata as any).amount).toLocaleString())} تومان
                          </span>
                        )}

                        {(e.type === 'work_log' || e.type === 'overtime' || e.type === 'leave_hourly') && e.metadata?.hours && (
                          <span className="font-data-mono font-bold text-[11px] bg-info/10 text-info px-2 py-0.5 rounded-full shrink-0" dir="ltr">
                            {toFa(e.metadata.hours)} ساعت
                          </span>
                        )}

                        {!e.occurrence && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`حذف ${e.title}`}
                            onClick={() => onDeleteEvent(e.id)}
                            className="h-6 w-6 text-foreground-muted hover:text-critical"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>

                      {e.description && (
                        <p className="text-xs text-foreground-muted bg-background/40 p-2 rounded border border-border-subtle leading-relaxed whitespace-pre-wrap mr-6">
                          {e.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border-subtle pt-3">
            {meta && day.shift && day.shift.code !== 'off' && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <TriangleAlert className="size-3.5 shrink-0 text-warning" aria-hidden />
                  <span>
                    این روز شیفت {meta.label} هستید
                    {day.shift.startTime
                      ? ` (${toFa(day.shift.startTime)}–${toFa(day.shift.endTime)})`
                      : ''}
                  </span>
                </span>
                <Link
                  href="/swap/inbox"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 transition-colors hover:bg-surface-hover"
                >
                  <ArrowLeftRight className="size-3" aria-hidden />
                  درخواست تعویض
                </Link>
              </div>
            )}
            <div className="pt-2">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <span aria-hidden>📋</span>
                منوی ثبت وضعیت روز
              </h3>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع مورد جدید">
                {STATUS_MENU.filter(t => {
                  const rules = publicConfig?.dayStatusRules
                  if (!rules) return true
                  return rules[t.key]?.enabled !== false
                }).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="radio"
                    aria-checked={addType === t.key}
                    onClick={() => handleSelectType(t.key as QuickAddType)}
                    className={cn(
                      'min-h-[44px] rounded-md border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      t.color,
                      addType === t.key ? 'ring-2 ring-offset-2 ring-foreground/20 scale-[0.98]' : 'hover:scale-[1.02] opacity-90 hover:opacity-100',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle mt-4" role="radiogroup" aria-label="سایر موارد">
              {(
                [
                  { key: 'event', label: 'رویداد', activeColor: 'border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' },
                  { key: 'task', label: 'کار', activeColor: 'border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
                  { key: 'work_log', label: 'گزارش کار', activeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' },
                  { key: 'financial', label: 'مالی', activeColor: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={addType === t.key}
                  onClick={() => handleSelectType(t.key as QuickAddType)}
                  className={cn(
                    'min-h-8 rounded-full border px-4 text-xs font-medium transition-all duration-200',
                    addType === t.key
                      ? t.activeColor
                      : 'border-border/40 text-foreground-muted hover:bg-surface-hover hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Preset chips for quick selection */}
            {Array.isArray(quickAddDefaults[addType]) && quickAddDefaults[addType].length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5 pb-2">
                {quickAddDefaults[addType].map((preset: any) => (
                  <button
                    key={preset.id || preset.title}
                    type="button"
                    onClick={() => {
                      setTitle(preset.title || '')
                      setHours(preset.hours || '')
                      setAmount(preset.amount || '')
                      if (preset.amount) {
                        setIsIncome(preset.isIncome !== false)
                      }
                    }}
                    className="text-[10px] bg-accent/10 hover:bg-accent/20 text-accent font-bold px-2.5 py-1 rounded-full border border-accent/25 transition-colors cursor-pointer"
                  >
                    {preset.title}
                    {preset.hours ? ` (${toFa(preset.hours)}س)` : ''}
                    {preset.amount ? ` (${toFa(Number(preset.amount).toLocaleString())}ت)` : ''}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2 flex-wrap sm:flex-nowrap">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitQuickAdd()
                    }}
                    placeholder={
                      addType === 'task'
                        ? 'کار جدید…'
                        : addType === 'financial'
                        ? 'عنوان تراکنش…'
                        : addType === 'work_log'
                        ? 'عنوان فعالیت…'
                        : 'رویداد جدید…'
                    }
                    aria-label="عنوان مورد جدید"
                    className="h-9 flex-1 rounded-lg border-border/40 bg-surface focus-visible:ring-1"
                  />
                  {addType === 'financial' && (
                    <>
                      <Input
                        type="number"
                        placeholder="مبلغ (تومان)..."
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        dir="ltr"
                        className="h-9 w-28 text-right rounded-lg border-border/40 bg-surface focus-visible:ring-1"
                      />
                      <div className="flex bg-background/50 rounded-lg p-0.5 border border-border/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsIncome(true)}
                          className={cn(
                            "px-2.5 h-8 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                            isIncome ? "bg-success text-white shadow-sm" : "text-foreground-muted"
                          )}
                        >
                          درآمد
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsIncome(false)}
                          className={cn(
                            "px-2.5 h-8 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                            !isIncome ? "bg-critical text-white shadow-sm" : "text-foreground-muted"
                          )}
                        >
                          هزینه
                        </button>
                      </div>
                    </>
                  )}
                  {(addType === 'work_log' || addType === 'leave_hourly' || addType === 'overtime') && (
                    <Input
                      type="number"
                      placeholder="ساعت..."
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      dir="ltr"
                      step="0.25"
                      className="h-9 w-20 text-right rounded-lg border-border/40 bg-surface focus-visible:ring-1"
                    />
                  )}
                </div>
                <Button 
                  onClick={submitQuickAdd} 
                  disabled={saving || title.trim().length === 0} 
                  className="h-9 rounded-lg px-5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-100 border border-zinc-800/50 transition-colors shrink-0"
                  variant="secondary"
                >
                  {saving ? '…' : 'افزودن'}
                </Button>
              </div>

              {/* Textarea for optional description */}
              <div className="w-full">
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات اختیاری (علت، جزئیات فعالیت، یادداشت روزانه...)"
                  className="h-9 w-full rounded-lg border-border/40 bg-surface focus-visible:ring-1 text-xs"
                />
              </div>

              {formError && <p className="text-xs text-critical mt-1">{formError}</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


