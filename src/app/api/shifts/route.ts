import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { getAllShifts } from '@/server/modules/roster/shifts'
import type { RoleKey } from '@/generated/prisma/client'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year = Number(searchParams.get('year') ?? now.getFullYear())
  const roleFilter = searchParams.get('role') as RoleKey | null

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const shifts = await getAllShifts(startDate, endDate, roleFilter ?? undefined)
  return NextResponse.json({ data: shifts })
}
