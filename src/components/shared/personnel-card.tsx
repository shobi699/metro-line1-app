'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User, Phone, Layers, Mail, PhoneCall, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { VehiclePlateFromData } from '@/components/shared/iran-plate'

interface PersonnelCardProps {
  user: {
    id: string
    name: string
    nationalId: string
    phone: string | null
    email: string | null
    status: string
    customFields: Record<string, unknown> | null
    role: { key: string; name: string }
    createdAt?: string
  }
  currentUserId?: string
  onMessage?: (userId: string) => void
  onProfile?: (user: PersonnelCardProps['user']) => void
  /**
   * List of field keys that non-admin users are allowed to see.
   * `undefined` means "not loaded yet" — will hide everything for safety.
   * An empty array `[]` means "nothing allowed".
   */
  visibleFields?: string[]
}

const STATUS_DOT_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  suspended: 'bg-gray-400',
}

const STATUS_ACCENT: Record<string, string> = {
  active: 'bg-accent/20 group-hover:bg-accent',
  pending: 'bg-warning/20 group-hover:bg-warning',
  suspended: 'bg-foreground-muted/20 group-hover:bg-foreground-muted',
}

// Global cache to prevent duplicated requests across multiple cards
let cachedDefs: Record<string, unknown>[] | null = null
let pendingPromise: Promise<Record<string, unknown>[]> | null = null

async function getFieldDefs(token: string): Promise<Record<string, unknown>[]> {
  if (cachedDefs) return cachedDefs
  if (pendingPromise) return pendingPromise

  pendingPromise = fetch('/api/custom-fields?entityType=User', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((json) => {
      const data: Record<string, unknown>[] = json.data ?? []
      cachedDefs = data
      return data
    })
    .catch(() => {
      pendingPromise = null
      return [] as Record<string, unknown>[]
    })

  return pendingPromise
}

/** Format a phone number for display with separators */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Mobile: 0912-345-6789
  if (digits.startsWith('09') && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  // Landline with area code: 021-5500-1122
  if (digits.startsWith('0') && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  // 10-digit without leading 0
  if (digits.length === 10 && !digits.startsWith('0')) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return raw
}

/** Phone number patterns to detect phone custom fields */
const PHONE_FIELD_PATTERN = /phone|tel|mobile|تلفن|موبایل|شماره.*تماس/i

interface PhoneEntry {
  number: string
  label: string
  formatted: string
}

export function PersonnelCard({ user, currentUserId, onMessage, onProfile, visibleFields }: PersonnelCardProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  const [fieldDefs, setFieldDefs] = useState<Record<string, unknown>[]>([])
  const [showPhonePicker, setShowPhonePicker] = useState(false)
  const phonePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (accessToken) {
      getFieldDefs(accessToken).then((defs) => {
        setFieldDefs(defs)
      })
    }
  }, [accessToken])

  // Close phone picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (phonePickerRef.current && !phonePickerRef.current.contains(e.target as Node)) {
        setShowPhonePicker(false)
      }
    }
    if (showPhonePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPhonePicker])

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const accentColor = STATUS_ACCENT[user.status] ?? STATUS_ACCENT.active
  const dotColor = STATUS_DOT_COLORS[user.status] ?? STATUS_DOT_COLORS.active
  const isOwnProfile = user.id === currentUserId
  const isAdmin = currentUser?.roleKey === 'admin' || currentUser?.roleKey === 'super_admin'

  // Default fields when visibleFields is not yet loaded (undefined):
  // Show common fields. When loaded as [] explicitly, show nothing.
  const allowedFields = visibleFields ?? [
    'phone',
    'email',
    'personnelNo',
    'post',
    'shift',
    'shiftType',
    'group',
    'startLocation',
    'vehicles',
  ]

  // Extract non-empty custom fields to render (excluding vehicles and phone-like fields)
  const activeCustomFields = fieldDefs
    .map((def) => {
      const fieldName = def.name as string
      const fieldLabel = def.label as string
      // Skip vehicles — they have their own graphical rendering below
      if (fieldName === 'vehicles') return null
      // Skip phone-like fields — they are rendered in the phone section
      if (PHONE_FIELD_PATTERN.test(fieldName) || PHONE_FIELD_PATTERN.test(fieldLabel)) return null
      const value = user.customFields?.[fieldName]
      if (value === undefined || value === null || value === '') return null
      
      let displayValue = String(value)
      if (def.type === 'boolean') {
        displayValue = value ? 'بله' : 'خیر'
      }

      return {
        key: fieldName,
        label: fieldLabel,
        value: displayValue,
      }
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>

  // Filter based on admin role or allowed fields settings
  const filteredCustomFields = activeCustomFields.filter((cf) => {
    if (isAdmin || isOwnProfile) return true
    return allowedFields.includes(cf.key)
  })

  const canShowNationalId = isAdmin || isOwnProfile || allowedFields.includes('nationalId')
  const canShowPhone = isAdmin || isOwnProfile || allowedFields.includes('phone')
  const canShowEmail = isAdmin || isOwnProfile || allowedFields.includes('email')

  // Collect ALL phone numbers: primary + custom phone-like fields
  const allPhones: PhoneEntry[] = []
  if (canShowPhone && user.phone) {
    allPhones.push({
      number: user.phone,
      label: 'شماره اصلی',
      formatted: formatPhone(user.phone),
    })
  }

  // Scan custom fields for phone-like data
  fieldDefs.forEach((def) => {
    const fieldName = def.name as string
    const fieldLabel = def.label as string
    // Only include phone-pattern fields
    if (!PHONE_FIELD_PATTERN.test(fieldName) && !PHONE_FIELD_PATTERN.test(fieldLabel)) return
    // Check visibility
    if (!isAdmin && !isOwnProfile && !allowedFields.includes(fieldName)) return
    const value = user.customFields?.[fieldName]
    if (!value || typeof value !== 'string') return
    // Validate it looks like a phone
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 8 || cleaned.length > 15) return
    // Avoid duplicate with primary phone
    if (user.phone && cleaned === user.phone.replace(/\D/g, '')) return
    allPhones.push({
      number: value,
      label: fieldLabel,
      formatted: formatPhone(value),
    })
  })

  // Extract vehicles for graphical plate display
  const customFields = (user.customFields as Record<string, unknown>) || {}
  const vehicles = (customFields.vehicles as Record<string, unknown>[]) || []
  const canShowVehicles = true

  return (
    <div className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface p-4 transition-colors hover:border-accent/50 group flex flex-col gap-4">
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute top-0 end-0 w-2 h-full transition-colors',
          accentColor,
        )}
      />

      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Avatar with status dot */}
        <div className="relative shrink-0" onClick={() => onProfile?.(user)}>
          <div className="flex size-16 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-foreground-muted font-headline-md cursor-pointer hover:bg-surface-container-highest transition-colors">
            {initials}
          </div>
          <div
            className={cn(
              'absolute -bottom-1 -end-1 size-4 rounded-full border-2 border-surface',
              dotColor,
            )}
            title={user.status === 'active' ? 'فعال' : user.status === 'pending' ? 'در انتظار' : 'معلق'}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h4 className="font-headline-md text-body-lg font-bold text-foreground truncate cursor-pointer hover:text-accent transition-colors" onClick={() => onProfile?.(user)}>
                {user.name}
              </h4>
              <p className="text-foreground-muted text-sm font-label-md mt-0.5">
                {user.role.name}
              </p>
            </div>
            {canShowNationalId && (
              <span className="font-data-mono shrink-0 text-xs bg-surface-container-high text-foreground px-2 py-1 rounded border border-border-subtle">
                {user.nationalId}
              </span>
            )}
          </div>
          
          <div className="mt-2 flex flex-col gap-1">
            {/* Phone Numbers — Eye-catching pills */}
            {allPhones.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {allPhones.map((p, idx) => (
                  <a
                    key={idx}
                    href={`tel:${p.number}`}
                    dir="ltr"
                    className={cn(
                      'group/phone inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                      'bg-gradient-to-l from-green-500/15 to-emerald-600/10',
                      'border border-green-500/30 hover:border-green-400/60',
                      'text-green-400 hover:text-green-300',
                      'transition-all duration-200 hover:shadow-[0_0_12px_rgba(34,197,94,0.15)]',
                      'cursor-pointer select-none',
                    )}
                    title={p.label}
                  >
                    <Phone className="size-3 shrink-0 opacity-70 group-hover/phone:opacity-100 transition-opacity" />
                    <span className="font-mono tracking-wide">{toFa(p.formatted)}</span>
                    {allPhones.length > 1 && (
                      <span className="text-[9px] text-green-500/60 font-normal me-0.5 hidden sm:inline">
                        {p.label}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Email */}
            {canShowEmail && user.email && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <a
                  href={`mailto:${user.email}`}
                  dir="ltr"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                    'bg-gradient-to-l from-blue-500/10 to-sky-600/5',
                    'border border-blue-500/20 hover:border-blue-400/50',
                    'text-blue-400/80 hover:text-blue-300',
                    'transition-all duration-200',
                    'cursor-pointer select-none truncate max-w-[220px]',
                  )}
                >
                  <Mail className="size-3 shrink-0 opacity-70" />
                  <span className="font-mono text-[11px] truncate">{user.email}</span>
                </a>
              </div>
            )}

            {/* Render Custom Fields as badges or labels */}
            {filteredCustomFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {filteredCustomFields.map((cf) => (
                  <Badge
                    key={cf.key}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-surface-container-low border-border/80 text-foreground-muted flex items-center gap-1 font-medium"
                  >
                    <Layers className="size-3 text-accent shrink-0" />
                    <span>{cf.label}:</span>
                    <span className="text-foreground font-semibold">{cf.value}</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* Graphical Vehicle Plates */}
            {canShowVehicles && vehicles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicles.map((v: Record<string, unknown>, idx: number) => (
                  <VehiclePlateFromData key={idx} vehicle={v} size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isOwnProfile && (
        <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-outline-variant/50">
          <Button
            variant="outline"
            size="icon-sm"
            title="پیام"
            onClick={() => onMessage?.(user.id)}
          >
            <MessageCircle className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            title="پروفایل"
            onClick={() => onProfile?.(user)}
          >
            <User className="size-4" />
          </Button>

          {/* Call button — single phone: direct call / multiple: picker */}
          {allPhones.length === 1 && (
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-500 text-white border-0"
              onClick={() => window.open(`tel:${allPhones[0].number}`)}
            >
              <PhoneCall className="size-4" />
              تماس
            </Button>
          )}
          {allPhones.length > 1 && (
            <div className="relative" ref={phonePickerRef}>
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-500 text-white border-0"
                onClick={() => setShowPhonePicker(!showPhonePicker)}
              >
                <PhoneCall className="size-4" />
                تماس
                <ChevronDown className={cn(
                  'size-3.5 transition-transform duration-200',
                  showPhonePicker && 'rotate-180'
                )} />
              </Button>

              {/* Phone picker dropdown */}
              {showPhonePicker && (
                <div className="absolute bottom-full mb-2 start-0 z-50 min-w-[200px] rounded-xl border border-outline-variant bg-surface-container-high shadow-xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="p-1.5 space-y-0.5">
                    {allPhones.map((p, idx) => (
                      <button
                        key={idx}
                        dir="ltr"
                        onClick={() => {
                          window.open(`tel:${p.number}`)
                          setShowPhonePicker(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg',
                          'hover:bg-green-500/10 transition-colors text-start',
                          'group/item',
                        )}
                      >
                        <div className="flex size-7 items-center justify-center rounded-full bg-green-500/15 shrink-0">
                          <Phone className="size-3.5 text-green-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs text-foreground tracking-wide">
                            {toFa(formatPhone(p.number))}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            {p.label}
                          </span>
                        </div>
                        <PhoneCall className="size-3.5 text-green-500/0 group-hover/item:text-green-400 transition-colors ms-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
