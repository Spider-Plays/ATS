import type { Candidate } from '@/types'
import type { VendorSubmitPayload } from '@/services/http/vendorPortal'

export function splitCandidateName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export function candidateToVendorForm(candidate: Candidate): VendorSubmitPayload {
  const { firstName, lastName } = splitCandidateName(candidate.name)
  return {
    firstName,
    lastName,
    email: candidate.email,
    phone: candidate.phone ?? '',
    location: candidate.location ?? '',
    pan: candidate.pan ?? '',
    totalExperience: candidate.totalExperience ?? '',
    currentCompany: candidate.currentCompany ?? '',
    currentCTC: candidate.currentCTC ?? '',
    expectedCTC: candidate.expectedCTC ?? '',
    noticePeriod: candidate.noticePeriod ?? '',
    linkedIn: candidate.linkedIn ?? '',
    portfolio: candidate.portfolio ?? '',
    primarySkills: candidate.primarySkills ?? [],
    secondarySkills: candidate.secondarySkills ?? [],
  }
}
