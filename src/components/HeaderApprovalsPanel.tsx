import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import {
  canApproveOfferExec,
  canApproveOfferHr,
  canApproveRequirement,
  requiresExecDelegationForOffer,
  requiresHrHeadDelegationForApproval,
  requiresHrHeadDelegationForOffer,
} from '@/permissions'
import { RequirementApprovalModal } from '@/components/requirements/RequirementApprovalModal'
import { OfferApprovalModal } from '@/components/offers/OfferApprovalModal'
import type { Offer, Requirement } from '@/types'

const approvalsBtnClass =
  'm3-state-layer inline-flex items-center justify-center gap-2 rounded-full h-10 px-4 text-sm font-bold transition-[box-shadow,transform,background-color,border-color] border shrink-0'

type RequirementTarget = {
  kind: 'requirement'
  id: string
  title: string
}

type OfferTarget = {
  kind: 'offer'
  id: string
  candidateName: string
  step: 'HR' | 'EXEC'
  action: 'APPROVE' | 'REJECT'
}

type ApprovalTarget = RequirementTarget | OfferTarget

type ApprovalRow =
  | {
      key: string
      kind: 'requirement'
      id: string
      title: string
      subtitle: string
      href: string
      canApprove: boolean
      createdAt: string
    }
  | {
      key: string
      kind: 'offer'
      id: string
      title: string
      subtitle: string
      href: string
      canApprove: boolean
      step: 'HR' | 'EXEC'
      createdAt: string
    }

function canUseApprovalsPanel(role?: string | null): boolean {
  return (
    canApproveRequirement(role) || canApproveOfferHr(role) || canApproveOfferExec(role)
  )
}

function offerStepLabel(offer: Offer): string {
  if (offer.status === 'PENDING_EXEC_APPROVAL') return 'Executive approval'
  if (offer.status === 'PENDING_APPROVAL') return 'Approval chain'
  return 'HR approval'
}

function offerApproveStep(offer: Offer): 'HR' | 'EXEC' | null {
  if (offer.status === 'PENDING_EXEC_APPROVAL') return 'EXEC'
  if (offer.status === 'PENDING_HR_APPROVAL') return 'HR'
  return null
}

function canApproveOfferItem(
  offer: Offer,
  role: string | undefined,
  userId: string | undefined
): boolean {
  if (offer.createdBy === userId) return false
  const step = offerApproveStep(offer)
  if (step === 'HR') return canApproveOfferHr(role)
  if (step === 'EXEC') return canApproveOfferExec(role)
  return false
}

export function HeaderApprovalsPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<ApprovalTarget | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const role = user?.role
  const canReviewRequirements = canApproveRequirement(role)
  const canReviewOfferHr = canApproveOfferHr(role)
  const canReviewOfferExec = canApproveOfferExec(role)
  const showPanel = canUseApprovalsPanel(role)

  const { data: pendingRequirements = [], isLoading: loadingRequirements } = useQuery({
    queryKey: ['pendingRequirements'],
    queryFn: api.requirements.getPending,
    enabled: showPanel && canReviewRequirements,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: pendingOffersHr = [], isLoading: loadingOffersHr } = useQuery({
    queryKey: ['offers-pending', 'hr'],
    queryFn: () => api.offers.getPending(),
    enabled: showPanel && canReviewOfferHr,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: pendingOffersExec = [], isLoading: loadingOffersExec } = useQuery({
    queryKey: ['offers-pending', 'exec'],
    queryFn: () => api.offers.getPending('exec'),
    enabled: showPanel && canReviewOfferExec,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const pendingOffers = useMemo(() => {
    const byId = new Map<string, Offer>()
    for (const offer of [...pendingOffersHr, ...pendingOffersExec]) {
      byId.set(offer.id, offer)
    }
    return [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [pendingOffersHr, pendingOffersExec])

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates', 'header-approvals'],
    queryFn: api.candidates.list,
    enabled: showPanel && pendingOffers.length > 0,
    staleTime: 60_000,
  })

  const candidateNameById = useMemo(
    () => new Map(candidates.map((c) => [c.id, c.name])),
    [candidates]
  )

  const rows = useMemo<ApprovalRow[]>(() => {
    const items: ApprovalRow[] = []

    for (const req of pendingRequirements as Requirement[]) {
      items.push({
        key: `req-${req.id}`,
        kind: 'requirement',
        id: req.id,
        title: req.title,
        subtitle: `${req.department} · Requirement`,
        href: `/requirements/${req.id}`,
        canApprove: true,
        createdAt: req.createdAt,
      })
    }

    for (const offer of pendingOffers) {
      const candidateName = candidateNameById.get(offer.candidateId) ?? 'Candidate'
      const step = offerApproveStep(offer)
      items.push({
        key: `offer-${offer.id}`,
        kind: 'offer',
        id: offer.id,
        title: candidateName,
        subtitle: `${offerStepLabel(offer)} · Offer`,
        href: `/offers/${offer.id}`,
        canApprove: step ? canApproveOfferItem(offer, role, user?.uid) : false,
        step: step ?? 'HR',
        createdAt: offer.createdAt,
      })
    }

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [pendingRequirements, pendingOffers, candidateNameById, role, user?.uid])

  const pendingCount = rows.length
  const isLoading = loadingRequirements || loadingOffersHr || loadingOffersExec

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const node = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingRequirements'] })
    queryClient.invalidateQueries({ queryKey: ['offers-pending'] })
    queryClient.invalidateQueries({ queryKey: ['offers'] })
    queryClient.invalidateQueries({ queryKey: ['requirements'] })
  }

  const requirementMutation = useMutation({
    mutationFn: async (opts: {
      id: string
      action: 'APPROVE' | 'REJECT'
      onBehalfOfHrHead?: boolean
    }) => {
      if (opts.action === 'APPROVE') {
        return api.requirements.approve(opts.id, { onBehalfOfHrHead: opts.onBehalfOfHrHead })
      }
      return api.requirements.reject(opts.id, { onBehalfOfHrHead: opts.onBehalfOfHrHead })
    },
    onSuccess: (_data, vars) => {
      setTarget(null)
      invalidate()
      addToast(
        vars.action === 'APPROVE' ? 'Requirement approved' : 'Requirement rejected',
        'success'
      )
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Action failed', 'error')
    },
  })

  const offerMutation = useMutation({
    mutationFn: async (opts: {
      id: string
      action: 'APPROVE' | 'REJECT'
      step: 'HR' | 'EXEC'
      delegated: boolean
      reason?: string
    }) => {
      if (opts.action === 'REJECT') {
        return api.offers.reject(opts.id, {
          reason: opts.reason,
          onBehalfOfHrHead: opts.step === 'HR' ? opts.delegated : undefined,
          onBehalfOfExec: opts.step === 'EXEC' ? opts.delegated : undefined,
        })
      }
      if (opts.step === 'EXEC') {
        return api.offers.approveExec(opts.id, { onBehalfOfExec: opts.delegated })
      }
      return api.offers.approveHr(opts.id, { onBehalfOfHrHead: opts.delegated })
    },
    onSuccess: (_data, vars) => {
      setTarget(null)
      invalidate()
      addToast(vars.action === 'APPROVE' ? 'Offer approved' : 'Offer rejected', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Action failed', 'error')
    },
  })

  if (!showPanel) return null

  const openRequirementModal = (req: RequirementTarget) => {
    setTarget({ ...req, kind: 'requirement' })
    setOpen(false)
  }

  const openOfferModal = (row: Extract<ApprovalRow, { kind: 'offer' }>, action: 'APPROVE' | 'REJECT' = 'APPROVE') => {
    setTarget({
      kind: 'offer',
      id: row.id,
      candidateName: row.title,
      step: row.step,
      action,
    })
    setOpen(false)
  }

  const handleRequirementConfirm = (options: { onBehalfOfHrHead: boolean }) => {
    if (!target || target.kind !== 'requirement') return
    requirementMutation.mutate({
      id: target.id,
      action: 'APPROVE',
      onBehalfOfHrHead: options.onBehalfOfHrHead,
    })
  }

  const handleOfferConfirm = (options: { delegated: boolean; reason?: string }) => {
    if (!target || target.kind !== 'offer') return
    offerMutation.mutate({
      id: target.id,
      action: target.action,
      step: target.step,
      delegated: options.delegated,
      reason: options.reason,
    })
  }

  const requirementModalOpen = target?.kind === 'requirement'
  const offerModalOpen = target?.kind === 'offer'
  const requirementTitle =
    target?.kind === 'requirement'
      ? rows.find((r) => r.kind === 'requirement' && r.id === target.id)?.title ?? 'Requirement'
      : ''
  const offerCandidateName = target?.kind === 'offer' ? target.candidateName : ''

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            approvalsBtnClass,
            pendingCount > 0
              ? 'bg-amber-100 text-amber-950 border-amber-300/80 shadow-[var(--app-control-shadow-hover)] hover:bg-amber-200/90 dark:bg-amber-900/40 dark:text-amber-50 dark:border-amber-500/35 dark:hover:bg-amber-900/55'
              : 'bg-secondary-container text-on-secondary-container border-outline-variant/65 shadow-[var(--app-control-shadow)] hover:shadow-[var(--app-control-shadow-hover)]',
            open && 'ring-2 ring-primary/25'
          )}
          aria-label={
            pendingCount > 0
              ? `Approvals, ${pendingCount} pending`
              : 'Approvals'
          }
          aria-expanded={open}
          title="Pending approvals"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">gavel</span>
          <span>Approvals</span>
          {pendingCount > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white leading-none dark:bg-amber-500">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
          <span className="material-symbols-outlined text-[20px] leading-none text-current/70">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] app-modal rounded-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Approvals</p>
                <p className="text-xs text-muted-foreground">
                  {pendingCount === 0
                    ? 'Nothing waiting on you'
                    : `${pendingCount} pending item${pendingCount === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Close approvals"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading approvals…</p>
              ) : rows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No pending approvals.</p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {rows.map((row) => (
                    <li key={row.key} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'mt-0.5 size-9 rounded-xl flex items-center justify-center shrink-0',
                            row.kind === 'requirement'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          )}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {row.kind === 'requirement' ? 'work' : 'description'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{row.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{row.subtitle}</p>
                          <p className="text-[11px] text-muted-foreground/80 mt-1">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {row.canApprove && (
                              <button
                                type="button"
                                onClick={() =>
                                  row.kind === 'requirement'
                                    ? openRequirementModal({ kind: 'requirement', id: row.id, title: row.title })
                                    : openOfferModal(row)
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                navigate(row.href)
                                setOpen(false)
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-foreground hover:bg-muted/60 inline-flex items-center gap-1"
                            >
                              Open
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <RequirementApprovalModal
        open={requirementModalOpen}
        action="APPROVE"
        requirementTitle={requirementTitle}
        requiresHrHeadDelegation={requiresHrHeadDelegationForApproval(role)}
        isPending={requirementMutation.isPending}
        onClose={() => setTarget(null)}
        onConfirm={handleRequirementConfirm}
      />

      {offerModalOpen && target?.kind === 'offer' && (
        <OfferApprovalModal
          open
          action={target.action}
          step={target.step}
          candidateName={offerCandidateName}
          requiresDelegation={
            target.step === 'EXEC'
              ? requiresExecDelegationForOffer(role)
              : requiresHrHeadDelegationForOffer(role)
          }
          isPending={offerMutation.isPending}
          onClose={() => setTarget(null)}
          onConfirm={handleOfferConfirm}
        />
      )}
    </>
  )
}
