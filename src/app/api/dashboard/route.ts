import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const [
      pendingUsers,
      pendingSwaps,
      openTickets,
      activeBulletins,
      recentAuditLogs,
      userCount,
      activeUserCount,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'pending' } }),
      prisma.swapRequest.count({ where: { status: 'pending' } }),
      prisma.ticket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.safetyBulletin.count({ where: { active: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: { select: { name: true, role: { select: { title: true } } } },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
    ])

    const stations = [
      { id: '1', name: 'تجریش', status: 'normal', type: 'ایستگاه مبدا (شمال)', crowd: 'کم', elevator: 'فعال', chief: 'مهندس حسینی' },
      { id: '2', name: 'قلهک', status: 'normal', type: 'ایستگاه میانی صخره‌ای', crowd: 'متوسط', elevator: 'فعال', chief: 'مهندس رضایی' },
      { id: '3', name: 'هفت تیر', status: 'normal', type: 'ایستگاه تقاطعی شلوغ', crowd: 'زیاد', elevator: 'در دست تعمیر', chief: 'مهندس قاسمی' },
      { id: '4', name: 'امام خمینی', status: 'normal', type: 'مرکزی / تقاطعی با خط ۲', crowd: 'بسیار زیاد', elevator: 'فعال', chief: 'مهندس مرادی' },
      { id: '5', name: 'کهریزک', status: 'normal', type: 'ایستگاه پایانه جنوبی', crowd: 'کم', elevator: 'فعال', chief: 'مهندس جلالی' },
    ]

    const trains = [
      { id: 'T-101', name: 'T-101', fromStationId: '1', toStationId: '2', progress: 10, speedKmH: 55, status: 'normal' },
      { id: 'T-102', name: 'T-102', fromStationId: '3', toStationId: '4', progress: 45, speedKmH: 60, status: 'normal' },
      { id: 'T-103', name: 'T-103', fromStationId: '5', toStationId: '4', progress: 80, speedKmH: 48, status: 'normal' },
    ]

    const scadaSystems = [
      { name: 'برق ریل سوم (Traction Power)', key: 'traction', status: 'normal', value: '745', unit: 'V DC', trend: 'stable' },
      { name: 'سیگنالینگ و ATP/ATO', key: 'signaling', status: 'normal', value: 'عادی / خودکار', trend: 'stable' },
      { name: 'تهویه تونل‌ها (Ventilation)', key: 'ventilation', status: 'normal', value: '1850', unit: 'm³/s', trend: 'stable' },
      { name: 'شبکه بیسیم اتاق فرمان (OCC Radio)', key: 'radio', status: 'normal', value: '98', unit: '٪ کیفیت سیگنال', trend: 'stable' },
    ]

    return NextResponse.json({
      data: {
        stats: {
          pendingUsers,
          pendingSwaps,
          openTickets,
          activeBulletins,
          totalUsers: userCount,
          activeUsers: activeUserCount,
        },
        stations,
        trains,
        scadaSystems,
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          message: `${log.actor.name} (${log.actor.role.title}) — ${log.action} on ${log.entity}`,
          time: log.createdAt.toISOString(),
          type: log.action === 'create' ? 'info' : log.action === 'delete' ? 'error' : 'warning',
        })),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
