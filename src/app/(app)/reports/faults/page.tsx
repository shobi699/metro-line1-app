'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ReportsFaultsPage() {
  const { accessToken } = useAuthStore()

  // KPI & General Dashboard
  const [kpiData, setKpiData] = useState<any>(null)
  const [loadingKpi, setLoadingKpi] = useState(true)

  // Report Tables
  const [persistentList, setPersistentList] = useState<any[]>([])
  const [loadingPersistent, setLoadingPersistent] = useState(false)

  const [recurrenceList, setRecurrenceList] = useState<any[]>([])
  const [loadingRecurrence, setLoadingRecurrence] = useState(false)

  const [agingList, setAgingList] = useState<any[]>([])
  const [loadingAging, setLoadingAging] = useState(false)

  // Pareto
  const [trainsList, setTrainsList] = useState<any[]>([])
  const [selectedParetoTrainId, setSelectedParetoTrainId] = useState<string>('all')
  const [paretoData, setParetoData] = useState<any>(null)
  const [loadingPareto, setLoadingPareto] = useState(false)

  useEffect(() => {
    loadKpis()
    loadTrains()
    loadPareto('all')
  }, [])

  async function loadKpis() {
    setLoadingKpi(true)
    try {
      const res = await fetch('/api/fault-reports/kpi', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setKpiData(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingKpi(false)
    }
  }

  async function loadTrains() {
    try {
      const res = await fetch('/api/fleet/trains', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrainsList(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadPersistent() {
    setLoadingPersistent(true)
    try {
      const res = await fetch('/api/fault-reports/persistent', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPersistentList(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPersistent(false)
    }
  }

  async function loadRecurrence() {
    setLoadingRecurrence(true)
    try {
      const res = await fetch('/api/fault-reports/recurrence', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setRecurrenceList(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRecurrence(false)
    }
  }

  async function loadAging() {
    setLoadingAging(true)
    try {
      const res = await fetch('/api/fault-reports/train-aging', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAgingList(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAging(false)
    }
  }

  async function loadPareto(trainId: string) {
    setLoadingPareto(true)
    try {
      const url = trainId && trainId !== 'all'
        ? `/api/fault-reports/matrix?trainId=${trainId}`
        : '/api/fault-reports/matrix'
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setParetoData(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPareto(false)
    }
  }

  function handleExcelExport(type: string) {
    window.open(`/api/fault-reports/export?type=${type}`, '_blank')
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            داشبورد گزارش‌ها و تحلیل فالت ناوگان
          </h1>
          <p className="text-sm text-foreground-muted">تحلیل آماری شاخص‌های MTTR، MTBF، فالت‌های تکراری، ماندگار و توزیع فراوانی خطاها</p>
        </div>
      </div>

      {/* KPI Section */}
      {loadingKpi || !kpiData ? (
        <div className="grid grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-surface shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-foreground-muted font-normal">کل فالت‌های باز جاری</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-400">{toFa(kpiData.stats.open)} فالت</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-foreground-muted font-normal">فالت‌های بحرانی باز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{toFa(kpiData.stats.criticalOpen)} فالت</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-foreground-muted font-normal">نقض تعهد زمانی (SLA) در ماه جاری</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{toFa(kpiData.stats.slaBreached)} مورد</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-surface shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-foreground-muted font-normal">شاخص MTTR کل (ماه جاری)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{toFa(kpiData.stats.mttrHours)} ساعت</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="kpi" className="w-full">
        <TabsList className="bg-surface border border-border p-1 rounded-xl mb-4 w-full justify-start flex gap-1">
          <TabsTrigger value="kpi" className="text-xs">خلاصه وضعیت و نمودارها</TabsTrigger>
          <TabsTrigger value="persistent" className="text-xs" onClick={loadPersistent}>فالت‌های ماندگار (Persistent)</TabsTrigger>
          <TabsTrigger value="recurrence" className="text-xs" onClick={loadRecurrence}>فالت‌های تکراری</TabsTrigger>
          <TabsTrigger value="aging" className="text-xs" onClick={loadAging}>شناسه عملکرد قطارها (MTTR/MTBF)</TabsTrigger>
          <TabsTrigger value="pareto" className="text-xs">تحلیل پارتو خرابی‌ها</TabsTrigger>
        </TabsList>

        {/* TAB 1: KPI & CHARTS */}
        <TabsContent value="kpi">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Top faulty trains */}
            <Card className="border border-border bg-surface">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">۵ قطار با بیشترین گزارش خرابی</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingKpi || !kpiData ? (
                  <div className="text-xs text-foreground-muted">بارگذاری...</div>
                ) : (
                  <div className="space-y-4">
                    {kpiData.topTrains.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-border pb-2">
                        <span className="font-bold text-foreground">قطار {toFa(item.trainNumber)}</span>
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20">
                          {toFa(item.count)} فالت ثبت شده
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top categories */}
            <Card className="border border-border bg-surface">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">۵ دسته‌بندی خرابی پر تکرار</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingKpi || !kpiData ? (
                  <div className="text-xs text-foreground-muted">بارگذاری...</div>
                ) : (
                  <div className="space-y-4">
                    {kpiData.topCategories.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-border pb-2">
                        <span className="font-bold text-foreground">{item.name}</span>
                        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {toFa(item.count)} فالت
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PERSISTENT FAULTS */}
        <TabsContent value="persistent">
          <Card className="border border-border bg-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-foreground">گزارش فالت‌های ماندگار (باقی‌مانده در سیستم بیش از حد مجاز)</CardTitle>
              <Button size="sm" onClick={() => handleExcelExport('persistent')} className="text-xs">
                خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPersistent ? (
                <div className="text-center py-10 text-xs text-foreground-muted animate-pulse">بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-right">شماره فالت</TableHead>
                      <TableHead className="text-right">قطار/واگن</TableHead>
                      <TableHead className="text-right">کد خطا</TableHead>
                      <TableHead className="text-right">شرح خرابی</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">تاریخ ثبت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persistentList.map((r) => (
                      <TableRow key={r.id} className="border-b border-border hover:bg-surface-hover">
                        <TableCell className="font-mono text-foreground font-bold">F-{r.faultNo}</TableCell>
                        <TableCell>قطار {toFa(r.train.trainNumber)} {r.wagon && `| واگن ${toFa(r.wagon.position)}`}</TableCell>
                        <TableCell className="font-mono text-xs">{r.faultCode.code}</TableCell>
                        <TableCell className="text-xs text-foreground-muted max-w-sm truncate">{r.description}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell className="text-xs">{jalali(r.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RECURRENCE */}
        <TabsContent value="recurrence">
          <Card className="border border-border bg-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-foreground">گزارش فالت‌های تکراری بر روی قطارهای واحد</CardTitle>
              <Button size="sm" onClick={() => handleExcelExport('recurrence')} className="text-xs">
                خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRecurrence ? (
                <div className="text-center py-10 text-xs text-foreground-muted animate-pulse">بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-right">قطار مربوطه</TableHead>
                      <TableHead className="text-right">کد خطا</TableHead>
                      <TableHead className="text-right">عنوان خطا</TableHead>
                      <TableHead className="text-right">دفعات تکرار فالت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurrenceList.map((r, idx) => (
                      <TableRow key={idx} className="border-b border-border hover:bg-surface-hover">
                        <TableCell className="font-bold">قطار {toFa(r.train.trainNumber)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.faultCode.code}</TableCell>
                        <TableCell className="text-xs">{r.faultCode.title}</TableCell>
                        <TableCell className="font-bold text-orange-400">{toFa(r.count)} بار وقوع در ۳۰ روز</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: AGING METRICS */}
        <TabsContent value="aging">
          <Card className="border border-border bg-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-foreground">تحلیل پیری ناوگان (شاخص‌های پایداری و نگهداری قطارها)</CardTitle>
              <Button size="sm" onClick={() => handleExcelExport('aging')} className="text-xs">
                خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAging ? (
                <div className="text-center py-10 text-xs text-foreground-muted animate-pulse">بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-right">شماره قطار</TableHead>
                      <TableHead className="text-right">سری ناوگان</TableHead>
                      <TableHead className="text-right">تعداد کل فالت‌ها</TableHead>
                      <TableHead className="text-right">فالت‌های باز جاری</TableHead>
                      <TableHead className="text-right">شاخص MTTR (ساعت)</TableHead>
                      <TableHead className="text-right">شاخص MTBF (ساعت)</TableHead>
                      <TableHead className="text-right">مجموع زمان خرابی (ساعت)</TableHead>
                      <TableHead className="text-right">نقض تعهد SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingList.map((t) => (
                      <TableRow key={t.trainId} className="border-b border-border hover:bg-surface-hover">
                        <TableCell className="font-bold">قطار {toFa(t.trainNumber)}</TableCell>
                        <TableCell>{t.fleetSeries}</TableCell>
                        <TableCell>{toFa(t.totalFaults)}</TableCell>
                        <TableCell className="text-amber-500 font-bold">{toFa(t.openFaultsCount)}</TableCell>
                        <TableCell>{toFa(t.mttrHours)}</TableCell>
                        <TableCell>{t.mtbfHours ? toFa(t.mtbfHours) : '—'}</TableCell>
                        <TableCell>{toFa(t.downtimeHours)}</TableCell>
                        <TableCell className={t.slaBreachCount > 0 ? 'text-red-400 font-bold' : ''}>
                          {toFa(t.slaBreachCount)} مورد
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PARETO ANALYSIS */}
        <TabsContent value="pareto">
          <Card className="border border-border bg-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-bold text-foreground">تحلیل Pareto فراوانی خطاها (قانون ۲۰/۸۰ خرابی ناوگان)</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={selectedParetoTrainId} onValueChange={(val) => { setSelectedParetoTrainId(val || ''); loadPareto(val || '') }}>
                  <SelectTrigger className="w-48 text-xs h-9">
                    <SelectValue placeholder="فیلتر قطار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه قطارها</SelectItem>
                    {trainsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        قطار {t.trainNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPareto || !paretoData ? (
                <div className="text-center py-10 text-xs text-foreground-muted animate-pulse">بارگذاری تحلیل پارتو...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="text-right">کد خطا</TableHead>
                      <TableHead className="text-right">شرح خطا</TableHead>
                      <TableHead className="text-right">تعداد وقوع</TableHead>
                      <TableHead className="text-right">درصد از کل</TableHead>
                      <TableHead className="text-right">درصد انباشته (Cumulative %)</TableHead>
                      <TableHead className="text-right">اهمیت در سیستم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paretoData.pareto.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-b border-border hover:bg-surface-hover">
                        <TableCell className="font-mono font-bold text-foreground">{item.faultCode.code}</TableCell>
                        <TableCell className="text-xs">{item.faultCode.title}</TableCell>
                        <TableCell className="font-bold">{toFa(item.count)}</TableCell>
                        <TableCell>{toFa(item.percentage)}%</TableCell>
                        <TableCell className={item.cumulativePercentage <= 80 ? 'text-emerald-400 font-bold' : ''}>
                          {toFa(item.cumulativePercentage)}%
                        </TableCell>
                        <TableCell>
                          {item.cumulativePercentage <= 80 ? (
                            <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px]">
                              حیاتی (دسته A)
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px]">
                              جزئی (دسته B/C)
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
