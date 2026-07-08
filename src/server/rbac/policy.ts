import { prisma } from '@/server/db'

type CacheEntry = {
  value: boolean
  expiresAt: number
}

const policyCache = new Map<string, CacheEntry>()

/**
 * Clear the in-memory policy cache.
 * Call this when policies are created, updated, or reset in the admin panel.
 */
export function invalidatePolicyCache(): void {
  policyCache.clear()
}

/**
 * Get fallback policy boolean value when no database record is found.
 * Implements a "secure by default" strategy.
 */
function getStaticPolicyFallback(resource: string, action: string, targetId?: string): boolean {
  if (resource === 'chat') {
    // action is roomKind (direct, group, etc.)
    // targetId is the capability (canSend, canAttach, canPin, canUrgent, canCreate)
    const field = targetId || 'canSend'
    if (field === 'canSend' || field === 'canAttach') return true
    return false
  }

  if (resource === 'roster') {
    // action is view_full, upload, publish, reassign, resolve_dispute, approve_swap, comment, export
    if (action === 'view_full' || action === 'comment') return true
    return false
  }

  if (resource === 'radio') {
    // action is channelKey, targetId is canListen or canTransmit
    const field = targetId || 'canTransmit'
    if (field === 'canListen') return true
    return false
  }

  if (resource === 'directory') {
    // action is fieldKey (phone, email, nationalId, vehicles, custom:...)
    if (action === 'phone' || action === 'email') return true
    return false
  }

  // Audited course / post audience default to false (private by default)
  return false
}

/**
 * Execute the database query to check policy permissions.
 */
async function runDbPolicyCheck(
  roleKey: string,
  resource: string,
  action: string,
  targetId?: string
): Promise<boolean> {
  try {
    if (resource === 'chat') {
      const policy = await prisma.chatRolePolicy.findUnique({
        where: {
          roleKey_roomKind: { roleKey, roomKind: action },
        },
      })
      if (!policy) return getStaticPolicyFallback(resource, action, targetId)
      const field = targetId || 'canSend'
      return !!(policy as any)[field]
    }

    if (resource === 'roster') {
      const policy = await prisma.rosterRolePolicy.findUnique({
        where: {
          roleKey_action: { roleKey, action },
        },
      })
      if (!policy) return getStaticPolicyFallback(resource, action, targetId)
      return policy.allowed
    }

    if (resource === 'radio') {
      const policy = await prisma.radioRolePolicy.findUnique({
        where: {
          roleKey_channelKey: { roleKey, channelKey: action },
        },
      })
      if (!policy) return getStaticPolicyFallback(resource, action, targetId)
      const field = targetId || 'canTransmit'
      return !!(policy as any)[field]
    }

    if (resource === 'directory') {
      const policy = await prisma.directoryFieldPolicy.findUnique({
        where: {
          roleKey_fieldKey: { roleKey, fieldKey: action },
        },
      })
      if (!policy) return getStaticPolicyFallback(resource, action, targetId)
      return policy.visible
    }

    if (resource === 'course') {
      const course = await prisma.course.findUnique({
        where: { id: action },
        select: { audience: true }
      })
      if (!course) return false
      if (!course.audience) return true // no audience restriction
      
      const audiences = course.audience.split(',').map(s => s.trim())
      return audiences.includes('*') || audiences.includes('all') || audiences.includes(roleKey)
    }

    if (resource === 'post') {
      // Check if role is explicitly targeted in audience, or if audience has '*' or 'all'
      const count = await prisma.postAudience.count({
        where: {
          postId: action,
          roleKey: { in: [roleKey, '*', 'all'] },
        },
      })
      return count > 0
    }
  } catch (err) {
    console.error(`Error in runDbPolicyCheck (${roleKey}, ${resource}, ${action}):`, err)
  }

  return getStaticPolicyFallback(resource, action, targetId)
}

/**
 * Standard server-side helper to check user access to resource actions.
 * Implements a 60-second in-memory TTL cache to reduce DB hits on hot paths.
 */
export async function assertPolicy(
  roleKey: string,
  resource: string,
  action: string,
  targetId?: string
): Promise<boolean> {
  // Super admin has full access to everything bypass
  if (roleKey === 'super_admin') return true

  const cacheKey = `${roleKey}:${resource}:${action}:${targetId || ''}`
  const now = Date.now()
  const cached = policyCache.get(cacheKey)

  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const value = await runDbPolicyCheck(roleKey, resource, action, targetId)

  policyCache.set(cacheKey, {
    value,
    expiresAt: now + 60 * 1000, // 60s TTL
  })

  return value
}
