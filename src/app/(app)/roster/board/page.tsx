import { Suspense } from 'react'
import RosterBoardClient from '@/app/(app)/roster/board/RosterBoardClient'

export const metadata = {
  title: 'تابلوی ناحیه | مترو خط ۱',
}

export default function RosterBoardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تابلوی ناحیه (Regional Board)</h1>
        <p className="text-muted-foreground mt-2">
          نمای متراکم و مدیریت سریع سفرهای امروز برای سرشیفت‌ها
        </p>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center">در حال بارگذاری لوحه...</div>}>
        <RosterBoardClient />
      </Suspense>
    </div>
  )
}
