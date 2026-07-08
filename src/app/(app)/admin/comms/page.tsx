'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth'
import { Radio, MessageSquare, BarChart, Shield, ShieldAlert, Wifi } from 'lucide-react'
import { toFa } from '@/lib/fa'

export default function AdminCommsPage() {
  const { accessToken } = useAuthStore()
  
  const [channels, setChannels] = useState<any[]>([])
  const [phrases, setPhrases] = useState<any[]>([])
  const [reports, setReports] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    
    Promise.all([
      fetch('/api/admin/comms/channels', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch('/api/admin/comms/phrases', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch('/api/admin/comms/reports?days=7', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json())
    ]).then(([chRes, phRes, repRes]) => {
      if (chRes.data) setChannels(chRes.data)
      if (phRes.data) setPhrases(phRes.data)
      if (repRes.data) setReports(repRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [accessToken])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">مدیریت بی‌سیم (رادیو)</h1>
        <p className="text-muted-foreground">مدیریت کانال‌های رادیویی، عبارات سریع، و گزارش‌گیری ترافیک</p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports" className="gap-2"><BarChart className="w-4 h-4"/> گزارشات زنده</TabsTrigger>
          <TabsTrigger value="channels" className="gap-2"><Radio className="w-4 h-4"/> کانال‌ها</TabsTrigger>
          <TabsTrigger value="phrases" className="gap-2"><MessageSquare className="w-4 h-4"/> عبارات سریع</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">کل پیام‌ها (۷ روز)</div>
                <div className="text-3xl font-bold">{reports ? toFa(reports.totalCount) : '...'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">پیام‌های اضطراری</div>
                <div className="text-3xl font-bold text-destructive flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6"/> {reports ? toFa(reports.emergencyCount) : '...'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">ویس‌نوت‌های مخابره شده</div>
                <div className="text-3xl font-bold text-primary">{reports ? toFa(reports.voiceCount) : '...'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">پیام‌های متنی شبکه</div>
                <div className="text-3xl font-bold text-secondary-foreground">{reports ? toFa(reports.textCount) : '...'}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه کامل ارتباطات</CardTitle>
              <CardDescription>مانیتورینگ پیام‌های ردوبدل شده در بستر بی‌سیم</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p>در حال بارگذاری...</p> : (
                <div className="relative w-full overflow-auto rounded-md border">
                  <table className="w-full text-sm text-start">
                    <thead className="bg-muted">
                      <tr className="border-b">
                        <th className="p-3 text-start font-medium">زمان</th>
                        <th className="p-3 text-start font-medium">فرستنده</th>
                        <th className="p-3 text-start font-medium">کانال</th>
                        <th className="p-3 text-start font-medium">نوع</th>
                        <th className="p-3 text-start font-medium">متن/محتوا</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reports?.logs?.map((log: any) => (
                        <tr key={log.id}>
                          <td className="p-3 whitespace-nowrap">{toFa(new Date(log.createdAt).toLocaleString('fa-IR'))}</td>
                          <td className="p-3">{log.senderName}</td>
                          <td className="p-3"><Badge variant="outline">{log.channel?.label}</Badge></td>
                          <td className="p-3">
                            {log.kind === 'EMERGENCY' ? <Badge variant="destructive">اضطراری</Badge> : 
                             log.kind === 'VOICE_NOTE' ? <Badge variant="default">صوتی</Badge> : 
                             <Badge variant="secondary">متنی</Badge>}
                          </td>
                          <td className="p-3 truncate max-w-[200px]" title={log.message}>{log.message}</td>
                        </tr>
                      ))}
                      {!reports?.logs?.length && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">داده‌ای یافت نشد.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>کانال‌های ارتباطی</CardTitle>
              <CardDescription>تعریف فرکانس‌ها و گروه‌های ارتباطی</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p>در حال بارگذاری...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((ch) => (
                    <div key={ch.id} className={`p-4 rounded-xl border ${ch.isActive ? 'border-primary/20 bg-primary/5' : 'bg-muted opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-lg flex items-center gap-2">
                          <Wifi className={`w-5 h-5 ${ch.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          {ch.label}
                        </div>
                        <Badge variant={ch.isActive ? 'default' : 'secondary'}>
                          {ch.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>شناسه: {ch.key}</span>
                        <span>کد دستگاه: {toFa(ch.code || 'ندارد')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases">
          <Card>
            <CardHeader>
              <CardTitle>عبارات سریع و پیش‌فرض</CardTitle>
              <CardDescription>پیام‌های آماده برای استفاده در اپ موبایل راهبران</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <p>در حال بارگذاری...</p> : (
                <div className="space-y-2">
                  {phrases.map((ph) => (
                    <div key={ph.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-lg gap-4">
                      <div>
                        <div className="font-medium">{ph.label}</div>
                        <div className="text-sm text-muted-foreground">{ph.text}</div>
                      </div>
                      <div className="flex gap-2">
                        {ph.roleKey ? <Badge variant="outline">مخصوص: {ph.roleKey}</Badge> : <Badge variant="secondary">عمومی</Badge>}
                        <Badge variant={ph.isActive ? 'default' : 'destructive'}>{ph.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
