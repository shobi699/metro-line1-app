'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, TriangleAlert, ArrowLeftRight } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { jdate, dayjs } from '@/lib/dayjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { SHIFT_META, type CalendarDay, type PersonalEventInput } from '../types'

interface DayDrawerProps {
  day: CalendarDay | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEvent: (input: PersonalEventInput) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
  onToggleTask: (id: string, isDone: boolean) => void
}

type QuickAddType = 'event' | 'task'

export function DayDrawer({
  day,
  open,
  onOpenChange,
  onAddEvent,
  onDeleteEvent,
  onToggleTask,
}: DayDrawerProps) {
  const [title, setTitle] = useState('')
  const [addType, setAddType] = useState<QuickAddType>('event')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!day) return null

  const meta = day.shift ? SHIFT_META[day.shift.code] : null
  const jalaliLabel = toFa(jdate(day.date).format('dddd D MMMM YYYY'))
  const gregorianLabel = dayjs(day.date).locale('en').format('D MMM YYYY')

  async function submitQuickAdd() {
    if (!day || title.trim().length === 0) return
    setSaving(true)
    setFormError(null)
    try {
      await onAddEvent({
        type: addType,
        title: title.trim(),
        startAt: `${day.date}T00:00:00.000Z`,
        allDay: true,
      })
      setTitle('')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'ثبت انجام نشد — دوباره تلاش کنید')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{jalaliLabel}</SheetTitle>
          <SheetDescription>
            <bdi dir="ltr">{gregorianLabel}</bdi>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {meta && day.shift ? (
            <div className={cn('rounded-lg border p-3', meta.chipClass)}>
              <div className="flex items-center gap-2 font-semibold">
                <span aria-hidden>{meta.icon}</span>
                <span>شیفت {meta.label}</span>
              </div>
              {day.shift.startTime && (
                <div className="mt-1 font-data-mono text-sm" dir="ltr">
                  {toFa(day.shift.startTime)}–{toFa(day.shift.endTime)}
                </div>
              )}
              {day.shift.forecast && (
                <div className="mt-1 text-xs opacity-80">پیش‌بینی سیکل — لوحه هنوز منتشر نشده</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border-subtle p-3 text-sm text-foreground-muted">
              شیفتی ثبت نشده است
            </div>
          )}

          {day.holidays.length > 0 && (
            <div className="rounded-lg border border-critical/30 bg-critical/5 p-3 text-sm text-critical">
              {day.holidays.map((h) => h.title).join('، ')}
            </div>
          )}

          {day.orgEvents.length > 0 && (
            <ul className="space-y-1.5">
              {day.orgEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="text-evt-org" aria-hidden>
                    ◆
                  </span>
                  <span className="truncate">{e.title}</span>
                  {e.mandatory && (
                    <span className="rounded bg-critical/10 px-1.5 py-0.5 text-[10px] text-critical">
                      الزامی
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {(day.meetings ?? []).length > 0 && (
            <ul className="space-y-2">
              <h3 className="text-sm font-medium text-sky-500">جلسات</h3>
              {(day.meetings ?? []).map((m) => {
                const statusText = m.status === 'approved' ? 'تایید شده' : m.status === 'pending' ? 'در انتظار' : m.status
                return (
                  <li key={m.id} className="flex flex-col gap-1 rounded bg-sky-500/10 p-2 text-sm border border-sky-500/20">
                    <div className="flex items-center gap-2 font-medium text-sky-500">
                      <span aria-hidden>👥</span>
                      <span>{m.title}</span>
                    </div>
                    <div className="flex justify-between text-xs text-foreground-muted">
                      <span>{m.role === 'host' ? 'شما میزبان هستید' : 'شما درخواست دادید'}</span>
                      <span>{statusText}</span>
                    </div>
                    <div className="font-data-mono text-xs text-foreground" dir="ltr">
                      {toFa(dayjs(m.startAt).format('HH:mm'))}
                      {m.endAt ? ` - ${toFa(dayjs(m.endAt).format('HH:mm'))}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="space-y-1.5">
            <h3 className="text-sm font-medium text-foreground-muted">رویدادها و کارها</h3>
            {day.events.length === 0 ? (
              <p className="text-sm text-foreground-muted">روز آزاد شماست ✨ رویدادی اضافه کنید.</p>
            ) : (
              <ul className="space-y-1">
                {day.events.map((e) => (
                  <li
                    key={e.id}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle px-2 text-sm"
                  >
                    {e.type === 'task' ? (
                      <input
                        type="checkbox"
                        checked={e.isDone}
                        onChange={(ev) => onToggleTask(e.id, ev.target.checked)}
                        aria-label={`انجام شد: ${e.title}`}
                        className="size-4 accent-[var(--evt-task)]"
                      />
                    ) : (
                      <span
                        className={cn(
                          'size-2 shrink-0 rounded-full',
                          e.type === 'birthday' ? 'bg-shift-evening' : 'bg-evt-personal',
                        )}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        'flex-1 truncate',
                        e.type === 'task' && e.isDone && 'text-foreground-muted line-through',
                      )}
                    >
                      {e.title}
                    </span>
                    {!e.occurrence && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`حذف ${e.title}`}
                        onClick={() => onDeleteEvent(e.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 border-t border-border-subtle pt-3">
            {meta && day.shift && day.shift.code !== 'off' && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <TriangleAlert className="size-3.5 shrink-0 text-warning" aria-hidden />
                  <span>
                    این روز شیفت {meta.label} هستید
                    {day.shift.startTime
                      ? ` (${toFa(day.shift.startTime)}–${toFa(day.shift.endTime)})`
                      : ''}
                  </span>
                </span>
                <Link
                  href="/swap/inbox"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 transition-colors hover:bg-surface-hover"
                >
                  <ArrowLeftRight className="size-3" aria-hidden />
                  درخواست تعویض
                </Link>
              </div>
            )}
            <div className="flex gap-1.5" role="radiogroup" aria-label="نوع مورد جدید">
              {(
                [
                  { key: 'event', label: 'رویداد' },
                  { key: 'task', label: 'کار' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={addType === t.key}
                  onClick={() => setAddType(t.key)}
                  className={cn(
                    'min-h-9 rounded-full border px-3 text-xs transition-colors',
                    addType === t.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-foreground-muted hover:bg-surface-hover',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQuickAdd()
                }}
                placeholder={addType === 'task' ? 'کار جدید…' : 'رویداد جدید…'}
                aria-label="عنوان مورد جدید"
              />
              <Button onClick={submitQuickAdd} disabled={saving || title.trim().length === 0}>
                {saving ? '…' : 'افزودن'}
              </Button>
            </div>
            {formError && <p className="text-xs text-critical">{formError}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
