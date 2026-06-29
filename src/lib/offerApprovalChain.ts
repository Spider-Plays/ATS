import type { Offer, OfferApprovalChain, OfferApprovalStage } from '@/types'

export const OFFER_APPROVER_ELIGIBLE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
] as const

export function createDefaultApprovalChain(): OfferApprovalChain {
  return {
    stages: [
      { id: crypto.randomUUID(), label: 'L1', approverIds: [] },
      { id: crypto.randomUUID(), label: 'L2', approverIds: [] },
    ],
  }
}

export function usesApprovalChain(offer: Pick<Offer, 'approvalChain'>): boolean {
  return (offer.approvalChain?.length ?? 0) >= 2
}

export function validateApprovalChain(chain: OfferApprovalChain): string | null {
  if (chain.stages.length < 2) {
    return 'At least L1 and L2 approval stages are required'
  }
  for (const stage of chain.stages) {
    if (!stage.label.trim()) {
      return 'Each approval stage must have a label'
    }
    if (!stage.approverIds.length) {
      return `${stage.label} must have at least one approver`
    }
  }
  return null
}

export function getCurrentStageIndex(offer: Pick<Offer, 'status' | 'approvalStep' | 'approvalChain'>): number {
  if (offer.status !== 'PENDING_APPROVAL' || !offer.approvalChain?.length) return -1
  if (!offer.approvalStep) return 0
  const idx = offer.approvalChain.findIndex((s) => s.id === offer.approvalStep)
  return idx >= 0 ? idx : 0
}

export function getCurrentStage(offer: Pick<Offer, 'status' | 'approvalStep' | 'approvalChain'>): OfferApprovalStage | null {
  const idx = getCurrentStageIndex(offer)
  if (idx < 0 || !offer.approvalChain) return null
  return offer.approvalChain[idx] ?? null
}

export function canUserApproveCurrentStage(
  userId: string | undefined,
  offer: Pick<Offer, 'createdBy' | 'status' | 'approvalStep' | 'approvalChain'>
): boolean {
  if (!userId || offer.createdBy === userId) return false
  const stage = getCurrentStage(offer)
  if (!stage) return false
  return stage.approverIds.includes(userId)
}
