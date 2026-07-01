import { format, getQuarter, getYear } from 'date-fns'
import type { Candidate } from '@/types'
import { isTerminalStatus } from '@/pages/candidates/_shared/candidate.utils'
import { matchesAnySearch } from '@/lib/textSearch'

export type ChannelReportMetrics = {
  candidateCount: number
  jobCount: number
  activeCount: number
  avgMatchScore: number
}

export type ChannelCandidateRow = {
  id: string
  name: string
  email: string
  status: Candidate['status']
  jobTitle?: string | null
  jobCode?: string | null
  requirementId?: string | null
  matchScore: number
  createdAt: string
}

export type ChannelJobBucket = {
  key: string
  jobTitle: string
  jobCode?: string
  requirementId?: string
  metrics: ChannelReportMetrics
  candidates: ChannelCandidateRow[]
}

export type ChannelMonthBucket = {
  key: string
  label: string
  metrics: ChannelReportMetrics
  jobs: ChannelJobBucket[]
}

export type ChannelQuarterBucket = {
  key: string
  label: string
  metrics: ChannelReportMetrics
  months: ChannelMonthBucket[]
}

export type ChannelGroupBucket = {
  key: string
  label: string
  subtitle?: string
  metrics: ChannelReportMetrics
  quarters: ChannelQuarterBucket[]
}

export type ChannelGroupResolver = (candidate: Candidate) => {
  key: string
  label: string
  subtitle?: string
}

function toRow(candidate: Candidate): ChannelCandidateRow {
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    status: candidate.status,
    jobTitle: candidate.jobTitle ?? candidate.role,
    jobCode: candidate.reqId,
    requirementId: candidate.requirementId,
    matchScore: candidate.matchScore ?? 0,
    createdAt: candidate.createdAt ?? candidate.appliedDate,
  }
}

export function computeChannelReportMetrics(
  candidates: ChannelCandidateRow[]
): ChannelReportMetrics {
  const jobIds = new Set(
    candidates.map((c) => c.requirementId).filter(Boolean) as string[]
  )
  const activeCount = candidates.filter((c) => !isTerminalStatus(c.status)).length
  const matchTotal = candidates.reduce((sum, c) => sum + c.matchScore, 0)

  return {
    candidateCount: candidates.length,
    jobCount: jobIds.size,
    activeCount,
    avgMatchScore:
      candidates.length > 0 ? Math.round(matchTotal / candidates.length) : 0,
  }
}

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

function quarterKey(date: Date): string {
  return `${getYear(date)}-Q${getQuarter(date)}`
}

function quarterLabel(key: string): string {
  const [yearPart, quarterPart] = key.split('-Q')
  return `Q${quarterPart} ${yearPart}`
}

function sortByKeyDesc<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.key.localeCompare(a.key))
}

function buildJobBuckets(candidates: ChannelCandidateRow[]): ChannelJobBucket[] {
  const byJob = new Map<string, ChannelCandidateRow[]>()

  for (const candidate of candidates) {
    const key = candidate.requirementId ?? candidate.jobTitle ?? 'unknown'
    const list = byJob.get(key) ?? []
    list.push(candidate)
    byJob.set(key, list)
  }

  return [...byJob.entries()]
    .map(([key, rows]) => {
      const first = rows[0]
      return {
        key,
        jobTitle: first.jobTitle ?? 'Unassigned job',
        jobCode: first.jobCode ?? undefined,
        requirementId: first.requirementId ?? undefined,
        metrics: computeChannelReportMetrics(rows),
        candidates: [...rows].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }
    })
    .sort((a, b) => a.jobTitle.localeCompare(b.jobTitle))
}

function buildMonthBuckets(candidates: ChannelCandidateRow[]): ChannelMonthBucket[] {
  const byMonth = new Map<string, ChannelCandidateRow[]>()
  for (const candidate of candidates) {
    const key = monthKey(new Date(candidate.createdAt))
    const list = byMonth.get(key) ?? []
    list.push(candidate)
    byMonth.set(key, list)
  }

  return sortByKeyDesc(
    [...byMonth.entries()].map(([key, rows]) => ({
      key,
      label: monthLabel(key),
      metrics: computeChannelReportMetrics(rows),
      jobs: buildJobBuckets(rows),
    }))
  )
}

function buildQuarterBuckets(
  candidates: ChannelCandidateRow[]
): ChannelQuarterBucket[] {
  const byQuarter = new Map<string, ChannelCandidateRow[]>()
  for (const candidate of candidates) {
    const key = quarterKey(new Date(candidate.createdAt))
    const list = byQuarter.get(key) ?? []
    list.push(candidate)
    byQuarter.set(key, list)
  }

  return sortByKeyDesc(
    [...byQuarter.entries()].map(([key, rows]) => ({
      key,
      label: quarterLabel(key),
      metrics: computeChannelReportMetrics(rows),
      months: buildMonthBuckets(rows),
    }))
  )
}

export function buildChannelGroupReport(
  candidates: Candidate[],
  getGroup: ChannelGroupResolver
): ChannelGroupBucket[] {
  const rows = candidates.map(toRow)
  const byGroup = new Map<string, { label: string; subtitle?: string; rows: ChannelCandidateRow[] }>()

  for (const candidate of candidates) {
    const row = toRow(candidate)
    const group = getGroup(candidate)
    const existing = byGroup.get(group.key)
    if (existing) {
      existing.rows.push(row)
    } else {
      byGroup.set(group.key, {
        label: group.label,
        subtitle: group.subtitle,
        rows: [row],
      })
    }
  }

  return [...byGroup.entries()]
    .map(([key, group]) => ({
      key,
      label: group.label,
      subtitle: group.subtitle,
      metrics: computeChannelReportMetrics(group.rows),
      quarters: buildQuarterBuckets(group.rows),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function channelReportSearchFields(
  candidate: ChannelCandidateRow,
  extra?: (string | undefined | null)[]
): (string | undefined | null)[] {
  return [
    candidate.name,
    candidate.email,
    candidate.jobTitle,
    candidate.jobCode,
    candidate.status,
    ...(extra ?? []),
  ]
}

export function filterCandidatesForChannelReport(
  candidates: Candidate[],
  query: string,
  extraSearchFields?: (candidate: Candidate) => (string | undefined | null)[]
): Candidate[] {
  const q = query.trim()
  if (!q) return candidates
  return candidates.filter((c) =>
    matchesAnySearch(
      channelReportSearchFields(toRow(c), extraSearchFields?.(c)),
      q
    )
  )
}

export function computeChannelReportTotals(
  buckets: ChannelGroupBucket[],
  candidates?: Candidate[]
) {
  const fromBuckets = buckets.reduce(
    (acc, row) => ({
      candidateCount: acc.candidateCount + row.metrics.candidateCount,
      activeCount: acc.activeCount + row.metrics.activeCount,
    }),
    { candidateCount: 0, activeCount: 0 }
  )

  const jobCount = candidates
    ? new Set(candidates.map((c) => c.requirementId).filter(Boolean)).size
    : buckets.reduce((sum, row) => sum + row.metrics.jobCount, 0)

  return { ...fromBuckets, jobCount, groupCount: buckets.length }
}
