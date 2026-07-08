import { prisma } from '@/server/db'

export interface ValidationError {
  tripId?: string
  trainNumber?: string
  assignmentId?: string
  rawName?: string
  ruleKey: string
  message: string
  severity: 'error' | 'warning'
}

export async function validateRosterVersion(rosterVersionId: string): Promise<ValidationError[]> {
  const version = await prisma.rosterVersion.findUnique({
    where: { id: rosterVersionId },
    include: {
      trips: {
        include: { assignments: true }
      }
    }
  })

  if (!version) throw new Error('Roster version not found')

  const activeRules = await prisma.rosterValidationRule.findMany({
    where: { isEnabled: true }
  })

  const errors: ValidationError[] = []

  // Check rules
  for (const rule of activeRules) {
    if (rule.key === 'incomplete_crew') {
      for (const trip of version.trips) {
        const hasH1 = trip.assignments.some(a => a.role === 'H1')
        if (!hasH1) {
          errors.push({
            tripId: trip.id,
            trainNumber: trip.trainNumber || '—',
            ruleKey: rule.key,
            message: 'قطار فاقد راهبر اصلی (H1) است.',
            severity: rule.severity as 'error' | 'warning'
          })
        }
      }
    }

    if (rule.key === 'overlap') {
      const driverTrips = new Map<string, typeof version.trips[0][]>()
      for (const trip of version.trips) {
        for (const assign of trip.assignments) {
          if (assign.matchedUserId) {
            if (!driverTrips.has(assign.matchedUserId)) {
              driverTrips.set(assign.matchedUserId, [])
            }
            driverTrips.get(assign.matchedUserId)!.push(trip)
          }
        }
      }

      for (const [userId, trips] of driverTrips.entries()) {
        const sorted = trips.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))
        for (let i = 0; i < sorted.length - 1; i++) {
          const t1 = sorted[i]
          const t2 = sorted[i + 1]
          if (t1.arrivalTime && t2.departureTime && t1.arrivalTime > t2.departureTime) {
            errors.push({
              tripId: t2.id,
              trainNumber: t2.trainNumber || '—',
              ruleKey: rule.key,
              message: `تداخل زمانی برای راهبر بین قطار ${t1.trainNumber} و ${t2.trainNumber}`,
              severity: rule.severity as 'error' | 'warning'
            })
          }
        }
      }
    }
  }

  // Check unresolved aliases
  for (const trip of version.trips) {
    for (const assign of trip.assignments) {
      if (assign.rawName && !assign.matchedUserId) {
        errors.push({
          tripId: trip.id,
          trainNumber: trip.trainNumber || '—',
          assignmentId: assign.id,
          rawName: assign.rawName,
          ruleKey: 'unresolved_alias',
          message: `نام «${assign.rawName}» در سیستم تطبیق نیافته است.`,
          severity: 'error'
        })
      }
    }
  }

  return errors
}
