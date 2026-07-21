import { prisma } from '@/server/db'
import CatalogClient from './client'
import defaultCatalogs from '@/lib/data/catalogs.json'

export const metadata = {
  title: 'راهنمای زنده و کاتالوگ فنی | سوپراپ خط ۱',
}

export default async function TechnicalCatalogsPage() {
  // Self-seeding logic: if DB has no catalogs, insert the default ones from JSON
  let catalogsCount = await prisma.technicalCatalog.count()
  
  if (catalogsCount === 0) {
    console.log('Seeding initial technical catalogs...')
    for (const cat of defaultCatalogs) {
      await prisma.technicalCatalog.create({
        data: {
          title: cat.title,
          category: cat.category,
          content: cat.content,
        }
      })
    }
  }

  const dbCatalogs = await prisma.technicalCatalog.findMany({
    orderBy: { createdAt: 'asc' }
  })

  return <CatalogClient initialCatalogs={dbCatalogs} />
}
