import { prisma } from './prisma.js'
import {
  CONFIGURABLE_ROLES,
  defaultPagesForRole,
  sanitizePagesForRole,
  type PageKey,
} from './pageAccess.js'

function parsePagesJson(raw: string | null | undefined): PageKey[] {
  try {
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter((p): p is PageKey => typeof p === 'string')
  } catch {
    return []
  }
}

/** Ensures newly added default pages appear on existing RolePageAccess rows. */
export async function ensureRolePageAccessPatches(): Promise<void> {
  const extraPages: Partial<Record<string, PageKey[]>> = {
    ACCOUNT_MANAGER: ['requirements', 'reports'],
    HIRING_MANAGER: ['requirements', 'reports'],
    HR_HEAD: ['reports'],
    HR_MANAGER: ['reports'],
  }

  for (const role of CONFIGURABLE_ROLES) {
    if (role === 'SUPER_ADMIN') continue

    const defaults = defaultPagesForRole(role)
    const row = await prisma.rolePageAccess.findUnique({ where: { role } })
    const stored = row ? parsePagesJson(row.pages) : []
    const base = stored.length > 0 ? stored : defaults
    const merged = sanitizePagesForRole(role, [
      ...new Set([...base, ...defaults, ...(extraPages[role] ?? [])]),
    ])

    if (merged.length === base.length && merged.every((p: PageKey) => base.includes(p))) {
      continue
    }

    await prisma.rolePageAccess.upsert({
      where: { role },
      create: { role, pages: JSON.stringify(merged) },
      update: { pages: JSON.stringify(merged) },
    })
    console.log(`[startup] Patched RolePageAccess for ${role}: ${merged.join(', ')}`)
  }
}
