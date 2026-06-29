import { z } from 'zod'
import { nationalIdSchema, passwordSchema, phoneSchema, emailSchema } from './common'

export const loginSchema = z.object({
  nationalId: nationalIdSchema,
  password: z.string().min(1, 'رمز عبور الزامی است'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  nationalId: nationalIdSchema,
  name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد'),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>

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
  nationalId: nationalIdSchema,
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است'),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>

export const verifyOtpSchema = z.object({
  nationalId: nationalIdSchema,
  code: z
    .string()
    .length(6, 'کد تایید باید ۶ رقم باشد')
    .regex(/^\d+$/, 'کد تایید فقط شامل اعداد باشد'),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'توکن بازنشانی الزامی است'),
  password: passwordSchema,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
