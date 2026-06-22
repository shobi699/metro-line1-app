import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl font-bold">
            منتظر تأیید
          </CardTitle>
          <CardDescription>
            ثبت‌نام شما با موفقیت انجام شد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            حساب کاربری شما در انتظار تأیید مدیر سیستم است. پس از تأیید،
            امکان ورود به سیستم را خواهید داشت.
          </p>
          <p className="text-sm text-muted-foreground">
            لطفاً بعداً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
          <Link
            href="/login"
            className="inline-block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            بازگشت به صفحه ورود
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
