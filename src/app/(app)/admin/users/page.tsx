'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  X,
  Plus,
  Settings,
  Upload,
  Download,
  Eye,
  Activity,
  Calendar,
  Lock,
  Mail,
  Phone,
  User,
  Database,
  RefreshCw,
  Sparkles,
  ListFilter,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CreditCard,
  Briefcase,
  Clock,
  Award,
  MapPin,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs-jalali'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { PERMISSION_CATALOG } from '@/server/rbac/permissions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ColumnHeaderFilterProps {
  columnKey: string
  columnLabel: string
  uniqueValues: { value: string; count: number }[]
  selectedValues: string[]
  onFilterChange: (values: string[]) => void
  onSort: (direction: 'asc' | 'desc') => void
  currentSort: 'asc' | 'desc' | null
  searchTerm: string
  onSearchChange: (val: string) => void
}

function ColumnHeaderFilter({
  columnKey,
  columnLabel,
  uniqueValues,
  selectedValues,
  onFilterChange,
  onSort,
  currentSort,
  searchTerm,
  onSearchChange,
}: ColumnHeaderFilterProps) {
  const isFiltered = selectedValues.length > 0
  const isSorted = currentSort !== null

  // Filter unique values based on search term
  const filteredValues = uniqueValues.filter(({ value }) =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Popover>
      <PopoverTrigger render={
        <button
          type="button"
          title={`فیلتر و مرتب‌سازی ${columnLabel}`}
          className={cn(
            "p-1 hover:bg-muted/60 text-foreground-muted hover:text-foreground rounded-md transition-all cursor-pointer inline-flex items-center justify-center ms-1",
            isFiltered || isSorted
              ? "bg-accent/15 text-accent border border-accent/25"
              : "border border-transparent"
          )}
        >
          {isSorted ? (
            currentSort === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
          ) : (
            <ListFilter className="size-3" />
          )}
        </button>
      } />
      <PopoverContent align="start" className="w-56 p-3 border border-border bg-surface/95 backdrop-blur-md text-foreground rounded-xl shadow-xl z-50">
        <div className="space-y-2.5" dir="rtl">
          <div className="text-[11px] font-bold text-foreground border-b border-border/40 pb-1.5 text-start">
            فیلتر و مرتب‌سازی: {columnLabel}
          </div>

          {/* Sorting Buttons */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSort('asc')}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer text-start transition-colors",
                currentSort === 'asc'
                  ? "bg-accent/15 text-accent"
                  : "hover:bg-muted/80 text-foreground-muted hover:text-foreground"
              )}
            >
              <ArrowUp className="size-3" />
              مرتب‌سازی صعودی (الفبا / کم به زیاد)
            </button>
            <button
              type="button"
              onClick={() => onSort('desc')}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer text-start transition-colors",
                currentSort === 'desc'
                  ? "bg-accent/15 text-accent"
                  : "hover:bg-muted/80 text-foreground-muted hover:text-foreground"
              )}
            >
              <ArrowDown className="size-3" />
              مرتب‌سازی نزولی (ی تا الف / زیاد به کم)
            </button>
          </div>

          <div className="border-t border-border/40 my-1.5" />

          {/* Search values inside Popover */}
          <div className="relative">
            <Search className="absolute start-2 top-2 size-3 text-foreground-muted" />
            <input
              type="text"
              placeholder="جستجوی مقدار..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-7 ps-7 pe-2 bg-background/50 border border-border/50 rounded-lg text-[10px] outline-none focus:border-accent text-start"
            />
          </div>

          {/* Checklist of Unique Values */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-border/30 p-2 rounded-lg bg-background/20 scrollbar-thin">
            {uniqueValues.length === 0 ? (
              <div className="text-[10px] text-foreground-muted text-center py-2">مقداری یافت نشد</div>
            ) : (
              <>
                <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer select-none justify-start">
                  <input
                    type="checkbox"
                    checked={selectedValues.length === uniqueValues.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedValues.length > 0 && selectedValues.length < uniqueValues.length
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFilterChange(uniqueValues.map((uv) => uv.value))
                      } else {
                        onFilterChange([])
                      }
                    }}
                    className="accent-accent size-3.5 rounded border-border"
                  />
                  <span>انتخاب همه</span>
                </label>

                {filteredValues.map(({ value, count }) => {
                  const isChecked = selectedValues.includes(value)
                  return (
                    <label key={value} className="flex items-center justify-between gap-2 text-[10px] cursor-pointer select-none">
                      <div className="flex items-center gap-2 justify-start">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              onFilterChange(selectedValues.filter((v) => v !== value))
                            } else {
                              onFilterChange([...selectedValues, value])
                            }
                          }}
                          className="accent-accent size-3.5 rounded border-border"
                        />
                        <span>{value}</span>
                      </div>
                      <span className="text-[9px] text-foreground-muted/70 bg-muted/30 px-1.5 py-0.25 rounded font-mono">
                        {toFa(count)}
                      </span>
                    </label>
                  )
                })}
              </>
            )}
          </div>

          {/* Clear Filter Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={() => onFilterChange([])}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold border border-critical/30 bg-critical/5 text-critical hover:bg-critical/10 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              پاک کردن فیلتر این ستون
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CustomFieldDef {
  id: string
  entityType: string
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options: string[] | string | null
  required: boolean
  defaultValue?: string | null
  sortOrder: number
}

interface Role {
  id: string
  key: string
  name: string
  permissions: string
  rank: number
  isSystem: boolean
  _count?: {
    users: number
  }
}

interface User {
  id: string
  nationalId: string
  name: string
  phone: string | null
  email: string | null
  status: 'pending' | 'active' | 'suspended'
  roleId: string
  createdAt: string
  customFields: Record<string, unknown> | null
  role: {
    id: string
    key: string
    name: string
    rank: number
  }
}

function toEn(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/[۰]/g, '0')
    .replace(/[۱]/g, '1')
    .replace(/[۲]/g, '2')
    .replace(/[۳]/g, '3')
    .replace(/[۴]/g, '4')
    .replace(/[۵]/g, '5')
    .replace(/[۶]/g, '6')
    .replace(/[۷]/g, '7')
    .replace(/[۸]/g, '8')
    .replace(/[۹]/g, '9')
}

function getFieldIcon(fieldName: string) {
  switch (fieldName) {
    case 'personnelNo': return <CreditCard className="size-4 text-accent" />
    case 'phone2': return <Phone className="size-4 text-accent" />
    case 'post': return <Briefcase className="size-4 text-accent" />
    case 'shift': return <Calendar className="size-4 text-accent" />
    case 'shiftType': return <Clock className="size-4 text-accent" />
    case 'licenseClass1Date': return <Award className="size-4 text-accent" />
    case 'licenseClass2Date': return <Award className="size-4 text-accent" />
    case 'group': return <Activity className="size-4 text-accent" />
    case 'hireDate': return <Calendar className="size-4 text-accent" />
    case 'birthDate': return <Calendar className="size-4 text-accent" />
    case 'startLocation': return <MapPin className="size-4 text-accent" />
    default: return <Database className="size-4 text-accent" />
  }
}

function syncRoleFromPost(post: string, currentRoles: Role[]): string | null {
  const postRoleKeys: Record<string, string> = {
    'راهبر': 'driver',
    'مسئول شیفت': 'shift_lead',
    'کارشناس': 'expert',
    'تکنسین اعزام پذیرش': 'dispatch_tech',
    'سرپرست': 'supervisor',
    'رئیس': 'chief',
    'مدیر': 'manager',
    'دفتری': 'clerical'
  }

  const targetKey = postRoleKeys[post]
  if (targetKey) {
    const matched = currentRoles.find((r) => r.key === targetKey)
    if (matched) return matched.id
  }
  
  const isAdminPost = ['مدیر', 'رئیس', 'سرپرست'].includes(post)
  const fallbackKey = isAdminPost ? 'admin' : 'operator'
  const fallbackRole = currentRoles.find((r) => r.key === fallbackKey)
  return fallbackRole ? fallbackRole.id : null
}

function calculateAge(birthDateStr: string | null | undefined) {
  if (!birthDateStr) return '—'
  try {
    const jalaliYearMatch = birthDateStr.match(/^(\d{4})[-/]\d{2}[-/]\d{2}/)
    if (jalaliYearMatch) {
      const jYear = parseInt(jalaliYearMatch[1])
      const currentJYear = dayjs().locale('jalali').year()
      return currentJYear - jYear
    }
    const gYear = dayjs(birthDateStr).year()
    if (gYear && !isNaN(gYear)) {
      return dayjs().year() - gYear
    }
  } catch {
    // ignore
  }
  return '—'
}

export default function AdminUsersPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const sessionUser = useAuthStore((s) => s.user)

  // State lists
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([])

  // Loadings
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingFields, setLoadingFields] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'fields' | 'audit_logs'>('users')

  // Selected Role & Permissions for matrix editor
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [permissionSearch, setPermissionSearch] = useState('')

  // Modal Dialog states
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [fieldModalOpen, setFieldModalOpen] = useState(false)

  // Form Fields - User
  const [nationalId, setNationalId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<'pending' | 'active' | 'suspended'>('active')
  const [userCustomFields, setUserCustomFields] = useState<Record<string, string | number | boolean>>({})

  // Form Fields - Role
  const [roleKey, setRoleKey] = useState('')
  const [roleName, setRoleName] = useState('')
  const [roleRank, setRoleRank] = useState(0)

  // Form Fields - CustomFieldDef
  const [fieldName, setFieldName] = useState('')
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select' | 'date' | 'boolean'>('text')
  const [fieldOptionsRaw, setFieldOptionsRaw] = useState('')
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldDefaultValue, setFieldDefaultValue] = useState('')

  function getUserFieldValue(user: User, fieldName: string) {
    const val = user.customFields?.[fieldName]
    if (val !== undefined && val !== null && val !== '') {
      return val
    }
    const def = customFieldDefs.find((d) => d.name === fieldName)
    return def?.defaultValue ?? ''
  }

  // User Detail Sheet States
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [userAuditLogs, setUserAuditLogs] = useState<any[]>([])
  const [loadingUserAuditLogs, setLoadingUserAuditLogs] = useState(false)
  const [detailTab, setDetailTab] = useState<'profile' | 'logs'>('profile')

  // Global Audit Logs States
  const [globalAuditLogs, setGlobalAuditLogs] = useState<any[]>([])
  const [loadingGlobalAuditLogs, setLoadingGlobalAuditLogs] = useState(false)
  const [auditLogSearch, setAuditLogSearch] = useState('')
  const [auditLogAction, setAuditLogAction] = useState('')
  const [auditLogEntity, setAuditLogEntity] = useState('')

  // Password Reset States
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingUser, setResettingUser] = useState<User | null>(null)

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Excel-like sorting and filtering states
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [columnSearchTerms, setColumnSearchTerms] = useState<Record<string, string>>({})

  function getColumnValue(user: User, key: string): string {
    switch (key) {
      case 'name':
        return user.name || ''
      case 'nationalId':
        return user.nationalId ? toFa(user.nationalId) : '—'
      case 'phone':
        return user.phone ? toFa(user.phone) : '—'
      case 'phone2': {
        const p2 = getUserFieldValue(user, 'phone2')
        return p2 ? toFa(String(p2)) : '—'
      }
      case 'personnelNo': {
        const pNo = getUserFieldValue(user, 'personnelNo')
        return pNo ? toFa(String(pNo)) : '—'
      }
      case 'status':
        return statusLabels[user.status]?.text || user.status
      case 'post':
        return String(getUserFieldValue(user, 'post') || user.role?.name || 'فاقد نقش')
      case 'shift': {
        const s = getUserFieldValue(user, 'shift')
        return s ? String(s) : '—'
      }
      case 'shiftType': {
        const st = getUserFieldValue(user, 'shiftType')
        return st ? String(st) : '—'
      }
      case 'certificate': {
        const c1 = getUserFieldValue(user, 'licenseClass1Date')
        const c2 = getUserFieldValue(user, 'licenseClass2Date')
        const hasC1 = c1 && String(c1).trim() !== '0' && String(c1).trim() !== ''
        const hasC2 = c2 && String(c2).trim() !== '0' && String(c2).trim() !== ''
        if (hasC1 && hasC2) return `پایه ۱ و ۲`
        if (hasC1) return `پایه ۱`
        if (hasC2) return `پایه ۲`
        return 'فاقد گواهینامه'
      }
      case 'group': {
        const groupVal = getUserFieldValue(user, 'group')
        if (!groupVal) return '—'
        return groupVal === 'Staff' ? 'ستادی' : `گروه ${groupVal}`
      }
      case 'hireDate': {
        const hDate = getUserFieldValue(user, 'hireDate')
        return hDate ? toFa(String(hDate)) : '—'
      }
      case 'birthDate': {
        const bDate = getUserFieldValue(user, 'birthDate')
        return bDate ? toFa(String(bDate)) : '—'
      }
      case 'age': {
        const bDate = getUserFieldValue(user, 'birthDate')
        if (!bDate) return '—'
        try {
          const parts = String(bDate).split('/')
          if (parts.length > 0) {
            const birthYear = parseInt(parts[0], 10)
            if (!isNaN(birthYear)) {
              const currentJalaliYear = 1405
              const age = currentJalaliYear - birthYear
              return age > 0 ? toFa(String(age)) : '—'
            }
          }
        } catch {}
        return '—'
      }
      case 'startLocation':
        return String(getUserFieldValue(user, 'startLocation') || getUserFieldValue(user, 'station') || '—')
      default: {
        const val = getUserFieldValue(user, key)
        return val !== undefined && val !== null ? String(val) : '—'
      }
    }
  }

  function getUniqueValues(columnKey: string): { value: string; count: number }[] {
    const values = users.map((user) => getColumnValue(user, columnKey))
    const counts: Record<string, number> = {}
    values.forEach((v) => {
      counts[v] = (counts[v] || 0) + 1
    })

    const unique = Array.from(new Set(values))
      .filter((v) => v !== '' && v !== '—')
      .sort((a, b) => a.localeCompare(b, 'fa'))

    return unique.map((v) => ({
      value: v,
      count: counts[v] || 0,
    }))
  }

  function handleFilterChange(key: string, values: string[]) {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: values,
    }))
  }

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === direction) {
        return null
      }
      return { key, direction }
    })
  }

  function handleColumnSearchChange(key: string, val: string) {
    setColumnSearchTerms((prev) => ({
      ...prev,
      [key]: val,
    }))
  }

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users]

    // 1. Apply Global Search Term (search name, national ID, phone, email, and dynamic fields)
    if (searchTerm.trim() !== '') {
      const s = toEn(searchTerm.trim().toLowerCase())
      result = result.filter((user) => {
        if (user.name?.toLowerCase().includes(s)) return true
        if (user.nationalId?.includes(s)) return true
        if (user.phone?.includes(s)) return true
        if (user.email?.toLowerCase().includes(s)) return true
        if (user.customFields) {
          const matched = Object.values(user.customFields).some((val) => {
            if (val === null || val === undefined) return false
            const valStr = toEn(String(val).toLowerCase())
            return valStr.includes(s)
          })
          if (matched) return true
        }
        return false
      })
    }

    // 2. Apply Status Filter
    if (statusFilter) {
      result = result.filter((user) => user.status === statusFilter)
    }

    // 3. Apply Role Filter
    if (roleFilter) {
      result = result.filter((user) => user.roleId === roleFilter)
    }

    // 4. Apply Excel-like Column Filters
    Object.entries(columnFilters).forEach(([columnKey, selectedVals]) => {
      if (!selectedVals || selectedVals.length === 0) return
      result = result.filter((user) => {
        const val = getColumnValue(user, columnKey)
        return selectedVals.includes(val)
      })
    })

    // 5. Apply Excel-like Sorting
    if (sortConfig) {
      const { key, direction } = sortConfig
      result.sort((a, b) => {
        const valA = getColumnValue(a, key)
        const valB = getColumnValue(b, key)

        // Convert Persian digits to English for correct numeric check
        const enA = toEn(valA)
        const enB = toEn(valB)

        const numA = Number(enA)
        const numB = Number(enB)
        if (enA !== '' && enB !== '' && !isNaN(numA) && !isNaN(numB)) {
          return direction === 'asc' ? numA - numB : numB - numA
        }

        // Alphabetical sort for strings
        return direction === 'asc'
          ? valA.localeCompare(valB, 'fa')
          : valB.localeCompare(valA, 'fa')
      })
    }

    return result
  }, [users, searchTerm, statusFilter, roleFilter, columnFilters, sortConfig])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Fetch Users
  async function loadUsers() {
    if (!accessToken) return
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setUsers(json.data || [])
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در دریافت کاربران' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch Roles
  async function loadRoles() {
    if (!accessToken) return
    setLoadingRoles(true)
    try {
      const res = await fetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const fetchedRoles = json.data || []
        setRoles(fetchedRoles)
        if (fetchedRoles.length > 0 && !selectedRole) {
          selectRoleItem(fetchedRoles[0])
        }
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در دریافت نقش‌ها' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setLoadingRoles(false)
    }
  }

  // Fetch Custom Field Definitions
  async function loadCustomFieldDefs() {
    if (!accessToken) return
    setLoadingFields(true)
    try {
      const res = await fetch('/api/custom-fields?entityType=User', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCustomFieldDefs(json.data || [])
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در دریافت فیلدهای پویا' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setLoadingFields(false)
    }
  }

  // Fetch User-Specific Audit Logs
  async function loadUserAuditLogs(userId: string) {
    if (!accessToken) return
    setLoadingUserAuditLogs(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/audit-logs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setUserAuditLogs(json.data || [])
      }
    } catch (error) {
      console.error('Error loading user audit logs:', error)
    } finally {
      setLoadingUserAuditLogs(false)
    }
  }

  // Fetch Global Audit Logs
  async function loadGlobalAuditLogs() {
    if (!accessToken) return
    setLoadingGlobalAuditLogs(true)
    try {
      const query = new URLSearchParams()
      if (auditLogSearch) query.append('search', auditLogSearch)
      if (auditLogAction) query.append('action', auditLogAction)
      if (auditLogEntity) query.append('entity', auditLogEntity)

      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setGlobalAuditLogs(json.data || [])
      }
    } catch (error) {
      console.error('Error loading global audit logs:', error)
    } finally {
      setLoadingGlobalAuditLogs(false)
    }
  }

  function selectRoleItem(role: Role) {
    setSelectedRole(role)
    try {
      const parsed = typeof role.permissions === 'string'
        ? JSON.parse(role.permissions)
        : role.permissions
      setRolePermissions(Array.isArray(parsed) ? parsed : [])
    } catch {
      setRolePermissions([])
    }
  }

  function openUserDetail(user: User) {
    setSelectedUserForDetail(user)
    setUserAuditLogs([])
    setDetailTab('profile')
    setDetailDrawerOpen(true)
    void loadUserAuditLogs(user.id)
  }

  useEffect(() => {
    if (accessToken) {
      void loadUsers()
      void loadRoles()
      void loadCustomFieldDefs()
    }
  }, [accessToken])

  useEffect(() => {
    if (activeTab === 'audit_logs' && accessToken) {
      void loadGlobalAuditLogs()
    }
  }, [activeTab, auditLogSearch, auditLogAction, auditLogEntity, accessToken])

  // Export Users to Excel
  async function handleExcelExport() {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/export/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users-export-${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setNotification({ type: 'success', text: 'خروجی اکسل با موفقیت دریافت شد.' })
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در دریافت خروجی اکسل' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Import Users from Excel
  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !accessToken) return

    e.target.value = ''
    setActionLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const json = await res.json()
      if (res.ok) {
        const data = json.data
        if (data.errors && data.errors.length > 0) {
          setNotification({
            type: 'error',
            text: `بارگذاری پایان یافت. تعداد ${toFa(data.successCount)} کاربر با موفقیت ثبت شد و ${toFa(data.errorCount)} ردیف دارای خطا بود.`,
          })
          if (data.errorReportUrl) {
            const a = document.createElement('a')
            a.href = data.errorReportUrl
            a.download = `import-errors-${new Date().toISOString().slice(0, 10)}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        } else {
          setNotification({
            type: 'success',
            text: `تعداد ${toFa(data.successCount)} کاربر با موفقیت از فایل اکسل وارد شدند.`,
          })
        }
        loadUsers()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در بارگذاری فایل اکسل' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Approve pending user
  async function handleApprove(userId: string, defaultRoleKey: string = 'operator') {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roleKey: defaultRoleKey }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'کاربر با موفقیت تأیید و فعال گردید.' })
        loadUsers()
        if (selectedUserForDetail?.id === userId) {
          setSelectedUserForDetail({ ...selectedUserForDetail, status: 'active' })
          void loadUserAuditLogs(userId)
        }
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در تایید کاربر' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Delete User
  async function handleDeleteUser(userId: string) {
    if (!confirm('آیا از حذف کامل این کاربر اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) {
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'کاربر با موفقیت حذف گردید.' })
        setDetailDrawerOpen(false)
        loadUsers()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در حذف کاربر' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Save/Create User
  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setActionLoading(true)

    const payload = userModalMode === 'create'
      ? { nationalId, name, phone, email, password, roleId, status, customFields: userCustomFields }
      : { name, phone, email, roleId, status, customFields: userCustomFields }

    const url = userModalMode === 'create'
      ? '/api/admin/users'
      : `/api/admin/users/${editingUserId}`

    const method = userModalMode === 'create' ? 'POST' : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: userModalMode === 'create' ? 'کاربر جدید ایجاد شد.' : 'مشخصات کاربر بروزرسانی گردید.',
        })
        setUserModalOpen(false)
        loadUsers()
        if (userModalMode === 'edit' && selectedUserForDetail?.id === editingUserId) {
          const updatedUser = { ...selectedUserForDetail, name, phone, email, roleId, status, customFields: userCustomFields }
          setSelectedUserForDetail(updatedUser)
          void loadUserAuditLogs(editingUserId)
        }
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ثبت اطلاعات کاربر' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }
  // Open Create User Modal
  function openCreateUserModal() {
    setUserModalMode('create')
    setNationalId('')
    setName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setRoleId(roles[0]?.id || '')
    setStatus('active')

    const initialFields: Record<string, string | number | boolean> = {
      personnelNo: '',
      phone2: '',
      post: 'راهبر',
      shift: 'A',
      shiftType: '9-15',
      group: '',
      hireDate: '',
      birthDate: '',
      startLocation: 'شهر ري',
      licenseClass1Date: '',
      licenseClass2Date: '',
    }
    setUserCustomFields(initialFields)
    setUserModalOpen(true)
  }

  // Open Edit User Modal
  function openEditUserModal(user: User) {
    setUserModalMode('edit')
    setEditingUserId(user.id)
    setName(user.name)
    setPhone(user.phone || '')
    setEmail(user.email || '')
    setRoleId(user.roleId)
    setStatus(user.status)

    const initialFields: Record<string, string | number | boolean> = {
      personnelNo: String(user.customFields?.personnelNo || ''),
      phone2: String(user.customFields?.phone2 || ''),
      post: String(user.customFields?.post || 'راهبر'),
      shift: String(user.customFields?.shift || 'A'),
      shiftType: String(user.customFields?.shiftType || '9-15'),
      group: String(user.customFields?.group || ''),
      hireDate: String(user.customFields?.hireDate || ''),
      birthDate: String(user.customFields?.birthDate || ''),
      startLocation: String(user.customFields?.startLocation || 'شهر ري'),
      licenseClass1Date: String(user.customFields?.licenseClass1Date || ''),
      licenseClass2Date: String(user.customFields?.licenseClass2Date || ''),
    }
    setUserCustomFields(initialFields)
    setUserModalOpen(true)
  }

  // Quick Status Toggle
  async function handleQuickUpdateStatus(userId: string, newStatus: 'pending' | 'active' | 'suspended') {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'وضعیت کاربر با موفقیت بروزرسانی شد.' })
        const updatedUsers = users.map((u) => u.id === userId ? { ...u, status: newStatus } : u)
        setUsers(updatedUsers)
        if (selectedUserForDetail?.id === userId) {
          setSelectedUserForDetail({ ...selectedUserForDetail, status: newStatus })
        }
        void loadUserAuditLogs(userId)
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در بروزرسانی وضعیت' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Quick Role Toggle
  async function handleQuickUpdateRole(userId: string, newRoleId: string) {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roleId: newRoleId }),
      })
      const json = await res.json()
      if (res.ok) {
        const newRole = roles.find((r) => r.id === newRoleId)
        setNotification({ type: 'success', text: 'نقش کاربر با موفقیت بروزرسانی شد.' })
        const updatedUsers = users.map((u) =>
          u.id === userId && newRole
            ? { ...u, roleId: newRoleId, role: { ...u.role, id: newRoleId, name: newRole.name, key: newRole.key } }
            : u
        )
        setUsers(updatedUsers)
        if (selectedUserForDetail?.id === userId && newRole) {
          setSelectedUserForDetail({
            ...selectedUserForDetail,
            roleId: newRoleId,
            role: { ...selectedUserForDetail.role, id: newRoleId, name: newRole.name, key: newRole.key }
          })
        }
        void loadUserAuditLogs(userId)
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در بروزرسانی نقش' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Reset Password Action
  function openPasswordResetModal(user: User) {
    setResettingUser(user)
    setNewPassword('')
    setPasswordResetModalOpen(true)
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !resettingUser) return
    if (newPassword.length < 6) {
      setNotification({ type: 'error', text: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${resettingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: `رمز عبور کاربر ${resettingUser.name} با موفقیت بازنشانی شد.` })
        setPasswordResetModalOpen(false)
        if (selectedUserForDetail?.id === resettingUser.id) {
          void loadUserAuditLogs(resettingUser.id)
        }
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در بازنشانی رمز عبور' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Save Role Permissions Matrix
  async function handleSavePermissions() {
    if (!selectedRole || !accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ permissions: rolePermissions }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'مجوزهای نقش با موفقیت بروزرسانی شدند.' })
        const updated = roles.map((r) =>
          r.id === selectedRole.id ? { ...r, permissions: JSON.stringify(rolePermissions) } : r
        )
        setRoles(updated)
        setSelectedRole({ ...selectedRole, permissions: JSON.stringify(rolePermissions) })
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ذخیره مجوزها' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Create Role
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key: roleKey,
          name: roleName,
          rank: Number(roleRank),
          permissions: [],
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'نقش جدید با موفقیت ایجاد گردید.' })
        setRoleModalOpen(false)
        setRoleKey('')
        setRoleName('')
        setRoleRank(0)
        loadRoles()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ایجاد نقش' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Role
  async function handleDeleteRole(role: Role) {
    if (role.isSystem) {
      setNotification({ type: 'error', text: 'امکان حذف نقش‌های سیستمی اصلی وجود ندارد.' })
      return
    }
    if (!confirm(`آیا مطمئن هستید که می‌خواهید نقش "${role.name}" را حذف کنید؟`)) {
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'نقش با موفقیت حذف گردید.' })
        if (selectedRole?.id === role.id) {
          setSelectedRole(null)
        }
        loadRoles()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در حذف نقش' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }
  // Create CustomFieldDef
  async function handleCreateField(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setActionLoading(true)

    const parsedOptions = fieldOptionsRaw
      ? fieldOptionsRaw.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
      : []

    try {
      const res = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          entityType: 'User',
          name: fieldName,
          label: fieldLabel,
          type: fieldType,
          options: parsedOptions,
          required: fieldRequired,
          defaultValue: fieldDefaultValue || null,
          sortOrder: customFieldDefs.length + 1,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'فیلد پویای جدید با موفقیت ایجاد گردید.' })
        setFieldModalOpen(false)
        setFieldName('')
        setFieldLabel('')
        setFieldType('text')
        setFieldOptionsRaw('')
        setFieldRequired(false)
        setFieldDefaultValue('')
        loadCustomFieldDefs()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ایجاد فیلد پویا' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Delete CustomFieldDef
  async function handleDeleteField(fieldId: string) {
    if (!confirm('آیا از حذف این فیلد پویای پرونده پرسنل اطمینان دارید؟ اطلاعات متناظر آن در پروفایل پرسنل حذف نخواهند شد ولی دیگر در جدول نمایش داده نمی‌شوند.')) {
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'فیلد پویا با موفقیت حذف گردید.' })
        loadCustomFieldDefs()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در حذف فیلد پویا' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(false)
    }
  }

  // Create all default roster fields for Metro Line 1
  async function handleCreateDefaultRosterFields() {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const existingNames = new Set(customFieldDefs.map((f) => f.name))
      const fieldsToCreate = [
        { name: 'personnelNo', label: 'کد پرسنلی', type: 'text', required: true, sortOrder: 1, defaultValue: null },
        { name: 'phone2', label: 'شماره تماس ۲', type: 'text', required: false, sortOrder: 2, defaultValue: null },
        { name: 'post', label: 'پست سازمانی', type: 'select', options: ['راهبر', 'مسئول شیفت', 'کارشناس', 'تکنسین اعزام پذیرش', 'سرپرست', 'رئیس', 'مدیر', 'دفتری'], required: false, sortOrder: 3, defaultValue: 'راهبر' },
        { name: 'shift', label: 'شیفت', type: 'select', options: ['A', 'B', 'C', 'ستادی'], required: false, sortOrder: 4, defaultValue: 'A' },
        { name: 'shiftType', label: 'نوع شیفت', type: 'select', options: ['9-15', '12-24', '9 ساعته', '12 ساعته', 'ستادی'], required: false, sortOrder: 3, defaultValue: '9-15' },
        { name: 'licenseClass1Date', label: 'تاریخ اخذ گواهینامه پایه1', type: 'text', required: false, sortOrder: 5, defaultValue: null },
        { name: 'licenseClass2Date', label: 'تاریخ اخذ گواهینامه پایه2', type: 'text', required: false, sortOrder: 6, defaultValue: null },
        { name: 'group', label: 'گروه راهبری', type: 'text', required: true, sortOrder: 7, defaultValue: '1' },
        { name: 'hireDate', label: 'تاریخ استخدام', type: 'text', required: false, sortOrder: 8, defaultValue: null },
        { name: 'birthDate', label: 'تاریخ تولد', type: 'text', required: false, sortOrder: 9, defaultValue: null },
        { name: 'startLocation', label: 'محل شروع به کار', type: 'select', options: ['شهرری', 'تجریش', 'شاهد باقرشهر', 'پایانه فتح آباد'], required: false, sortOrder: 10, defaultValue: 'تجریش' },
      ]

      let createdCount = 0
      for (const f of fieldsToCreate) {
        if (existingNames.has(f.name)) continue

        const res = await fetch('/api/custom-fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            entityType: 'User',
            name: f.name,
            label: f.label,
            type: f.type,
            options: f.options || [],
            required: f.required,
            defaultValue: f.defaultValue,
            sortOrder: f.sortOrder,
          }),
        })

        if (res.ok) createdCount++
      }

      setNotification({
        type: 'success',
        text: createdCount > 0
          ? `تعداد ${toFa(createdCount)} فیلد پایه پرسنلی با موفقیت ایجاد و فعال شد.`
          : 'همه فیلدهای پایه پرسنلی از قبل در سیستم فعال هستند.'
      })
      loadCustomFieldDefs()
    } catch {
      setNotification({ type: 'error', text: 'خطا در ایجاد فیلدهای پایه پرسنلی' })
    } finally {
      setActionLoading(false)
    }
  }

  // Grouped Permission Bulk Action Toggle
  function handleToggleAllInGroup(groupKeys: string[], allSelected: boolean) {
    if (allSelected) {
      setRolePermissions(rolePermissions.filter((p) => !groupKeys.includes(p)))
    } else {
      const toAdd = groupKeys.filter((k) => !rolePermissions.includes(k))
      setRolePermissions([...rolePermissions, ...toAdd])
    }
  }

  function handlePermissionToggle(key: string) {
    if (rolePermissions.includes(key)) {
      setRolePermissions(rolePermissions.filter((p) => p !== key))
    } else {
      setRolePermissions([...rolePermissions, key])
    }
  }

  function handleUserCustomFieldChange(name: string, value: string | number | boolean) {
    setUserCustomFields((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }
      if (name === 'post' && typeof value === 'string') {
        const newRoleId = syncRoleFromPost(value, roles)
        if (newRoleId) {
          setRoleId(newRoleId)
        }
      }
      return updated
    })
  }

  // Convert Audit Log payload to Persian description
  function getAuditLogDescription(log: any) {
    const actorName = log.actor?.name || 'سیستم'
    const action = log.action
    const entity = log.entity

    let actionStr = ''
    switch (action) {
      case 'create': actionStr = 'ایجاد کرد'
        break
      case 'update': actionStr = 'ویرایش کرد'
        break
      case 'delete': actionStr = 'حذف کرد'
        break
      case 'login': return `کاربر ${actorName} وارد سیستم شد.`
      case 'logout': return `کاربر ${actorName} از سیستم خارج شد.`
      case 'import': return `کاربر ${actorName} داده‌ها را از طریق اکسل وارد کرد.`
      case 'export': return `کاربر ${actorName} از داده‌ها خروجی اکسل گرفت.`
      default: actionStr = action
    }

    let entityStr = ''
    switch (entity) {
      case 'User': entityStr = 'پرسنل'
        break
      case 'Role': entityStr = 'نقش سازمانی'
        break
      case 'Setting': entityStr = 'تنظیمات سیستم'
        break
      case 'Shift': entityStr = 'لوحه شیفت‌ها'
        break
      case 'SafetyBulletin': entityStr = 'بخش‌نامه ایمنی'
        break
      case 'Ticket': entityStr = 'تیکت خرابی'
        break
      default: entityStr = entity
    }

    // Customize details
    if (entity === 'User' && action === 'update') {
      const after = log.after ? (typeof log.after === 'string' ? JSON.parse(log.after) : log.after) : {}
      if (after.status) {
        const statusMap: Record<string, string> = { active: 'فعال', suspended: 'معلق', pending: 'در حال بررسی' }
        return `وضعیت پرسنل توسط ${actorName} به «${statusMap[after.status] || after.status}» تغییر یافت.`
      }
      if (after.passwordChanged) {
        return `کلمه عبور پرسنل توسط ${actorName} بازنشانی گردید.`
      }
      if (after.roleId) {
        return `نقش سازمانی پرسنل توسط ${actorName} تغییر داده شد.`
      }
    }

    return `${entityStr} توسط ${actorName} ${actionStr}.`
  }

  const statusLabels: Record<string, { text: string; color: string; badgeColor: string }> = {
    pending: { text: 'در حال بررسی', color: 'text-warning bg-warning/15 border-warning/30', badgeColor: 'bg-warning' },
    active: { text: 'فعال', color: 'text-success bg-success/10 border-success/20', badgeColor: 'bg-success' },
    suspended: { text: 'معلق', color: 'text-critical bg-critical/10 border-critical/20', badgeColor: 'bg-critical' },
  }

  const fieldTypeLabels: Record<string, string> = {
    text: 'متن',
    number: 'عدد',
    select: 'منوی انتخابی',
    date: 'تاریخ شمسی',
    boolean: 'تیک‌باکس (بولین)',
  }

  // Filter permission groups based on search term
  const filteredCatalog = PERMISSION_CATALOG.map(group => {
    const filteredPerms = group.permissions.filter(perm =>
      perm.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
      perm.key.toLowerCase().includes(permissionSearch.toLowerCase())
    )
    return { ...group, permissions: filteredPerms }
  }).filter(group => group.permissions.length > 0)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            مدیریت کاربران و سطوح دسترسی
          </h1>
          <p className="text-xs md:text-sm text-foreground-muted">
            تأیید عضویت، ویرایش مشخصات، تخصیص نقش‌ها و تنظیم ماتریس دسترسی پرسنل مترو
          </p>
        </div>

        {/* Action Button based on tab */}
        {activeTab === 'users' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="file"
              id="excel-import-input"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleExcelImport}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('excel-import-input')?.click()}
              disabled={actionLoading}
              className="w-full md:w-auto border-border hover:bg-surface-hover font-medium flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-xs md:text-sm text-foreground"
            >
              <Upload className="size-4" />
              ورود از اکسل
            </Button>
            <Button
              variant="outline"
              onClick={handleExcelExport}
              disabled={actionLoading}
              className="w-full md:w-auto border-border hover:bg-surface-hover font-medium flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-xs md:text-sm text-foreground"
            >
              <Download className="size-4" />
              خروجی اکسل
            </Button>
            <Button
              onClick={openCreateUserModal}
              className="w-full md:w-auto bg-accent hover:bg-accent-hover text-accent-foreground font-medium flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-xs md:text-sm"
            >
              <UserPlus className="size-4" />
              افزودن کاربر جدید
            </Button>
          </div>
        )}
        {activeTab === 'roles' && (
          <Button
            onClick={() => setRoleModalOpen(true)}
            className="w-full md:w-auto bg-accent hover:bg-accent-hover text-accent-foreground font-medium flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer"
          >
            <Shield className="size-4" />
            افزودن نقش جدید
          </Button>
        )}
        {activeTab === 'fields' && (
          <Button
            onClick={() => setFieldModalOpen(true)}
            className="w-full md:w-auto bg-accent hover:bg-accent-hover text-accent-foreground font-medium flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer"
          >
            <Plus className="size-4" />
            افزودن فیلد پویا
          </Button>
        )}
        {activeTab === 'audit_logs' && (
          <Button
            onClick={loadGlobalAuditLogs}
            disabled={loadingGlobalAuditLogs}
            className="w-full md:w-auto border border-border bg-surface hover:bg-surface-hover text-foreground font-medium flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-xs md:text-sm"
          >
            <RefreshCw className={`size-4 ${loadingGlobalAuditLogs ? 'animate-spin' : ''}`} />
            بروزرسانی لاگ‌ها
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${notification.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-critical/10 border-critical/30 text-critical'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'users'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
        >
          مدیریت کاربران
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'roles'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
        >
          نقش‌ها و مجوزهای دسترسی
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'fields'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
        >
          فیلدهای مشخصات پرسنلی (پویا)
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'audit_logs'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
        >
          گزارش فعالیت‌ها
        </button>
      </div>

      {/* Content Tab Panels */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-5">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface/40 p-4 rounded-xl border border-border">
            <div className="relative md:col-span-2">
              <Search className="absolute start-3 top-2.5 size-4 text-foreground-muted" />
              <Input
                type="text"
                placeholder="جستجو با نام، کدملی، تلفن یا فیلدهای پویا..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9 h-10 bg-background/50 text-sm focus-visible:ring-accent border-border"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer animate-none"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="pending">در حال بررسی</option>
                <option value="active">فعال</option>
                <option value="suspended">معلق</option>
              </select>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer animate-none"
              >
                <option value="">همه نقش‌ها</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Column Filters Summary & Reset */}
          {Object.values(columnFilters).some((f) => f.length > 0) && (
            <div className="flex flex-col gap-2 bg-accent/5 border border-accent/20 p-3.5 rounded-xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                  <RotateCcw className="size-3.5 text-accent" />
                  <span>فیلترهای پیشرفته اکسل فعال هستند ({toFa(Object.values(columnFilters).filter((f) => f.length > 0).length)} ستون)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setColumnFilters({})
                    setSortConfig(null)
                  }}
                  className="h-7 text-[10px] font-bold bg-critical/10 hover:bg-critical/20 text-critical border border-critical/25 rounded-lg cursor-pointer px-3 flex items-center gap-1"
                >
                  پاک کردن همه فیلترها و مرتب‌سازی‌ها
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(columnFilters).map(([colKey, selectedVals]) => {
                  if (!selectedVals || selectedVals.length === 0) return null
                  const colDef = customFieldDefs.find((f) => f.name === colKey)
                  let label = colDef?.label
                  if (!label) {
                    switch (colKey) {
                      case 'name': label = 'نام پرسنل'; break
                      case 'nationalId': label = 'کد ملی'; break
                      case 'phone': label = 'شماره همراه'; break
                      case 'status': label = 'وضعیت'; break
                      case 'post': label = 'پست سازمانی'; break
                      case 'shift': label = 'شیفت'; break
                      case 'shiftType': label = 'نوع شیفت'; break
                      case 'certificate': label = 'گواهینامه'; break
                      case 'group': label = 'گروه راهبری'; break
                      case 'hireDate': label = 'تاریخ استخدام'; break
                      case 'birthDate': label = 'تاریخ تولد'; break
                      case 'age': label = 'سن'; break
                      case 'startLocation': label = 'محل شروع به کار'; break
                      default: label = colKey
                    }
                  }
                  return (
                    <Badge
                      key={colKey}
                      variant="outline"
                      className="bg-background/80 text-[10px] py-0.5 ps-2 pe-1.5 flex items-center gap-1 border-border text-foreground/90 font-medium rounded-lg"
                    >
                      <span className="text-foreground-muted font-bold">{label}:</span>
                      <span className="max-w-[150px] truncate">{selectedVals.join('، ')}</span>
                      <button
                        type="button"
                        onClick={() => handleFilterChange(colKey, [])}
                        className="text-foreground-muted hover:text-critical p-0.5 rounded-full hover:bg-muted transition-colors cursor-pointer inline-flex items-center justify-center ms-1"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Users Table */}
          <Card className="border border-border bg-surface/50 backdrop-blur-sm shadow-md overflow-hidden">
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                  <Loader2 className="size-8 animate-spin text-accent" />
                  <span className="text-sm text-foreground-muted">در حال بارگذاری لیست کاربران...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <UserX className="size-12 text-foreground-muted/40 mb-3" />
                  <span className="text-sm text-foreground-muted">هیچ کاربری یافت نشد.</span>
                </div>
              ) : (
                <div className="w-full overflow-x-auto scrollbar-thin">
                  <Table className="min-w-[1500px]">
                    <TableHeader className="bg-surface/30">
                      <TableRow className="border-b border-border/60 hover:bg-transparent">
                        <TableHead className="sticky right-0 z-30 bg-[#161618] text-start pr-6 whitespace-nowrap w-[160px] min-w-[160px] max-w-[160px] border-l border-border/40">
                          <div className="flex items-center gap-1">
                            <span>نام پرسنل</span>
                            <ColumnHeaderFilter
                              columnKey="name"
                              columnLabel="نام پرسنل"
                              uniqueValues={getUniqueValues('name')}
                              selectedValues={columnFilters['name'] || []}
                              onFilterChange={(values) => handleFilterChange('name', values)}
                              onSort={(direction) => handleSort('name', direction)}
                              currentSort={sortConfig?.key === 'name' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['name'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('name', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="sticky right-[160px] z-30 bg-[#161618] text-start whitespace-nowrap w-[120px] min-w-[120px] max-w-[120px] border-l border-border/40">
                          <div className="flex items-center gap-1">
                            <span>کد پرسنلی</span>
                            <ColumnHeaderFilter
                              columnKey="personnelNo"
                              columnLabel="کد پرسنلی"
                              uniqueValues={getUniqueValues('personnelNo')}
                              selectedValues={columnFilters['personnelNo'] || []}
                              onFilterChange={(values) => handleFilterChange('personnelNo', values)}
                              onSort={(direction) => handleSort('personnelNo', direction)}
                              currentSort={sortConfig?.key === 'personnelNo' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['personnelNo'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('personnelNo', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>کد ملی</span>
                            <ColumnHeaderFilter
                              columnKey="nationalId"
                              columnLabel="کد ملی"
                              uniqueValues={getUniqueValues('nationalId')}
                              selectedValues={columnFilters['nationalId'] || []}
                              onFilterChange={(values) => handleFilterChange('nationalId', values)}
                              onSort={(direction) => handleSort('nationalId', direction)}
                              currentSort={sortConfig?.key === 'nationalId' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['nationalId'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('nationalId', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>شماره تماس ۱</span>
                            <ColumnHeaderFilter
                              columnKey="phone"
                              columnLabel="شماره تماس ۱"
                              uniqueValues={getUniqueValues('phone')}
                              selectedValues={columnFilters['phone'] || []}
                              onFilterChange={(values) => handleFilterChange('phone', values)}
                              onSort={(direction) => handleSort('phone', direction)}
                              currentSort={sortConfig?.key === 'phone' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['phone'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('phone', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>شماره تماس ۲</span>
                            <ColumnHeaderFilter
                              columnKey="phone2"
                              columnLabel="شماره تماس ۲"
                              uniqueValues={getUniqueValues('phone2')}
                              selectedValues={columnFilters['phone2'] || []}
                              onFilterChange={(values) => handleFilterChange('phone2', values)}
                              onSort={(direction) => handleSort('phone2', direction)}
                              currentSort={sortConfig?.key === 'phone2' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['phone2'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('phone2', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>پست سازمانی</span>
                            <ColumnHeaderFilter
                              columnKey="post"
                              columnLabel="پست سازمانی"
                              uniqueValues={getUniqueValues('post')}
                              selectedValues={columnFilters['post'] || []}
                              onFilterChange={(values) => handleFilterChange('post', values)}
                              onSort={(direction) => handleSort('post', direction)}
                              currentSort={sortConfig?.key === 'post' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['post'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('post', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>شیفت</span>
                            <ColumnHeaderFilter
                              columnKey="shift"
                              columnLabel="شیفت"
                              uniqueValues={getUniqueValues('shift')}
                              selectedValues={columnFilters['shift'] || []}
                              onFilterChange={(values) => handleFilterChange('shift', values)}
                              onSort={(direction) => handleSort('shift', direction)}
                              currentSort={sortConfig?.key === 'shift' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['shift'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('shift', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>نوع شیفت</span>
                            <ColumnHeaderFilter
                              columnKey="shiftType"
                              columnLabel="نوع شیفت"
                              uniqueValues={getUniqueValues('shiftType')}
                              selectedValues={columnFilters['shiftType'] || []}
                              onFilterChange={(values) => handleFilterChange('shiftType', values)}
                              onSort={(direction) => handleSort('shiftType', direction)}
                              currentSort={sortConfig?.key === 'shiftType' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['shiftType'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('shiftType', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>گواهینامه</span>
                            <ColumnHeaderFilter
                              columnKey="certificate"
                              columnLabel="گواهینامه"
                              uniqueValues={getUniqueValues('certificate')}
                              selectedValues={columnFilters['certificate'] || []}
                              onFilterChange={(values) => handleFilterChange('certificate', values)}
                              onSort={(direction) => handleSort('certificate', direction)}
                              currentSort={sortConfig?.key === 'certificate' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['certificate'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('certificate', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>گروه راهبری</span>
                            <ColumnHeaderFilter
                              columnKey="group"
                              columnLabel="گروه راهبری"
                              uniqueValues={getUniqueValues('group')}
                              selectedValues={columnFilters['group'] || []}
                              onFilterChange={(values) => handleFilterChange('group', values)}
                              onSort={(direction) => handleSort('group', direction)}
                              currentSort={sortConfig?.key === 'group' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['group'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('group', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>وضعیت</span>
                            <ColumnHeaderFilter
                              columnKey="status"
                              columnLabel="وضعیت"
                              uniqueValues={getUniqueValues('status')}
                              selectedValues={columnFilters['status'] || []}
                              onFilterChange={(values) => handleFilterChange('status', values)}
                              onSort={(direction) => handleSort('status', direction)}
                              currentSort={sortConfig?.key === 'status' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['status'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('status', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>تاریخ استخدام</span>
                            <ColumnHeaderFilter
                              columnKey="hireDate"
                              columnLabel="تاریخ استخدام"
                              uniqueValues={getUniqueValues('hireDate')}
                              selectedValues={columnFilters['hireDate'] || []}
                              onFilterChange={(values) => handleFilterChange('hireDate', values)}
                              onSort={(direction) => handleSort('hireDate', direction)}
                              currentSort={sortConfig?.key === 'hireDate' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['hireDate'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('hireDate', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>تاریخ تولد</span>
                            <ColumnHeaderFilter
                              columnKey="birthDate"
                              columnLabel="تاریخ تولد"
                              uniqueValues={getUniqueValues('birthDate')}
                              selectedValues={columnFilters['birthDate'] || []}
                              onFilterChange={(values) => handleFilterChange('birthDate', values)}
                              onSort={(direction) => handleSort('birthDate', direction)}
                              currentSort={sortConfig?.key === 'birthDate' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['birthDate'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('birthDate', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>سن</span>
                            <ColumnHeaderFilter
                              columnKey="age"
                              columnLabel="سن"
                              uniqueValues={getUniqueValues('age')}
                              selectedValues={columnFilters['age'] || []}
                              onFilterChange={(values) => handleFilterChange('age', values)}
                              onSort={(direction) => handleSort('age', direction)}
                              currentSort={sortConfig?.key === 'age' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['age'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('age', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-start whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>محل شروع به کار</span>
                            <ColumnHeaderFilter
                              columnKey="startLocation"
                              columnLabel="محل شروع به کار"
                              uniqueValues={getUniqueValues('startLocation')}
                              selectedValues={columnFilters['startLocation'] || []}
                              onFilterChange={(values) => handleFilterChange('startLocation', values)}
                              onSort={(direction) => handleSort('startLocation', direction)}
                              currentSort={sortConfig?.key === 'startLocation' ? sortConfig.direction : null}
                              searchTerm={columnSearchTerms['startLocation'] || ''}
                              onSearchChange={(val) => handleColumnSearchChange('startLocation', val)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-end pl-6 whitespace-nowrap">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/40">
                      {filteredAndSortedUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          onClick={() => openUserDetail(user)}
                          className="group border-b border-border/40 hover:bg-surface-hover/35 transition-colors cursor-pointer"
                        >
                          <TableCell className="sticky right-0 z-10 bg-[#0c0c0e] border-l border-border/40 group-hover:bg-[#1c1c1e] transition-colors font-semibold pr-6 text-foreground whitespace-nowrap w-[160px] min-w-[160px] max-w-[160px]">{user.name}</TableCell>
                          <TableCell className="sticky right-[160px] z-10 bg-[#0c0c0e] border-l border-border/40 group-hover:bg-[#1c1c1e] transition-colors font-mono text-xs text-foreground/80 whitespace-nowrap w-[120px] min-w-[120px] max-w-[120px]">
                            {(() => {
                              const pNo = getUserFieldValue(user, 'personnelNo')
                              return pNo ? toFa(String(pNo)) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground/80 whitespace-nowrap">{toFa(user.nationalId)}</TableCell>
                          <TableCell className="font-mono text-xs text-foreground/80 whitespace-nowrap">
                            {user.phone ? toFa(user.phone) : '—'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground/80 whitespace-nowrap">
                            {(() => {
                              const p2 = getUserFieldValue(user, 'phone2')
                              return p2 ? toFa(String(p2)) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            <Badge variant="outline" className="border-border/80 text-[10px] bg-surface text-foreground/90 font-medium">
                              {String(getUserFieldValue(user, 'post') || user.role?.name || 'فاقد نقش')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {(() => {
                              const shiftVal = getUserFieldValue(user, 'shift')
                              if (!shiftVal) return '—'
                              return (
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-bold border",
                                  shiftVal === 'ستادی' && "bg-purple-500/5 text-purple-400 border-purple-500/20",
                                  shiftVal === 'A' && "bg-success/5 text-success border-success/20",
                                  shiftVal === 'B' && "bg-info/5 text-info border-info/20",
                                  shiftVal === 'C' && "bg-amber-500/5 text-amber-400 border-amber-500/20"
                                )}>
                                  {String(shiftVal)}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {String(getUserFieldValue(user, 'shiftType') || '—')}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {(() => {
                              const cert = getColumnValue(user, 'certificate')
                              if (!cert || cert === 'فاقد گواهینامه') return <span className="text-foreground-muted">فاقد گواهینامه</span>
                              return (
                                <Badge variant="secondary" className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                  {String(cert)}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {(() => {
                              const groupVal = getUserFieldValue(user, 'group')
                              if (!groupVal) return '—'
                              return (
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-bold border",
                                  groupVal === 'Staff' && "bg-purple-500/5 text-purple-400 border-purple-500/20",
                                  groupVal === 'A' && "bg-success/5 text-success border-success/20",
                                  groupVal === 'B' && "bg-info/5 text-info border-info/20",
                                  groupVal === 'C' && "bg-amber-500/5 text-amber-400 border-amber-500/20"
                                )}>
                                  {groupVal === 'Staff' ? 'ستادی' : `گروه ${groupVal}`}
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              className={`border text-[9px] px-2 py-0.5 rounded-full font-medium ${statusLabels[user.status]?.color || ''
                                }`}
                            >
                              {statusLabels[user.status]?.text || user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted whitespace-nowrap">
                            {(() => {
                              const hDate = getUserFieldValue(user, 'hireDate')
                              return hDate ? toFa(String(hDate)) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted whitespace-nowrap">
                            {(() => {
                              const bDate = getUserFieldValue(user, 'birthDate')
                              return bDate ? toFa(String(bDate)) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground/80 whitespace-nowrap">
                            {(() => {
                              const bDate = getUserFieldValue(user, 'birthDate')
                              return bDate ? toFa(calculateAge(String(bDate))) : '—'
                            })()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {String(getUserFieldValue(user, 'startLocation') || getUserFieldValue(user, 'station') || '—')}
                          </TableCell>
                          <TableCell className="text-end pl-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {user.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(user.id)}
                                  disabled={actionLoading}
                                  className="h-8 border-success/30 bg-success/5 text-success hover:bg-success/15 hover:border-success/60 flex items-center gap-1 cursor-pointer text-[11px] font-bold shadow-sm transition-all animate-pulse"
                                >
                                  <UserCheck className="size-3.5" />
                                  تأیید عضویت
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => openUserDetail(user)}
                                title="جزئیات پرونده"
                                className="border border-border/40 hover:border-accent/30 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg cursor-pointer h-8 w-8 transition-all duration-200 shadow-sm"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => openEditUserModal(user)}
                                title="ویرایش کاربر"
                                className="border border-border/40 hover:border-accent/30 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg cursor-pointer h-8 w-8 transition-all duration-200 shadow-sm"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              {user.id !== sessionUser?.id && (
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="حذف کاربر"
                                  disabled={actionLoading}
                                  className="border border-border/40 hover:border-critical/30 text-foreground-muted hover:text-critical hover:bg-critical/5 rounded-lg cursor-pointer h-8 w-8 transition-all duration-200 shadow-sm"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Roles List Panel */}
          <Card className="border border-border bg-surface/50 shadow-md h-fit overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-surface/30">
              <CardTitle className="text-base font-semibold">لیست نقش‌ها</CardTitle>
              <CardDescription className="text-xs">
                انتخاب نقش جهت ویرایش مجوزها یا تغییرات سطحی
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
              {loadingRoles ? (
                <div className="flex flex-col items-center justify-center p-8 gap-2">
                  <Loader2 className="size-6 animate-spin text-accent" />
                  <span className="text-xs text-foreground-muted">بارگذاری نقش‌ها...</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="p-4 text-center text-xs text-foreground-muted">نقشی یافت نشد.</div>
              ) : (
                roles.map((r) => {
                  const active = selectedRole?.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => selectRoleItem(r)}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${active
                          ? 'bg-accent/15 border-accent text-accent font-bold'
                          : 'border-border/60 hover:bg-surface-hover/30 hover:border-border text-foreground-muted hover:text-foreground'
                        }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-start">{r.name}</span>
                        <span className="text-[10px] text-foreground-muted/60 font-mono tracking-tight text-start dir-ltr">
                          {r.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 border-border bg-surface font-semibold text-foreground/80">
                          {toFa(r._count?.users || 0)} کاربر
                        </Badge>
                        {!r.isSystem && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRole(r)
                            }}
                            className="text-foreground-muted/60 hover:text-critical hover:bg-critical/5 rounded cursor-pointer h-7 w-7"
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Permissions Matrix Panel */}
          {selectedRole ? (
            <Card className="border border-border bg-surface/50 shadow-md lg:col-span-2 overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-surface/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                    <span>تنظیم دسترسی‌های نقش:</span>
                    <span className="text-accent font-bold">{selectedRole.name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    تغییرات به صورت آنی در کل سامانه اعمال و لاگ‌های امنیتی ثبت می‌گردد.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    onClick={handleSavePermissions}
                    disabled={actionLoading}
                    className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-4 h-9 text-xs rounded-lg cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    {actionLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="size-3.5" />
                    )}
                    ذخیره مجوزها
                  </Button>
                </div>
              </CardHeader>

              {/* Permission live search */}
              <div className="px-4 pt-4 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute start-3 top-2.5 size-4 text-foreground-muted" />
                  <Input
                    type="text"
                    placeholder="جستجو در نام یا کلید مجوزها..."
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    className="ps-9 h-9 bg-background/30 text-xs focus-visible:ring-accent border-border/70"
                  />
                </div>
              </div>

              <CardContent className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {filteredCatalog.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key)
                  const allSelectedInGroup = groupKeys.every((k) => rolePermissions.includes(k))

                  return (
                    <div key={group.resource} className="border border-border/60 rounded-xl bg-surface/20 p-4 transition-all hover:border-border">
                      <div className="flex items-center justify-between border-b border-border/30 pb-2.5 mb-3.5">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-accent animate-pulse"></span>
                          <span>مدیریت ماژول {group.label}</span>
                        </h3>

                        {/* Bulk Select Toggles */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAllInGroup(groupKeys, allSelectedInGroup)}
                          className="text-[10px] h-6 px-2.5 border-border/80 hover:bg-surface-hover text-foreground-muted hover:text-foreground cursor-pointer font-semibold"
                        >
                          {allSelectedInGroup ? 'غیرفعال‌سازی همه' : 'فعال‌سازی همه'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {group.permissions.map((perm) => {
                          const checked = rolePermissions.includes(perm.key)
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all text-xs ${checked
                                  ? 'bg-accent/5 border-accent/40 text-foreground shadow-sm font-medium'
                                  : 'border-border/50 hover:bg-surface-hover/30 text-foreground-muted'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handlePermissionToggle(perm.key)}
                                className="accent-accent size-3.5 rounded border-border"
                              />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-start">{perm.label}</span>
                                <span className="text-[9px] font-mono text-foreground-muted/70 tracking-tight dir-ltr text-start">
                                  {perm.key}
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {filteredCatalog.length === 0 && (
                  <div className="p-8 text-center text-xs text-foreground-muted">
                    مجوزی منطبق با جستجوی شما یافت نشد.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border bg-surface/50 shadow-md lg:col-span-2 flex items-center justify-center p-12 text-center h-fit">
              <div className="flex flex-col items-center gap-2">
                <Shield className="size-12 text-foreground-muted/40" />
                <span className="text-sm text-foreground-muted">یک نقش را برای ویرایش مجوزها انتخاب کنید.</span>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Create Field Definition Dialog / Left Form */}
          <Card className="border border-border bg-surface/50 shadow-md h-fit overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-surface/30">
              <CardTitle className="text-base font-semibold flex items-center gap-1">
                <Settings className="size-4 text-accent" />
                <span>تعریف فیلد پویای جدید</span>
              </CardTitle>
              <CardDescription className="text-xs">
                فیلدهای دلخواهی که تمایل دارید در پرونده پرسنل و دفتر تلفن داشته باشید
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleCreateField} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fieldName" className="text-xs font-semibold text-foreground">
                    شناسه سیستمی فیلد (نام انگلیسی)
                  </Label>
                  <Input
                    id="fieldName"
                    required
                    placeholder="مثلا: station_name"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                  />
                  <span className="text-[10px] text-foreground-muted">
                    فقط حروف انگلیسی کوچک و خط تیره پایین (مثلا: car_plate_no)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fieldLabel" className="text-xs font-semibold text-foreground">
                    عنوان فارسی فیلد (برچسب)
                  </Label>
                  <Input
                    id="fieldLabel"
                    required
                    placeholder="مثلا: ایستگاه محل خدمت"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fieldType" className="text-xs font-semibold text-foreground">
                    نوع فیلد
                  </Label>
                  <select
                    id="fieldType"
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="text">متن (یک خطی)</option>
                    <option value="number">عدد</option>
                    <option value="select">منوی کشویی (انتخابی)</option>
                    <option value="date">تاریخ شمسی</option>
                    <option value="boolean">تیک‌باکس (بله/خیر)</option>
                  </select>
                </div>

                {fieldType === 'select' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fieldOptionsRaw" className="text-xs font-semibold text-foreground">
                      گزینه‌های منو (با کاما جدا کنید)
                    </Label>
                    <Input
                      id="fieldOptionsRaw"
                      required
                      placeholder="مثلا: تجریش، کهریزک، امام خمینی"
                      value={fieldOptionsRaw}
                      onChange={(e) => setFieldOptionsRaw(e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="fieldDefaultValue" className="text-xs font-semibold text-foreground flex justify-start">
                    مقدار پیش‌فرض (اختیاری)
                  </Label>
                  {fieldType === 'boolean' ? (
                    <select
                      id="fieldDefaultValue"
                      value={fieldDefaultValue}
                      onChange={(e) => setFieldDefaultValue(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      <option value="">بدون مقدار پیش‌فرض</option>
                      <option value="true">بله (True)</option>
                      <option value="false">خیر (False)</option>
                    </select>
                  ) : fieldType === 'select' ? (
                    <select
                      id="fieldDefaultValue"
                      value={fieldDefaultValue}
                      onChange={(e) => setFieldDefaultValue(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      <option value="">بدون مقدار پیش‌فرض</option>
                      {fieldOptionsRaw.split(',').map((o) => o.trim()).filter((o) => o.length > 0).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : fieldType === 'date' ? (
                    <Input
                      id="fieldDefaultValue"
                      placeholder="مثلا: ۱۴۰۵/۰۱/۰۱"
                      value={fieldDefaultValue}
                      onChange={(e) => setFieldDefaultValue(e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  ) : (
                    <Input
                      id="fieldDefaultValue"
                      type={fieldType === 'number' ? 'number' : 'text'}
                      placeholder="مقدار پیش‌فرض فیلد..."
                      value={fieldDefaultValue}
                      onChange={(e) => setFieldDefaultValue(e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border text-start"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="accent-accent size-4 rounded"
                  />
                  <Label htmlFor="fieldRequired" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                    پر کردن این فیلد اجباری است
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-4 h-10 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  ایجاد فیلد پویا
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fields List Panel / Right Table */}
          <Card className="border border-border bg-surface/50 shadow-md lg:col-span-2 overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-surface/30 flex flex-row justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle className="text-base font-semibold">فیلدهای پویای فعال پرسنل</CardTitle>
                <CardDescription className="text-xs">
                  لیست تمام فیلدهای سفارشی که به پرونده پرسنلی پرسنل متصل شده و در دفتر تلفن نمایش داده می‌شوند.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateDefaultRosterFields}
                disabled={actionLoading}
                className="text-[11px] h-8 font-bold border-accent/30 text-accent hover:bg-accent/5 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="size-3.5" />
                ایجاد فیلدهای پایه پرسنلی خط ۱
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingFields ? (
                <div className="flex flex-col items-center justify-center p-12 gap-2">
                  <Loader2 className="size-8 animate-spin text-accent" />
                  <span className="text-sm text-foreground-muted">بارگذاری فیلدها...</span>
                </div>
              ) : customFieldDefs.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground-muted">
                  هیچ فیلد پویایی در سیستم تعریف نشده است.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-surface/30">
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="text-start pr-6">عنوان فارسی</TableHead>
                      <TableHead className="text-start">شناسه انگلیسی</TableHead>
                      <TableHead className="text-start">نوع ورودی</TableHead>
                      <TableHead className="text-start">وضعیت</TableHead>
                      <TableHead className="text-start">گزینه‌های انتخابی</TableHead>
                      <TableHead className="text-start">مقدار پیش‌فرض</TableHead>
                      <TableHead className="text-end pl-6">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {customFieldDefs.map((field) => {
                      let optionsList: string[] = []
                      if (field.options) {
                        optionsList = typeof field.options === 'string'
                          ? JSON.parse(field.options)
                          : field.options
                      }
                      return (
                        <TableRow
                          key={field.id}
                          className="border-b border-border/40 hover:bg-surface-hover/30 transition-colors"
                        >
                          <TableCell className="font-semibold pr-6 text-foreground">{field.label}</TableCell>
                          <TableCell className="font-mono text-xs text-foreground-muted">{field.name}</TableCell>
                          <TableCell className="text-xs text-foreground/80">{fieldTypeLabels[field.type]}</TableCell>
                          <TableCell>
                            <Badge variant={field.required ? 'default' : 'outline'} className="text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {field.required ? 'اجباری' : 'اختیاری'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted max-w-[150px] truncate">
                            {optionsList.length > 0 ? optionsList.join('، ') : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-foreground/80">
                            {field.defaultValue === 'true' ? 'بله' : field.defaultValue === 'false' ? 'خیر' : field.defaultValue || '—'}
                          </TableCell>
                          <TableCell className="text-end pl-6">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDeleteField(field.id)}
                              title="حذف فیلد"
                              disabled={actionLoading}
                              className="text-foreground-muted hover:text-critical hover:bg-critical/5 rounded-md cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
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
      )}

      {/* Tab: System Activity Logs */}
      {activeTab === 'audit_logs' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface/40 p-4 rounded-xl border border-border">
            <div className="relative">
              <Search className="absolute start-3 top-2.5 size-4 text-foreground-muted" />
              <Input
                type="text"
                placeholder="جستجوی اقدام‌کننده یا شناسه هدف..."
                value={auditLogSearch}
                onChange={(e) => setAuditLogSearch(e.target.value)}
                className="ps-9 h-10 bg-background/50 text-sm focus-visible:ring-accent border-border"
              />
            </div>
            <div>
              <select
                value={auditLogAction}
                onChange={(e) => setAuditLogAction(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
              >
                <option value="">همه عملیات‌ها</option>
                <option value="create">ایجاد (Create)</option>
                <option value="update">ویرایش (Update)</option>
                <option value="delete">حذف (Delete)</option>
                <option value="login">ورود (Login)</option>
                <option value="logout">خروج (Logout)</option>
                <option value="import">ورود اکسل (Import)</option>
                <option value="export">خروجی اکسل (Export)</option>
              </select>
            </div>
            <div>
              <select
                value={auditLogEntity}
                onChange={(e) => setAuditLogEntity(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
              >
                <option value="">همه ماژول‌ها</option>
                <option value="User">پرسنل (User)</option>
                <option value="Role">نقش‌ها (Role)</option>
                <option value="Setting">تنظیمات (Setting)</option>
                <option value="Shift">شیفت‌ها (Shift)</option>
                <option value="SafetyBulletin">بخش‌نامه‌ها (SafetyBulletin)</option>
                <option value="Ticket">تیکت‌ها (Ticket)</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <Card className="border border-border bg-surface/50 backdrop-blur-sm shadow-md overflow-hidden">
            <CardContent className="p-0">
              {loadingGlobalAuditLogs ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                  <Loader2 className="size-8 animate-spin text-accent" />
                  <span className="text-sm text-foreground-muted">در حال بارگذاری لاگ‌های ممیزی سیستم...</span>
                </div>
              ) : globalAuditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Database className="size-12 text-foreground-muted/40 mb-3" />
                  <span className="text-sm text-foreground-muted">هیچ لاگ فعالیتی ثبت نشده است.</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-surface/30">
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="text-start pr-6">کاربر اقدام‌کننده</TableHead>
                      <TableHead className="text-start">نوع عملیات</TableHead>
                      <TableHead className="text-start">بخش مربوطه</TableHead>
                      <TableHead className="text-start">توضیحات رویداد</TableHead>
                      <TableHead className="text-start">تاریخ و زمان وقوع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {globalAuditLogs.map((log) => {
                      // Color schemes for action badges
                      let badgeStyle = 'border-border bg-surface/50 text-foreground-muted'
                      switch (log.action) {
                        case 'create': badgeStyle = 'border-success/30 bg-success/10 text-success'
                          break
                        case 'update': badgeStyle = 'border-warning/30 bg-warning/10 text-warning'
                          break
                        case 'delete': badgeStyle = 'border-critical/30 bg-critical/10 text-critical'
                          break
                        case 'login':
                        case 'logout': badgeStyle = 'border-accent/30 bg-accent/10 text-accent'
                          break
                        case 'import':
                        case 'export': badgeStyle = 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                          break
                      }

                      return (
                        <TableRow
                          key={log.id}
                          className="border-b border-border/40 hover:bg-surface-hover/20 transition-colors"
                        >
                          <TableCell className="font-semibold pr-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-foreground">{log.actor?.name || 'سیستم'}</span>
                              <span className="text-[10px] text-foreground-muted/60 font-mono tracking-tight text-start">
                                کدملی: {log.actor?.nationalId ? toFa(log.actor.nationalId) : '—'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] px-2.5 py-0.5 font-bold ${badgeStyle}`}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground/80">{log.entity}</TableCell>
                          <TableCell className="text-xs text-foreground/90 font-medium leading-relaxed max-w-[300px]">
                            {getAuditLogDescription(log)}
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted font-mono whitespace-nowrap">
                            {jalali(log.createdAt)}
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
      )}

      {/* User Details Slide-over Drawer (Sheet) */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-s border-border/80 bg-surface/90 backdrop-blur-md p-0 flex flex-col h-full" side="left" dir="rtl">
          {selectedUserForDetail && (
            <div className="flex flex-col h-full">
              {/* Colored Brand Top Border */}
              <div className="h-1 bg-accent w-full"></div>

              {/* Drawer Header Profile Box */}
              <div className="p-6 border-b border-border/50 bg-gradient-to-b from-surface/50 to-surface-hover/20 flex flex-col items-center text-center relative">
                <button
                  type="button"
                  onClick={() => setDetailDrawerOpen(false)}
                  className="absolute left-4 top-4 text-foreground-muted hover:text-foreground hover:bg-surface/50 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>

                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/40 flex items-center justify-center mb-3 text-accent font-bold text-xl shadow-inner">
                  {selectedUserForDetail.name.slice(0, 2)}
                </div>

                <h2 className="text-base font-bold text-foreground">{selectedUserForDetail.name}</h2>
                <p className="text-[10px] text-foreground-muted mt-1 font-mono tracking-wide">
                  شناسه: {selectedUserForDetail.id}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent font-bold text-[10px] py-0.5 px-2.5">
                    {selectedUserForDetail.role?.name || 'فاقد نقش'}
                  </Badge>
                  <Badge className={`border text-[10px] font-semibold py-0.5 px-2.5 rounded-full ${statusLabels[selectedUserForDetail.status]?.color}`}>
                    {statusLabels[selectedUserForDetail.status]?.text || selectedUserForDetail.status}
                  </Badge>
                </div>
              </div>

              {/* Drawer Tab Switcher */}
              <div className="flex border-b border-border/40 bg-surface/30 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setDetailTab('profile')}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                    detailTab === 'profile'
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface/50 border border-transparent"
                  )}
                >
                  پرونده پرسنلی و اطلاعات شغلی
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('logs')}
                  className={cn(
                    "flex-1 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                    detailTab === 'logs'
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface/50 border border-transparent"
                  )}
                >
                  تاریخچه فعالیت‌ها ({toFa(userAuditLogs.length)})
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {detailTab === 'profile' ? (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Card 1: Personal & Contact Info */}
                    <div className="border border-border/50 bg-surface/20 rounded-xl p-4 space-y-3.5 shadow-sm">
                      <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2">
                        <User className="size-4 text-accent" />
                        <span>مشخصات فردی و هویتی</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="size-4 text-foreground-muted shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-foreground-muted">کد ملی (نام کاربری)</span>
                            <span className="text-xs font-bold text-foreground font-mono">{toFa(selectedUserForDetail.nationalId)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone className="size-4 text-foreground-muted shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-foreground-muted">شماره همراه ۱</span>
                            <span className="text-xs font-bold text-foreground font-mono">
                              {selectedUserForDetail.phone ? toFa(selectedUserForDetail.phone) : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 col-span-2 border-t border-border/20 pt-2.5">
                          <Mail className="size-4 text-foreground-muted shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[9px] text-foreground-muted">نشانی ایمیل</span>
                            <span className="text-xs font-semibold text-foreground font-mono truncate">
                              {selectedUserForDetail.email || 'ثبت نشده'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 col-span-2 border-t border-border/20 pt-2.5">
                          <Calendar className="size-4 text-foreground-muted shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-foreground-muted">تاریخ تولد و سن</span>
                            <span className="text-xs font-bold text-foreground">
                              {(() => {
                                const bDate = getUserFieldValue(selectedUserForDetail, 'birthDate')
                                if (!bDate) return 'ثبت نشده'
                                const age = calculateAge(String(bDate))
                                return `${toFa(String(bDate))} (${toFa(age)} ساله)`
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Roster & Job Fields */}
                    <div className="border border-border/50 bg-surface/20 rounded-xl p-4 space-y-3.5 shadow-sm">
                      <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2">
                        <Briefcase className="size-4 text-accent" />
                        <span>اطلاعات شغلی، شیفت و لوحه</span>
                      </h3>

                      {customFieldDefs.length === 0 ? (
                        <p className="text-xs text-foreground-muted text-center py-2">هیچ فیلد مشخصات شغلی تعریف نشده است.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {customFieldDefs.map((field) => {
                            const val = getUserFieldValue(selectedUserForDetail, field.name)
                            let displayVal = '—'
                            if (val !== undefined && val !== null && val !== '') {
                              if (field.type === 'boolean') {
                                displayVal = val === true || val === 'true' ? 'بله' : 'خیر'
                              } else {
                                displayVal = String(val)
                              }
                            }

                            // If it's age or birthDate, we already show it in Card 1, so we can skip or show here too.
                            if (field.name === 'age' || field.name === 'birthDate') return null

                            // Format value if it is personnel number, group or dates
                            let formattedVal = displayVal
                            if (field.name === 'personnelNo' || field.name === 'hireDate') {
                              formattedVal = toFa(displayVal)
                            } else if (field.name === 'group') {
                              formattedVal = displayVal === 'Staff' ? 'ستادی' : `گروه ${toFa(displayVal)}`
                            }

                            return (
                              <div key={field.id} className="flex items-start gap-2.5">
                                <div className="shrink-0 mt-0.5">{getFieldIcon(field.name)}</div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-foreground-muted">{field.label}</span>
                                  <span className="text-xs font-bold text-foreground">{formattedVal}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                      <Activity className="size-4 text-accent" />
                      <span>لاگ‌های ممیزی و رویدادهای اخیر پرسنل</span>
                    </h3>

                    {loadingUserAuditLogs ? (
                      <div className="flex flex-col items-center justify-center p-12 gap-2">
                        <Loader2 className="size-5 animate-spin text-accent" />
                        <span className="text-xs text-foreground-muted">در حال بارگذاری لاگ‌ها...</span>
                      </div>
                    ) : userAuditLogs.length === 0 ? (
                      <p className="text-xs text-foreground-muted text-center py-8">هیچ لاگ فعالیتی برای این پرسنل ثبت نشده است.</p>
                    ) : (
                      <div className="relative border-r border-border/50 pe-4 mr-2.5 space-y-4 py-1.5">
                        {userAuditLogs.map((log) => (
                          <div key={log.id} className="relative">
                            {/* Dot marker */}
                            <span className="absolute -right-[21.5px] top-1.5 size-2.5 rounded-full border border-accent bg-surface shrink-0"></span>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-foreground/90 font-semibold leading-relaxed text-start">
                                {getAuditLogDescription(log)}
                              </span>
                              <span className="text-[9px] text-foreground-muted font-mono tracking-tight text-start">
                                {jalali(log.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Sticky Footer Actions */}
              <div className="p-4 border-t border-border bg-surface flex flex-wrap gap-2 justify-end">
                {selectedUserForDetail.status === 'pending' && (
                  <Button
                    onClick={() => handleApprove(selectedUserForDetail.id)}
                    disabled={actionLoading}
                    className="bg-success hover:bg-success/90 text-white font-bold text-xs h-9 px-4 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow"
                  >
                    <UserCheck className="size-3.5" />
                    تأیید عضویت پرسنل
                  </Button>
                )}

                {/* Status Switcher Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="border-border hover:bg-surface-hover text-foreground text-xs h-9 px-3 rounded-lg cursor-pointer font-bold shrink-0 shadow-sm"
                      >
                        تغییر وضعیت
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="bg-surface border-border p-1 rounded-lg">
                    <DropdownMenuItem
                      onClick={() => handleQuickUpdateStatus(selectedUserForDetail.id, 'active')}
                      className="text-xs font-semibold text-success hover:bg-success/10 cursor-pointer rounded-md px-2.5 py-1.5"
                    >
                      فعال‌سازی حساب
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickUpdateStatus(selectedUserForDetail.id, 'suspended')}
                      className="text-xs font-semibold text-critical hover:bg-critical/10 cursor-pointer rounded-md px-2.5 py-1.5"
                    >
                      تعلیق (مسدودسازی)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Role Switcher Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="border-border hover:bg-surface-hover text-foreground text-xs h-9 px-3 rounded-lg cursor-pointer font-bold shrink-0 shadow-sm"
                      >
                        تغییر نقش
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="bg-surface border-border p-1 rounded-lg max-h-[250px] overflow-y-auto">
                    {roles.map((r) => (
                      <DropdownMenuItem
                        key={r.id}
                        onClick={() => handleQuickUpdateRole(selectedUserForDetail.id, r.id)}
                        className="text-xs font-semibold hover:bg-accent/10 cursor-pointer rounded-md px-2.5 py-1.5"
                      >
                        {r.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => openPasswordResetModal(selectedUserForDetail)}
                  className="bg-surface border border-border hover:bg-surface-hover text-foreground font-bold text-xs h-9 px-3 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Lock className="size-3.5" />
                  تغییر کلمه عبور
                </Button>

                <Button
                  onClick={() => openEditUserModal(selectedUserForDetail)}
                  className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs h-9 px-4 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow"
                >
                  <Edit2 className="size-3.5" />
                  ویرایش کامل
                </Button>

                {selectedUserForDetail.id !== sessionUser?.id && (
                  <Button
                    onClick={() => handleDeleteUser(selectedUserForDetail.id)}
                    disabled={actionLoading}
                    className="bg-critical hover:bg-critical-hover text-critical-foreground font-bold text-xs h-9 px-3 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 shadow"
                  >
                    <Trash2 className="size-3.5" />
                    حذف پرسنل
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* User Create/Edit Dialog */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground text-start">
              {userModalMode === 'create' ? 'ایجاد پرسنل جدید' : 'ویرایش مشخصات پرسنل'}
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted text-start">
              لطفاً مشخصات پرسنلی زیر را با دقت تکمیل فرمایید. فیلدهای ستاره‌دار (*) الزامی هستند.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
              {/* Right Column (Personal & Contact Info) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-accent/90 border-b border-border/40 pb-2 flex items-center gap-1.5">
                  <User className="size-4 text-accent" />
                  مشخصات فردی و تماس
                </h3>
                
                {userModalMode === 'create' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="nationalId" className="text-xs font-semibold text-foreground">
                      کد ملی (نام کاربری) <span className="text-critical">*</span>
                    </Label>
                    <Input
                      id="nationalId"
                      required
                      maxLength={10}
                      placeholder="مثلا: ۰۰۱۲۳۴۵۶۷۸"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                    نام و نام خانوادگی <span className="text-critical">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="مثلا: رضا علیزاده"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    شماره همراه اول <span className="text-critical">*</span>
                  </Label>
                  <Input
                    id="phone"
                    required
                    placeholder="مثلا: ۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone2" className="text-xs font-semibold text-foreground">
                    شماره همراه دوم (اختیاری)
                  </Label>
                  <Input
                    id="phone2"
                    placeholder="مثلا: ۰۹۱۹۸۷۶۵۴۳۲"
                    value={userCustomFields.phone2 as string || ''}
                    onChange={(e) => handleUserCustomFieldChange('phone2', e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    ایمیل (اختیاری)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                  />
                </div>

                {userModalMode === 'create' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      کلمه عبور اولیه <span className="text-critical">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="حداقل ۶ کاراکتر"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>
                )}
              </div>

              {/* Left Column (Job & Roster Info) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-accent/90 border-b border-border/40 pb-2 flex items-center gap-1.5">
                  <Briefcase className="size-4 text-accent" />
                  اطلاعات شغلی و سازمانی
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="personnelNo" className="text-xs font-semibold text-foreground">
                      کد پرسنلی <span className="text-critical">*</span>
                    </Label>
                    <Input
                      id="personnelNo"
                      required
                      placeholder="مثلا: ۱۲۳۴۵۶"
                      value={userCustomFields.personnelNo as string || ''}
                      onChange={(e) => handleUserCustomFieldChange('personnelNo', e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="post" className="text-xs font-semibold text-foreground">
                      پست سازمانی <span className="text-critical">*</span>
                    </Label>
                    <select
                      id="post"
                      required
                      value={userCustomFields.post as string || 'راهبر'}
                      onChange={(e) => handleUserCustomFieldChange('post', e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      {['راهبر', 'مسئول شیفت', 'کارشناس', 'تکنسین اعزام پذیرش', 'سرپرست', 'رئیس', 'مدیر', 'دفتری'].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="roleId" className="text-xs font-semibold text-foreground">
                      نقش سیستمی <span className="text-critical">*</span>
                    </Label>
                    <select
                      id="roleId"
                      required
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-semibold text-foreground">
                      وضعیت فعالیت <span className="text-critical">*</span>
                    </Label>
                    <select
                      id="status"
                      required
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      <option value="active">فعال</option>
                      <option value="pending">در حال بررسی</option>
                      <option value="suspended">معلق (مسدود)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="shift" className="text-xs font-semibold text-foreground">
                      گروه لوحه (شیفت) <span className="text-critical">*</span>
                    </Label>
                    <select
                      id="shift"
                      required
                      value={userCustomFields.shift as string || 'A'}
                      onChange={(e) => handleUserCustomFieldChange('shift', e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      {['A', 'B', 'C', 'ستادی'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shiftType" className="text-xs font-semibold text-foreground">
                      نوع شیفت کاری <span className="text-critical">*</span>
                    </Label>
                    <select
                      id="shiftType"
                      required
                      value={userCustomFields.shiftType as string || '9-15'}
                      onChange={(e) => handleUserCustomFieldChange('shiftType', e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                    >
                      {['9-15', '12-24', '9 ساعته', '12 ساعته', 'ستادی'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseClass1Date" className="text-xs font-semibold text-foreground">
                      تاریخ اخذ گواهینامه پایه ۱
                    </Label>
                    <Input
                      id="licenseClass1Date"
                      placeholder="مثلا: ۱۳۹۶/۱۲/۱۷"
                      value={userCustomFields.licenseClass1Date as string || ''}
                      onChange={(e) => handleUserCustomFieldChange('licenseClass1Date', e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="licenseClass2Date" className="text-xs font-semibold text-foreground">
                      تاریخ اخذ گواهینامه پایه ۲
                    </Label>
                    <Input
                      id="licenseClass2Date"
                      placeholder="مثلا: ۱۳۹۳/۰۸/۲۸"
                      value={userCustomFields.licenseClass2Date as string || ''}
                      onChange={(e) => handleUserCustomFieldChange('licenseClass2Date', e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="group" className="text-xs font-semibold text-foreground">
                    کد گروه راهبری <span className="text-critical">*</span>
                  </Label>
                  <Input
                    id="group"
                    required
                    value={userCustomFields.group === undefined ? '' : String(userCustomFields.group)}
                    onChange={(e) => handleUserCustomFieldChange('group', e.target.value)}
                    className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hireDate" className="text-xs font-semibold text-foreground">
                      تاریخ استخدام <span className="text-critical">*</span>
                    </Label>
                    <Input
                      id="hireDate"
                      required
                      placeholder="۱۴۰۲/۱۰/۰۱"
                      value={userCustomFields.hireDate as string || ''}
                      onChange={(e) => handleUserCustomFieldChange('hireDate', e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="text-xs font-semibold text-foreground">
                      تاریخ تولد <span className="text-critical">*</span>
                    </Label>
                    <Input
                      id="birthDate"
                      required
                      placeholder="۱۳۷۰/۰۵/۱۵"
                      value={userCustomFields.birthDate as string || ''}
                      onChange={(e) => handleUserCustomFieldChange('birthDate', e.target.value)}
                      className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startLocation" className="text-xs font-semibold text-foreground">
                    محل شروع کار (مبدا حرکت) <span className="text-critical">*</span>
                  </Label>
                  <select
                    id="startLocation"
                    required
                    value={userCustomFields.startLocation as string || 'تجریش'}
                    onChange={(e) => handleUserCustomFieldChange('startLocation', e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                  >
                    {['شهرری', 'تجریش', 'پایانه فتح آباد', 'شاهد باقر شهر'].map((sl) => (
                      <option key={sl} value={sl}>{sl}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setUserModalOpen(false)}
                className="cursor-pointer"
              >
                لغو
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-6 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : 'ثبت اطلاعات'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Create Dialog */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-sm w-full" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground text-start">افزودن نقش جدید</DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted text-start">
              یک کلید دسترسی انگلیسی و نام فارسی برای نقش تعریف کنید.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="roleKey" className="text-xs font-semibold text-foreground">
                شناسه یکتا نقش (Key)
              </Label>
              <Input
                id="roleKey"
                required
                placeholder="مثلا: line_manager"
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value)}
                className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
              />
              <span className="text-[10px] text-foreground-muted text-start block">
                فقط حروف کوچک انگلیسی و خط تیره پایین مجاز است (مثال: supervisor_line1).
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleName" className="text-xs font-semibold text-foreground">
                نام فارسی نقش (Label)
              </Label>
              <Input
                id="roleName"
                required
                placeholder="مثلا: مدیر خط"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="h-10 text-sm focus-visible:ring-accent border-border text-start"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleRank" className="text-xs font-semibold text-foreground">
                رتبه دسترسی نقش (Rank)
              </Label>
              <Input
                id="roleRank"
                type="number"
                min={0}
                max={100}
                required
                value={roleRank}
                onChange={(e) => setRoleRank(Number(e.target.value))}
                className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
              />
              <span className="text-[10px] text-foreground-muted text-start block">
                مقداری بین ۰ (کمترین) تا ۱۰۰ (بیشترین) جهت اولویت‌دهی در کنترل دسترسی.
              </span>
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRoleModalOpen(false)}
                className="cursor-pointer"
              >
                لغو
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-6 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : 'ایجاد نقش'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetModalOpen} onOpenChange={setPasswordResetModalOpen}>
        <DialogContent className="max-w-sm w-full" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-1.5 justify-start">
              <Lock className="size-5 text-accent" />
              <span>بازنشانی کلمه عبور پرسنل</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted text-start">
              تعیین رمز عبور جدید برای کاربر: <strong className="text-foreground">{resettingUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                کلمه عبور جدید
              </Label>
              <Input
                id="newPassword"
                type="password"
                required
                placeholder="حداقل ۶ کاراکتر وارد کنید..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 text-sm focus-visible:ring-accent border-border font-mono text-start"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPasswordResetModalOpen(false)}
                className="cursor-pointer"
              >
                لغو
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-6 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : 'ثبت رمز جدید'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
