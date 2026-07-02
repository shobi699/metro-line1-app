import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET() {
  try {
    // 1. Clear UI Builder tables
    await prisma.uiMenuItem.deleteMany().catch(() => {})
    await prisma.uiDashboardWidget.deleteMany().catch(() => {})
    await prisma.uiPageVersion.deleteMany().catch(() => {})
    await prisma.uiPage.deleteMany().catch(() => {})
    await prisma.uiTheme.deleteMany().catch(() => {})

    // 2. Seed UI Theme
    await prisma.uiTheme.create({
      data: {
        primaryColor: '#ae0011',
        accentColor: '#575e70',
        radius: 12,
        fontSize: 'md',
        darkModeDefault: false,
        logoUrl: '',
      }
    })

    // 3. Seed UI Menu Items (Default Tabs)
    await prisma.uiMenuItem.createMany({
      data: [
        { label: 'پروفایل', icon: 'User', route: 'ProfileScreen', orderIndex: 4, isVisible: true },
        { label: 'گفتگو', icon: 'MessageSquare', route: 'ChatScreen', orderIndex: 3, isVisible: true },
        { label: 'اعلان‌ها', icon: 'Bell', route: 'NotificationsScreen', orderIndex: 2, isVisible: true },
        { label: 'شیفت‌ها', icon: 'Calendar', route: 'CalendarScreen', orderIndex: 1, isVisible: true },
        { label: 'داشبورد', icon: 'LayoutDashboard', route: 'HomeScreen', orderIndex: 0, isVisible: true },
      ]
    })

    // 4. Seed UI Dashboard Widgets
    await prisma.uiDashboardWidget.createMany({
      data: [
        { widgetType: 'stat_card', title: 'شیفت امروز', size: 'md', orderIndex: 0, isVisible: true, configJson: { source: 'shift' } },
        { widgetType: 'chart', title: 'عملکرد هفتگی کیلومتر رانندگی', size: 'md', orderIndex: 1, isVisible: true, configJson: { type: 'bar', source: 'kpi' } },
        { widgetType: 'list', title: 'آخرین بخشنامه‌های ایمنی', size: 'lg', orderIndex: 2, isVisible: true, configJson: { limit: 3, source: 'bulletins' } },
      ]
    })

    // 5. Seed Leave Settings
    await prisma.setting.deleteMany({ where: { category: 'leaves' } }).catch(() => {})
    
    await prisma.setting.createMany({
      data: [
        {
          key: 'leave.type.annual',
          label: 'مرخصی استحقاقی',
          description: 'مرخصی استحقاقی سالانه',
          category: 'leaves',
          type: 'number',
          value: JSON.stringify({ maxDaysPerMonth: 2.5, requiresApproval: true }),
          defaultValue: JSON.stringify({ maxDaysPerMonth: 2.5, requiresApproval: true }),
        },
        {
          key: 'leave.type.sick',
          label: 'مرخصی استعلاجی',
          description: 'مرخصی استعلاجی با تایید پزشک',
          category: 'leaves',
          type: 'number',
          value: JSON.stringify({ maxDaysPerMonth: 3, requiresApproval: true }),
          defaultValue: JSON.stringify({ maxDaysPerMonth: 3, requiresApproval: true }),
        },
        {
          key: 'leave.type.mission',
          label: 'مأموریت',
          description: 'مأموریت کاری',
          category: 'leaves',
          type: 'number',
          value: JSON.stringify({ maxDaysPerMonth: 30, requiresApproval: true }),
          defaultValue: JSON.stringify({ maxDaysPerMonth: 30, requiresApproval: true }),
        },
        {
          key: 'leave.type.overtime',
          label: 'اضافه کار',
          description: 'ساعات اضافه کار ثبت شده',
          category: 'leaves',
          type: 'number',
          value: JSON.stringify({ maxDaysPerMonth: 30, requiresApproval: true }),
          defaultValue: JSON.stringify({ maxDaysPerMonth: 30, requiresApproval: true }),
        },
        {
          key: 'leave.type.oncall',
          label: 'کشیک',
          description: 'شیفت کشیک',
          category: 'leaves',
          type: 'number',
          value: JSON.stringify({ maxDaysPerMonth: 10, requiresApproval: true }),
          defaultValue: JSON.stringify({ maxDaysPerMonth: 10, requiresApproval: true }),
        }
      ]
    })

    return NextResponse.json({ success: true, message: 'UI Builder & Leaves Seeding successful' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
