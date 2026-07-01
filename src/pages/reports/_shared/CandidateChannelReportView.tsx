import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Briefcase, ChevronDown, ChevronRight, Users } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import type { LucideIcon } from 'lucide-react'
import type {
  ChannelGroupBucket,
  ChannelJobBucket,
  ChannelMonthBucket,
  ChannelQuarterBucket,
  ChannelReportMetrics,
  ChannelCandidateRow,
} from './candidateChannelReport.utils'
import '../hiring-report/report.css'

const EMPTY = <span className="hiring-report__empty">—</span>

function GroupMetrics({ metrics }: { metrics: ChannelReportMetrics }) {
  return (
    <>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.candidateCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.jobCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.activeCount}
      </td>
      <td className="hiring-report__cell hiring-report__cell--num">
        {metrics.avgMatchScore > 0 ? `${metrics.avgMatchScore}%` : EMPTY}
      </td>
    </>
  )
}

function ExpandButton({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="hiring-report__expand"
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
    </button>
  )
}

function CandidateRows({ candidates }: { candidates: ChannelCandidateRow[] }) {
  return (
    <>
      {candidates.map((candidate) => (
        <tr key={candidate.id} className="hiring-report__row hiring-report__row--requirement">
          <td className="hiring-report__cell hiring-report__cell--label">
            <div className="hiring-report__req-title pl-8">{candidate.name}</div>
            <div className="hiring-report__req-meta pl-8">
              {candidate.email}
              {candidate.jobCode ? ` · ${candidate.jobCode}` : ''}
            </div>
          </td>
          <td className="hiring-report__cell hiring-report__cell--num">1</td>
          <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
          <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
          <td className="hiring-report__cell hiring-report__cell--num">
            {candidate.matchScore > 0 ? `${candidate.matchScore}%` : EMPTY}
          </td>
        </tr>
      ))}
    </>
  )
}

function JobSection({
  job,
  expandAll,
}: {
  job: ChannelJobBucket
  expandAll?: boolean
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false)
  const isExpanded = expandAll || expanded

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--month">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--month">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={job.jobTitle}
            />
            <span>{job.jobTitle}</span>
          </div>
        </td>
        <td className="hiring-report__cell hiring-report__cell--num">
          {job.metrics.candidateCount}
        </td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--num">
          {job.metrics.avgMatchScore > 0 ? `${job.metrics.avgMatchScore}%` : EMPTY}
        </td>
      </tr>
      {isExpanded && <CandidateRows candidates={job.candidates} />}
    </>
  )
}

function MonthSection({
  month,
  expanded,
  onToggle,
  expandAll,
}: {
  month: ChannelMonthBucket
  expanded: boolean
  onToggle: () => void
  expandAll?: boolean
}) {
  const isExpanded = expandAll || expanded

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--month">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--month">
            <ExpandButton expanded={isExpanded} onClick={onToggle} label={month.label} />
            <span>{month.label}</span>
          </div>
        </td>
        <GroupMetrics metrics={month.metrics} />
      </tr>
      {isExpanded &&
        month.jobs.map((job) => (
          <JobSection key={job.key} job={job} expandAll={expandAll} />
        ))}
    </>
  )
}

function QuarterSection({
  quarter,
  expandedMonths,
  onToggleMonth,
  expandAll,
}: {
  quarter: ChannelQuarterBucket
  expandedMonths: Set<string>
  onToggleMonth: (monthKey: string) => void
  expandAll?: boolean
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false)
  const isExpanded = expandAll || expanded

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--quarter">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap hiring-report__label-wrap--quarter">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={quarter.label}
            />
            <span>{quarter.label}</span>
          </div>
        </td>
        <GroupMetrics metrics={quarter.metrics} />
      </tr>
      {isExpanded &&
        quarter.months.map((month) => (
          <MonthSection
            key={month.key}
            month={month}
            expanded={expandedMonths.has(`${quarter.key}:${month.key}`)}
            onToggle={() => onToggleMonth(`${quarter.key}:${month.key}`)}
            expandAll={expandAll}
          />
        ))}
    </>
  )
}

function GroupSection({
  bucket,
  groupIcon: GroupIcon,
  expandAll,
}: {
  bucket: ChannelGroupBucket
  groupIcon: LucideIcon
  expandAll?: boolean
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set())
  const isExpanded = expandAll || expanded

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <>
      <tr className="hiring-report__row hiring-report__row--account">
        <td className="hiring-report__cell hiring-report__cell--label">
          <div className="hiring-report__label-wrap">
            <ExpandButton
              expanded={isExpanded}
              onClick={() => setExpanded((v) => !v)}
              label={bucket.label}
            />
            <GroupIcon size={16} className="text-primary/40 dark:text-white/40 shrink-0" />
            <span className="font-semibold">{bucket.label}</span>
            {bucket.subtitle ? (
              <span className="text-xs text-primary/45 dark:text-white/45 font-normal">
                · {bucket.subtitle}
              </span>
            ) : null}
          </div>
        </td>
        <GroupMetrics metrics={bucket.metrics} />
      </tr>
      {isExpanded &&
        bucket.quarters.map((quarter) => (
          <QuarterSection
            key={quarter.key}
            quarter={quarter}
            expandedMonths={expandedMonths}
            onToggleMonth={toggleMonth}
            expandAll={expandAll}
          />
        ))}
    </>
  )
}

export type CandidateChannelReportViewProps = {
  icon: LucideIcon
  title: string
  description: string
  groupColumnLabel: string
  groupIcon: LucideIcon
  groupLabel: string
  buckets: ChannelGroupBucket[]
  totals: {
    candidateCount: number
    jobCount: number
    activeCount: number
    groupCount: number
  }
  isLoading: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  noMatchTitle?: string
  noMatchDescription?: string
  footerLink?: { to: string; label: string }
  helpText?: string
}

export function CandidateChannelReportView({
  icon,
  title,
  description,
  groupColumnLabel,
  groupIcon,
  groupLabel,
  buckets,
  totals,
  isLoading,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  noMatchTitle = 'No matches',
  noMatchDescription = 'Try a different search term.',
  footerLink,
  helpText,
}: CandidateChannelReportViewProps) {
  const searchActive = searchTerm.trim().length > 0

  const statCards = useMemo(
    () => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="Profiles"
          value={totals.candidateCount}
          icon={Users}
          accent="brand"
        />
        <InterviewStatCard
          label="Jobs"
          value={totals.jobCount}
          icon={Briefcase}
          accent="slate"
        />
        <InterviewStatCard
          label="In pipeline"
          value={totals.activeCount}
          icon={BarChart3}
          accent="blue"
        />
        <InterviewStatCard
          label={groupLabel}
          value={totals.groupCount}
          icon={BarChart3}
          accent="amber"
        />
      </div>
    ),
    [groupLabel, totals]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={icon}
        eyebrow="Insights"
        title={title}
        description={description}
      />

      {statCards}

      {(helpText || footerLink) && (
        <p className="text-sm text-primary/55 dark:text-white/55 -mt-4">
          {helpText}
          {helpText && footerLink ? ' ' : null}
          {footerLink ? (
            <Link to={footerLink.to} className="font-bold text-primary hover:underline">
              {footerLink.label}
            </Link>
          ) : null}
        </p>
      )}

      <div className="list-toolbar">
        <ListSearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full min-w-0 max-w-none flex-1"
        />
      </div>

      {isLoading ? (
        <div className="hiring-report__loading">Loading report…</div>
      ) : totals.candidateCount === 0 && !searchActive ? (
        <EmptyState icon="bar_chart" title={emptyTitle} description={emptyDescription} />
      ) : buckets.length === 0 ? (
        <EmptyState icon="search" title={noMatchTitle} description={noMatchDescription} />
      ) : (
        <div className="hiring-report__table-wrap app-card rounded-2xl border overflow-hidden">
          <table className="hiring-report__table">
            <thead>
              <tr>
                <th>{groupColumnLabel}</th>
                <th>Profiles</th>
                <th>Jobs</th>
                <th>In pipeline</th>
                <th>Avg match</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <GroupSection
                  key={bucket.key}
                  bucket={bucket}
                  groupIcon={groupIcon}
                  expandAll={searchActive}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
