import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Clock,
  Edit,
  ExternalLink,
  Handshake,
  Loader2,
  Rocket,
  XCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { BackButton } from '@/components/ui/BackButton'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/hooks/useConfirm'
import { useToastStore } from '@/store/toastStore'
import { AppSelect } from '@/components/ui/AppSelect'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { TabContent } from '@/components/motion/TabContent'
import { BusinessRequirementActivity } from '@/components/business-requirements/BusinessRequirementActivity'
import { BusinessRequirementStageModal } from '@/components/business-requirements/BusinessRequirementStageModal'
import { BUSINESS_STAGES, businessStageLabel } from '@/lib/businessStages'
import {
  formatExperienceRange,
  employmentTypeLabel,
  workModeLabel,
  seniorityLabel,
  formatDateLabel,
} from '@/lib/requirementFields'
import {
  businessRequirementStatusClass,
  businessRequirementStatusLabel,
} from '@/pages/business-requirements/_shared/businessRequirement.utils'
import {
  canMutateBusinessRequirement,
  isHrBusinessPreviewRole,
} from '@/permissions'
import type { BusinessStageKey } from '@/types'
import { ApiError } from '@/lib/apiClient'
import './detail.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity log' },
] as const

type TabId = (typeof TABS)[number]['id']

function PreviewField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="p-4 rounded-2xl bg-primary/[0.03] dark:bg-white/[0.03] border border-primary/5 dark:border-white/5">
      <dt className="text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold text-primary dark:text-white">{value}</dd>
    </div>
  )
}

const BusinessRequirementDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const confirm = useConfirm()
  const { addToast } = useToastStore()
  const [stageModalTarget, setStageModalTarget] = useState<BusinessStageKey | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const { data: req, isLoading } = useQuery({
    queryKey: ['businessRequirement', id],
    queryFn: () => api.businessRequirements.getById(id!),
    enabled: !!id,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const { data: activityLogs = [], isLoading: activityLoading } = useQuery({
    queryKey: ['businessRequirementActivity', id],
    queryFn: () => api.businessRequirements.getActivityLogs(id!),
    enabled: !!id,
  })

  const userNameById = useMemo(() => new Map(users.map((u) => [u.uid, u.name])), [users])

  const isHrPreview = isHrBusinessPreviewRole(user?.role)
  const canEdit = req ? canMutateBusinessRequirement(user?.role, req, user?.uid) : false
  const readOnly = isHrPreview && !canEdit
  const canCancel = canEdit && req?.status === 'ACTIVE'

  const stageMutation = useMutation({
    mutationFn: ({ stage, description }: { stage: BusinessStageKey; description: string }) =>
      api.businessRequirements.updateStage(id!, stage, description),
    onSuccess: (updated) => {
      queryClient.setQueryData(['businessRequirement', id], updated)
      queryClient.invalidateQueries({ queryKey: ['businessRequirements'] })
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirementActivity', id] })
      setStageModalTarget(null)
      addToast('Stage updated', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not update stage', 'error')
    },
  })

  const openMutation = useMutation({
    mutationFn: () => api.businessRequirements.openToHiring(id!),
    onSuccess: ({ requirement }) => {
      queryClient.invalidateQueries({ queryKey: ['businessRequirement', id] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirements'] })
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      addToast('Requirement opened to hiring — pending HR approval', 'success')
      navigate(`/requirements/${requirement.id}`)
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not open to hiring', 'error')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.businessRequirements.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessRequirement', id] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirements'] })
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirementActivity', id] })
      addToast('Business requirement cancelled', 'success')
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not cancel requirement', 'error')
    },
  })

  const handleStageSelect = (stage: string) => {
    const next = stage as BusinessStageKey
    if (!req || next === req.businessStage) return
    setStageModalTarget(next)
  }

  const handleStageConfirm = (description: string) => {
    if (!stageModalTarget) return
    stageMutation.mutate({ stage: stageModalTarget, description })
  }

  const handleOpenToHiring = async () => {
    const ok = await confirm({
      title: 'Open to hiring?',
      message:
        'This will create a new job requirement in pending approval status. The hiring team will see it after HR Head approval.',
      confirmLabel: 'Open to hiring',
    })
    if (ok) openMutation.mutate()
  }

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancel business requirement?',
      message: 'This will mark the deal as cancelled. You cannot undo this action.',
      confirmLabel: 'Cancel requirement',
      variant: 'danger',
    })
    if (ok) cancelMutation.mutate()
  }

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading business requirement…</div>
  }
  if (!req) {
    return <div className="p-12 text-center">Business requirement not found</div>
  }

  const stageOptions = BUSINESS_STAGES.map((s) => ({
    value: s.key,
    label: `${s.label} (${s.percentage}%)`,
  }))

  const canOpenToHiring =
    canEdit && req.status === 'ACTIVE' && req.businessStage === 'CONFIRMED'

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <BackButton
        fallback={readOnly ? '/notifications' : '/business-requirements'}
        to={readOnly ? '/notifications' : '/business-requirements'}
        label={readOnly ? 'Back to notifications' : 'Back to business requirements'}
        className="mb-6"
        variant="muted"
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
              <Handshake size={12} />
              Business requirement
            </span>
            <span
              className={clsx(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 border',
                businessRequirementStatusClass(req.status)
              )}
            >
              <Clock size={12} />
              {businessRequirementStatusLabel(req.status)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {businessStageLabel(req.businessStage)} · {req.stagePercentage}%
            </span>
          </div>

          <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight leading-tight">
            {req.title}
          </h1>

          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm flex flex-wrap items-center gap-2">
            {req.client && (
              <>
                <span>{req.client}</span>
                <span className="opacity-30">•</span>
              </>
            )}
            <span className="inline-flex items-center gap-1">
              <Building2 size={14} />
              {req.department}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 shrink-0">
          {canEdit && req.status === 'ACTIVE' && (
            <Link
              to={`/business-requirements/${req.id}/edit`}
              className="app-card-interactive inline-flex items-center gap-2 px-5 py-2.5 text-primary dark:text-foreground text-sm font-bold"
            >
              <Edit size={16} />
              Edit
            </Link>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Cancel
            </button>
          )}
          {canOpenToHiring && (
            <button
              type="button"
              onClick={handleOpenToHiring}
              disabled={openMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {openMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket size={18} />
              )}
              Open to hiring
            </button>
          )}
          {req.status === 'OPEN_TO_HIRING' && req.publishedRequirementId && (
            <Link
              to={`/requirements/${req.publishedRequirementId}`}
              className="app-card-interactive inline-flex items-center gap-2 px-5 py-2.5 text-primary dark:text-foreground text-sm font-bold"
            >
              View published requirement
              <ExternalLink size={16} />
            </Link>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 text-sm font-medium">
          <Clock size={18} className="shrink-0" />
          HR preview — this requirement is not yet in the hiring workflow.
        </div>
      )}

      <AnimatedTabNav
        layoutId="business-requirement-detail-tabs"
        variant="pill"
        className="mb-8"
        tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      <TabContent activeKey={activeTab}>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="mb-2">
              <div className="flex justify-between text-sm font-bold text-primary/70 dark:text-white/70 mb-2">
                <span>Deal progress</span>
                <span className="tabular-nums">{req.stagePercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    req.stagePercentage >= 100 ? 'bg-emerald-500' : 'bg-primary dark:bg-white/80'
                  )}
                  style={{ width: `${req.stagePercentage}%` }}
                />
              </div>
              <div className="mt-4 max-w-md">
                <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider">
                  Stage
                </label>
                {canEdit && req.status === 'ACTIVE' ? (
                  <AppSelect
                    value={req.businessStage}
                    onChange={handleStageSelect}
                    options={stageOptions}
                    disabled={stageMutation.isPending || !!stageModalTarget}
                  />
                ) : (
                  <p className="text-sm font-semibold text-primary dark:text-white mt-1">
                    {businessStageLabel(req.businessStage)} ({req.stagePercentage}%)
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="app-card p-6 space-y-4">
                <h2 className="text-lg font-bold text-primary dark:text-white">Role details</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <PreviewField
                    label="Experience"
                    value={formatExperienceRange(req.experienceMinYears, req.experienceMaxYears)}
                  />
                  <PreviewField
                    label="Seniority"
                    value={req.seniorityLevel ? seniorityLabel(req.seniorityLevel) : undefined}
                  />
                  <PreviewField
                    label="Employment"
                    value={req.employmentType ? employmentTypeLabel(req.employmentType) : undefined}
                  />
                  <PreviewField
                    label="Work mode"
                    value={req.workMode ? workModeLabel(req.workMode) : undefined}
                  />
                  <PreviewField label="Location" value={req.location} />
                  <PreviewField label="Openings" value={String(req.openings)} />
                  <PreviewField label="Salary band" value={req.salaryBand} />
                  <PreviewField
                    label="Target start"
                    value={req.targetStartDate ? formatDateLabel(req.targetStartDate) : undefined}
                  />
                  <PreviewField
                    label="Hiring deadline"
                    value={req.hiringDeadline ? formatDateLabel(req.hiringDeadline) : undefined}
                  />
                </dl>
              </section>

              <section className="app-card p-6 space-y-4">
                <h2 className="text-lg font-bold text-primary dark:text-white">Stakeholders</h2>
                <dl className="grid gap-3">
                  <PreviewField
                    label="Account manager"
                    value={userNameById.get(req.accountManager) ?? req.accountManager}
                  />
                  <PreviewField
                    label="Hiring manager"
                    value={userNameById.get(req.hiringManager) ?? req.hiringManager}
                  />
                  <PreviewField label="Primary skills" value={req.primarySkills?.join(', ')} />
                  <PreviewField label="Secondary skills" value={req.secondarySkills?.join(', ')} />
                </dl>
              </section>
            </div>

            <section className="app-card p-6">
              <h2 className="text-lg font-bold text-primary dark:text-white mb-4">Job description</h2>
              <div className="text-sm whitespace-pre-wrap text-primary/80 dark:text-white/80 leading-relaxed">
                {req.jobDescription || req.description || '—'}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'activity' && (
          <BusinessRequirementActivity
            activityLogs={activityLogs}
            activityLoading={activityLoading}
            stageHistory={req.stageHistory}
          />
        )}
      </TabContent>

      {req && stageModalTarget && (
        <BusinessRequirementStageModal
          open
          currentStage={req.businessStage}
          nextStage={stageModalTarget}
          isPending={stageMutation.isPending}
          onClose={() => setStageModalTarget(null)}
          onConfirm={handleStageConfirm}
        />
      )}
    </div>
  )
}

export default BusinessRequirementDetail
