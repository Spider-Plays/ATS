import type { Candidate, CandidateStatus } from '@/types'
import {
  CANDIDATE_STAGE_ORDER,
  candidateStatusLabel,
} from '@/pages/candidates/_shared/candidate.utils'
import { matchesAnySearch } from '@/lib/textSearch'
import {
  type ChannelCandidateRow,
  type ChannelReportMetrics,
  computeChannelReportMetrics,
  channelReportSearchFields,
} from '../_shared/candidateChannelReport.utils'

export type StaffVendorStatusBucket = {
  status: CandidateStatus
  label: string
  metrics: ChannelReportMetrics
  candidates: ChannelCandidateRow[]
}

export type StaffVendorGroupBucket = {
  key: string
  label: string
  metrics: ChannelReportMetrics
  statuses: StaffVendorStatusBucket[]
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

function buildStatusBuckets(candidates: Candidate[]): StaffVendorStatusBucket[] {
  const rows = candidates.map(toRow)
  const byStatus = new Map<CandidateStatus, ChannelCandidateRow[]>()

  for (const status of CANDIDATE_STAGE_ORDER) {
    byStatus.set(status, [])
  }

  for (const row of rows) {
    const list = byStatus.get(row.status) ?? []
    list.push(row)
    byStatus.set(row.status, list)
  }

  return CANDIDATE_STAGE_ORDER.map((status) => {
    const statusRows = byStatus.get(status) ?? []
    return {
      status,
      label: candidateStatusLabel(status),
      metrics: computeChannelReportMetrics(statusRows),
      candidates: [...statusRows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }
  }).filter((bucket) => bucket.metrics.candidateCount > 0)
}

export function buildStaffVendorReport(
  candidates: Candidate[],
  vendorNameById: Map<string, string>
): StaffVendorGroupBucket[] {
  const byVendor = new Map<string, Candidate[]>()

  for (const candidate of candidates) {
    const key = candidate.vendorId ?? 'unknown'
    const list = byVendor.get(key) ?? []
    list.push(candidate)
    byVendor.set(key, list)
  }

  return [...byVendor.entries()]
    .map(([key, vendorCandidates]) => {
      const rows = vendorCandidates.map(toRow)
      return {
        key,
        label: vendorNameById.get(key) ?? 'Unknown vendor',
        metrics: computeChannelReportMetrics(rows),
        statuses: buildStatusBuckets(vendorCandidates),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function filterCandidatesForStaffVendorReport(
  candidates: Candidate[],
  query: string,
  vendorNameById: Map<string, string>
): Candidate[] {
  const q = query.trim()
  if (!q) return candidates
  return candidates.filter((c) =>
    matchesAnySearch(
      channelReportSearchFields(toRow(c), [
        c.vendorId ? vendorNameById.get(c.vendorId) : undefined,
        candidateStatusLabel(c.status),
      ]),
      q
    )
  )
}

export function computeStaffVendorReportTotals(
  buckets: StaffVendorGroupBucket[],
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
