import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Undo2,
  FileText,
  Check,
  RotateCw,
  Lock,
  IndianRupee,
  Send,
  Download,
  History,
  Clock,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/hooks/useConfirm'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import {
  canApproveOfferExec,
  canApproveOfferHr,
  canDeleteOffer,
  canEditOfferDetails,
  canRollbackOfferApproval,
  canViewOfferCompensation,
  requiresExecDelegationForOffer,
  requiresHrHeadDelegationForOffer,
} from '@/permissions'
import { OfferApprovalModal } from '@/components/offers/OfferApprovalModal'
import { OfferDetailsEditPanel } from '@/components/offers/OfferDetailsEditPanel'
import { CompensationBreakdownTable } from '@/components/offers/CompensationBreakdownTable'
import { OfferLetterFrame } from '@/components/offers/OfferLetterFrame'
import { PortalOfferPreviewModal } from '@/components/offers/PortalOfferPreviewModal'
import { BackButton } from '@/components/ui/BackButton'
import { getOfferApprovalRollbackTarget } from '@/pages/offers/detail/offerApprovalRollback'
import {
  canUserApproveCurrentStage,
  getCurrentStage,
  usesApprovalChain,
} from '@/lib/offerApprovalChain'
import type { OfferStatus } from '@/types'
import clsx from 'clsx'
import './detail.css'

const STEPS: OfferStatus[] = [
  'DRAFT',
  'PENDING_HR_APPROVAL',
  'PENDING_EXEC_APPROVAL',
  'APPROVED',
  'SENT',
  'ACCEPTED',
]

function stepIndex(status: OfferStatus): number {
  if (status === 'NEGOTIATION') return STEPS.indexOf('SENT')
  if (status === 'DECLINED' || status === 'WITHDRAWN') return STEPS.indexOf('SENT')
  const idx = STEPS.indexOf(status)
  return idx >= 0 ? idx : 0
}

const OfferDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const { addToast } = useToastStore()
  const [approvalModal, setApprovalModal] = useState<{
    action: 'APPROVE' | 'REJECT'
    step: 'HR' | 'EXEC' | 'CHAIN'
    stageLabel?: string
  } | null>(null)
  const [portalPreviewOpen, setPortalPreviewOpen] = useState(false)

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => api.offers.get(id!),
  })

  const { data: candidate } = useQuery({
    queryKey: ['candidate', offer?.candidateId],
    queryFn: () => api.candidates.get(offer!.candidateId),
    enabled: !!offer?.candidateId,
  })

  const { data: letterHtml, isError: letterError, isLoading: letterLoading } = useQuery({
    queryKey: ['offer-letter', id],
    queryFn: () => api.offers.getLetterHtml(id!),
    enabled: !!id && !!offer,
  })

  const isRestricted = !canViewOfferCompensation(user?.role)
  const ctc = offer?.annualCtc ?? offer?.baseSalary ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['offer', id] })
    queryClient.invalidateQueries({ queryKey: ['offer-letter', id] })
    queryClient.invalidateQueries({ queryKey: ['offers'] })
    queryClient.invalidateQueries({ queryKey: ['offers-pending'] })
  }

  const actionMutation = useMutation({
    mutationFn: async (action: string) => {
      switch (action) {
        case 'submit':
          return api.offers.submit(id!)
        case 'send':
          return api.offers.send(id!)
        case 'negotiate':
          return api.offers.negotiate(id!)
        case 'revise':
          return api.offers.revise(id!)
        case 'accept':
          return api.offers.accept(id!)
        case 'decline':
          return api.offers.decline(id!)
        case 'withdraw':
          return api.offers.withdraw(id!)
        default:
          throw new Error('Unknown action')
      }
    },
    onSuccess: () => {
      invalidate()
      addToast('Offer updated', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Action failed', 'error')
    },
  })

  const approvalMutation = useMutation({
    mutationFn: async (opts: {
      action: 'APPROVE' | 'REJECT'
      step: 'HR' | 'EXEC' | 'CHAIN'
      delegated: boolean
      reason?: string
      comment?: string
    }) => {
      if (opts.action === 'REJECT') {
        return api.offers.reject(id!, {
          reason: opts.reason,
          onBehalfOfHrHead: opts.step === 'HR' ? opts.delegated : undefined,
          onBehalfOfExec: opts.step === 'EXEC' ? opts.delegated : undefined,
        })
      }
      if (opts.step === 'CHAIN') {
        return api.offers.approveStage(id!, { comment: opts.comment })
      }
      if (opts.step === 'EXEC') {
        return api.offers.approveExec(id!, {
          onBehalfOfExec: opts.delegated,
          comment: opts.comment,
        })
      }
      return api.offers.approveHr(id!, {
        onBehalfOfHrHead: opts.delegated,
        comment: opts.comment,
      })
    },
    onSuccess: () => {
      setApprovalModal(null)
      invalidate()
      addToast('Approval recorded', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Approval failed', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.offers.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      addToast('Offer deleted', 'success')
      navigate('/offers')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Failed to delete offer', 'error')
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: () => api.offers.rollbackApproval(id!),
    onSuccess: () => {
      invalidate()
      addToast('Offer approval rolled back', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Rollback failed', 'error')
    },
  })

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete offer',
      message: `Permanently delete this offer for ${candidate?.name || 'this candidate'}?`,
      confirmLabel: 'Delete offer',
      variant: 'danger',
    })
    if (ok) deleteMutation.mutate()
  }

  const downloadLetter = async () => {
    if (!id) return
    try {
      const blob = await api.offers.downloadLetterPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `offer-${candidate?.name?.replace(/\s+/g, '_') || id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to download PDF', 'error')
    }
  }

  if (isLoading) return <div className="p-8 text-center">Loading offer details...</div>
  if (!offer) return <div className="p-8 text-center">Offer not found.</div>

  const rollbackTarget = getOfferApprovalRollbackTarget(offer)

  const handleRollback = async () => {
    if (!rollbackTarget) return
    const ok = await confirm({
      title: 'Rollback approval',
      message: `${rollbackTarget.label}? The offer will return to the previous approval stage.`,
      confirmLabel: rollbackTarget.label,
      variant: 'danger',
    })
    if (ok) rollbackMutation.mutate()
  }

  const status = offer.status
  const currentStep = stepIndex(status)
  const chainOffer = usesApprovalChain(offer)
  const currentChainStage = getCurrentStage(offer)
  const showChainApprove =
    status === 'PENDING_APPROVAL' && canUserApproveCurrentStage(user?.uid, offer)
  const showHrApprove = status === 'PENDING_HR_APPROVAL' && canApproveOfferHr(user?.role)
  const showExecApprove = status === 'PENDING_EXEC_APPROVAL' && canApproveOfferExec(user?.role)
  const canEdit = canEditOfferDetails(user?.role, status)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <BackButton
        fallback="/offers"
        to="/offers"
        label="Back to offers"
        variant="muted"
      />
      {offer.rejectionReason && status === 'DRAFT' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <strong>Rejected:</strong> {offer.rejectionReason}
        </div>
      )}

      {isRestricted && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
          <Lock size={20} />
          <p className="text-sm font-bold">Compensation data is masked for your role.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-muted-foreground text-xs font-medium">OFFER-{offer.id.slice(0, 8)}</span>
          <h1 className="text-page-title">{candidate?.name || 'Candidate'}</h1>
          <p className="text-page-desc">{offer.letterMeta?.positionTitle || candidate?.role} · {candidate?.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {status === 'DRAFT' && (
            <button
              onClick={() => actionMutation.mutate('submit')}
              disabled={actionMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
            >
              <Send size={18} /> Submit for approval
            </button>
          )}
          {showChainApprove && currentChainStage && (
            <>
              <button
                onClick={() =>
                  setApprovalModal({
                    action: 'REJECT',
                    step: 'CHAIN',
                    stageLabel: currentChainStage.label,
                  })
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm"
              >
                <X size={18} /> Reject
              </button>
              <button
                onClick={() =>
                  setApprovalModal({
                    action: 'APPROVE',
                    step: 'CHAIN',
                    stageLabel: currentChainStage.label,
                  })
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm"
              >
                <Check size={18} /> Approve {currentChainStage.label}
              </button>
            </>
          )}
          {showHrApprove && (
            <>
              <button
                onClick={() => setApprovalModal({ action: 'REJECT', step: 'HR' })}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm"
              >
                <X size={18} /> Reject
              </button>
              <button
                onClick={() => setApprovalModal({ action: 'APPROVE', step: 'HR' })}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm"
              >
                <Check size={18} /> HR Approve
              </button>
            </>
          )}
          {showExecApprove && (
            <>
              <button
                onClick={() => setApprovalModal({ action: 'REJECT', step: 'EXEC' })}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm"
              >
                <X size={18} /> Reject
              </button>
              <button
                onClick={() => setApprovalModal({ action: 'APPROVE', step: 'EXEC' })}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm"
              >
                <Check size={18} /> Executive Approve
              </button>
            </>
          )}
          {(status === 'PENDING_HR_APPROVAL' ||
            status === 'PENDING_EXEC_APPROVAL' ||
            status === 'PENDING_APPROVAL') &&
            !showHrApprove &&
            !showExecApprove &&
            !showChainApprove && (
              <span className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs uppercase">
                <Clock size={16} /> Pending approval
              </span>
            )}
          {status === 'APPROVED' && (
            <button
              onClick={() => actionMutation.mutate('send')}
              disabled={actionMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
            >
              <Send size={18} /> Send offer
            </button>
          )}
          {status === 'SENT' && !isRestricted && (
            <>
              <button
                onClick={() => actionMutation.mutate('accept')}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-xl font-bold text-xs uppercase"
              >
                <Check size={16} /> Mark accepted
              </button>
              <button
                onClick={() => actionMutation.mutate('negotiate')}
                className="flex items-center gap-2 px-6 py-2.5 app-card rounded-xl font-bold text-sm"
              >
                <RotateCw size={18} /> Negotiate
              </button>
            </>
          )}
          {status === 'NEGOTIATION' && (
            <button
              onClick={() => actionMutation.mutate('revise')}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
            >
              Revise offer
            </button>
          )}
          {canRollbackOfferApproval(user?.role) && rollbackTarget && (
            <button
              type="button"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm font-bold"
            >
              <Undo2 size={18} /> {rollbackTarget.label}
            </button>
          )}
          {canDeleteOffer(user?.role) && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold"
            >
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="app-card rounded-xl p-8 shadow-sm overflow-x-auto">
        <div className="relative flex justify-between min-w-[600px]">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-primary/10" />
          {STEPS.map((step, idx) => (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className={clsx(
                  'size-10 rounded-full flex items-center justify-center border-4 border-white font-bold text-xs',
                  idx <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-muted-foreground'
                )}
              >
                {idx + 1}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px]">
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {chainOffer && offer.approvalChain && (
        <div className="app-card rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary/60">Approval stages</h3>
          <div className="flex flex-wrap gap-3">
            {offer.approvalChain.map((stage, idx) => {
              const isCurrent =
                status === 'PENDING_APPROVAL' && stage.id === offer.approvalStep
              const isPast =
                status === 'PENDING_APPROVAL'
                  ? idx < offer.approvalChain!.findIndex((s) => s.id === offer.approvalStep)
                  : ['APPROVED', 'SENT', 'ACCEPTED'].includes(status)
              return (
                <div
                  key={stage.id}
                  className={clsx(
                    'px-4 py-2 rounded-xl border text-sm font-bold',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    isPast && 'border-green-200 bg-green-50 text-green-800',
                    !isCurrent && !isPast && 'border-primary/10 text-primary/50'
                  )}
                >
                  {stage.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <OfferDetailsEditPanel offer={offer} canEdit={canEdit} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <IndianRupee size={20} /> Compensation (Annual CTC)
            </h3>
            {isRestricted ? (
              <p className="text-muted-foreground flex items-center gap-2">
                <Lock size={14} /> Restricted
              </p>
            ) : (
              <>
                <p className="text-3xl font-black mb-4">Rs. {ctc.toLocaleString('en-IN')}/-</p>
                {offer.compensation && <CompensationBreakdownTable breakdown={offer.compensation} />}
              </>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} /> Offer letter
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPortalPreviewOpen(true)}
                  disabled={!letterHtml}
                  className="flex items-center gap-2 px-4 py-2 app-card rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                >
                  <ExternalLink size={16} /> View portal
                </button>
                <button
                  type="button"
                  onClick={downloadLetter}
                  className="flex items-center gap-2 px-4 py-2 app-card rounded-xl font-bold text-xs uppercase"
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
            {letterLoading ? (
              <p className="text-muted-foreground text-sm">Loading letter preview…</p>
            ) : letterError ? (
              <p className="text-red-600 text-sm">Could not load letter preview. Try refreshing the page.</p>
            ) : letterHtml ? (
              <OfferLetterFrame html={letterHtml} title="Offer letter preview" />
            ) : (
              <p className="text-muted-foreground text-sm">Letter preview loads after offer is saved.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-4">
          <section className="app-card rounded-xl overflow-hidden shadow-sm flex flex-col max-h-[600px]">
            <div className="p-4 border-b bg-primary/5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <History size={18} /> History
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(offer.history || []).map((item) => (
                <div key={item.id} className="relative pl-6 border-l-2 border-primary/10 pb-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    {new Date(item.date).toLocaleString()}
                  </p>
                  <p className="text-sm font-bold">{item.action}</p>
                  <p className="text-xs text-primary/60">{item.description}</p>
                </div>
              ))}
              {(offer.approvalHistory || []).map((item, i) => (
                <div key={`ap-${i}`} className="relative pl-6 border-l-2 border-green-200 pb-1">
                  <p className="text-[10px] text-muted-foreground">{new Date(item.at).toLocaleString()}</p>
                  <p className="text-sm font-bold">{item.action} ({item.step})</p>
                  {item.comment && (
                    <p className="text-xs text-primary/60 mt-0.5">Comment: {item.comment}</p>
                  )}
                  {item.reason && (
                    <p className="text-xs text-primary/60 mt-0.5">Reason: {item.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {approvalModal && (
        <OfferApprovalModal
          open
          action={approvalModal.action}
          step={approvalModal.step}
          stageLabel={approvalModal.stageLabel}
          candidateName={candidate?.name || 'Candidate'}
          requiresDelegation={
            approvalModal.step === 'CHAIN'
              ? false
              : approvalModal.step === 'HR'
                ? requiresHrHeadDelegationForOffer(user?.role)
                : requiresExecDelegationForOffer(user?.role)
          }
          isPending={approvalMutation.isPending}
          onClose={() => setApprovalModal(null)}
          onConfirm={(opts) => approvalMutation.mutate({ ...approvalModal, ...opts })}
        />
      )}

      <PortalOfferPreviewModal
        open={portalPreviewOpen}
        onClose={() => setPortalPreviewOpen(false)}
        offer={offer}
        letterHtml={letterHtml}
        candidateName={candidate?.name}
        onDownloadPdf={downloadLetter}
      />
    </div>
  )
}

export default OfferDetail
