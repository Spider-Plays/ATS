import type { BusinessRequirement, BusinessRequirementStatus } from '@/types'
import { businessStageLabel } from '@/lib/businessStages'

export type BusinessRequirementFilter = BusinessRequirementStatus | 'ALL'

export const BUSINESS_REQUIREMENT_FILTERS: { id: BusinessRequirementFilter; label: string }[] = [
  { id: 'ALL', label: 'All deals' },
  { id: 'ACTIVE', label: 'In progress' },
  { id: 'OPEN_TO_HIRING', label: 'Opened to hiring' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

export function businessRequirementStatusLabel(status: BusinessRequirementStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'In progress'
    case 'OPEN_TO_HIRING':
      return 'Opened to hiring'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

export function businessRequirementStatusClass(status: BusinessRequirementStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-primary/10 text-primary dark:text-white border-primary/15 dark:border-white/10'
    case 'OPEN_TO_HIRING':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/30'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200/80 dark:border-red-500/30'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60 border-slate-200/80 dark:border-white/10'
  }
}

export function businessRequirementStats(requirements: BusinessRequirement[]) {
  return {
    total: requirements.length,
    active: requirements.filter((r) => r.status === 'ACTIVE').length,
    openToHiring: requirements.filter((r) => r.status === 'OPEN_TO_HIRING').length,
    confirmed: requirements.filter((r) => r.status === 'ACTIVE' && r.businessStage === 'CONFIRMED')
      .length,
    cancelled: requirements.filter((r) => r.status === 'CANCELLED').length,
  }
}

export function filterBusinessRequirements(
  requirements: BusinessRequirement[],
  filter: BusinessRequirementFilter
) {
  if (filter === 'ALL') return requirements
  return requirements.filter((r) => r.status === filter)
}

export function sortBusinessRequirements(requirements: BusinessRequirement[]) {
  const order: Partial<Record<BusinessRequirementStatus, number>> = {
    ACTIVE: 0,
    OPEN_TO_HIRING: 1,
    CANCELLED: 2,
  }
  return [...requirements].sort((a, b) => {
    const statusDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9)
    if (statusDiff !== 0) return statusDiff
    return b.stagePercentage - a.stagePercentage
  })
}

export function businessRequirementSearchFields(req: BusinessRequirement): string[] {
  return [
    req.title,
    req.client ?? '',
    req.department,
    businessStageLabel(req.businessStage),
    req.status,
  ]
}
