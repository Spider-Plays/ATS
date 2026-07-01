import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Save, X } from 'lucide-react'
import { api } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { CompensationBreakdownTable } from '@/components/offers/CompensationBreakdownTable'
import { OfferApprovalChainEditor } from '@/components/offers/OfferApprovalChainEditor'
import {
  createDefaultApprovalChain,
  OFFER_APPROVER_ELIGIBLE_ROLES,
  validateApprovalChain,
} from '@/lib/offerApprovalChain'
import type { Offer, OfferApprovalChain, OfferLetterMeta } from '@/types'

type OfferDetailsEditPanelProps = {
  offer: Offer
  canEdit: boolean
}

export function OfferDetailsEditPanel({ offer, canEdit }: OfferDetailsEditPanelProps) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [editing, setEditing] = useState(false)
  const [annualCtc, setAnnualCtc] = useState(offer.annualCtc ?? offer.baseSalary ?? 0)
  const [letterMeta, setLetterMeta] = useState<OfferLetterMeta>(offer.letterMeta ?? {})
  const [approvalChain, setApprovalChain] = useState<OfferApprovalChain>(() =>
    offer.approvalChain?.length
      ? { stages: offer.approvalChain.map((s) => ({ ...s })) }
      : createDefaultApprovalChain()
  )

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const { data: breakdown } = useQuery({
    queryKey: ['offer-comp-preview', annualCtc],
    queryFn: () => api.offers.previewCompensation(annualCtc),
    enabled: editing && annualCtc >= 10000,
  })

  const approverOptions = useMemo(
    () =>
      users
        .filter((u) =>
          OFFER_APPROVER_ELIGIBLE_ROLES.includes(
            u.role as (typeof OFFER_APPROVER_ELIGIBLE_ROLES)[number]
          )
        )
        .map((u) => ({
          value: u.uid,
          label: u.name,
          sublabel: [u.role.replace(/_/g, ' '), u.email].join(' · '),
        })),
    [users]
  )

  useEffect(() => {
    if (!editing) {
      setAnnualCtc(offer.annualCtc ?? offer.baseSalary ?? 0)
      setLetterMeta(offer.letterMeta ?? {})
      setApprovalChain(
        offer.approvalChain?.length
          ? { stages: offer.approvalChain.map((s) => ({ ...s })) }
          : createDefaultApprovalChain()
      )
    }
  }, [offer, editing])

  const saveMutation = useMutation({
    mutationFn: () => {
      const chainError = validateApprovalChain(approvalChain)
      if (chainError) throw new Error(chainError)
      return api.offers.update(offer.id, {
        annualCtc,
        letterMeta,
        approvalChain,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] })
      queryClient.invalidateQueries({ queryKey: ['offer-letter', offer.id] })
      addToast('Offer details updated', 'success')
      setEditing(false)
    },
    onError: (err: unknown) => {
      addToast(
        err instanceof ApiError || err instanceof Error ? err.message : 'Save failed',
        'error'
      )
    },
  })

  const updateMeta = (key: keyof OfferLetterMeta, value: string) => {
    setLetterMeta((prev) => ({ ...prev, [key]: value }))
  }

  if (!canEdit) return null

  return (
    <section className="app-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Offer details</h3>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold"
          >
            <Pencil size={16} /> Edit details
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
            >
              <Save size={16} /> {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
              Annual CTC (INR)
            </label>
            <input
              type="number"
              value={annualCtc}
              onChange={(e) => setAnnualCtc(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-primary/10 font-bold"
            />
          </div>
          {breakdown && <CompensationBreakdownTable breakdown={breakdown} />}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                Candidate location
              </label>
              <textarea
                rows={3}
                value={letterMeta.candidateAddress ?? ''}
                onChange={(e) => updateMeta('candidateAddress', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                  Position title
                </label>
                <input
                  value={letterMeta.positionTitle ?? ''}
                  onChange={(e) => updateMeta('positionTitle', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                  Joining date
                </label>
                <AppDatePicker
                  value={letterMeta.joiningDate ?? ''}
                  onChange={(v) => updateMeta('joiningDate', v)}
                  className="mt-1"
                  aria-label="Joining date"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                  Client company
                </label>
                <input
                  value={letterMeta.clientCompanyName ?? ''}
                  onChange={(e) => updateMeta('clientCompanyName', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                  Reporting time
                </label>
                <input
                  value={letterMeta.reportingTime ?? ''}
                  onChange={(e) => updateMeta('reportingTime', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                Requirement location
              </label>
              <textarea
                rows={3}
                value={letterMeta.clientSiteAddress ?? ''}
                onChange={(e) => updateMeta('clientSiteAddress', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border text-sm"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">Approval chain</h4>
            <OfferApprovalChainEditor
              value={approvalChain}
              onChange={setApprovalChain}
              approverOptions={approverOptions}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          {offer.approvalChain?.length ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary/50">Approvers</p>
              {offer.approvalChain.map((stage) => (
                <div key={stage.id} className="flex flex-wrap gap-2 items-center">
                  <span className="font-bold">{stage.label}:</span>
                  <span className="text-primary/70">
                    {stage.approverIds.length
                      ? stage.approverIds
                          .map((id) => users.find((u) => u.uid === id)?.name ?? id)
                          .join(', ')
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-primary/60">No custom approval chain configured.</p>
          )}
        </div>
      )}
    </section>
  )
}
