import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

const PRESETS = [
  {
    key: 'overtime-request',
    title: 'درخواست اضافه کار',
    description: 'ثبت و تایید ساعات اضافه کاری پرسنل سیر و حرکت خط ۱.',
    category: 'منابع انسانی',
    icon: 'Clock',
    schema: {
      fields: [
        { name: 'date', label: 'تاریخ اضافه کار', type: 'jalali_date', required: true },
        { name: 'hours', label: 'تعداد ساعت', type: 'number', required: true, validation: { min: 1, max: 8 } },
        { name: 'shiftType', label: 'نوع شیفت', type: 'select', options: ['روزکار', 'شب‌کار', 'روز تعطیل'], required: true },
        { name: 'reason', label: 'علت و تشریح ضرورت اضافه کار', type: 'textarea', required: true },
      ],
      layout: [
        { section: 'مشخصات درخواست', fields: ['date', 'hours', 'shiftType'] },
        { section: 'توضیحات ضرورت کاری', fields: ['reason'] },
      ],
    },
    workflow: {
      stages: [
        { key: 'supervisor', title: 'تایید سرشیفت کشیک', assignBy: 'role', assignTo: 'supervisor', actions: ['approve', 'reject', 'request_changes', 'refer'], sla: { hours: 24 } },
        { key: 'hr', title: 'تایید رئیس منابع انسانی', assignBy: 'role', assignTo: 'manager', actions: ['approve', 'reject', 'refer'], sla: { hours: 48 } },
      ],
      transitions: [
        { on: 'submit', to: 'supervisor' },
        { from: 'supervisor', on: 'approve', to: 'hr' },
        { from: 'supervisor', on: 'reject', to: 'END_REJECTED' },
        { from: 'supervisor', on: 'request_changes', to: 'BACK_TO_SUBMITTER' },
        { from: 'hr', on: 'approve', to: 'END_APPROVED' },
        { from: 'hr', on: 'reject', to: 'END_REJECTED' },
      ],
      rules: [
        {
          if: { field: 'hours', operator: 'gt', value: 4 },
          then: { addStage: 'manager' }, // تاییدیه مدیر در صورت ساعت اضافهکار زیاد
        },
      ],
    },
    access: {
      whoCanSubmit: ['operator', 'driver', 'shift_lead'],
      whoCanView: ['supervisor', 'manager'],
      referableRoles: ['safety', 'dispatch_tech'],
    },
  },
  {
    key: 'leave-request',
    title: 'درخواست مرخصی ساعتی/روزانه',
    description: 'ثبت درخواست مرخصی استحقاقی پرسنل خط ۱.',
    category: 'منابع انسانی',
    icon: 'Calendar',
    schema: {
      fields: [
        { name: 'leaveType', label: 'نوع مرخصی', type: 'select', options: ['استحقاقی', 'استعلاجی', 'بدون حقوق'], required: true },
        { name: 'startDate', label: 'تاریخ شروع', type: 'jalali_date', required: true },
        { name: 'days', label: 'تعداد روز', type: 'number', required: true, validation: { min: 1, max: 30 } },
        { name: 'reason', label: 'علت مرخصی', type: 'textarea', required: false },
      ],
      layout: [
        { section: 'اطلاعات زمان مرخصی', fields: ['leaveType', 'startDate', 'days'] },
        { section: 'توضیحات متقاضی', fields: ['reason'] },
      ],
    },
    workflow: {
      stages: [
        { key: 'supervisor', title: 'تایید سرپرست خط', assignBy: 'role', assignTo: 'supervisor', actions: ['approve', 'reject', 'request_changes'], sla: { hours: 24 } },
        { key: 'hr', title: 'بررسی کارگزینی', assignBy: 'role', assignTo: 'manager', actions: ['approve', 'reject'], sla: { hours: 24 } },
      ],
      transitions: [
        { on: 'submit', to: 'supervisor' },
        { from: 'supervisor', on: 'approve', to: 'hr' },
        { from: 'supervisor', on: 'reject', to: 'END_REJECTED' },
        { from: 'supervisor', on: 'request_changes', to: 'BACK_TO_SUBMITTER' },
        { from: 'hr', on: 'approve', to: 'END_APPROVED' },
        { from: 'hr', on: 'reject', to: 'END_REJECTED' },
      ],
    },
    access: {
      whoCanSubmit: ['*'],
      whoCanView: ['supervisor', 'manager'],
    },
  },
  {
    key: 'safety-report',
    title: 'گزارش رویداد و حادثه ایمنی',
    description: 'ثبت فوری حوادث، سوانح و شبه‌حوادث رخ داده در ایستگاه‌ها یا حریم ریلی.',
    category: 'ایمنی',
    icon: 'AlertTriangle',
    schema: {
      fields: [
        { name: 'title', label: 'عنوان رویداد/حادثه', type: 'text', required: true },
        { name: 'date', label: 'تاریخ وقوع سانحه', type: 'jalali_date', required: true },
        { name: 'time', label: 'ساعت دقیق وقوع', type: 'time', required: true },
        { name: 'location', label: 'موقعیت دقیق وقوع (کیلومتراژ / ایستگاه)', type: 'text', required: true },
        { name: 'description', label: 'شرح عینی رویداد', type: 'textarea', required: true },
        { name: 'injury', label: 'آیا رویداد مصدومیت داشته است؟', type: 'checkbox', required: false },
        { name: 'attachment', label: 'تصویر صحنه حادثه (پیوست)', type: 'file', required: false },
      ],
      layout: [
        { section: 'زمان و مکان سانحه', fields: ['title', 'date', 'time', 'location'] },
        { section: 'شرح جزئیات و آسیب‌ها', fields: ['description', 'injury', 'attachment'] },
      ],
    },
    workflow: {
      stages: [
        { key: 'safety_officer', title: 'بررسی افسر ایمنی خط', assignBy: 'role', assignTo: 'supervisor', actions: ['approve', 'reject', 'refer'], sla: { hours: 12 } },
        { key: 'safety_manager', title: 'اقدام نهایی رئیس ایمنی', assignBy: 'role', assignTo: 'manager', actions: ['approve', 'reject'], sla: { hours: 24 } },
      ],
      transitions: [
        { on: 'submit', to: 'safety_officer' },
        { from: 'safety_officer', on: 'approve', to: 'safety_manager' },
        { from: 'safety_officer', on: 'reject', to: 'END_REJECTED' },
        { from: 'safety_manager', on: 'approve', to: 'END_APPROVED' },
        { from: 'safety_manager', on: 'reject', to: 'END_REJECTED' },
      ],
    },
    access: {
      whoCanSubmit: ['*'],
      whoCanView: ['supervisor', 'manager'],
      referableRoles: ['dispatch_tech', 'chief'],
    },
  },
]

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  return NextResponse.json({ data: PRESETS })
}
