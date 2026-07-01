import type { CandidateStatus } from '../types'
import type { PortalData } from '../services/http/portal'
import { CANDIDATE_PORTAL } from './candidatePortalPaths'

export const PORTAL_PIPELINE_STEPS: {
  status: CandidateStatus
  label: string
  description: string
}[] = [
  { status: 'SUBMITTED', label: 'Submitted', description: 'Application submitted for review' },
  { status: 'SCREENING', label: 'Screening', description: 'Profile under review' },
  { status: 'SHORTLISTED', label: 'Shortlisted', description: 'Selected for next steps' },
  { status: 'INTERVIEW', label: 'Interview', description: 'Interview rounds in progress' },
  { status: 'OFFER', label: 'Offer', description: 'Offer stage' },
  { status: 'HIRED', label: 'Hired', description: 'Welcome aboard' },
]

const TERMINAL_STATUSES: CandidateStatus[] = ['REJECTED', 'HIRED']

export function portalHomePath(data: PortalData | undefined): string {
  if (!data || !data.profileComplete) return `${CANDIDATE_PORTAL}/onboarding`
  return `${CANDIDATE_PORTAL}/dashboard`
}

export function pipelineStepIndex(status: CandidateStatus): number {
  if (status === 'REJECTED') return -1
  if (status === 'ADDED') return 0
  const idx = PORTAL_PIPELINE_STEPS.findIndex((s) => s.status === status)
  return idx >= 0 ? idx : 0
}

export function pipelineProgressPercent(status: CandidateStatus): number {
  if (status === 'REJECTED') return 0
  if (status === 'HIRED') return 100
  if (status === 'ADDED') return 0
  const idx = pipelineStepIndex(status)
  const max = PORTAL_PIPELINE_STEPS.length - 1
  return Math.round((idx / max) * 100)
}

export function statusDisplayLabel(status: CandidateStatus): string {
  if (status === 'REJECTED') return 'Not selected'
  if (status === 'ADDED') return 'Profile added'
  const step = PORTAL_PIPELINE_STEPS.find((s) => s.status === status)
  return step?.label ?? status.replace('_', ' ')
}

export function isTerminalStatus(status: CandidateStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}
