'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth'

interface OrgUnit {
  id: string
  key: string
  title: string
  kind: string
}

interface Role {
  id: string
  key: string
  title: string
}

interface RoleAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onAssigned?: () => void
}

export function RoleAssignmentModal({ open, onOpenChange, userId, onAssigned }: RoleAssignmentModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [scopeType, setScopeType] = useState('all') // 'all', 'region', 'station', 'shift'
  const [scopeKey, setScopeKey] = useState('')
  const [validTo, setValidTo] = useState('')
  const [reason, setReason] = useState('')
  
  const [loading, setLoading] = useState(false)
  const accessToken = useAuthStore(state => state.accessToken)

  useEffect(() => {
    if (open && accessToken) {
      // Fetch roles and org-units
      const headers = { Authorization: `Bearer ${accessToken}` }
      Promise.all([
        fetch('/api/admin/iam/roles', { headers }).then(r => r.json()),
        fetch('/api/admin/iam/org-units', { headers }).then(r => r.json())
      ]).then(([rolesRes, orgUnitsRes]) => {
        setRoles(rolesRes.data || [])
        setOrgUnits(orgUnitsRes.data || [])
      }).catch(console.error)
    }
  }, [open, accessToken])

  const handleSave = async () => {
    if (!selectedRole || !accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/iam/users/${userId}/roles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          roleId: selectedRole,
          scopeType,
          scopeKey: scopeType === 'all' ? null : scopeKey,
          validTo: validTo ? new Date(validTo).toISOString() : null,
          reason
        })
      })

      if (res.ok) {
        onOpenChange(false)
        if (onAssigned) onAssigned()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در انتساب نقش')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgUnits = orgUnits.filter(u => u.kind === scopeType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>انتساب نقش به کاربر</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>انتخاب نقش</Label>
            <Select value={selectedRole} onValueChange={(val) => { if (val) setSelectedRole(val) }}>
              <SelectTrigger>
                <SelectValue placeholder="نقش را انتخاب کنید..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>محدوده (Scope)</Label>
            <Select value={scopeType} onValueChange={(t) => { if (t) { setScopeType(t); setScopeKey('') } }}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب محدوده..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سیستم (Global)</SelectItem>
                <SelectItem value="line">کل خط ۱</SelectItem>
                <SelectItem value="region">ناحیه</SelectItem>
                <SelectItem value="station">ایستگاه</SelectItem>
                <SelectItem value="shift">شیفت خاص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeType !== 'all' && (
            <div className="space-y-2">
              <Label>کدام {scopeType === 'region' ? 'ناحیه' : scopeType === 'station' ? 'ایستگاه' : scopeType === 'shift' ? 'شیفت' : 'واحد'}؟</Label>
              <Select value={scopeKey} onValueChange={(val) => { if (val) setScopeKey(val) }}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredOrgUnits.map(u => (
                    <SelectItem key={u.key} value={u.key}>{u.title}</SelectItem>
                  ))}
                  {filteredOrgUnits.length === 0 && (
                    <SelectItem value="none" disabled>موردی یافت نشد</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تا تاریخ (اختیاری برای تفویض موقت)</Label>
              <Input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>دلیل / توضیحات</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="مثلاً جانشینی مرخصی" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button onClick={handleSave} disabled={loading || !selectedRole || (scopeType !== 'all' && !scopeKey)}>
            {loading ? 'در حال ذخیره...' : 'انتساب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
