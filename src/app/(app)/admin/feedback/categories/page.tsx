'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Shield, EyeOff, Save, Key, User, Clock } from 'lucide-react'

interface FeedbackCategory {
  id: string
  key: string
  title: string
  description?: string
  assigneeRole: string
  slaHours: { firstResponse: number; resolve: number }
  allowAnonymous: boolean
  forceAnonymous: boolean
  confidential: boolean
  ideaBoard: boolean
  isActive: boolean
}

export default function FeedbackCategoriesAdminPage() {
  const [categories, setCategories] = useState<FeedbackCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<FeedbackCategory>>({
    key: '',
    title: '',
    description: '',
    assigneeRole: '',
    slaHours: { firstResponse: 24, resolve: 120 },
    allowAnonymous: true,
    forceAnonymous: false,
    confidential: false,
    ideaBoard: false,
    isActive: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback/categories')
      const json = await res.json()
      if (json.data) setCategories(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setFormData({
      key: '',
      title: '',
      description: '',
      assigneeRole: '',
      slaHours: { firstResponse: 24, resolve: 120 },
      allowAnonymous: true,
      forceAnonymous: false,
      confidential: false,
      ideaBoard: false,
      isActive: true,
    })
    setIsEditing(false)
    setCurrentId(null)
    setIsOpen(true)
  }

  const handleOpenEdit = (cat: FeedbackCategory) => {
    setFormData({ ...cat })
    setIsEditing(true)
    setCurrentId(cat.id)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این دسته‌بندی مطمئن هستید؟ پیام‌های مرتبط ممکن است تحت تاثیر قرار گیرند.')) return
    try {
      const res = await fetch(`/api/feedback/categories/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = isEditing ? `/api/feedback/categories/${currentId}` : '/api/feedback/categories'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setIsOpen(false)
        fetchCategories()
      } else {
        const json = await res.json()
        alert(json.error?.message || 'خطا در ذخیره‌سازی')
      }
    } catch (err) {
      console.error(err)
      alert('خطای شبکه')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت دسته‌بندی‌های بازخورد</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            تنظیم قواعد مسیردهی، SLA و محرمانگی برای پیام‌های کارکنان
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" />
            دسته جدید
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان دسته</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="مثلا: انتقاد از سیستم"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Key className="h-3 w-3" /> شناسه (Key) منحصر‌به‌فرد</Label>
                  <Input 
                    value={formData.key} 
                    onChange={e => setFormData({ ...formData, key: e.target.value })} 
                    placeholder="مثلا: system_complaint"
                    dir="ltr"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>توضیحات (اختیاری)</Label>
                <Input 
                  value={formData.description || ''} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="توضیح کوتاه برای نمایش به کاربر"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><User className="h-3 w-3" /> نقش مسئول پاسخگویی</Label>
                  <Input 
                    value={formData.assigneeRole} 
                    onChange={e => setFormData({ ...formData, assigneeRole: e.target.value })} 
                    placeholder="مثلا: hr_manager"
                    dir="ltr"
                    required 
                  />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> مهلت پاسخ اولیه (ساعت)</Label>
                    <Input 
                      type="number" 
                      value={formData.slaHours?.firstResponse} 
                      onChange={e => setFormData({ ...formData, slaHours: { ...formData.slaHours!, firstResponse: Number(e.target.value) } })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> مهلت حل نهایی (ساعت)</Label>
                    <Input 
                      type="number" 
                      value={formData.slaHours?.resolve} 
                      onChange={e => setFormData({ ...formData, slaHours: { ...formData.slaHours!, resolve: Number(e.target.value) } })} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
                <h4 className="font-semibold text-sm">قواعد دسترسی و محرمانگی</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>فعال بودن دسته</Label>
                    <p className="text-xs text-muted-foreground">در صورت غیرفعال بودن، در لیست فرم‌ها نمایش داده نمی‌شود.</p>
                  </div>
                  <Switch checked={formData.isActive} onCheckedChange={v => setFormData({ ...formData, isActive: v })} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> امکان ثبت ناشناس</Label>
                    <p className="text-xs text-muted-foreground">کاربر می‌تواند هویت خود را پنهان کند.</p>
                  </div>
                  <Switch checked={formData.allowAnonymous} onCheckedChange={v => setFormData({ ...formData, allowAnonymous: v })} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1"><Shield className="h-3 w-3 text-destructive" /> ثبت ناشناس اجباری</Label>
                    <p className="text-xs text-muted-foreground">هویت کاربر در سیستم ثبت نمی‌شود (مثل گزارش تخلف).</p>
                  </div>
                  <Switch checked={formData.forceAnonymous} onCheckedChange={v => setFormData({ ...formData, forceAnonymous: v })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>محرمانه</Label>
                    <p className="text-xs text-muted-foreground">فقط نقش مسئول مجاز به دیدن پیام است (سایر ادمین‌ها دسترسی ندارند).</p>
                  </div>
                  <Switch checked={formData.confidential} onCheckedChange={v => setFormData({ ...formData, confidential: v })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تابلوی ایده‌ها</Label>
                    <p className="text-xs text-muted-foreground">امکان عمومی شدن پیام و جمع‌آوری رای از دیگر کارکنان.</p>
                  </div>
                  <Switch checked={formData.ideaBoard} onCheckedChange={v => setFormData({ ...formData, ideaBoard: v })} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>انصراف</Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  ذخیره تنظیمات
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">در حال بارگذاری...</div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border rounded-xl border-dashed">
          هیچ دسته‌بندی تعریف نشده است.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map(cat => (
            <Card key={cat.id} className={!cat.isActive ? 'opacity-60 grayscale-[50%]' : ''}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <CardDescription className="text-xs font-mono mt-1" dir="ltr">{cat.key}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(cat)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {cat.description || 'بدون توضیحات'}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1 bg-accent/5">
                    <User className="h-3 w-3" /> {cat.assigneeRole}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" /> SLA: {cat.slaHours?.firstResponse}h / {cat.slaHours?.resolve}h
                  </Badge>
                  {cat.forceAnonymous && (
                    <Badge variant="destructive" className="gap-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                      <Shield className="h-3 w-3" /> ناشناس اجباری
                    </Badge>
                  )}
                  {cat.allowAnonymous && !cat.forceAnonymous && (
                    <Badge variant="secondary" className="gap-1">
                      <EyeOff className="h-3 w-3" /> امکان ناشناس
                    </Badge>
                  )}
                  {cat.confidential && (
                    <Badge variant="default" className="gap-1 bg-blue-500 hover:bg-blue-600 text-white border-transparent">
                      محرمانه
                    </Badge>
                  )}
                  {cat.ideaBoard && (
                    <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600 text-white border-transparent">
                      تابلوی ایده‌ها
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
