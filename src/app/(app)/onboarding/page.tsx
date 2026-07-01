'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import { CheckCircle, Circle, ArrowLeft, GraduationCap, ClipboardCheck, Users, HelpCircle, FileText, Check } from 'lucide-react'
import Link from 'next/link'

interface DocumentItem {
  id: string
  label: string
  description: string
  checked: boolean
}

interface ManagerCard {
  name: string
  role: string
  phone: string
  station: string
}

export default function OnboardingPage() {
  // Document checklist state loaded/saved to localStorage
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  const defaultDocs: DocumentItem[] = [
    { id: 'doc-1', label: 'تصویر کارت ملی و شناسنامه', description: 'تایید هویت و مدارک شناسایی رسمی', checked: true },
    { id: 'doc-2', label: 'گواهی عدم سوءپیشینه', description: 'نامه رسمی صادر شده از مراجع قضایی', checked: false },
    { id: 'doc-3', label: 'معاینات پزشکی و طب کار', description: 'تایید صلاحیت جسمانی و بینایی‌سنجی ویژه راهبران', checked: false },
    { id: 'doc-4', label: 'آخرین مدرک تحصیلی', description: 'کپی برابر اصل مدرک تحصیلی یا دانشنامه کارشناسی', checked: false },
    { id: 'doc-5', label: 'گواهینامه رانندگی قطار شهری (پایه ۲ یا ۱)', description: 'ویژه کادر راهبری و سیر و حرکت', checked: false },
  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_onboarding_docs')
      if (saved) {
        setDocuments(JSON.parse(saved))
      } else {
        setDocuments(defaultDocs)
        window.localStorage.setItem('metro_onboarding_docs', JSON.stringify(defaultDocs))
      }
    }
  }, [])

  const handleToggleDoc = (id: string) => {
    const updated = documents.map(doc => {
      if (doc.id === id) return { ...doc, checked: !doc.checked }
      return doc
    })
    setDocuments(updated)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metro_onboarding_docs', JSON.stringify(updated))
    }
  }

  // Calculate overall progress percentage
  const completedCount = documents.filter(d => d.checked).length
  const progressPercent = documents.length > 0 ? Math.round((completedCount / documents.length) * 100) : 0

  const managers: ManagerCard[] = [
    { name: 'جناب مهندس کریمی', role: 'مدیر کل سیر و حرکت خط ۱', phone: '۰۹۱۲۰۰۰۰۰۱۱', station: 'ساختمان اداری کالج' },
    { name: 'جناب مهندس رضایی', role: 'رئیس دپوی غرب (تجریش)', phone: '۰۹۱۲۰۰۰۰۰۲۲', station: 'دپوی تجریش' },
    { name: 'سرکار خانم دکتر هاشمی', role: 'سرپرست آموزش و ارزیابی پرسنل', phone: '۰۹۱۲۰۰۰۰۰۳۳', station: 'ساختمان مرکزی' },
    { name: 'جناب آقای نوری', role: 'سرپرست ارشد ایمنی و سوانح خط ۱', phone: '۰۹۱۲۰۰۰۰۰۴۴', station: 'ایستگاه امام خمینی' },
  ]

  const regulations = [
    { title: 'قانون فاصله ایمنی قطارها', desc: 'حداقل فاصله ایمن بین دو رام قطار در بلاک‌های بدون سیگنال خودکار باید طبق دستورالعمل شماره ۳ سیر و حرکت رعایت شود.' },
    { title: 'بایکوت و تعویض تراک‌ها', desc: 'هرگونه تغییر سوزن یا عبور اضطراری از چراغ قرمز بلاک متوقف‌کننده باید با هماهنگی کتبی/رادیویی مستقیم دیسپاچر OCC صورت پذیرد.' },
    { title: 'گزارش شبه‌حوادث (Near-Miss)', desc: 'پرسنل موظفند هرگونه ناهماهنگی سیگنال، عیوب مشکوک سوزن‌ها یا سوانح احتمالی جزئی را فوراً در پیشخوان حوادث ثبت نمایند.' },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <GraduationCap className="size-6 text-accent" />
          آموزش و توجیه بدو خدمت (Onboarding)
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          روند آشنایی، بارگذاری مدارک الزامی، آموزش قوانین پایه و ساختار مدیریتی خط ۱ مترو تهران
        </p>
      </div>

      {/* Progress Dashboard */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-right w-full sm:w-auto">
              <span className="text-xs text-foreground-muted font-bold block">پیشرفت روند توجیهی بدو خدمت</span>
              <p className="text-sm font-black text-foreground">
                تکمیل مدارک: <span className="text-accent">{toFa(completedCount)}</span> از {toFa(documents.length)} مورد
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full sm:w-64 flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-data-mono text-xs font-bold text-accent">{toFa(progressPercent)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Checklist */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <ClipboardCheck className="size-4.5 text-accent" />
                چک‌لیست تحویل و تأیید مدارک الزامی
              </CardTitle>
              <CardDescription>مدارک تحویل داده شده به امور اداری را علامت بزنید:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 divide-y divide-border/40">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleToggleDoc(doc.id)}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className={`text-xs font-semibold block transition-colors group-hover:text-accent ${doc.checked ? 'text-foreground line-through opacity-70' : 'text-foreground'}`}>
                      {doc.label}
                    </span>
                    <span className="text-[10px] text-foreground-muted block">{doc.description}</span>
                  </div>
                  <button className="shrink-0 p-1 text-foreground-muted hover:text-accent">
                    {doc.checked ? (
                      <CheckCircle className="size-5 text-accent" />
                    ) : (
                      <Circle className="size-5 text-border hover:border-accent" />
                    )}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Regulations */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <FileText className="size-4.5 text-accent" />
                آیین‌نامه‌ها و قوانین پایه خط ۱
              </CardTitle>
              <CardDescription>اصول کلیدی که هر راهبر بدو ورود باید به آنها مسلط باشد:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {regulations.map((reg, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low border border-border/40 rounded-lg">
                  <span className="text-xs font-extrabold text-foreground flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] px-1 bg-accent/5 text-accent">{toFa(idx + 1)}</Badge>
                    {reg.title}
                  </span>
                  <p className="text-[11px] text-foreground-muted mt-1.5 leading-relaxed">{reg.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Meet the Managers & Exams */}
        <div className="space-y-6">
          {/* Managers List */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Users className="size-4.5 text-accent" />
                ساختار فرماندهی خط ۱
              </CardTitle>
              <CardDescription>مدیران و سرپرستان ارشد خط:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 divide-y divide-border/40">
              {managers.map((mgr, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <span className="text-xs font-extrabold text-foreground block">{mgr.name}</span>
                  <p className="text-[10px] text-accent font-semibold">{mgr.role}</p>
                  <div className="flex justify-between text-[9px] text-foreground-muted font-data-mono">
                    <span>تلفن: {toFa(mgr.phone)}</span>
                    <span>محل خدمت: {mgr.station}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Training & Exams links */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <HelpCircle className="size-4.5 text-accent" />
                آزمون‌های الزامی بدو خدمت
              </CardTitle>
              <CardDescription>آزمون‌های مورد نیاز برای تأیید صلاحیت:</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="p-3 border border-border/40 rounded-lg hover:border-accent/40 transition-colors flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-foreground block">آزمون ایمنی و سوانح</span>
                  <span className="text-[10px] text-foreground-muted block mt-0.5">مفاهیم پایه سیگنالینگ و سرعت</span>
                </div>
                <Link href="/learning/exams">
                  <Button size="icon-sm" variant="ghost">
                    <ArrowLeft className="size-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="p-3 border border-border/40 rounded-lg hover:border-accent/40 transition-colors flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-foreground block">آزمون بایکوت سوزن‌ها</span>
                  <span className="text-[10px] text-foreground-muted block mt-0.5">ضوابط و مکاتبه با دیسپاچر OCC</span>
                </div>
                <Link href="/learning/exams">
                  <Button size="icon-sm" variant="ghost">
                    <ArrowLeft className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
