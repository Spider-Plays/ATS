import type { BusinessRequirement } from '@prisma/client'
import { prisma } from './prisma.js'

const FIELD_LABELS: Record<string, string> = {
  title: 'Job title',
  department: 'Department',
  accountManager: 'Account manager',
  hiringManager: 'Hiring manager',
  client: 'Client',
  openings: 'Openings',
  priority: 'Priority',
  location: 'Location',
  locationCity: 'City',
  workMode: 'Work mode',
  isRemote: 'Remote',
  employmentType: 'Employment type',
  seniorityLevel: 'Seniority',
  experienceMinYears: 'Min experience (years)',
  experienceMaxYears: 'Max experience (years)',
  salaryBand: 'Salary band',
  targetStartDate: 'Target start',
  hiringDeadline: 'Hiring deadline',
  jobDescription: 'Job description',
  description: 'Summary',
  primarySkills: 'Primary skills',
  secondarySkills: 'Secondary skills',
}

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
}

const SENIORITY_LABELS: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  PRINCIPAL: 'Principal',
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export type BusinessRequirementFieldChange = {
  field: string
  label: string
  from: string
  to: string
}

function parseSkillNames(raw: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function formatDateValue(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

function formatScalar(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key === 'workMode' && typeof value === 'string') {
    return WORK_MODE_LABELS[value] ?? value
  }
  if (key === 'employmentType' && typeof value === 'string') {
    return EMPLOYMENT_LABELS[value] ?? value
  }
  if (key === 'seniorityLevel' && typeof value === 'string') {
    return SENIORITY_LABELS[value] ?? value
  }
  if (key === 'priority' && typeof value === 'string') {
    return PRIORITY_LABELS[value] ?? value
  }
  if (key === 'targetStartDate' || key === 'hiringDeadline') {
    return formatDateValue(value as Date | string)
  }
  if (typeof value === 'string' && value.length > 120) {
    return `${value.slice(0, 120)}…`
  }
  return String(value)
}

function readExistingValue(row: BusinessRequirement, key: string): unknown {
  switch (key) {
    case 'primarySkills':
    case 'secondarySkills':
      return parseSkillNames(row[key]).join(', ')
    case 'targetStartDate':
      return row.targetStartDate
    case 'hiringDeadline':
      return row.hiringDeadline
    default:
      return (row as Record<string, unknown>)[key]
  }
}

function readPatchValue(key: string, value: unknown): unknown {
  if (key === 'primarySkills' || key === 'secondarySkills') {
    if (typeof value === 'string') return parseSkillNames(value).join(', ')
    if (Array.isArray(value)) return value.filter((s) => typeof s === 'string').join(', ')
  }
  return value
}

function valuesEqual(key: string, a: unknown, b: unknown): boolean {
  const left = formatScalar(key, a)
  const right = formatScalar(key, b)
  return left === right
}

async function resolveUserNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const rows = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  })
  return new Map(rows.map((u) => [u.id, u.name]))
}

export async function diffBusinessRequirementChanges(
  existing: BusinessRequirement,
  patch: Record<string, unknown>
): Promise<BusinessRequirementFieldChange[]> {
  const userIds: string[] = []
  const changes: BusinessRequirementFieldChange[] = []

  for (const key of Object.keys(patch)) {
    if (!(key in FIELD_LABELS)) continue
    if (
      key === 'description' &&
      Object.prototype.hasOwnProperty.call(patch, 'jobDescription') &&
      valuesEqual('jobDescription', existing.jobDescription, patch.jobDescription)
    ) {
      continue
    }
    const fromRaw = readExistingValue(existing, key)
    const toRaw = readPatchValue(key, patch[key])
    if (valuesEqual(key, fromRaw, toRaw)) continue

    if (key === 'accountManager' || key === 'hiringManager') {
      if (typeof fromRaw === 'string') userIds.push(fromRaw)
      if (typeof toRaw === 'string') userIds.push(toRaw)
    }

    changes.push({
      field: key,
      label: FIELD_LABELS[key],
      from: formatScalar(key, fromRaw),
      to: formatScalar(key, toRaw),
    })
  }

  if (userIds.length > 0) {
    const names = await resolveUserNames(userIds)
    for (const change of changes) {
      if (change.field === 'accountManager' || change.field === 'hiringManager') {
        const fromId = String(readExistingValue(existing, change.field) ?? '')
        const toId = String(patch[change.field] ?? '')
        change.from = names.get(fromId) ?? change.from
        change.to = names.get(toId) ?? change.to
      }
    }
  }

  return changes
}
