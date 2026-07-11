import { prisma } from '../db'
import { OrgUnit } from '@/generated/prisma/client'

let orgUnitsCache: OrgUnit[] = []
let cacheTime = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export async function getOrgUnits(): Promise<OrgUnit[]> {
  const now = Date.now()
  if (orgUnitsCache.length === 0 || now - cacheTime > CACHE_TTL) {
    orgUnitsCache = await prisma.orgUnit.findMany()
    cacheTime = now
  }
  return orgUnitsCache
}

export async function getDescendantIds(parentId: string): Promise<string[]> {
  const allUnits = await getOrgUnits()
  const descendants: string[] = []

  function traverse(id: string) {
    const children = allUnits.filter((u) => u.parentId === id)
    for (const child of children) {
      descendants.push(child.id)
      traverse(child.id)
    }
  }

  traverse(parentId)
  return descendants
}

/**
 * Checks if a user has access to a target OrgUnit, considering their scopes.
 * If a user's scope covers an ancestor of the target, they have access.
 */
export async function hasScopeAccess(
  userScopes: { type: string; key: string }[],
  targetOrgKey: string
): Promise<boolean> {
  const allUnits = await getOrgUnits()
  const targetUnit = allUnits.find(u => u.key === targetOrgKey)
  
  if (!targetUnit) return false

  // Find all ancestors of the target unit
  const ancestorKeys = new Set<string>()
  let current: OrgUnit | undefined = targetUnit
  
  while (current) {
    ancestorKeys.add(current.key)
    const pid: string | null = current.parentId
    current = pid ? allUnits.find(u => u.id === pid) : undefined
  }

  // Check if any of the user's scopes matches the target or its ancestors
  for (const scope of userScopes) {
    if (scope.type === 'global' || scope.type === 'all') return true
    if (scope.type === 'org_unit' && ancestorKeys.has(scope.key)) {
      return true
    }
  }

  return false
}
