import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'
import { getDescendantIds, getOrgUnits } from '@/server/rbac/org-unit'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Wait, does the user have permission to view users?
  // We should check if they have "iam:users-manage" or "iam:assign" or if they just want to view their unit.
  // Viewing their own unit's members might not strictly require "iam:users-manage" if we have a "iam:unit-view" or something.
  // Actually, let's use a basic permission check or assume any manager with scopes can view their unit.
  // Let's require them to have SOME scope.
  if (!user.scopes || user.scopes.length === 0) {
    if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
      return NextResponse.json({ error: 'شما مدیر هیچ واحدی نیستید' }, { status: 403 })
    }
  }

  try {
    const isGlobalAdmin = user.scopes?.some(s => s.type === 'all') || user.roleKey === 'admin' || user.roleKey === 'super_admin'

    let unitIdsToQuery: string[] | undefined = undefined

    if (!isGlobalAdmin && user.scopes) {
      unitIdsToQuery = []
      const allUnits = await getOrgUnits()
      
      for (const scope of user.scopes) {
        if (scope.type === 'all') continue
        
        // Find the unit ID for this scope key. scope.key is the org unit's `key` (e.g. st-tajrish)
        const unit = allUnits.find(u => u.key === scope.key)
        if (unit) {
          unitIdsToQuery.push(unit.id)
          const descendants = await getDescendantIds(unit.id)
          unitIdsToQuery.push(...descendants)
        }
      }
      
      // Remove duplicates
      unitIdsToQuery = Array.from(new Set(unitIdsToQuery))
    }

    const whereClause = isGlobalAdmin ? {} : {
      homeUnitId: { in: unitIdsToQuery }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        homeUnit: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Map to simple structure
    const members = users.map(u => ({
      id: u.id,
      personnelCode: u.personnelCode,
      name: u.name,
      status: u.status,
      homeUnitId: u.homeUnitId,
      homeUnitTitle: u.homeUnit?.title || '-',
      roleKey: u.role.key,
      roleTitle: u.role.title
    }))

    return NextResponse.json({ data: members })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
