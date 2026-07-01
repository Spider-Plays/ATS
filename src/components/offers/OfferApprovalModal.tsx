import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import clsx from 'clsx'

type OfferApprovalModalProps = {
  open: boolean
  action: 'APPROVE' | 'REJECT'
  step: 'HR' | 'EXEC' | 'CHAIN'
  candidateName: string
  stageLabel?: string
  requiresDelegation: boolean
  isPending?: boolean
  onClose: () => void
  onConfirm: (options: { delegated: boolean; reason?: string; comment?: string }) => void
}

export function OfferApprovalModal({
  open,
  action,
  step,
  candidateName,
  stageLabel,
  requiresDelegation,
  isPending = false,
  onClose,
  onConfirm,
}: OfferApprovalModalProps) {
  const [delegated, setDelegated] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setDelegated(false)
      setReason('')
      setComment('')
    }
  }, [open, action])

  const isApprove = action === 'APPROVE'
  const hasComment = comment.trim().length > 0
  const canSubmit = isApprove
    ? hasComment && (!requiresDelegation || delegated)
    : !requiresDelegation || delegated
  const delegateLabel =
    step === 'HR' ? 'On behalf of HR Head' : 'On behalf of executive approver'
  const stepName = step === 'CHAIN' ? stageLabel ?? 'Approval' : step === 'HR' ? 'HR' : 'Executive'

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="offer-approval-title">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-primary/10 dark:border-white/10">
          <h2 id="offer-approval-title" className="text-lg font-black text-primary dark:text-white">
            {isApprove ? 'Approve offer' : 'Reject offer'}
          </h2>
          <p className="text-sm text-primary/60 dark:text-white/60 mt-1">{candidateName}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isApprove ? (
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider block mb-2">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-primary/15 text-sm"
                placeholder="Add your approval comment..."
                required
              />
              {!hasComment && (
                <p className="text-xs text-primary/50 mt-1">A comment is required to approve.</p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider block mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-primary/15 text-sm"
                placeholder="Why is this offer being rejected?"
              />
            </div>
          )}

          {requiresDelegation ? (
            <label
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                delegated
                  ? 'border-primary dark:border-white/30 bg-primary/5 dark:bg-white/10'
                  : 'border-primary/15 dark:border-white/15'
              )}
            >
              <input
                type="checkbox"
                checked={delegated}
                onChange={(e) => setDelegated(e.target.checked)}
                className="mt-1 size-4 rounded"
              />
              <span className="text-sm text-primary dark:text-white">
                <span className="font-bold block">{delegateLabel}</span>
                <span className="text-page-desc">
                  I confirm this {isApprove ? 'approval' : 'rejection'} is recorded as delegated.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-sm text-primary/70 dark:text-white/70">
              {isApprove
                ? step === 'CHAIN'
                  ? `This will advance ${stepName} approval for ${candidateName}.`
                  : `This will ${step === 'EXEC' ? 'fully approve' : 'advance'} the offer for ${candidateName}.`
                : 'This will return the offer to draft for revision.'}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-primary/10 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-xl">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || isPending}
            onClick={() =>
              onConfirm({
                delegated,
                reason: reason || undefined,
                comment: comment.trim() || undefined,
              })
            }
            className={clsx(
              'px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50',
              isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isPending ? 'Saving…' : isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
