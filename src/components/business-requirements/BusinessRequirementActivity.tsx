import React, { useState } from 'react'
import { ChevronDown, Handshake } from 'lucide-react'
import clsx from 'clsx'
import type { ActivityLog, BusinessRequirementStageHistoryEntry } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  BUSINESS_REQUIREMENT_ACTION_LABELS,
  businessRequirementActivityHasDetails,
  getBusinessRequirementActivityMeta,
  getBusinessRequirementActivityPreview,
  getBusinessRequirementUpdateChanges,
  resolveBusinessRequirementActivityDescription,
} from '@/pages/business-requirements/_shared/businessRequirementActivity.utils'

type BusinessRequirementActivityProps = {
  activityLogs: ActivityLog[]
  activityLoading: boolean
  stageHistory?: BusinessRequirementStageHistoryEntry[]
}

const COLLAPSED_CARD_MIN_H = 'min-h-[5.75rem]'

function ActivityLogCard({
  log,
  stageHistory,
  expanded,
  onToggle,
}: {
  log: ActivityLog
  stageHistory?: BusinessRequirementStageHistoryEntry[]
  expanded: boolean
  onToggle: () => void
}) {
  const meta = getBusinessRequirementActivityMeta(log)
  const description = resolveBusinessRequirementActivityDescription(log, stageHistory)
  const fieldChanges = getBusinessRequirementUpdateChanges(log)
  const preview = getBusinessRequirementActivityPreview(log, stageHistory)
  const hasDetails = businessRequirementActivityHasDetails(log, stageHistory)
  const actionLabel =
    BUSINESS_REQUIREMENT_ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')
  const timestampLabel = `${new Date(log.timestamp).toLocaleString()}${
    log.performerName ? ` · ${log.performerName}` : ''
  }`

  return (
    <div
      className={clsx(
        'ml-4 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5',
        'transition-shadow duration-200',
        expanded ? 'shadow-sm' : COLLAPSED_CARD_MIN_H,
        hasDetails && 'hover:border-primary/25 dark:hover:border-white/25 hover:shadow-sm'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasDetails}
        aria-expanded={expanded}
        className={clsx(
          'w-full text-left p-4 flex gap-3',
          !expanded && COLLAPSED_CARD_MIN_H,
          hasDetails ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <div className="size-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center shrink-0">
          <Handshake size={16} className="text-primary dark:text-white" />
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-primary dark:text-white leading-snug">
              {actionLabel}
            </p>
            {hasDetails && (
              <ChevronDown
                size={18}
                className={clsx(
                  'shrink-0 text-primary/40 dark:text-white/40 transition-transform duration-200 mt-0.5',
                  expanded && 'rotate-180'
                )}
                aria-hidden
              />
            )}
          </div>

          {!expanded && (
            <p className="text-xs text-primary/60 dark:text-white/60 mt-1 line-clamp-2 flex-1">
              {preview}
            </p>
          )}

          {!expanded && (
            <p className="text-[11px] text-muted-foreground mt-2 truncate">{timestampLabel}</p>
          )}
        </div>
      </button>

      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 pl-[3.75rem] space-y-2 border-t border-primary/5 dark:border-white/5">
          {fieldChanges.length > 0 && (
            <ul className="space-y-1.5 pl-3 border-l-2 border-primary/20 dark:border-white/20">
              {fieldChanges.map((change) => (
                <li key={change.field} className="text-xs text-primary/80 dark:text-white/80">
                  <span className="font-semibold text-primary dark:text-white">{change.label}</span>
                  <span className="text-primary/50 dark:text-white/50"> · </span>
                  <span className="text-primary/55 dark:text-white/55 line-through decoration-primary/30">
                    {change.from}
                  </span>
                  <span className="text-primary/40 dark:text-white/40 mx-1">→</span>
                  <span className="break-words">{change.to}</span>
                </li>
              ))}
            </ul>
          )}

          {fieldChanges.length === 0 && meta && (
            <p className="text-xs text-primary/60 dark:text-white/60">{meta}</p>
          )}

          {description && (
            <div className="pl-3 border-l-2 border-primary/20 dark:border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary/45 dark:text-white/45">
                Note
              </p>
              <p className="text-sm text-primary/80 dark:text-white/80 mt-0.5 whitespace-pre-wrap break-words">
                {description}
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground pt-1">{timestampLabel}</p>
        </div>
      )}
    </div>
  )
}

export function BusinessRequirementActivity({
  activityLogs,
  activityLoading,
  stageHistory,
}: BusinessRequirementActivityProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-primary dark:text-white">Activity log</h2>
        <p className="text-sm text-primary/50 dark:text-white/50 mt-0.5">
          Stage changes, edits, and workflow events for this business requirement. Tap a card to
          expand.
        </p>
      </div>

      {activityLoading ? (
        <p className="text-sm text-primary/50 dark:text-white/50 py-8 text-center">
          Loading activity…
        </p>
      ) : activityLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/15 dark:border-white/15">
          <EmptyState
            icon="history"
            title="No activity yet"
            description="Updates to this requirement will appear here."
          />
        </div>
      ) : (
        <ul className="relative space-y-0 pl-4 border-l-2 border-primary/10 dark:border-white/10">
          {activityLogs.map((log) => (
            <li key={log.id} className="relative pb-4 last:pb-0">
              <span className="absolute -left-[21px] top-5 size-3 rounded-full bg-primary dark:bg-white ring-4 ring-white dark:ring-slate-900" />
              <ActivityLogCard
                log={log}
                stageHistory={stageHistory}
                expanded={expandedId === log.id}
                onToggle={() =>
                  setExpandedId((current) => (current === log.id ? null : log.id))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
