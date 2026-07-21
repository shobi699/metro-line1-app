'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Users, Save, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface VisibilityMatrix {
  id: string
  roleKey: string
  visibleCols: string // JSON string array
  regionFilter: string | null
  showCrewNames: boolean
  showNotes: boolean
  defaultView: string | null
}

const ALL_ROLES = ['admin', 'planner', 'occ', 'supervisor', 'operator', 'station_manager']
const COLUMNS = [
  { key: 'rowNo', label: 'شماره ردیف' },
  { key: 'trainNumber', label: 'شماره قطار' },
  { key: 'direction', label: 'مسیر' },
  { key: 'originStation', label: 'مبدأ' },
  { key: 'destinationStation', label: 'مقصد' },
  { key: 'departureTime', label: 'ساعت حرکت' },
  { key: 'arrivalTime', label: 'ساعت رسیدن' },
  { key: 'status', label: 'وضعیت' },
  { key: 'h1', label: 'راهبر H1' },
  { key: 'h2', label: 'راهبر H2' },
  { key: 't', label: 'تکنسین T' },
  { key: 'r', label: 'رله R' },
]

export default function VisibilityMatrixPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [matrices, setMatrices] = useState<VisibilityMatrix[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchMatrices()
    }
  }, [accessToken])

  const fetchMatrices = async () => {
    try {
      const res = await fetch('/api/admin/roster/visibility-matrix', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (res.ok) {
        // Ensure all roles exist
        let fetched = data.data as VisibilityMatrix[]
        const existingRoles = fetched.map(m => m.roleKey)
        const missingRoles = ALL_ROLES.filter(r => !existingRoles.includes(r))
        
        const newMatrices = missingRoles.map((role, idx) => ({
          id: `new-${idx}`,
          roleKey: role,
          visibleCols: JSON.stringify(COLUMNS.map(c => c.key)),
          regionFilter: null,
          showCrewNames: true,
          showNotes: true,
          defaultView: 'timeline'
        }))
        
        setMatrices([...fetched, ...newMatrices].sort((a, b) => a.roleKey.localeCompare(b.roleKey)))
      } else {
        toast.error(data.error || 'خطا در دریافت اطلاعات')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/roster/visibility-matrix', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ matrices })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        // refresh to get real IDs for new ones
        fetchMatrices()
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setIsSaving(false)
    }
  }

  const updateMatrix = (id: string, updates: Partial<VisibilityMatrix>) => {
    setMatrices(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }

  const toggleColumn = (id: string, colKey: string, currentColsJson: string) => {
    try {
      const cols = JSON.parse(currentColsJson) as string[]
      const newCols = cols.includes(colKey) ? cols.filter(c => c !== colKey) : [...cols, colKey]
      updateMatrix(id, { visibleCols: JSON.stringify(newCols) })
    } catch {
      updateMatrix(id, { visibleCols: JSON.stringify([colKey]) })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/admin/roster" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              بازگشت به پنل لوحه
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            ماتریس دید نقش‌ها
          </h1>
          <p className="text-muted-foreground mt-2">
            تنظیم فیلدهای قابل مشاهده در لوحه برای هر نقش کاربری به صورت مستقل
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          ذخیره تغییرات
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ماتریس دسترسی به ستون‌ها</CardTitle>
          <CardDescription>برای هر نقش، ستون‌هایی که مجاز به مشاهده هستند را انتخاب کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 font-semibold min-w-[120px]">نقش کاربری</th>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="p-3 font-semibold whitespace-nowrap text-center border-r">{col.label}</th>
                  ))}
                  <th className="p-3 font-semibold text-center border-r min-w-[100px]">اسامی هم‌خدمه</th>
                  <th className="p-3 font-semibold text-center border-r min-w-[100px]">یادداشت‌ها</th>
                  <th className="p-3 font-semibold border-r min-w-[120px]">نمای پیش‌فرض</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {matrices.map(matrix => {
                  let visibleCols: string[] = []
                  try { visibleCols = JSON.parse(matrix.visibleCols) } catch {}

                  return (
                    <tr key={matrix.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-bold font-mono text-left" dir="ltr">{matrix.roleKey}</td>
                      
                      {COLUMNS.map(col => (
                        <td key={col.key} className="p-3 text-center border-r">
                          <Checkbox 
                            checked={visibleCols.includes(col.key)}
                            onCheckedChange={() => toggleColumn(matrix.id, col.key, matrix.visibleCols)}
                          />
                        </td>
                      ))}

                      <td className="p-3 text-center border-r bg-muted/20">
                        <Switch 
                          checked={matrix.showCrewNames}
                          onCheckedChange={(val) => updateMatrix(matrix.id, { showCrewNames: val })}
                        />
                      </td>

                      <td className="p-3 text-center border-r bg-muted/20">
                        <Switch 
                          checked={matrix.showNotes}
                          onCheckedChange={(val) => updateMatrix(matrix.id, { showNotes: val })}
                        />
                      </td>

                      <td className="p-3 border-r">
                        <Select 
                          value={matrix.defaultView || undefined} 
                          onValueChange={(val) => updateMatrix(matrix.id, { defaultView: val })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="timeline">تایم‌لاین (Timeline)</SelectItem>
                            <SelectItem value="table">جدول (Table)</SelectItem>
                            <SelectItem value="gantt">گانت‌چارت (Gantt)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
