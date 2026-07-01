import type { ActivityLog, Prisma } from '@prisma/client'

import { prisma } from './prisma.js'
import {
  businessRequirementIdsForStakeholder,
  canViewBusinessRequirement,
} from './businessRequirementAccess.js'

import {
  assertCanViewCandidate,
  buildCandidateListWhere,
  interviewIdsForInterviewer,
  INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS,
} from './candidateAccess.js'

import { hasOrgWideAccess, isSuperAdminRole } from './orgAccess.js'
import { assertCanViewRequirement, requirementIdsForAuth } from './requirementAccess.js'

/** Stage changes trigger email alerts to stakeholders + super admin. */
export const BUSINESS_STAGE_NOTIFY_ACTIONS = ['STAGE_CHANGED', 'SOW_SIGNED'] as const

async function visibleCandidateIds(
  auth: { userId: string; role: string; name?: string }
): Promise<string[]> {
  const where = await buildCandidateListWhere(auth)
  const rows = await prisma.candidate.findMany({ where, select: { id: true } })
  return rows.map((r) => r.id)
}

async function visibleInterviewIds(
  auth: { userId: string; role: string; name?: string }
): Promise<string[]> {
  if (auth.role === 'INTERVIEWER') {
    return interviewIdsForInterviewer(auth.userId)
  }

  const candidateIds = await visibleCandidateIds(auth)
  if (candidateIds.length === 0) return []

  const rows = await prisma.interview.findMany({
    where: { candidateId: { in: candidateIds } },
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

async function scopedActivityWhere(
  auth: { userId: string; role: string; name?: string }
): Promise<Prisma.ActivityLogWhereInput> {
  if (hasOrgWideAccess(auth.role)) {
    return {}
  }

  // Business stakeholders: business requirements + any hiring requirements they own.
  if (auth.role === 'ACCOUNT_MANAGER' || auth.role === 'HIRING_MANAGER') {
    const [businessReqIds, requirementIds] = await Promise.all([
      businessRequirementIdsForStakeholder(auth.userId),
      requirementIdsForAuth(auth),
    ])
    const or: Prisma.ActivityLogWhereInput[] = []
    if (businessReqIds.length > 0) {
      or.push({
        entityType: 'BUSINESS_REQUIREMENT',
        entityId: { in: businessReqIds },
      })
    }
    if (requirementIds.length > 0) {
      or.push({ entityType: 'REQUIREMENT', entityId: { in: requirementIds } })
    }
    return or.length > 0 ? { OR: or } : { id: { in: ['__none__'] } }
  }

  const [candidateIds, requirementIds, interviewIds] = await Promise.all([
    visibleCandidateIds(auth),
    requirementIdsForAuth(auth),
    visibleInterviewIds(auth),
  ])

  const or: Prisma.ActivityLogWhereInput[] = []

  if (auth.role === 'INTERVIEWER') {
    if (interviewIds.length > 0) {
      or.push({ entityType: 'INTERVIEW', entityId: { in: interviewIds } })
    }
    if (candidateIds.length > 0) {
      or.push({
        entityType: 'CANDIDATE',
        entityId: { in: candidateIds },
        action: { in: [...INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS] },
      })
    }
    return or.length > 0 ? { OR: or } : { id: { in: ['__none__'] } }
  }

  if (candidateIds.length > 0) {
    or.push({ entityType: 'CANDIDATE', entityId: { in: candidateIds } })
  }
  if (requirementIds.length > 0) {
    or.push({ entityType: 'REQUIREMENT', entityId: { in: requirementIds } })
  }
  if (interviewIds.length > 0) {
    or.push({ entityType: 'INTERVIEW', entityId: { in: interviewIds } })
  }

  return or.length > 0 ? { OR: or } : { id: { in: ['__none__'] } }
}

const PIPELINE_ACTIVITY_ENTITY_TYPES = new Set([
  'CANDIDATE',
  'REQUIREMENT',
  'INTERVIEW',
  'OFFER',
])

function isPipelineActivityEntityType(entityType: string): boolean {
  return PIPELINE_ACTIVITY_ENTITY_TYPES.has(entityType)
}

function isBusinessRequirementActivityLog(log: ActivityLog): boolean {
  return log.entityType === 'BUSINESS_REQUIREMENT'
}

async function allowedBusinessRequirementIdsForAuth(
  auth: { userId: string; role: string },
  entityIds: string[]
): Promise<Set<string>> {
  if (entityIds.length === 0) return new Set()
  if (isSuperAdminRole(auth.role)) return new Set(entityIds)

  const rows = await prisma.businessRequirement.findMany({
    where: { id: { in: entityIds } },
    select: { id: true, accountManager: true, hiringManager: true, createdBy: true },
  })
  return new Set(
    rows
      .filter(
        (r) =>
          r.accountManager === auth.userId ||
          r.hiringManager === auth.userId ||
          r.createdBy === auth.userId
      )
      .map((r) => r.id)
  )
}

async function filterBusinessRequirementLogsForAuth(
  auth: { userId: string; role: string },
  logs: ActivityLog[]
): Promise<ActivityLog[]> {
  const bizLogs = logs.filter(isBusinessRequirementActivityLog)
  if (bizLogs.length === 0) return logs
  if (isSuperAdminRole(auth.role)) return logs

  const allowed = await allowedBusinessRequirementIdsForAuth(
    auth,
    [...new Set(bizLogs.map((l) => l.entityId))]
  )

  return logs.filter((log) => {
    if (!isBusinessRequirementActivityLog(log)) return true
    return allowed.has(log.entityId)
  })
}

async function filterActivityLogsForAuth(
  auth: { userId: string; role: string },
  logs: ActivityLog[]
): Promise<ActivityLog[]> {
  let filtered = logs

  if (!isSuperAdminRole(auth.role)) {
    filtered = filtered.filter(
      (log) => isPipelineActivityEntityType(log.entityType) || isBusinessRequirementActivityLog(log)
    )
  }

  return filterBusinessRequirementLogsForAuth(auth, filtered)
}

export async function listActivityLogsForAuth(
  auth: { userId: string; role: string; name?: string },
  limit: number
): Promise<ActivityLog[]> {
  const where = await scopedActivityWhere(auth)
  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
  return filterActivityLogsForAuth(auth, rows)
}

export async function listActivityLogsForEntity(
  auth: { userId: string; role: string; name?: string },
  entityId: string,
  limit: number
): Promise<ActivityLog[]> {
  if (auth.role === 'INTERVIEWER') {
    await assertCanViewCandidate(auth, entityId)
    return prisma.activityLog.findMany({
      where: {
        entityId,
        entityType: 'CANDIDATE',
        action: { in: [...INTERVIEWER_VISIBLE_CANDIDATE_ACTIONS] },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  const bizRow = await prisma.businessRequirement.findUnique({
    where: { id: entityId },
    select: {
      id: true,
      createdBy: true,
      accountManager: true,
      hiringManager: true,
    },
  })
  if (bizRow && canViewBusinessRequirement(auth, bizRow)) {
    const rows = await prisma.activityLog.findMany({
      where: { entityId, entityType: 'BUSINESS_REQUIREMENT' },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return rows
  }

  const requirementRow = await prisma.requirement.findUnique({
    where: { id: entityId },
    select: { id: true },
  })
  if (requirementRow) {
    try {
      await assertCanViewRequirement(auth, entityId)
    } catch {
      return []
    }
    return prisma.activityLog.findMany({
      where: { entityId, entityType: 'REQUIREMENT' },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  const candidateIds = await visibleCandidateIds(auth)

  if (candidateIds.includes(entityId)) {
    return prisma.activityLog.findMany({
      where: { entityId, entityType: 'CANDIDATE' },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  if (hasOrgWideAccess(auth.role)) {
    return prisma.activityLog.findMany({
      where: { entityId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  }

  return []
}
