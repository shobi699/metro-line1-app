'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarCheck, Download } from 'lucide-react'
import { dayjs, jdate } from '@/lib/dayjs'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'
import {
  useCalendarStore,
  calendarApi,
  MonthGrid,
  TodayPanel,
  DayDialog,
  InsightsPanel,
  IcsDialog,
  CalendarSettingsDialog,
  JALALI_MONTHS,
  type PersonalEventInput,
} from '@/features/calendar'

export default function CalendarPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const {
    jYear,
    jMonth,
    days,
    loading,
    error,
    selectedDate,
    nextMonth,
    prevMonth,
    goToToday,
    selectDay,
    loadMonth,
    loadInsights,
    addEvent,
    removeEvent,
    toggleTask,
    insights,
    insightsLoading,
    goToMonth,
  } = useCalendarStore()
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (accessToken) {
      loadMonth(accessToken)
      loadInsights(accessToken)
    }
  }, [accessToken, jYear, jMonth, loadMonth, loadInsights])

  const todayStr = dayjs().format('YYYY-MM-DD')
  const today = useMemo(() => days.find((d) => d.date === todayStr) ?? null, [days, todayStr])
  const upcomingDays = useMemo(
    () => days.filter((d) => d.date > todayStr),
    [days, todayStr],
  )
  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  )

  const monthEvents = useMemo(() => {
    const list: Array<any> = []
    days.forEach((day) => {
      day.events.forEach((ev) => {
        list.push({
          ...ev,
          date: day.date,
          jalali: day.jalali,
          weekday: day.weekday,
        })
      })
    })
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [days])
  const monthTrips = useMemo(() => {
    const list: Array<any> = []
    days.forEach((day) => {
      if (day.trips) {
        day.trips.forEach((trip) => {
          list.push({
            ...trip,
            date: day.date,
            jalali: day.jalali,
          })
        })
      }
    })
    return list.sort((a, b) => a.date.localeCompare(b.date) || (a.departureTime || '').localeCompare(b.departureTime || ''))
  }, [days])
  async function handleAddEvent(input: PersonalEventInput) {
    if (!accessToken) return
    await addEvent(accessToken, input)
  }

  async function handleDeleteEvent(id: string) {
    if (!accessToken) return
    await removeEvent(accessToken, id)
  }

  function handleToggleTask(id: string, isDone: boolean) {
    if (!accessToken) return
    toggleTask(accessToken, id, isDone)
  }

  async function handleExport() {
    if (!accessToken) return
    setExporting(true)
    try {
      const blob = await calendarApi.downloadMonthExcel(accessToken, jYear, jMonth)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calendar-${jYear}-${String(jMonth).padStart(2, '0')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  function handleSelectBridge(fromDate: string) {
    const j = jdate(dayjs(fromDate).toDate())
    goToMonth(j.year(), j.month() + 1)
    selectDay(fromDate)
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-foreground">
            {JALALI_MONTHS[jMonth - 1]} {toFa(jYear)}
          </h1>
          <p className="text-xs text-foreground-muted">تقویم زندگی شیفت‌محور</p>
        </div>
        <div className="flex items-center gap-1.5">
          {accessToken && <IcsDialog accessToken={accessToken} />}
          <CalendarSettingsDialog />
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? 'در حال آماده‌سازی…' : 'اکسل ماه'}
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarCheck className="size-4" />
            امروز
          </Button>
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="ماه قبل">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="ماه بعد">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
        >
          <span>تقویم به‌روز نشد — {error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => accessToken && loadMonth(accessToken)}
          >
            تلاش دوباره
          </Button>
        </div>
      )}

      <InsightsPanel
        insights={insights}
        loading={insightsLoading}
        onSelectBridge={handleSelectBridge}
      />

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="calendar">تقویم شیفت کاری</TabsTrigger>
          <TabsTrigger value="report">گزارش کارکرد آنلاین</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <MonthGrid
              days={days}
              loading={loading}
              todayStr={todayStr}
              selectedDate={selectedDate}
              onSelectDay={selectDay}
            />
            <div className="order-first lg:order-none">
              <TodayPanel
                today={today}
                upcomingDays={upcomingDays}
                loading={loading}
                onToggleTask={handleToggleTask}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">گزارش آنلاین کارکرد و فعالیت‌ها</h2>
              <p className="text-xs text-foreground-muted">خلاصه تمام رویدادها، اضافه کارها، مرخصی‌ها و تراکنش‌های ثبت شده در این ماه</p>
            </div>

            {monthEvents.length === 0 && monthTrips.length === 0 ? (
              <div className="py-12 text-center text-sm text-foreground-muted border border-dashed rounded-lg">
                هیچ کارکرد، اعزام یا رویداد شخصی برای این ماه ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-6">
                {/* 🚇 اعزام‌های لوحه کاری */}
                {monthTrips.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                      <span>🚇</span> اعزام‌های ثبت شده در لوحه کاری
                    </h3>
                    <div className="overflow-x-auto border border-border-subtle rounded-lg">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                          <tr>
                            <th className="p-2.5 font-medium">تاریخ</th>
                            <th className="p-2.5 font-medium">شماره قطار</th>
                            <th className="p-2.5 font-medium">مسیر حرکت</th>
                            <th className="p-2.5 font-medium">ساعت حرکت / ورود</th>
                            <th className="p-2.5 font-medium">نقش</th>
                            <th className="p-2.5 font-medium">توضیحات عملیاتی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                          {monthTrips.map((t) => {
                            const origin = t.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
                            const dest = t.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
                            return (
                              <tr key={t.id} className="hover:bg-surface-hover/30">
                                <td className="p-2.5 whitespace-nowrap">{toFa(t.jalali)}</td>
                                <td className="p-2.5 font-bold">قطار {toFa(t.trainNumber || t.rowNo)}</td>
                                <td className="p-2.5">{origin} ← {dest}</td>
                                <td className="p-2.5" dir="ltr">{toFa(t.departureTime)} تا {toFa(t.arrivalTime)}</td>
                                <td className="p-2.5"><span className="text-accent font-semibold">{t.myRole || '-'}</span></td>
                                <td className="p-2.5 text-foreground-muted">{t.operationalNote || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ⏱️ اضافه کارها */}
                {(() => {
                  const overtimes = monthEvents.filter((e) => e.type === 'overtime' || e.type === 'work_log')
                  if (overtimes.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                        <span>⏱️</span> اضافه کار و کارکردها
                      </h3>
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                            <tr>
                              <th className="p-2.5 font-medium">تاریخ</th>
                              <th className="p-2.5 font-medium">عنوان</th>
                              <th className="p-2.5 font-medium">مدت</th>
                              <th className="p-2.5 font-medium">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                            {overtimes.map((e) => (
                              <tr key={e.id} className="hover:bg-surface-hover/30">
                                <td className="p-2.5 whitespace-nowrap">{toFa(e.jalali)}</td>
                                <td className="p-2.5 font-semibold">{e.title}</td>
                                <td className="p-2.5 text-info font-bold" dir="ltr">{toFa((e.metadata as any)?.hours || 0)} ساعت</td>
                                <td className="p-2.5 text-foreground-muted">{e.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* 🌴 مرخصی‌ها */}
                {(() => {
                  const leaves = monthEvents.filter((e) => ['leave_sick', 'leave_daily', 'leave_hourly'].includes(e.type))
                  if (leaves.length === 0) return null
                  const typeLabel = (t: string) => t === 'leave_sick' ? 'استعلاجی' : t === 'leave_daily' ? 'روزانه' : 'ساعتی'
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                        <span>🌴</span> مرخصی‌های ثبت شده
                      </h3>
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                            <tr>
                              <th className="p-2.5 font-medium">تاریخ</th>
                              <th className="p-2.5 font-medium">عنوان</th>
                              <th className="p-2.5 font-medium">نوع مرخصی</th>
                              <th className="p-2.5 font-medium">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                            {leaves.map((e) => (
                              <tr key={e.id} className="hover:bg-surface-hover/30">
                                <td className="p-2.5 whitespace-nowrap">{toFa(e.jalali)}</td>
                                <td className="p-2.5 font-semibold">{e.title}</td>
                                <td className="p-2.5 text-green-500 font-medium">{typeLabel(e.type)}</td>
                                <td className="p-2.5 text-foreground-muted">{e.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* 💰 تراکنش‌های مالی */}
                {(() => {
                  const financials = monthEvents.filter((e) => e.type === 'financial')
                  if (financials.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                        <span>💰</span> تراکنش‌های مالی (درآمد و هزینه)
                      </h3>
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                            <tr>
                              <th className="p-2.5 font-medium">تاریخ</th>
                              <th className="p-2.5 font-medium">عنوان</th>
                              <th className="p-2.5 font-medium">نوع تراکنش</th>
                              <th className="p-2.5 font-medium">مبلغ</th>
                              <th className="p-2.5 font-medium">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                            {financials.map((e) => {
                              const isInc = (e.metadata as any)?.isIncome !== false
                              return (
                                <tr key={e.id} className="hover:bg-surface-hover/30">
                                  <td className="p-2.5 whitespace-nowrap">{toFa(e.jalali)}</td>
                                  <td className="p-2.5 font-semibold">{e.title}</td>
                                  <td className="p-2.5">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-bold",
                                      isInc ? "bg-success/15 text-success" : "bg-critical/15 text-critical"
                                    )}>
                                      {isInc ? 'دریافتی / درآمد' : 'پرداختی / هزینه'}
                                    </span>
                                  </td>
                                  <td className={cn("p-2.5 font-bold font-data-mono", isInc ? "text-success" : "text-critical")} dir="ltr">
                                    {isInc ? '+' : '−'} {toFa(Number((e.metadata as any)?.amount || 0).toLocaleString())} تومان
                                  </td>
                                  <td className="p-2.5 text-foreground-muted">{e.description || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* 📞 کشیک‌ها */}
                {(() => {
                  const onCalls = monthEvents.filter((e) => e.type === 'on_call')
                  if (onCalls.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                        <span>📞</span> کشیک و آن‌کال
                      </h3>
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                            <tr>
                              <th className="p-2.5 font-medium">تاریخ</th>
                              <th className="p-2.5 font-medium">عنوان</th>
                              <th className="p-2.5 font-medium">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                            {onCalls.map((e) => (
                              <tr key={e.id} className="hover:bg-surface-hover/30">
                                <td className="p-2.5 whitespace-nowrap">{toFa(e.jalali)}</td>
                                <td className="p-2.5 font-semibold">{e.title}</td>
                                <td className="p-2.5 text-foreground-muted">{e.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* 📝 یادداشت‌ها و کارها */}
                {(() => {
                  const others = monthEvents.filter((e) => ['note', 'task', 'event', 'reminder', 'other'].includes(e.type))
                  if (others.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-accent flex items-center gap-1.5">
                        <span>📝</span> یادداشت‌ها، کارها و رویدادهای شخصی
                      </h3>
                      <div className="overflow-x-auto border border-border-subtle rounded-lg">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead className="bg-surface-variant text-foreground-muted border-b border-border-subtle">
                            <tr>
                              <th className="p-2.5 font-medium">تاریخ</th>
                              <th className="p-2.5 font-medium">عنوان</th>
                              <th className="p-2.5 font-medium">نوع</th>
                              <th className="p-2.5 font-medium">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/55 bg-background/25">
                            {others.map((e) => {
                              const typeLabel = e.type === 'note' ? 'یادداشت' : e.type === 'task' ? 'کار' : e.type === 'reminder' ? 'یادآور' : 'رویداد شخصی'
                              return (
                                <tr key={e.id} className="hover:bg-surface-hover/30">
                                  <td className="p-2.5 whitespace-nowrap">{toFa(e.jalali)}</td>
                                  <td className={cn("p-2.5 font-semibold", e.type === 'task' && e.isDone && 'line-through text-foreground-muted')}>{e.title}</td>
                                  <td className="p-2.5 text-foreground-muted">{typeLabel}</td>
                                  <td className="p-2.5 text-foreground-muted">{e.description || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <DayDialog
        day={selectedDay}
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) selectDay(null)
        }}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
        onToggleTask={handleToggleTask}
      />
    </div>
  )
}
