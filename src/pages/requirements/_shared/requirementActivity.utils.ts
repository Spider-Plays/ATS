import type { ActivityLog } from '@/types'
import { HIRING_STAGES } from '@/lib/requirementHiring'

export const REQUIREMENT_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Requirement created',
  UPDATED: 'Requirement updated',
  STATUS_CHANGED: 'Status changed',
  HIRING_STAGE_CHANGED: 'Hiring stage changed',
  CANCELLED: 'Requirement cancelled',
  APPROVED: 'Requirement approved',
  REJECTED: 'Requirement rejected',
  RECRUITER_ASSIGNED: 'Recruiter assigned',
  RECRUITER_UNASSIGNED: 'Recruiter unassigned',
  PORTAL_SHOWN: 'Shown on candidate portal',
  PORTAL_HIDDEN: 'Hidden from candidate portal',
  VISIBLE_ON_PORTAL: 'Shown on candidate portal',
  HIDDEN_FROM_PORTAL: 'Hidden from candidate portal',
  REFERRAL_PORTAL_SHOWN: 'Shown on referral portal',
  REFERRAL_PORTAL_HIDDEN: 'Hidden from referral portal',
  INTERVIEW_PLAN_UPDATED: 'Interview plan updated',
  ON_HOLD: 'Put on hold',
  RESUMED: 'Resumed from hold',
}

function hiringStageLabel(stage: string): string {
  const match = HIRING_STAGES.find((s) => s.value === stage)
  return match?.label ?? stage.replace(/_/g, ' ')
}

export function formatRequirementActivityDetail(log: ActivityLog): string | null {
  const d = log.details
  if (!d || typeof d !== 'object') return null

  const parts: string[] = []
  if ('title' in d && d.title) parts.push(String(d.title))
  if ('status' in d && d.status) parts.push(`Status: ${String(d.status)}`)
  if ('hiringStage' in d && d.hiringStage) {
    parts.push(`Stage: ${hiringStageLabel(String(d.hiringStage))}`)
  }
  if ('recruiterName' in d && d.recruiterName) {
    parts.push(`Recruiter: ${String(d.recruiterName)}`)
  }
  if ('closureReason' in d && d.closureReason) {
    parts.push(String(d.closureReason))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}
