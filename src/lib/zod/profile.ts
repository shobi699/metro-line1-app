import { z } from 'zod'

export const updateProfileSchema = z.object({
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal('')),
  availability: z
    .enum(['online', 'busy', 'on_shift', 'offline'])
    .optional(),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'کد رنگ نامعتبر است')
    .optional()
    .or(z.literal('')),
  carPlate: z
    .string()
    .max(50, 'پلاک خودرو بسیار طولانی است')
    .optional()
    .or(z.literal('')),
  avatar: z
    .string()
    .url('آدرس آواتار نامعتبر است')
    .optional()
    .or(z.literal('')),
  personnelNo: z
    .string()
    .min(3, 'شماره پرسنلی حداقل ۳ رقم باشد')
    .max(20, 'شماره پرسنلی حداکثر ۲۰ رقم باشد')
    .regex(/^\d+$/, 'شماره پرسنلی فقط شامل اعداد باشد')
    .optional()
    .or(z.literal('')),
  group: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
  phone2: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل ۲ نامعتبر است')
    .optional()
    .or(z.literal('')),
  carPlateNum1: z.string().optional().or(z.literal('')),
  carPlateLetter: z.string().optional().or(z.literal('')),
  carPlateNum2: z.string().optional().or(z.literal('')),
  carPlateCity: z.string().optional().or(z.literal('')),
  carType: z.string().optional().or(z.literal('')),
  carColor: z.string().optional().or(z.literal('')),
  carLicenseExpiry: z.string().optional().or(z.literal('')),
  fatherName: z.string().optional().or(z.literal('')),
  idNumber: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  age: z.string().optional().or(z.literal('')),
  birthPlace: z.string().optional().or(z.literal('')),
  maritalStatus: z.string().optional().or(z.literal('')),
  insuranceNo: z.string().optional().or(z.literal('')),
  education: z.string().optional().or(z.literal('')),
  post: z.string().optional().or(z.literal('')),
  shift: z.string().optional().or(z.literal('')),
  shiftType: z.string().optional().or(z.literal('')),
  startLocation: z.string().optional().or(z.literal('')),
  hireDate: z.string().optional().or(z.literal('')),
  drivingStatus: z.string().optional().or(z.literal('')),
  licenseClass1Date: z.string().optional().or(z.literal('')),
  licenseClass2Date: z.string().optional().or(z.literal('')),
  medicalExamValidity: z.string().optional().or(z.literal('')),
  driverPercent: z.string().optional().or(z.literal('')),
  coDriverPercent: z.string().optional().or(z.literal('')),
  traineeDriverPercent: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  phone3: z.string().optional().or(z.literal('')),
  phone4: z.string().optional().or(z.literal('')),
  additionalPhones: z.array(z.string()).optional(),
  vehicles: z.array(z.object({
    id: z.string(),
    plateNum1: z.string(),
    plateLetter: z.string(),
    plateNum2: z.string(),
    plateCity: z.string(),
    carPlate: z.string(),
    carType: z.string(),
    carColor: z.string(),
    carLicenseExpiry: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  })).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const notificationSettingsSchema = z.object({
  circulars: z.boolean(),
  chat: z.boolean(),
  shifts: z.boolean(),
})

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
