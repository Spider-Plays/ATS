import React, { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from '@/components/ui/Modal'
import { businessStageLabel } from '@/lib/businessStages'
import type { BusinessStageKey } from '@/types'

type BusinessRequirementStageModalProps = {
  open: boolean
  currentStage: BusinessStageKey
  nextStage: BusinessStageKey
  isPending?: boolean
  onClose: () => void
  onConfirm: (description: string) => void
}

export function BusinessRequirementStageModal({
  open,
  currentStage,
  nextStage,
  isPending = false,
  onClose,
  onConfirm,
}: BusinessRequirementStageModalProps) {
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) setDescription('')
  }, [open, nextStage])

  const trimmed = description.trim()
  const canSubmit = trimmed.length > 0 && !isPending

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="business-stage-change-title">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-primary/10 dark:border-white/10">
          <h2
            id="business-stage-change-title"
            className="text-lg font-black text-primary dark:text-white"
          >
            Update deal stage
          </h2>
          <p className="text-sm text-primary/60 dark:text-white/60 mt-1">
            Add a short note about this stage change before confirming.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary dark:text-white">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-white/10">
              {businessStageLabel(currentStage)}
            </span>
            <ArrowRight size={16} className="text-primary/40 dark:text-white/40 shrink-0" />
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              {businessStageLabel(nextStage)}
            </span>
          </div>

          <div>
            <label
              htmlFor="business-stage-description"
              className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="business-stage-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Client signed off on scope; moving to proposal review…"
              className="mt-1.5 w-full rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2.5 text-sm text-primary dark:text-white placeholder:text-primary/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/20 resize-y min-h-[96px]"
            />
            <p className="text-[11px] text-primary/45 dark:text-white/45 mt-1 text-right tabular-nums">
              {description.length}/2000
            </p>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-2 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm(trimmed)}
            className={clsx(
              'px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50',
              'bg-primary hover:bg-primary/90 dark:bg-white dark:text-primary dark:hover:bg-white/90'
            )}
          >
            {isPending ? 'Updating…' : 'Confirm stage change'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
