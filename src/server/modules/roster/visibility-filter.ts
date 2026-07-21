import { prisma } from '@/server/db'

export async function applyVisibilityMatrix(payload: any, roleKey: string) {
  if (!payload) return payload

  const matrix = await prisma.rosterVisibilityMatrix.findFirst({
    where: { roleKey }
  })
  if (!matrix) return payload

  let visibleCols: string[] = []
  try {
    if (typeof matrix.visibleCols === 'string') {
      visibleCols = JSON.parse(matrix.visibleCols)
    } else if (Array.isArray(matrix.visibleCols)) {
      visibleCols = matrix.visibleCols as string[]
    }
  } catch {
    return payload
  }

  const { showCrewNames, showNotes } = matrix

  const filterTrip = (trip: any) => {
    const filtered: any = { ...trip }
    
    // Clear cols not present in visibleCols
    if (!visibleCols.includes('rowNo')) filtered.rowNo = 0
    if (!visibleCols.includes('trainNumber')) filtered.trainNumber = null
    if (!visibleCols.includes('direction')) filtered.direction = 'TAJRISH_TO_SHAHRREY'
    if (!visibleCols.includes('originStation')) filtered.originStation = null
    if (!visibleCols.includes('destinationStation')) filtered.destinationStation = null
    if (!visibleCols.includes('departureTime')) filtered.departureTime = null
    if (!visibleCols.includes('arrivalTime')) filtered.arrivalTime = null
    if (!visibleCols.includes('status')) filtered.status = 'NORMAL'

    // Operational note visibility
    if (!showNotes) {
      filtered.operationalNote = null
    }

    if (filtered.assignments) {
      filtered.assignments = filtered.assignments.map((assign: any) => {
        const role = assign.role?.toLowerCase() // h1, h2, t, r
        
        // Check if role is visible in columns
        const isRoleVisible = visibleCols.includes(role)
        if (!isRoleVisible) {
          return null
        }

        const filteredAssign = { ...assign }
        if (!showCrewNames) {
          filteredAssign.rawName = null
          filteredAssign.personnelNo = null
          filteredAssign.matchedUserId = null
          filteredAssign.matchedUser = null
        }
        return filteredAssign
      }).filter(Boolean)
    }

    return filtered
  }

  if (Array.isArray(payload.trips)) {
    payload.trips = payload.trips.map(filterTrip)
  }
  return payload
}
