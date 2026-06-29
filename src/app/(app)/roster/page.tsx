'use client'

import { useState, useEffect } from 'react'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  Loader2,
  UserCheck,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Shield,
  MessageSquare
} from 'lucide-react'

interface TripAssignment {
  id: string
  role: 'H1' | 'H2' | 'T' | 'R'
  rawName: string | null
  matchedUserId: string | null
  personnelNo: string | null
  matchStatus: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  matchedUser?: {
    name: string
  }
}

interface Trip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  operationalNote: string | null
  status: string
  assignments: TripAssignment[]
}

interface RosterDay {
  id: string
  jalaliDate: string
  gregorianDate: string
  title: string
  schedulingTitle: string
  status: string
  versionNo: number
}

interface RosterStats {
  totalTrips: number
  acknowledgedCount: number
  readyCount: number
  disputeCount: number
  unassignedCount: number
}

interface UserSummary {
  id: string
  name: string
}

export default function FullRosterPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [dataDate, setDataDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [rosterDay, setRosterDay] = useState<RosterDay | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [stats, setStats] = useState<RosterStats>({
    totalTrips: 0,
    acknowledgedCount: 0,
    readyCount: 0,
    disputeCount: 0,
    unassignedCount: 0
  })

  // Dropdown list of users for reassignments (admin only)
  const [allUsers, setAllUsers] = useState<UserSummary[]>([])
  const [activeDirectionTab, setActiveDirectionTab] = useState<'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'>('SHAHRREY_TO_TAJRISH')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Operational note / delay modal states (admin only)
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  const [targetTripId, setTargetTripId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [tripStatusVal, setTripStatusVal] = useState('NORMAL')

  async function loadRoster() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/supervisor/roster/today?date=${dataDate}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRosterDay(json.data.rosterDay)
        setTrips(json.data.trips)
        setIssues(json.data.issues)
        setStats(json.data.stats)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    if (!accessToken || !isAdmin) return
    try {
      const res = await fetch('/api/users?pageSize=200', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setAllUsers(json.data?.users || [])
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadRoster()
      void loadUsers()
    }
  }, [accessToken, dataDate])

  // Supervisor handler to manually reassign a driver
  async function handleReassign(assignmentId: string, matchedUserId: string) {
    if (!accessToken || !isAdmin) return
    setActionLoading(assignmentId)
    try {
      const res = await fetch(`/api/trips/${assignmentId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ matchedUserId })
      })
      if (res.ok) {
        await loadRoster()
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  // Supervisor handler to add comment/delay
  async function handleCommentSubmit() {
    if (!accessToken || !targetTripId || !isAdmin) return
    try {
      const res = await fetch(`/api/trips/${targetTripId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          operationalNote: commentText.trim(),
          status: tripStatusVal
        })
      })
      if (res.ok) {
        setCommentModalVisible(false)
        setCommentText('')
        setTargetTripId(null)
        await loadRoster()
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full" dir="rtl">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Calendar className="size-6 text-accent" />
            لوحه اعزام روزانه خط ۱ مترو تهران
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مشاهده کل سفرهای زمان‌بندی شده، زمان خروج و آمادگی کابین‌ها
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-lg shadow-inner">
          <span className="text-xs text-foreground-muted">تاریخ مشاهده:</span>
          <input
            type="date"
            value={dataDate}
            onChange={(e) => setDataDate(e.target.value)}
            className="bg-transparent border-none text-xs text-foreground outline-none cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-accent mb-4" />
          <p className="text-sm text-foreground-muted">در حال بارگذاری کل جدول لوحه روزانه...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-xl flex flex-col justify-center items-center p-12 text-center min-h-[300px]">
          <Calendar className="size-12 text-foreground-muted mb-4" />
          <h3 className="text-base font-bold text-foreground">لوحه اعزامی یافت نشد</h3>
          <p className="text-xs text-foreground-muted max-w-sm mt-2">
            برای تاریخ انتخابی هنوز لوحه‌ای بارگذاری یا منتشر نشده است.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Statistical Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'کل سفرهای اعزامی', value: stats.totalTrips, icon: Clock, color: 'text-accent' },
              { label: 'رؤیت‌شده توسط راهبران', value: stats.acknowledgedCount, icon: CheckCircle2, color: 'text-success' },
              { label: 'آماده خروج در کابین', value: stats.readyCount, icon: UserCheck, color: 'text-info' },
              { label: 'مغایرت‌ها / تاخیرها', value: stats.disputeCount, icon: AlertTriangle, color: 'text-warning' },
              { label: 'سفرهای بدون راننده', value: stats.unassignedCount, icon: Shield, color: 'text-critical' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center text-foreground-muted">
                  <span className="text-[10px] font-medium">{stat.label}</span>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
                <span className="text-xl font-bold font-mono text-foreground">{toFa(stat.value)}</span>
              </div>
            ))}
          </div>

          {/* Safety Warnings & Conflicts Alert Box */}
          {issues && issues.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-warning flex items-center gap-1.5 mb-2">
                <AlertTriangle className="size-4 animate-bounce" />
                تداخل‌های زمانی و هشدارهای خستگی شناسایی شده:
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {issues.map((issue, idx) => (
                  <div key={idx} className="text-xs text-foreground-muted flex items-start gap-1">
                    <span className="text-warning-hover">•</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trips Layout table */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            
            {/* Direction tabs */}
            <div className="flex border-b border-outline-variant bg-surface-container/30">
              <button
                onClick={() => setActiveDirectionTab('SHAHRREY_TO_TAJRISH')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeDirectionTab === 'SHAHRREY_TO_TAJRISH'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="size-4" />
                مسیر رفت: شهرری ← تجریش
              </button>
              <button
                onClick={() => setActiveDirectionTab('TAJRISH_TO_SHAHRREY')}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeDirectionTab === 'TAJRISH_TO_SHAHRREY'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="size-4" />
                مسیر برگشت: تجریش ← شهرری
              </button>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-surface-container-low border-b border-outline-variant text-foreground-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">ردیف</th>
                    <th className="px-4 py-3 font-bold">شماره قطار</th>
                    <th className="px-4 py-3 font-bold">ساعت خروج / ورود</th>
                    <th className="px-4 py-3 font-bold">راهبر اول (H1)</th>
                    <th className="px-4 py-3 font-bold">راهبر دوم (H2)</th>
                    <th className="px-4 py-3 font-bold">وضعیت عملیاتی</th>
                    {isAdmin && <th className="px-4 py-3 font-bold text-center">عملیات سرشیفت</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {trips
                    .filter((t) => t.direction === activeDirectionTab)
                    .map((trip) => {
                      const h1 = trip.assignments.find((a) => a.role === 'H1')
                      const h2 = trip.assignments.find((a) => a.role === 'H2')

                      return (
                        <tr key={trip.id} className="hover:bg-surface-container-high/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-foreground-muted">{toFa(trip.rowNo)}</td>
                          <td className="px-4 py-3 font-bold font-mono text-accent">{toFa(trip.trainNumber || '—')}</td>
                          <td className="px-4 py-3 font-mono">
                            <span className="text-success font-bold">{toFa(trip.departureTime || '')}</span>
                            <span className="text-foreground-muted mx-1">←</span>
                            <span className="text-foreground-muted">{toFa(trip.arrivalTime || '')}</span>
                          </td>

                          {/* H1 Driver column */}
                          <td className="px-4 py-2.5">
                            {h1 ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground">
                                  {h1.matchedUser?.name || h1.rawName}
                                </span>
                                
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {/* Render Workflow Checklist Status */}
                                  <span className={`text-[9px] ${h1.acknowledgedAt ? 'text-success' : 'text-foreground-muted'}`}>
                                    رویت: {h1.acknowledgedAt ? '✓' : '✗'}
                                  </span>
                                  <span className={`text-[9px] ${h1.readyAt ? 'text-info' : 'text-foreground-muted'}`}>
                                    آمادگی: {h1.readyAt ? '✓' : '✗'}
                                  </span>
                                  
                                  {isAdmin && (
                                    <select
                                      disabled={actionLoading !== null}
                                      value={h1.matchedUserId || ''}
                                      onChange={(e) => handleReassign(h1.id, e.target.value)}
                                      className="bg-surface-container border border-outline-variant rounded px-1 text-[9px] text-foreground outline-none cursor-pointer ms-2"
                                    >
                                      <option value="">تغییر راهبر...</option>
                                      {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-critical/70 italic text-[10px]">بدون راهبر اصلی</span>
                            )}
                          </td>

                          {/* H2 Driver column */}
                          <td className="px-4 py-2.5">
                            {h2 ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground">
                                  {h2.matchedUser?.name || h2.rawName}
                                </span>
                                
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] ${h2.acknowledgedAt ? 'text-success' : 'text-foreground-muted'}`}>
                                    رویت: {h2.acknowledgedAt ? '✓' : '✗'}
                                  </span>
                                  <span className={`text-[9px] ${h2.readyAt ? 'text-info' : 'text-foreground-muted'}`}>
                                    آمادگی: {h2.readyAt ? '✓' : '✗'}
                                  </span>

                                  {isAdmin && (
                                    <select
                                      disabled={actionLoading !== null}
                                      value={h2.matchedUserId || ''}
                                      onChange={(e) => handleReassign(h2.id, e.target.value)}
                                      className="bg-surface-container border border-outline-variant rounded px-1 text-[9px] text-foreground outline-none cursor-pointer ms-2"
                                    >
                                      <option value="">تغییر راهبر...</option>
                                      {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-foreground-muted italic text-[10px]">کابین تک راهبر</span>
                            )}
                          </td>

                          {/* Operational notes & issues column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {trip.operationalNote ? (
                                <span className="px-2 py-0.5 bg-accent/15 border border-accent/30 rounded text-[9px] text-accent w-max">
                                  {trip.operationalNote}
                                </span>
                              ) : (
                                <span className="text-foreground-muted text-[10px]">نرمال</span>
                              )}
                              
                              {/* Show dispute / warning indicator */}
                              {((h1?.disputed) || (h2?.disputed)) && (
                                <span className="px-2 py-0.5 bg-warning/15 border border-warning/30 rounded text-[9px] text-warning w-max flex items-center gap-0.5">
                                  <AlertTriangle className="size-3" />
                                  مغایرت: {h1?.disputeNote || h2?.disputeNote}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Admin Action column */}
                          {isAdmin && (
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setTargetTripId(trip.id)
                                  setCommentText(trip.operationalNote || '')
                                  setTripStatusVal(trip.status)
                                  setCommentModalVisible(true)
                                }}
                                className="px-2.5 py-1 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high text-[10px] text-foreground transition-colors cursor-pointer"
                              >
                                ثبت پیام / تاخیر
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Operational Note Modal (Admin only) */}
      {commentModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-96 shadow-xl animate-in zoom-in duration-200" dir="rtl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <MessageSquare className="size-4 text-accent" />
              ثبت پیام عملیاتی یا اعلام تأخیر قطار
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">متن توضیحات / پیام نوبت</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs text-foreground outline-none resize-none"
                  placeholder="مثال: قطار با ۵ دقیقه تاخیر از دپو خارج می‌شود."
                />
              </div>

              <div>
                <label className="block text-xs text-foreground-muted mb-1">وضعیت قطار</label>
                <select
                  value={tripStatusVal}
                  onChange={(e) => setTripStatusVal(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-2 text-xs text-foreground outline-none cursor-pointer"
                >
                  <option value="NORMAL">نرمال (آماده اعزام)</option>
                  <option value="DELAYED">دارای تاخیر</option>
                  <option value="CANCELLED">حذف نوبت / کنسل شده</option>
                  <option value="MAINTENANCE">انتقال به تعمیرگاه</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  onClick={handleCommentSubmit}
                  className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  ثبت پیام
                </button>
                <button
                  onClick={() => {
                    setCommentModalVisible(false)
                    setCommentText('')
                    setTargetTripId(null)
                  }}
                  className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
