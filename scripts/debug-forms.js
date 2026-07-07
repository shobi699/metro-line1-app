import { prisma } from '../src/server/db'

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  })
  console.log('--- USERS IN SYSTEM ---')
  for (const u of users) {
    console.log(`User ID: ${u.id}`)
    console.log(`  Name: ${u.name}`)
    console.log(`  Phone: ${u.phone}`)
    console.log(`  NationalID: ${u.nationalId}`)
    console.log(`  Role Key: ${u.role?.key || 'None'}`)
    console.log(`  Role Name: ${u.role?.name || 'None'}`)
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect())
