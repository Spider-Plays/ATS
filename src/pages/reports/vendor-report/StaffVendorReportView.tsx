import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Briefcase, Building2, ChevronDown, ChevronRight, Users } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import {
  candidateStatusClass,
} from '@/pages/candidates/_shared/candidate.utils'
import type { ChannelCandidateRow, ChannelReportMetrics } from '../_shared/candidateChannelReport.utils'
import type { StaffVendorGroupBucket, StaffVendorStatusBucket } from './staffVendorReport.utils'
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
              {candidate.jobTitle ? ` · ${candidate.jobTitle}` : ''}
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

function StatusSection({
  bucket,
  expandAll,
}: {
  bucket: StaffVendorStatusBucket
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
              label={bucket.label}
            />
            <span
              className={clsx(
                'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                candidateStatusClass(bucket.status)
              )}
            >
              {bucket.label}
            </span>
          </div>
        </td>
        <GroupMetrics metrics={bucket.metrics} />
      </tr>
      {isExpanded && <CandidateRows candidates={bucket.candidates} />}
    </>
  )
}

function VendorSection({
  bucket,
  expandAll,
}: {
  bucket: StaffVendorGroupBucket
  expandAll?: boolean
}) {
  const [expanded, setExpanded] = useState(expandAll ?? false)
  const isExpanded = expandAll || expanded

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
            <Building2 size={16} className="text-primary/40 dark:text-white/40 shrink-0" />
            <span className="font-semibold">{bucket.label}</span>
          </div>
        </td>
        <GroupMetrics metrics={bucket.metrics} />
      </tr>
      {isExpanded &&
        bucket.statuses.map((status) => (
          <StatusSection key={status.status} bucket={status} expandAll={expandAll} />
        ))}
    </>
  )
}

export type StaffVendorReportViewProps = {
  buckets: StaffVendorGroupBucket[]
  totals: {
    candidateCount: number
    jobCount: number
    activeCount: number
    groupCount: number
  }
  isLoading: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function StaffVendorReportView({
  buckets,
  totals,
  isLoading,
  searchTerm,
  onSearchChange,
}: StaffVendorReportViewProps) {
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
          label="Vendors"
          value={totals.groupCount}
          icon={BarChart3}
          accent="amber"
        />
      </div>
    ),
    [totals]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={BarChart3}
        eyebrow="Insights"
        title="Vendor report"
        description="Expand a vendor to see candidate stages. Review every profile submitted by staffing partners."
      />

      {statCards}

      <p className="text-sm text-primary/55 dark:text-white/55 -mt-4">
        Grouped by vendor partner, then pipeline status.{' '}
        <Link to="/vendors" className="font-bold text-primary hover:underline">
          Manage vendors
        </Link>
      </p>

      <div className="list-toolbar">
        <ListSearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by vendor, status, candidate, job, or email..."
          className="w-full min-w-0 max-w-none flex-1"
        />
      </div>

      {isLoading ? (
        <div className="hiring-report__loading">Loading report…</div>
      ) : totals.candidateCount === 0 && !searchActive ? (
        <EmptyState
          icon="bar_chart"
          title="No vendor submissions"
          description="Profiles submitted by vendors will appear here once they start applying."
        />
      ) : buckets.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matches"
          description="Try a different vendor name, status, candidate, or job."
        />
      ) : (
        <div className="hiring-report__table-wrap app-card rounded-2xl border overflow-hidden">
          <table className="hiring-report__table">
            <thead>
              <tr>
                <th>Vendor / status / candidate</th>
                <th>Profiles</th>
                <th>Jobs</th>
                <th>In pipeline</th>
                <th>Avg match</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <VendorSection
                  key={bucket.key}
                  bucket={bucket}
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
