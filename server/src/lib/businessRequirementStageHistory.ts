export type StageHistoryRow = {
  stage: string
  percentage?: number
  by: string
  at: string
  role?: string
  description?: string
}

export function parseBusinessStageHistory(raw: string | null | undefined): StageHistoryRow[] {
  try {
    const arr = JSON.parse(raw || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const STAGE_ACTIVITY_ACTIONS = new Set(['STAGE_CHANGED', 'SOW_SIGNED'])

/** Resolve stage-change note from history when older activity rows lack `details.description`. */
export function findStageChangeNoteFromHistory(
  history: StageHistoryRow[],
  opts: {
    action: string
    stage?: string
    performedBy: string
    timestamp: Date
  }
): string | undefined {
  if (!STAGE_ACTIVITY_ACTIONS.has(opts.action) || !opts.stage) return undefined

  const logTime = opts.timestamp.getTime()
  let best: { note: string; diff: number } | undefined

  for (const entry of history) {
    if (entry.stage !== opts.stage || entry.by !== opts.performedBy) continue
    const note = typeof entry.description === 'string' ? entry.description.trim() : ''
    if (!note) continue
    const diff = Math.abs(new Date(entry.at).getTime() - logTime)
    if (diff > 120_000) continue
    if (!best || diff < best.diff) best = { note, diff }
  }

  if (best) return best.note

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i]
    if (entry.stage !== opts.stage || entry.by !== opts.performedBy) continue
    const note = typeof entry.description === 'string' ? entry.description.trim() : ''
    if (note) return note
  }

  return undefined
}

export function enrichBusinessRequirementActivityLogDetails(
  log: {
    action: string
    performedBy: string
    timestamp: Date
    details: string | null
  },
  history: StageHistoryRow[]
): Record<string, unknown> | undefined {
  let details: Record<string, unknown> | undefined
  if (log.details) {
    try {
      const parsed = JSON.parse(log.details)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        details = parsed as Record<string, unknown>
      }
    } catch {
      details = undefined
    }
  }

  const stage = typeof details?.stage === 'string' ? details.stage : undefined
  const existing =
    typeof details?.description === 'string' ? details.description.trim() : ''
  if (existing) return details

  const note = findStageChangeNoteFromHistory(history, {
    action: log.action,
    stage,
    performedBy: log.performedBy,
    timestamp: log.timestamp,
  })
  if (!note) return details

  return { ...(details ?? { stage }), description: note }
}
