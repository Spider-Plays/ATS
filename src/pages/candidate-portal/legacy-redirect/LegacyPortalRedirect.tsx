import { Navigate, useLocation } from 'react-router-dom'
import { CANDIDATE_PORTAL } from '@/lib/candidatePortalPaths'

/** Redirect old /portal/* bookmarks and email links to /candidate/*. */
export function LegacyPortalRedirect() {
  const location = useLocation()
  const target =
    location.pathname === '/portal'
      ? CANDIDATE_PORTAL
      : `${CANDIDATE_PORTAL}${location.pathname.slice('/portal'.length)}`
  return <Navigate to={`${target}${location.search}`} replace />
}
