'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Fingerprint, Eye, ShieldAlert, Cpu, Settings, RefreshCw, CheckCircle, Power } from 'lucide-react'
import { toFa } from '@/lib/fa'

interface Device {
  id: string
  stationName: string
  type: 'fingerprint' | 'face_scanner'
  status: 'online' | 'offline' | 'testing'
  lastSync: string
}

const INITIAL_DEVICES: Device[] = [
  { id: 'BIO-101', stationName: 'ایستگاه تجریش (گیت ۱)', type: 'fingerprint', status: 'online', lastSync: '10 دقیقه قبل' },
  { id: 'BIO-102', stationName: 'ایستگاه تجریش (گیت ۲)', type: 'face_scanner', status: 'online', lastSync: '5 دقیقه قبل' },
  { id: 'BIO-201', stationName: 'ایستگاه شهدای هفتم تیر', type: 'fingerprint', status: 'online', lastSync: '1 ساعت قبل' },
  { id: 'BIO-301', stationName: 'ایستگاه دروازه دولت (کابین ۱)', type: 'fingerprint', status: 'online', lastSync: '2 دقیقه قبل' },
  { id: 'BIO-302', stationName: 'ایستگاه دروازه دولت (گیت ۲)', type: 'face_scanner', status: 'offline', lastSync: 'دیروز' },
  { id: 'BIO-401', stationName: 'ایستگاه امام خمینی', type: 'fingerprint', status: 'online', lastSync: '15 دقیقه قبل' },
  { id: 'BIO-501', stationName: 'ایستگاه شهر ری', type: 'fingerprint', status: 'online', lastSync: '4 ساعت قبل' },
  { id: 'BIO-601', stationName: 'دپوی کهریزک (گیت ورود)', type: 'face_scanner', status: 'online', lastSync: '3 دقیقه قبل' },
]

export default function BiometricsPage() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES)
  const [enforceFingerprint, setEnforceFingerprint] = useState(true)
  const [enforceFace, setEnforceFace] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleTestDevice = (id: string) => {
    setTestingId(id)
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'testing' } : d)),
    )

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'online', lastSync: 'هم‌اکنون' } : d)),
      )
      setTestingId(null)
      setSuccessMessage(`دستگاه با شناسه ${id} تست شد و پاسخ سلامت مثبت ارسال نمود.`)
      setTimeout(() => setSuccessMessage(''), 3000)
    }, 1500)
  }

  const handleTogglePower = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'offline' ? 'online' : 'offline'
          return { ...d, status: nextStatus, lastSync: nextStatus === 'online' ? 'هم‌اکنون' : 'نامشخص' }
        }
        return d
      }),
    )
  }

  const handleSavePolicies = () => {
    setSuccessMessage('سیاست‌های امنیتی بیومتریک ذخیره و به گیت‌های ایستگاه‌ها مخابره شد.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="تنظیمات احراز هویت بایومتریک"
        subtitle="کنترل گیت‌ها و دستگاه‌های تشخیص اثر انگشت و چهره خط ۱"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs text-success animate-in fade-in duration-150">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Top Widgets */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-success/5 border border-success/20 hover:border-success/30 hover:bg-success/10 transition-all duration-150 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-foreground-muted flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-success" />
                سیاست کلی سیستم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-success">
                <Fingerprint className="size-6 shrink-0" />
                <span className="text-base font-bold">فعال و ایمن</span>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2">اتصال گیت‌های تمام ایستگاه‌ها پایدار است.</p>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border border-info/20 hover:border-info/30 hover:bg-info/10 transition-all duration-150 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-foreground-muted flex items-center gap-1.5">
                <Cpu className="size-3.5 text-info" />
                نرخ تطبیق زنده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-info">
                <Cpu className="size-6 shrink-0" />
                <span className="text-base font-bold" dir="ltr">{toFa('99.8%')}</span>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2">دقت احراز هویت زنده دستگاه‌ها.</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border border-accent/20 hover:border-accent/30 hover:bg-accent/10 transition-all duration-150 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-foreground-muted flex items-center gap-1.5">
                <Fingerprint className="size-3.5 text-accent" />
                ثبت بیومتریک امروز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-accent">
                <Fingerprint className="size-6 shrink-0" />
                <span className="text-base font-bold">{toFa(245)} راهبر / کادر</span>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2">تایید هویت شده در مبادی گیت خط ۱.</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Policies */}
        <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
          <CardHeader className="border-b border-border-subtle/50 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Settings className="size-4 text-accent" />
              سیاست‌های الزامی امنیتی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface/50 backdrop-blur-md">
              <div>
                <h4 className="text-sm font-semibold text-foreground">الزام اسکن اثر انگشت در ثبت حضور و غیاب</h4>
                <p className="text-xs text-foreground-muted mt-1">
                  راهبران موظفند قبل از چک‌این حضور، اثر انگشت خود را روی گیت ایستگاه ثبت کنند.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforceFingerprint}
                onChange={(e) => setEnforceFingerprint(e.target.checked)}
                className="size-4 accent-accent cursor-pointer rounded-sm"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface/50 backdrop-blur-md">
              <div>
                <h4 className="text-sm font-semibold text-foreground">الزام تشخیص چهره در گیت خروجی دپوی کهریزک</h4>
                <p className="text-xs text-foreground-muted mt-1">
                  راهبران پس از اتمام شیفت و تحویل قطار باید توسط گیت تشخیص چهره، خروج خود را احراز کنند.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforceFace}
                onChange={(e) => setEnforceFace(e.target.checked)}
                className="size-4 accent-accent cursor-pointer rounded-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSavePolicies} className="cursor-pointer">
                ذخیره و ابلاغ سیاست‌ها
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Devices Grid */}
        <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
          <CardHeader className="border-b border-border-subtle/50 pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Fingerprint className="size-4 text-accent" />
              وضعیت دستگاه‌های بیومتریک متصل
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-border-subtle md:grid-cols-2 md:divide-y-0 md:gap-4 md:p-4">
              {devices.map((d) => {
                const isTesting = d.status === 'testing'
                return (
                  <div key={d.id} className={`flex items-center justify-between p-4 md:border md:rounded-lg border-border-subtle bg-surface/30 backdrop-blur-sm transition-all duration-300 ${isTesting ? 'border-warning/40 bg-warning/5 animate-pulse' : 'hover:border-accent/20 hover:bg-surface/60'}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-neutral-800 p-2.5 border border-border-subtle">
                        {d.type === 'fingerprint' ? (
                          <Fingerprint className="size-5 text-foreground-muted" />
                        ) : (
                          <Eye className="size-5 text-foreground-muted" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-foreground">{d.stationName}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-foreground-muted font-mono bg-neutral-800/60 px-1.5 py-0.5 rounded border border-border-subtle">{d.id}</span>
                          <Badge
                            variant="outline"
                            className={
                              d.status === 'online'
                                ? 'bg-success/15 text-success border-success/30 rounded-md px-1.5 py-0'
                                : d.status === 'offline'
                                ? 'bg-critical/10 text-critical border-critical/20 rounded-md px-1.5 py-0'
                                : 'bg-warning/10 text-warning border-warning/20 rounded-md px-1.5 py-0'
                            }
                          >
                            <span className="flex items-center gap-1">
                              {d.status === 'online' ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                                  <span>فعال</span>
                                </>
                              ) : d.status === 'offline' ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-critical"></span>
                                  <span>قطع</span>
                                </>
                              ) : (
                                <>
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning"></span>
                                  </span>
                                  <span>درحال تست</span>
                                </>
                              )}
                            </span>
                          </Badge>
                          <span className="text-[10px] text-foreground-muted">
                            آخرین اتصال: {toFa(d.lastSync)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs cursor-pointer border-border hover:bg-surface-hover"
                        onClick={() => handleTestDevice(d.id)}
                        disabled={testingId !== null}
                      >
                        <RefreshCw className={`size-3.5 ${isTesting ? 'animate-spin text-warning' : ''}`} />
                        <span>تست سلامت</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-surface-hover cursor-pointer"
                        onClick={() => handleTogglePower(d.id)}
                      >
                        <Power className={`size-4 ${d.status === 'offline' ? 'text-success' : 'text-critical'}`} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

