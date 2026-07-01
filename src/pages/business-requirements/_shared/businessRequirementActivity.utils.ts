import type { ActivityLog, BusinessRequirementStageHistoryEntry } from '@/types'
import { businessStageLabel } from '@/lib/businessStages'

export const BUSINESS_REQUIREMENT_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Requirement created',
  UPDATED: 'Requirement updated',
  STAGE_CHANGED: 'Stage updated',
  SOW_SIGNED: 'Reached SOW Signed',
  OPENED_TO_HIRING: 'Opened to hiring',
  CANCELLED: 'Requirement cancelled',
}

const STAGE_ACTIVITY_ACTIONS = new Set(['STAGE_CHANGED', 'SOW_SIGNED'])

export function getBusinessRequirementActivityMeta(log: ActivityLog): string | null {
  const d = log.details
  if (!d || typeof d !== 'object') return null
  const title = 'title' in d && d.title ? String(d.title) : null
  const stage = 'stage' in d && d.stage ? businessStageLabel(String(d.stage)) : null
  const parts = [title, stage].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function getBusinessRequirementActivityDescription(log: ActivityLog): string | null {
  const d = log.details
  if (!d || typeof d !== 'object') return null
  if ('description' in d && typeof d.description === 'string') {
    const trimmed = d.description.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

function findStageNoteInHistory(
  log: ActivityLog,
  stageHistory?: BusinessRequirementStageHistoryEntry[]
): string | null {
  if (!stageHistory?.length || !STAGE_ACTIVITY_ACTIONS.has(log.action)) return null

  const d = log.details
  const stage =
    d && typeof d === 'object' && 'stage' in d && typeof d.stage === 'string' ? d.stage : null
  if (!stage) return null

  const logTime = new Date(log.timestamp).getTime()
  let best: { note: string; diff: number } | null = null

  for (const entry of stageHistory) {
    if (entry.stage !== stage || entry.by !== log.performedBy) continue
    const note = entry.description?.trim()
    if (!note) continue
    const diff = Math.abs(new Date(entry.at).getTime() - logTime)
    if (diff > 120_000) continue
    if (!best || diff < best.diff) best = { note, diff }
  }

  if (best) return best.note

  for (let i = stageHistory.length - 1; i >= 0; i--) {
    const entry = stageHistory[i]
    if (entry.stage === stage && entry.by === log.performedBy && entry.description?.trim()) {
      return entry.description.trim()
    }
  }

  return null
}

export function resolveBusinessRequirementActivityDescription(
  log: ActivityLog,
  stageHistory?: BusinessRequirementStageHistoryEntry[]
): string | null {
  if (log.action === 'UPDATED') return null
  return getBusinessRequirementActivityDescription(log) ?? findStageNoteInHistory(log, stageHistory)
}

export type BusinessRequirementFieldChange = {
  field: string
  label: string
  from: string
  to: string
}

export function getBusinessRequirementUpdateChanges(log: ActivityLog): BusinessRequirementFieldChange[] {
  if (log.action !== 'UPDATED') return []
  const d = log.details
  if (!d || typeof d !== 'object' || !('changes' in d) || !Array.isArray(d.changes)) {
    return []
  }
  return (d.changes as unknown[])
    .filter(
      (c): c is BusinessRequirementFieldChange =>
        !!c &&
        typeof c === 'object' &&
        'field' in c &&
        'label' in c &&
        'from' in c &&
        'to' in c &&
        typeof (c as BusinessRequirementFieldChange).field === 'string' &&
        typeof (c as BusinessRequirementFieldChange).label === 'string' &&
        typeof (c as BusinessRequirementFieldChange).from === 'string' &&
        typeof (c as BusinessRequirementFieldChange).to === 'string'
    )
    .map((c) => ({
      field: c.field,
      label: c.label,
      from: c.from,
      to: c.to,
    }))
}

export function getBusinessRequirementActivityPreview(
  log: ActivityLog,
  stageHistory?: BusinessRequirementStageHistoryEntry[]
): string {
  const fieldChanges = getBusinessRequirementUpdateChanges(log)
  if (fieldChanges.length === 1) {
    const c = fieldChanges[0]
    return `${c.label}: ${c.from} → ${c.to}`
  }
  if (fieldChanges.length > 1) {
    const names = fieldChanges.map((c) => c.label).join(', ')
    return `${fieldChanges.length} fields updated — ${names}`
  }

  const description = resolveBusinessRequirementActivityDescription(log, stageHistory)
  if (description) return description

  const meta = getBusinessRequirementActivityMeta(log)
  if (meta) return meta

  return 'Tap to view details'
}

export function businessRequirementActivityHasDetails(
  log: ActivityLog,
  stageHistory?: BusinessRequirementStageHistoryEntry[]
): boolean {
  return (
    getBusinessRequirementUpdateChanges(log).length > 0 ||
    !!resolveBusinessRequirementActivityDescription(log, stageHistory) ||
    !!getBusinessRequirementActivityMeta(log)
  )
}

/** @deprecated Use getBusinessRequirementActivityMeta + getBusinessRequirementActivityDescription */
export function formatBusinessRequirementActivityDetail(log: ActivityLog): string | null {
  const meta = getBusinessRequirementActivityMeta(log)
  const description = getBusinessRequirementActivityDescription(log)
  const parts = [meta, description].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}
