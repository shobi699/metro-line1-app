'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  createdAt: string
}

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ id: '', question: '', answer: '', category: '' })

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/admin/knowledge/faqs')
      const data = await res.json()
      if (data.data) setFaqs(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const deleteFaq = async (id: string) => {
    if (!confirm('آیا از حذف این سوال متداول اطمینان دارید؟')) return
    try {
      await fetch(`/api/admin/knowledge/faqs/${id}`, { method: 'DELETE' })
      setFaqs(faqs.filter(f => f.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `/api/admin/knowledge/faqs/${formData.id}` : '/api/admin/knowledge/faqs'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsDialogOpen(false)
        fetchFaqs()
      } else {
        alert('خطا در ذخیره اطلاعات')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openEdit = (faq: FAQ) => {
    setFormData({ id: faq.id, question: faq.question, answer: faq.answer, category: faq.category || '' })
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    setFormData({ id: '', question: '', answer: '', category: '' })
    setIsDialogOpen(true)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">سوالات متداول (FAQ)</h1>
          <p className="text-muted-foreground mt-1">مدیریت پرسش و پاسخ‌های پرتکرار در دانشنامه</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/knowledge">
            <Button variant="outline" className="gap-2">
              بازگشت به مقالات <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button onClick={openCreate}><Plus className="w-4 h-4 ml-1" /> افزودن سوال</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>{formData.id ? 'ویرایش سوال' : 'افزودن سوال جدید'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="question">سوال</Label>
                  <Input 
                    id="question" 
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    placeholder="پرسش خود را وارد کنید..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">پاسخ</Label>
                  <textarea 
                    id="answer"
                    className="w-full min-h-[100px] flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    placeholder="پاسخ کامل را وارد کنید..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">دسته‌بندی (اختیاری)</Label>
                  <Input 
                    id="category" 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="مثال: ایمنی، تجهیزات، ..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                <Button onClick={handleSave}>ذخیره تغییرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md m-4">
            <div className="grid grid-cols-5 bg-muted p-3 font-medium text-sm border-b">
              <div className="col-span-2">سوال</div>
              <div className="col-span-2">دسته‌بندی</div>
              <div className="text-left">عملیات</div>
            </div>
            <div className="divide-y">
              {faqs.length > 0 ? (
                faqs.map(f => (
                  <div key={f.id} className="grid grid-cols-5 p-3 text-sm items-center hover:bg-muted/50">
                    <div className="col-span-2 font-medium truncate pr-2" title={f.question}>{f.question}</div>
                    <div className="col-span-2">{f.category || '-'}</div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteFaq(f.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">هیچ سوالی یافت نشد. برای شروع روی دکمه "افزودن سوال" کلیک کنید.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
