import { prisma } from './src/server/db'

async function main() {
  const targetDate = new Date()
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)

  console.log('Query date range (Local):', startOfDay.toLocaleString(), 'to', endOfDay.toLocaleString())
  console.log('Query date range (ISO):  ', startOfDay.toISOString(), 'to', endOfDay.toISOString())

  const rosterDay = await prisma.rosterDay.findFirst({
    where: {
      gregorianDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      versions: {
        orderBy: { versionNo: 'desc' },
        take: 1,
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

  console.log('Result found:', !!rosterDay)
  if (rosterDay) {
    console.log('ID:', rosterDay.id)
    console.log('JalaliDate:', rosterDay.jalaliDate)
    console.log('Versions count:', rosterDay.versions.length)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
