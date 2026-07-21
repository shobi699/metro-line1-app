'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { toFa, jalali } from '@/lib/fa'
import Link from 'next/link'
import { toast } from 'sonner'

interface ContentCategory {
  id: string
  label: string
  key: string
  type: string | null
  color: string | null
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ContentCategoriesAdminPage() {
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const mutate = () => {
    fetch('/api/content/categories')
      .then(res => res.json())
      .then(json => {
        if (json.data) setCategories(json.data)
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    mutate()
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<ContentCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    color: 'zinc',
  })

  const openModal = (cat?: ContentCategory) => {
    if (cat) {
      setEditingCat(cat)
      setForm({
        title: cat.label,
        slug: cat.key,
        description: cat.type || '',
        color: cat.color || 'zinc',
      })
    } else {
      setEditingCat(null)
      setForm({
        title: '',
        slug: '',
        description: '',
        color: 'zinc',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.slug) return toast.error('عنوان و اسلاگ الزامی هستند')

    setIsSubmitting(true)
    try {
      const url = editingCat ? `/api/content/categories/${editingCat.id}` : '/api/content/categories'
      const method = editingCat ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      toast.success(editingCat ? 'دسته‌بندی با موفقیت ویرایش شد' : 'دسته‌بندی جدید اضافه شد')
      setIsModalOpen(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'خطا در ثبت اطلاعات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی "${title}" مطمئن هستید؟`)) return

    try {
      const res = await fetch(`/api/content/categories/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      toast.success('دسته‌بندی حذف شد')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'خطا در حذف')
    }
  }

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/content" className="text-foreground-muted hover:text-foreground flex items-center gap-1 text-sm font-medium">
              <ArrowRight className="size-4" />
              بازگشت به مدیریت محتوا
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت دسته‌بندی‌های محتوا</h1>
          <p className="text-sm text-foreground-muted">ایجاد و ویرایش دسته‌بندی اخبار، اسناد و آموزش‌ها</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus className="size-4" />
          دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان</TableHead>
                <TableHead>اسلاگ (Slug)</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead>رنگ</TableHead>
                <TableHead>تاریخ ایجاد</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-foreground-muted">
                    هیچ دسته‌بندی یافت نشد.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c: ContentCategory) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.label}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs" dir="ltr">{c.key}</TableCell>
                    <TableCell className="text-foreground-muted truncate max-w-[200px]">{c.type || '---'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset" style={{ color: `var(--${c.color}-500)`, backgroundColor: `var(--${c.color}-500/10)`, borderColor: `var(--${c.color}-500/20)` }}>
                        {c.color}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums text-sm">{jalali(c.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openModal(c)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id, c.label)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCat ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
              <DialogDescription>
                اطلاعات دسته‌بندی محتوا را در زیر وارد کنید.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">عنوان دسته‌بندی (فارسی)</Label>
                <Input
                  id="title"
                  placeholder="مثال: دستورالعمل OCC"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">اسلاگ (انگلیسی)</Label>
                <Input
                  id="slug"
                  placeholder="مثال: occ-directive"
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                <Input
                  id="description"
                  placeholder="توضیح کوتاه..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">تم رنگی</Label>
                <select
                  id="color"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                >
                  <option value="zinc">سفید/خاکستری (Zinc)</option>
                  <option value="red">قرمز (Red)</option>
                  <option value="blue">آبی (Blue)</option>
                  <option value="green">سبز (Green)</option>
                  <option value="amber">زرد/نارنجی (Amber)</option>
                  <option value="purple">بنفش (Purple)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingCat ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
