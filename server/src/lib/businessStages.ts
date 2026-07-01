export const BUSINESS_STAGES = [
  { key: 'INITIAL_DISCUSSION', label: 'Initial Discussion', percentage: 10 },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', percentage: 25 },
  { key: 'NEGOTIATION', label: 'Negotiation', percentage: 50 },
  { key: 'SOW_SIGNED', label: 'SOW Signed', percentage: 75 },
  { key: 'CONFIRMED', label: 'Confirmed', percentage: 100 },
] as const

export type BusinessStageKey = (typeof BUSINESS_STAGES)[number]['key']

export const BUSINESS_STAGE_KEYS = BUSINESS_STAGES.map((s) => s.key) as BusinessStageKey[]

export function isBusinessStageKey(value: string): value is BusinessStageKey {
  return (BUSINESS_STAGE_KEYS as readonly string[]).includes(value)
}

export function businessStagePercentage(stage: string): number {
  const found = BUSINESS_STAGES.find((s) => s.key === stage)
  return found?.percentage ?? 0
}

export function businessStageLabel(stage: string): string {
  const found = BUSINESS_STAGES.find((s) => s.key === stage)
  return found?.label ?? stage.replace(/_/g, ' ')
}
