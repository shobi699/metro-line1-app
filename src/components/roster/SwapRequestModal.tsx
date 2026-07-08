'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, ArrowLeftRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'

interface TripAssignment {
  id: string
  role: string
  matchedUserId: string | null
  trip: {
    id: string
    trainNumber: string | null
    departureTime: string
    direction: string
    rosterDay: {
      jalaliDate: string
    }
  }
}

interface SwapRequestModalProps {
  sourceAssignment: TripAssignment
  onClose: () => void
  onSuccess: () => void
}

export function SwapRequestModal({ sourceAssignment, onClose, onSuccess }: SwapRequestModalProps) {
  const [targetId, setTargetId] = useState<string>('')
  const [targetAssignmentId, setTargetAssignmentId] = useState<string>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [userAssignments, setUserAssignments] = useState<TripAssignment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch all users for selection
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/directory?role=operator')
        if (res.ok) {
          const json = await res.json()
          setUsers(json.data || [])
        }
      } catch (err) {
        console.error('Failed to load users', err)
      }
    }
    loadUsers()
  }, [])

  // When a user is selected, fetch their assignments for the same day
  useEffect(() => {
    if (!targetId) {
      setUserAssignments([])
      setTargetAssignmentId('')
      return
    }

    async function loadUserAssignments() {
      try {
        const jalaliDate = sourceAssignment.trip.rosterDay.jalaliDate
        const token = useAuthStore.getState().accessToken
        const res = await fetch(`/api/roster/day/${encodeURIComponent(jalaliDate)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const json = await res.json()
          const trips = json.data?.trips || []
          
          const assignments: TripAssignment[] = []
          trips.forEach((t: any) => {
            t.assignments.forEach((a: any) => {
              if (a.matchedUserId === targetId && a.role === sourceAssignment.role) {
                assignments.push({
                  ...a,
                  trip: t
                })
              }
            })
          })
          setUserAssignments(assignments)
          if (assignments.length > 0) {
            setTargetAssignmentId(assignments[0].id)
          } else {
            setTargetAssignmentId('')
          }
        }
      } catch (err) {
        console.error('Failed to load user assignments', err)
      }
    }

    loadUserAssignments()
  }, [targetId, sourceAssignment])

  async function handleSubmit() {
    if (!targetId || !targetAssignmentId) {
      setError('لطفاً همکار و شیفت هدف را انتخاب کنید.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/roster/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          sourceAssignmentId: sourceAssignment.id,
          targetAssignmentId,
          note
        })
      })

      const json = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(json.error || 'خطا در ثبت درخواست جابه‌جایی')
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-surface border border-outline-variant rounded-xl p-6 w-[450px] max-w-full shadow-2xl animate-in zoom-in duration-200">
        
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="size-5 text-accent" />
          <h3 className="text-sm font-bold text-foreground">درخواست جابه‌جایی شیفت</h3>
        </div>

        {success ? (
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
            <CheckCircle2 className="size-8 text-success mx-auto mb-2" />
            <div className="text-sm font-bold text-success mb-2">درخواست با موفقیت ثبت شد!</div>
            <p className="text-xs text-success/80 mb-4">
              درخواست شما با موفقیت از طریق موتور ایمنی بررسی شد و در انتظار تایید سرشیفت قرار گرفت.
            </p>
            <button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="px-4 py-2 bg-success text-success-foreground rounded font-bold text-xs"
            >
              بستن
            </button>
          </div>
        ) : (
          <>
            <div className="bg-surface-container-low border border-outline-variant rounded p-3 mb-4">
              <div className="text-[10px] text-foreground-muted mb-1">شیفت مبدا (شما):</div>
              <div className="font-bold text-xs text-foreground font-mono">
                قطار {sourceAssignment.trip.trainNumber || '---'} | ساعت {sourceAssignment.trip.departureTime} | نقش {sourceAssignment.role}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-foreground-muted mb-1">همکار جایگزین:</label>
                <select
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">انتخاب کنید...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {targetId && (
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1">سفر جایگزین (جهت تبادل):</label>
                  {userAssignments.length > 0 ? (
                    <select
                      className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-foreground font-mono outline-none"
                      value={targetAssignmentId}
                      onChange={(e) => setTargetAssignmentId(e.target.value)}
                      disabled={loading}
                    >
                      {userAssignments.map(a => (
                        <option key={a.id} value={a.id}>
                          قطار {a.trip.trainNumber || '---'} | ساعت {a.trip.departureTime}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-critical bg-critical/10 p-2 rounded">
                      این شخص سفر مشابهی در این روز برای جابه‌جایی ندارد.
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground-muted mb-1">یادداشت برای سرشیفت:</label>
                <textarea
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none"
                  rows={2}
                  placeholder="دلیل جابه‌جایی را بنویسید..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-critical/10 border border-critical/30 rounded-lg p-3 text-critical flex items-start gap-2 mb-4 text-xs font-bold">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-foreground-muted hover:text-foreground transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !targetId || !targetAssignmentId}
                className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                بررسی قوانین و ثبت
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
