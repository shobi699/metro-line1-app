'use client'

import { BookOpen, Terminal, CheckCircle2, Activity, Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function LiveManualFeed() {
  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  return (
    <aside className="flex w-full flex-col border-e border-border bg-surface-container-low md:w-1/3 transition-colors duration-150" dir="rtl">
      {/* Header Info */}
      <div className="border-b border-border bg-surface px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-accent" />
            راهنمای زنده و کاتالوگ فنی
          </h2>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-semibold text-success font-mono">LIVE</span>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-foreground-muted">
          <span>Ref: L1-BKS-v4.2</span>
          <span>صفحه: {formatFarsiNumber('۱۱۴')}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        
        {/* Schematic Card */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-border-subtle pb-2">
            <h3 className="text-xs font-semibold text-accent flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              شکل {formatFarsiNumber('۴')}B: مجموعه ترمز پنوماتیک
            </h3>
            <Badge variant="outline" className="text-[9px] font-mono border-border-subtle bg-surface-container text-foreground-muted">
              SECTION 4.2
            </Badge>
          </div>
          
          {/* Simulated Blueprint Frame */}
          <div className="relative aspect-video rounded-md border border-border-subtle bg-background-subtle overflow-hidden flex items-center justify-center group">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
            
            {/* Tech line vectors drawing representation */}
            <div className="relative z-10 w-4/5 h-3/5 border-2 border-dashed border-accent/20 rounded flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-accent/50">VALVE C-12</span>
                <span className="text-[8px] font-mono text-accent/50">PORT A</span>
              </div>
              <div className="self-center flex flex-col items-center gap-1">
                <Activity className="size-6 text-accent/40 animate-pulse" />
                <span className="text-[9px] font-mono text-foreground-muted">۴.۵ BAR PRESSURE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8px] font-mono text-accent/50">OUT: ACTIVE</span>
                <span className="text-[8px] font-mono text-accent/50">SYS_V301</span>
              </div>
            </div>
            
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-foreground-muted bg-surface/80 px-1.5 py-0.5 rounded border border-border-subtle">
              نمای نقشه فنی واگن خط ۱
            </div>
          </div>

          {/* Technical Specs List */}
          <ul className="space-y-2.5 pt-1">
            <li className="flex items-start gap-2.5 text-xs text-foreground-muted">
              <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
              <span>تحمل فشار شیر <span className="font-mono text-[10px]">C-12</span>: {formatFarsiNumber('۴.۵')} بار مجاز</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-foreground-muted">
              <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
              <span>بازوی محرک ترمز نیاز به بازنشانی دستی در کابین دارد.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-foreground-muted">
              <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
              <span>بررسی نهایی برای یکپارچگی درز در پورت <span className="font-mono text-[10px]">A</span>.</span>
            </li>
          </ul>
        </div>

        {/* Operational Status Info */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Terminal className="size-3.5 text-accent" />
            وضعیت عملیاتی سنسورها
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="bg-background-subtle border border-border-subtle p-2 rounded-md">
              <span className="text-foreground-muted block mb-1">فشار خط ترمز</span>
              <span className="text-xs font-semibold text-foreground font-mono">{formatFarsiNumber('۴.۸')} BAR</span>
            </div>
            <div className="bg-background-subtle border border-border-subtle p-2 rounded-md">
              <span className="text-foreground-muted block mb-1">دمای موتور</span>
              <span className="text-xs font-semibold text-success font-mono">{formatFarsiNumber('۴۲')}°C</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
