'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Smartphone, 
  Apple, 
  Globe, 
  Download, 
  Info, 
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Cpu
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface DownloadConfig {
  title: string
  description: string
  androidType: 'url' | 'file'
  androidValue: string
  iosType: 'url' | 'file'
  iosValue: string
  webUrl: string
}

export default function DownloadPage() {
  const [config, setConfig] = useState<DownloadConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.download) {
          setConfig(json.data.download)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center font-sans" dir="rtl">
        <Loader2 className="size-8 text-[#e53935] animate-spin mb-3" />
        <span className="text-sm font-medium text-[#a1a1aa] font-sans">در حال بارگذاری اطلاعات دانلود...</span>
      </div>
    )
  }

  const downloadTitle = config?.title || 'دانلود اپلیکیشن پرسنلی خط ۱'
  const downloadDesc = config?.description || 'نسخه‌های رسمی اندروید، آیفون و وب‌اپلیکیشن برای استفاده پرسنل و راهبران خط یک متروی تهران'
  const androidLink = config?.androidValue || '#'
  const iosLink = config?.iosValue || '#'
  const webLink = config?.webUrl || '/'

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between font-sans relative overflow-hidden selection:bg-[#e53935]/20" dir="rtl">
      
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#e53935]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-[#e53935] rounded-xl flex items-center justify-center shadow-lg shadow-[#e53935]/20">
            <Cpu className="size-5 text-white" />
          </div>
          <span className="font-sans font-black text-sm tracking-wide text-white">سیر و حرکت خط ۱</span>
        </div>
        <Link 
          href="/login" 
          className="flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-white transition-colors bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl"
        >
          <span>ورود به سامانه</span>
          <ArrowLeft className="size-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center max-w-4xl z-10 relative">
        <div className="text-center max-w-2xl mb-12 space-y-4">
          <span className="px-3 py-1 bg-[#e53935]/15 border border-[#e53935]/20 text-[#e53935] text-[10px] font-bold rounded-full inline-block animate-pulse">
            آخرین نسخه رسمی منتشر شد
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight font-sans tracking-tight">
            {downloadTitle}
          </h1>
          <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
            {downloadDesc}
          </p>
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          
          {/* Android Card */}
          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[260px] shadow-2xl relative overflow-hidden group hover:border-[#e53935]/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-green-500/10 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5 border border-green-500/20">
                <Smartphone className="size-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">نسخه اندروید (Android)</h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed mb-6">
                دریافت مستقیم فایل APK برنامه یا نصب از طریق آدرس اختصاصی برای گوشی‌های سامسونگ، شیائومی و ...
              </p>
            </div>
            <a 
              href={androidLink}
              download
              className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Download className="size-4" />
              <span>دانلود نسخه اندروید</span>
            </a>
          </div>

          {/* iOS Card */}
          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[260px] shadow-2xl relative overflow-hidden group hover:border-[#e53935]/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5 border border-blue-500/20">
                <Apple className="size-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">نسخه آیفون (iOS)</h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed mb-6">
                نصب مستقیم نسخه آیفون از طریق پکیج یا مراجعه به آدرس اختصاصی اپ‌ستور پرسنلی سازمان.
              </p>
            </div>
            <a 
              href={iosLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Download className="size-4" />
              <span>دانلود نسخه iOS</span>
            </a>
          </div>

          {/* Web App Card */}
          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[260px] shadow-2xl relative overflow-hidden group hover:border-[#e53935]/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#e53935]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#e53935]/10 transition-colors" />
            <div>
              <div className="size-12 rounded-2xl bg-[#e53935]/10 flex items-center justify-center mb-5 border border-[#e53935]/20">
                <Globe className="size-6 text-[#e53935]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">وب‌اپلیکیشن (PWA)</h3>
              <p className="text-xs text-[#a1a1aa] leading-relaxed mb-6">
                استفاده مستقیم روی مرورگر بدون نیاز به نصب. سازگار با تمامی سیستم‌عامل‌ها و تبلت‌ها.
              </p>
            </div>
            <a 
              href={webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#e53935] hover:bg-[#e53935]/90 text-white active:scale-[0.98] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#e53935]/10"
            >
              <Globe className="size-4" />
              <span>ورود به وب‌اپلیکیشن</span>
            </a>
          </div>

        </div>

        {/* Informational Tips */}
        <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-2xl p-4 max-w-xl flex items-start gap-3 text-right">
          <Info className="size-5 text-[#e53935] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-white block">راهنمای نصب نسخه‌های موبایل:</span>
            <p className="text-[10px] text-[#a1a1aa] leading-relaxed">
              برای نصب نسخه اندروید، پس از دانلود فایل APK، در تنظیمات گوشی اجازه نصب از منابع ناشناخته (Allow from this source) را صادر کنید. برای کاربران iOS، جهت پایداری بیشتر پیشنهاد می‌شود از آدرس وب‌اپلیکیشن استفاده کرده و آن را به صفحه اصلی خود (Add to Home Screen) اضافه نمایند.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 z-10 relative">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] text-[#a1a1aa] text-center md:text-right flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-green-400" />
            <span>تمامی بسته‌های نصب شده توسط فایروال امنیتی سیر و حرکت خط ۱ مترو تهران تایید شده‌اند.</span>
          </span>
          <span className="text-[10px] text-[#71717a]">
            کپی‌رایت © {toFa(new Date().getFullYear())} شرکت بهره‌برداری راه‌آهن شهری تهران و حومه.
          </span>
        </div>
      </footer>

    </div>
  )
}
