import { format, getQuarter, getYear } from 'date-fns'
import type { Requirement, RequirementHiringStage } from '@/types'
import { HIRING_STAGES, hiringStageLabel, isTerminalPostingStatus } from '@/lib/requirementHiring'
import { matchesAnySearch } from '@/lib/textSearch'

export type StageBreakdown = {
  stage: RequirementHiringStage
  label: string
  jobCount: number
}

export type ReportMetrics = {
  totalPositions: number
  openPositions: number
  jobCount: number
  stages: StageBreakdown[]
}

export type MonthBucket = {
  key: string
  label: string
  metrics: ReportMetrics
  requirements: Requirement[]
}

export type QuarterBucket = {
  key: string
  label: string
  metrics: ReportMetrics
  months: MonthBucket[]
}

export type AccountBucket = {
  client: string
  metrics: ReportMetrics
  quarters: QuarterBucket[]
}

export function openSlots(requirement: Requirement): number {
  if (isTerminalPostingStatus(requirement.status)) return 0
  return Math.max(0, requirement.openings - requirement.filled)
}

export function computeReportMetrics(requirements: Requirement[]): ReportMetrics {
  const stageMap = new Map<RequirementHiringStage, number>()
  for (const stage of HIRING_STAGES) {
    stageMap.set(stage.value, 0)
  }

  let totalPositions = 0
  let openPositions = 0

  for (const req of requirements) {
    totalPositions += req.openings
    openPositions += openSlots(req)

    const stage = req.hiringStage ?? 'SOURCING'
    stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1)
  }

  const stages: StageBreakdown[] = HIRING_STAGES.map(({ value }) => ({
    stage: value,
    label: hiringStageLabel(value),
    jobCount: stageMap.get(value) ?? 0,
  })).filter((s) => s.jobCount > 0)

  return {
    totalPositions,
    openPositions,
    jobCount: requirements.length,
    stages,
  }
}

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

function quarterKey(date: Date): string {
  return `${getYear(date)}-Q${getQuarter(date)}`
}

function quarterLabel(key: string): string {
  const [yearPart, quarterPart] = key.split('-Q')
  return `Q${quarterPart} ${yearPart}`
}

function sortByKeyDesc<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.key.localeCompare(a.key))
}

function buildMonthBuckets(requirements: Requirement[]): MonthBucket[] {
  const byMonth = new Map<string, Requirement[]>()
  for (const req of requirements) {
    const key = monthKey(new Date(req.createdAt))
    const list = byMonth.get(key) ?? []
    list.push(req)
    byMonth.set(key, list)
  }

  return sortByKeyDesc(
    [...byMonth.entries()].map(([key, reqs]) => ({
      key,
      label: monthLabel(key),
      metrics: computeReportMetrics(reqs),
      requirements: [...reqs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }))
  )
}

function buildQuarterBuckets(requirements: Requirement[]): QuarterBucket[] {
  const byQuarter = new Map<string, Requirement[]>()
  for (const req of requirements) {
    const key = quarterKey(new Date(req.createdAt))
    const list = byQuarter.get(key) ?? []
    list.push(req)
    byQuarter.set(key, list)
  }

  return sortByKeyDesc(
    [...byQuarter.entries()].map(([key, reqs]) => ({
      key,
      label: quarterLabel(key),
      metrics: computeReportMetrics(reqs),
      months: buildMonthBuckets(reqs),
    }))
  )
}

export function buildAccountReport(requirements: Requirement[]): AccountBucket[] {
  const byClient = new Map<string, Requirement[]>()
  for (const req of requirements) {
    const client = req.client?.trim() || 'Unassigned client'
    const list = byClient.get(client) ?? []
    list.push(req)
    byClient.set(client, list)
  }

  return [...byClient.entries()]
    .map(([client, reqs]) => ({
      client,
      metrics: computeReportMetrics(reqs),
      quarters: buildQuarterBuckets(reqs),
    }))
    .sort((a, b) => a.client.localeCompare(b.client))
}

export function reportSearchFields(req: Requirement): (string | undefined | null)[] {
  return [
    req.client,
    req.title,
    req.department,
    req.jobCode,
    req.status,
    req.hiringStage,
    hiringStageLabel(req.hiringStage),
    req.status?.replace(/_/g, ' '),
    req.hiringStage?.replace(/_/g, ' '),
  ]
}

export function filterRequirementsForReport(
  requirements: Requirement[],
  query: string
): Requirement[] {
  const q = query.trim()
  if (!q) return requirements
  return requirements.filter((req) => matchesAnySearch(reportSearchFields(req), q))
}
