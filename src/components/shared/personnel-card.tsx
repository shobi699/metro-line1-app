'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, User, Phone, MapPin, Layers } from 'lucide-react'
import { useAuthStore } from '@/features/auth'

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
  }
  currentUserId?: string
  onMessage?: (userId: string) => void
  onProfile?: (user: any) => void
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

export function PersonnelCard({ user, currentUserId, onMessage }: PersonnelCardProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [fieldDefs, setFieldDefs] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (accessToken) {
      getFieldDefs(accessToken).then((defs) => {
        setFieldDefs(defs)
      })
    }
  }, [accessToken])

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const accentColor = STATUS_ACCENT[user.status] ?? STATUS_ACCENT.active
  const dotColor = STATUS_DOT_COLORS[user.status] ?? STATUS_DOT_COLORS.active
  const isOwnProfile = user.id === currentUserId

  // Extract non-empty custom fields to render
  const activeCustomFields = fieldDefs
    .map((def) => {
      const value = user.customFields?.[def.name as string]
      if (value === undefined || value === null || value === '') return null
      
      let displayValue = String(value)
      if (def.type === 'boolean') {
        displayValue = value ? 'بله' : 'خیر'
      }

      return {
        key: def.name,
        label: def.label,
        value: displayValue,
      }
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>

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
        <div className="relative shrink-0">
          <div className="flex size-16 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-foreground-muted font-headline-md">
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
              <h4 className="font-headline-md text-body-lg font-bold text-foreground truncate">
                {user.name}
              </h4>
              <p className="text-foreground-muted text-sm font-label-md mt-0.5">
                {user.role.name}
              </p>
            </div>
            <span className="font-data-mono shrink-0 text-xs bg-surface-container-high text-foreground px-2 py-1 rounded border border-border-subtle">
              {user.nationalId}
            </span>
          </div>
          
          <div className="mt-2 flex flex-col gap-1">
            {/* Email & Phone */}
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate font-mono text-xs">
                {user.phone || '—'}
              </span>
              {user.email && (
                <>
                  <span className="text-border">•</span>
                  <span className="truncate font-mono text-xs">{user.email}</span>
                </>
              )}
            </div>

            {/* Render Custom Fields as badges or labels */}
            {activeCustomFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {activeCustomFields.map((cf) => (
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
          {user.phone && (
            <Button size="sm" className="gap-2" onClick={() => window.open(`tel:${user.phone}`)}>
              <Phone className="size-4" />
              تماس
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
