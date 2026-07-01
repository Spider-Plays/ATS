import { CANDIDATE_PORTAL, normalizeCandidatePortalReturnTo } from './candidatePortalPaths'

/** Safe in-app redirect target for candidate portal flows (prevents open redirects). */
export function sanitizePortalReturnTo(raw: string | null | undefined): string | null {
  return normalizeCandidatePortalReturnTo(raw)
}

export function portalReturnToFromSearch(search: string): string | null {
  return sanitizePortalReturnTo(new URLSearchParams(search).get('returnTo'))
}

export function portalAuthPath(
  base: `${typeof CANDIDATE_PORTAL}/login` | `${typeof CANDIDATE_PORTAL}/signup`,
  returnTo: string | null | undefined
): string {
  const safe = sanitizePortalReturnTo(returnTo)
  if (!safe) return base
  return `${base}?returnTo=${encodeURIComponent(safe)}`
}
