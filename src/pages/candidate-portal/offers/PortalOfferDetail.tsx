import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, Download } from 'lucide-react'
import { portalService } from '@/services/http/portal'
import { useConfirm } from '@/hooks/useConfirm'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { OfferLetterFrame } from '@/components/offers/OfferLetterFrame'

const PortalOfferDetail = () => {
  const { id } = useParams<{ id: string }>()
  const confirm = useConfirm()
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['portal-offer', id],
    queryFn: () => portalService.getOffer(id!),
    enabled: !!id,
  })

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'decline') =>
      action === 'accept' ? portalService.acceptOffer(id!) : portalService.declineOffer(id!),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['portal-offer', id] })
      queryClient.invalidateQueries({ queryKey: ['portal-me'] })
      addToast(action === 'accept' ? 'Offer accepted' : 'Offer declined', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not update offer', 'error')
    },
  })

  const handleAccept = async () => {
    const ok = await confirm({
      title: 'Accept offer',
      message: 'Confirm that you accept this offer and employment agreement.',
      confirmLabel: 'Accept offer',
    })
    if (ok) respondMutation.mutate('accept')
  }

  const handleDecline = async () => {
    const ok = await confirm({
      title: 'Decline offer',
      message: 'Are you sure you want to decline this offer?',
      confirmLabel: 'Decline',
      variant: 'danger',
    })
    if (ok) respondMutation.mutate('decline')
  }

  const downloadLetter = async () => {
    if (!id) return
    setBusy(true)
    try {
      const blob = await portalService.downloadOfferLetterPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'offer-letter.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to download PDF', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-slate-600">Loading offer…</div>
  if (!data) return <div className="p-8 text-center">Offer not found.</div>

  const { offer, letterHtml } = data
  const canRespond = offer.status === 'SENT'

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Link to="/portal/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#0f3d38]">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <button
            type="button"
            onClick={downloadLetter}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold"
          >
            <Download size={16} /> Download PDF
          </button>
          {canRespond && (
            <>
              <button
                type="button"
                onClick={handleDecline}
                disabled={respondMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-bold"
              >
                <X size={16} /> Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={respondMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f3d38] text-white text-sm font-bold"
              >
                <Check size={16} /> Accept offer
              </button>
            </>
          )}
        </div>
      </div>

      {letterHtml ? (
        <OfferLetterFrame html={letterHtml} title="Your offer letter" className="border-slate-200" />
      ) : (
        <p className="text-sm text-slate-500 text-center py-12 border border-dashed border-slate-200 rounded-2xl">
          Offer letter is not available yet.
        </p>
      )}
    </div>
  )
}

export default PortalOfferDetail
