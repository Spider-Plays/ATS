import type { CandidateStatus } from '@/types'

const REFERRAL_STATUS_LABELS: Record<string, string> = {
  ADDED: 'Added to pool',
  SUBMITTED: 'Submitted',
  SCREENING: 'Under review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer stage',
  TO_BE_OFFERED: 'Offer pending',
  OFFERED: 'Offer extended',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
}

export function referralStatusLabel(status: string): string {
  return REFERRAL_STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
}

export function referralStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ADDED':
    case 'SUBMITTED':
      return 'bg-slate-50 text-slate-700 border-slate-200'
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'INTERVIEW':
    case 'SHORTLISTED':
      return 'bg-violet-50 text-violet-800 border-violet-200'
    case 'OFFER':
    case 'TO_BE_OFFERED':
    case 'OFFERED':
      return 'bg-blue-50 text-blue-800 border-blue-200'
    case 'HIRED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function matchesReferralStatusSearch(status: CandidateStatus | string, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    status.toLowerCase().includes(normalized) ||
    referralStatusLabel(status).toLowerCase().includes(normalized)
  )
}
