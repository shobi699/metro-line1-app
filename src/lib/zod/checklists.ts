import { z } from 'zod'

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'متن سوال الزامی است'),
  required: z.boolean().default(true),
  type: z.enum(['boolean', 'text', 'number']).default('boolean')
})

export const createChecklistTemplateSchema = z.object({
  name: z.string().min(3, 'نام چک‌لیست باید حداقل ۳ کاراکتر باشد'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(checklistItemSchema).min(1, 'حداقل یک آیتم برای چک‌لیست الزامی است')
})

export const submitChecklistRecordSchema = z.object({
  templateId: z.string(),
  trainId: z.string().optional().nullable(),
  stationId: z.string().optional().nullable(),
  geoLocation: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean().optional(),
    value: z.string().optional(),
    note: z.string().optional().nullable()
  }))
})

export type ChecklistItem = z.infer<typeof checklistItemSchema>
export type CreateChecklistTemplate = z.infer<typeof createChecklistTemplateSchema>
export type SubmitChecklistRecord = z.infer<typeof submitChecklistRecordSchema>
