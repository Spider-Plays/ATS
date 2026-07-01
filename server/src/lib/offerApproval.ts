export const HR_HEAD_DELEGATE = 'HR_HEAD' as const
export const EXEC_DELEGATE = 'EXEC' as const

export type OfferApprovalBody = {
  onBehalfOfHrHead?: boolean
  onBehalfOfExec?: boolean
  reason?: string
  comment?: string
}

export function parseOfferApprovalBody(body: unknown): OfferApprovalBody {
  if (!body || typeof body !== 'object') return {}
  const o = body as Record<string, unknown>
  return {
    onBehalfOfHrHead: o.onBehalfOfHrHead === true,
    onBehalfOfExec: o.onBehalfOfExec === true,
    reason: typeof o.reason === 'string' ? o.reason : undefined,
    comment: typeof o.comment === 'string' ? o.comment : undefined,
  }
}

export function assertApprovalCommentRequired(opts: OfferApprovalBody): string {
  const comment = opts.comment?.trim()
  if (!comment) {
    throw new Error('A comment is required to approve this offer')
  }
  return comment
}

export function buildOfferApprovalRecord(
  decision: 'APPROVED' | 'REJECTED' | 'REQUESTED',
  auth: { userId: string; role: string },
  step: string,
  options: { onBehalfOfHrHead?: boolean; onBehalfOfExec?: boolean; reason?: string; comment?: string } = {}
) {
  const timestamp = new Date().toISOString()
  const onBehalf =
    auth.role === 'ADMIN' && options.onBehalfOfHrHead && step === 'HR'
      ? HR_HEAD_DELEGATE
      : auth.role === 'ADMIN' && options.onBehalfOfExec && step === 'EXEC'
        ? EXEC_DELEGATE
        : undefined
  const comment = options.comment?.trim()

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
      ...(comment ? { comment } : {}),
    },
    approval: {
      decision,
      step,
      decidedBy: auth.userId,
      decidedAt: timestamp,
      ...(onBehalf ? { onBehalfOf: onBehalf, performedByRole: auth.role } : {}),
      ...(options.reason ? { reason: options.reason } : {}),
      ...(comment ? { comment } : {}),
    },
  }
}
