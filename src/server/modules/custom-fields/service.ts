import { prisma } from '@/server/db'
import { Prisma } from '@/generated/prisma/client'
import type { CustomFieldDefInput } from '@/server/dto/directory'

export async function listCustomFieldDefs(entityType?: string) {
  const where = entityType ? { entityType } : {}
  return prisma.customFieldDef.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getCustomFieldDef(id: string) {
  return prisma.customFieldDef.findUnique({ where: { id } })
}

export async function createCustomFieldDef(data: CustomFieldDefInput) {
  return prisma.customFieldDef.create({
    data: {
      entityType: data.entityType,
      name: data.name,
      label: data.label,
      type: data.type,
      options: data.options.length > 0 ? JSON.stringify(data.options) : Prisma.JsonNull,
      required: data.required,
      sortOrder: data.sortOrder,
    },
  })
}

export async function updateCustomFieldDef(
  id: string,
  data: Partial<CustomFieldDefInput>,
) {
  return prisma.customFieldDef.update({
    where: { id },
    data: {
      ...(data.entityType !== undefined && { entityType: data.entityType }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.label !== undefined && { label: data.label }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.options !== undefined && {
        options: data.options.length > 0 ? JSON.stringify(data.options) : Prisma.JsonNull,
      }),
      ...(data.required !== undefined && { required: data.required }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

export async function deleteCustomFieldDef(id: string) {
  return prisma.customFieldDef.delete({ where: { id } })
}
