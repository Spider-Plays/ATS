import { prisma } from './prisma.js'
import { logActivity } from '../services/activityLog.js'
import { notifyCandidateStatusChange } from './emailDispatch.js'

export const CANDIDATE_PIPELINE_STATUSES = [
  'ADDED',
  'SUBMITTED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
] as const

export type CandidatePipelineStatus = (typeof CANDIDATE_PIPELINE_STATUSES)[number]

const LEGACY_PRE_PIPELINE_STATUSES = new Set(['SOURCED', 'APPLIED'])

export function isCandidatePipelineStatus(value: string): value is CandidatePipelineStatus {
  return (CANDIDATE_PIPELINE_STATUSES as readonly string[]).includes(value)
}

/** Default status when a candidate record is created. */
export function resolveCreateStatus(requirementId: string | null | undefined): CandidatePipelineStatus {
  return requirementId ? 'SUBMITTED' : 'ADDED'
}

/** When a candidate is linked to a requirement, move them into the submitted queue. */
export function buildRequirementTagUpdate(
  currentStatus: string,
  prevRequirementId: string | null | undefined,
  nextRequirementId: string | null
): { status?: CandidatePipelineStatus; submittedAt?: Date | null } {
  if (prevRequirementId === nextRequirementId) {
    return {}
  }
  if (!nextRequirementId) {
    if (prevRequirementId && (currentStatus === 'SUBMITTED' || LEGACY_PRE_PIPELINE_STATUSES.has(currentStatus))) {
      return { status: 'ADDED', submittedAt: null }
    }
    return {}
  }
  if (
    currentStatus === 'ADDED' ||
    LEGACY_PRE_PIPELINE_STATUSES.has(currentStatus) ||
    !prevRequirementId
  ) {
    return { status: 'SUBMITTED', submittedAt: new Date() }
  }
  return {}
}

export function autoScreeningDelayMs(): number {
  const hours = Number(process.env.CANDIDATE_AUTO_SCREENING_HOURS)
  if (Number.isFinite(hours) && hours > 0) return hours * 60 * 60 * 1000
  return 24 * 60 * 60 * 1000
}

export async function promoteSubmittedCandidatesToScreening(): Promise<void> {
  const cutoff = new Date(Date.now() - autoScreeningDelayMs())
  const rows = await prisma.candidate.findMany({
    where: {
      status: 'SUBMITTED',
      submittedAt: { not: null, lte: cutoff },
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      jobTitle: true,
      requirementId: true,
      referredByUserId: true,
    },
  })

  if (!rows.length) return

  await prisma.candidate.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { status: 'SCREENING', updatedAt: new Date() },
  })

  for (const row of rows) {
    await logActivity({
      entityType: 'CANDIDATE',
      entityId: row.id,
      action: 'STATUS_CHANGED',
      performedBy: 'system',
      details: { previousStatus: 'SUBMITTED', newStatus: 'SCREENING', automatic: true },
    })
    notifyCandidateStatusChange(
      {
        id: row.id,
        email: row.email,
        name: row.name,
        status: 'SCREENING',
        jobTitle: row.jobTitle,
        requirementId: row.requirementId,
        referredByUserId: row.referredByUserId,
      },
      'SUBMITTED'
    )
  }
}

function fireAndForget(promise: Promise<unknown>) {
  promise.catch((err) =>
    console.error('[candidate-screening]', err instanceof Error ? err.message : err)
  )
}

export function startCandidateScreeningJob() {
  const intervalMs = 15 * 60 * 1000
  fireAndForget(promoteSubmittedCandidatesToScreening())
  setInterval(() => fireAndForget(promoteSubmittedCandidatesToScreening()), intervalMs)
}
