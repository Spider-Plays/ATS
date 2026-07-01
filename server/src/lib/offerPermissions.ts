import { env } from '../config/env.js'
import { getAnnualCtcFromOffer } from './offerCompensation.js'
import {
  canUserApproveCurrentStage,
  getCurrentStage,
  usesApprovalChain,
} from './offerApprovalChain.js'
import { canEditOfferDetails } from './offerTransitions.js'

export const OFFER_HR_APPROVAL_ROLES = ['HR_HEAD', 'SUPER_ADMIN', 'ADMIN'] as const
export const OFFER_EXEC_APPROVAL_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

export type OfferApprovalOptions = {
  onBehalfOfHrHead?: boolean
  onBehalfOfExec?: boolean
}

export function requiresExecApproval(annualCtc: number): boolean {
  return annualCtc >= env.offerExecApprovalThreshold
}

export function nextStatusAfterHrApproval(offer: {
  annualCtc?: number | null
  baseSalary?: number | null
}): 'APPROVED' | 'PENDING_EXEC_APPROVAL' {
  const ctc = getAnnualCtcFromOffer(offer)
  return requiresExecApproval(ctc) ? 'PENDING_EXEC_APPROVAL' : 'APPROVED'
}

export function assertCanSubmitOffer(
  auth: { userId: string; role: string },
  offer: { createdBy: string; status: string }
): void {
  if (offer.status !== 'DRAFT' && offer.status !== 'NEGOTIATION') {
    throw new Error('Only draft or negotiation offers can be submitted')
  }
}

export function assertCanApproveOfferHr(
  auth: { userId: string; role: string },
  offer: { createdBy: string; status: string },
  options: OfferApprovalOptions = {}
): void {
  if (offer.status !== 'PENDING_HR_APPROVAL') {
    throw new Error('Offer is not pending HR approval')
  }
  if (offer.createdBy === auth.userId) {
    throw new Error('You cannot approve an offer you created')
  }
  if (auth.role === 'HR_HEAD' || auth.role === 'SUPER_ADMIN') return
  if (auth.role === 'ADMIN') {
    if (!options.onBehalfOfHrHead) {
      throw new Error('Admin must select “on behalf of HR Head” to approve or reject')
    }
    return
  }
  throw new Error('Only HR Head can approve or reject at this step')
}

export function assertCanApproveOfferExec(
  auth: { userId: string; role: string },
  offer: { createdBy: string; status: string },
  options: OfferApprovalOptions = {}
): void {
  if (offer.status !== 'PENDING_EXEC_APPROVAL') {
    throw new Error('Offer is not pending executive approval')
  }
  if (offer.createdBy === auth.userId) {
    throw new Error('You cannot approve an offer you created')
  }
  if (auth.role === 'SUPER_ADMIN') return
  if (auth.role === 'ADMIN') {
    if (!options.onBehalfOfExec) {
      throw new Error('Admin must select “on behalf of executive approver” to approve or reject')
    }
    return
  }
  throw new Error('Only executive approvers can act at this step')
}

export function assertCanSendOffer(offer: { status: string }): void {
  if (offer.status !== 'APPROVED') {
    throw new Error('Only approved offers can be sent')
  }
}

export function assertCanRespondToOffer(offer: { status: string; validUntil?: Date | null }): void {
  if (offer.status !== 'SENT') {
    throw new Error('Offer is not available for response')
  }
  if (offer.validUntil && offer.validUntil < new Date()) {
    throw new Error('This offer has expired')
  }
}

export function assertCanEditOffer(
  auth: { userId: string; role: string },
  offer: { status: string }
): void {
  if (!canEditOfferDetails(auth.role, offer.status)) {
    throw new Error('You cannot edit this offer at its current stage')
  }
}

export function assertCanApproveOfferStage(
  auth: { userId: string; role: string },
  offer: {
    createdBy: string
    status: string
    approvalStep?: string | null
    approvalChainJson?: string | null
  }
): void {
  if (offer.status !== 'PENDING_APPROVAL') {
    throw new Error('Offer is not pending approval')
  }
  if (!usesApprovalChain(offer)) {
    throw new Error('This offer does not use a custom approval chain')
  }
  if (!canUserApproveCurrentStage(auth, offer)) {
    const stage = getCurrentStage(offer)
    throw new Error(
      stage
        ? `Only assigned approvers for ${stage.label} can act at this step`
        : 'You are not allowed to approve at this step'
    )
  }
}

export function assertCanRejectOfferStage(
  auth: { userId: string; role: string },
  offer: {
    createdBy: string
    status: string
    approvalStep?: string | null
    approvalChainJson?: string | null
  }
): void {
  if (offer.status === 'PENDING_APPROVAL' && usesApprovalChain(offer)) {
    assertCanApproveOfferStage(auth, offer)
    return
  }
  throw new Error('Use HR or executive rejection for this offer')
}
