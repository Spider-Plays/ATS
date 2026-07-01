import React from 'react'
import { Briefcase } from 'lucide-react'
import type { ActivityLog } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  REQUIREMENT_ACTION_LABELS,
  formatRequirementActivityDetail,
} from '@/pages/requirements/_shared/requirementActivity.utils'

type RequirementActivityProps = {
  activityLogs: ActivityLog[]
  activityLoading: boolean
}

export function RequirementActivity({
  activityLogs,
  activityLoading,
}: RequirementActivityProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-primary dark:text-white">Activity log</h2>
        <p className="text-sm text-primary/50 dark:text-white/50 mt-0.5">
          Approvals, edits, recruiter assignments, hiring stage changes, and portal updates.
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
          {activityLogs.map((log) => {
            const detail = formatRequirementActivityDetail(log)
            return (
              <li key={log.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[21px] top-1 size-3 rounded-full bg-primary dark:bg-white ring-4 ring-white dark:ring-slate-900" />
                <div className="ml-4 p-4 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/5">
                  <div className="flex gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Briefcase size={16} className="text-primary dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-primary dark:text-white">
                        {REQUIREMENT_ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')}
                      </p>
                      {detail && (
                        <p className="text-xs text-primary/60 dark:text-white/60 mt-0.5">{detail}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.performerName ? ` · ${log.performerName}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
