import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'

export async function exportUsersToExcel(): Promise<ArrayBuffer> {
  const users = await prisma.user.findMany({
    select: {
      nationalId: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      customFields: true,
      role: { select: { key: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'ردیف',
    'نام',
    'نام خانوادگی',
    'کد پرسنلی',
    'شماره شناسنامه',
    'کد ملی',
    'نام پدر',
    'نوع شيفت',
    'نام شيفت',
    'كد گروه راهبري',
    'عنوان پست',
    'وضعيت راهبری',
    'تاریخ تولد',
    'محل تولد',
    'تاریخ صدور',
    'وضعیت تاهل \r\n تعداد فرزند',
    'تلفن1',
    'تلفن2',
    'تلفن3',
    'تلفن4',
    'اطلاعات \r\n تحصیلی',
    'تاریخ استخدام \r\nگروه شغلی',
    'تاریخ پایه دو\r\nتاریخ پایه یک',
    'مشخصات \r\n خودرو',
    'گروه خونی \r\nشماره بیمه',
    'آدرس پستی',
    'اعتبار معاينه پزشكي',
    'ايستگاه شروع',
    'درصد راهبر',
    'درصد كمك راهبري',
    'درصد راهبري آموزشي',
    'تاریخ اخذ گواهینامه پایه1',
    'تاریخ اخذ گواهینامه پایه2',
    'سن',
  ]

  const rows = users.map((u, index) => {
    const nameParts = u.name.split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ')
    const cf = (u.customFields as Record<string, unknown> | null) || {}

    const getVal = (key: string, defaultValue = '') => {
      const val = cf[key]
      if (val === undefined || val === null || val === '') return defaultValue
      if (typeof val === 'boolean') return val ? 'بله' : 'خیر'
      return String(val)
    }

    const post = getVal('post') || u.role.name || ''
    const statusText = u.status === 'active' ? 'فعال' : u.status === 'suspended' ? 'معلق' : 'در حال بررسی'

    return [
      index + 1,                   // ردیف
      firstName,                   // نام
      lastName,                    // نام خانوادگی
      getVal('personnelNo'),       // کد پرسنلی
      getVal('idNumber'),          // شماره شناسنامه
      u.nationalId,                // کد ملی
      getVal('fatherName'),        // نام پدر
      getVal('shiftType'),         // نوع شيفت
      getVal('shift'),             // نام شيفت
      getVal('group'),             // كد گروه راهبري
      post,                        // عنوان پست
      statusText,                  // وضعيت راهبری
      getVal('birthDate'),         // تاریخ تولد
      getVal('birthPlace'),        // محل تولد
      getVal('issueDate'),         // تاریخ صدور
      getVal('maritalStatus'),     // وضعیت تاهل تعداد فرزند
      u.phone ?? '',               // تلفن1
      getVal('phone2'),            // تلفن2
      getVal('phone3'),            // تلفن3
      getVal('phone4'),            // تلفن4
      getVal('education'),         // اطلاعات تحصیلی
      getVal('hireDate'),          // تاریخ استخدام گروه شغلی
      getVal('licenseDates'),      // تاریخ پایه دو تاریخ پایه یک
      getVal('carSpecs'),          // مشخصات خودرو
      getVal('insuranceNo'),       // گروه خونی شماره بیمه
      getVal('address'),           // آدرس پستی
      getVal('medicalExamValidity'),// اعتبار معاينه پزشكي
      getVal('startLocation'),     // ايستگاه شروع
      getVal('driverPercent'),     // درصد راهبر
      getVal('coDriverPercent'),   // درصد كمك راهبري
      getVal('traineeDriverPercent'),// درصد راهبري آموزشي
      getVal('licenseClass1Date'), // تاریخ اخذ گواهینامه پایه1
      getVal('licenseClass2Date'), // تاریخ اخذ گواهینامه پایه2
      getVal('age'),               // سن
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'کاربران')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
