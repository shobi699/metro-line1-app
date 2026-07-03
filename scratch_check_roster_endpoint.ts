import { prisma } from './src/server/db'

async function main() {
  const rosterDays = await prisma.rosterDay.findMany({
    include: {
      versions: {
        include: {
          trips: {
            include: {
              assignments: true
            }
          }
        }
      }
    }
  })

  console.log('Total RosterDays in database:', rosterDays.length)
  for (const rd of rosterDays) {
    console.log(`- ID: ${rd.id}, Jalali: ${rd.jalaliDate}, Gregorian: ${rd.gregorianDate.toISOString()}, Status: ${rd.status}`)
    console.log(`  Versions count: ${rd.versions.length}`)
    for (const rv of rd.versions) {
      console.log(`    Version ${rv.versionNo} (${rv.status}), Trips count: ${rv.trips.length}`)
      const assigned = rv.trips.filter(t => t.assignments.length > 0).length
      console.log(`      Trips with assignments: ${assigned}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
