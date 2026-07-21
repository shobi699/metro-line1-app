import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { precomputeOnPublish } from '@/server/modules/roster/precompute'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only certain roles can create amendments
  if (!['admin', 'supervisor', 'occ'].includes(user.roleKey)) {
    return NextResponse.json({ error: 'عدم دسترسی برای ثبت اصلاحیه' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { rosterDayId, kind, tripId, assignmentId, previousValue, newValue, reason } = body

    if (!rosterDayId || !kind) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    // Determine amendment rule to apply
    let ruleKind = kind
    if (kind === 'crew_changed') ruleKind = 'crew_replace'
    if (kind === 'time_changed') ruleKind = 'trip_time'
    if (kind === 'status_changed') ruleKind = 'trip_status'

    const rule = await prisma.rosterAmendmentRule.findFirst({
      where: { amendmentKind: ruleKind }
    })

    // Enforce publication limit time check
    const publishedVersion = await prisma.rosterVersion.findFirst({
      where: { rosterDayId, status: 'PUBLISHED' },
      orderBy: { versionNo: 'desc' }
    })

    if (publishedVersion && publishedVersion.publishedAt && rule && rule.maxHoursAfterPublish !== null) {
      const diffMs = Date.now() - new Date(publishedVersion.publishedAt).getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      if (diffHours > rule.maxHoursAfterPublish) {
        return NextResponse.json({
          error: `امکان ثبت اصلاحیه پس از ${rule.maxHoursAfterPublish} ساعت از زمان انتشار لوحه وجود ندارد.`
        }, { status: 400 })
      }
    }

    // Determine status based on approval requirements
    let status = 'approved'
    if (rule && rule.requireApproval) {
      const isApprover = user.roleKey === rule.approverRoleKey || ['admin', 'super_admin'].includes(user.roleKey)
      status = isApprover ? 'approved' : 'pending_approval'
    } else if (rule && !rule.requireApproval) {
      status = 'approved'
    } else {
      status = (user.roleKey === 'admin' || user.roleKey === 'supervisor') ? 'approved' : 'pending_approval'
    }

    // Get current seq
    const lastAmend = await prisma.rosterAmendment.findFirst({
      where: { rosterDayId },
      orderBy: { seq: 'desc' }
    })
    const seq = (lastAmend?.seq || 0) + 1

    const amendment = await prisma.rosterAmendment.create({
      data: {
        rosterDayId,
        seq,
        kind,
        tripId,
        tripAssignmentId: assignmentId,
        before: previousValue ? JSON.stringify(previousValue) : null,
        after: newValue ? JSON.stringify(newValue) : "{}",
        reason,
        status,
        createdById: user.id,
        approvedById: status === 'approved' ? user.id : null,
      }
    })

    if (status === 'approved') {
      // 1. Update the actual data based on kind
      if (kind === 'crew_changed' && assignmentId && newValue) {
        await prisma.tripAssignment.update({
          where: { id: assignmentId },
          data: {
            matchedUserId: newValue.matchedUserId,
            rawName: newValue.rawName,
            matchStatus: newValue.matchedUserId ? 'MANUAL_MATCHED' : 'UNMATCHED',
            // Reset workflow flags on change
            acknowledgedAt: null,
            readyAt: null,
            handoverAt: null,
            disputed: false,
            disputeNote: null
          }
        })
      } else if (kind === 'time_changed' && tripId && newValue) {
        await prisma.trip.update({
          where: { id: tripId },
          data: {
            departureTime: newValue.departureTime,
            arrivalTime: newValue.arrivalTime,
            operationalNote: newValue.operationalNote
          }
        })
      }

      // 2. Re-trigger precomputation so the Snapshot is updated immediately
      // First get the active RosterVersionId for this day
      const version = await prisma.rosterVersion.findFirst({
        where: { rosterDayId, status: 'PUBLISHED' },
        orderBy: { versionNo: 'desc' }
      })

      if (version) {
        try {
          await precomputeOnPublish(version.id)
        } catch (e) {
          console.error('[RosterAmendment] Precompute failed:', e)
        }
      }

      // 3. (Optional) Audit log & notification...
    }

    return NextResponse.json({ success: true, amendment })

  } catch (error: any) {
    console.error('Amendment Error:', error)
    return NextResponse.json({ error: 'خطای سرور در ثبت اصلاحیه' }, { status: 500 })
  }
}
