export const OFFER_STATUSES = [
  'DRAFT',
  'PENDING_HR_APPROVAL',
  'PENDING_EXEC_APPROVAL',
  'APPROVED',
  'SENT',
  'NEGOTIATION',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
] as const

export type OfferStatus = (typeof OFFER_STATUSES)[number]

const ALLOWED: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: ['PENDING_HR_APPROVAL'],
  PENDING_HR_APPROVAL: ['DRAFT', 'APPROVED', 'PENDING_EXEC_APPROVAL'],
  PENDING_EXEC_APPROVAL: ['DRAFT', 'APPROVED'],
  APPROVED: ['SENT', 'WITHDRAWN'],
  SENT: ['ACCEPTED', 'DECLINED', 'NEGOTIATION', 'WITHDRAWN'],
  NEGOTIATION: ['DRAFT'],
  ACCEPTED: [],
  DECLINED: [],
  WITHDRAWN: [],
}

export function assertOfferTransition(from: string, to: string): void {
  const allowed = ALLOWED[from as OfferStatus]
  if (!allowed || !allowed.includes(to as OfferStatus)) {
    throw new Error(`Cannot transition offer from ${from} to ${to}`)
  }
}

export function canEditOfferFields(status: string): boolean {
  return status === 'DRAFT' || status === 'NEGOTIATION'
}
