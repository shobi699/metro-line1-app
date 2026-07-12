'use client'

import { useState, useEffect } from 'react'
import { Download, Search, Settings, FileText } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { jdate } from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const STATUS_TYPES = [
  { key: 'on_call', label: 'کشیک', color: 'text-blue-500 bg-blue-500/10' },
  { key: 'overtime', label: 'اضافه کار', color: 'text-purple-500 bg-purple-500/10' },
  { key: 'leave_sick', label: 'مرخصی استعلاجی', color: 'text-emerald-600 bg-emerald-600/10' },
  { key: 'leave_daily', label: 'مرخصی روزانه', color: 'text-green-500 bg-green-500/10' },
  { key: 'leave_hourly', label: 'مرخصی ساعتی', color: 'text-orange-500 bg-orange-500/10' },
  { key: 'note', label: 'یادداشت', color: 'text-amber-500 bg-amber-500/10' },
  { key: 'other', label: 'سایر کارکرد', color: 'text-red-700 bg-red-700/10' },
  { key: 'reminder', label: 'یادآور', color: 'text-red-500 bg-red-500/10' },
]

export default function DayStatusAdminPage() {
  const [activeTab, setActiveTab] = useState('reports')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  
  const [reportsData, setReportsData] = useState<any>(null)
  const [loadingReports, setLoadingReports] = useState(true)
  const [configData, setConfigData] = useState<any>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [updatingConfig, setUpdatingConfig] = useState(false)

  const fetchReports = async () => {
    setLoadingReports(true)
    try {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (type && type !== 'all') p.set('type', type)
      p.set('page', page.toString())
      const res = await fetch(`/api/admin/day-status?${p.toString()}`)
      if (res.ok) {
        setReportsData(await res.json())
      }
    } catch (e) {
      // silent
    } finally {
      setLoadingReports(false)
    }
  }

  const fetchConfig = async () => {
    setLoadingConfig(true)
    try {
      const res = await fetch('/api/admin/calendar/config')
      if (res.ok) {
        const json = await res.json()
        setConfigData(json.data)
      }
    } catch (e) {
      // silent
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [search, type, page])

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleToggleType = async (key: string, enabled: boolean) => {
    if (!configData) return
    const currentRules = configData.dayStatusRules || {}
    const newConfig = {
      dayStatusRules: {
        ...currentRules,
        [key]: { ...(currentRules[key] || {}), enabled }
      }
    }
    
    setUpdatingConfig(true)
    try {
      const res = await fetch('/api/admin/calendar/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })
      if (res.ok) {
        fetchConfig()
      }
    } catch (e) {
      // silent
    } finally {
      setUpdatingConfig(false)
    }
  }

  const handleExport = () => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (type && type !== 'all') p.set('type', type)
    window.location.href = `/api/admin/day-status/export?${p.toString()}`
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">وضعیت روزانه (آیتم‌های تقویم)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          گزارش‌گیری و مدیریت انواع درخواست‌ها و کارکردهای ثبت شده در تقویم پرسنل
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="size-4" /> گزارشات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="size-4" /> تنظیمات نمایش
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-xl border bg-card/50">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label>جستجوی کاربر</Label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="نام یا کد پرسنلی..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label>نوع رویداد</Label>
              <Select value={type} onValueChange={(val) => setType(val ?? 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="همه موارد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه موارد</SelectItem>
                  {STATUS_TYPES.map(t => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} variant="secondary" className="gap-2 shrink-0">
              <Download className="size-4" /> خروجی اکسل
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">کاربر</th>
                  <th className="p-3 font-medium">نوع</th>
                  <th className="p-3 font-medium">تاریخ</th>
                  <th className="p-3 font-medium">مقدار / ساعت</th>
                  <th className="p-3 font-medium">یادداشت</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingReports ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">در حال بارگذاری...</td>
                  </tr>
                ) : reportsData?.data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">موردی یافت نشد.</td>
                  </tr>
                ) : (
                  reportsData?.data?.items?.map((item: any) => {
                    const typeDef = STATUS_TYPES.find(t => t.key === item.type)
                    const cf = item.metadata || {}
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-medium">{item.user.name}</div>
                          <div className="text-xs text-muted-foreground">{item.user.personnelCode}</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${typeDef?.color || 'bg-secondary text-secondary-foreground'}`}>
                            {typeDef?.label || item.type}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap" dir="ltr">
                          {toFa(jdate(item.startAt).format('YYYY/MM/DD'))}
                        </td>
                        <td className="p-3 whitespace-nowrap" dir="ltr">
                          {cf.hours !== undefined ? `${toFa(cf.hours)} h` : cf.amount !== undefined ? `${toFa(cf.amount.toLocaleString())} ﷼` : '-'}
                        </td>
                        <td className="p-3 max-w-[200px] truncate" title={item.title}>
                          {item.title}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            
            {reportsData?.data?.totalPages > 1 && (
              <div className="p-3 border-t flex items-center justify-between bg-muted/20">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  قبلی
                </Button>
                <span className="text-xs text-muted-foreground">
                  صفحه {toFa(page)} از {toFa(reportsData.data.totalPages)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= reportsData.data.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="rounded-xl border p-5 bg-card/50">
            <h3 className="font-medium mb-4">آیتم‌های مجاز برای ثبت توسط پرسنل</h3>
            <p className="text-sm text-muted-foreground mb-6">
              با غیرفعال کردن هر آیتم، پرسنل دیگر قادر به ثبت آن مورد در تقویم خود نخواهند بود. موارد قبلی در گزارشات باقی می‌مانند.
            </p>
            
            {loadingConfig ? (
              <div className="text-sm text-muted-foreground">در حال دریافت تنظیمات...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {STATUS_TYPES.map(type => {
                  const isEnabled = configData?.dayStatusRules?.[type.key]?.enabled ?? true
                  return (
                    <div key={type.key} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">شناسه: {type.key}</div>
                      </div>
                      <Switch 
                        checked={isEnabled} 
                        onCheckedChange={(checked) => handleToggleType(type.key, checked)} 
                        disabled={updatingConfig}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
