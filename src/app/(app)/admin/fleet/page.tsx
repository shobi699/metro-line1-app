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

const STATUS_LABELS: Record<string, string> = {
  active: 'فعال در خط',
  standby: 'آماده‌به‌کار (رزرو)',
  maintenance: 'تحت تعمیرات',
  out_of_service: 'خارج از سرویس',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  standby: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  maintenance: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  out_of_service: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default function FleetAdminPage() {
  const { accessToken } = useAuthStore()
  const [trains, setTrains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog controls
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTrain, setActiveTrain] = useState<any | null>(null)
  const [trainNumber, setTrainNumber] = useState('')
  const [fleetSeries, setFleetSeries] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [wagonCount, setWagonCount] = useState(7)
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')

  // Excel Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadTrains()
  }, [])

  async function loadTrains() {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/trains', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrains(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function saveTrain() {
    try {
      const method = activeTrain ? 'PATCH' : 'POST'
      const url = activeTrain ? `/api/fleet/trains/${activeTrain.id}` : '/api/fleet/trains'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trainNumber,
          fleetSeries: fleetSeries || undefined,
          manufacturer: manufacturer || undefined,
          wagonCount,
          status,
          notes: notes || undefined,
        }),
      })

      if (res.ok) {
        setEditDialogOpen(false)
        loadTrains()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ذخیره‌سازی مشخصات قطار')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این قطار از ناوگان خط ۱ مطمئن هستید؟ واگن‌های قطار نیز به صورت نرم‌افزاری حذف می‌شوند.')) return
    try {
      const res = await fetch(`/api/fleet/trains/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        loadTrains()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleRotateQr(id: string) {
    try {
      const res = await fetch(`/api/fleet/trains/${id}/qr/rotate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        alert('بازتولید توکن QR با موفقیت انجام شد')
        loadTrains()
      }
    } catch (err) {
      console.error(err)
    }
  }

  function openEdit(train: any | null = null) {
    setActiveTrain(train)
    if (train) {
      setTrainNumber(train.trainNumber)
      setFleetSeries(train.fleetSeries || '')
      setManufacturer(train.manufacturer || '')
      setWagonCount(train.wagonCount)
      setStatus(train.status)
      setNotes(train.notes || '')
    } else {
      setTrainNumber('')
      setFleetSeries('AC02')
      setManufacturer('')
      setWagonCount(7)
      setStatus('active')
      setNotes('')
    }
    setEditDialogOpen(true)
  }

  async function handleImportValidate() {
    if (!importFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/fleet/trains/import?mode=validate', {
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
      const res = await fetch('/api/fleet/trains/import?mode=commit', {
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
        loadTrains()
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
            مدیریت ناوگان خط ۱ (قطارها و واگن‌ها)
          </h1>
          <p className="text-sm text-foreground-muted">تعریف، به‌روزرسانی و تولید لیبل‌های QR قطارهای متروی خط ۱ تهران</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="text-xs">
            ورود داده از اکسل
          </Button>
          <Button onClick={() => openEdit(null)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
            + افزودن قطار جدید
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <span className="text-sm text-foreground-muted animate-pulse">در حال بارگذاری اطلاعات ناوگان...</span>
        </div>
      ) : (
        <Card className="border border-border bg-surface">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-24 text-right">شماره قطار</TableHead>
                  <TableHead className="text-right">سری ناوگان</TableHead>
                  <TableHead className="text-right">سازنده</TableHead>
                  <TableHead className="text-right">تعداد واگن</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">کد QR فعال</TableHead>
                  <TableHead className="text-left w-64"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trains.map((train) => (
                  <TableRow key={train.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                    <TableCell className="font-bold text-foreground">{toFa(train.trainNumber)}</TableCell>
                    <TableCell>{train.fleetSeries || '—'}</TableCell>
                    <TableCell>{train.manufacturer || '—'}</TableCell>
                    <TableCell>{toFa(train.wagonCount)} واگن</TableCell>
                    <TableCell>
                      <Badge className={STATUS_CLASSES[train.status]}>{STATUS_LABELS[train.status]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted" dir="ltr">
                      {train.qrToken.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="flex items-center gap-2 justify-end">
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => openEdit(train)}>
                        ویرایش
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleRotateQr(train.id)}>
                        بازتولید QR
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8 text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={() => handleDelete(train.id)}>
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
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{activeTrain ? 'ویرایش مشخصات قطار' : 'افزودن قطار جدید به ناوگان'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>شماره قطار:</Label>
              <Input
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="مثال: ۱۰۵"
                disabled={!!activeTrain}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>سری ناوگان:</Label>
              <Input
                value={fleetSeries}
                onChange={(e) => setFleetSeries(e.target.value)}
                placeholder="مثال: DC01 یا AC02"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>شرکت سازنده:</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="مثال: CRRC یا CNR"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>تعداد کل واگن‌ها:</Label>
              <Input
                type="number"
                value={wagonCount}
                onChange={(e) => setWagonCount(parseInt(e.target.value, 10))}
                disabled={!!activeTrain}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>وضعیت جاری در شبکه خط ۱:</Label>
              <Select value={status} onValueChange={(val) => setStatus(val || '')}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="انتخاب وضعیت..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>یادداشت‌ها و توضیحات:</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت‌های فنی..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button onClick={saveTrain} disabled={!trainNumber.trim()} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              ذخیره اطلاعات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXCEL IMPORT DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>بارگذاری ناوگان از اکسل</DialogTitle>
            <DialogDescription>
              فایل اکسل باید شامل ستون‌های شماره قطار، سری ناوگان، سازنده، تعداد واگن و وضعیت باشد.
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
                {importing ? 'در حال ثبت...' : `ثبت نهایی ${toFa(importPreview.validCount)} قطار`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
