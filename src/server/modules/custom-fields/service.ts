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
      defaultValue: data.defaultValue ?? null,
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
      ...(data.defaultValue !== undefined && { defaultValue: data.defaultValue }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

export async function deleteCustomFieldDef(id: string) {
  return prisma.customFieldDef.delete({ where: { id } })
}

export async function ensurePersonnelCustomFields() {
  const fields = [
    { name: 'personnelNo', label: 'کد پرسنلی', type: 'text', sortOrder: 0 },
    { name: 'idNumber', label: 'شماره شناسنامه', type: 'text', sortOrder: 1 },
    { name: 'fatherName', label: 'نام پدر', type: 'text', sortOrder: 2 },
    { name: 'shiftType', label: 'نوع شيفت', type: 'text', sortOrder: 3 },
    { name: 'shift', label: 'نام شيفت', type: 'text', sortOrder: 4 },
    { name: 'group', label: 'كد گروه راهبري', type: 'text', sortOrder: 5 },
    { name: 'post', label: 'عنوان پست', type: 'text', sortOrder: 6 },
    { name: 'drivingStatus', label: 'وضعيت راهبری', type: 'text', sortOrder: 7 },
    { name: 'birthDate', label: 'تاریخ تولد', type: 'text', sortOrder: 8 },
    { name: 'birthPlace', label: 'محل تولد', type: 'text', sortOrder: 9 },
    { name: 'issueDate', label: 'تاریخ صدور', type: 'text', sortOrder: 10 },
    { name: 'maritalStatus', label: 'وضعیت تاهل \r\n تعداد فرزند', type: 'text', sortOrder: 11 },
    { name: 'phone2', label: 'تلفن2', type: 'text', sortOrder: 12 },
    { name: 'phone3', label: 'تلفن3', type: 'text', sortOrder: 13 },
    { name: 'phone4', label: 'تلفن4', type: 'text', sortOrder: 14 },
    { name: 'education', label: 'اطلاعات \r\n تحصیلی', type: 'text', sortOrder: 15 },
    { name: 'hireDate', label: 'تاریخ استخدام \r\nگروه شغلی', type: 'text', sortOrder: 16 },
    { name: 'licenseDates', label: 'تاریخ پایه دو\r\nتاریخ پایه یک', type: 'text', sortOrder: 17 },
    { name: 'carSpecs', label: 'مشخصات \r\n خودرو', type: 'text', sortOrder: 18 },
    { name: 'insuranceNo', label: 'گروه خونی \r\nشماره بیمه', type: 'text', sortOrder: 19 },
    { name: 'address', label: 'آدرس پستی', type: 'text', sortOrder: 20 },
    { name: 'medicalExamValidity', label: 'اعتبار معاينه پزشكي', type: 'text', sortOrder: 21 },
    { name: 'startLocation', label: 'ايستگاه شروع', type: 'text', sortOrder: 22 },
    { name: 'driverPercent', label: 'درصد راهبر', type: 'text', sortOrder: 23 },
    { name: 'coDriverPercent', label: 'درصد كمك راهبري', type: 'text', sortOrder: 24 },
    { name: 'traineeDriverPercent', label: 'درصد راهبري آموزشي', type: 'text', sortOrder: 25 },
    { name: 'licenseClass1Date', label: 'تاریخ اخذ گواهینامه پایه1', type: 'text', sortOrder: 26 },
    { name: 'licenseClass2Date', label: 'تاریخ اخذ گواهینامه پایه2', type: 'text', sortOrder: 27 },
    { name: 'age', label: 'سن', type: 'text', sortOrder: 28 },
  ]

  for (const f of fields) {
    const existing = await prisma.customFieldDef.findFirst({
      where: { entityType: 'User', name: f.name }
    })
    if (!existing) {
      await prisma.customFieldDef.create({
        data: {
          entityType: 'User',
          name: f.name,
          label: f.label,
          type: f.type,
          options: f.options ? JSON.stringify(f.options) : Prisma.JsonNull,
          required: false,
          sortOrder: f.sortOrder,
        }
      })
    } else {
      await prisma.customFieldDef.update({
        where: { id: existing.id },
        data: {
          entityType: 'User',
          label: f.label,
          type: f.type,
          options: f.options ? JSON.stringify(f.options) : Prisma.JsonNull,
          sortOrder: f.sortOrder,
        }
      })
    }
  }

  // Also clean up any lowercase 'user' field definitions to prevent conflicts
  await prisma.customFieldDef.deleteMany({
    where: { entityType: 'user' }
  })
}
