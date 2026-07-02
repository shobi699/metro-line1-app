'use client'

import { BookOpen, Terminal, CheckCircle2, Activity, Cpu, Gauge, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function LiveManualFeed() {
  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  return (
    <aside className="flex w-full h-full flex-col bg-surface-container-low transition-colors duration-150" dir="rtl">
      {/* Header Info */}
      <div className="border-b border-border bg-surface px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs lg:text-sm font-extrabold text-foreground">
            <BookOpen className="size-4 text-accent" />
            راهنمای زنده و کاتالوگ فنی
          </h2>
          <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-black text-success font-mono tracking-wider">LIVE</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-foreground-muted">
          <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-[8px] border border-border-subtle">REF: L1-BKS-v4.2</span>
          <span>صفحه: {formatFarsiNumber('۱۱۴')}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 custom-scrollbar">
        
        {/* Schematic Card */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle pb-2">
            <h3 className="text-[11px] font-black text-accent flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              مجموعه ترمز پنوماتیک (شکل ۴.۸)
            </h3>
            <Badge variant="outline" className="text-[8px] font-mono border-border-subtle bg-surface-container text-foreground-muted">
              SECTION 4.2
            </Badge>
          </div>
          
          {/* SVG Blueprint Frame */}
          <div className="relative aspect-video rounded-lg border border-border-subtle bg-background-subtle overflow-hidden flex items-center justify-center group shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(174,0,17,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(174,0,17,0.03)_1px,transparent_1px)] bg-[size:16px_16px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
            
            {/* SVG schematic vector blueprint */}
            <svg className="absolute inset-0 size-full p-2 text-accent/30" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Rails/chassis lines */}
              <line x1="10" y1="95" x2="190" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Reservoir */}
              <rect x="25" y="25" width="45" height="22" rx="4" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="36" x2="25" y2="36" stroke="currentColor" strokeWidth="1.5" />
              
              {/* Pipe connection */}
              <path d="M 70 36 L 105 36 L 105 60 L 130 60" stroke="currentColor" strokeWidth="1.5" />
              {/* Secondary line */}
              <path d="M 105 50 L 80 50 L 80 70" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              
              {/* Valve / Controller */}
              <circle cx="105" cy="48" r="7" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" />
              <line x1="101" y1="44" x2="109" y2="52" stroke="currentColor" strokeWidth="1.5" />
              
              {/* Brake Cylinder */}
              <rect x="130" y="50" width="35" height="18" rx="2" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1.5" />
              {/* Piston rod */}
              <line x1="165" y1="59" x2="185" y2="59" stroke="var(--color-accent)" strokeWidth="2.5" className="animate-pulse" />
              <rect x="183" y="52" width="4" height="14" fill="var(--color-accent)" />
              
              {/* Labels inside SVG */}
              <text x="47" y="20" fill="currentColor" fontSize="6" fontFamily="monospace" textAnchor="middle">RESERVOIR</text>
              <text x="147" y="45" fill="currentColor" fontSize="6" fontFamily="monospace" textAnchor="middle">CYLINDER</text>
              <text x="105" y="30" fill="var(--color-accent)" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">VALVE C-12</text>
            </svg>

            {/* Glowing active overlays */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent/15 border border-accent/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-accent">
              <Zap className="size-2.5 animate-bounce" />
              <span>SYS_V301: ACTIVE</span>
            </div>
            
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-foreground-muted bg-surface/90 px-2 py-0.5 rounded border border-border-subtle">
              نمای مدار الکتروپنوماتیک ترمز واگن
            </div>
          </div>

          {/* Technical Specs List */}
          <ul className="space-y-2 pt-1">
            <li className="flex items-start gap-2 text-[11px] text-foreground-muted">
              <CheckCircle2 className="size-3.5 text-accent shrink-0 mt-0.5" />
              <span>تحمل فشار شیر <span className="font-mono text-[9px] bg-surface-container px-1 py-0.2 rounded border border-border-subtle">C-12</span>: {formatFarsiNumber('۴.۵')} بار مجاز</span>
            </li>
            <li className="flex items-start gap-2 text-[11px] text-foreground-muted">
              <CheckCircle2 className="size-3.5 text-accent shrink-0 mt-0.5" />
              <span>بازوی محرک ترمز نیاز به بازنشانی دستی در کابین دارد.</span>
            </li>
            <li className="flex items-start gap-2 text-[11px] text-foreground-muted">
              <CheckCircle2 className="size-3.5 text-accent shrink-0 mt-0.5" />
              <span>بررسی نهایی برای یکپارچگی درز در پورت <span className="font-mono text-[9px] bg-surface-container px-1 py-0.2 rounded border border-border-subtle">A</span>.</span>
            </li>
          </ul>
        </div>

        {/* Operational Status Info */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-black text-foreground flex items-center gap-1.5">
            <Terminal className="size-3.5 text-accent" />
            وضعیت عملیاتی سنسورها
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-background-subtle border border-border-subtle p-2.5 rounded-lg flex flex-col justify-between h-14">
              <span className="text-foreground-muted text-[9px] block">فشار خط ترمز</span>
              <span className="text-xs font-black text-foreground font-mono flex items-center justify-center gap-1 mt-0.5">
                <Gauge className="size-3 text-accent" />
                {formatFarsiNumber('۴.۸')} BAR
              </span>
            </div>
            
            <div className="bg-background-subtle border border-border-subtle p-2.5 rounded-lg flex flex-col justify-between h-14">
              <span className="text-foreground-muted text-[9px] block">دمای موتور تراکشن</span>
              <span className="text-xs font-black text-success font-mono flex items-center justify-center gap-1 mt-0.5">
                <Activity className="size-3 text-success animate-pulse" />
                {formatFarsiNumber('۴۲')}°C
              </span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}
