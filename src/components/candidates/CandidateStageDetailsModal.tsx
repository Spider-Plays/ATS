import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { CandidateStatus } from '../../types'
import { Modal } from '../ui/Modal'
import {
  monthFromIsoDate,
  quarterFromDate,
  parseIsoDate,
  validateHiredMilestone,
  validateOfferMilestone,
  type HiredMilestoneInput,
  type OfferMilestoneInput,
} from '../../lib/candidateMilestones'
import { candidateStatusLabel } from '@/pages/candidates/_shared/candidate.utils'
import { MonthYearSelect } from '../ui/MonthYearSelect'
import { AppDatePicker } from '../ui/AppDatePicker'
import { AppSelect } from '../ui/AppSelect'
import { quarterSelectOptions } from '../../lib/selectOptions'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'

const labelClass =
  'block text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-1.5'

type CandidateStageDetailsModalProps = {
  open: boolean
  targetStatus: 'OFFER' | 'HIRED'
  candidateName: string
  initialExpectedCTC?: string
  onClose: () => void
  onConfirm: (milestone: OfferMilestoneInput | HiredMilestoneInput) => void
  isSubmitting?: boolean
}

const emptyOffer = (expectedCTC = ''): OfferMilestoneInput => ({
  expectedCTC,
  offerMonth: '',
  offerQuarter: '',
  expectedJoiningDate: '',
})

const emptyHired = (): HiredMilestoneInput => ({
  joiningDate: '',
  joiningMonth: '',
  joiningQuarter: '',
})

export function CandidateStageDetailsModal({
  open,
  targetStatus,
  candidateName,
  initialExpectedCTC,
  onClose,
  onConfirm,
  isSubmitting,
}: CandidateStageDetailsModalProps) {
  const [offer, setOffer] = useState<OfferMilestoneInput>(emptyOffer())
  const [hired, setHired] = useState<HiredMilestoneInput>(emptyHired)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setOffer(emptyOffer(initialExpectedCTC?.trim() ?? ''))
    setHired(emptyHired())
    setError(null)
  }, [open, targetStatus, initialExpectedCTC])

  const syncHiredFromDate = (isoDate: string) => {
    const d = parseIsoDate(isoDate)
    if (!d) return
    setHired((prev) => ({
      ...prev,
      joiningDate: isoDate,
      joiningMonth: monthFromIsoDate(isoDate),
      joiningQuarter: quarterFromDate(d),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetStatus === 'OFFER') {
      const err = validateOfferMilestone(offer)
      if (err) {
        setError(err)
        return
      }
      onConfirm({ ...offer, expectedCTC: offer.expectedCTC.trim() })
    } else {
      const err = validateHiredMilestone(hired)
      if (err) {
        setError(err)
        return
      }
      onConfirm(hired)
    }
  }

  const title =
    targetStatus === 'OFFER'
      ? `Mark as ${candidateStatusLabel('OFFER')}`
      : `Mark as ${candidateStatusLabel('HIRED')}`

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg" aria-labelledby="stage-details-title">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-primary/10 dark:border-white/10">
          <div>
            <h2
              id="stage-details-title"
              className="text-lg font-bold text-primary dark:text-white"
            >
              {title}
            </h2>
            <p className="text-sm text-primary/50 dark:text-white/50 mt-0.5">
              {candidateName} — required before updating pipeline status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-primary/40 hover:bg-primary/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[min(70vh,520px)] overflow-y-auto">
          {targetStatus === 'OFFER' ? (
            <>
              <div>
                <label className={labelClass}>Expected CTC</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="e.g. 24 LPA"
                  value={offer.expectedCTC}
                  onChange={(e) =>
                    setOffer((prev) => ({ ...prev, expectedCTC: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Month of offer</label>
                <MonthYearSelect
                  value={offer.offerMonth}
                  onChange={(offerMonth) => setOffer((prev) => ({ ...prev, offerMonth }))}
                  monthAriaLabel="Month of offer"
                  yearAriaLabel="Year of offer"
                />
              </div>
              <div>
                <label className={labelClass}>Quarter of offer</label>
                <AppSelect
                  value={offer.offerQuarter}
                  onChange={(offerQuarter) => setOffer((prev) => ({ ...prev, offerQuarter }))}
                  options={quarterSelectOptions()}
                  placeholder="Select quarter"
                  aria-label="Quarter of offer"
                />
              </div>
              <div>
                <label className={labelClass}>Expected joining date</label>
                <AppDatePicker
                  value={offer.expectedJoiningDate}
                  onChange={(expectedJoiningDate) =>
                    setOffer((prev) => ({ ...prev, expectedJoiningDate }))
                  }
                  placeholder="Select date"
                  aria-label="Expected joining date"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Date of joining</label>
                <AppDatePicker
                  value={hired.joiningDate}
                  onChange={syncHiredFromDate}
                  placeholder="Select date"
                  aria-label="Date of joining"
                />
              </div>
              <div>
                <label className={labelClass}>Month of joining</label>
                <MonthYearSelect
                  value={hired.joiningMonth}
                  onChange={(joiningMonth) => setHired((prev) => ({ ...prev, joiningMonth }))}
                  monthAriaLabel="Month of joining"
                  yearAriaLabel="Year of joining"
                />
              </div>
              <div>
                <label className={labelClass}>Quarter of joining</label>
                <AppSelect
                  value={hired.joiningQuarter}
                  onChange={(joiningQuarter) => setHired((prev) => ({ ...prev, joiningQuarter }))}
                  options={quarterSelectOptions()}
                  placeholder="Select quarter"
                  aria-label="Quarter of joining"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs font-bold text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Confirm & update status'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function requiresStageDetailsModal(status: CandidateStatus): status is 'OFFER' | 'HIRED' {
  return status === 'OFFER' || status === 'HIRED'
}
