'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/features/auth'
import { Shield } from 'lucide-react'

// Fetch permissions catalog (hardcoded or from API, we can hardcode for UI for now, or fetch from a new endpoint)
// We'll define a simple one here for the UI based on the server file.
const PERMISSION_GROUPS = [
  {
    resource: 'users',
    label: 'کاربران',
    permissions: [
      { key: 'users:create', label: 'ایجاد' },
      { key: 'users:read', label: 'مشاهده' },
      { key: 'users:update', label: 'ویرایش' },
      { key: 'users:delete', label: 'حذف' },
    ],
  },
  {
    resource: 'roles',
    label: 'نقش‌ها',
    permissions: [{ key: 'iam:roles-manage', label: 'مدیریت نقش‌ها' }],
  },
  {
    resource: 'shifts',
    label: 'شیفت‌ها',
    permissions: [
      { key: 'shifts:read', label: 'مشاهده' },
      { key: 'shifts:write', label: 'مدیریت' },
    ],
  }
]

export default function RoleEditorPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.id as string
  const isNew = roleId === 'new'

  const [formData, setFormData] = useState({
    key: '',
    title: '',
    description: '',
    rank: 0,
    permissions: [] as string[]
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    async function loadRole() {
      try {
        // We'll use the existing /api/admin/roles/[id] endpoint for GET? Wait, there is no GET /api/admin/roles/[id] yet, only PATCH!
        // We might need to fetch from the list and find it, or create a GET endpoint.
        const res = await fetch('/api/admin/iam/roles')
        if (res.ok) {
          const data = await res.json()
          const role = data.data.find((r: any) => r.id === roleId)
          if (role) {
            setFormData({
              key: role.key,
              title: role.title,
              description: role.description || '',
              rank: role.rank,
              permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || [])
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadRole()
  }, [isNew, roleId])

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const url = isNew ? '/api/admin/iam/roles' : `/api/admin/roles/${roleId}`
      const method = isNew ? 'POST' : 'PATCH'
      
      const payload = {
        title: formData.title,
        permissions: formData.permissions,
        rank: Number(formData.rank)
      }
      if (isNew) {
        (payload as any).key = formData.key
        ;(payload as any).description = formData.description
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'خطا در ذخیره اطلاعات')
      }

      router.push('/admin/iam')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">در حال بارگذاری...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? 'ایجاد نقش جدید' : 'ویرایش نقش'}
        </h1>
      </div>

      {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات پایه</CardTitle>
          <CardDescription>مشخصات اصلی نقش</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>شناسه نقش (Key) - فقط انگلیسی</Label>
              <Input
                value={formData.key}
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                disabled={!isNew}
                dir="ltr"
                placeholder="e.g. shift_supervisor"
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان (فارسی)</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="سرپرست شیفت"
              />
            </div>
            <div className="space-y-2">
              <Label>رتبه دسترسی (Rank)</Label>
              <Input
                type="number"
                value={formData.rank}
                onChange={e => setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>دسترسی‌ها (Permissions)</CardTitle>
          <CardDescription>انتخاب دسترسی‌های این نقش در سیستم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PERMISSION_GROUPS.map(group => (
            <div key={group.resource} className="space-y-3">
              <h4 className="font-medium text-lg border-b pb-1">{group.label}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {group.permissions.map(perm => {
                  const isChecked = formData.permissions.includes(perm.key)
                  return (
                    <div key={perm.key} className="flex items-center space-x-2 space-x-reverse bg-muted/50 p-2 rounded-md">
                      <Checkbox
                        id={perm.key}
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                      <Label htmlFor={perm.key} className="cursor-pointer">
                        <span className="text-sm">{perm.label}</span>
                        <span className="text-xs text-muted-foreground block" dir="ltr">{perm.key}</span>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره نقش'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/iam')} disabled={saving}>
          انصراف
        </Button>
      </div>
    </div>
  )
}
