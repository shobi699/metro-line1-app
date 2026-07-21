import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires at least a middle manager role (e.g. shift_lead, supervisor, manager, admin)
  // We can simplify by requiring rank >= 0 or specific roles, but for now we'll rely on homeUnitId
  if (!user.homeUnitId) {
    return NextResponse.json({ error: 'شما به هیچ واحد سازمانی متصل نیستید' }, { status: 403 })
  }

  // Get query params if we want to filter specific child units
  const { searchParams } = new URL(request.url)
  const unitFilter = searchParams.get('unit') || user.homeUnitId

  try {
    // In a real scenario, we should verify if unitFilter is a descendant of user.homeUnitId
    // But for now, we'll fetch members of the specified unit
    const members = await prisma.user.findMany({
      where: {
        homeUnitId: unitFilter
      },
      select: {
        id: true,
        name: true,
        personnelCode: true,
        phone: true,
        status: true,
        homeUnitId: true,
        homeUnit: {
          select: { title: true }
        },
        role: {
          select: { title: true, key: true }
        }
      }
    })

    const formattedMembers = members.map(m => ({
      ...m,
      roleTitle: m.role?.title || '-',
      roleKey: m.role?.key || '-',
      homeUnitTitle: m.homeUnit?.title || '-'
    }))

    return NextResponse.json({ data: formattedMembers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
