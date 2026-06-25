import { z } from 'zod'

export const registerSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد'),
  name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد'),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal('')),
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'رمز عبور حداقل ۶ کاراکتر باشد')
    .max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر باشد'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'توکن تازه‌سازی الزامی است'),
})

export type RefreshInput = z.infer<typeof refreshSchema>

export const approveUserSchema = z.object({
  userId: z.string().cuid('شناسه کاربر نامعتبر است'),
  roleKey: z.enum(['admin', 'operator'], {
    error: 'نقش معتبر انتخاب کنید',
  }),
})

export type ApproveUserInput = z.infer<typeof approveUserSchema>

export const sendOtpSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد'),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است'),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>

export const verifyOtpSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد'),
  code: z
    .string()
    .length(6, 'کد تایید باید ۶ رقم باشد')
    .regex(/^\d+$/, 'کد تایید فقط شامل اعداد باشد'),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'توکن بازنشانی الزامی است'),
  password: z
    .string()
    .min(6, 'رمز عبور حداقل ۶ کاراکتر باشد')
    .max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر باشد'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

