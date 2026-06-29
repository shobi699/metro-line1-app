import { z } from 'zod'

export const nationalIdSchema = z
  .string()
  .length(10, 'کد ملی باید ۱۰ رقم باشد')
  .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد')

export const phoneSchema = z
  .string()
  .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
  .optional()
  .or(z.literal(''))

export const emailSchema = z
  .string()
  .email('ایمیل نامعتبر است')
  .optional()
  .or(z.literal(''))

export const passwordSchema = z
  .string()
  .min(6, 'رمز عبور حداقل ۶ کاراکتر باشد')
  .max(128, 'رمز عبور حداکثر ۱۲۸ کاراکتر باشد')
