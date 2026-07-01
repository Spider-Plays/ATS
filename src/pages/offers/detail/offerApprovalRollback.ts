import type { Offer, OfferStatus } from '@/types'
import { getCurrentStageIndex, usesApprovalChain } from '@/lib/offerApprovalChain'

export type OfferApprovalRollbackTarget = {
  status: OfferStatus
  label: string
}

function hadExecApproval(history: Offer['approvalHistory']): boolean {
  return (history ?? []).some((entry) => entry.action === 'APPROVED' && entry.step === 'EXEC')
}

const EXEC_APPROVAL_THRESHOLD = 2_500_000

function requiresExecApproval(annualCtc: number): boolean {
  return annualCtc >= EXEC_APPROVAL_THRESHOLD
}

export function getOfferApprovalRollbackTarget(offer: Offer): OfferApprovalRollbackTarget | null {
  if (offer.status === 'PENDING_APPROVAL' && usesApprovalChain(offer)) {
    const idx = getCurrentStageIndex(offer)
    if (idx > 0) {
      const prev = offer.approvalChain![idx - 1]
      return { status: 'PENDING_APPROVAL', label: `Rollback to ${prev?.label ?? 'previous stage'}` }
    }
    return { status: 'DRAFT', label: 'Rollback to draft' }
  }

  switch (offer.status) {
    case 'PENDING_HR_APPROVAL':
      return { status: 'DRAFT', label: 'Rollback to draft' }
    case 'PENDING_EXEC_APPROVAL':
      return { status: 'PENDING_HR_APPROVAL', label: 'Rollback to HR approval' }
    case 'APPROVED': {
      if (usesApprovalChain(offer) && offer.approvalChain?.length) {
        const prev = offer.approvalChain[offer.approvalChain.length - 2]
        return {
          status: 'PENDING_APPROVAL',
          label: `Rollback to ${prev?.label ?? 'last approval stage'}`,
        }
      }
      const ctc = offer.annualCtc ?? offer.baseSalary ?? 0
      if (hadExecApproval(offer.approvalHistory) || requiresExecApproval(ctc)) {
        return { status: 'PENDING_EXEC_APPROVAL', label: 'Rollback to executive approval' }
      }
      return { status: 'PENDING_HR_APPROVAL', label: 'Rollback to HR approval' }
    }
    case 'SENT':
      return { status: 'APPROVED', label: 'Rollback to approved' }
    default:
      return null
  }
}
