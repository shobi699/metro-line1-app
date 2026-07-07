'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Filter, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import dayjs from 'dayjs'
// @ts-expect-error — dayjs-jalali بدون type declaration منتشر شده است
import jalaliday from 'dayjs-jalali'

dayjs.extend(jalaliday)
const jdate = (d: any) => dayjs(d).calendar('jalali')

interface Ticket {
  id: string
  title: string
  description: string
  priority: string
  status: string
  wagonCode: string | null
  photoUrl: string | null
  createdAt: string
  user: { name: string; nationalId: string }
}

const statusMap: Record<string, string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  resolved: 'برطرف شده',
  closed: 'بسته شده'
}

const statusColors: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground'
}

const priorityMap: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی'
}

export default function TicketsAdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateNote, setUpdateNote] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [accessToken])

  async function fetchTickets() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setTickets(json.data?.tickets ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter)

  async function handleUpdateStatus() {
    if (!accessToken || !selectedTicket) return
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: updateStatus, note: updateNote })
      })
      if (res.ok) {
        setSelectedTicket(null)
        fetchTickets()
      } else {
        const error = await res.json()
        alert(error?.error?.message || 'خطا در بروزرسانی')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            تیکت‌های خرابی و مشکلات
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            گزارش‌های ثبت شده توسط پرسنل و راهبران از قطارها و تجهیزات
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Filter className="w-4 h-4 ms-2 text-muted-foreground" />
          {['all', 'open', 'in_progress', 'resolved'].map(key => (
            <button 
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${filter === key ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {key === 'all' ? 'همه' : statusMap[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse">در حال دریافت...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="col-span-full p-12 text-center border rounded-xl bg-card/30 border-dashed">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium">موردی یافت نشد</h3>
          </div>
        ) : (
          filteredTickets.map(t => (
            <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setSelectedTicket(t)
              setUpdateStatus(t.status)
              setUpdateNote('')
            }}>
              <CardContent className="p-0">
                {t.photoUrl ? (
                  <div className="h-40 w-full bg-muted relative">
                    <img src={t.photoUrl} alt="Ticket" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6 opacity-30" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold line-clamp-1">{t.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusColors[t.status]}`}>
                      {statusMap[t.status]}
                    </span>
                  </div>
                  
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[11px] text-foreground/70 pt-2">
                    {t.wagonCode && (
                      <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                        <span>واگن:</span>
                        <span className="font-mono">{t.wagonCode}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>اولویت:</span>
                      <span className="font-medium">{priorityMap[t.priority]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>تاریخ:</span>
                      <span>{toFa(jdate(t.createdAt).format('YY/MM/DD HH:mm'))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-lg">جزئیات خرابی</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>بستن</Button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span>گزارش‌دهنده: {selectedTicket.user.name}</span>
                    <span>({toFa(selectedTicket.user.nationalId)})</span>
                  </div>
                </div>
                <div className={`px-3 py-1 text-sm rounded-full ${statusColors[selectedTicket.status]}`}>
                  {statusMap[selectedTicket.status]}
                </div>
              </div>

              {selectedTicket.photoUrl && (
                <div className="w-full rounded-lg overflow-hidden border">
                  <img src={selectedTicket.photoUrl} alt="تصویر پیوست" className="w-full max-h-80 object-contain bg-black/5" />
                </div>
              )}

              {selectedTicket.description && (
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> توضیحات تکمیلی
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-bold text-primary">بروزرسانی وضعیت</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(statusMap).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setUpdateStatus(key)}
                      className={`py-2 px-3 text-sm rounded-md border text-center transition-colors ${updateStatus === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">یادداشت برای تغییر وضعیت (اختیاری)</label>
                  <textarea 
                    className="w-full bg-background border rounded-md p-3 text-sm resize-none" 
                    rows={3} 
                    value={updateNote}
                    onChange={e => setUpdateNote(e.target.value)}
                    placeholder="مثال: قطعه سفارش داده شد..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>انصراف</Button>
                  <Button onClick={handleUpdateStatus}>ثبت تغییرات</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
