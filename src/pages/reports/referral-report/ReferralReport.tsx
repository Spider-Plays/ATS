import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, UserPlus } from 'lucide-react'
import { api } from '@/services/api'
import { CandidateChannelReportView } from '../_shared/CandidateChannelReportView'
import {
  buildChannelGroupReport,
  computeChannelReportTotals,
  filterCandidatesForChannelReport,
} from '../_shared/candidateChannelReport.utils'

const ReferralReport = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })

  const referralCandidates = useMemo(
    () => candidates.filter((c) => !!c.referredByUserId),
    [candidates]
  )

  const filtered = useMemo(
    () =>
      filterCandidatesForChannelReport(referralCandidates, searchTerm, (c) => [
        c.referredByName,
        c.referredByEmail,
        c.referredByDepartment,
        c.referredByReferralCode,
      ]),
    [referralCandidates, searchTerm]
  )

  const buckets = useMemo(
    () =>
      buildChannelGroupReport(filtered, (c) => ({
        key: c.referredByUserId ?? 'unknown',
        label: c.referredByName ?? 'Unknown referrer',
        subtitle: c.referredByDepartment ?? c.referredByReferralCode ?? undefined,
      })),
    [filtered]
  )

  const totals = useMemo(
    () => computeChannelReportTotals(buckets, filtered),
    [buckets, filtered]
  )

  return (
    <CandidateChannelReportView
      icon={BarChart3}
      title="Employee referral report"
      description="Expand a referrer to see quarters, months, and jobs. Review every profile submitted through the employee referral program."
      groupColumnLabel="Referrer / period / job"
      groupIcon={UserPlus}
      groupLabel="Referrers"
      buckets={buckets}
      totals={totals}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by referrer, department, candidate, job, or email..."
      emptyTitle="No referral submissions"
      emptyDescription="Profiles submitted through the employee referral program will appear here."
      noMatchDescription="Try a different referrer name, department, candidate, or job."
      helpText="Grouped by referring employee, then submission period."
      footerLink={{ to: '/features/employee-referral', label: 'View referral candidates' }}
    />
  )
}

export default ReferralReport
