import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Calendar } from 'lucide-react'
import clsx from 'clsx'
import type { Candidate } from '../../types'
import { recruiterDisplay } from '@/pages/candidates/_shared/candidate.utils'

interface PipelineKanbanCardProps {
  candidate: Candidate
  showJob?: boolean
}

function matchBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/30'
  if (score >= 50) return 'bg-primary/10 text-primary dark:text-white border-primary/15 dark:border-white/15'
  return 'bg-primary/5 text-primary/60 dark:text-white/50 border-primary/10 dark:border-white/10'
}

export function PipelineKanbanCard({ candidate, showJob }: PipelineKanbanCardProps) {
  const applied = new Date(candidate.appliedDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const jobLabel = candidate.jobTitle ?? candidate.role

  return (
    <Link
      to={`/candidates/${candidate.id}`}
      className="app-card-interactive flex flex-col gap-2 p-3.5 block min-h-[7.25rem]"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-9 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground overflow-hidden shadow-sm ring-1 ring-border/50 text-sm">
          {candidate.avatar ? (
            <img src={candidate.avatar} alt="" className="size-full object-cover" />
          ) : (
            candidate.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary dark:text-white line-clamp-1">{candidate.name}</p>
          <p className="text-[11px] font-medium text-primary/50 dark:text-white/50 truncate min-h-[1rem]">
            {recruiterDisplay(candidate)}
          </p>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-lg border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            matchBadgeClass(candidate.matchScore)
          )}
        >
          {candidate.matchScore}%
        </span>
      </div>

      {showJob ? (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary/70 dark:text-white/60 min-h-[1.125rem]">
          <Briefcase size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{jobLabel || '—'}</span>
        </div>
      ) : (
        <div className="min-h-[1.125rem]" aria-hidden />
      )}

      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-auto min-h-[1rem]">
        <Calendar size={11} />
        Applied {applied}
      </div>
    </Link>
  )
}
