import { prisma } from './server/db'

async function main() {
  const menus = await prisma.uiMenuItem.findMany({
    orderBy: { orderIndex: 'asc' }
  })
  console.log('--- UI Menu Items ---')
  console.log(JSON.stringify(menus, null, 2))

  const theme = await prisma.uiTheme.findFirst()
  console.log('--- UI Theme ---')
  console.log(JSON.stringify(theme, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
