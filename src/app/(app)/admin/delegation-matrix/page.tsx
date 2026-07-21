'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/features/auth'

type MatrixConfig = {
  [key: string]: {
    canView: boolean
    canTransfer: boolean
    canAssignRole: boolean
    maxAssignRoleRank?: number
    canEditProfile: boolean
  }
}

export default function DelegationMatrixPage() {
  const accessToken = useAuthStore(state => state.accessToken)
  
  const [matrix, setMatrix] = useState<MatrixConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const roles = [
    { key: 'shift_lead', title: 'مسئول شیفت' },
    { key: 'station_manager', title: 'مدیر ایستگاه / سرپرست' },
    { key: 'region_manager', title: 'رئیس ناحیه' }
  ]

  const fetchData = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/iam/delegation-matrix', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMatrix(data.data || {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [accessToken])

  const handleSave = async () => {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/iam/delegation-matrix', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ matrix })
      })
      if (res.ok) {
        alert('ماتریس با موفقیت ذخیره شد')
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ذخیره')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateMatrix = (roleKey: string, field: string, value: any) => {
    setMatrix(prev => ({
      ...prev,
      [roleKey]: {
        ...(prev[roleKey] || {}),
        [field]: value
      }
    }))
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ماتریس اختیارات (Delegation Matrix)</h1>
          <p className="text-muted-foreground mt-2">
            تعیین کنید هر سطح از مدیران میانی چه عملیات‌هایی را می‌توانند روی زیرمجموعه خود انجام دهند.
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading || saving} className="bg-primary text-primary-foreground">
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تنظیمات ماتریس</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">در حال بارگذاری...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>سطح مدیریتی</TableHead>
                  <TableHead className="text-center">مشاهده زیرمجموعه</TableHead>
                  <TableHead className="text-center">ویرایش پروفایل</TableHead>
                  <TableHead className="text-center">انتقال پرسنل</TableHead>
                  <TableHead className="text-center">انتساب نقش</TableHead>
                  <TableHead>سقف رتبه انتساب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => {
                  const config = matrix[role.key] || {}
                  return (
                    <TableRow key={role.key}>
                      <TableCell className="font-medium">{role.title}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!config.canView} 
                          onCheckedChange={(c) => updateMatrix(role.key, 'canView', c)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!config.canEditProfile} 
                          onCheckedChange={(c) => updateMatrix(role.key, 'canEditProfile', c)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!config.canTransfer} 
                          onCheckedChange={(c) => updateMatrix(role.key, 'canTransfer', c)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={!!config.canAssignRole} 
                          onCheckedChange={(c) => updateMatrix(role.key, 'canAssignRole', c)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="w-24 text-center"
                          disabled={!config.canAssignRole}
                          value={config.maxAssignRoleRank || ''}
                          onChange={(e) => updateMatrix(role.key, 'maxAssignRoleRank', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
