import { z } from 'zod'

export const formFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'jalali_date',
  'time',
  'select',
  'multiselect',
  'radio',
  'checkbox',
  'file',
  'signature',
  'user',
  'train',
  'formula',
])

export const formFieldSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'نام فیلد باید فقط شامل حروف انگلیسی، اعداد و خط تیره یا زیرخط باشد'),
  label: z.string().min(1, 'برچسب فیلد الزامی است'),
  type: formFieldTypeSchema,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    maxLength: z.number().optional(),
    regex: z.string().optional(),
  }).optional(),
  visibleWhen: z.object({
    field: z.string(),
    equals: z.any(),
  }).optional(),
  formula: z.string().optional(),
})

export const formLayoutSectionSchema = z.object({
  section: z.string().min(1, 'عنوان بخش الزامی است'),
  fields: z.array(z.string()),
})

export const formVersionSchemaDef = z.object({
  fields: z.array(formFieldSchema),
  layout: z.array(formLayoutSectionSchema).optional(),
})

export const workflowStageSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  assignBy: z.enum(['role', 'user']),
  assignTo: z.string().min(1),
  actions: z.array(z.string()),
  sla: z.object({
    hours: z.number().positive(),
  }).optional(),
})

export const workflowTransitionSchema = z.object({
  from: z.string().optional(), // Omitted for the initial 'submit'
  on: z.string().min(1),
  to: z.string().min(1),
})

export const workflowRuleSchema = z.object({
  if: z.object({
    field: z.string(),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains']),
    value: z.any(),
  }),
  then: z.object({
    addStage: z.string().optional(),
    skipStage: z.string().optional(),
  }),
})

export const formWorkflowSchemaDef = z.object({
  stages: z.array(workflowStageSchema),
  transitions: z.array(workflowTransitionSchema),
  rules: z.array(workflowRuleSchema).optional(),
})

export const formAccessSchemaDef = z.object({
  whoCanSubmit: z.array(z.string()),
  whoCanView: z.array(z.string()),
  referableRoles: z.array(z.string()).optional(),
})

export const createFormTemplateSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/, 'کلید یکتا باید شامل حروف کوچک انگلیسی و خط تیره باشد'),
  title: z.string().min(1, 'عنوان فرم الزامی است'),
  description: z.string().optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  allowMobile: z.boolean().default(true),
})

export const createFormVersionSchema = z.object({
  schema: formVersionSchemaDef,
  workflow: formWorkflowSchemaDef,
  access: formAccessSchemaDef,
})

export const submitFormSchema = z.object({
  data: z.record(z.string(), z.any()),
  targetDate: z.string().datetime().optional().nullable(),
  amount: z.number().optional().nullable(),
})

export const approvalActionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'request_changes', 'refer']),
  note: z.string().optional(),
  referTo: z.string().optional(),
})

export type FormField = z.infer<typeof formFieldSchema>
export type FormLayoutSection = z.infer<typeof formLayoutSectionSchema>
export type FormVersionSchema = z.infer<typeof formVersionSchemaDef>
export type WorkflowStage = z.infer<typeof workflowStageSchema>
export type WorkflowTransition = z.infer<typeof workflowTransitionSchema>
export type WorkflowRule = z.infer<typeof workflowRuleSchema>
export type FormWorkflow = z.infer<typeof formWorkflowSchemaDef>
export type FormAccess = z.infer<typeof formAccessSchemaDef>
export type CreateFormTemplate = z.infer<typeof createFormTemplateSchema>
export type CreateFormVersion = z.infer<typeof createFormVersionSchema>
export type SubmitForm = z.infer<typeof submitFormSchema>
export type ApprovalAction = z.infer<typeof approvalActionSchema>
