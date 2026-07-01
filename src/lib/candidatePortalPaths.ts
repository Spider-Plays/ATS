/** Base path for the candidate-facing portal (login, dashboard, jobs, etc.). */
export const CANDIDATE_PORTAL = '/candidate' as const

export function isCandidatePortalPath(pathname: string): boolean {
  return pathname === CANDIDATE_PORTAL || pathname.startsWith(`${CANDIDATE_PORTAL}/`)
}

/** Accept /candidate/* and legacy /portal/* return targets; always normalize to /candidate. */
export function normalizeCandidatePortalReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (raw.includes('://') || raw.startsWith('//')) return null

  let path = raw
  if (path.startsWith('/portal/') || path === '/portal') {
    path = path === '/portal' ? CANDIDATE_PORTAL : `${CANDIDATE_PORTAL}${path.slice('/portal'.length)}`
  }
  if (!path.startsWith(`${CANDIDATE_PORTAL}/`) && path !== CANDIDATE_PORTAL) return null
  return path
}
