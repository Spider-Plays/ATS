import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { hasOrgWideAccess } from './orgAccess.js'
import { requirementIdsForAuth } from './requirementAccess.js'

export async function buildVendorListWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.VendorWhereInput> {
  if (hasOrgWideAccess(auth.role)) {
    return {}
  }

  const reqIds = await requirementIdsForAuth(auth)
  if (reqIds.length === 0) {
    return { id: { in: ['__none__'] } }
  }

  const assignments = await prisma.vendorRequirement.findMany({
    where: { requirementId: { in: reqIds } },
    select: { vendorId: true },
  })
  const vendorIds = [...new Set(assignments.map((a) => a.vendorId))]
  return vendorIds.length > 0 ? { id: { in: vendorIds } } : { id: { in: ['__none__'] } }
}
