import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="w-full max-w-md animate-[fadeInUp_0.6s_ease-out]">
        <div className="rounded-xl border border-border bg-surface-container/90 p-8 shadow-lg backdrop-blur-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning/15">
            <Clock className="size-8 text-warning" />
          </div>
          <h1 className="font-headline-md text-foreground mb-2">
            منتظر تأیید
          </h1>
          <p className="text-sm text-foreground-muted mb-6">
            ثبت‌نام شما با موفقیت انجام شد
          </p>
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 mb-6">
            <p className="text-sm text-foreground">
              حساب کاربری شما در انتظار تأیید مدیر سیستم است. پس از تأیید،
              امکان ورود به سیستم را خواهید داشت.
            </p>
            <p className="text-xs text-foreground-muted mt-2">
              لطفاً بعداً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            <ArrowLeft className="size-4" />
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  )
}
