import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, FileText, RotateCcw, Save } from 'lucide-react'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { useToastStore } from '@/store/toastStore'
import { useConfirm } from '@/hooks/useConfirm'
import type { OfferLetterOrgSettings, OfferLetterTemplate } from '@/types'

const PLACEHOLDER_HINT =
  'Placeholders: {{candidateName}}, {{candidateAddress}}, {{positionTitle}}, {{joiningDateFormatted}}, {{clientSiteAddress}}, {{reportingTime}}, {{ctcFormatted}}, {{ctcWords}}, {{compensationTable}}, {{acceptanceDeadlineDays}}, {{returnAddressBlock}}, {{returnAddressSuffix}}, {{letterDateFormatted}}, {{reviewPeriodMonths}}, {{annualLeaveDays}}, {{noticePeriodDays}}, {{timesheetAddressSuffix}}, {{timesheetAddressBlock}}'

const ORG_FIELDS: { key: keyof OfferLetterOrgSettings; label: string; type?: string }[] = [
  { key: 'legalEntityName', label: 'Legal entity name' },
  { key: 'returnAddress', label: 'Return address for signed copy' },
  { key: 'timesheetAddress', label: 'Timesheet submission address' },
  { key: 'reportingTime', label: 'Default reporting time' },
  { key: 'acceptanceDeadlineDays', label: 'Acceptance deadline (days)', type: 'number' },
  { key: 'annualLeaveDays', label: 'Annual leave days', type: 'number' },
  { key: 'noticePeriodDays', label: 'Notice period (days)', type: 'number' },
  { key: 'reviewPeriodMonths', label: 'Review period (months)', type: 'number' },
]

const OfferLetterTemplateEditor = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const [template, setTemplate] = useState<OfferLetterTemplate | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offer-letter-template'],
    queryFn: api.offerSettings.getLetterTemplate,
    retry: 1,
  })

  useEffect(() => {
    if (data) setTemplate(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => api.offerSettings.updateLetterTemplate(template!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-letter-template'] })
      addToast('Offer letter template saved', 'success')
    },
    onError: () => addToast('Failed to save template', 'error'),
  })

  const resetMutation = useMutation({
    mutationFn: api.offerSettings.resetLetterTemplate,
    onSuccess: (reset) => {
      setTemplate(reset)
      queryClient.invalidateQueries({ queryKey: ['offer-letter-template'] })
      addToast('Template reset to defaults', 'success')
    },
    onError: () => addToast('Failed to reset template', 'error'),
  })

  const previewMutation = useMutation({
    mutationFn: () => api.offerSettings.previewLetterTemplate(template ?? undefined),
    onSuccess: (html) => setPreviewHtml(html),
    onError: () => addToast('Failed to generate preview', 'error'),
  })

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset offer letter template?',
      message: 'This replaces all sections with the system default wording.',
      confirmLabel: 'Reset',
      variant: 'danger',
    })
    if (ok) resetMutation.mutate()
  }

  const updateOrg = (key: keyof OfferLetterOrgSettings, value: string | number) => {
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            orgSettings: { ...prev.orgSettings, [key]: value },
          }
        : prev
    )
  }

  const updateClausePage = (index: number, value: string) => {
    setTemplate((prev) => {
      if (!prev) return prev
      const clausePages = [...prev.clausePages]
      clausePages[index] = value
      return { ...prev, clausePages }
    })
  }

  const tabs = [
    'Organization',
    'Cover letter',
    'Agreement intro',
    ...((template?.clausePages ?? []).map((_, i) => `Clause page ${i + 1}`)),
    'Declaration',
  ]

  if (isLoading) {
    return <p className="text-sm text-primary/60 p-8">Loading offer letter template…</p>
  }

  if (isError || !template) {
    const errorMessage =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Could not load offer letter template'

    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">{errorMessage}</p>
        <p className="text-sm text-primary/60">
          The API may need a restart after the latest deploy. If this persists, ensure the database
          migration for offer settings has been applied.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
            <FileText size={24} /> Offer Letter Template
          </h1>
          <p className="text-sm font-medium text-primary/60 dark:text-white/60 mt-1">
            Edit every section of the offer letter and employment agreement used for all new offers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/10 text-sm font-bold"
          >
            <Eye size={16} /> {previewMutation.isPending ? 'Generating…' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/10 text-sm font-bold"
          >
            <RotateCcw size={16} /> Reset defaults
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            <Save size={16} /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <p className="text-xs text-primary/50 bg-primary/5 dark:bg-white/5 rounded-xl p-4">{PLACEHOLDER_HINT}</p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === index
                ? 'bg-primary text-primary-foreground'
                : 'bg-white dark:bg-white/5 border border-primary/10 text-primary/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
        {activeTab === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ORG_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                  {field.label}
                </label>
                {field.key === 'returnAddress' || field.key === 'timesheetAddress' ? (
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    value={template.orgSettings[field.key]}
                    onChange={(e) => updateOrg(field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    className="w-full px-3 py-2 rounded-xl border"
                    value={template.orgSettings[field.key]}
                    onChange={(e) =>
                      updateOrg(
                        field.key,
                        field.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 1 && (
          <textarea
            rows={18}
            className="w-full px-3 py-2 rounded-xl border font-mono text-sm"
            value={template.coverPageHtml}
            onChange={(e) => setTemplate({ ...template, coverPageHtml: e.target.value })}
          />
        )}

        {activeTab === 2 && (
          <textarea
            rows={12}
            className="w-full px-3 py-2 rounded-xl border font-mono text-sm"
            value={template.agreementIntroHtml}
            onChange={(e) => setTemplate({ ...template, agreementIntroHtml: e.target.value })}
          />
        )}

        {activeTab >= 3 && activeTab < tabs.length - 1 && (
          <textarea
            rows={20}
            className="w-full px-3 py-2 rounded-xl border font-mono text-sm"
            value={template.clausePages[activeTab - 3] ?? ''}
            onChange={(e) => updateClausePage(activeTab - 3, e.target.value)}
          />
        )}

        {activeTab === tabs.length - 1 && (
          <textarea
            rows={10}
            className="w-full px-3 py-2 rounded-xl border font-mono text-sm"
            value={template.declarationPageHtml}
            onChange={(e) => setTemplate({ ...template, declarationPageHtml: e.target.value })}
          />
        )}
      </section>

      {previewHtml && (
        <section className="bg-white dark:bg-white/5 rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
            <h2 className="font-bold text-primary dark:text-white">Letter preview</h2>
            <button
              type="button"
              onClick={() => setPreviewHtml(null)}
              className="text-sm font-bold text-primary/60 hover:text-primary"
            >
              Close
            </button>
          </div>
          <iframe
            title="Offer letter preview"
            srcDoc={previewHtml}
            className="w-full min-h-[720px] border-0 bg-slate-200"
          />
        </section>
      )}
    </div>
  )
}

export default OfferLetterTemplateEditor
