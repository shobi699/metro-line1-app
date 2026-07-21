import { prisma } from './src/server/db'

async function main() {
  const rosterDays = await prisma.rosterDay.findMany({
    include: {
      versions: {
        include: {
          trips: {
            include: {
              assignments: {
                include: {
                  matchedUser: { select: { name: true, customFields: true } }
                }
              }
            }
          }
        }
      }
    }
  })
  
  for (const day of rosterDays) {
    console.log(`Day ID: ${day.id}, Jalali: ${day.jalaliDate}, Status: ${day.status}`)
    for (const ver of day.versions) {
      console.log(`  Version ID: ${ver.id}, VerNo: ${ver.versionNo}, Status: ${ver.status}`)
      console.log(`  Trips count: ${ver.trips.length}`)
      const assigned = ver.trips.filter(t => t.assignments.some(a => a.matchedUserId))
      console.log(`  Assigned Trips count: ${assigned.length}`)
      if (assigned.length > 0) {
        console.log(`    Example Assignment:`, JSON.stringify(assigned[0].assignments.map(a => ({
          role: a.role,
          rawName: a.rawName,
          matchedUser: a.matchedUser?.name,
          personnelNo: a.personnelNo
        })), null, 2))
      }
    }
  }
}

main().catch(console.error)
