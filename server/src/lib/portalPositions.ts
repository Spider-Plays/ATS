import { deserializeSkills } from './skills.js'

export function portalRequirementVisible(
  requirement: { status: string; visibleToCandidates: boolean } | null
) {
  if (!requirement) return false
  return requirement.status === 'LIVE' && requirement.visibleToCandidates
}

export function portalPositionsWhere() {
  /** Same filter for authenticated portal and public /careers listings. */
  return { status: 'LIVE' as const, visibleToCandidates: true }
}

export function mapPortalPosition(r: {
  id: string
  jobCode: string | null
  client: string | null
  title: string
  department: string
  location: string | null
  locationCity?: string | null
  isRemote?: boolean
  workMode?: string | null
  employmentType?: string | null
  seniorityLevel?: string | null
  experienceMinYears?: number | null
  experienceMaxYears?: number | null
  salaryBand?: string | null
  priority: string | null
  openings: number
  filled: number
  description: string | null
  jobDescription?: string | null
  primarySkills?: string | null
  secondarySkills?: string | null
  updatedAt: Date
}) {
  const primarySkills = deserializeSkills(r.primarySkills)
  const secondarySkills = deserializeSkills(r.secondarySkills)
  const jobDescription = r.jobDescription?.trim() || undefined
  const description = r.description?.trim() || undefined

  return {
    id: r.id,
    jobCode: r.jobCode ?? r.id.slice(-8).toUpperCase(),
    client: r.client ?? undefined,
    title: r.title,
    department: r.department,
    location: r.location ?? undefined,
    locationCity: r.locationCity?.trim() || undefined,
    isRemote: r.isRemote === true,
    workMode: r.workMode ?? undefined,
    employmentType: r.employmentType ?? undefined,
    seniorityLevel: r.seniorityLevel ?? undefined,
    experienceMinYears: r.experienceMinYears ?? undefined,
    experienceMaxYears: r.experienceMaxYears ?? undefined,
    salaryBand: r.salaryBand?.trim() || undefined,
    priority: r.priority ?? undefined,
    openings: r.openings,
    filled: r.filled,
    description,
    jobDescription,
    primarySkills: primarySkills.length > 0 ? primarySkills : undefined,
    secondarySkills: secondarySkills.length > 0 ? secondarySkills : undefined,
    updatedAt: r.updatedAt.toISOString(),
  }
}

/** Public careers listings must not expose client names. */
export function mapPublicCareersPosition(
  r: Parameters<typeof mapPortalPosition>[0]
) {
  const { client: _client, ...position } = mapPortalPosition(r)
  return position
}
