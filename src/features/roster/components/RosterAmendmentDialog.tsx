'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface RosterAmendmentDialogProps {
  isOpen: boolean
  onClose: () => void
  rosterDayId: string
  tripId?: string
  assignmentId?: string
  trainNumber?: string
  currentRole?: string
  onSuccess: () => void
}

export function RosterAmendmentDialog({
  isOpen,
  onClose,
  rosterDayId,
  tripId,
  assignmentId,
  trainNumber,
  currentRole,
  onSuccess
}: RosterAmendmentDialogProps) {
  const [kind, setKind] = useState<'crew_changed' | 'time_changed' | ''>('')
  const [reason, setReason] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!kind || !reason) {
      toast.error('نوع اصلاحیه و علت آن الزامی است.')
      return
    }

    setIsSubmitting(true)
    try {
      let payloadValue: any = null
      
      if (kind === 'crew_changed') {
        // Just mocking personnel NO or new Name for now based on simple text input
        payloadValue = { rawName: newValue, matchedUserId: null } 
      } else if (kind === 'time_changed') {
        payloadValue = { departureTime: newValue, arrivalTime: newValue }
      }

      const res = await fetch('/api/roster/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rosterDayId,
          kind,
          tripId,
          assignmentId,
          newValue: payloadValue,
          reason
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در ثبت اصلاحیه')

      toast.success('اصلاحیه با موفقیت ثبت و تقویم بروزرسانی شد.')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'خطا در ثبت اصلاحیه')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت اصلاحیه قطار {trainNumber || '—'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>نوع اصلاحیه</Label>
            <Select value={kind} onValueChange={(val: any) => setKind(val)}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crew_changed">تغییر راهبر / سمت</SelectItem>
                <SelectItem value="time_changed">تغییر زمان حرکت / رسیدن</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === 'crew_changed' && (
            <div className="grid gap-2">
              <Label>نام راهبر جدید (برای جایگزینی {currentRole})</Label>
              <Input 
                value={newValue} 
                onChange={e => setNewValue(e.target.value)}
                placeholder="مثلا: احمدی"
              />
            </div>
          )}

          {kind === 'time_changed' && (
            <div className="grid gap-2">
              <Label>ساعت جدید (HH:MM:SS)</Label>
              <Input 
                value={newValue} 
                onChange={e => setNewValue(e.target.value)}
                placeholder="14:30:00"
                dir="ltr"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>علت اصلاحیه</Label>
            <Input 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="مثلا: تاخیر راهبر به علت ترافیک، خرابی ناوگان..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>انصراف</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>ثبت و انتشار بلادرنگ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
