export const HR_HEAD_DELEGATE = 'HR_HEAD' as const
export const EXEC_DELEGATE = 'EXEC' as const

export type OfferApprovalBody = {
  onBehalfOfHrHead?: boolean
  onBehalfOfExec?: boolean
  reason?: string
}

export function parseOfferApprovalBody(body: unknown): OfferApprovalBody {
  if (!body || typeof body !== 'object') return {}
  const o = body as Record<string, unknown>
  return {
    onBehalfOfHrHead: o.onBehalfOfHrHead === true,
    onBehalfOfExec: o.onBehalfOfExec === true,
    reason: typeof o.reason === 'string' ? o.reason : undefined,
  }
}

export function buildOfferApprovalRecord(
  decision: 'APPROVED' | 'REJECTED' | 'REQUESTED',
  auth: { userId: string; role: string },
  step: 'HR' | 'EXEC',
  options: { onBehalfOfHrHead?: boolean; onBehalfOfExec?: boolean; reason?: string } = {}
) {
  const timestamp = new Date().toISOString()
  const onBehalf =
    auth.role === 'ADMIN' && options.onBehalfOfHrHead && step === 'HR'
      ? HR_HEAD_DELEGATE
      : auth.role === 'ADMIN' && options.onBehalfOfExec && step === 'EXEC'
        ? EXEC_DELEGATE
        : undefined

  return {
    timestamp,
    historyEntry: {
      action: decision,
      step,
      by: auth.userId,
      at: timestamp,
      role: auth.role,
      ...(onBehalf ? { onBehalfOf: onBehalf } : {}),
      ...(options.reason ? { reason: options.reason } : {}),
    },
    approval: {
      decision,
      step,
      decidedBy: auth.userId,
      decidedAt: timestamp,
      ...(onBehalf ? { onBehalfOf: onBehalf, performedByRole: auth.role } : {}),
      ...(options.reason ? { reason: options.reason } : {}),
    },
  }
}
