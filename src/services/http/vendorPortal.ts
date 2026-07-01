import { apiRequest, fetchApiBlob, uploadFormData } from '../../lib/apiClient'
import type { Candidate, Vendor } from '../../types'
import type { CandidateEmailCheck, ParsedResumeFields } from './candidates'

export type VendorPortalPosition = {
  id: string
  jobCode: string
  client?: string
  title: string
  department: string
  location?: string
  locationCity?: string
  isRemote?: boolean
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE'
  employmentType?: string
  seniorityLevel?: string
  experienceMinYears?: number
  experienceMaxYears?: number
  salaryBand?: string
  priority?: string
  openings: number
  filled: number
  description?: string
  jobDescription?: string
  primarySkills?: string[]
  secondarySkills?: string[]
  updatedAt: string
}

export type VendorPortalMe = {
  user: { name: string; email: string; uid: string }
  vendor: Vendor
  stats: {
    assignedJobs: number
    totalSubmissions: number
    statusBreakdown: { status: string; count: number }[]
  }
  recentSubmissions: {
    id: string
    name: string
    email: string
    status: string
    jobTitle?: string | null
    jobCode?: string | null
    createdAt: string
  }[]
}

export type VendorSubmitPayload = {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  pan: string
  totalExperience: string
  currentCompany: string
  currentCTC: string
  expectedCTC: string
  noticePeriod: string
  linkedIn?: string
  portfolio?: string
  primarySkills: string[]
  secondarySkills?: string[]
}

export const vendorPortalService = {
  getMe: () => apiRequest<VendorPortalMe>('/vendor-portal/me'),
  getPositions: () => apiRequest<VendorPortalPosition[]>('/vendor-portal/positions'),
  getPosition: (id: string) => apiRequest<VendorPortalPosition>(`/vendor-portal/positions/${id}`),
  getSubmissions: () => apiRequest<Candidate[]>('/vendor-portal/submissions'),
  getSubmission: (candidateId: string) =>
    apiRequest<Candidate>(`/vendor-portal/submissions/${candidateId}`),

  parseResume: (file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<{ fields: ParsedResumeFields }>(
      '/vendor-portal/parse-resume',
      formData
    )
  },

  checkEmail: (email: string, excludeId?: string) => {
    const params = new URLSearchParams({ email: email.trim() })
    if (excludeId) params.set('excludeId', excludeId)
    return apiRequest<CandidateEmailCheck>(`/vendor-portal/check-email?${params}`)
  },

  submitCandidate: (requirementId: string, data: VendorSubmitPayload) =>
    apiRequest<Candidate>(`/vendor-portal/positions/${requirementId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSubmission: (candidateId: string, data: VendorSubmitPayload) =>
    apiRequest<Candidate>(`/vendor-portal/submissions/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadResume: (candidateId: string, file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return uploadFormData<Candidate>(`/vendor-portal/submissions/${candidateId}/resume`, formData)
  },

  fetchSubmissionResume: (candidateId: string) =>
    fetchApiBlob(`/vendor-portal/submissions/${candidateId}/resume`),
}
