import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { jdate } from '@/lib/dayjs'

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

    // Seeding mock today's Roster Day and Trips for testing Cabin Mode
    const todayJalali = jdate().format('YYYY/MM/DD')
    const todayGregorian = new Date()
    todayGregorian.setHours(12, 0, 0, 0)

    // Clear any existing RosterDay for today to prevent conflict
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    await prisma.rosterDay.deleteMany({
      where: {
        OR: [
          { jalaliDate: todayJalali },
          { gregorianDate: { gte: startOfToday, lte: endOfToday } }
        ]
      }
    })

    // Create RosterDay
    const rosterDay = await prisma.rosterDay.create({
      data: {
        jalaliDate: todayJalali,
        gregorianDate: todayGregorian,
        title: `لوحه روزانه ${todayJalali}`,
        schedulingTitle: `برنامه اعزام خط ۱ - ${todayJalali}`,
        status: 'PUBLISHED'
      }
    })

    // Create RosterVersion
    const rosterVersion = await prisma.rosterVersion.create({
      data: {
        rosterDayId: rosterDay.id,
        versionNo: 1,
        status: 'PUBLISHED',
        changeReason: 'راه‌اندازی اولیه لوحه دمو',
        changeSummary: 'انتساب سفرهای دمو به کاربران'
      }
    })

    // Find our users
    const driverUser = await prisma.user.findFirst({
      where: { personnelCode: '1111111111' } // علی رضایی
    })

    const superAdminUser = await prisma.user.findFirst({
      where: { personnelCode: '0000000000' } // مدیر سیستم
    })

    const adminUser = await prisma.user.findFirst({
      where: { personnelCode: '9999999999' } // مدیر خط
    })

    const targetUserIds = [driverUser?.id, superAdminUser?.id, adminUser?.id].filter(Boolean) as string[]

    // Create a few mock trips for today
    const tripData = [
      {
        rowNo: 1,
        trainNumber: '101',
        direction: 'TAJRISH_TO_SHAHRREY',
        originStation: 'تجریش',
        destinationStation: 'شهرری',
        departureTime: '۰۸:۳۰:۰۰',
        arrivalTime: '۰۹:۱۵:۰۰',
        status: 'NORMAL'
      },
      {
        rowNo: 2,
        trainNumber: '102',
        direction: 'SHAHRREY_TO_TAJRISH',
        originStation: 'شهرری',
        destinationStation: 'تجریش',
        departureTime: '۱۰:۰۰:۰۰',
        arrivalTime: '۱۰:۴۵:۰۰',
        status: 'NORMAL'
      },
      {
        rowNo: 3,
        trainNumber: '103',
        direction: 'TAJRISH_TO_SHAHRREY',
        originStation: 'تجریش',
        destinationStation: 'شهرری',
        departureTime: '۱۳:۱۵:۰۰',
        arrivalTime: '۱۴:۰۰:۰۰',
        status: 'NORMAL'
      },
      {
        rowNo: 4,
        trainNumber: '104',
        direction: 'SHAHRREY_TO_TAJRISH',
        originStation: 'شهرری',
        destinationStation: 'تجریش',
        departureTime: '۱۶:۳۰:۰۰',
        arrivalTime: '۱۷:۱۵:۰۰',
        status: 'NORMAL'
      }
    ]

    for (const data of tripData) {
      const trip = await prisma.trip.create({
        data: {
          rosterVersionId: rosterVersion.id,
          rowNo: data.rowNo,
          trainNumber: data.trainNumber,
          direction: data.direction,
          originStation: data.originStation,
          destinationStation: data.destinationStation,
          departureTime: data.departureTime,
          arrivalTime: data.arrivalTime,
          status: data.status
        }
      })

      // Assign to all of our target users so whoever is logged in can see and test Cabin Mode!
      for (const userId of targetUserIds) {
        await prisma.tripAssignment.create({
          data: {
            tripId: trip.id,
            role: 'H1', // Driver H1
            rawName: 'راهبر نمونه',
            matchedUserId: userId,
            personnelNo: '100001',
            matchStatus: 'MANUAL_MATCHED'
          }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'UI Builder, Leaves, & Roster Seeding successful' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
