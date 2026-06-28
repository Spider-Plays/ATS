import React from 'react'
import { Check, Download, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { OfferLetterFrame } from '@/components/offers/OfferLetterFrame'
import type { Offer } from '@/types'

type PortalOfferPreviewModalProps = {
  open: boolean
  onClose: () => void
  offer: Offer
  letterHtml?: string
  candidateName?: string
  onDownloadPdf?: () => void
}

export function PortalOfferPreviewModal({
  open,
  onClose,
  offer,
  letterHtml,
  candidateName,
  onDownloadPdf,
}: PortalOfferPreviewModalProps) {
  const canRespond = offer.status === 'SENT'

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="portal-offer-preview-title">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 w-[min(100vw-2rem,56rem)] max-h-[min(100vh-2rem,900px)] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Candidate portal preview</p>
            <h2 id="portal-offer-preview-title" className="text-lg font-black text-slate-900 dark:text-white">
              {candidateName || 'Candidate'} — offer letter
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              This is how the offer appears after it is sent to the candidate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 dark:bg-slate-950/40">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Offer status</p>
              <p className="text-xl font-black text-slate-900">{offer.status.replace(/_/g, ' ')}</p>
              {offer.validUntil && (
                <p className="text-sm text-slate-500 mt-1">
                  Respond by {new Date(offer.validUntil).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                >
                  <Download size={16} /> Download PDF
                </button>
              )}
              <button
                type="button"
                disabled
                title={canRespond ? 'Preview only' : 'Available after offer is sent'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-bold opacity-60 cursor-not-allowed"
              >
                <X size={16} /> Decline
              </button>
              <button
                type="button"
                disabled
                title={canRespond ? 'Preview only' : 'Available after offer is sent'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f3d38] text-white text-sm font-bold opacity-60 cursor-not-allowed"
              >
                <Check size={16} /> Accept offer
              </button>
            </div>
          </div>

          {letterHtml ? (
            <OfferLetterFrame html={letterHtml} title="Candidate offer letter preview" />
          ) : (
            <p className="text-sm text-slate-500 text-center py-12">
              Letter preview is not available yet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
