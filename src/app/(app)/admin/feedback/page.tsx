import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, FolderTree, Settings, Users, BarChart3, Inbox } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'مدیریت سامانه بازخورد | مترو خط ۱',
}

export default function FeedbackAdminDashboard() {
  const adminModules = [
    {
      title: 'مدیریت دسته‌ها',
      description: 'تعریف دسته‌بندی‌های بازخورد، تعیین نقش مسئول و تنظیم SLA.',
      icon: <FolderTree className="h-8 w-8 text-primary" />,
      href: '/admin/feedback/categories',
      badge: 'فعال',
    },
    {
      title: 'صندوق پیام‌ها',
      description: 'مشاهده تمامی پیام‌ها، شکایات و پیشنهادات در سطح سازمان.',
      icon: <Inbox className="h-8 w-8 text-blue-500" />,
      href: '/feedback', // Or specific admin inbox if required
      badge: 'فعال',
    },
    {
      title: 'گزارش و تحلیل',
      description: 'حجم پیام‌ها، نقض SLA و گلوگاه‌های پاسخگویی.',
      icon: <BarChart3 className="h-8 w-8 text-green-500" />,
      href: '#',
      badge: 'به‌زودی',
    },
    {
      title: 'تنظیمات ناشناسی و تشدید',
      description: 'قواعد محرمانگی اطلاعات و اطلاع به مدیر ارشد.',
      icon: <Settings className="h-8 w-8 text-orange-500" />,
      href: '#',
      badge: 'به‌زودی',
    },
    {
      title: 'پاسخ‌های آماده',
      description: 'متون از پیش نوشته شده برای افزایش سرعت تیم پاسخگو.',
      icon: <MessageSquare className="h-8 w-8 text-purple-500" />,
      href: '#',
      badge: 'به‌زودی',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مدیریت سامانه بازخورد و پیام‌ها</h1>
        <p className="text-muted-foreground mt-2">
          پیکربندی سیستم ارتباطات درون‌سازمانی، شکایات و نظرات
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
