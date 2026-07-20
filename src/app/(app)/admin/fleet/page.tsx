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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'trains' | 'parts'>('trains')

  // Trains state
  const [trains, setTrains] = useState<any[]>([])
  const [trainsLoading, setTrainsLoading] = useState(true)

  // Train Dialog controls
  const [editTrainDialogOpen, setEditTrainDialogOpen] = useState(false)
  const [activeTrain, setActiveTrain] = useState<any | null>(null)
  const [trainNumber, setTrainNumber] = useState('')
  const [fleetSeries, setFleetSeries] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [wagonCount, setWagonCount] = useState(7)
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')

  // Train Excel Import states
  const [trainImportDialogOpen, setTrainImportDialogOpen] = useState(false)
  const [trainImportFile, setTrainImportFile] = useState<File | null>(null)
  const [trainImportPreview, setTrainImportPreview] = useState<any | null>(null)
  const [trainImporting, setTrainImporting] = useState(false)

  // Parts state
  const [parts, setParts] = useState<any[]>([])
  const [partsLoading, setPartsLoading] = useState(true)

  // Part Dialog controls
  const [editPartDialogOpen, setEditPartDialogOpen] = useState(false)
  const [activePart, setActivePart] = useState<any | null>(null)
  const [partName, setPartName] = useState('')
  const [partNumberField, setPartNumberField] = useState('')
  const [partTrainType, setPartTrainType] = useState('both')
  const [partDescription, setPartDescription] = useState('')

  // Part Excel Import states
  const [partImportDialogOpen, setPartImportDialogOpen] = useState(false)
  const [partImportFile, setPartImportFile] = useState<File | null>(null)
  const [partImportPreview, setPartImportPreview] = useState<any | null>(null)
  const [partImporting, setPartImporting] = useState(false)

  useEffect(() => {
    loadTrains()
    loadParts()
  }, [])

  async function loadTrains() {
    setTrainsLoading(true)
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
      setTrainsLoading(false)
    }
  }

  async function loadParts() {
    setPartsLoading(true)
    try {
      const res = await fetch('/api/parts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setParts(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPartsLoading(false)
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
        setEditTrainDialogOpen(false)
        loadTrains()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ذخیره‌سازی مشخصات قطار')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function savePart() {
    try {
      const method = activePart ? 'PATCH' : 'POST'
      const url = activePart ? `/api/parts/${activePart.id}` : '/api/parts'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: partName,
          partNumber: partNumberField || undefined,
          trainType: partTrainType,
          description: partDescription || undefined,
        }),
      })

      if (res.ok) {
        setEditPartDialogOpen(false)
        loadParts()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ذخیره‌سازی قطعه')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteTrain(id: string) {
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

  async function handleDeletePart(id: string) {
    if (!confirm('آیا از حذف این قطعه مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        loadParts()
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

  function openEditTrain(train: any | null = null) {
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
    setEditTrainDialogOpen(true)
  }

  function openEditPart(part: any | null = null) {
    setActivePart(part)
    if (part) {
      setPartName(part.name)
      setPartNumberField(part.partNumber || '')
      setPartTrainType(part.trainType)
      setPartDescription(part.description || '')
    } else {
      setPartName('')
      setPartNumberField('')
      setPartTrainType('both')
      setPartDescription('')
    }
    setEditPartDialogOpen(true)
  }

  async function handleTrainImportValidate() {
    if (!trainImportFile) return
    setTrainImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', trainImportFile)
      const res = await fetch('/api/fleet/trains/import?mode=validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setTrainImportPreview(json.data)
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در بررسی فایل')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTrainImporting(false)
    }
  }

  async function handleTrainImportCommit() {
    if (!trainImportPreview || trainImportPreview.validRows.length === 0) return
    setTrainImporting(true)
    try {
      const res = await fetch('/api/fleet/trains/import?mode=commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          validRows: trainImportPreview.validRows,
        }),
      })
      if (res.ok) {
        alert('بارگذاری با موفقیت انجام شد')
        setTrainImportDialogOpen(false)
        setTrainImportFile(null)
        setTrainImportPreview(null)
        loadTrains()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ایمپورت نهایی')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTrainImporting(false)
    }
  }

  async function handlePartImportValidate() {
    if (!partImportFile) return
    setPartImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', partImportFile)
      const res = await fetch('/api/parts/import?mode=validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setPartImportPreview(json.data)
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در بررسی فایل')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPartImporting(false)
    }
  }

  async function handlePartImportCommit() {
    if (!partImportPreview || partImportPreview.validRows.length === 0) return
    setPartImporting(true)
    try {
      const res = await fetch('/api/parts/import?mode=commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          validRows: partImportPreview.validRows,
        }),
      })
      if (res.ok) {
        alert('بارگذاری قطعات با موفقیت انجام شد')
        setPartImportDialogOpen(false)
        setPartImportFile(null)
        setPartImportPreview(null)
        loadParts()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ایمپورت نهایی')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPartImporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            مدیریت فنی و ناوگان خط ۱ مترو
          </h1>
          <p className="text-sm text-foreground-muted">تعریف، به‌روزرسانی ناوگان قطارها و مدیریت کاتالوگ قطعات یدکی</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid grid-cols-2 max-w-[400px] mb-4 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="trains" className="text-xs">ناوگان قطارها</TabsTrigger>
          <TabsTrigger value="parts" className="text-xs">کاتالوگ قطعات یدکی</TabsTrigger>
        </TabsList>

        <TabsContent value="trains" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">لیست قطارهای خط ۱</h2>
            <div className="flex items-center gap-3">
              <Button onClick={() => setTrainImportDialogOpen(true)} variant="outline" className="text-xs bg-zinc-900 border-zinc-800">
                ورود قطارها از اکسل
              </Button>
              <Button onClick={() => openEditTrain(null)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
                + افزودن قطار جدید
              </Button>
            </div>
          </div>

          {trainsLoading ? (
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
                        <TableCell className="font-bold text-foreground text-right">{toFa(train.trainNumber)}</TableCell>
                        <TableCell className="text-right">{train.fleetSeries || 'AC02'}</TableCell>
                        <TableCell className="text-right">{train.manufacturer || '-'}</TableCell>
                        <TableCell className="text-right">{toFa(train.wagonCount)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={STATUS_CLASSES[train.status as string] || ''}>
                            {STATUS_LABELS[train.status as string] || train.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-zinc-500 text-[10px] select-all">{train.qrToken}</span>
                        </TableCell>
                        <TableCell className="text-left py-2">
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => handleRotateQr(train.id)} variant="outline" className="text-[10px] h-7 px-2 border-zinc-800">
                              بازتولید QR
                            </Button>
                            <Button onClick={() => openEditTrain(train)} variant="outline" className="text-[10px] h-7 px-2 border-zinc-800 text-blue-400 hover:text-blue-300">
                              ویرایش
                            </Button>
                            <Button onClick={() => handleDeleteTrain(train.id)} variant="outline" className="text-[10px] h-7 px-2 border-zinc-800 text-red-400 hover:text-red-300">
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {trains.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                          هیچ قطاری تعریف نشده است.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">کاتالوگ قطعات و متریال فنی</h2>
            <div className="flex items-center gap-3">
              <Button onClick={() => setPartImportDialogOpen(true)} variant="outline" className="text-xs bg-zinc-900 border-zinc-800">
                ورود قطعات از اکسل
              </Button>
              <Button onClick={() => openEditPart(null)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
                + افزودن قطعه جدید
              </Button>
            </div>
          </div>

          {partsLoading ? (
            <div className="text-center py-20 bg-surface border border-border rounded-xl">
              <span className="text-sm text-foreground-muted animate-pulse">در حال بارگذاری اطلاعات قطعات...</span>
            </div>
          ) : (
            <Card className="border border-border bg-surface">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-right">نام قطعه</TableHead>
                      <TableHead className="text-right">شماره فنی</TableHead>
                      <TableHead className="text-right">نوع قطار پشتیبانی‌شده</TableHead>
                      <TableHead className="text-right">توضیحات</TableHead>
                      <TableHead className="text-left w-48"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow key={part.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                        <TableCell className="font-bold text-foreground text-right">{part.name}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-400 text-xs">{part.partNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                            {part.trainType === 'AC' ? 'فقط AC' : part.trainType === 'DC' ? 'فقط DC' : 'مشترک (AC / DC)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-zinc-400 text-xs max-w-xs truncate">{part.description || '-'}</TableCell>
                        <TableCell className="text-left py-2">
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => openEditPart(part)} variant="outline" className="text-[10px] h-7 px-2 border-zinc-800 text-blue-400 hover:text-blue-300">
                              ویرایش
                            </Button>
                            <Button onClick={() => handleDeletePart(part.id)} variant="outline" className="text-[10px] h-7 px-2 border-zinc-800 text-red-400 hover:text-red-300">
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {parts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                          هیچ قطعه‌ای ثبت نشده است.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* EDIT TRAIN DIALOG */}
      <Dialog open={editTrainDialogOpen} onOpenChange={setEditTrainDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border">
          <DialogHeader>
            <DialogTitle>{activeTrain ? 'ویرایش مشخصات قطار' : 'افزودن قطار جدید به ناوگان'}</DialogTitle>
            <DialogDescription>مشخصات فنی و وضعیت قطار را مدیریت کنید.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>شماره قطار *</Label>
              <Input
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="مثال: ۱۰۱"
                disabled={!!activeTrain}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>سری ناوگان:</Label>
              <Input
                value={fleetSeries}
                onChange={(e) => setFleetSeries(e.target.value)}
                placeholder="مثال: DC01 یا AC02"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>شرکت سازنده:</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="مثال: CRRC یا CNR"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>تعداد کل واگن‌ها:</Label>
              <Input
                type="number"
                value={wagonCount}
                onChange={(e) => setWagonCount(parseInt(e.target.value, 10))}
                disabled={!!activeTrain}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>وضعیت جاری در شبکه خط ۱:</Label>
              <Select value={status} onValueChange={(val) => setStatus(val || '')}>
                <SelectTrigger className="text-xs h-9 bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectValue placeholder="انتخاب وضعیت..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="hover:bg-zinc-800">
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
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setEditTrainDialogOpen(false)} className="text-xs bg-zinc-900 border-zinc-800">
              انصراف
            </Button>
            <Button onClick={saveTrain} disabled={!trainNumber.trim()} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              ذخیره اطلاعات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PART DIALOG */}
      <Dialog open={editPartDialogOpen} onOpenChange={setEditPartDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border">
          <DialogHeader>
            <DialogTitle>{activePart ? 'ویرایش مشخصات قطعه' : 'ثبت قطعه فنی جدید'}</DialogTitle>
            <DialogDescription>اطلاعات قطعه را برای تطبیق خودکار در فرآیند تعمیرات ثبت کنید.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نام قطعه *</Label>
              <Input
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="مثال: سیلندر ترمز واگن"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>شماره فنی (Part Number)</Label>
              <Input
                value={partNumberField}
                onChange={(e) => setPartNumberField(e.target.value)}
                placeholder="مثال: PN-992-BRK"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع قطار سازگار *</Label>
              <Select value={partTrainType} onValueChange={(val) => setPartTrainType(val || 'both')}>
                <SelectTrigger className="text-xs h-9 bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectValue placeholder="سازگاری قطار..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  <SelectItem value="both" className="hover:bg-zinc-800">مشترک (AC / DC)</SelectItem>
                  <SelectItem value="AC" className="hover:bg-zinc-800">فقط AC</SelectItem>
                  <SelectItem value="DC" className="hover:bg-zinc-800">فقط DC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>توضیحات قطعه</Label>
              <Input
                value={partDescription}
                onChange={(e) => setPartDescription(e.target.value)}
                placeholder="کاربرد، محل نصب و مشخصات..."
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setEditPartDialogOpen(false)} className="text-xs bg-zinc-900 border-zinc-800">
              انصراف
            </Button>
            <Button onClick={savePart} disabled={!partName.trim()} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              ذخیره اطلاعات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRAIN EXCEL IMPORT DIALOG */}
      <Dialog open={trainImportDialogOpen} onOpenChange={setTrainImportDialogOpen}>
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
                onChange={(e) => setTrainImportFile(e.target.files?.[0] || null)}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            {trainImportFile && !trainImportPreview && (
              <Button onClick={handleTrainImportValidate} disabled={trainImporting} className="w-full text-xs">
                {trainImporting ? 'در حال تحلیل...' : 'بارگذاری و پیش‌نمایش فایل'}
              </Button>
            )}

            {trainImportPreview && (
              <div className="space-y-3 border border-border p-4 rounded-lg bg-zinc-900 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-400">تعداد ردیف‌های معتبر: {toFa(trainImportPreview.validCount)}</span>
                  <span className="text-red-400">تعداد خطاها: {toFa(trainImportPreview.errorCount)}</span>
                </div>

                {trainImportPreview.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px]">
                    {trainImportPreview.errors.map((e: any, idx: number) => (
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
                setTrainImportDialogOpen(false)
                setTrainImportFile(null)
                setTrainImportPreview(null)
              }}
              className="text-xs bg-zinc-900 border-zinc-800"
            >
              انصراف
            </Button>
            {trainImportPreview && trainImportPreview.validRows.length > 0 && (
              <Button
                onClick={handleTrainImportCommit}
                disabled={trainImporting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {trainImporting ? 'در حال ثبت...' : `ثبت نهایی ${toFa(trainImportPreview.validCount)} قطار`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PART EXCEL IMPORT DIALOG */}
      <Dialog open={partImportDialogOpen} onOpenChange={setPartImportDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>بارگذاری کاتالوگ قطعات از اکسل</DialogTitle>
            <DialogDescription>
              فایل اکسل باید شامل ستون‌های نام قطعه، شماره قطعه، نوع قطار (AC، DC یا both) و توضیحات باشد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>انتخاب فایل:</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPartImportFile(e.target.files?.[0] || null)}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            {partImportFile && !partImportPreview && (
              <Button onClick={handlePartImportValidate} disabled={partImporting} className="w-full text-xs">
                {partImporting ? 'در حال تحلیل...' : 'بارگذاری و پیش‌نمایش فایل'}
              </Button>
            )}

            {partImportPreview && (
              <div className="space-y-3 border border-border p-4 rounded-lg bg-zinc-900 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-400">تعداد ردیف‌های معتبر: {toFa(partImportPreview.validCount)}</span>
                  <span className="text-red-400">تعداد خطاها: {toFa(partImportPreview.errorCount)}</span>
                </div>

                {partImportPreview.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px]">
                    {partImportPreview.errors.map((e: any, idx: number) => (
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
                setPartImportDialogOpen(false)
                setPartImportFile(null)
                setPartImportPreview(null)
              }}
              className="text-xs bg-zinc-900 border-zinc-800"
            >
              انصراف
            </Button>
            {partImportPreview && partImportPreview.validRows.length > 0 && (
              <Button
                onClick={handlePartImportCommit}
                disabled={partImporting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {partImporting ? 'در حال ثبت...' : `ثبت نهایی ${toFa(partImportPreview.validCount)} قطعه`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
