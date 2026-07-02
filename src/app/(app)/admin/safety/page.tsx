'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Plus, FileText, CheckCircle2, Users } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import dayjs from 'dayjs'
// @ts-ignore
import jalaliday from 'dayjs-jalali'

dayjs.extend(jalaliday)
const jdate = (d: any) => dayjs(d).calendar('jalali')

interface Bulletin {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
  _count: { readReceipts: number }
}

export default function SafetyAdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', body: '', active: true })
  
  // State for showing receipts modal
  const [selectedBulletin, setSelectedBulletin] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<any>(null)

  useEffect(() => {
    fetchBulletins()
  }, [accessToken])

  async function fetchBulletins() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/safety/bulletins', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setBulletins(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    try {
      const res = await fetch('/api/safety/bulletins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ title: '', body: '', active: true })
        fetchBulletins()
      } else {
        const error = await res.json()
        alert(error?.error?.message || 'خطا در ثبت بخشنامه')
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchReceipts(id: string) {
    if (!accessToken) return
    setSelectedBulletin(id)
    setReceiptData(null)
    try {
      const res = await fetch(`/api/safety/bulletins/${id}/receipts`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setReceiptData(json.data)
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
            بخشنامه‌های ایمنی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مدیریت بخشنامه‌ها، هشدارها و پیگیری تاییدیه مطالعه پرسنل
          </p>
        </div>
        
        <Button onClick={() => setShowForm(!showForm)} className="shrink-0 gap-2">
          {showForm ? 'انصراف' : <><Plus className="w-4 h-4" /> بخشنامه جدید</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">ثبت بخشنامه ایمنی جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">عنوان بخشنامه</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-background border rounded-md p-2 text-sm" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="مثال: الزام استفاده از کلاه ایمنی در محوطه کارگاهی"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">متن بخشنامه</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-background border rounded-md p-2 text-sm resize-none" 
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  placeholder="متن کامل دستورالعمل..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                <label htmlFor="active" className="text-sm cursor-pointer text-foreground/80">فعال باشد (به همه پرسنل نمایش داده شود)</label>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">ثبت و انتشار</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">در حال دریافت...</div>
        ) : bulletins.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-card/30 border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium">هیچ بخشنامه‌ای ثبت نشده است</h3>
          </div>
        ) : (
          bulletins.map(b => (
            <Card key={b.id} className={b.active ? 'border-r-4 border-r-destructive' : 'opacity-70'}>
              <CardContent className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg">{b.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${b.active ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {b.active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{b.body}</p>
                  <div className="text-xs text-muted-foreground">
                    ثبت شده در: {toFa(jdate(b.createdAt).format('YYYY/MM/DD HH:mm'))}
                  </div>
                </div>
                
                <div className="md:w-64 bg-muted/40 p-4 rounded-lg flex flex-col justify-center items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      {toFa(b._count.readReceipts)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">تاییدیه مطالعه دریافت شده</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => fetchReceipts(b.id)}>
                    <Users className="w-4 h-4 ms-2" />
                    مشاهده لیست افراد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-lg">گزارش وضعیت تاییدیه</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBulletin(null)}>بستن</Button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {!receiptData ? (
                <div className="py-12 text-center animate-pulse">در حال دریافت لیست...</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg text-primary">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{toFa(receiptData.percentage)}٪</div>
                      <div className="text-xs mt-1">درصد مشارکت</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{toFa(receiptData.acknowledgedCount)}</div>
                      <div className="text-xs mt-1">خوانده شده</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{toFa(receiptData.totalUsers)}</div>
                      <div className="text-xs mt-1">کل پرسنل</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">لیست افراد تایید کننده:</h4>
                    {receiptData.receipts.length === 0 ? (
                      <div className="text-sm text-muted-foreground">تاکنون کسی این بخشنامه را تایید نکرده است.</div>
                    ) : (
                      <div className="grid gap-2">
                        {receiptData.receipts.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md border border-transparent hover:border-border transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {r.user.name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{r.user.name}</div>
                                <div className="text-xs text-muted-foreground">{toFa(r.user.nationalId)}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-end">
                              <div>{toFa(jdate(r.readAt).format('YYYY/MM/DD'))}</div>
                              <div>{toFa(jdate(r.readAt).format('HH:mm'))}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
