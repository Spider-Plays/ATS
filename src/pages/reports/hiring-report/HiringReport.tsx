import React, { useMemo, useState } from 'react'
import type { Requirement } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Briefcase, Building2, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/services/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import { canEditHiringStage, hiringStageClass, hiringStageLabel } from '@/lib/requirementHiring'
import { requirementStatusClass, requirementStatusLabel } from '@/pages/requirements/_shared/requirement.utils'
import {
  buildAccountReport,
  filterRequirementsForReport,
  openSlots,
  type AccountBucket,
  type MonthBucket,
  type QuarterBucket,
  type ReportMetrics,
} from './hiringReport.utils'
import './report.css'

const EMPTY = <span className="hiring-report__empty">—</span>

function StageSummary({ metrics }: { metrics: ReportMetrics }) {
  if (metrics.stages.length === 0) {
    return <span className="text-sm text-primary/45 dark:text-white/45">—</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {metrics.stages.map((stage) => (
        <span
          key={stage.stage}
          className={clsx(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
            hiringStageClass(stage.stage)
          )}
        >
          {stage.label}
          <span className="ml-1 opacity-60">×{stage.jobCount}</span>
        </span>
      ))}
    </div>
  )
}

function AccountMetrics({ metrics }: { metrics: ReportMetrics }) {
  return (
    <>
      <td className="hiring-report__cell hiring-report__cell--num">{metrics.jobCount}</td>
      <td className="hiring-report__cell hiring-report__cell--num">{metrics.totalPositions}</td>
      <td className="hiring-report__cell hiring-report__cell--num">{metrics.openPositions}</td>
      <td className="hiring-report__cell hiring-report__cell--stages">
        <StageSummary metrics={metrics} />
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

function requirementStageLabel(req: Requirement): string {
  if (canEditHiringStage(req.status)) {
    return hiringStageLabel(req.hiringStage)
  }
  return requirementStatusLabel(req.status)
}

function requirementStageClass(req: Requirement): string {
  if (canEditHiringStage(req.status)) {
    return hiringStageClass(req.hiringStage)
  }
  return requirementStatusClass(req.status)
}

function RequirementRows({ requirements }: { requirements: Requirement[] }) {
  const navigate = useNavigate()

  return (
    <>
      {requirements.map((req) => (
        <tr
          key={req.id}
          className="hiring-report__row hiring-report__row--requirement"
          onClick={() => navigate(`/requirements/${req.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate(`/requirements/${req.id}`)
            }
          }}
          tabIndex={0}
          role="link"
        >
          <td className="hiring-report__cell hiring-report__cell--label" colSpan={2}>
            <div className="hiring-report__req-title">{req.title}</div>
            <div className="hiring-report__req-meta">
              {req.department}
              {req.jobCode ? ` · ${req.jobCode}` : ''}
            </div>
          </td>
          <td className="hiring-report__cell hiring-report__cell--num">{req.openings}</td>
          <td className="hiring-report__cell hiring-report__cell--num">{openSlots(req)}</td>
          <td className="hiring-report__cell hiring-report__cell--stages">
            <span
              className={clsx(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                requirementStageClass(req)
              )}
            >
              {requirementStageLabel(req)}
            </span>
          </td>
        </tr>
      ))}
    </>
  )
}

function PeriodRow({
  label,
  indent,
  jobCount,
  expanded,
  onToggle,
  children,
}: {
  label: string
  indent: 'quarter' | 'month'
  jobCount: number
  expanded: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <>
      <tr
        className={clsx(
          'hiring-report__row',
          indent === 'quarter' ? 'hiring-report__row--quarter' : 'hiring-report__row--month'
        )}
      >
        <td className="hiring-report__cell hiring-report__cell--label">
          <div
            className={clsx(
              'hiring-report__label-wrap',
              indent === 'quarter' ? 'hiring-report__label-wrap--quarter' : 'hiring-report__label-wrap--month'
            )}
          >
            <ExpandButton expanded={expanded} onClick={onToggle} label={label} />
            <span>{label}</span>
          </div>
        </td>
        <td className="hiring-report__cell hiring-report__cell--num">{jobCount}</td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--num">{EMPTY}</td>
        <td className="hiring-report__cell hiring-report__cell--stages">{EMPTY}</td>
      </tr>
      {expanded && children}
    </>
  )
}

function MonthSection({
  month,
  expanded,
  onToggle,
  expandAll,
}: {
  month: MonthBucket
  expanded: boolean
  onToggle: () => void
  expandAll?: boolean
}) {
  const isExpanded = expandAll || expanded

  return (
    <PeriodRow
      label={month.label}
      indent="month"
      jobCount={month.metrics.jobCount}
      expanded={isExpanded}
      onToggle={onToggle}
    >
      <RequirementRows requirements={month.requirements} />
    </PeriodRow>
  )
}

function QuarterSection({
  quarter,
  expandedMonths,
  onToggleMonth,
  expandAll,
}: {
  quarter: QuarterBucket
  expandedMonths: Set<string>
  onToggleMonth: (monthKey: string) => void
  expandAll?: boolean
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false)
  const isExpanded = expandAll || expanded

  return (
    <PeriodRow
      label={quarter.label}
      indent="quarter"
      jobCount={quarter.metrics.jobCount}
      expanded={isExpanded}
      onToggle={() => setExpanded((v) => !v)}
    >
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
    </PeriodRow>
  )
}

function AccountSection({
  account,
  expandAll,
}: {
  account: AccountBucket
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
              label={account.client}
            />
            <Building2 size={16} className="text-primary/40 dark:text-white/40 shrink-0" />
            <span className="font-semibold">{account.client}</span>
          </div>
        </td>
        <AccountMetrics metrics={account.metrics} />
      </tr>
      {isExpanded &&
        account.quarters.map((quarter) => (
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

const HiringReport = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const searchActive = searchTerm.trim().length > 0

  const filteredRequirements = useMemo(
    () => filterRequirementsForReport(requirements, searchTerm),
    [requirements, searchTerm]
  )

  const accounts = useMemo(() => buildAccountReport(filteredRequirements), [filteredRequirements])

  const totals = useMemo(() => computeTotals(accounts), [accounts])

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={BarChart3}
        eyebrow="Insights"
        title="Hiring report"
        description="Expand an account to see quarters and months. Click a job row to open the requirement."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="Accounts"
          value={accounts.length}
          icon={Building2}
          accent="brand"
        />
        <InterviewStatCard
          label="Jobs"
          value={totals.jobCount}
          icon={Briefcase}
          accent="slate"
        />
        <InterviewStatCard
          label="Positions opened"
          value={totals.totalPositions}
          icon={BarChart3}
          accent="blue"
        />
        <InterviewStatCard
          label="Unfilled"
          value={totals.openPositions}
          icon={BarChart3}
          accent="amber"
        />
      </div>

      <p className="text-sm text-primary/55 dark:text-white/55 -mt-4">
        <strong className="font-semibold text-primary/70 dark:text-white/70">Jobs</strong> = number of
        roles. <strong className="font-semibold text-primary/70 dark:text-white/70">Positions opened</strong>{' '}
        = headcount requested. <strong className="font-semibold text-primary/70 dark:text-white/70">Unfilled</strong>{' '}
        = seats still open. Pipeline shows how many jobs are in each hiring stage (× count).
      </p>

      <div className="list-toolbar">
        <ListSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search account, job title, department, job code, or stage..."
          className="w-full min-w-0 max-w-none flex-1"
        />
      </div>

      {isLoading ? (
        <div className="hiring-report__loading">Loading report…</div>
      ) : requirements.length === 0 ? (
        <EmptyState
          icon="bar_chart"
          title="No positions to report"
          description="Roles linked to your accounts will appear here once requirements are created."
        />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matches"
          description="Try a different account name, job title, department, or hiring stage."
        />
      ) : (
        <div className="hiring-report__table-wrap app-card rounded-2xl border overflow-hidden">
          <table className="hiring-report__table">
            <thead>
              <tr>
                <th>Account / period / job</th>
                <th>Jobs</th>
                <th>Positions opened</th>
                <th>Unfilled</th>
                <th>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <AccountSection
                  key={account.client}
                  account={account}
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

function computeTotals(accounts: AccountBucket[]) {
  return accounts.reduce(
    (acc, row) => ({
      jobCount: acc.jobCount + row.metrics.jobCount,
      totalPositions: acc.totalPositions + row.metrics.totalPositions,
      openPositions: acc.openPositions + row.metrics.openPositions,
    }),
    { jobCount: 0, totalPositions: 0, openPositions: 0 }
  )
}

export default HiringReport
