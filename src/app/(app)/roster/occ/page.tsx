import { Suspense } from 'react'
import OccBoardClient from '@/app/(app)/roster/occ/OccBoardClient'

export const metadata = {
  title: 'خط زمان OCC | مترو خط ۱',
}

export default function OccBoardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">خط زمان و مانیتورینگ OCC</h1>
        <p className="text-muted-foreground mt-2">
          مشاهده زنده خط زمان حرکت قطارها و وضعیت پرسنل
        </p>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center">در حال بارگذاری...</div>}>
        <OccBoardClient />
      </Suspense>
    </div>
  )
}
