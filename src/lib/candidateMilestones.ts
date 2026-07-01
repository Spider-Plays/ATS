/** Calendar quarter label, e.g. Q2 2026 */
export function quarterFromDate(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1
  return `Q${q} ${date.getFullYear()}`
}

/** ISO date (yyyy-mm-dd) → yyyy-mm month value */
export function monthFromIsoDate(isoDate: string): string {
  if (!isoDate) return ''
  return isoDate.slice(0, 7)
}

/** Split yyyy-mm into year and month parts for custom pickers */
export function splitMonthValue(value: string): { year: string; month: string } {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return { year: '', month: '' }
  }
  const [year, month] = value.split('-')
  return { year, month }
}

/** Combine year and month into yyyy-mm */
export function joinMonthValue(year: string, month: string): string {
  if (!year || !month) return ''
  return `${year}-${month}`
}

export function parseIsoDate(isoDate: string): Date | null {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatIsoDateDisplay(isoDate: string): string {
  const d = parseIsoDate(isoDate)
  if (!d) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function buildQuarterOptions(yearsAround = 1): { value: string; label: string }[] {
  const baseYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = baseYear - yearsAround; y <= baseYear + yearsAround; y++) {
    years.push(y)
  }
  return years.flatMap((year) =>
    ([1, 2, 3, 4] as const).map((q) => {
      const value = `Q${q} ${year}`
      return { value, label: value }
    })
  )
}

export type OfferMilestoneInput = {
  expectedCTC: string
  offerMonth: string
  offerQuarter: string
  expectedJoiningDate: string
}

export type HiredMilestoneInput = {
  joiningDate: string
  joiningMonth: string
  joiningQuarter: string
}

export type CandidateStatusMilestonePayload =
  | { status: 'OFFER'; milestone: OfferMilestoneInput }
  | { status: 'HIRED'; milestone: HiredMilestoneInput }

export function validateOfferMilestone(m: OfferMilestoneInput): string | null {
  if (!m.expectedCTC.trim()) return 'Expected CTC is required'
  if (!m.offerMonth || !/^\d{4}-\d{2}$/.test(m.offerMonth)) {
    return 'Month and year of offer are required'
  }
  if (!m.offerQuarter) return 'Quarter of offer is required'
  if (!m.expectedJoiningDate) return 'Expected joining date is required'
  return null
}

export function validateHiredMilestone(m: HiredMilestoneInput): string | null {
  if (!m.joiningDate) return 'Date of joining is required'
  if (!m.joiningMonth || !/^\d{4}-\d{2}$/.test(m.joiningMonth)) {
    return 'Month and year of joining are required'
  }
  if (!m.joiningQuarter) return 'Quarter of joining is required'
  return null
}

export function formatMilestoneDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function hasOfferMilestone(candidate: {
  offerMonth?: string | null
  offerQuarter?: string | null
  expectedJoiningDate?: string | null
}): boolean {
  return !!(
    candidate.offerMonth ||
    candidate.offerQuarter ||
    candidate.expectedJoiningDate
  )
}

export function hasJoiningMilestone(candidate: {
  joiningDate?: string | null
  joiningMonth?: string | null
  joiningQuarter?: string | null
}): boolean {
  return !!(
    candidate.joiningDate ||
    candidate.joiningMonth ||
    candidate.joiningQuarter
  )
}
