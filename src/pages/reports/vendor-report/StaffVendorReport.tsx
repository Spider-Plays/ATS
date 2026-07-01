import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { StaffVendorReportView } from './StaffVendorReportView'
import {
  buildStaffVendorReport,
  computeStaffVendorReportTotals,
  filterCandidatesForStaffVendorReport,
} from './staffVendorReport.utils'

const StaffVendorReport = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: api.candidates.list,
  })

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: api.vendors.list,
  })

  const vendorNameById = useMemo(
    () => new Map(vendors.map((v) => [v.id, v.name])),
    [vendors]
  )

  const vendorCandidates = useMemo(
    () => candidates.filter((c) => !!c.vendorId),
    [candidates]
  )

  const filtered = useMemo(
    () =>
      filterCandidatesForStaffVendorReport(
        vendorCandidates,
        searchTerm,
        vendorNameById
      ),
    [vendorCandidates, searchTerm, vendorNameById]
  )

  const buckets = useMemo(
    () => buildStaffVendorReport(filtered, vendorNameById),
    [filtered, vendorNameById]
  )

  const totals = useMemo(
    () => computeStaffVendorReportTotals(buckets, filtered),
    [buckets, filtered]
  )

  return (
    <StaffVendorReportView
      buckets={buckets}
      totals={totals}
      isLoading={candidatesLoading || vendorsLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
    />
  )
}

export default StaffVendorReport
