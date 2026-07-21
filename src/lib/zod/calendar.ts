import { z } from 'zod'

/** بازه تاریخ میلادی YYYY-MM-DD برای endpoint تجمیعی تقویم */
export const calendarRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'قالب تاریخ شروع نامعتبر است'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'قالب تاریخ پایان نامعتبر است'),
  layers: z.string().optional(), // comma-separated: shift,holidays,personal,org
})

export type CalendarRangeInput = z.infer<typeof calendarRangeSchema>

export const personalEventSchema = z
  .object({
    type: z.enum(['event', 'birthday', 'task', 'note', 'work_log', 'financial', 'on_call', 'overtime', 'leave_sick', 'leave_daily', 'leave_hourly', 'reminder', 'other']).default('event'),
    title: z.string().min(1, 'عنوان الزامی است').max(200, 'عنوان حداکثر ۲۰۰ کاراکتر باشد'),
    description: z.string().max(2000).optional(),
    startAt: z.string().min(1, 'تاریخ شروع الزامی است'),
    endAt: z.string().optional(),
    allDay: z.boolean().default(true),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'رنگ نامعتبر است')
      .optional(),
    location: z.string().max(300).optional(),
    recurrence: z
      .object({
        freq: z.enum(['yearly', 'monthly', 'weekly', 'daily']),
        interval: z.number().int().min(1).default(1),
        until: z.string().optional(),
        jalali: z.boolean().default(true),
      })
      .optional(),
    reminders: z
      .array(z.object({ minutesBefore: z.number().int().min(0).max(43200) }))
      .max(5, 'حداکثر ۵ یادآور مجاز است')
      .optional(),
    isPrivate: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type PersonalEventInput = z.infer<typeof personalEventSchema>

export const personalEventUpdateSchema = personalEventSchema.partial().extend({
  isDone: z.boolean().optional(),
})

export type PersonalEventUpdateInput = z.infer<typeof personalEventUpdateSchema>

const layerToggleSchema = z.object({ on: z.boolean(), color: z.string().optional() })

export const calendarPreferenceSchema = z
  .object({
    layers: z
      .object({
        shift: layerToggleSchema.optional(),
        holidays: layerToggleSchema.optional(),
        personal: layerToggleSchema.optional(),
        org: layerToggleSchema.optional(),
        tasks: layerToggleSchema.optional(),
      })
      .optional(),
    defaultView: z.enum(['month', 'week', 'agenda']).optional(),
    weekStart: z.enum(['saturday', 'monday']).optional(),
    widgetConfig: z.record(z.string(), z.unknown()).optional(),
    quickAddDefaults: z.any().optional(),
  })
  .strict()

export type CalendarPreferenceInput = z.infer<typeof calendarPreferenceSchema>

export const holidaySchema = z
  .object({
    jalaliDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'قالب تاریخ جلالی نامعتبر است (۱۴۰۵-۰۱-۰۱)'),
    title: z.string().min(1, 'عنوان الزامی است').max(200),
    kind: z.enum(['official', 'religious', 'occasion']).default('official'),
    isOffDay: z.boolean().default(true),
    recurring: z.boolean().default(true),
    hijriBased: z.boolean().default(false),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'رنگ نامعتبر است')
      .optional(),
    isActive: z.boolean().default(true),
  })
  .strict()

export type HolidayInput = z.infer<typeof holidaySchema>

export const holidayUpdateSchema = holidaySchema.partial()
export type HolidayUpdateInput = z.infer<typeof holidayUpdateSchema>

export const orgEventAdminSchema = z
  .object({
    title: z.string().min(1, 'عنوان الزامی است').max(200),
    description: z.string().max(2000).optional(),
    startAt: z.string().min(1, 'تاریخ شروع الزامی است'),
    endAt: z.string().optional(),
    allDay: z.boolean().default(true),
    audience: z
      .object({
        roles: z.array(z.string()).optional(),
        groups: z.array(z.string()).optional(),
        userIds: z.array(z.string()).optional(),
      })
      .default({}),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'رنگ نامعتبر است')
      .optional(),
    mandatory: z.boolean().default(false),
  })
  .strict()

export type OrgEventAdminInput = z.infer<typeof orgEventAdminSchema>

export const orgEventAdminUpdateSchema = orgEventAdminSchema.partial().extend({
  isActive: z.boolean().optional(),
})
export type OrgEventAdminUpdateInput = z.infer<typeof orgEventAdminUpdateSchema>
