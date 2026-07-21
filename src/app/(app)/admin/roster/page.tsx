import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ShieldAlert, Users, PencilRuler } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'پنل مدیریت لوحه | مترو خط ۱',
}

export default function RosterAdminDashboard() {
  const adminModules = [
    {
      title: 'قواعد اعتبارسنجی',
      description: 'تنظیمات حداقل زمان استراحت، شیفت‌های متوالی و خطاهای سیستمی',
      icon: <ShieldAlert className="h-8 w-8 text-destructive" />,
      href: '/admin/roster/validation-rules',
      badge: 'فعال',
    },
    {
      title: 'ماتریس دید نقش‌ها',
      description: 'تعیین دسترسی به ستون‌ها و قابلیت‌های لوحه بر اساس نقش کاربری',
      icon: <Users className="h-8 w-8 text-primary" />,
      href: '/admin/roster/visibility-matrix',
      badge: 'فعال',
    },
    {
      title: 'قواعد اصلاحیه',
      description: 'گردش کار تایید اصلاحیه‌ها، مهلت زمانی و دلایل استاندارد',
      icon: <PencilRuler className="h-8 w-8 text-orange-500" />,
      href: '/admin/roster/amendment-rules',
      badge: 'فعال',
    },
    {
      title: 'قالب‌های فایل (آینده)',
      description: 'طراح بصری قالب‌های PDF و نگاشت ستون‌های اکسل',
      icon: <FileText className="h-8 w-8 text-muted-foreground" />,
      href: '#',
      badge: 'به‌زودی',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تنظیمات و مدیریت لوحه</h1>
        <p className="text-muted-foreground mt-2">
          پیکربندی هوشمند سامانه لوحه، قواعد عملیاتی و تعیین سطح دسترسی‌ها
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module, i) => (
          <Link key={i} href={module.href} className={module.href === '#' ? 'pointer-events-none opacity-80' : ''}>
            <Card className="hover:border-primary/50 transition-colors h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  {module.title}
                </CardTitle>
                {module.icon}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <CardDescription className="text-sm mt-2">
                  {module.description}
                </CardDescription>
                <div className="mt-4">
                  <Badge variant={module.badge === 'فعال' ? 'default' : 'secondary'}>
                    {module.badge}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
