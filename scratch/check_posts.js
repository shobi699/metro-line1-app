const path = require('path')
const { PrismaClient } = require('../src/generated/prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')

const dbPath = path.resolve(__dirname, '../prisma/dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })

const prisma = new PrismaClient({ adapter })

async function main() {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      category: true,
      status: true,
      published: true,
    }
  })
  console.log('--- ALL POSTS ---')
  console.log(JSON.stringify(posts, null, 2))
}

main().catch(console.error)
