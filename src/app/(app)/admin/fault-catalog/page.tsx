'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  medium: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default function FaultCatalogPage() {
  const { accessToken } = useAuthStore()
  const [categories, setCategories] = useState<any[]>([])
  const [codes, setCodes] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Dialog Controls
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeCode, setActiveCode] = useState<any | null>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [defaultPriority, setDefaultPriority] = useState('medium')
  const [safetyCritical, setSafetyCritical] = useState(false)
  const [requiresWagon, setRequiresWagon] = useState(true)
  const [operatorGuide, setOperatorGuide] = useState('')
  const [keywords, setKeywords] = useState('')
  const [aliases, setAliases] = useState('')

  // Excel Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadCodes()
  }, [selectedCategoryId])

  async function loadCategories() {
    try {
      const res = await fetch('/api/fault-catalog/categories', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadCodes() {
    setLoading(true)
    try {
      const url = selectedCategoryId && selectedCategoryId !== 'all'
        ? `/api/fault-catalog/codes?categoryId=${selectedCategoryId}`
        : '/api/fault-catalog/codes'
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCodes(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function saveCode() {
    try {
      const method = activeCode ? 'PATCH' : 'POST'
      const url = activeCode ? `/api/fault-catalog/codes/${activeCode.id}` : '/api/fault-catalog/codes'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code,
          title,
          description: description || undefined,
          categoryId,
          defaultPriority,
          safetyCritical,
          requiresWagon,
          operatorGuide: operatorGuide || undefined,
          keywords: keywords || undefined,
          aliases: aliases || undefined,
        }),
      })

      if (res.ok) {
        setEditDialogOpen(false)
        loadCodes()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ذخیره‌سازی کد خطا')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این کد خطا از کاتالوگ مرجع مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/fault-catalog/codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        loadCodes()
      }
    } catch (err) {
      console.error(err)
    }
  }

  function openEdit(item: any | null = null) {
    setActiveCode(item)
    if (item) {
      setCode(item.code)
      setTitle(item.title)
      setDescription(item.description || '')
      setCategoryId(item.categoryId)
      setDefaultPriority(item.defaultPriority)
      setSafetyCritical(item.safetyCritical)
      setRequiresWagon(item.requiresWagon)
      setOperatorGuide(item.operatorGuide || '')
      setKeywords(item.keywords || '')
      setAliases(item.aliases || '')
    } else {
      setCode('')
      setTitle('')
      setDescription('')
      setCategoryId(categories[0]?.id || '')
      setDefaultPriority('medium')
      setSafetyCritical(false)
      setRequiresWagon(true)
      setOperatorGuide('')
      setKeywords('')
      setAliases('')
    }
    setEditDialogOpen(true)
  }

  async function handleImportValidate() {
    if (!importFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/fault-catalog/import?mode=validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setImportPreview(json.data)
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در بررسی فایل')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  async function handleImportCommit() {
    if (!importPreview || importPreview.validRows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/fault-catalog/import?mode=commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          validRows: importPreview.validRows,
        }),
      })
      if (res.ok) {
        alert('بارگذاری با موفقیت انجام شد')
        setImportDialogOpen(false)
        setImportFile(null)
        setImportPreview(null)
        loadCategories()
        loadCodes()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ایمپورت نهایی')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            کاتالوگ مرجع خطاها و فالت‌ها (Fault Catalog)
          </h1>
          <p className="text-sm text-foreground-muted">بانک اطلاعات کدهای خطا، سطوح اولویت، الزامات ایمنی و راهنمای فوری راهبران</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="text-xs">
            ورود داده از اکسل
          </Button>
          <Button onClick={() => openEdit(null)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
            + ثبت کد خطای جدید
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <Label className="text-xs font-semibold">فیلتر دسته‌بندی:</Label>
        <Select value={selectedCategoryId} onValueChange={(val) => setSelectedCategoryId(val || '')}>
          <SelectTrigger className="w-56 text-xs h-9">
            <SelectValue placeholder="همه دسته‌بندی‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <span className="text-sm text-foreground-muted animate-pulse">در حال بارگذاری کاتالوگ...</span>
        </div>
      ) : (
        <Card className="border border-border bg-surface">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-28 text-right">کد خطا</TableHead>
                  <TableHead className="text-right">عنوان فالت</TableHead>
                  <TableHead className="text-right">دسته‌بندی</TableHead>
                  <TableHead className="text-right">اولویت پیش‌فرض</TableHead>
                  <TableHead className="text-right">ایمنی‌محور</TableHead>
                  <TableHead className="text-right">نیاز به واگن</TableHead>
                  <TableHead className="text-left w-48"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((item) => (
                  <TableRow key={item.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <TableCell className="font-mono font-bold text-foreground">{item.code}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{item.title}</div>
                      {item.operatorGuide && (
                        <div className="text-[10px] text-amber-500 mt-0.5 font-medium leading-relaxed">
                          راهنما: {item.operatorGuide}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.category?.title || '—'}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_CLASSES[item.defaultPriority]}>
                        {PRIORITY_LABELS[item.defaultPriority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.safetyCritical ? (
                        <span className="text-red-500 text-xs font-bold">بله 🚨</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">خیر</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.requiresWagon ? (
                        <span className="text-xs">واگن اختصاصی</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">کادر قطار</span>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => openEdit(item)}>
                        ویرایش
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8 text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={() => handleDelete(item.id)}>
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* EDIT/CREATE DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeCode ? 'ویرایش کد خطا' : 'ثبت کد خطای جدید در کاتالوگ'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-1">
              <Label>کد خطا:</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: DRS-004"
                disabled={!!activeCode}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <Label>دسته‌بندی:</Label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="انتخاب دسته‌بندی..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>عنوان فالت:</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: گیر مکانیکی درب کشویی واگن"
                className="text-xs"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>شرح جزئیات خطا:</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات تکمیلی رفتار فالت..."
                className="text-xs"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <Label>اولویت پیش‌فرض رفع فالت:</Label>
              <Select value={defaultPriority} onValueChange={(val) => setDefaultPriority(val || '')}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="انتخاب اولویت..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                  <SelectItem value="critical">بحرانی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border border-border p-3 rounded-lg col-span-1">
              <div className="space-y-0.5">
                <Label className="text-xs">خطای ایمنی‌محور</Label>
                <span className="text-[10px] text-foreground-muted block">آیا بر سلامت سیر اثر مستقیم دارد؟</span>
              </div>
              <Switch checked={safetyCritical} onCheckedChange={setSafetyCritical} />
            </div>

            <div className="flex items-center justify-between border border-border p-3 rounded-lg col-span-1">
              <div className="space-y-0.5">
                <Label className="text-xs">نیاز به انتخاب واگن</Label>
                <span className="text-[10px] text-foreground-muted block">آیا خطا مختص به یک واگن خاص است؟</span>
              </div>
              <Switch checked={requiresWagon} onCheckedChange={setRequiresWagon} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>راهنمای اقدام فوری راهبر (پشتیبانی عملیاتی):</Label>
              <Input
                value={operatorGuide}
                onChange={(e) => setOperatorGuide(e.target.value)}
                placeholder="مثال: سوپاپ هوا را کشیده و درب را دستی ببندید."
                className="text-xs"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <Label>کلیدواژه‌ها (جداکننده کاما):</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="درب, مانع, باز"
                className="text-xs"
              />
            </div>

            <div className="space-y-2 col-span-1">
              <Label>نام‌های مستعار (جداکننده خط عمودی |):</Label>
              <Input
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="در گیر کرده | لیمیت درب"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button onClick={saveCode} disabled={!code.trim() || !title.trim() || !categoryId} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              ذخیره کد خطا
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXCEL IMPORT DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>بارگذاری کاتالوگ از اکسل</DialogTitle>
            <DialogDescription>
              فایل اکسل کاتالوگ خطاها را بارگذاری و تایید کنید. سیستم به صورت خودکار بردارهای معنایی را بازتولید می‌کند.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>انتخاب فایل:</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            {importFile && !importPreview && (
              <Button onClick={handleImportValidate} disabled={importing} className="w-full text-xs">
                {importing ? 'در حال تحلیل...' : 'بارگذاری و پیش‌نمایش فایل'}
              </Button>
            )}

            {importPreview && (
              <div className="space-y-3 border border-border p-4 rounded-lg bg-zinc-900 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-400">تعداد ردیف‌های معتبر: {toFa(importPreview.validCount)}</span>
                  <span className="text-red-400">تعداد خطاها: {toFa(importPreview.errorCount)}</span>
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px]">
                    {importPreview.errors.map((e: any, idx: number) => (
                      <div key={idx} className="text-red-400">
                        ردیف {toFa(e.row)} ({e.keyIdentifier}): {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setImportFile(null)
                setImportPreview(null)
              }}
              className="text-xs"
            >
              انصراف
            </Button>
            {importPreview && importPreview.validRows.length > 0 && (
              <Button
                onClick={handleImportCommit}
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {importing ? 'در حال ثبت...' : `ثبت نهایی ${toFa(importPreview.validCount)} کد خطا`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
