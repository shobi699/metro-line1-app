import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

const POLICY_KEY = 'delegation_matrix'

const defaultMatrix = {
  shift_lead: { canView: true, canTransfer: false, canAssignRole: false, canEditProfile: false },
  station_manager: { canView: true, canTransfer: true, canAssignRole: true, maxAssignRoleRank: 20, canEditProfile: true },
  region_manager: { canView: true, canTransfer: true, canAssignRole: true, maxAssignRoleRank: 50, canEditProfile: true },
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    let policy = await prisma.accessPolicy.findUnique({
      where: { key: POLICY_KEY }
    })

    if (!policy) {
      policy = await prisma.accessPolicy.create({
        data: {
          key: POLICY_KEY,
          config: defaultMatrix
        }
      })
    }

    return NextResponse.json({ data: policy.config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:security-policies')) {
    return NextResponse.json({ error: 'عدم دسترسی برای ویرایش سیاست‌های امنیتی' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { matrix } = body

    const updated = await prisma.accessPolicy.upsert({
      where: { key: POLICY_KEY },
      update: { config: matrix },
      create: { key: POLICY_KEY, config: matrix }
    })

    return NextResponse.json({ data: updated.config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
