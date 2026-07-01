import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, Handshake } from 'lucide-react'
import clsx from 'clsx'
import type { BusinessRequirement } from '@/types'
import { businessStageLabel } from '@/lib/businessStages'
import {
  businessRequirementStatusClass,
  businessRequirementStatusLabel,
} from '@/pages/business-requirements/_shared/businessRequirement.utils'
import { priorityMeta } from '@/pages/requirements/_shared/requirement.utils'
import { formatRequirementLocation, seniorityLabel } from '@/lib/requirementFields'

interface BusinessRequirementListItemProps {
  requirement: BusinessRequirement
  accountManagerName?: string
  hiringManagerName?: string
  variant?: 'default' | 'highlight'
}

export function BusinessRequirementListItem({
  requirement,
  accountManagerName,
  hiringManagerName,
  variant = 'default',
}: BusinessRequirementListItemProps) {
  const navigate = useNavigate()
  const priority = priorityMeta(requirement.priority)
  const posted = new Date(requirement.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/business-requirements/${requirement.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/business-requirements/${requirement.id}`)
        }
      }}
      className={clsx(
        'group rounded-2xl border p-4 md:p-5 transition-all cursor-pointer',
        'app-card-interactive',
        variant === 'highlight' &&
          'border-amber-300/60 dark:border-amber-500/40 ring-1 ring-amber-200/50 dark:ring-amber-500/20'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div
            className={clsx(
              'shrink-0 p-3 rounded-xl',
              requirement.status === 'OPEN_TO_HIRING'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : requirement.status === 'CANCELLED'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-primary/10 dark:bg-white/10 text-primary dark:text-white'
            )}
          >
            <Handshake size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-primary dark:text-white truncate group-hover:underline decoration-primary/30">
                {requirement.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-primary/55 dark:text-white/55">
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                {requirement.department}
              </span>
              {requirement.client && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{requirement.client}</span>
                </>
              )}
              {requirement.seniorityLevel && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{seniorityLabel(requirement.seniorityLevel)}</span>
                </>
              )}
              <span className="opacity-30">·</span>
              <span>{formatRequirementLocation(requirement)}</span>
              <span className="opacity-30">·</span>
              <span>Created {posted}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:gap-4 shrink-0">
          <span
            className={clsx(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
              businessRequirementStatusClass(requirement.status)
            )}
          >
            {businessRequirementStatusLabel(requirement.status)}
          </span>

          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 border-violet-200/80 dark:border-violet-500/30">
            {businessStageLabel(requirement.businessStage)}
          </span>

          <span className={clsx('text-xs font-bold', priority.className)}>{priority.label}</span>

          <div className="w-28 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] font-bold text-primary/60 dark:text-white/50 tabular-nums">
              <span>Deal progress</span>
              <span>{requirement.stagePercentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  requirement.stagePercentage >= 100
                    ? 'bg-emerald-500'
                    : 'bg-primary dark:bg-white/80'
                )}
                style={{ width: `${requirement.stagePercentage}%` }}
              />
            </div>
          </div>

          <div className="min-w-[120px] text-xs font-medium text-primary/70 dark:text-white/70">
            {accountManagerName && (
              <p className="truncate" title={accountManagerName}>
                AM: {accountManagerName}
              </p>
            )}
            {hiringManagerName && (
              <p className="truncate text-muted-foreground" title={hiringManagerName}>
                HM: {hiringManagerName}
              </p>
            )}
          </div>
        </div>

        <ChevronRight
          size={18}
          className="text-primary/30 dark:text-white/30 group-hover:text-primary dark:group-hover:text-white transition-colors hidden sm:block shrink-0"
        />
      </div>
    </article>
  )
}
