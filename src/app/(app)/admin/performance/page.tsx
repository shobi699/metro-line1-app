'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Save, TrendingUp, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PerformanceAdminPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [appeals, setAppeals] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [tab, setTab] = useState<'logs' | 'appeals' | 'create'>('logs')

  // Form states
  const [employeeId, setEmployeeId] = useState('')
  const [actionTypeId, setActionTypeId] = useState('')
  const [severity, setSeverity] = useState('L1')
  const [periodId, setPeriodId] = useState(() => {
    // Current Jalali Month e.g. 1402-05
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}` // Just basic placeholder
  })

  useEffect(() => {
    fetchLogs()
    fetchTypes()
    fetchAppeals()
    fetchUsers()
  }, [])

  async function fetchLogs() {
    const res = await fetch('/api/performance/logs')
    const json = await res.json()
    if (res.ok) setLogs(json.data || [])
  }
  
  async function fetchAppeals() {
    const res = await fetch('/api/performance/appeals')
    const json = await res.json()
    if (res.ok) setAppeals(json.data || [])
  }

  async function fetchTypes() {
    const res = await fetch('/api/performance/types')
    const json = await res.json()
    if (res.ok) setTypes(json.data || [])
  }

  async function fetchUsers() {
    const res = await fetch('/api/users')
    const json = await res.json()
    if (res.ok) setUsers(json.data || [])
  }

  async function handleCreateLog() {
    const payload = { employeeId, actionTypeId, severity, periodId }
    const res = await fetch('/api/performance/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      alert('با موفقیت ثبت شد')
      setTab('logs')
      fetchLogs()
    } else {
      const json = await res.json()
      alert(json.error?.message || 'خطا در ثبت')
    }
  }

  async function handleReviewAppeal(id: string, status: string) {
    const note = prompt('توضیحات بررسی:')
    if (note === null) return

    const res = await fetch(`/api/performance/appeals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    })

    if (res.ok) {
      fetchAppeals()
      fetchLogs()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">مدیریت عملکرد و تشویق/تنبیه</h1>
          <p className="text-muted-foreground mt-1">ثبت گزارشات عملکردی پرسنل و رسیدگی به اعتراضات</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border pb-px">
        <Button variant={tab === 'logs' ? 'default' : 'ghost'} onClick={() => setTab('logs')} className="rounded-b-none">
          <TrendingUp className="me-2 h-4 w-4" />
          سوابق ثبت‌شده
        </Button>
        <Button variant={tab === 'appeals' ? 'default' : 'ghost'} onClick={() => setTab('appeals')} className="rounded-b-none">
          <AlertTriangle className="me-2 h-4 w-4" />
          اعتراضات (Appeals)
        </Button>
        <Button variant={tab === 'create' ? 'default' : 'ghost'} onClick={() => setTab('create')} className="rounded-b-none">
          <PlusCircle className="me-2 h-4 w-4" />
          ثبت مورد جدید
        </Button>
      </div>

      {tab === 'logs' && (
        <div className="grid gap-4">
          {logs.map(log => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{log.employee?.firstName} {log.employee?.lastName}</span>
                  <span className={cn('text-sm px-2 py-1 rounded-md', 
                    log.status === 'active' ? 'bg-primary/20 text-primary' :
                    log.status === 'appealed' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                  )}>
                    {log.status === 'active' ? 'فعال' : log.status === 'appealed' ? 'در حال اعتراض' : 'لغو شده'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p><strong>اقدام:</strong> {log.actionType?.title} ({log.actionType?.competency?.direction === 'positive' ? 'تشویقی' : 'تخلف'})</p>
                  <p><strong>سطح / شدت:</strong> {log.severity}</p>
                  <p><strong>دوره:</strong> {log.periodId}</p>
                  <p><strong>ثبت‌کننده:</strong> {log.recordedBy?.firstName} {log.recordedBy?.lastName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-muted-foreground">رکوردی یافت نشد.</p>}
        </div>
      )}

      {tab === 'appeals' && (
        <div className="grid gap-4">
          {appeals.map(ap => (
            <Card key={ap.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">اعتراض از: {ap.employee?.firstName} {ap.employee?.lastName}</CardTitle>
                <p className="text-sm text-muted-foreground">وضعیت: {ap.status}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/30 p-3 rounded-md text-sm mb-4">
                  <p className="font-semibold mb-2">مورد عملکردی اصلی:</p>
                  <p>{ap.log?.actionType?.title}</p>
                </div>
                <p className="text-sm"><strong>دلیل اعتراض:</strong> {ap.reason}</p>
                
                {ap.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => handleReviewAppeal(ap.id, 'approved')} className="bg-success hover:bg-success/90">تایید اعتراض (لغو اثر رکورد)</Button>
                    <Button onClick={() => handleReviewAppeal(ap.id, 'rejected')} variant="destructive">رد اعتراض (تایید رکورد)</Button>
                  </div>
                )}
                {ap.note && <p className="text-sm mt-4 text-muted-foreground">یادداشت مدیر: {ap.note}</p>}
              </CardContent>
            </Card>
          ))}
          {appeals.length === 0 && <p className="text-muted-foreground">اعتراضی یافت نشد.</p>}
        </div>
      )}

      {tab === 'create' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>ثبت ارزیابی عملکرد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">پرسنل</label>
              <select className="w-full bg-background border border-input rounded-md h-10 px-3" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                <option value="">انتخاب کنید...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.personnelCode || u.phone})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع اقدام (Action Type)</label>
              <select className="w-full bg-background border border-input rounded-md h-10 px-3" value={actionTypeId} onChange={e => setActionTypeId(e.target.value)}>
                <option value="">انتخاب کنید...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.title} - {t.competency?.direction}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">شدت / ضریب (Severity)</label>
              <select className="w-full bg-background border border-input rounded-md h-10 px-3" value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="L1">L1 (عادی)</option>
                <option value="L2">L2 (متوسط)</option>
                <option value="L3">L3 (شدید / عالی)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">دوره</label>
              <input className="w-full bg-background border border-input rounded-md h-10 px-3 text-start" dir="ltr" value={periodId} onChange={e => setPeriodId(e.target.value)} />
            </div>

            <Button onClick={handleCreateLog} className="w-full mt-4"><Save className="me-2 w-4 h-4" /> ثبت گزارش</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
