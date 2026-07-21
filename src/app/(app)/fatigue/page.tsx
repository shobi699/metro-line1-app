'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa } from '@/lib/fa'
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Heart, Clock, Moon } from 'lucide-react'

interface SelfCheckLog {
  sleepHours: number
  sleepQuality: 'good' | 'fair' | 'poor'
  fatigueLevel: number // 1 to 5
  hasHeadacheOrColds: boolean
  timestamp: string
}

interface WarningAlert {
  id: string
  title: string
  desc: string
  severity: 'low' | 'medium' | 'high'
}

export default function FatiguePage() {
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState<'good' | 'fair' | 'poor'>('good')
  const [fatigueLevel, setFatigueLevel] = useState(2) // 1 to 5
  const [hasHeadacheOrColds, setHasHeadacheOrColds] = useState(false)
  
  const [logs, setLogs] = useState<SelfCheckLog[]>([])
  const [alerts, setAlerts] = useState<WarningAlert[]>([])
  
  const [calculatedScore, setCalculatedScore] = useState(24) // Fatigue score out of 100
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalysis = async () => {
    try {
      const res = await fetch('/api/fatigue')
      const json = await res.json()
      if (json.data) {
        setCalculatedScore(json.data.score)
        setAlerts(json.data.alerts || [])
        if (json.data.latestLog) {
          // just keeping history simple for now, add latest to array
          setLogs([{
            sleepHours: json.data.latestLog.sleepHours,
            sleepQuality: json.data.latestLog.sleepQuality,
            fatigueLevel: json.data.latestLog.fatigueLevel,
            hasHeadacheOrColds: json.data.latestLog.hasHeadacheOrColds,
            timestamp: json.data.latestLog.createdAt
          }])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [])

  const recalculateScore = (sleep: number, qual: string, fatigue: number, sick: boolean) => {
    let base = 10
    if (sleep < 5) base += 40
    else if (sleep < 7) base += 20
    
    if (qual === 'poor') base += 20
    else if (qual === 'fair') base += 10
    
    base += fatigue * 5
    if (sick) base += 20
    
    setCalculatedScore(Math.min(100, base))
  }

  const handleSelfCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitSuccess('')

    try {
      const res = await fetch('/api/fatigue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours,
          sleepQuality,
          fatigueLevel,
          hasHeadacheOrColds,
        })
      })

      if (res.ok) {
        setSubmitSuccess('خودارزیابی آمادگی فیزیکی با موفقیت در کارنامه سلامت شیفت شما ثبت گردید.')
        await fetchAnalysis() // Refresh score and alerts
        setTimeout(() => setSubmitSuccess(''), 4000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreStatus = (score: number) => {
    if (score < 40) return { label: 'کم ریسک (آماده خدمت)', color: 'text-success border-success/30 bg-success/5', ring: 'ring-success/20' }
    if (score < 70) return { label: 'ریسک متوسط (مراقبت احتیاطی)', color: 'text-warning border-warning/30 bg-warning/5', ring: 'ring-warning/20' }
    return { label: 'ریسک بالا (خستگی مفرط / عدم تمرکز)', color: 'text-critical border-critical/30 bg-critical/5', ring: 'ring-critical/20 animate-pulse' }
  }

  const statusCfg = getScoreStatus(calculatedScore)

  if (isLoading) {
    return <div className="p-8 text-center text-foreground-muted" dir="rtl">در حال بارگذاری تحلیل خستگی...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Activity className="size-6 text-accent" />
          پایش خستگی و سلامت کاری
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          ارزیابی خودکار خستگی انباشته بر اساس الگوی خواب، فواصل شیفت‌ها و خوداظهاری سلامت
        </p>
      </div>

      {/* Fatigue Meter dashboard */}
      <Card className={`border ${statusCfg.color} ring-4 ${statusCfg.ring} transition-all duration-300`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-right w-full md:w-auto">
            <Badge className="font-bold border rounded px-2.5 py-0.5 text-xs">
              شاخص ریسک خستگی راهبر
            </Badge>
            <h2 className="text-lg font-black text-foreground">
              وضعیت فعلی: <span className="text-accent">{statusCfg.label}</span>
            </h2>
            <p className="text-xs text-foreground-muted max-w-md leading-relaxed">
              این شاخص با توجه به خودارزیابی آمادگی فیزیکی امروز شما و فواصل استراحت مابین شیفت‌های لوحه محاسبه شده است.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Score circle */}
            <div className="relative size-24 rounded-full border-4 border-current flex items-center justify-center font-data-mono text-3xl font-black">
              <span>{toFa(calculatedScore)}</span>
              <span className="text-[10px] absolute bottom-3 font-normal">امتیاز ریسک</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fitness Self Checkin */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Moon className="size-4.5 text-accent" />
                خودارزیابی آمادگی فیزیکی روزانه پرسنل
              </CardTitle>
              <CardDescription>قبل از شروع شیفت کاری، وضعیت سلامت خود را ثبت کنید:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {submitSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSelfCheckSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sleep-hrs" className="font-bold">میزان خواب مفید در ۲۴ ساعت گذشته (ساعت)</Label>
                    <Input
                      id="sleep-hrs"
                      type="number"
                      min={3}
                      max={15}
                      step={0.5}
                      value={sleepHours}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setSleepHours(val)
                        recalculateScore(val, sleepQuality, fatigueLevel, hasHeadacheOrColds)
                      }}
                      className="mt-1.5 h-8 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sleep-qual" className="font-bold">کیفیت خواب</Label>
                    <select
                      id="sleep-qual"
                      value={sleepQuality}
                      onChange={(e) => {
                        const val = e.target.value as any
                        setSleepQuality(val)
                        recalculateScore(sleepHours, val, fatigueLevel, hasHeadacheOrColds)
                      }}
                      className="mt-1.5 flex h-8 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="good">خوب و عمیق (ریکاوری کامل)</option>
                      <option value="fair">متوسط (بیدار شدن مکرر)</option>
                      <option value="poor">نامناسب (بی‌خوابی / خستگی پس از بیداری)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">میزان احساس خستگی فعلی (۱ تا ۵)</Label>
                    <div className="flex gap-2 mt-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setFatigueLevel(num)
                            recalculateScore(sleepHours, sleepQuality, num, hasHeadacheOrColds)
                          }}
                          className={`flex-1 h-8 rounded border text-xs font-bold transition-all ${
                            fatigueLevel === num
                              ? 'bg-accent border-accent text-accent-foreground'
                              : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                          }`}
                        >
                          {toFa(num)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={hasHeadacheOrColds}
                        onChange={(e) => {
                          const val = e.target.checked
                          setHasHeadacheOrColds(val)
                          recalculateScore(sleepHours, sleepQuality, fatigueLevel, val)
                        }}
                        className="size-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="font-bold text-foreground-muted">آیا کسالت، سردرد یا علائم سرماخوردگی دارید؟</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/40 mt-4">
                  <Button type="submit" disabled={submitting} className="h-8 text-xs font-bold">
                    {submitting ? 'در حال ثبت...' : 'ثبت خودارزیابی آمادگی'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Heavy Shifts Alert Warnings */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <ShieldAlert className="size-4.5 text-accent" />
                هشدارهای سیستمی الگوهای سنگین شیفت
              </CardTitle>
              <CardDescription>مغایرت‌ها و هشدارهای استخراج شده از الگوهای لوحه کاری شما:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {alerts.length === 0 && (
                <div className="text-xs text-foreground-muted text-center py-4">بدون هشدار سیستمی جدید</div>
              )}
              {alerts.map((w) => (
                <div key={w.id} className="p-3 border border-border/40 bg-surface-container-low rounded-lg flex items-start gap-3">
                  <AlertTriangle className={`size-5 shrink-0 mt-0.5 ${w.severity === 'high' ? 'text-critical' : 'text-warning'}`} />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{w.title}</span>
                    <p className="text-[11px] text-foreground-muted mt-1.5 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Health Recommendations */}
        <div className="space-y-4">
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-success">
                <Heart className="size-4.5" />
                توصیه‌های خودمراقبتی و بهداشت خواب
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] leading-relaxed text-foreground-muted space-y-3">
              <div className="space-y-1.5">
                <span className="font-bold text-foreground block flex items-center gap-1">
                  <Sparkles className="size-3 text-success" />
                  مدیریت خواب قبل از شیفت شب:
                </span>
                <p>قبل از شیفت‌های شبانه خط ۱، پیشنهاد می‌شود یک چرت نیم‌روزی ۹۰ دقیقه‌ای مابین ساعت ۱۳ تا ۱۵ جهت هماهنگی فاز بیولوژیک بدن داشته باشید.</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground block flex items-center gap-1">
                  <Clock className="size-3 text-success" />
                  حفظ هشیاری در حین رانندگی:
                </span>
                <p>در صورت احساس سنگینی پلک یا کسالت در حین سیر، در ایستگاه‌های تبادلی (امام خمینی یا دروازه دولت) از کابین خارج شده و از هوای آزاد ایستگاه استفاده کنید.</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground block flex items-center gap-1">
                  <Activity className="size-3 text-success" />
                  بهداشت تغذیه:
                </span>
                <p>حداقل ۲ ساعت قبل از شروع شیفت شب از مصرف کربوهیدرات‌های سنگین و چرب خودداری کنید تا از خواب‌آلودگی گوارشی ناشی از ترشح ملاتونین پیشگیری شود.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
